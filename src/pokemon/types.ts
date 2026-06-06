export type BattlePhase = 'idle' | 'drafting' | 'battle' | 'done' | 'error'

export type PlayerSide = 0 | 1

export interface LogEntry {
  text: string
  side?: PlayerSide
  kind?: 'message' | 'winner'
}

/** A single move slot as the UI needs to render it. */
export interface MoveView {
  name: string
  type: string
  pp: number
  maxPp: number
  disabled: boolean
}

/** A single Pokémon as the UI needs to render it. */
export interface MonView {
  /** Display name, e.g. "Charizard". */
  species: string
  dexNumber: number
  hp: number
  maxHp: number
  hpPct: number
  /** Major status, e.g. 'NONE' | 'BURN' | 'PARALYSIS' | ... */
  status: string
  types: string[]
  fainted: boolean
  moves: MoveView[]
}

export interface TeamMemberView {
  species: string
  dexNumber: number
  hpPct: number
  fainted: boolean
}

export interface SideView {
  /** Model label, e.g. "Claude Sonnet 4.6". */
  name: string
  active: MonView
  team: TeamMemberView[]
  /** Move slot index chosen this turn, before execution. Null if switching or undecided. */
  selectedMoveIndex: number | null
  /** True when Struggle was chosen instead of a normal move. */
  struggleSelected: boolean
}

export interface BattleSnapshot {
  turn: number
  /** Side A — rendered in front (player position, back sprite). */
  sideA: SideView
  /** Side B — rendered across the field (foe position, front sprite). */
  sideB: SideView
  finished: boolean
  winner: 0 | 1 | null
}

export interface DraftPick {
  side: 0 | 1
  species: string
  dexNumber: number
}

export interface RunnerState {
  phase: BattlePhase
  snapshot: BattleSnapshot | null
  draftPicks: DraftPick[]
  log: LogEntry[]
  winnerLabel: string | null
  /** Label of the side currently waiting on a model decision, if any. */
  thinking: string | null
  error: string | null
  /** True while the match is auto-advancing through draft/battle. */
  autoplay: boolean
  /** True when pause was requested but the current model call is still in flight. */
  pausePending: boolean
}
