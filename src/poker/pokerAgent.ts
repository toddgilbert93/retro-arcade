import type { Holdem } from './engine/holdem'
import { describePokerState, rulesPrimer } from './serialize'
import type { ActionRecord, LegalActions, PokerAction, Seat } from './types'

/**
 * Sends a system+user prompt to a model and returns the raw reply text.
 * Injected so the same agent works with the browser proxy transport or a Node
 * client. (Mirrors the battler's ModelCaller contract.)
 */
export type PokerModelCaller = (
  model: string,
  system: string,
  user: string,
  opts?: { temperature?: number },
) => Promise<string>

export type Logger = (line: string) => void

/** Extract the first JSON object from a model reply (tolerates fences/prose). */
function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return null
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

function asNumber(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Safe default when the model errors or returns something illegal. */
function heuristicAction(la: LegalActions, reasoning: string): PokerAction {
  if (la.canCheck) return { type: 'check', reasoning }
  return { type: 'fold', reasoning }
}

/**
 * Validate/normalize a parsed model reply into a legal action. Clamps bet/raise
 * amounts into range and degrades gracefully (e.g. check instead of an illegal
 * fold). Returns null if nothing usable could be extracted.
 */
export function normalizeAction(
  obj: Record<string, unknown>,
  la: LegalActions,
): PokerAction | null {
  const raw = String(obj.action ?? '').toLowerCase().replace(/[\s_]+/g, '-')
  const reasoning =
    typeof obj.reasoning === 'string' ? obj.reasoning : undefined
  const amount = asNumber(obj.amount)
  const clamp = (n: number) => Math.round(Math.min(Math.max(n, la.minRaiseTo), la.maxRaiseTo))

  switch (raw) {
    case 'fold':
      if (la.canFold) return { type: 'fold', reasoning }
      if (la.canCheck) return { type: 'check', reasoning }
      return null
    case 'check':
      if (la.canCheck) return { type: 'check', reasoning }
      if (la.canCall) return { type: 'call', reasoning }
      return null
    case 'call':
      if (la.canCall) return { type: 'call', reasoning }
      if (la.canCheck) return { type: 'check', reasoning }
      return null
    case 'bet':
      if (la.canBet && amount !== null) return { type: 'bet', amount: clamp(amount), reasoning }
      if (la.canBet) return { type: 'bet', amount: la.minRaiseTo, reasoning }
      return null
    case 'raise':
      if (la.canRaise && amount !== null) return { type: 'raise', amount: clamp(amount), reasoning }
      if (la.canRaise) return { type: 'raise', amount: la.minRaiseTo, reasoning }
      if (la.canBet && amount !== null) return { type: 'bet', amount: clamp(amount), reasoning }
      return null
    case 'all-in':
      if (la.canAllIn) return { type: 'all-in', reasoning }
      return null
    default:
      return null
  }
}

export interface PokerAgent {
  decide(h: Holdem, seat: Seat, history: ActionRecord[]): Promise<PokerAction>
}

/** An LLM-driven poker agent. Falls back to a safe action on any failure. */
export function makePokerAgent(
  model: string,
  call: PokerModelCaller,
  log?: Logger,
): PokerAgent {
  return {
    async decide(h, seat, history) {
      const la = h.legalActions(seat)
      const label = h.label(seat)
      try {
        const user = describePokerState(h, seat, history)
        const reply = await call(model, rulesPrimer(), user)
        const obj = parseJsonObject(reply)
        if (!obj) {
          log?.(`[fallback] ${label}: unparseable reply`)
          return heuristicAction(la, 'Defaulting after an unreadable response.')
        }
        const action = normalizeAction(obj, la)
        if (!action) {
          log?.(`[fallback] ${label}: illegal action "${String(obj.action)}"`)
          return heuristicAction(la, 'Defaulting after an illegal action.')
        }
        return action
      } catch (e) {
        log?.(`[fallback] ${label}: ${e instanceof Error ? e.message : String(e)}`)
        return heuristicAction(la, 'Defaulting after a request error.')
      }
    },
  }
}
