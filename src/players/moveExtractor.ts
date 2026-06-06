import type { MoveContext } from '../engine/types'
import type { ChatTransport } from './chatTypes'
import { parseModelResponse, withExtractorSource, type ParseResult } from './parseMove'

export const DEFAULT_EXTRACTOR_MODEL = 'anthropic/claude-haiku-4.5'

/** Cheap LLM call to extract a UCI move when the primary parse pipeline fails. */
export async function tryFallbackExtractor(
  primaryResponse: { content?: string; toolCalls?: { arguments: string }[] },
  ctx: MoveContext,
  transport: ChatTransport,
  model = DEFAULT_EXTRACTOR_MODEL,
): Promise<ParseResult> {
  const rawText =
    primaryResponse.content ??
    primaryResponse.toolCalls?.map((t) => t.arguments).join('\n') ??
    ''

  const res = await transport({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Extract exactly one chess move from the assistant text. ' +
          'Return JSON only: {"move":"<uci from legal list>"} or {"move":null} if impossible.',
      },
      {
        role: 'user',
        content: `Legal moves (UCI): ${ctx.legalMoves.join(', ')}\n\nText:\n${rawText}`,
      },
    ],
    temperature: 0,
    max_tokens: 128,
    response_format: { type: 'json_object' },
  })

  const result = parseModelResponse(res, ctx)
  return withExtractorSource(result)
}
