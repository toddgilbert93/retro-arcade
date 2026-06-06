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
  gameLayoutPrimary,
  gameLayoutSidebar,
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
      <div className={cn(gameLayoutPrimary, 'lg:h-full')}>
        <div className={cn('shrink-0', pokemonBattleCardH)}>
        <Card className="relative h-full min-w-0 !py-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <BattleCardShader />
          </div>
          <CardContent className="relative z-10 flex min-h-0 flex-1 flex-col justify-center gap-5 overflow-y-auto px-6 py-2">
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
        </div>

        <Card className="flex min-h-0 min-w-0 flex-1 flex-col !gap-0 !py-0">
          <CardHeader className="shrink-0 pt-5 pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="retro flex min-h-0 flex-1 flex-col overflow-hidden pt-3 pb-4">
            <ActivityFeed log={log} />
          </CardContent>
        </Card>
      </div>

      <aside className={gameLayoutSidebar}>
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
        <DraftColumn
          side={0}
          title={modelA.label}
          picks={picksA}
          team={snapshot?.sideA.team}
          activeDexNumber={snapshot?.sideA.active.dexNumber}
          thinking={thinking}
          pausePending={pausePending}
        />
        <DraftColumn
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
}: {
  title: string
  picks: { species: string; dexNumber: number }[]
  team?: TeamMemberView[]
  activeDexNumber?: number
  side: PlayerSide
  thinking: string | null
  pausePending: boolean
}) {
  const isThinking = thinking === title && !pausePending

  return (
    <Card>
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
