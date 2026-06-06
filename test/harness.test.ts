// Headless verification of the harness logic (run with `npx tsx test/harness.test.ts`).
import { Chess } from 'chess.js'
import { GameController } from '../src/engine/gameController'
import { GameRecorder } from '../src/engine/gameRecorder'
import { RandomPlayer } from '../src/players/randomPlayer'
import { IllegalPlayer } from '../src/players/illegalPlayer'
import {
  ModelPlayer,
  parseMove,
  parseModelResponse,
} from '../src/players/modelPlayer'
import { resolveDisplayedReasoning, sanitizeReasoning } from '../src/players/parseMove'
import { ModelMoveError } from '../src/players/modelErrors'
import { formatPositionForModel } from '../src/players/formatPositionForModel'
import { parseAssistantMessage } from '../src/players/messageText'
import type { ChatTransport } from '../src/players/chatTypes'
import type { GameSnapshot, MoveContext, MoveDecision, Player } from '../src/engine/types'

/** Plays a fixed list of UCI moves in order — for deterministic game tests. */
class ScriptedPlayer implements Player {
  readonly name = 'Scripted'
  private i = 0
  constructor(private moves: string[]) {}
  async getMove(_ctx: MoveContext): Promise<MoveDecision> {
    return { uci: this.moves[this.i++] }
  }
}

/** A passive opponent that never moves — keeps the position fixed after our side's move. */
class IdlePlayer implements Player {
  readonly name = 'Idle'
  getMove(_ctx: MoveContext): Promise<MoveDecision> {
    return new Promise<MoveDecision>(() => {})
  }
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function baseCtx(overrides: Partial<MoveContext> = {}): MoveContext {
  return {
    fen: START_FEN,
    pgn: '',
    turn: 'w',
    legalMoves: ['e2e4', 'g1f3', 'd2d4'],
    legalSan: ['e4', 'Nf3', 'd4'],
    history: [],
    check: false,
    moveNumber: 1,
    attempt: 0,
    ...overrides,
  }
}

let passed = 0
let failed = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) { passed++; console.log(`  ok   ${name}`) }
  else { failed++; console.error(`  FAIL ${name} ${detail}`) }
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function testCheckmate() {
  console.log('checkmate detection (Fool\'s mate):')
  const white = new ScriptedPlayer(['f2f3', 'g2g4'])
  const black = new ScriptedPlayer(['e7e5', 'd8h4'])
  const c = new GameController(white, black, { moveDelayMs: 0, maxRetries: 2 })
  let last: GameSnapshot | null = null
  c.subscribe((s) => (last = s))
  c.start()
  for (let i = 0; i < 40 && last!.status !== 'checkmate'; i++) await wait(10)
  const s = last!
  check('status is checkmate', s.status === 'checkmate', s.status)
  check('black wins (0-1)', s.result === '0-1', s.result)
  check('history matches Fool\'s mate', s.history.join(' ') === 'f3 e5 g4 Qh4#', s.history.join(' '))
}

async function testRandomGameTerminates() {
  console.log('random vs random terminates:')
  const c = new GameController(new RandomPlayer(), new RandomPlayer(), { moveDelayMs: 0, maxRetries: 2 })
  let last: GameSnapshot | null = null
  c.subscribe((s) => (last = s))
  c.start()
  const terminal = ['checkmate', 'stalemate', 'draw']
  for (let i = 0; i < 1200 && !terminal.includes(last!.status); i++) await wait(25)
  check('reached a natural terminal state', terminal.includes(last!.status), last!.status)
  check('result is a valid score', ['1-0', '0-1', '1/2-1/2'].includes(last!.result), last!.result)
}

async function testForfeit() {
  console.log('forfeit after retries:')
  const c = new GameController(new IllegalPlayer(), new RandomPlayer(), { moveDelayMs: 0, maxRetries: 2 })
  let last: GameSnapshot | null = null
  c.subscribe((s) => (last = s))
  c.start()
  await wait(50)
  check('status is forfeit', last!.status === 'forfeit', last!.status)
  check('black wins (0-1)', last!.result === '0-1', last!.result)
  check('logged 3 attempts (maxRetries+1)', last!.attempts.length === 3, String(last!.attempts.length))
  check('forfeit reason present', !!last!.forfeitReason)
  check('illegal attempts logged with kind', last!.attempts.every((a) => a.kind === 'illegal'))
}

function testModelParsing() {
  console.log('model output parsing:')
  const legal = ['e2e4', 'g1f3', 'd2d4']
  const san = ['e4', 'Nf3', 'd4']

  const json = parseModelResponse(
    { content: '{"reasoning":"Develop.","move":"g1f3"}' },
    baseCtx(),
  )
  check('parses JSON move', json.ok && json.ok && json.uci === 'g1f3', json.ok ? json.uci : 'fail')

  const tool = parseModelResponse(
    {
      toolCalls: [{ name: 'play_move', arguments: '{"move":"e2e4","reasoning":"Central"}' }],
    },
    baseCtx(),
  )
  check('parses tool call', tool.ok && tool.uci === 'e2e4', tool.ok ? tool.uci : 'fail')

  const a = parseMove('Reasoning: Develop the knight.\nMove: g1f3', legal)
  check('reads the tagged answer line', a.uci === 'g1f3', a.uci)
  check('reads the Reasoning tag', a.reasoning === 'Develop the knight.', a.reasoning)

  const b = parseMove('Reasoning: Prefer the knight.\nMove: g1f3', legal)
  check('tagged choice beats mentioned moves', b.uci === 'g1f3', b.uci)

  const b2 = parseMove('I considered e2e4 but will instead play d2d4.', legal)
  check('untagged falls back to last legal move', b2.uci === 'd2d4', b2.uci)
  check('untagged omits reasoning', b2.reasoning === undefined, String(b2.reasoning))

  const c = parseMove('Move: a1a2', legal)
  check('passes through illegal-but-UCI-shaped token for the harness to reject', c.uci === 'a1a2', c.uci)

  const d = parseMove('Recapture the pawn.\nMove: exd3', ['e2e4', 'g1f3', 'e2d3'], ['e4', 'Nf3', 'exd3'])
  check('maps a legal SAN answer back to UCI', d.uci === 'e2d3', d.uci)

  const md = parseModelResponse({ content: '```json\n{"move":"Nf3"}\n```' }, baseCtx())
  check('parses markdown-wrapped JSON with SAN', md.ok && md.uci === 'g1f3', md.ok ? md.uci : 'fail')

  const plus = parseModelResponse({ content: '{"move":"Nf3+"}' }, baseCtx())
  check('parses SAN with check suffix', plus.ok && plus.uci === 'g1f3', plus.ok ? plus.uci : 'fail')

  const hyphen = parseModelResponse({ content: '{"move":"e2-e4"}' }, baseCtx())
  check('normalizes hyphenated UCI', hyphen.ok && hyphen.uci === 'e2e4', hyphen.ok ? hyphen.uci : 'fail')

  const analysis = parseModelResponse(
    { content: 'Reasoning: The center looks strong; I will develop the knight.\nMove: g1f3' },
    baseCtx(),
  )
  check('parses analysis-mode Move tag', analysis.ok && analysis.uci === 'g1f3', analysis.ok ? analysis.uci : 'fail')
  check(
    'extracts Reasoning tag only',
    analysis.ok && analysis.reasoning === 'The center looks strong; I will develop the knight.',
    analysis.ok ? analysis.reasoning : 'fail',
  )

  const legacyProse = parseModelResponse(
    { content: 'The center looks strong.\nI will develop the knight.\nMove: g1f3' },
    baseCtx(),
  )
  check('legacy prose before Move tag still parses move', legacyProse.ok && legacyProse.uci === 'g1f3', legacyProse.ok ? legacyProse.uci : 'fail')
  check(
    'legacy prose before Move tag omits reasoning',
    legacyProse.ok && legacyProse.reasoning === undefined,
    legacyProse.ok ? String(legacyProse.reasoning) : 'fail',
  )

  const dualTag = parseModelResponse(
    { content: 'Reasoning: Develop.\nMove: g1f3' },
    baseCtx(),
  )
  check('dual-tag move', dualTag.ok && dualTag.uci === 'g1f3', dualTag.ok ? dualTag.uci : 'fail')
  check('dual-tag reasoning', dualTag.ok && dualTag.reasoning === 'Develop.', dualTag.ok ? dualTag.reasoning : 'fail')

  const noReasoning = parseModelResponse({ content: 'Move: g1f3' }, baseCtx())
  check('move without Reasoning tag parses', noReasoning.ok && noReasoning.uci === 'g1f3', noReasoning.ok ? noReasoning.uci : 'fail')
  check('move without Reasoning tag omits reasoning', noReasoning.ok && noReasoning.reasoning === undefined, String(noReasoning.reasoning))

  const providerResponse = {
    content: 'Reasoning: Develop the knight.\nMove: g1f3',
    reasoning: 'Long internal chain of thought that should never appear in the UI.',
  }
  const providerCoT = parseModelResponse(providerResponse, baseCtx())
  const displayed =
    providerCoT.ok ? resolveDisplayedReasoning(providerCoT, providerResponse) : undefined
  check(
    'provider CoT not shown when Reasoning tag present',
    displayed === 'Develop the knight.',
    String(displayed),
  )

  check(
    'prompt-echo reasoning omitted',
    sanitizeReasoning('Choose the best move from the legal list.') === undefined,
    String(sanitizeReasoning('Choose the best move from the legal list.')),
  )
}

function testMessageText() {
  console.log('parseAssistantMessage:')
  const plain = parseAssistantMessage({
    content: 'Move: e2e4',
    reasoning: 'Control the center with the pawn.',
  })
  check('reads reasoning field', plain.reasoning === 'Control the center with the pawn.', plain.reasoning)
  check('reads content separately', plain.content === 'Move: e2e4', plain.content)

  const details = parseAssistantMessage({
    content: [{ type: 'text', text: 'Move: g1f3' }],
    reasoning_details: [{ type: 'reasoning.text', text: 'Develop the knight.' }],
  })
  check('reads array content', details.content === 'Move: g1f3', details.content)
  check('reads reasoning_details text', details.reasoning === 'Develop the knight.', details.reasoning)
}

function testFormatPosition() {
  console.log('formatPositionForModel:')
  const chess = new Chess()
  const verbose = chess.moves({ verbose: true })
  const startCtx = baseCtx({
    legalMoves: verbose.map((m) => m.from + m.to + (m.promotion ?? '')),
    legalSan: verbose.map((m) => m.san),
  })
  const out = formatPositionForModel(startCtx)
  check('includes ASCII board', out.includes('+---'))
  check('includes FEN metadata', out.includes('Castling:') && out.includes('En passant:'))
  check('includes numbered movetext placeholder', out.includes('first move'))
  check('does not include raw PGN headers', !out.includes('[Event'))
  check('groups legal moves when >15', out.includes('pawn:'))
  check('includes material balance', out.includes('Material:') && out.includes('Balance:'))
  check('includes tactical notes', out.includes('Tactical notes:'))
  check('includes annotated legal moves', out.includes('(e2e4)'))

  const mid = formatPositionForModel(
    baseCtx({
      history: ['e4', 'e5', 'Nf3'],
      moveNumber: 2,
      turn: 'b',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/5N2/8/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
      legalMoves: ['g8f6'],
      legalSan: ['Nf6'],
    }),
  )
  check('shows opponent last move in SAN', mid.includes("Opponent's last move: Nf3"))
  check('shows numbered movetext', mid.includes('1. e4 e5 2. Nf3'))
}

async function testModelPlayerOpeningBook() {
  console.log('model player opening book:')
  let transportCalled = false
  const transport: ChatTransport = async () => {
    transportCalled = true
    return { content: 'Move: d2d4' }
  }
  const player = new ModelPlayer('Book', 'x/y', transport, 'analysis', transport)
  const decision = await player.getMove(baseCtx())
  check('opening book returns e4 at start', decision.uci === 'e2e4', decision.uci)
  check('opening book skips transport', transportCalled === false, String(transportCalled))
  check('opening book reasoning surfaced', decision.reasoning === 'Opening book.', decision.reasoning)
}

async function testModelPlayerAnalysisMode() {
  console.log('model player analysis mode:')
  const fake: ChatTransport = async () => ({
    content: 'Reasoning: The knight develops with tempo.\nMove: g8f6',
  })
  const player = new ModelPlayer('Analysis', 'x/y', fake, 'analysis', fake)
  const decision = await player.getMove(
    baseCtx({
      history: ['e4', 'e5', 'Nf3'],
      moveNumber: 2,
      turn: 'b',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/5N2/8/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
      legalMoves: ['g8f6', 'b8c6', 'd7d6'],
      legalSan: ['Nf6', 'Nc6', 'd6'],
    }),
  )
  check('analysis-mode move parsed as Nf6', decision.uci === 'g8f6', decision.uci)
  check(
    'analysis-mode Reasoning tag surfaced',
    decision.reasoning === 'The knight develops with tempo.',
    decision.reasoning,
  )

  const legacyFake: ChatTransport = async () => ({
    content: 'The knight develops with tempo.\nMove: g8f6',
    reasoning: 'Internal chain of thought.',
  })
  const legacyPlayer = new ModelPlayer('Legacy', 'x/y', legacyFake, 'analysis', legacyFake)
  const legacyDecision = await legacyPlayer.getMove(
    baseCtx({
      history: ['e4', 'e5', 'Nf3'],
      moveNumber: 2,
      turn: 'b',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/5N2/8/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
      legalMoves: ['g8f6', 'b8c6', 'd7d6'],
      legalSan: ['Nf6', 'Nc6', 'd6'],
    }),
  )
  check('legacy format move still parses', legacyDecision.uci === 'g8f6', legacyDecision.uci)
  check('legacy format omits reasoning', legacyDecision.reasoning === undefined, String(legacyDecision.reasoning))
}

async function testModelPlayer() {
  console.log('model player (fake transport):')
  const fake: ChatTransport = async () => ({
    content: '{"reasoning":"Solid opening.","move":"e2e4"}',
  })
  const c = new GameController(new ModelPlayer('Fake', 'x/y', fake, 'json', fake), new IdlePlayer(), {
    moveDelayMs: 0,
    maxRetries: 2,
  })
  let last: GameSnapshot | null = null
  c.subscribe((s) => (last = s))
  c.start()
  for (let i = 0; i < 40 && last!.history.length < 1; i++) await wait(10)
  check('model move applied as e4', last!.history[0] === 'e4', last!.history[0])
  check('reasoning surfaced', !!last!.lastReasoning, String(last!.lastReasoning))

  const bad: ChatTransport = async () => ({ content: 'my move: z9z9' })
  const c2 = new GameController(new ModelPlayer('Bad', 'x/y', bad, 'json', bad), new RandomPlayer(), {
    moveDelayMs: 0,
    maxRetries: 2,
  })
  let last2: GameSnapshot | null = null
  c2.subscribe((s) => (last2 = s))
  c2.start()
  for (let i = 0; i < 40 && last2!.status !== 'forfeit'; i++) await wait(10)
  check('model forfeits on persistent unparseable output', last2!.status === 'forfeit', last2!.status)
  check('parse failures logged with kind', last2!.attempts.some((a) => a.kind === 'parse'))
}

async function testModelPlayerFallback() {
  console.log('model player fallback extractor:')
  const primary: ChatTransport = async () => ({ content: 'I like the king pawn.' })
  const extractor: ChatTransport = async () => ({
    content: '{"move":"e2e4"}',
  })
  const c = new GameController(
    new ModelPlayer('Fallback', 'x/y', primary, 'json', extractor),
    new IdlePlayer(),
    { moveDelayMs: 0, maxRetries: 2 },
  )
  let last: GameSnapshot | null = null
  c.subscribe((s) => (last = s))
  c.start()
  for (let i = 0; i < 40 && last!.history.length < 1; i++) await wait(10)
  check('fallback extractor supplies e4', last!.history[0] === 'e4', last!.history[0])
}

async function testModelPlayerToolsMode() {
  console.log('model player tools mode:')
  let toolWired = false
  let providerWired = false
  const fake: ChatTransport = async (req) => {
    toolWired = req.tools?.some((t) => t.function.name === 'play_move') ?? false
    providerWired = req.provider?.sort === 'throughput'
    return { toolCalls: [{ name: 'play_move', arguments: '{"move":"g8f6","reasoning":"Develop."}' }] }
  }
  const player = new ModelPlayer('Tools', 'deepseek/deepseek-v4-flash', fake, 'tools', fake, undefined, {
    provider: { sort: 'throughput' },
  })
  const decision = await player.getMove(
    baseCtx({
      history: ['e4', 'e5', 'Nf3'],
      moveNumber: 2,
      turn: 'b',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/5N2/8/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
      legalMoves: ['g8f6', 'b8c6', 'd7d6'],
      legalSan: ['Nf6', 'Nc6', 'd6'],
    }),
  )
  check('tools mode wires the play_move tool', toolWired)
  check('provider routing passed through to the request', providerWired)
  check('tools-mode move parsed from tool call', decision.uci === 'g8f6', decision.uci)
  check('tools-mode reasoning surfaced', decision.reasoning === 'Develop.', decision.reasoning)
}

async function testModelMoveErrorIllegal() {
  console.log('ModelMoveError illegal:')
  let caught: ModelMoveError | null = null
  const player = new ModelPlayer(
    'Illegal',
    'x/y',
    async () => ({ content: '{"move":"a1a2"}' }),
    'json',
    async () => ({ content: '{"move":"a1a2"}' }),
  )
  try {
    await player.getMove(
      baseCtx({
        history: ['e4', 'e5', 'Nf3'],
        moveNumber: 2,
        turn: 'b',
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/5N2/8/PPPP1PPP/RNBQKB1R b KQkq - 2 2',
        legalMoves: ['g8f6', 'b8c6', 'd7d6'],
        legalSan: ['Nf6', 'Nc6', 'd6'],
      }),
    )
  } catch (e) {
    if (e instanceof ModelMoveError) caught = e
  }
  check('throws ModelMoveError', caught instanceof ModelMoveError)
  check('kind is parse (move not in legal list)', caught?.kind === 'parse')
}

async function testGameRecorder() {
  console.log('game recorder export:')
  const white = new ScriptedPlayer(['e2e4', 'g1f3'])
  const black = new ScriptedPlayer(['e7e5', 'b8c6'])
  const c = new GameController(white, black, { moveDelayMs: 0, maxRetries: 2 })
  const recorder = new GameRecorder(
    c,
    { name: 'Scripted White' },
    { name: 'Scripted Black' },
  )
  recorder.attach()
  c.start()
  for (let i = 0; i < 40 && !recorder.isComplete(); i++) await wait(10)

  const record = recorder.getRecord()
  check('recorder marked complete', recorder.isComplete())
  check('recorded 4 plies', record.moves.length === 4, String(record.moves.length))
  check('first move is e4', record.moves[0]?.san === 'e4', record.moves[0]?.san)
  check('first move has UCI', record.moves[0]?.uci === 'e2e4', record.moves[0]?.uci)
  check('forfeits once the scripted moves run out', record.outcome?.status === 'forfeit', String(record.outcome?.status))

  const json = JSON.parse(recorder.toJSON()) as { moves: unknown[]; pgn: string }
  check('json export parses', Array.isArray(json.moves) && json.moves.length === 4)
  check('pgn present in record', record.pgn.length > 0)

  const ndLines = recorder.toNdjson().trim().split('\n')
  check('ndjson has game + move lines', ndLines.length >= 5, String(ndLines.length))
  check('ndjson first line is game header', (JSON.parse(ndLines[0]!) as { type: string }).type === 'game')

  recorder.detach()
}

async function testGameRecorderForfeit() {
  console.log('game recorder forfeit attempts:')
  const c = new GameController(new IllegalPlayer(), new RandomPlayer(), { moveDelayMs: 0, maxRetries: 2 })
  const recorder = new GameRecorder(c, { name: 'Illegal' }, { name: 'Random' })
  recorder.attach()
  c.start()
  await wait(80)

  const record = recorder.getRecord()
  check('forfeit outcome recorded', record.outcome?.status === 'forfeit', record.outcome?.status)
  check('trailing attempts captured', (record.outcome?.trailingAttempts.length ?? 0) === 3, String(record.outcome?.trailingAttempts.length))
  check('ndjson includes outcome line', recorder.toNdjson().includes('"type":"outcome"'))

  recorder.detach()
}

async function main() {
  testModelParsing()
  testMessageText()
  testFormatPosition()
  await testModelPlayerOpeningBook()
  await testModelPlayerAnalysisMode()
  await testModelPlayer()
  await testModelPlayerFallback()
  await testModelPlayerToolsMode()
  await testModelMoveErrorIllegal()
  await testCheckmate()
  await testRandomGameTerminates()
  await testForfeit()
  await testGameRecorder()
  await testGameRecorderForfeit()
  console.log(`\n${passed} passed, ${failed} failed`)
  process.exit(failed === 0 ? 0 : 1)
}
main()
