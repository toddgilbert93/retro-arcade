import { parseAssistantMessage } from './messageText'

/** A text block; the array form lets us attach `cache_control` for prompt caching. */
export interface ContentBlock {
  type: 'text'
  text: string
  /** Mark this block as a caching breakpoint (Anthropic/Gemini honor it; others ignore it). */
  cache_control?: { type: 'ephemeral' }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentBlock[]
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/** OpenRouter provider routing preferences. See https://openrouter.ai/docs/guides/routing/provider-selection */
export interface ProviderPreferences {
  /** `throughput` serves the same weights from the fastest endpoint (equivalent to the `:nitro` slug). */
  sort?: 'throughput' | 'latency' | 'price'
  /** Explicit provider priority order (disables load balancing). */
  order?: string[]
  /** Keep true so an unavailable preferred provider degrades gracefully. */
  allow_fallbacks?: boolean
}

/** OpenRouter unified reasoning control. See https://openrouter.ai/docs/guides/best-practices/reasoning-tokens */
export interface ReasoningConfig {
  /** Budget as a fraction of max_tokens: minimal 0.1, low 0.2, medium 0.5, high 0.8. */
  effort?: 'minimal' | 'low' | 'medium' | 'high'
  /** Absolute thinking-token ceiling (floor 1024). Must stay below the request `max_tokens`. */
  max_tokens?: number
  /** Reason internally but omit the chain-of-thought from the response. */
  exclude?: boolean
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  /** Ask OpenRouter to return reasoning fields when the model supports them. */
  include_reasoning?: boolean
  /** Cap/shape how much the model thinks before answering. */
  reasoning?: ReasoningConfig
  /** Route to a specific provider / fastest endpoint for the same model. */
  provider?: ProviderPreferences
  response_format?: { type: 'json_object' }
  tools?: ToolDefinition[]
  tool_choice?: 'auto' | { type: 'function'; function: { name: string } }
}

export interface ChatResponse {
  content?: string
  /** Provider chain-of-thought, when returned separately from content. */
  reasoning?: string
  toolCalls?: { name: string; arguments: string }[]
  finishReason?: string
}

/** Sends a chat request and returns structured assistant output. Injectable for tests. */
export type ChatTransport = (req: ChatRequest) => Promise<ChatResponse>

/**
 * Turns a raw OpenRouter chat-completion HTTP response into a {@link ChatResponse}.
 * Shared by {@link proxyTransport} (browser) and the headless direct transport so
 * both apply identical content/reasoning/tool-call extraction and error handling.
 */
export function parseChatCompletion(status: number, ok: boolean, text: string): ChatResponse {
  if (!ok) {
    throw new Error(`OpenRouter ${status}: ${text.slice(0, 300)}`)
  }
  const data = JSON.parse(text)
  const choice = data?.choices?.[0]
  const message = choice?.message
  const { content, reasoning } = parseAssistantMessage(message)
  const textForParsing = content ?? reasoning
  const toolCalls = message?.tool_calls?.map(
    (tc: { function: { name: string; arguments: string } }) => ({
      name: tc.function.name,
      arguments: tc.function.arguments,
    }),
  )
  if (!textForParsing && (!toolCalls || toolCalls.length === 0)) {
    if (choice?.finish_reason === 'length') {
      throw new Error(
        'model hit the token limit before producing a move (likely a reasoning ' +
          'model — raise max_tokens or lower the reasoning budget)',
      )
    }
    throw new Error(
      `no text content (finish_reason: ${choice?.finish_reason ?? 'unknown'}): ${text.slice(0, 200)}`,
    )
  }
  return {
    content: textForParsing,
    reasoning,
    toolCalls,
    finishReason: choice?.finish_reason,
  }
}

/** Default transport: posts to the Vite proxy, which adds the OpenRouter key. */
export const proxyTransport: ChatTransport = async (req) => {
  const res = await fetch('/api/openrouter/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  const text = await res.text()
  return parseChatCompletion(res.status, res.ok, text)
}

export function playMoveTool(legalMoves: string[]): ToolDefinition {
  return {
    type: 'function',
    function: {
      name: 'play_move',
      description: 'Submit the chosen chess move for this position.',
      parameters: {
        type: 'object',
        properties: {
          move: {
            type: 'string',
            enum: legalMoves,
            description: 'UCI move from the legal list (e.g. e2e4, g1f3).',
          },
          reasoning: {
            type: 'string',
            description: 'One short sentence explaining the choice.',
          },
        },
        required: ['move'],
      },
    },
  }
}
