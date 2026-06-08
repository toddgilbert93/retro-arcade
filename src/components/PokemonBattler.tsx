import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import { DEFAULT_MODEL_A_ID, DEFAULT_MODEL_B_ID, MODELS } from '@battler/agent/models.ts'
import { TEAM_SIZE } from '@battler/agent/draft.ts'
import type { usePokemonBattle } from '@/hooks/usePokemonBattle'
import { frontSprite } from '@/pokemon/sprites'
import type { PlayerSide, TeamMemberView } from '@/pokemon/types'
import { playerTextClass } from '@/pokemon/playerColors'
import { ActivityFeed } from '@/components/pokemon/ActivityFeed'
import { BattleCardShader } from '@/components/pokemon/BattleCardShader'
import { PokemonPanel } from '@/components/pokemon/battleParts'
import { BattleControls } from '@/components/BattleControls'
import {
  gameLayoutGrid,
  gameLayoutLgOrder,
  gameLayoutPanelCard,
  gameLayoutPanelContent,
  gameLayoutPanelStretch,
  gameLayoutPrimaryCol,
  gameLayoutSidebarCol,
  pokemonBattleCardH,
} from '@/layout/gameLayout'
import { cn } from '@/lib/utils'

type PokemonBattlerProps = {
  battle: ReturnType<typeof usePokemonBattle>
}

export function PokemonBattler({ battle }: PokemonBattlerProps) {
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
    <main className={cn(gameLayoutGrid, 'lg:items-stretch')}>
      <div className={cn(gameLayoutPrimaryCol, 'lg:h-full')}>
        <div className={cn('order-2 shrink-0', gameLayoutLgOrder, pokemonBattleCardH)}>
        <Card className="relative min-w-0 !py-0 sm:h-full">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <BattleCardShader />
          </div>
          <CardContent className="relative z-10 flex min-h-28 flex-1 flex-col justify-between gap-1 overflow-hidden px-3 py-1 sm:min-h-0 sm:gap-2 sm:px-6 sm:py-2">
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
                    'Press Battle to start.'
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>

        <Card className={cn('order-3', gameLayoutLgOrder, gameLayoutPanelStretch, gameLayoutPanelCard)}>
          <CardHeader className="shrink-0 pt-5 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className={cn(gameLayoutPanelContent, 'retro overflow-hidden pt-3 pb-2')}>
            <ActivityFeed log={log} />
          </CardContent>
        </Card>
      </div>

      <aside className={gameLayoutSidebarCol}>
        <div className={cn('order-1', gameLayoutLgOrder)}>
          <BattleControls
            aId={aId}
            bId={bId}
            selectorsLocked={selectorsLocked}
            showPause={showPause}
            pausePending={pausePending}
            terminal={terminal}
            thinking={thinking !== null}
            paused={paused}
            onAIdChange={setAId}
            onBIdChange={setBId}
            onPlay={onPlay}
            onPause={pause}
            onReset={reset}
          />
        </div>
        <DraftColumn
          className={cn('order-4', gameLayoutLgOrder)}
          side={0}
          title={modelA.label}
          picks={picksA}
          team={snapshot?.sideA.team}
          activeDexNumber={snapshot?.sideA.active.dexNumber}
          thinking={thinking}
          pausePending={pausePending}
        />
        <DraftColumn
          className={cn('order-5', gameLayoutLgOrder)}
          side={1}
          title={modelB.label}
          picks={picksB}
          team={snapshot?.sideB.team}
          activeDexNumber={snapshot?.sideB.active.dexNumber}
          thinking={thinking}
          pausePending={pausePending}
        />
      </aside>
    </main>
  )
}

function DraftColumn({
  title,
  picks,
  team,
  activeDexNumber,
  side,
  thinking,
  pausePending,
  className,
}: {
  title: string
  picks: { species: string; dexNumber: number }[]
  team?: TeamMemberView[]
  activeDexNumber?: number
  side: PlayerSide
  thinking: string | null
  pausePending: boolean
  className?: string
}) {
  const isThinking = thinking === title && !pausePending

  return (
    <Card className={className}>
      <CardHeader className="shrink-0 overflow-hidden py-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <CardTitle
            className={cn(
              'min-w-0 flex-1 truncate text-xs uppercase tracking-wider',
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
      <CardContent className="pt-0">
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
