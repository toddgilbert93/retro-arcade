import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Board } from './components/Board'
import { GameControls } from './components/GameControls'
import { PokemonBattler } from './components/PokemonBattler'
import { PokerGame } from './components/PokerGame'
import { Tournament } from './components/Tournament'
import { MoveList } from './components/MoveList'
import { StatusPanel } from './components/StatusPanel'
import { Tabs, TabsContent } from '@/components/ui/8bit/tabs'
import { HeaderLogoRow } from './components/HeaderLogoRow'
import { PageNav, useNavCompact, type Page } from './components/PageNav'
import { useChessGame } from './hooks/useChessGame'
import { usePokemonBattle } from './hooks/usePokemonBattle'
import { usePokerGame } from './hooks/usePokerGame'
import {
  gameLayoutGrid,
  gameLayoutLgOrder,
  gameLayoutPrimaryCol,
  gameLayoutSidebarCol,
} from '@/layout/gameLayout'

/** Set false to pause games when leaving their tab (default behavior). */
const PAUSE_ON_TAB_SWITCH = true

export default function App() {
  const game = useChessGame()
  const battle = usePokemonBattle()
  const poker = usePokerGame()
  const { snapshot } = game
  const [page, setPage] = useState<Page>('battler')
  const { compact: navCompact, containerRef: navContainerRef, measureNode: navMeasure } =
    useNavCompact()

  const handlePageChange = (next: Page) => {
    if (PAUSE_ON_TAB_SWITCH) {
      if (page === 'game' && next !== 'game') game.pause()
      if (page === 'battler' && next !== 'battler') battle.pause()
      if (page === 'poker' && next !== 'poker') poker.pause()
    }
    setPage(next)
  }

  return (
    <Tabs
      value={page}
      onValueChange={(value) => handlePageChange(value as Page)}
      className="mx-auto max-w-5xl px-6 pb-8 pt-10"
    >
      <header ref={navContainerRef} className="relative mb-4 shrink-0">
        {navMeasure}
        <HeaderLogoRow showThemePicker={!navCompact} />
        <PageNav value={page} onChange={handlePageChange} compact={navCompact} />
      </header>

      <TabsContent value="game" className="mt-0">
        {snapshot && (
          <main className={gameLayoutGrid}>
            <div className={gameLayoutPrimaryCol}>
              <div className={cn('order-2', gameLayoutLgOrder)}>
                <Board
                  fen={snapshot.fen}
                  lastMove={snapshot.lastMove}
                  orientation="white"
                />
              </div>
              <div className={cn('order-4', gameLayoutLgOrder)}>
                <MoveList history={snapshot.history} />
              </div>
            </div>

            <aside className={gameLayoutSidebarCol}>
              <div className={cn('order-1', gameLayoutLgOrder)}>
                <GameControls
                  snapshot={snapshot}
                  whiteId={game.whiteId}
                  blackId={game.blackId}
                  onStart={game.start}
                  onPause={game.pause}
                  onReset={game.reset}
                  onSetPlayerType={game.setPlayerType}
                />
              </div>
              <div className={cn('order-3', gameLayoutLgOrder)}>
                <StatusPanel snapshot={snapshot} />
              </div>
            </aside>
          </main>
        )}
      </TabsContent>

      <TabsContent value="battler" className="mt-0">
        <PokemonBattler battle={battle} />
      </TabsContent>

      <TabsContent value="poker" className="mt-0">
        <PokerGame game={poker} />
      </TabsContent>

      <TabsContent value="tournament" forceMount className="mt-0">
        <Tournament />
      </TabsContent>
    </Tabs>
  )
}
