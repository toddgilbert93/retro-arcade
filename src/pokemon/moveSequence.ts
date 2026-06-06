import type { Battle } from '@battler/engine/battle.ts'
import type { SideId } from '@battler/engine/battle.ts'
import type { LogEntry } from './types'

/** Wall-clock beats for staged move resolution (ms). */
export const MOVE_CARET_MS = 700
export const MOVE_ANNOUNCE_MS = 950
export const MOVE_HIT_MS = 650
export const MOVE_STATUS_MS = 700
export const MOVE_OTHER_MS = 500
export const BOTH_COMMITTED_MS = 600
export const BETWEEN_MOVES_MS = 450

export type MoveLogPhase = 'announce' | 'impact' | 'status' | 'other'

export interface FieldSnapshot {
  hp: number
  status: string
  fainted: boolean
}

export type FieldState = Record<SideId, FieldSnapshot>

export interface MoveLogBatch {
  phase: MoveLogPhase
  lines: LogEntry[]
}

/** Snapshot active HP/status before a move mutates the engine state. */
export function captureField(battle: Battle): FieldState {
  return {
    0: snapMon(battle, 0),
    1: snapMon(battle, 1),
  }
}

function snapMon(battle: Battle, side: SideId): FieldSnapshot {
  const p = battle.active(side)
  return {
    hp: Math.max(0, p.hp),
    status: p.status,
    fainted: p.isFainted,
  }
}

/** Classify a battle log line into a presentation phase. */
export function classifyMoveLogLine(text: string): MoveLogPhase {
  if (/ used .+!$/.test(text)) return 'announce'

  if (
    text.includes("can't move") ||
    text.includes('fast asleep') ||
    text.includes('frozen solid') ||
    text.includes('flinched') ||
    text.includes(' is confused!') ||
    text.includes('must recharge') ||
    text.includes('woke up!') ||
    text.includes('snapped out') ||
    text.includes('attack missed') ||
    text.includes('began charging') ||
    text.includes('But it failed!') ||
    text.includes('But nothing happened')
  ) {
    return 'announce'
  }

  if (
    (text.includes(' took ') && text.includes(' damage')) ||
    (text.includes(' lost ') && text.includes(' HP')) ||
    text === 'A critical hit!' ||
    text.includes('super effective') ||
    text.includes('not very effective') ||
    text.includes("doesn't affect") ||
    text.includes("It's a one-hit KO") ||
    /^Hit \d+ time/.test(text) ||
    text.includes('hurt itself') ||
    text.includes('recoil') ||
    text.includes('hurt by its') ||
    text.includes('Substitute broke') ||
    text.includes('fainted from the blast') ||
    text.includes('drained ') ||
    text.includes('restored ') ||
    text.includes('regained ') ||
    text.includes('kept going and crashed')
  ) {
    return 'impact'
  }

  if (
    / was (burned|paralyzed|poisoned|frozen)/.test(text) ||
    text.includes('fell asleep') ||
    text.includes('became confused') ||
    text.includes('went to sleep and became healthy') ||
    text.includes('was seeded') ||
    (text.includes("'s ") && text.includes(' was disabled'))
  ) {
    return 'status'
  }

  return 'other'
}

/** Group buffered move logs into consecutive presentation phases. */
export function batchMoveLogs(lines: LogEntry[]): MoveLogBatch[] {
  const batches: MoveLogBatch[] = []
  let current: MoveLogBatch | null = null

  for (const line of lines) {
    const phase = classifyMoveLogLine(line.text)
    if (current && current.phase !== phase) {
      batches.push(current)
      current = null
    }
    if (!current) current = { phase, lines: [] }
    current.lines.push(line)
  }

  if (current && current.lines.length > 0) batches.push(current)
  return batches
}

export function phaseDuration(phase: MoveLogPhase): number {
  switch (phase) {
    case 'announce':
      return MOVE_ANNOUNCE_MS
    case 'impact':
      return MOVE_HIT_MS
    case 'status':
      return MOVE_STATUS_MS
    default:
      return MOVE_OTHER_MS
  }
}

/** After impact lines land, sync displayed HP from the resolved engine state. */
export function syncImpactField(field: FieldState, battle: Battle): void {
  for (const side of [0, 1] as SideId[]) {
    field[side] = snapMon(battle, side)
  }
}

/** After status lines land, sync displayed status from the resolved engine state. */
export function syncStatusField(field: FieldState, battle: Battle): void {
  for (const side of [0, 1] as SideId[]) {
    field[side].status = battle.active(side).status
  }
}
