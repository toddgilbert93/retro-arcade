import { Alert, AlertDescription } from '@/components/ui/8bit/alert'
import { Badge } from '@/components/ui/8bit/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import type { GameSnapshot } from '../engine/types'

interface StatusPanelProps {
  snapshot: GameSnapshot
}

const STATUS_TEXT: Record<GameSnapshot['status'], string> = {
  idle: 'Ready',
  'in-progress': 'In progress',
  paused: 'Paused',
  checkmate: 'Checkmate',
  stalemate: 'Stalemate',
  draw: 'Draw',
  forfeit: 'Forfeit',
}

function statusVariant(
  status: GameSnapshot['status'],
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (status === 'checkmate' || status === 'forfeit') return 'destructive'
  if (status === 'draw' || status === 'stalemate') return 'secondary'
  if (status === 'in-progress') return 'default'
  return 'outline'
}

export function StatusPanel({ snapshot }: StatusPanelProps) {
  const {
    status,
    turn,
    winner,
    result,
    check,
    forfeitReason,
    lastReasoning,
    thinking,
    pausePending,
  } = snapshot
  const terminal = ['checkmate', 'stalemate', 'draw', 'forfeit'].includes(status)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusVariant(status)}>{STATUS_TEXT[status]}</Badge>
          {pausePending && (
            <Badge variant="secondary">Finishing move</Badge>
          )}
          {result !== '*' && (
            <span className="retro text-sm font-bold tabular-nums">{result}</span>
          )}
        </div>

        {!terminal && (
          <p className="retro text-sm">
            {turn === 'w' ? 'White' : 'Black'} to move
            {check && <strong className="text-destructive"> — check!</strong>}
            {thinking && !pausePending && (
              <span className="text-muted-foreground">
                {' · thinking'}
                <span className="thinking-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </span>
            )}
          </p>
        )}

        {terminal && winner && (
          <p className="retro text-sm">
            <strong>{winner === 'w' ? 'White' : 'Black'} wins</strong>
          </p>
        )}
        {terminal && !winner && status !== 'idle' && (
          <p className="retro text-sm">Drawn game.</p>
        )}

        {forfeitReason && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{forfeitReason}</AlertDescription>
          </Alert>
        )}

        {lastReasoning && (
          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="retro text-[10px] uppercase tracking-wider text-muted-foreground">
              Last move reasoning
            </h3>
            <p className="retro text-xs leading-relaxed">{lastReasoning}</p>
          </div>
        )}

        {snapshot.attempts.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <h3 className="retro text-[10px] uppercase tracking-wider text-muted-foreground">
              Rejected attempts
            </h3>
            <ul className="space-y-1 text-xs">
              {snapshot.attempts.map((a, i) => (
                <li key={i} className="retro leading-relaxed">
                  <span className="text-muted-foreground">
                    {a.player} #{a.attempt + 1}:
                  </span>{' '}
                  {a.error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
