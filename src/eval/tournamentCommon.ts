import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export interface TournamentModelStat {
  id: string
  label: string
  games: number
  wins: number
  losses: number
  draws: number
  forfeits: number
  winPct: number
  avgMoveDurationMs: number
}

export interface StatBucket {
  id: string
  label: string
  games: number
  wins: number
  losses: number
  draws: number
  forfeits: number
  totalMs: number
  moves: number
}

export function loadDotEnv(): void {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
      if (!m) continue
      const [, key, rawVal] = m
      const val = rawVal.replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    /* no .env */
  }
}

export function flag(argv: string[], name: string, fallback?: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback
}

export function roundRobinPairings(ids: string[]): { aId: string; bId: string }[] {
  const pairs: { aId: string; bId: string }[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i !== j) pairs.push({ aId: ids[i]!, bId: ids[j]! })
    }
  }
  return pairs
}

export function initStats(models: { id: string; label: string }[]): Record<string, StatBucket> {
  return Object.fromEntries(
    models.map((m) => [
      m.id,
      {
        id: m.id,
        label: m.label,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        forfeits: 0,
        totalMs: 0,
        moves: 0,
      },
    ]),
  )
}

export function recordTiming(stat: Record<string, StatBucket>, id: string, ms: number): void {
  const bucket = stat[id]
  if (!bucket) return
  bucket.totalMs += ms
  bucket.moves++
}

export function applyWinLoss(
  stat: Record<string, StatBucket>,
  winnerId: string,
  loserId: string,
): void {
  if (stat[winnerId]) {
    stat[winnerId].games++
    stat[winnerId].wins++
  }
  if (stat[loserId]) {
    stat[loserId].games++
    stat[loserId].losses++
  }
}

export function applyForfeit(
  stat: Record<string, StatBucket>,
  winnerId: string,
  loserId: string,
): void {
  applyWinLoss(stat, winnerId, loserId)
  if (stat[loserId]) stat[loserId].forfeits++
}

export function finalizeStats(stat: Record<string, StatBucket>): TournamentModelStat[] {
  return Object.values(stat)
    .map((s) => ({
      id: s.id,
      label: s.label,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      forfeits: s.forfeits,
      winPct: s.games ? Math.round((s.wins / s.games) * 100) : 0,
      avgMoveDurationMs: s.moves ? Math.round(s.totalMs / s.moves) : 0,
    }))
    .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins)
}

export function writeTournamentOutput(
  outPath: string,
  publicBasename: string,
  meta: {
    runAt: string
    elapsedS: number
    totalGames: number
    models: TournamentModelStat[]
  },
  records: unknown[],
): void {
  mkdirSync(dirname(outPath), { recursive: true })
  const lines: string[] = [JSON.stringify({ type: 'meta', ...meta })]
  for (const record of records) {
    lines.push(JSON.stringify(record))
  }
  const body = lines.join('\n') + '\n'
  writeFileSync(outPath, body)
  const publicOut = resolve(process.cwd(), 'public', publicBasename)
  writeFileSync(publicOut, body)
  console.log(`\nSaved ${records.length} records → ${outPath}`)
  console.log(`Also written → ${publicOut}`)
}

export function printLeaderboard(models: TournamentModelStat[]): void {
  console.log('\nLeaderboard:')
  console.log('  Model                     W   L   D  Forf  Win%  AvgMs/move')
  for (const m of models) {
    const label = m.label.padEnd(26)
    console.log(
      `  ${label} ${String(m.wins).padStart(2)}  ${String(m.losses).padStart(2)}  ` +
        `${String(m.draws).padStart(2)}  ${String(m.forfeits).padStart(3)}   ` +
        `${String(m.winPct).padStart(3)}%  ${m.avgMoveDurationMs}ms`,
    )
  }
}
