import { useState } from 'react'
import { Board } from './components/Board'
import { GameControls } from './components/GameControls'
import { Leaderboard } from './components/Leaderboard'
import { PokemonBattler } from './components/PokemonBattler'
import { MoveList } from './components/MoveList'
import { StatusPanel } from './components/StatusPanel'
import { Button } from '@/components/ui/8bit/button'
import { ThemePicker } from './components/ThemePicker'
import { useChessGame } from './hooks/useChessGame'
import { cn } from '@/lib/utils'

type Page = 'game' | 'battler'

export default function App() {
  const game = useChessGame()
  const { snapshot } = game
  const [page, setPage] = useState<Page>('battler')

  return (
    <div
      className={cn(
        'mx-auto max-w-6xl px-6 py-4',
        page === 'battler' && 'flex h-dvh flex-col',
      )}
    >
      <header className="mb-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="retro text-xl md:text-2xl">Arcade</h1>
            <nav className="bit-button-group mt-4 flex gap-2">
              <div className="bit-button-slot">
                <Button
                  variant={page === 'battler' ? 'default' : 'outline'}
                  onClick={() => setPage('battler')}
                >
                  Pokemon Battler
                </Button>
              </div>
              <div className="bit-button-slot">
                <Button
                  variant={page === 'game' ? 'default' : 'outline'}
                  onClick={() => setPage('game')}
                >
                  Chess
                </Button>
              </div>
            </nav>
          </div>
          <ThemePicker />
        </div>
      </header>

      {page === 'game' && snapshot && (
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

      {page === 'battler' && (
        <main className="min-h-0 w-full flex-1">
          <PokemonBattler />
        </main>
      )}
    </div>
  )
}
