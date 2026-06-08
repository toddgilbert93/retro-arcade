import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/8bit/card'
import type { usePokerGame } from '@/hooks/usePokerGame'
import { POKER_IDLE_SNAPSHOT, PokerTable } from '@/components/poker/PokerTable'
import { PokerControls } from '@/components/poker/PokerControls'
import { PokerCommentaryFeed } from '@/components/poker/PokerCommentaryFeed'
import { BattleCardShader } from '@/components/pokemon/BattleCardShader'
import {
  gameLayoutGrid,
  gameLayoutLgOrder,
  gameLayoutPanelCard,
  gameLayoutPanelContent,
  gameLayoutPrimaryCol,
  gameLayoutSidebarCol,
} from '@/layout/gameLayout'
import { cn } from '@/lib/utils'

type PokerGameProps = {
  game: ReturnType<typeof usePokerGame>
}

export function PokerGame({ game }: PokerGameProps) {
  const {
    phase,
    snapshot,
    log,
    thinking,
    commentary,
    autoplay,
    pausePending,
    start,
    pause,
    resume,
    reset,
  } = game

  const terminal = phase === 'done' || phase === 'error'
  const started = phase !== 'idle'
  const paused = phase === 'playing' && !autoplay
  const showPause = autoplay || pausePending

  const onPlay = () => {
    if (paused) resume()
    else start()
  }

  return (
    <main className={cn(gameLayoutGrid, 'lg:items-stretch')}>
      <div className={cn(gameLayoutPrimaryCol, 'lg:h-full')}>
        <Card className={cn('order-2 relative min-w-0', gameLayoutLgOrder, gameLayoutPanelCard)}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          >
            <BattleCardShader />
          </div>
          <CardContent className={cn(gameLayoutPanelContent, 'relative z-10 px-4 py-2 lg:py-4')}>
            <PokerTable
              snapshot={snapshot ?? POKER_IDLE_SNAPSHOT}
              thinking={thinking}
              pausePending={pausePending}
              idle={!snapshot}
            />
          </CardContent>
        </Card>
      </div>

      <aside className={gameLayoutSidebarCol}>
        <div className={cn('order-1', gameLayoutLgOrder)}>
          <PokerControls
            showPause={showPause}
            pausePending={pausePending}
            terminal={terminal}
            thinking={thinking !== null}
            paused={paused}
            started={started}
            onPlay={onPlay}
            onPause={pause}
            onReset={reset}
          />
        </div>
        <Card className={cn('order-3 min-w-0', gameLayoutLgOrder)}>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Commentary
            </CardTitle>
          </CardHeader>
          <CardContent className="retro p-0">
            <PokerCommentaryFeed log={log} commentary={commentary} seats={snapshot?.seats} />
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}
