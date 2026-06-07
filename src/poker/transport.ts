import { proxyTransport } from '@/players/chatTypes'
import type { PokerModelCaller } from './pokerAgent'

/**
 * Browser model caller for the poker agents. Routes through the same Vite proxy
 * the chess game and battler use (`/api/openrouter/chat`), so the OpenRouter key
 * stays server-side. Returns the raw assistant text; the agent parses/validates
 * it and falls back to a safe action on any error.
 */
export const proxyPokerCaller: PokerModelCaller = async (model, system, user, opts) => {
  const res = await proxyTransport({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: opts?.temperature ?? 0.7,
  })
  return res.content ?? ''
}
