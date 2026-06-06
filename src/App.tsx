import { useState } from 'react'
import { Board } from './components/Board'
import { GameControls } from './components/GameControls'
import { Leaderboard } from './components/Leaderboard'
import { PokemonBattler } from './components/PokemonBattler'
import { MoveList } from './components/MoveList'
import { StatusPanel } from './components/StatusPanel'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/8bit/tabs'
import { ThemePicker } from './components/ThemePicker'
import { useChessGame } from './hooks/useChessGame'
import { usePokemonBattle } from './hooks/usePokemonBattle'
type Page = 'game' | 'battler'

export default function App() {
  const game = useChessGame()
  const battle = usePokemonBattle()
  const { snapshot } = game
  const [page, setPage] = useState<Page>('battler')

  const handlePageChange = (value: string) => {
    const next = value as Page
    if (page === 'game' && next !== 'game') game.pause()
    if (page === 'battler' && next !== 'battler') battle.pause()
    setPage(next)
  }

  return (
    <Tabs
      value={page}
      onValueChange={handlePageChange}
      className="mx-auto max-w-5xl px-6 pb-4 pt-10"
    >
      <header className="mb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="retro text-xl md:text-2xl">Retro Arcade</h1>
            <TabsList className="mt-6 h-auto p-1">
              <TabsTrigger value="battler" className="px-4 py-2">
                Pokemon Battler
              </TabsTrigger>
              <TabsTrigger value="game" className="px-4 py-2">
                Chess
              </TabsTrigger>
            </TabsList>
          </div>
          <ThemePicker />
        </div>
      </header>

      <TabsContent value="game" className="mt-0">
        {snapshot && (
          <main className="grid items-start gap-6 lg:grid-cols-[minmax(320px,520px)_1fr]">
            <div className="flex w-full flex-col gap-4">
              <Board
                fen={snapshot.fen}
                lastMove={snapshot.lastMove}
                orientation="white"
              />
              <MoveList history={snapshot.history} />
            </div>

            <aside className="flex flex-col gap-4">
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
              <Leaderboard />
            </aside>
          </main>
        )}
      </TabsContent>

      <TabsContent value="battler" className="mt-0">
        <PokemonBattler battle={battle} />
      </TabsContent>
    </Tabs>
  )
}
