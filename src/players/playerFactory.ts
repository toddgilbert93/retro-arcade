import type { Player, Side } from '../engine/types'
import type { PlayerMeta } from '../engine/recordingTypes'
import type { ChatTransport, ProviderPreferences, ReasoningConfig } from './chatTypes'
import { ModelPlayer, type ModelPlayerOptions, type OutputMode } from './modelPlayer'
import { DEFAULT_EXTRACTOR_MODEL } from './moveExtractor'

/** A selectable model for either side. Edit this list to add models. */
export interface PlayerOption {
  id: string
  label: string
  /** OpenRouter model slug. */
  model: string
  /** Structured output mode; defaults to 'tools' (enum-constrained, fewest illegal moves). */
  outputMode?: OutputMode
  /** Provider routing override; open-weight models default to fastest-throughput routing. */
  provider?: ProviderPreferences
  /** Thinking-budget cap; undefined = provider default. Tune per model with `npm run bench`. */
  reasoning?: ReasoningConfig
}

export const DEFAULT_WHITE_MODEL_ID = 'm:openai/gpt-5.4-mini'
export const DEFAULT_BLACK_MODEL_ID = 'm:google/gemini-3.1-flash-lite'
/** @deprecated Use {@link DEFAULT_WHITE_MODEL_ID} / {@link DEFAULT_BLACK_MODEL_ID}. */
export const DEFAULT_MODEL_ID = DEFAULT_WHITE_MODEL_ID

export const PLAYER_OPTIONS: PlayerOption[] = [
  // OpenRouter models (slugs from https://openrouter.ai/models — edit freely):
  { id: 'm:openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', model: 'openai/gpt-5.4-mini' },
  { id: 'm:google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', model: 'google/gemini-3.1-flash-lite' },
  { id: 'm:x-ai/grok-4.3', label: 'Grok 4.3', model: 'x-ai/grok-4.3' },
  { id: 'm:anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', model: 'anthropic/claude-sonnet-4.6' },
]

const OPTIONS_BY_ID = new Map(PLAYER_OPTIONS.map((o) => [o.id, o]))

/**
 * Global thinking-budget cap. Left undefined so models keep their provider-default
 * behavior (zero quality regression, and fast models aren't forced to think). To cap
 * runaway thinkers, set e.g. `{ max_tokens: 2048 }` here or per-model on a PlayerOption,
 * then validate win-rate with `npm run bench` before lowering further.
 */
const DEFAULT_REASONING: ReasoningConfig | undefined = undefined

/** First-party single-endpoint providers — throughput routing has no benefit there. */
const FIRST_PARTY_PREFIXES = ['anthropic/', 'openai/', 'google/']

/**
 * Open-weight models are served by many providers at very different speeds. Routing to the
 * fastest endpoint serves the *same weights* faster — a quality-neutral latency win.
 */
function defaultProviderFor(model: string): ProviderPreferences | undefined {
  const firstParty = FIRST_PARTY_PREFIXES.some((p) => model.startsWith(p))
  return firstParty ? undefined : { sort: 'throughput' }
}

function outputModeForOption(opt: PlayerOption): OutputMode {
  return opt.outputMode ?? 'tools'
}

/**
 * Build a {@link ModelPlayer} for a selectable option. Pass `transport` to run headlessly
 * (the batch runner injects a direct-to-OpenRouter transport); omit it in the browser to
 * use the default Vite-proxy transport.
 */
export function makePlayer(id: string, side: Side, transport?: ChatTransport): Player {
  const who = side === 'w' ? 'White' : 'Black'
  const opt = OPTIONS_BY_ID.get(id)
  if (!opt) throw new Error(`Unknown player id: ${id}`)

  const options: ModelPlayerOptions = {
    provider: opt.provider ?? defaultProviderFor(opt.model),
    reasoning: opt.reasoning ?? DEFAULT_REASONING,
  }

  return new ModelPlayer(
    `${opt.label} (${who})`,
    opt.model,
    transport,
    outputModeForOption(opt),
    transport,
    DEFAULT_EXTRACTOR_MODEL,
    options,
  )
}

export function playerMeta(id: string, side: Side): PlayerMeta {
  const opt = OPTIONS_BY_ID.get(id)
  const who = side === 'w' ? 'White' : 'Black'
  if (!opt) return { name: who, id }
  return { name: `${opt.label} (${who})`, id: opt.id, model: opt.model }
}
