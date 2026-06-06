import type { LogEntry, PlayerSide } from './types'

export type PlayerFrameColor = 'player-a' | 'player-b'

export function playerFrameColor(side: PlayerSide): PlayerFrameColor {
  return side === 0 ? 'player-a' : 'player-b'
}

export function playerTextClass(side: PlayerSide): string {
  return side === 0 ? 'text-player-a' : 'text-player-b'
}

export function playerTintVar(side: PlayerSide): string {
  return side === 0 ? 'var(--color-player-a)' : 'var(--color-player-b)'
}

export function logLineClass(entry: LogEntry): string {
  if (entry.text.startsWith('[fallback]')) return 'text-amber-400/80'
  if (entry.side === 0) return 'text-player-a'
  if (entry.side === 1) return 'text-player-b'
  return 'text-muted-foreground'
}
