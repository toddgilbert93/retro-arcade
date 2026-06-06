import type { Battle } from '@battler/engine/battle.ts'
import type { SideId } from '@battler/engine/battle.ts'

/** Guess which side a battle log line belongs to, if any. */
export function inferLogSide(line: string, battle: Battle): SideId | undefined {
  for (const side of [0, 1] as const) {
    if (line.startsWith(battle.sides[side].name)) return side
  }

  for (const side of [0, 1] as const) {
    for (const mon of battle.sides[side].team) {
      const name = mon.displayName
      if (
        line.startsWith(`${name} `) ||
        line.startsWith(`${name}'`) ||
        line.includes(name)
      ) {
        return side
      }
    }
  }

  return undefined
}
