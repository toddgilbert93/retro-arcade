import type { AttemptLog, GameStatus, Side } from './types'

export interface PlayerMeta {
  name: string
  id?: string
  model?: string
}

export interface MoveRecord {
  ply: number
  fullMove: number
  side: Side
  san: string
  uci: string
  fen: string
  reasoning?: string
  /** Wall-clock milliseconds from the first getMove() call to a legal move being accepted. */
  durationMs?: number
  rejectedAttempts: AttemptLog[]
  recordedAt: string
}

export interface GameOutcome {
  status: GameStatus
  result: string
  winner: Side | null
  forfeitReason?: string
  /** Rejected attempts that did not precede a successful move (e.g. leading to forfeit). */
  trailingAttempts: AttemptLog[]
}

/** Structured record of a complete or in-progress game. */
export interface GameRecord {
  schemaVersion: 1
  id: string
  startedAt: string
  endedAt?: string
  white: PlayerMeta
  black: PlayerMeta
  moves: MoveRecord[]
  outcome?: GameOutcome
  pgn: string
  finalFen: string
}

export type NdjsonEvent =
  | {
      type: 'game'
      schemaVersion: 1
      id: string
      startedAt: string
      white: PlayerMeta
      black: PlayerMeta
    }
  | { type: 'move'; move: MoveRecord }
  | { type: 'outcome'; outcome: GameOutcome; endedAt: string; pgn: string; finalFen: string }
