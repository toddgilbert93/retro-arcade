import type { MoveContext, MoveDecision, Player } from '../engine/types'
import {
  type ChatMessage,
  type ChatRequest,
  type ChatTransport,
  type ProviderPreferences,
  type ReasoningConfig,
  playMoveTool,
  proxyTransport,
} from './chatTypes'
import { formatPositionForModel } from './formatPositionForModel'
import { ModelMoveError, truncateRaw } from './modelErrors'
import { lookupBookMove } from './openingBook'
import { buildSystemPrompt, buildUserMessage, type OutputMode } from './modelPrompts'
import { tryFallbackExtractor, DEFAULT_EXTRACTOR_MODEL } from './moveExtractor'
import { parseModelResponse, resolveDisplayedReasoning } from './parseMove'

export type { ChatTransport } from './chatTypes'
export type { OutputMode } from './modelPrompts'
export { parseMove, parseModelResponse } from './parseMove'
export { proxyTransport } from './chatTypes'

/** Per-model request tuning, threaded from {@link PlayerOption} into every request. */
export interface ModelPlayerOptions {
  /** Route to the fastest endpoint serving the same weights (e.g. `{ sort: 'throughput' }`). */
  provider?: ProviderPreferences
  /** Cap/shape thinking time. Leave undefined to use the provider default (no regression). */
  reasoning?: ReasoningConfig
}

/** Anthropic and Gemini honor explicit `cache_control` breakpoints; others cache automatically. */
function supportsExplicitCaching(model: string): boolean {
  return model.startsWith('anthropic/') || model.startsWith('google/')
}

/**
 * The system prompt is identical across every move and game, so mark it as a cache
 * breakpoint for providers that support explicit caching. (Benefit is bounded until the
 * cached prefix clears provider minimums — ~1024 tokens for Anthropic.)
 */
function systemContent(prompt: string, model: string): ChatMessage['content'] {
  if (supportsExplicitCaching(model)) {
    return [{ type: 'text', text: prompt, cache_control: { type: 'ephemeral' } }]
  }
  return prompt
}

function buildRequest(
  ctx: MoveContext,
  model: string,
  mode: OutputMode,
  options: ModelPlayerOptions = {},
): ChatRequest {
  const positionBlock = formatPositionForModel(ctx)
  const req: ChatRequest = {
    model,
    messages: [
      { role: 'system', content: systemContent(buildSystemPrompt(mode), model) },
      { role: 'user', content: buildUserMessage(ctx, positionBlock, mode) },
    ],
    temperature: 0,
    max_tokens: 4000,
    include_reasoning: true,
  }

  if (options.provider) req.provider = options.provider
  if (options.reasoning) req.reasoning = options.reasoning

  if (mode === 'tools') {
    req.tools = [playMoveTool(ctx.legalMoves)]
    req.tool_choice = 'auto'
  } else if (mode === 'json') {
    req.response_format = { type: 'json_object' }
  }

  return req
}

function isToolsUnsupportedError(e: unknown): boolean {
  const msg = String(e)
  return msg.includes('400') || msg.includes('tools') || msg.includes('tool')
}

/**
 * A model-backed player. Formats the {@link MoveContext} into a prompt, sends it
 * through a {@link ChatTransport} (the OpenRouter proxy by default), and parses
 * the reply into a {@link MoveDecision}. Parse/illegal failures throw
 * {@link ModelMoveError} for the controller's retry → forfeit logic.
 */
export class ModelPlayer implements Player {
  constructor(
    readonly name: string,
    private model: string,
    private transport: ChatTransport = proxyTransport,
    private outputMode: OutputMode = 'analysis',
    private extractorTransport: ChatTransport = proxyTransport,
    private extractorModel = DEFAULT_EXTRACTOR_MODEL,
    private options: ModelPlayerOptions = {},
  ) {}

  async getMove(ctx: MoveContext): Promise<MoveDecision> {
    const bookMove = lookupBookMove(ctx.fen, ctx.legalMoves)
    if (bookMove) {
      return { uci: bookMove, reasoning: 'Opening book.' }
    }

    let response
    let mode = this.outputMode

    try {
      response = await this.callWithMode(ctx, mode)
    } catch (e) {
      if (mode === 'tools' && isToolsUnsupportedError(e)) {
        response = await this.callWithMode(ctx, 'analysis')
      } else {
        throw e
      }
    }

    let result = parseModelResponse(response, ctx)
    if (!result.ok) {
      result = await tryFallbackExtractor(response, ctx, this.extractorTransport, this.extractorModel)
    }
    if (!result.ok) {
      throw new ModelMoveError('Could not parse move from model output', 'parse', truncateRaw(result.raw))
    }
    if (!ctx.legalMoves.includes(result.uci)) {
      throw new ModelMoveError(
        `"${result.uci}" is not a legal move`,
        'illegal',
        truncateRaw(result.raw),
        result.uci,
      )
    }
    return { uci: result.uci, reasoning: resolveDisplayedReasoning(result, response) }
  }

  private async callWithMode(ctx: MoveContext, mode: OutputMode) {
    return this.transport(buildRequest(ctx, this.model, mode, this.options))
  }
}
