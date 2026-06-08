import { Button } from '@/components/ui/8bit/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { Label } from '@/components/ui/8bit/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
import type { GameSnapshot, Side } from '../engine/types'
import { PLAYER_OPTIONS } from '../hooks/useChessGame'

interface GameControlsProps {
  snapshot: GameSnapshot
  whiteId: string
  blackId: string
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSetPlayerType: (side: Side, id: string) => void
}

const isTerminal = (s: GameSnapshot['status']) =>
  s === 'checkmate' || s === 'stalemate' || s === 'draw' || s === 'forfeit'

export function GameControls({
  snapshot,
  whiteId,
  blackId,
  onStart,
  onPause,
  onReset,
  onSetPlayerType,
}: GameControlsProps) {
  const { status, thinking, autoplay, pausePending } = snapshot
  const terminal = isTerminal(status)
  const controlsLocked = thinking && !pausePending

  const showPause = autoplay || pausePending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bit-button-group grid gap-3 sm:grid-cols-2">
          {(['w', 'b'] as Side[]).map((side) => (
            <div key={side} className="bit-button-slot space-y-2">
              <Label htmlFor={`player-${side}`}>{side === 'w' ? 'White' : 'Black'}</Label>
              <Select
                value={side === 'w' ? whiteId : blackId}
                onValueChange={(value) => onSetPlayerType(side, value)}
                disabled={controlsLocked}
              >
                <SelectTrigger id={`player-${side}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="bit-button-group grid grid-cols-2 gap-2">
          <div className="bit-button-slot">
            {showPause ? (
              <Button
                onClick={onPause}
                disabled={pausePending || terminal}
                variant={pausePending ? 'secondary' : 'default'}
                className="w-full"
                aria-pressed={pausePending}
              >
                Pause
              </Button>
            ) : (
              <Button
                onClick={onStart}
                disabled={terminal || thinking}
                className="w-full"
              >
                {status === 'paused' ? 'Resume' : 'Play'}
              </Button>
            )}
          </div>
          <div className="bit-button-slot">
            <Button onClick={onReset} variant="secondary" className="w-full">
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
