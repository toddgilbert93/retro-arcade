/**
 * Full round-robin tournament runner.
 *
 * With 7 models, every ordered pair plays once (A as White vs B as Black, AND B as White
 * vs A as Black) = 42 games.  Results are saved to results/tournament.ndjson:
 *   line 1: { type: "meta", ... summary ... }
 *   lines 2+: { type: "gameRecord", record: GameRecord }
 *
 * Run:  npm run tournament
 * Flags:
 *   --concurrency N   (default 4)
 *   --out <path>      (default results/tournament.ndjson)
 *   --dry-run         print pairings and exit
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { GameController } from '../engine/gameController'
import { GameRecorder } from '../engine/gameRecorder'
import type { GameRecord } from '../engine/recordingTypes'
import { PLAYER_OPTIONS, makePlayer, playerMeta } from '../players/playerFactory'
import { createDirectTransport } from './directTransport'

interface Pairing { whiteId: string; blackId: string }

function roundRobinPairings(ids: string[]): Pairing[] {
  const pairs: Pairing[] = []
  for (let i = 0; i < ids.length; i++) {
    for (let j = 0; j < ids.length; j++) {
      if (i !== j) pairs.push({ whiteId: ids[i], blackId: ids[j] })
    }
  }
  return pairs
}

function runOneGame(
  whiteId: string,
  blackId: string,
  transport: ReturnType<typeof createDirectTransport>,
): Promise<GameRecord> {
  return new Promise((res) => {
    const controller = new GameController(
      makePlayer(whiteId, 'w', transport),
      makePlayer(blackId, 'b', transport),
      { moveDelayMs: 0, maxRetries: 2 },
    )
    const recorder = new GameRecorder(
      controller,
      playerMeta(whiteId, 'w'),
      playerMeta(blackId, 'b'),
      { onComplete: (record) => { recorder.detach(); res(record) } },
    )
    recorder.attach()
    controller.start()
  })
}

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
  } catch { /* no .env */ }
}

function flag(argv: string[], name: string, fallback?: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback
}

async function main(): Promise<void> {
  loadDotEnv()
  const argv = process.argv.slice(2)
  const concurrency = Number(flag(argv, 'concurrency', '4'))
  const outPath = resolve(process.cwd(), flag(argv, 'out', 'results/tournament.ndjson')!)
  const dryRun = argv.includes('--dry-run')

  const ids = PLAYER_OPTIONS.map((o) => o.id)
  const pairings = roundRobinPairings(ids)
  const total = pairings.length

  console.log(`\nTournament: ${ids.length} models → ${total} games (full round-robin)`)
  console.log(`Concurrency: ${concurrency}  |  Output: ${outPath}\n`)
  console.log('Models:')
  for (const o of PLAYER_OPTIONS) console.log(`  ${o.id}`)

  if (dryRun) {
    console.log('\nPairings:')
    for (const p of pairings) console.log(`  ${p.whiteId}  vs  ${p.blackId}`)
    console.log('\n--dry-run: exiting.')
    return
  }

  const transport = createDirectTransport()
  const records: GameRecord[] = []
  const startedAt = Date.now()
  let completed = 0

  // Bounded worker pool
  let next = 0
  const worker = async (): Promise<void> => {
    while (true) {
      const i = next++
      if (i >= total) return
      const { whiteId, blackId } = pairings[i]
      const record = await runOneGame(whiteId, blackId, transport)
      records.push(record)
      completed++

      const o = record.outcome
      const plies = record.moves.length
      const avgMs = plies
        ? Math.round(record.moves.reduce((s, m) => s + (m.durationMs ?? 0), 0) / plies)
        : 0
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0)
      console.log(
        `  [${completed}/${total}] ${whiteId.replace('m:', '')} (W) vs ${blackId.replace('m:', '')} (B)` +
          ` → ${o?.result ?? '?'}${o?.status === 'forfeit' ? ' FORFEIT' : ''}` +
          `  ${plies} plies  avg ${avgMs}ms/move  (${elapsed}s elapsed)`,
      )
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total) }, worker),
  )

  const elapsedS = Number(((Date.now() - startedAt) / 1000).toFixed(1))

  // Aggregate stats per model
  const stat = Object.fromEntries(
    PLAYER_OPTIONS.map((o) => [
      o.id,
      { id: o.id, label: o.label, games: 0, wins: 0, losses: 0, draws: 0, forfeits: 0, totalMs: 0, moves: 0 },
    ]),
  )

  for (const r of records) {
    const wId = r.white.id!
    const bId = r.black.id!
    if (stat[wId]) stat[wId].games++
    if (stat[bId]) stat[bId].games++

    const o = r.outcome
    if (!o) continue

    if (o.winner === 'w') {
      if (stat[wId]) stat[wId].wins++
      if (stat[bId]) stat[bId].losses++
    } else if (o.winner === 'b') {
      if (stat[bId]) stat[bId].wins++
      if (stat[wId]) stat[wId].losses++
    } else {
      if (stat[wId]) stat[wId].draws++
      if (stat[bId]) stat[bId].draws++
    }

    if (o.status === 'forfeit') {
      const forfeiter = o.winner === 'w' ? bId : wId
      if (stat[forfeiter]) stat[forfeiter].forfeits++
    }

    for (const move of r.moves) {
      const id = move.side === 'w' ? wId : bId
      if (stat[id] && move.durationMs != null) {
        stat[id].totalMs += move.durationMs
        stat[id].moves++
      }
    }
  }

  const models = Object.values(stat)
    .map((s) => ({
      id: s.id,
      label: s.label,
      games: s.games,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      forfeits: s.forfeits,
      winPct: s.games ? Math.round((s.wins / s.games) * 100) : 0,
      avgMoveDurationMs: s.moves ? Math.round(s.totalMs / s.moves) : 0,
    }))
    .sort((a, b) => b.winPct - a.winPct || b.wins - a.wins)

  console.log(`\nFinished in ${elapsedS}s`)
  console.log('\nLeaderboard:')
  console.log('  Model                     W   L   D  Forf  Win%  AvgMs/move')
  for (const m of models) {
    const label = m.label.padEnd(26)
    console.log(
      `  ${label} ${String(m.wins).padStart(2)}  ${String(m.losses).padStart(2)}  ` +
        `${String(m.draws).padStart(2)}  ${String(m.forfeits).padStart(3)}   ` +
        `${String(m.winPct).padStart(3)}%  ${m.avgMoveDurationMs}ms`,
    )
  }

  mkdirSync(dirname(outPath), { recursive: true })
  const lines: string[] = []
  lines.push(JSON.stringify({ type: 'meta', runAt: new Date().toISOString(), elapsedS, totalGames: records.length, models }))
  for (const r of records) lines.push(JSON.stringify({ type: 'gameRecord', record: r }))
  const body = lines.join('\n') + '\n'
  writeFileSync(outPath, body)
  console.log(`\nSaved ${records.length} records → ${outPath}`)

  // Also write to public/ so the leaderboard page can fetch it via the dev/preview server.
  const publicOut = resolve(process.cwd(), 'public/tournament.ndjson')
  writeFileSync(publicOut, body)
  console.log(`Also written → ${publicOut} (served by Vite as /tournament.ndjson)`)
}

const invokedDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? '').href
if (invokedDirectly) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
