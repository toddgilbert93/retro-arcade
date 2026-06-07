/**
 * Headless 4-player poker sit-n-go tournament.
 *
 * Runs multiple full sit-n-gos with the roster models, rotating the starting
 * dealer each game. Results are saved to results/poker-tournament.ndjson and
 * public/poker-tournament.ndjson.
 *
 * Run:  npm run poker-tournament
 * Flags:
 *   --games N         (default 4 — one sit-n-go per dealer seat)
 *   --concurrency N   (default 1 — each sit-n-go is one long sequential game)
 *   --out <path>      (default results/poker-tournament.ndjson)
 *   --dry-run         print plan and exit
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { callModel } from '@battler/agent/llm.ts'
import { hasApiKey } from '@battler/agent/llm.ts'
import { MODELS } from '@battler/agent/models.ts'
import type { PokerModelCaller } from '../poker/pokerAgent'
import { runHeadlessSitNGo } from './pokerHeadless'
import {
  finalizeStats,
  flag,
  initStats,
  loadDotEnv,
  printLeaderboard,
  recordTiming,
  writeTournamentOutput,
} from './tournamentCommon'

interface PokerRecord {
  type: 'pokerRecord'
  record: {
    playerIds: string[]
    winnerId: string
    hands: number
    seed: number
  }
}

function timingCaller(
  base: PokerModelCaller,
  modelId: string,
  stat: ReturnType<typeof initStats>,
): PokerModelCaller {
  return async (model, system, user, opts) => {
    const start = Date.now()
    try {
      return await base(model, system, user, opts)
    } finally {
      recordTiming(stat, modelId, Date.now() - start)
    }
  }
}

function applySitNGoResult(
  stat: ReturnType<typeof initStats>,
  playerIds: string[],
  winnerId: string,
): void {
  for (const id of playerIds) {
    if (!stat[id]) continue
    stat[id].games++
    if (id === winnerId) stat[id].wins++
    else stat[id].losses++
  }
}

const DEFAULT_GAMES = 4

async function main(): Promise<void> {
  loadDotEnv()
  const argv = process.argv.slice(2)
  const playerIds = MODELS.map((m) => m.id)
  const games = Number(flag(argv, 'games', String(DEFAULT_GAMES)))
  const concurrency = Number(flag(argv, 'concurrency', '1'))
  const outPath = resolve(process.cwd(), flag(argv, 'out', 'results/poker-tournament.ndjson')!)
  const dryRun = argv.includes('--dry-run')

  console.log(`\nPoker tournament: ${playerIds.length} models → ${games} sit-n-go(s)`)
  console.log(`Concurrency: ${concurrency}  |  Output: ${outPath}\n`)
  console.log('Models:')
  for (const m of MODELS) console.log(`  ${m.id}`)

  if (!hasApiKey()) {
    console.warn(
      '\n⚠ OPENROUTER_API_KEY not set — agents will fall back to safe heuristics on errors.\n',
    )
  }

  if (dryRun) {
    console.log('\nSit-n-go schedule:')
    for (let i = 0; i < games; i++) {
      console.log(`  Game ${i + 1}: dealer seat ${i % playerIds.length}`)
    }
    console.log('\n--dry-run: exiting.')
    return
  }

  const stat = initStats(MODELS)
  const records: PokerRecord[] = []
  const startedAt = Date.now()
  let completed = 0

  const callers = playerIds.map((id) =>
    timingCaller(
      (slug, system, user, opts) =>
        callModel(slug, system, user, { ...opts, maxTokens: 600 }),
      id,
      stat,
    ),
  )

  const runOne = async (gameIndex: number): Promise<void> => {
    const seed = 1000 + gameIndex
    const result = await runHeadlessSitNGo(playerIds, { seed, callers })

    applySitNGoResult(stat, playerIds, result.winnerId)

    records.push({
      type: 'pokerRecord',
      record: {
        playerIds: result.playerIds,
        winnerId: result.winnerId,
        hands: result.hands,
        seed,
      },
    })

    completed++
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0)
    console.log(
      `  [${completed}/${games}] ${result.winnerLabel} wins after ${result.hands} hands  (${elapsed}s elapsed)`,
    )
  }

  let next = 0
  const worker = async (): Promise<void> => {
    while (true) {
      const i = next++
      if (i >= games) return
      try {
        await runOne(i)
      } catch (e) {
        completed++
        console.error(
          `  [${completed}/${games}] sit-n-go ${i + 1} failed:`,
          e instanceof Error ? e.message : String(e),
        )
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, games) }, worker))

  const elapsedS = Number(((Date.now() - startedAt) / 1000).toFixed(1))
  const models = finalizeStats(stat)

  console.log(`\nFinished in ${elapsedS}s`)
  printLeaderboard(models)

  writeTournamentOutput(
    outPath,
    'poker-tournament.ndjson',
    {
      runAt: new Date().toISOString(),
      elapsedS,
      totalGames: records.length,
      models,
    },
    records,
  )
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
