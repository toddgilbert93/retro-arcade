import { Chess } from 'chess.js'
import { ModelMoveError, truncateRaw } from '../players/modelErrors'
import type {
  AttemptLog,
  GameSnapshot,
  GameStatus,
  MoveContext,
  MoveErrorKind,
  Player,
  Side,
} from './types'

export interface ControllerConfig {
  /** How many extra attempts a player gets after an illegal/failed move. */
  maxRetries: number
  /** Delay between auto-played moves, in milliseconds. */
  moveDelayMs: number
}

const DEFAULT_CONFIG: ControllerConfig = { maxRetries: 2, moveDelayMs: 0 }

type Listener = (snapshot: GameSnapshot) => void

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Drives a game between two {@link Player}s. Owns the single source of truth
 * (a chess.js instance), generates the legal-move list in UCI, enforces the
 * move contract (retry N times, then forfeit), and emits an immutable
 * {@link GameSnapshot} to subscribers after every change.
 *
 * The loop is re-entrancy guarded by `busy`, so start()/step() are safe to call
 * at any time.
 */
export class GameController {
  private chess = new Chess()
  private white: Player
  private black: Player
  config: ControllerConfig

  private running = false
  private stepOnce = false
  private busy = false

  private lastMove?: string
  private lastReasoning?: string
  private lastMoveDurationMs?: number
  private forfeitSide: Side | null = null
  private forfeitReason?: string
  private attempts: AttemptLog[] = []
  private thinking = false

  private listeners = new Set<Listener>()

  constructor(white: Player, black: Player, config: Partial<ControllerConfig> = {}) {
    this.white = white
    this.black = black
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // --- subscription -------------------------------------------------------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    const snap = this.snapshot()
    for (const l of this.listeners) l(snap)
  }

  // --- configuration ------------------------------------------------------

  setPlayer(side: Side, player: Player): void {
    if (side === 'w') this.white = player
    else this.black = player
    this.emit()
  }

  setConfig(config: Partial<ControllerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  // --- controls -----------------------------------------------------------

  start(): void {
    if (this.isTerminal()) return
    this.running = true
    void this.drive()
  }

  pause(): void {
    this.running = false
    this.emit()
  }

  step(): void {
    if (this.isTerminal()) return
    this.stepOnce = true
    void this.drive()
  }

  reset(): void {
    this.running = false
    this.stepOnce = false
    this.chess.reset()
    this.lastMove = undefined
    this.lastReasoning = undefined
    this.lastMoveDurationMs = undefined
    this.forfeitSide = null
    this.forfeitReason = undefined
    this.attempts = []
    this.thinking = false
    this.emit()
  }

  // --- the loop -----------------------------------------------------------

  private async drive(): Promise<void> {
    if (this.busy) return
    this.busy = true
    try {
      while ((this.running || this.stepOnce) && !this.isTerminal()) {
        this.stepOnce = false
        const moved = await this.playOneMove()
        if (!moved) break
        this.emit()
        if (!this.running) break
        if (this.running && !this.isTerminal()) {
          await delay(this.config.moveDelayMs)
        }
      }
    } finally {
      this.busy = false
    }
  }

  /** Ask the side to move for a move, enforcing the contract. */
  private async playOneMove(): Promise<boolean> {
    if (this.isTerminal()) return false
    const side = this.chess.turn()
    const player = side === 'w' ? this.white : this.black
    const verbose = this.chess.moves({ verbose: true })
    const legalMoves = verbose.map((m) => m.from + m.to + (m.promotion ?? ''))
    const legalSan = verbose.map((m) => m.san)

    let lastError: string | undefined
    let lastErrorKind: MoveErrorKind | undefined
    const moveStart = Date.now()
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      const ctx: MoveContext = {
        fen: this.chess.fen(),
        pgn: this.chess.pgn(),
        turn: side,
        legalMoves,
        legalSan,
        history: this.chess.history(),
        lastMove: this.lastMove,
        check: this.chess.inCheck(),
        moveNumber: this.chess.moveNumber(),
        attempt,
        lastError,
        lastErrorKind,
      }

      this.thinking = true
      this.emit()

      let uci: string | undefined
      let reasoning: string | undefined
      try {
        const decision = await player.getMove(ctx)
        uci = decision.uci
        reasoning = decision.reasoning
      } catch (e) {
        if (e instanceof ModelMoveError) {
          lastError = e.message
          lastErrorKind = e.kind
          this.logAttempt({
            side,
            player: player.name,
            attempt,
            uci: e.uci,
            error: lastError,
            kind: e.kind,
            raw: truncateRaw(e.raw),
          })
        } else {
          lastError = `${player.name} threw: ${String(e)}`
          lastErrorKind = 'transport'
          this.logAttempt({
            side,
            player: player.name,
            attempt,
            error: lastError,
            kind: 'transport',
          })
        }
        continue
      }

      if (legalMoves.includes(uci)) {
        this.thinking = false
        this.chess.move(this.uciToMove(uci))
        this.lastMove = uci
        this.lastReasoning = reasoning
        this.lastMoveDurationMs = Date.now() - moveStart
        return true
      }

      lastError = `"${uci}" is not a legal move`
      lastErrorKind = 'illegal'
      this.logAttempt({
        side,
        player: player.name,
        attempt,
        uci,
        error: lastError,
        kind: 'illegal',
      })
    }

    this.thinking = false
    this.forfeitSide = side
    this.forfeitReason =
      `${player.name} (${side === 'w' ? 'White' : 'Black'}) failed to produce a legal ` +
      `move after ${this.config.maxRetries + 1} attempts. Last error: ${lastError}`
    this.emit()
    return false
  }

  private logAttempt(entry: AttemptLog): void {
    this.attempts.push(entry)
    this.emit()
  }

  // --- chess.js / UCI helpers --------------------------------------------

  private uciToMove(uci: string): { from: string; to: string; promotion?: string } {
    return {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    }
  }

  // --- status / snapshot --------------------------------------------------

  private isTerminal(): boolean {
    return this.forfeitSide !== null || this.chess.isGameOver()
  }

  private status(): GameStatus {
    if (this.forfeitSide !== null) return 'forfeit'
    if (this.chess.isCheckmate()) return 'checkmate'
    if (this.chess.isStalemate()) return 'stalemate'
    if (this.chess.isDraw()) return 'draw'
    if (this.running || this.thinking) return 'in-progress'
    if (this.chess.history().length > 0) return 'paused'
    return 'idle'
  }

  private snapshot(): GameSnapshot {
    const status = this.status()
    let winner: Side | null = null
    let result = '*'

    if (status === 'checkmate') {
      winner = this.chess.turn() === 'w' ? 'b' : 'w' // side to move is mated
    } else if (status === 'forfeit') {
      winner = this.forfeitSide === 'w' ? 'b' : 'w'
    }

    if (status === 'stalemate' || status === 'draw') result = '1/2-1/2'
    else if (winner === 'w') result = '1-0'
    else if (winner === 'b') result = '0-1'

    return {
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      history: this.chess.history(),
      turn: this.chess.turn(),
      status,
      winner,
      result,
      forfeitReason: this.forfeitReason,
      lastMove: this.lastMove,
      lastReasoning: this.lastReasoning,
      lastMoveDurationMs: this.lastMoveDurationMs,
      check: this.chess.inCheck(),
      moveNumber: this.chess.moveNumber(),
      attempts: this.attempts.slice(-12),
      thinking: this.thinking,
      autoplay: this.running,
      pausePending: !this.running && this.thinking,
    }
  }
}
