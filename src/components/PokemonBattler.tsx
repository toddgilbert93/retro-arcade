import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { Button } from '@/components/ui/8bit/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/8bit/select'
import { DEFAULT_MODEL_A_ID, DEFAULT_MODEL_B_ID, MODELS } from '@battler/agent/models.ts'
import { TEAM_SIZE } from '@battler/agent/draft.ts'
import { usePokemonBattle } from '@/hooks/usePokemonBattle'
import { frontSprite } from '@/pokemon/sprites'
import type { PlayerSide, TeamMemberView } from '@/pokemon/types'
import { playerFrameColor, playerTextClass } from '@/pokemon/playerColors'
import { ActivityFeed } from '@/components/pokemon/ActivityFeed'
import { PokemonPanel } from '@/components/pokemon/battleParts'
import { cn } from '@/lib/utils'

/** Shared fixed heights for battler panels. */
const MAIN_CARD_H = '!h-80' // battle + activity
const TEAM_CARD_H = '!h-52' // team roster cards
const flexCard = () => cn('!flex min-h-0 flex-col')
const fixedCard = (height: string) => cn(flexCard(), height)

export function PokemonBattler() {
  const battle = usePokemonBattle()
  const {
    phase,
    snapshot,
    draftPicks,
    log,
    thinking,
    autoplay,
    pausePending,
    moveVfx,
    start,
    pause,
    resume,
    reset,
  } = battle

  const [aId, setAId] = useState(DEFAULT_MODEL_A_ID)
  const [bId, setBId] = useState(DEFAULT_MODEL_B_ID)

  const terminal = phase === 'done' || phase === 'error'
  const paused = !autoplay && (phase === 'drafting' || phase === 'battle')
  const showPause = autoplay || pausePending
  const selectorsLocked = phase === 'drafting' || phase === 'battle'

  const modelA = useMemo(() => MODELS.find((m) => m.id === aId)!, [aId])
  const modelB = useMemo(() => MODELS.find((m) => m.id === bId)!, [bId])

  const onPlay = () => {
    if (paused) resume()
    else start(modelA, modelB)
  }

  const picksA = draftPicks.filter((p) => p.side === 0)
  const picksB = draftPicks.filter((p) => p.side === 1)

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3">
      <Card className="shrink-0">
        <CardHeader className="shrink-0 py-3">
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="bit-button-group flex w-full flex-wrap items-center gap-x-4 gap-y-3">
            <div className="bit-button-slot min-w-[8rem] flex-1">
              <Select value={aId} onValueChange={setAId} disabled={selectorsLocked}>
                <SelectTrigger id="player-a" frameColor={playerFrameColor(0)} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bit-button-slot flex w-10 shrink-0 items-center justify-center">
              <span className="retro text-[10px] text-muted-foreground">vs.</span>
            </div>
            <div className="bit-button-slot min-w-[8rem] flex-1">
              <Select value={bId} onValueChange={setBId} disabled={selectorsLocked}>
                <SelectTrigger id="player-b" frameColor={playerFrameColor(1)} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bit-button-slot shrink-0">
              {showPause ? (
                <Button
                  onClick={pause}
                  disabled={pausePending || terminal}
                  variant={pausePending ? 'secondary' : 'default'}
                  className="px-4"
                  aria-pressed={pausePending}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={onPlay}
                  disabled={terminal || (thinking !== null && !paused)}
                  className="px-4"
                >
                  {paused ? 'Resume' : 'Battle!'}
                </Button>
              )}
            </div>
            <div className="bit-button-slot shrink-0">
              <Button onClick={reset} variant="secondary" className="px-4">
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex w-full shrink-0 gap-4">
        <Card className={cn(fixedCard(MAIN_CARD_H), 'min-w-0 flex-1 !py-0')}>
          <CardContent className="flex min-h-0 flex-1 flex-col justify-center gap-5 overflow-y-auto px-6 py-2">
            {snapshot ? (
              <>
                <div className="flex shrink-0 justify-end">
                  <PokemonPanel
                    mon={snapshot.sideB.active}
                    nameClassName={playerTextClass(1)}
                    facing="front"
                    side={1}
                    moveVfx={moveVfx}
                  />
                </div>
                <div className="flex shrink-0 justify-start">
                  <PokemonPanel
                    mon={snapshot.sideA.active}
                    nameClassName={playerTextClass(0)}
                    facing="back"
                    side={0}
                    moveVfx={moveVfx}
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="retro text-center text-sm text-muted-foreground">
                  {phase === 'drafting' ? (
                    <>
                      Draft underway
                      <span className="thinking-dots" aria-hidden="true">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                      </span>
                    </>
                  ) : (
                    'Battle not started.'
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={cn(fixedCard(MAIN_CARD_H), 'min-w-0 flex-1 !py-0')}>
          <CardHeader className="shrink-0 py-3">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="retro flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
            <ActivityFeed log={log} />
          </CardContent>
        </Card>
      </div>

      <div className="flex w-full shrink-0 gap-4">
        <DraftColumn
          side={0}
          className={fixedCard(TEAM_CARD_H)}
          title={modelA.label}
          picks={picksA}
          team={snapshot?.sideA.team}
          activeDexNumber={snapshot?.sideA.active.dexNumber}
          thinking={thinking}
          pausePending={pausePending}
        />
        <DraftColumn
          side={1}
          className={fixedCard(TEAM_CARD_H)}
          title={modelB.label}
          picks={picksB}
          team={snapshot?.sideB.team}
          activeDexNumber={snapshot?.sideB.active.dexNumber}
          thinking={thinking}
          pausePending={pausePending}
        />
      </div>
    </div>
  )
}

function DraftColumn({
  title,
  picks,
  team,
  activeDexNumber,
  side,
  className,
  thinking,
  pausePending,
}: {
  title: string
  picks: { species: string; dexNumber: number }[]
  team?: TeamMemberView[]
  activeDexNumber?: number
  side: PlayerSide
  className?: string
  thinking: string | null
  pausePending: boolean
}) {
  const isThinking = thinking === title && !pausePending

  return (
    <Card className={cn('min-w-0 flex-1', className)}>
      <CardHeader className="shrink-0 py-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle
            className={cn(
              'min-w-0 truncate text-xs uppercase tracking-wider',
              playerTextClass(side),
            )}
          >
            {title}
          </CardTitle>
          <span className="retro shrink-0 text-[8px] text-muted-foreground">
            {isThinking ? (
              <>
                Thinking
                <span className="thinking-dots" aria-hidden="true">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </>
            ) : (
              'Ready'
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-0">
        <div className="flex w-full items-end gap-1">
          {Array.from({ length: TEAM_SIZE }, (_, i) => {
            const p = picks[i]
            if (!p) {
              return (
                <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="h-12 w-12 shrink-0" aria-hidden />
                  <div className="mt-1 flex max-w-full items-center justify-center" aria-hidden>
                    <span className="retro w-2 shrink-0 text-[8px] leading-none invisible">›</span>
                    <span className="retro text-[7px] leading-tight invisible">.</span>
                  </div>
                </div>
              )
            }

            const member = team?.find((m) => m.dexNumber === p.dexNumber)
            const fainted = member?.fainted ?? false
            const active = activeDexNumber === p.dexNumber
            return (
              <div
                key={i}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center transition-opacity',
                  fainted && 'opacity-35',
                )}
                title={
                  fainted
                    ? `${p.species} (fainted)`
                    : active
                      ? `${p.species} (in battle)`
                      : p.species
                }
              >
                <img
                  src={frontSprite(p.dexNumber)}
                  alt={p.species}
                  width={48}
                  height={48}
                  className="pixelated h-12 w-12 object-contain"
                />
                <div className="mt-1 flex max-w-full items-center justify-center">
                  <span
                    className={cn(
                      'retro w-2 shrink-0 text-center text-[8px] leading-none',
                      active ? playerTextClass(side) : 'invisible',
                    )}
                    aria-hidden={!active}
                  >
                    ›
                  </span>
                  <span
                    className={cn(
                      'retro truncate text-center text-[7px] leading-tight',
                      active ? playerTextClass(side) : 'text-muted-foreground',
                    )}
                  >
                    {p.species}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
