import { Chess } from 'chess.js'
import type { MoveContext } from '../engine/types'
import type { ChatResponse } from './chatTypes'

export type ParseSource = 'tool' | 'json' | 'tag' | 'san' | 'token' | 'extractor'

export type ParseResult =
  | { ok: true; uci: string; reasoning?: string; source: ParseSource; raw: string }
  | {
      ok: false
      reason: 'empty' | 'no_candidate' | 'malformed_json' | 'ambiguous'
      raw: string
    }

const MOVE_RE =
  /[a-h][1-8][a-h][1-8][qrbn]?|O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?/gi
const UCI_SHAPE = /^[a-h][1-8][a-h][1-8][qrbn]?$/
const TAG_RE = /(?:final\s+)?move\s*[:=]\s*([^\n]+)/gi
const REASONING_TAG_RE = /^reasoning\s*:\s*(.+)$/im
const REASONING_MAX_LEN = 400

const PROMPT_ECHO_PATTERNS = [
  /legal list/i,
  /you will receive/i,
  /choose the best move/i,
  /tactical notes/i,
  /\+---/,
  /\b[a-h1-8]+\/[a-h1-8]+\/[a-h1-8]+\//i,
]

/** Strip markdown and normalize common move notation variants. */
export function normalizeModelText(text: string): string {
  let s = text.trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  s = s.replace(/\*\*/g, '').replace(/`/g, '')
  s = s.replace(/([a-h][1-8])-([a-h][1-8])/gi, '$1$2')
  s = s.replace(/\b0-0-0\b/g, 'O-O-O').replace(/\b0-0\b/g, 'O-O')
  return s.trim()
}

function buildMaps(ctx: MoveContext) {
  const legalUci = new Set(ctx.legalMoves)
  const sanToUci = new Map((ctx.legalSan ?? []).map((san, i) => [san, ctx.legalMoves[i]]))
  return { legalUci, sanToUci }
}

function resolveMoveToken(
  token: string,
  legalUci: Set<string>,
  sanToUci: Map<string, string>,
): string | undefined {
  const low = token.toLowerCase().trim()
  if (UCI_SHAPE.test(low) && legalUci.has(low)) return low
  const stripped = token.replace(/[+#?!]*$/, '').trim()
  if (sanToUci.has(stripped)) return sanToUci.get(stripped)
  if (sanToUci.has(token.trim())) return sanToUci.get(token.trim())
  return undefined
}

function pickLegalFromSegment(
  segment: string,
  legalUci: Set<string>,
  sanToUci: Map<string, string>,
  preferLast: boolean,
): string | undefined {
  const tokens = segment.match(MOVE_RE) ?? []
  const ordered = preferLast ? [...tokens].reverse() : tokens
  for (const t of ordered) {
    const uci = resolveMoveToken(t, legalUci, sanToUci)
    if (uci) return uci
  }
  return undefined
}

function tryToolCall(response: ChatResponse, ctx: MoveContext): ParseResult | null {
  const call = response.toolCalls?.find((t) => t.name === 'play_move')
  if (!call) return null
  const raw = call.arguments
  try {
    const args = JSON.parse(raw) as { move?: string; reasoning?: string }
    if (!args.move) return null
    const { legalUci, sanToUci } = buildMaps(ctx)
    const uci = resolveMoveToken(args.move, legalUci, sanToUci)
    if (!uci) return null
    return {
      ok: true,
      uci,
      reasoning: args.reasoning,
      source: 'tool',
      raw: raw,
    }
  } catch {
    return null
  }
}

function tryJsonParse(text: string, ctx: MoveContext, raw: string): ParseResult | null {
  const normalized = normalizeModelText(text)
  const jsonMatch = normalized.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const obj = JSON.parse(jsonMatch[0]) as { move?: string | null; reasoning?: string }
    if (!obj.move) return { ok: false, reason: 'malformed_json', raw }
    const { legalUci, sanToUci } = buildMaps(ctx)
    const uci = resolveMoveToken(String(obj.move), legalUci, sanToUci)
    if (!uci) return null
    return { ok: true, uci, reasoning: obj.reasoning, source: 'json', raw }
  } catch {
    return { ok: false, reason: 'malformed_json', raw }
  }
}

export function extractTaggedReasoning(text: string): string | undefined {
  const match = text.match(REASONING_TAG_RE)
  return match?.[1]?.trim() || undefined
}

/** Trim, cap length, and reject prompt echoes before showing reasoning in the UI. */
export function sanitizeReasoning(text: string | undefined): string | undefined {
  if (!text?.trim()) return undefined
  const collapsed = text.replace(/\s+/g, ' ').trim()
  if (PROMPT_ECHO_PATTERNS.some((pattern) => pattern.test(collapsed))) return undefined
  if (collapsed.length <= REASONING_MAX_LEN) return collapsed
  return `${collapsed.slice(0, REASONING_MAX_LEN - 1).trimEnd()}…`
}

function tryTaggedLine(text: string, ctx: MoveContext, raw: string): ParseResult | null {
  const tags = [...text.matchAll(TAG_RE)]
  if (!tags.length) return null
  const { legalUci, sanToUci } = buildMaps(ctx)
  const uci = pickLegalFromSegment(tags[tags.length - 1][1], legalUci, sanToUci, false)
  if (!uci) return null
  return { ok: true, uci, reasoning: extractTaggedReasoning(text), source: 'tag', raw }
}

function tryChessJsSan(text: string, ctx: MoveContext, raw: string): ParseResult | null {
  const { legalUci } = buildMaps(ctx)
  const tokens = [...new Set(text.match(MOVE_RE) ?? [])]
  const candidates: string[] = []
  for (const token of tokens) {
    const chess = new Chess(ctx.fen)
    try {
      const m = chess.move(token, { strict: false })
      if (!m) continue
      const uci = m.from + m.to + (m.promotion ?? '')
      if (legalUci.has(uci)) candidates.push(uci)
    } catch {
      // not a valid move for this position
    }
  }
  if (candidates.length === 1) {
    return { ok: true, uci: candidates[0], source: 'san', raw }
  }
  if (candidates.length > 1) return { ok: false, reason: 'ambiguous', raw }
  return null
}

function tryTokenScan(text: string, ctx: MoveContext, raw: string): ParseResult | null {
  const { legalUci, sanToUci } = buildMaps(ctx)
  const uci = pickLegalFromSegment(text, legalUci, sanToUci, true)
  if (uci) return { ok: true, uci, source: 'token', raw }
  return null
}

/** Staged pipeline: tool → JSON → tagged line → chess.js SAN → token scan. */
export function parseModelResponse(response: ChatResponse, ctx: MoveContext): ParseResult {
  const content = response.content ?? ''
  const raw =
    content ||
    response.toolCalls?.map((t) => t.arguments).join(' ') ||
    ''

  if (!raw.trim() && !response.toolCalls?.length) {
    return { ok: false, reason: 'empty', raw: '' }
  }

  const normalized = normalizeModelText(content)

  const stages: (() => ParseResult | null)[] = [
    () => tryToolCall(response, ctx),
    () => tryJsonParse(normalized || content, ctx, raw),
    () => tryTaggedLine(normalized || content, ctx, raw),
    () => tryChessJsSan(normalized || content, ctx, raw),
    () => tryTokenScan(normalized || content, ctx, raw),
  ]

  for (const stage of stages) {
    const result = stage()
    if (result?.ok) return result
    if (result && !result.ok && result.reason === 'malformed_json') return result
    if (result && !result.ok && result.reason === 'ambiguous') return result
  }

  return { ok: false, reason: 'no_candidate', raw }
}

/** Show only contract-sourced reasoning (tag, JSON, or tool), never provider CoT. */
export function resolveDisplayedReasoning(
  result: Extract<ParseResult, { ok: true }>,
  _response: ChatResponse,
): string | undefined {
  return sanitizeReasoning(result.reasoning)
}

/** Mark a successful parse from the fallback extractor. */
export function withExtractorSource(result: ParseResult): ParseResult {
  if (result.ok) return { ...result, source: 'extractor' }
  return result
}

/** Back-compat wrapper for tests: parse plain text as if it were model content. */
export function parseMove(
  content: string,
  legalMoves: string[],
  legalSan: string[] = [],
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
): { uci: string; reasoning?: string } {
  const ctx: MoveContext = {
    fen,
    pgn: '',
    turn: 'w',
    legalMoves,
    legalSan,
    history: [],
    check: false,
    moveNumber: 1,
    attempt: 0,
  }
  const result = parseModelResponse({ content }, ctx)
  if (result.ok) {
    return {
      uci: result.uci,
      reasoning: resolveDisplayedReasoning(result, { content }),
    }
  }
  const shaped = [...(content.match(MOVE_RE) ?? [])]
    .reverse()
    .find((t) => UCI_SHAPE.test(t.toLowerCase()))
  return { uci: shaped?.toLowerCase() ?? content.trim() }
}
