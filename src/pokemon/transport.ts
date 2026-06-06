import { proxyTransport } from '@/players/chatTypes'
import type { ModelCaller } from '@battler/agent/llmChooser.ts'

/**
 * Browser model caller for the battler agents. Routes through the same Vite
 * proxy the chess game uses (`/api/openrouter/chat`), so the OpenRouter key
 * stays server-side. Returns the raw assistant text; the agents parse/validate
 * it and fall back to the heuristic AI on any error.
 */
export const proxyModelCaller: ModelCaller = async (model, system, user, opts) => {
  const res = await proxyTransport({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 800,
    temperature: opts?.temperature ?? 0.7,
  })
  return res.content ?? ''
}
