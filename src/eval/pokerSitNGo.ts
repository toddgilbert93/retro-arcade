/**
 * Run one headless 4-player poker sit-n-go.
 *
 * Run:  npm run poker-sitngo
 * Flags:
 *   --seed N
 */
import { pathToFileURL } from 'node:url'
import { callModel } from '@battler/agent/llm.ts'
import { hasApiKey } from '@battler/agent/llm.ts'
import { MODELS } from '@battler/agent/models.ts'
import { flag, loadDotEnv } from './tournamentCommon'
import { runHeadlessSitNGo } from './pokerHeadless'

async function main(): Promise<void> {
  loadDotEnv()
  const argv = process.argv.slice(2)
  const seed = flag(argv, 'seed') ? Number(flag(argv, 'seed')) : undefined
  const playerIds = MODELS.map((m) => m.id)

  if (!hasApiKey()) {
    console.warn('⚠ OPENROUTER_API_KEY not set — agents may fall back to heuristics.\n')
  }

  console.log(`Sit-n-go: ${playerIds.map((id) => MODELS.find((m) => m.id === id)!.label).join(', ')}`)
  if (seed !== undefined) console.log(`Seed: ${seed}\n`)

  const result = await runHeadlessSitNGo(playerIds, {
    seed,
    onLog: (line) => console.log(line),
    caller: (slug, system, user, opts) =>
      callModel(slug, system, user, { ...opts, maxTokens: 600 }),
  })

  console.log(`\nWinner: ${result.winnerLabel} after ${result.hands} hands.`)
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
