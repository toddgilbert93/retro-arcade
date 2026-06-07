// Shared types for the Texas Hold'em (4 AI players) game.

export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades'
export type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  rank: Rank
  suit: Suit
}

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

/** Seat index around the table. Four models, one per seat. */
export type Seat = 0 | 1 | 2 | 3

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in'

/**
 * A decision returned by a model. For `bet`/`raise`, `amount` is the total
 * chips this player wants committed for the current street (a "raise to"
 * value). `call`/`check`/`fold`/`all-in` ignore `amount`.
 */
export interface PokerAction {
  type: ActionType
  amount?: number
  reasoning?: string
}

/** What a seat is legally allowed to do right now, with amounts. */
export interface LegalActions {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  /** Chips the player must add to call. */
  callAmount: number
  canBet: boolean
  canRaise: boolean
  /** Smallest legal total street commitment for a bet/raise. */
  minRaiseTo: number
  /** Largest legal total street commitment (i.e. going all-in). */
  maxRaiseTo: number
  canAllIn: boolean
}

/** One recorded action, kept in a rolling history so models can read patterns. */
export interface ActionRecord {
  handNumber: number
  street: Street
  seat: Seat
  label: string
  /** Human-readable action, e.g. "raise to 60", "call 20", "fold". */
  action: string
  amountAdded: number
  potAfter: number
  reasoning?: string
}

export interface PotResult {
  amount: number
  winners: Seat[]
  eligibleSeats: Seat[]
}

export interface HandResult {
  potResults: PotResult[]
  totalPot: number
  wentToShowdown: boolean
}

/** Per-seat view for rendering + serialization. */
export interface SeatView {
  seat: Seat
  label: string
  stack: number
  committedThisStreet: number
  holeCards: [Card, Card] | null
  folded: boolean
  allIn: boolean
  out: boolean
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isTurn: boolean
  lastAction: string | null
  lastReasoning: string | null
  wonThisHand: number
  handDescr: string | null
}

export interface PokerSnapshot {
  handNumber: number
  dealerSeat: Seat
  street: Street
  board: Card[]
  /** Total chips in the middle this hand (all streets). */
  pot: number
  currentBet: number
  toAct: Seat | null
  seats: SeatView[]
  tournamentWinner: Seat | null
}

export type PokerPhase = 'idle' | 'playing' | 'done' | 'error'

export interface PokerLogEntry {
  text: string
  seat?: Seat
  kind?: 'action' | 'reasoning' | 'street' | 'showdown' | 'winner' | 'system'
}

/** The spotlighted speaker. reasoning === null means "still thinking". */
export interface PokerCommentary {
  seat: Seat
  reasoning: string | null
}

export interface PokerRunnerState {
  phase: PokerPhase
  snapshot: PokerSnapshot | null
  log: PokerLogEntry[]
  /** Label of the seat currently waiting on a model decision, if any. */
  thinking: string | null
  /** Spotlighted speaker for the commentary bubble (synced to the highlight). */
  commentary: PokerCommentary | null
  winnerLabel: string | null
  error: string | null
  /** True while the game is auto-advancing. */
  autoplay: boolean
  /** True when pause was requested but the current model call is still in flight. */
  pausePending: boolean
}
