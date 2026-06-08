import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'

export interface ModelStat {
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

export interface TournamentMeta {
  runAt: string
  elapsedS: number
  totalGames: number
  models: ModelStat[]
}

export interface LeaderboardProps {
  title: string
  dataUrl: string
  runCommand?: string
}

const metaCache = new Map<string, Promise<TournamentMeta>>()

export async function loadTournamentMeta(dataUrl: string): Promise<TournamentMeta> {
  const cached = metaCache.get(dataUrl)
  if (cached) return cached

  const promise = fetchTournamentMeta(dataUrl).catch((e) => {
    metaCache.delete(dataUrl)
    throw e
  })
  metaCache.set(dataUrl, promise)
  return promise
}

async function fetchTournamentMeta(dataUrl: string): Promise<TournamentMeta> {
  const res = await fetch(dataUrl)
  if (!res.ok) throw new Error('not_found')
  const ct = res.headers.get('content-type') ?? ''
  // Vite's SPA fallback serves index.html (text/html) for unknown paths with 200
  if (ct.includes('text/html')) throw new Error('not_found')
  const text = await res.text()
  if (text.trimStart().startsWith('<')) throw new Error('not_found')
  const lines = text.trim().split('\n').filter(Boolean)
  let meta: TournamentMeta | null = null
  for (const line of lines) {
    const obj = JSON.parse(line) as { type: string } & Partial<TournamentMeta>
    if (obj.type === 'meta') {
      meta = obj as unknown as TournamentMeta
      break
    }
  }
  if (!meta) throw new Error('No meta line found in tournament data')
  return meta
}

function msLabel(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

export function Leaderboard({ title, dataUrl, runCommand }: LeaderboardProps) {
  const [meta, setMeta] = useState<TournamentMeta | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMeta(null)
    setError(null)
    loadTournamentMeta(dataUrl)
      .then(setMeta)
      .catch((e: Error) => setError(e.message))
  }, [dataUrl])

  if (error) {
    const notFound = error === 'not_found'
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          <p>No tournament results found.</p>
          {runCommand && (
            <p className="mt-2 text-xs">
              Run{' '}
              <code className="rounded bg-muted px-1 font-mono">{runCommand}</code>{' '}
              to generate them.
            </p>
          )}
          {!notFound && (
            <p className="mt-1 text-xs text-destructive/70">{error}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!meta) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading results…
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Run: {new Date(meta.runAt).toLocaleString()}</span>
          <span>{meta.totalGames} games</span>
          <span>{Math.round(meta.elapsedS / 60)}m elapsed</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="retro w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Rank</th>
                <th className="pb-2 pr-3 font-medium">Model</th>
                <th className="pb-2 pr-3 text-right font-medium">W</th>
                <th className="pb-2 pr-3 text-right font-medium">L</th>
                <th className="pb-2 pr-3 text-right font-medium">D</th>
                <th className="pb-2 pr-3 text-right font-medium">Forfeits</th>
                <th className="pb-2 pr-3 text-right font-medium">Win%</th>
                <th className="pb-2 text-right font-medium">Avg ms/move</th>
              </tr>
            </thead>
            <tbody>
              {meta.models.map((m, i) => (
                <tr key={m.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-3 font-semibold">{m.label}</td>
                  <td className="py-2 pr-3 text-right">{m.wins}</td>
                  <td className="py-2 pr-3 text-right">{m.losses}</td>
                  <td className="py-2 pr-3 text-right">{m.draws}</td>
                  <td className="py-2 pr-3 text-right">
                    {m.forfeits > 0 ? (
                      <span className="text-destructive">{m.forfeits}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold tabular-nums">
                    {m.winPct}%
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {msLabel(m.avgMoveDurationMs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
