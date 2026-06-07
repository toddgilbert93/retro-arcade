import { Button } from '@/components/ui/8bit/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'

interface PokerControlsProps {
  showPause: boolean
  pausePending: boolean
  terminal: boolean
  thinking: boolean
  paused: boolean
  started: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
}

export function PokerControls({
  showPause,
  pausePending,
  terminal,
  thinking,
  paused,
  started,
  onPlay,
  onPause,
  onReset,
}: PokerControlsProps) {
  const playLabel = paused ? 'Resume' : started ? 'Deal!' : 'Deal!'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                onClick={onPlay}
                disabled={terminal || (thinking && !paused)}
                className="w-full"
              >
                {playLabel}
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
