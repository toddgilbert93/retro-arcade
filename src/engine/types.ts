// The harness contract. A "player" (random bot or model-backed agent) only
// needs to implement `getMove`. Everything the player is allowed to
// know about the position is handed to it in `MoveContext`; everything it is
// allowed to do is return a single `MoveDecision`.

export type Side = 'w' | 'b'

export type MoveErrorKind = 'parse' | 'illegal' | 'transport'

/** Everything a player sees when it is asked to move. */
export interface MoveContext {
  /** Full board state in Forsyth–Edwards Notation. */
  fen: string
  /** The game so far, as PGN. */
  pgn: string
  /** Side to move. */
  turn: Side
  /** The allowed moves, in UCI notation (e.g. "e2e4", "g1f3", "e7e8q"). */
  legalMoves: string[]
  /** The same moves in SAN (e.g. "e4", "Nf3", "exd3"), index-aligned with `legalMoves`. */
  legalSan: string[]
  /** Moves played so far, in SAN (e.g. ["e4", "c5", "Nf3"]). */
  history: string[]
  /** Opponent's last move, in UCI. Undefined on the first move. */
  lastMove?: string
  /** Whether the side to move is currently in check. */
  check: boolean
  /** Full-move number (1 at start). */
  moveNumber: number
  /** Which retry this is (0 = first attempt). */
  attempt: number
  /** Why the previous attempt was rejected. Set only when `attempt > 0`. */
  lastError?: string
  /** Category of the previous rejection. Set only when `attempt > 0`. */
  lastErrorKind?: MoveErrorKind
}

/** A player's answer to "what is your move?". */
export interface MoveDecision {
  /** The chosen move in UCI notation. Must be one of `MoveContext.legalMoves`. */
  uci: string
  /** Optional free-text rationale, surfaced in the UI. */
  reasoning?: string
}

/** The single method any harness participant must implement. */
export interface Player {
  readonly name: string
  getMove(ctx: MoveContext): Promise<MoveDecision>
}

/** Lifecycle + outcome of a game, derived from the board each tick. */
export type GameStatus =
  | 'idle'
  | 'in-progress'
  | 'paused'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'forfeit'

/** A rejected move attempt, kept for display/debugging. */
export interface AttemptLog {
  side: Side
  player: string
  attempt: number
  uci?: string
  error: string
  kind?: MoveErrorKind
  raw?: string
}

/** Immutable view of the game, emitted to subscribers after every change. */
export interface GameSnapshot {
  fen: string
  /** Full game so far in PGN movetext. */
  pgn: string
  /** SAN move history. */
  history: string[]
  turn: Side
  status: GameStatus
  /** Winning side, or null for a draw / unfinished game. */
  winner: Side | null
  /** Score string: "1-0", "0-1", "1/2-1/2", or "*" while in progress. */
  result: string
  /** Set only when status is "forfeit". */
  forfeitReason?: string
  /** The most recent move, in UCI (for board highlighting). */
  lastMove?: string
  /** Reasoning attached to the most recent move, if any. */
  lastReasoning?: string
  /** Whether the side to move is in check. */
  check: boolean
  /** Move number (full moves). */
  moveNumber: number
  /** Recent rejected attempts (most recent last). */
  attempts: AttemptLog[]
  /** True while a move is being computed/awaited. */
  thinking: boolean
  /** True while autoplay is active (`start()` was called and not yet paused). */
  autoplay: boolean
  /** True after pause was clicked but the in-flight move has not finished yet. */
  pausePending: boolean
  /** Wall-clock ms taken by the most recent move (from first getMove() call to legal move accepted). */
  lastMoveDurationMs?: number
}
