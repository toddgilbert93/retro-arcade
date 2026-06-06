import type { GameController } from './gameController'
import type { GameRecord, GameOutcome, MoveRecord, NdjsonEvent, PlayerMeta } from './recordingTypes'
import type { AttemptLog, GameSnapshot, Side } from './types'

function attemptKey(a: AttemptLog): string {
  return `${a.side}|${a.player}|${a.attempt}|${a.error}|${a.uci ?? ''}|${a.raw ?? ''}`
}

function cloneAttempt(a: AttemptLog): AttemptLog {
  return { ...a }
}

function newGameId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const TERMINAL: GameSnapshot['status'][] = ['checkmate', 'stalemate', 'draw', 'forfeit']

export interface GameRecorderOptions {
  /** Called when a game reaches a terminal state. */
  onComplete?: (record: GameRecord) => void
}

/**
 * Subscribes to a {@link GameController} and accumulates a structured
 * {@link GameRecord} with per-move reasoning, rejected attempts, and outcome.
 */
export class GameRecorder {
  private unsubscribe: (() => void) | null = null
  private white: PlayerMeta
  private black: PlayerMeta
  private onComplete?: (record: GameRecord) => void

  private id = newGameId()
  private startedAt = new Date().toISOString()
  private endedAt?: string
  private moves: MoveRecord[] = []
  private outcome?: GameOutcome
  private pgn = ''
  private finalFen = ''

  private lastHistoryLen = 0
  private pendingAttempts: AttemptLog[] = []
  private seenAttemptKeys = new Set<string>()
  private finalized = false

  constructor(
    private controller: GameController,
    white: PlayerMeta,
    black: PlayerMeta,
    options: GameRecorderOptions = {},
  ) {
    this.white = { ...white }
    this.black = { ...black }
    this.onComplete = options.onComplete
  }

  /** Begin recording; idempotent. */
  attach(): void {
    if (this.unsubscribe) return
    this.unsubscribe = this.controller.subscribe((snap) => this.onSnapshot(snap))
  }

  /** Stop recording without clearing accumulated data. */
  detach(): void {
    this.unsubscribe?.()
    this.unsubscribe = null
  }

  /** Clear the current record and start a fresh game id. */
  reset(white?: PlayerMeta, black?: PlayerMeta): void {
    if (white) this.white = { ...white }
    if (black) this.black = { ...black }

    this.id = newGameId()
    this.startedAt = new Date().toISOString()
    this.endedAt = undefined
    this.moves = []
    this.outcome = undefined
    this.pgn = ''
    this.finalFen = ''
    this.lastHistoryLen = 0
    this.pendingAttempts = []
    this.seenAttemptKeys.clear()
    this.finalized = false
  }

  updatePlayers(white: PlayerMeta, black: PlayerMeta): void {
    this.white = { ...white }
    this.black = { ...black }
  }

  isComplete(): boolean {
    return this.finalized
  }

  getRecord(): GameRecord {
    return {
      schemaVersion: 1,
      id: this.id,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      white: { ...this.white },
      black: { ...this.black },
      moves: this.moves.map((m) => ({
        ...m,
        rejectedAttempts: m.rejectedAttempts.map(cloneAttempt),
      })),
      outcome: this.outcome
        ? {
            ...this.outcome,
            trailingAttempts: this.outcome.trailingAttempts.map(cloneAttempt),
          }
        : undefined,
      pgn: this.pgn,
      finalFen: this.finalFen,
    }
  }

  toJSON(pretty = true): string {
    return JSON.stringify(this.getRecord(), null, pretty ? 2 : undefined)
  }

  /** One JSON object per line: game header, each move, then outcome (if finished). */
  toNdjson(): string {
    const record = this.getRecord()
    const lines: NdjsonEvent[] = []

    lines.push({
      type: 'game',
      schemaVersion: record.schemaVersion,
      id: record.id,
      startedAt: record.startedAt,
      white: record.white,
      black: record.black,
    })

    for (const move of record.moves) {
      lines.push({ type: 'move', move })
    }

    if (record.outcome && record.endedAt) {
      lines.push({
        type: 'outcome',
        outcome: record.outcome,
        endedAt: record.endedAt,
        pgn: record.pgn,
        finalFen: record.finalFen,
      })
    }

    return lines.map((e) => JSON.stringify(e)).join('\n') + (lines.length ? '\n' : '')
  }

  /** Trigger a browser download of the game record. */
  download(format: 'json' | 'ndjson' = 'json'): void {
    const body = format === 'ndjson' ? this.toNdjson() : this.toJSON()
    const ext = format === 'ndjson' ? 'ndjson' : 'json'
    const mime = format === 'ndjson' ? 'application/x-ndjson' : 'application/json'
    const blob = new Blob([body], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${this.id}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  private onSnapshot(s: GameSnapshot): void {
    this.captureAttempts(s)

    if (s.history.length > this.lastHistoryLen) {
      const san = s.history[s.history.length - 1]!
      const side: Side = s.turn === 'w' ? 'b' : 'w'
      this.moves.push({
        ply: s.history.length,
        fullMove: Math.ceil(s.history.length / 2),
        side,
        san,
        uci: s.lastMove ?? '',
        fen: s.fen,
        reasoning: s.lastReasoning,
        durationMs: s.lastMoveDurationMs,
        rejectedAttempts: this.pendingAttempts.map(cloneAttempt),
        recordedAt: new Date().toISOString(),
      })
      this.pendingAttempts = []
      this.lastHistoryLen = s.history.length
    }

    this.pgn = s.pgn
    this.finalFen = s.fen

    if (!this.finalized && TERMINAL.includes(s.status)) {
      this.finalize(s)
    }
  }

  private captureAttempts(s: GameSnapshot): void {
    for (const a of s.attempts) {
      const key = attemptKey(a)
      if (this.seenAttemptKeys.has(key)) continue
      this.seenAttemptKeys.add(key)
      this.pendingAttempts.push(cloneAttempt(a))
    }
  }

  private finalize(s: GameSnapshot): void {
    this.finalized = true
    this.endedAt = new Date().toISOString()
    this.pgn = s.pgn
    this.finalFen = s.fen
    this.outcome = {
      status: s.status,
      result: s.result,
      winner: s.winner,
      forfeitReason: s.forfeitReason,
      trailingAttempts: this.pendingAttempts.map(cloneAttempt),
    }
    this.pendingAttempts = []
    this.onComplete?.(this.getRecord())
  }
}
