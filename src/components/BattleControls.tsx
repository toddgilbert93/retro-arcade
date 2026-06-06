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
import { MODELS } from '@battler/agent/models.ts'
import { playerFrameColor } from '@/pokemon/playerColors'

interface BattleControlsProps {
  aId: string
  bId: string
  selectorsLocked: boolean
  showPause: boolean
  pausePending: boolean
  terminal: boolean
  thinking: boolean
  paused: boolean
  onAIdChange: (id: string) => void
  onBIdChange: (id: string) => void
  onPlay: () => void
  onPause: () => void
  onReset: () => void
}

export function BattleControls({
  aId,
  bId,
  selectorsLocked,
  showPause,
  pausePending,
  terminal,
  thinking,
  paused,
  onAIdChange,
  onBIdChange,
  onPlay,
  onPause,
  onReset,
}: BattleControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bit-button-group grid gap-3 sm:grid-cols-2">
          <div className="bit-button-slot space-y-2">
            <Label htmlFor="player-a">Player A</Label>
            <Select value={aId} onValueChange={onAIdChange} disabled={selectorsLocked}>
              <SelectTrigger id="player-a" frameColor={playerFrameColor(0)} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} textColor={playerFrameColor(0)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="bit-button-slot space-y-2">
            <Label htmlFor="player-b">Player B</Label>
            <Select value={bId} onValueChange={onBIdChange} disabled={selectorsLocked}>
              <SelectTrigger id="player-b" frameColor={playerFrameColor(1)} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id} textColor={playerFrameColor(1)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                onClick={onPlay}
                disabled={terminal || (thinking && !paused)}
                className="w-full"
              >
                {paused ? 'Resume' : 'Battle!'}
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
