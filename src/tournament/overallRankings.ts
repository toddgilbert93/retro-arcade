import type { ModelStat } from '@/components/Leaderboard'

/** Average finish position within one discipline (1 = best). Ties split the mean rank. */
export function rankByWinPct(models: ModelStat[]): Map<string, number> {
  const sorted = [...models].sort(
    (a, b) => b.winPct - a.winPct || b.wins - a.wins || a.label.localeCompare(b.label),
  )

  const ranks = new Map<string, number>()
  let i = 0
  while (i < sorted.length) {
    let j = i
    while (
      j + 1 < sorted.length &&
      sorted[j + 1]!.winPct === sorted[i]!.winPct &&
      sorted[j + 1]!.wins === sorted[i]!.wins
    ) {
      j++
    }
    const avgRank = (i + 1 + j + 1) / 2
    for (let k = i; k <= j; k++) {
      ranks.set(sorted[k]!.id, avgRank)
    }
    i = j + 1
  }
  return ranks
}

export interface OverallRow {
  id: string
  label: string
  avgRank: number
  avgWinPct: number
  disciplineWins: number
  totalForfeits: number
  disciplinesPlayed: number
  pokemonRank: number | null
  chessRank: number | null
  pokerRank: number | null
}

export interface DisciplineInput {
  key: 'pokemon' | 'chess' | 'poker'
  models: ModelStat[] | null
}

function isDisciplineWin(rank: number): boolean {
  return rank < 2
}

export function computeOverallRankings(disciplines: DisciplineInput[]): OverallRow[] {
  const modelLabels = new Map<string, string>()
  for (const d of disciplines) {
    for (const m of d.models ?? []) {
      modelLabels.set(m.id, m.label)
    }
  }

  const rankMaps = Object.fromEntries(
    disciplines.map((d) => [d.key, d.models ? rankByWinPct(d.models) : null]),
  ) as Record<'pokemon' | 'chess' | 'poker', Map<string, number> | null>

  const rows: OverallRow[] = []

  for (const [id, label] of modelLabels) {
    const ranks: number[] = []
    const winPcts: number[] = []
    let disciplineWins = 0
    let totalForfeits = 0

    for (const d of disciplines) {
      const m = d.models?.find((x) => x.id === id)
      if (!m) continue
      winPcts.push(m.winPct)
      totalForfeits += m.forfeits
      const rank = rankMaps[d.key]?.get(id)
      if (rank !== undefined) {
        ranks.push(rank)
        if (isDisciplineWin(rank)) disciplineWins++
      }
    }

    if (ranks.length === 0) continue

    rows.push({
      id,
      label,
      avgRank: ranks.reduce((sum, r) => sum + r, 0) / ranks.length,
      avgWinPct: winPcts.reduce((sum, p) => sum + p, 0) / winPcts.length,
      disciplineWins,
      totalForfeits,
      disciplinesPlayed: ranks.length,
      pokemonRank: rankMaps.pokemon?.get(id) ?? null,
      chessRank: rankMaps.chess?.get(id) ?? null,
      pokerRank: rankMaps.poker?.get(id) ?? null,
    })
  }

  rows.sort((a, b) => {
    if (a.avgRank !== b.avgRank) return a.avgRank - b.avgRank
    if (a.disciplineWins !== b.disciplineWins) return b.disciplineWins - a.disciplineWins
    if (a.avgWinPct !== b.avgWinPct) return b.avgWinPct - a.avgWinPct
    return a.totalForfeits - b.totalForfeits
  })

  return rows
}

export function formatRank(rank: number | null): string {
  if (rank === null) return '—'
  return Number.isInteger(rank) ? String(rank) : rank.toFixed(1)
}
