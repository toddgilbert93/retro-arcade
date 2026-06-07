import { useEffect, useMemo, useState } from 'react'
import { VictoryScreen } from '@/components/ui/8bit/blocks/victory-screen'
import type { VictoryScreenItems } from '@/components/ui/8bit/blocks/victory-screen'
import { Card, CardContent } from '@/components/ui/8bit/card'
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
      <Card>
        <CardContent className="retro py-12 text-center text-sm text-muted-foreground">
          Loading results…
        </CardContent>
      </Card>
    )
  }

  if (availableCount === 0 || !winner) {
    return (
      <Card>
        <CardContent className="retro py-12 text-center text-sm text-muted-foreground">
          <p>No tournament results found.</p>
          <p className="mt-2 text-[9px]">
            Run the per-game tournaments to populate the overall standings.
          </p>
        </CardContent>
      </Card>
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
