import { Leaderboard } from './Leaderboard'
import { OverallLeaderboard } from './OverallLeaderboard'

const LEADERBOARDS = [
  {
    title: 'Pokemon Battler',
    dataUrl: '/battle-tournament.ndjson',
    runCommand: 'npm run battle-tournament',
  },
  {
    title: 'Chess',
    dataUrl: '/tournament.ndjson',
    runCommand: 'npm run tournament',
  },
  {
    title: 'Poker',
    dataUrl: '/poker-tournament.ndjson',
    runCommand: 'npm run poker-tournament',
  },
] as const

export function Tournament() {
  return (
    <main className="flex flex-col gap-6">
      <OverallLeaderboard />
      {LEADERBOARDS.map((board) => (
        <Leaderboard key={board.dataUrl} {...board} />
      ))}
    </main>
  )
}
