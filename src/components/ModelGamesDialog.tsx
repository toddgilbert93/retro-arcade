/**
 * Games drill-down dialog — not wired up yet.
 * Import in Leaderboard and open on model name click to re-enable.
 */
import { Fragment, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { Badge } from '@/components/ui/8bit/badge'
import { Button } from '@/components/ui/8bit/button'
import type { GameRecord, MoveRecord } from '../engine/recordingTypes'

export interface ModelGamesDialogModel {
  id: string
  label: string
}

function shortLabel(id: string): string {
  return id.replace('m:', '').split('/').pop() ?? id
}

function msLabel(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${ms}ms`
}

function resultBadge(result?: string, status?: string) {
  if (!result) return null
  const forfeit = status === 'forfeit'
  const variant =
    result === '1-0' ? 'default' :
    result === '0-1' ? 'secondary' :
    'outline'
  return (
    <Badge variant={variant} className="font-mono text-xs">
      {result}{forfeit ? ' (F)' : ''}
    </Badge>
  )
}

function MoveTableRow({ move }: { move: MoveRecord }) {
  const [open, setOpen] = useState(false)
  const hasRejected = move.rejectedAttempts.length > 0
  const hasDetails = !!move.reasoning || hasRejected

  return (
    <>
      <tr className="border-b border-border/30">
        <td className="py-1 pr-2 text-muted-foreground w-8">{move.ply}.</td>
        <td className="py-1 pr-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Badge variant={move.side === 'w' ? 'outline' : 'secondary'} className="w-7 shrink-0 justify-center font-mono text-[10px] px-0">
              {move.side === 'w' ? 'W' : 'B'}
            </Badge>
            <span className="font-semibold truncate">{move.san}</span>
          </span>
        </td>
        <td className="py-1 pr-2 font-mono text-muted-foreground w-14 shrink-0">
          {move.durationMs != null ? msLabel(move.durationMs) : '—'}
        </td>
        <td className="py-1 pr-2 w-14 shrink-0">
          {hasRejected && (
            <Badge variant="destructive" className="text-[10px]">
              {move.rejectedAttempts.length}
            </Badge>
          )}
        </td>
        <td className="py-1 w-12 shrink-0 text-right">
          {hasDetails && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setOpen((o) => !o)
              }}
              className="text-muted-foreground hover:text-foreground underline"
            >
              {open ? '−' : '+'}
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border/30 bg-muted/20">
          <td colSpan={5} className="px-2 py-2 min-w-0 max-w-0">
            <div className="space-y-2 min-w-0 break-words">
              <p className="font-mono text-[10px] text-muted-foreground break-all">{move.uci}</p>
              {move.reasoning && (
                <div className="rounded border border-border bg-muted/30 px-2 py-1.5 text-[10px] break-words">
                  <span className="text-muted-foreground">Reasoning: </span>{move.reasoning}
                </div>
              )}
              {move.rejectedAttempts.map((a, i) => (
                <div key={i} className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[10px] break-words">
                  <span className="text-destructive">Attempt {a.attempt + 1} rejected</span>
                  {a.kind && <span className="text-muted-foreground"> ({a.kind})</span>}
                  {a.uci && <span className="font-mono break-all"> — played: {a.uci}</span>}
                  <div className="mt-1 text-muted-foreground break-words">{a.error}</div>
                  {a.raw && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">raw output</summary>
                      <pre className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-all text-[10px] text-muted-foreground">{a.raw}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function GameMovesExpansion({ record }: { record: GameRecord }) {
  return (
    <div className="border-t border-border/50 bg-muted/10 px-2 py-2 min-w-0 max-w-full overflow-hidden">
      {record.outcome?.status === 'forfeit' && (
        <p className="mb-2 text-xs text-destructive break-words">
          Forfeit: {record.outcome.forfeitReason}
        </p>
      )}
      {record.moves.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">No moves recorded.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto min-w-0">
          <table className="w-full table-fixed text-[10px]">
            <thead className="sticky top-0 bg-muted/10">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-1 pr-2 font-medium w-8">Ply</th>
                <th className="pb-1 pr-2 font-medium">Move</th>
                <th className="pb-1 pr-2 font-medium w-14">Time</th>
                <th className="pb-1 pr-2 font-medium w-14">Retry</th>
                <th className="pb-1 font-medium w-12 text-right" />
              </tr>
            </thead>
            <tbody>
              {record.moves.map((move) => (
                <MoveTableRow key={move.ply} move={move} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {record.pgn && (
        <p className="mt-2 text-[10px] text-muted-foreground break-all line-clamp-2">{record.pgn}</p>
      )}
    </div>
  )
}

function GamesTable({ records }: { records: GameRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <div className="min-w-0 max-w-full">
      <table className="w-full table-fixed text-xs retro">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-2 font-medium w-6">#</th>
            <th className="pb-2 pr-2 font-medium">White</th>
            <th className="pb-2 pr-2 font-medium">Black</th>
            <th className="pb-2 pr-2 font-medium w-14">Result</th>
            <th className="pb-2 pr-2 font-medium w-10 text-right">Plies</th>
            <th className="pb-2 pr-2 font-medium w-16 text-right">Avg</th>
            <th className="pb-2 font-medium w-6 text-right" />
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => {
            const plies = r.moves.length
            const avgMs = plies
              ? Math.round(r.moves.reduce((s, m) => s + (m.durationMs ?? 0), 0) / plies)
              : 0
            const isExpanded = expandedId === r.id
            return (
              <Fragment key={r.id}>
                <tr
                  className="border-b border-border/50 hover:bg-muted/20 cursor-pointer"
                  onClick={() => toggle(r.id)}
                >
                  <td className="py-1.5 pr-2 text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5 pr-2 truncate">{shortLabel(r.white.id ?? '')}</td>
                  <td className="py-1.5 pr-2 truncate">{shortLabel(r.black.id ?? '')}</td>
                  <td className="py-1.5 pr-2">
                    {resultBadge(r.outcome?.result, r.outcome?.status)}
                  </td>
                  <td className="py-1.5 pr-2 text-right">{plies}</td>
                  <td className="py-1.5 pr-2 text-right font-mono">{avgMs ? `${avgMs}ms` : '—'}</td>
                  <td className="py-1.5 text-right text-muted-foreground">
                    {isExpanded ? '▼' : '▶'}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-border/50">
                    <td colSpan={7} className="p-0 w-full max-w-0 min-w-0">
                      <GameMovesExpansion record={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ModelGamesDialog({
  model,
  records,
  onClose,
}: {
  model: ModelGamesDialogModel
  records: GameRecord[]
  onClose: () => void
}) {
  const filtered = records.filter(
    (r) => r.white.id === model.id || r.black.id === model.id,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full min-w-0 max-w-3xl my-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{model.label}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {filtered.length} game{filtered.length === 1 ? '' : 's'} — click a row to expand moves
              </p>
            </div>
            <Button variant="outline" onClick={onClose} className="h-7 px-2 text-xs shrink-0">
              ✕
            </Button>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No games found.</p>
            ) : (
              <GamesTable records={filtered} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
