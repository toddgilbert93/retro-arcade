import { useState } from 'react'
import { Board } from './components/Board'
import { GameControls } from './components/GameControls'
import { PokemonBattler } from './components/PokemonBattler'
import { PokerGame } from './components/PokerGame'
import { Tournament } from './components/Tournament'
import { MoveList } from './components/MoveList'
import { StatusPanel } from './components/StatusPanel'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/8bit/tabs'
import { ThemePicker } from './components/ThemePicker'
import { AALogo } from './components/AALogo'
import { useChessGame } from './hooks/useChessGame'
import { usePokemonBattle } from './hooks/usePokemonBattle'
import { usePokerGame } from './hooks/usePokerGame'
import {
  gameLayoutGrid,
  gameLayoutPrimary,
  gameLayoutSidebar,
} from '@/layout/gameLayout'
type Page = 'game' | 'battler' | 'poker' | 'tournament'

/** Set false to pause games when leaving their tab (default behavior). */
const PAUSE_ON_TAB_SWITCH = false

export default function App() {
  const game = useChessGame()
  const battle = usePokemonBattle()
  const poker = usePokerGame()
  const { snapshot } = game
  const [page, setPage] = useState<Page>('battler')

  const handlePageChange = (value: string) => {
    const next = value as Page
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
      onValueChange={handlePageChange}
      className="mx-auto max-w-5xl px-6 pb-8 pt-10"
    >
      <header className="mb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1>
              <AALogo />
            </h1>
            <TabsList className="mt-8 h-auto p-1">
              <TabsTrigger value="battler" className="px-4 py-2">
                Pokemon Battler
              </TabsTrigger>
              <TabsTrigger value="game" className="px-4 py-2">
                Chess
              </TabsTrigger>
              <TabsTrigger value="poker" className="px-4 py-2">
                Poker
              </TabsTrigger>
              <TabsTrigger value="tournament" className="px-4 py-2">
                Tournament
              </TabsTrigger>
            </TabsList>
          </div>
          <ThemePicker />
        </div>
      </header>

      <TabsContent value="game" className="mt-0">
        {snapshot && (
          <main className={gameLayoutGrid}>
            <div className={gameLayoutPrimary}>
              <Board
                fen={snapshot.fen}
                lastMove={snapshot.lastMove}
                orientation="white"
              />
              <MoveList history={snapshot.history} />
            </div>

            <aside className={gameLayoutSidebar}>
              <GameControls
                snapshot={snapshot}
                whiteId={game.whiteId}
                blackId={game.blackId}
                onStart={game.start}
                onPause={game.pause}
                onReset={game.reset}
                onSetPlayerType={game.setPlayerType}
              />
              <StatusPanel snapshot={snapshot} />
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

      <TabsContent value="tournament" className="mt-0">
        <Tournament />
      </TabsContent>
    </Tabs>
  )
}
