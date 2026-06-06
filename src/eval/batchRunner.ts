/**
 * Headless tournament runner. Plays N games of a fixed matchup *concurrently* against
 * OpenRouter — no browser, no Vite proxy — reusing the same GameController + GameRecorder
 * the UI uses. This is the throughput multiplier for evals and the loop used to tune the
 * per-model reasoning caps in playerFactory.
 *
 * Run it:
 *   npm run bench -- --white m:anthropic/claude-haiku-4.5 --black m:openai/gpt-5.4-mini \
 *                    --games 10 --concurrency 4 --out bench.ndjson
 *
 * Defaults: 4 games of the default model vs. itself at concurrency 2, colors swapped.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { GameController, type ControllerConfig } from '../engine/gameController'
import { GameRecorder } from '../engine/gameRecorder'
import type { GameRecord } from '../engine/recordingTypes'
import type { ChatTransport } from '../players/chatTypes'
import {
  DEFAULT_BLACK_MODEL_ID,
  DEFAULT_WHITE_MODEL_ID,
  PLAYER_OPTIONS,
  makePlayer,
  playerMeta,
} from '../players/playerFactory'
import { createDirectTransport } from './directTransport'

export interface BatchConfig {
  /** PLAYER_OPTIONS id for White (or whoever leads game 0 when swapColors is on). */
  whiteId: string
  /** PLAYER_OPTIONS id for Black. */
  blackId: string
  games: number
  /** Max games in flight at once (respect OpenRouter rate limits; ~4–8 is sane). */
  concurrency: number
  /** Alternate which model plays White each game for a fair head-to-head. */
  swapColors?: boolean
  controllerConfig?: Partial<ControllerConfig>
  /** Inject a transport (tests/fakes); defaults to a direct-to-OpenRouter transport. */
  transport?: ChatTransport
  /** Optional progress callback, fired as each game finishes. */
  onGameComplete?: (record: GameRecord, done: number, total: number) => void
}

export interface BatchSummary {
  games: number
  whiteWins: number
  blackWins: number
  draws: number
  /** Games that ended in a forfeit (also counted toward the winner's tally). */
  forfeits: number
  /** Decisive wins keyed by PLAYER_OPTIONS id — color-independent when swapColors is on. */
  winsById: Record<string, number>
}

export interface BatchResult {
  records: GameRecord[]
  summary: BatchSummary
}

/** Plays a single game to its terminal state and resolves with the recorded game. */
function runOneGame(
  whiteId: string,
  blackId: string,
  transport: ChatTransport,
  controllerConfig?: Partial<ControllerConfig>,
): Promise<GameRecord> {
  return new Promise((resolvePromise) => {
    const controller = new GameController(
      makePlayer(whiteId, 'w', transport),
      makePlayer(blackId, 'b', transport),
      { moveDelayMs: 0, ...controllerConfig },
    )
    const recorder = new GameRecorder(controller, playerMeta(whiteId, 'w'), playerMeta(blackId, 'b'), {
      onComplete: (record) => {
        recorder.detach()
        resolvePromise(record)
      },
    })
    recorder.attach()
    controller.start()
  })
}

/** Bounded worker pool: runs `count` tasks, at most `concurrency` at a time, preserving order. */
async function runPool<T>(
  count: number,
  concurrency: number,
  task: (index: number) => Promise<T>,
): Promise<T[]> {
  const results = new Array<T>(count)
  let next = 0
  const worker = async () => {
    while (true) {
      const i = next++
      if (i >= count) return
      results[i] = await task(i)
    }
  }
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, count)) }, worker)
  await Promise.all(workers)
  return results
}

function bump(map: Record<string, number>, id?: string): void {
  if (!id) return
  map[id] = (map[id] ?? 0) + 1
}

function summarize(records: GameRecord[]): BatchSummary {
  const summary: BatchSummary = {
    games: records.length,
    whiteWins: 0,
    blackWins: 0,
    draws: 0,
    forfeits: 0,
    winsById: {},
  }
  for (const r of records) {
    const o = r.outcome
    if (!o) continue
    if (o.status === 'forfeit') summary.forfeits++
    if (o.winner === 'w') {
      summary.whiteWins++
      bump(summary.winsById, r.white.id)
    } else if (o.winner === 'b') {
      summary.blackWins++
      bump(summary.winsById, r.black.id)
    } else {
      summary.draws++
    }
  }
  return summary
}

/** Run a batch of games concurrently and return every record plus an aggregate summary. */
export async function runBatch(config: BatchConfig): Promise<BatchResult> {
  const transport = config.transport ?? createDirectTransport()
  const total = config.games
  let done = 0

  const records = await runPool(total, config.concurrency, async (i) => {
    const swap = config.swapColors && i % 2 === 1
    const w = swap ? config.blackId : config.whiteId
    const b = swap ? config.whiteId : config.blackId
    const record = await runOneGame(w, b, transport, config.controllerConfig)
    done++
    config.onGameComplete?.(record, done, total)
    return record
  })

  return { records, summary: summarize(records) }
}

// --- CLI ------------------------------------------------------------------

/** Minimal .env loader so `npm run bench` finds OPENROUTER_API_KEY without extra tooling. */
function loadDotEnv(): void {
  try {
    const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/)
      if (!m) continue
      const [, key, rawVal] = m
      const val = rawVal.replace(/^['"]|['"]$/g, '')
      if (!(key in process.env)) process.env[key] = val
    }
  } catch {
    /* no .env file — fall back to the real environment */
  }
}

function flag(argv: string[], name: string, fallback?: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback
}

function resolveId(input: string): string {
  if (PLAYER_OPTIONS.some((o) => o.id === input)) return input
  const byModel = PLAYER_OPTIONS.find((o) => o.model === input || o.id === `m:${input}`)
  if (byModel) return byModel.id
  const ids = PLAYER_OPTIONS.map((o) => o.id).join('\n  ')
  throw new Error(`Unknown model "${input}". Available ids:\n  ${ids}`)
}

async function main(): Promise<void> {
  loadDotEnv()
  const argv = process.argv.slice(2)
  const whiteId = resolveId(flag(argv, 'white', DEFAULT_WHITE_MODEL_ID)!)
  const blackId = resolveId(flag(argv, 'black', DEFAULT_BLACK_MODEL_ID)!)
  const games = Number(flag(argv, 'games', '4'))
  const concurrency = Number(flag(argv, 'concurrency', '2'))
  const swapColors = flag(argv, 'no-swap') === undefined
  const out = flag(argv, 'out')

  console.log(
    `Running ${games} game(s): ${whiteId} vs ${blackId} ` +
      `(concurrency ${concurrency}${swapColors ? ', colors swapped' : ''})…`,
  )
  const startedAt = Date.now()

  const { records, summary } = await runBatch({
    whiteId,
    blackId,
    games,
    concurrency,
    swapColors,
    onGameComplete: (record, doneCount, total) => {
      const o = record.outcome
      console.log(
        `  [${doneCount}/${total}] ${record.white.id} (W) vs ${record.black.id} (B) → ` +
          `${o?.result ?? '?'}${o?.status === 'forfeit' ? ' (forfeit)' : ''}, ${record.moves.length} plies`,
      )
    },
  })

  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`\nDone in ${elapsedS}s`)
  console.log(JSON.stringify(summary, null, 2))

  if (out) {
    const body = records.map((r) => JSON.stringify({ type: 'gameRecord', record: r })).join('\n') + '\n'
    writeFileSync(resolve(process.cwd(), out), body)
    console.log(`\nWrote ${records.length} game record(s) to ${out}`)
  }
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
