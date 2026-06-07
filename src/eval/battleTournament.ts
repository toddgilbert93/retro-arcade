/**
 * Full round-robin Pokemon Battler tournament.
 *
 * With 4 models, every ordered pair plays once (A vs B and B vs A) = 12 matches.
 * Results are saved to results/battle-tournament.ndjson and public/battle-tournament.ndjson.
 *
 * Run:  npm run battle-tournament
 * Flags:
 *   --concurrency N   (default 2)
 *   --out <path>      (default results/battle-tournament.ndjson)
 *   --dry-run         print pairings and exit
 */
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { runMatch } from '@battler/agent/match.ts'
import { hasApiKey } from '@battler/agent/llm.ts'
import { callModel } from '@battler/agent/llm.ts'
import type { ModelCaller } from '@battler/agent/llmChooser.ts'
import { MODELS } from '@battler/agent/models.ts'
import {
  applyForfeit,
  applyWinLoss,
  finalizeStats,
  flag,
  initStats,
  loadDotEnv,
  printLeaderboard,
  recordTiming,
  roundRobinPairings,
  writeTournamentOutput,
} from './tournamentCommon'

interface BattleRecord {
  type: 'battleRecord'
  record: {
    modelAId: string
    modelBId: string
    winnerId: string
    turns: number
  }
}

function timingCaller(
  base: ModelCaller,
  modelId: string,
  stat: ReturnType<typeof initStats>,
): ModelCaller {
  return async (model, system, user, opts) => {
    const start = Date.now()
    try {
      return await base(model, system, user, opts)
    } finally {
      recordTiming(stat, modelId, Date.now() - start)
    }
  }
}

async function main(): Promise<void> {
  loadDotEnv()
  const argv = process.argv.slice(2)
  const concurrency = Number(flag(argv, 'concurrency', '2'))
  const outPath = resolve(process.cwd(), flag(argv, 'out', 'results/battle-tournament.ndjson')!)
  const dryRun = argv.includes('--dry-run')

  const ids = MODELS.map((m) => m.id)
  const pairings = roundRobinPairings(ids)
  const total = pairings.length

  console.log(`\nBattle tournament: ${ids.length} models → ${total} matches (full round-robin)`)
  console.log(`Concurrency: ${concurrency}  |  Output: ${outPath}\n`)
  console.log('Models:')
  for (const m of MODELS) console.log(`  ${m.id}`)

  if (!hasApiKey()) {
    console.warn(
      '\n⚠ OPENROUTER_API_KEY not set — matches will use heuristic AI instead of models.\n',
    )
  }

  if (dryRun) {
    console.log('\nPairings:')
    for (const p of pairings) console.log(`  ${p.aId}  vs  ${p.bId}`)
    console.log('\n--dry-run: exiting.')
    return
  }

  const stat = initStats(MODELS)
  const records: BattleRecord[] = []
  const startedAt = Date.now()
  let completed = 0

  let next = 0
  const worker = async (): Promise<void> => {
    while (true) {
      const i = next++
      if (i >= total) return
      const { aId, bId } = pairings[i]!
      const modelA = MODELS.find((m) => m.id === aId)!
      const modelB = MODELS.find((m) => m.id === bId)!

      try {
        const result = await runMatch({
          modelA,
          modelB,
          callerA: timingCaller(callModel, aId, stat),
          callerB: timingCaller(callModel, bId, stat),
        })

        const winnerId = result.winner === 0 ? aId : bId
        const loserId = result.winner === 0 ? bId : aId
        applyWinLoss(stat, winnerId, loserId)

        records.push({
          type: 'battleRecord',
          record: {
            modelAId: aId,
            modelBId: bId,
            winnerId,
            turns: result.turns,
          },
        })

        completed++
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0)
        console.log(
          `  [${completed}/${total}] ${modelA.label} vs ${modelB.label}` +
            ` → ${result.winnerModel.label} wins in ${result.turns} turns  (${elapsed}s elapsed)`,
        )
      } catch (e) {
        completed++
        applyForfeit(stat, bId, aId)
        console.error(
          `  [${completed}/${total}] ${modelA.label} vs ${modelB.label} → FORFEIT (${aId}):`,
          e instanceof Error ? e.message : String(e),
        )
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker))

  const elapsedS = Number(((Date.now() - startedAt) / 1000).toFixed(1))
  const models = finalizeStats(stat)

  console.log(`\nFinished in ${elapsedS}s`)
  printLeaderboard(models)

  writeTournamentOutput(
    outPath,
    'battle-tournament.ndjson',
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
