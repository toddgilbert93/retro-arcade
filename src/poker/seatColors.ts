import type { PokerLogEntry, Seat } from './types'

export type SeatFrameColor = 'player-a' | 'player-b' | 'player-c' | 'player-d'

export function seatFrameColor(seat: Seat): SeatFrameColor {
  return seat === 0
    ? 'player-a'
    : seat === 1
      ? 'player-b'
      : seat === 2
        ? 'player-c'
        : 'player-d'
}

// Literal class strings (not interpolated) so Tailwind keeps them in the build.
export function seatTextClass(seat: Seat): string {
  return seat === 0
    ? 'text-player-a'
    : seat === 1
      ? 'text-player-b'
      : seat === 2
        ? 'text-player-c'
        : 'text-player-d'
}

/** CSS color var for inline styles (borders, glows). */
export function seatColorVar(seat: Seat): string {
  return seat === 0
    ? 'var(--color-player-a)'
    : seat === 1
      ? 'var(--color-player-b)'
      : seat === 2
        ? 'var(--color-player-c)'
        : 'var(--color-player-d)'
}

export function logLineClass(entry: PokerLogEntry): string {
  if (entry.text.startsWith('[fallback]')) return 'text-amber-400/80'
  if (entry.kind === 'street') return 'text-muted-foreground'
  switch (entry.seat) {
    case 0:
      return 'text-player-a'
    case 1:
      return 'text-player-b'
    case 2:
      return 'text-player-c'
    case 3:
      return 'text-player-d'
    default:
      return 'text-muted-foreground'
  }
}
