import { useEffect, useMemo, useState } from 'react'
import { VictoryScreen } from '@/components/ui/8bit/blocks/victory-screen'
import type { VictoryScreenItems } from '@/components/ui/8bit/blocks/victory-screen'
import { modelLogoForId, modelLogoIconClass } from '@/poker/modelLogos'
import { computeOverallRankings } from '@/tournament/overallRankings'
import { loadTournamentMeta, type TournamentMeta } from './Leaderboard'

const DISCIPLINES = [
  { key: 'pokemon' as const, title: 'Pokemon', dataUrl: '/battle-tournament.ndjson' },
  { key: 'chess' as const, title: 'Chess', dataUrl: '/tournament.ndjson' },
  { key: 'poker' as const, title: 'Poker', dataUrl: '/poker-tournament.ndjson' },
]

const RANK_LABELS = ['1st', '2nd', '3rd', '4th'] as const
const RANK_RARITIES: VictoryScreenItems['rarity'][] = [
  'legendary',
  'epic',
  'rare',
  'common',
]

const LEADERBOARD_ROW_COUNT = 4

const PLACEHOLDER_ITEMS: VictoryScreenItems[] = Array.from(
  { length: LEADERBOARD_ROW_COUNT },
  (_, i) => ({
    id: i + 1,
    name: 'Model name',
    rarity: 'common',
    rankLabel: '—',
  }),
)

interface DisciplineState {
  key: (typeof DISCIPLINES)[number]['key']
  title: string
  meta: TournamentMeta | null
  error: string | null
}

export function OverallLeaderboard() {
  const [disciplines, setDisciplines] = useState<DisciplineState[]>(
    DISCIPLINES.map((d) => ({ key: d.key, title: d.title, meta: null, error: null })),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all(
      DISCIPLINES.map(async (d) => {
        try {
          const meta = await loadTournamentMeta(d.dataUrl)
          return { key: d.key, title: d.title, meta, error: null }
        } catch (e) {
          return {
            key: d.key,
            title: d.title,
            meta: null,
            error: e instanceof Error ? e.message : String(e),
          }
        }
      }),
    ).then((results) => {
      setDisciplines(results)
      setLoading(false)
    })
  }, [])

  const rows = useMemo(
    () =>
      computeOverallRankings(
        disciplines.map((d) => ({ key: d.key, models: d.meta?.models ?? null })),
      ),
    [disciplines],
  )

  const availableCount = disciplines.filter((d) => d.meta !== null).length
  const winner = rows[0]

  const leaderboardItems: VictoryScreenItems[] = rows.map((row, i) => ({
    id: i + 1,
    name: row.label,
    rarity: RANK_RARITIES[i] ?? 'common',
    rankLabel: RANK_LABELS[i] ?? `${i + 1}th`,
    icon: modelLogoForId(row.id),
    iconClassName: modelLogoIconClass(row.id),
  }))

  if (loading) {
    return (
      <VictoryScreen
        title="Loading results…"
        itemsSectionTitle="Leaderboard"
        itemsObtained={PLACEHOLDER_ITEMS}
        footerText="Final rankings calculated by average place in all games."
        className="pointer-events-none animate-pulse opacity-60"
        aria-busy
        aria-live="polite"
      />
    )
  }

  if (availableCount === 0 || !winner) {
    return (
      <VictoryScreen
        title="No tournament results"
        itemsSectionTitle="Leaderboard"
        itemsObtained={PLACEHOLDER_ITEMS}
        footerText="Run the per-game tournaments to populate the overall standings."
        className="[&_[data-slot=item-group]]:invisible"
      />
    )
  }

  return (
    <VictoryScreen
      title={`${winner.label} wins!`}
      itemsSectionTitle="Leaderboard"
      itemsObtained={leaderboardItems}
      footerText="Final rankings calculated by average place in all games."
    />
  )
}
