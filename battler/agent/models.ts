/**
 * The selectable model roster. Mirrors the chess game's PLAYER_OPTIONS
 * (src/players/playerFactory.ts) so the two harnesses offer the same models,
 * kept as a self-contained copy to keep this package dependency-free.
 * Edit slugs from https://openrouter.ai/models as desired.
 */
export interface ArenaModel {
  /** Internal id (prefixed 'm:'), as used by the chess game. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** OpenRouter model slug used for the API call. */
  model: string;
}

export const DEFAULT_MODEL_A_ID = 'm:openai/gpt-5.4-mini';
export const DEFAULT_MODEL_B_ID = 'm:google/gemini-3.1-flash-lite';

export const MODELS: ArenaModel[] = [
  { id: 'm:openai/gpt-5.4-mini', label: 'GPT-5.4 Mini', model: 'openai/gpt-5.4-mini' },
  { id: 'm:google/gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', model: 'google/gemini-3.1-flash-lite' },
  { id: 'm:x-ai/grok-4.3', label: 'Grok 4.3', model: 'x-ai/grok-4.3' },
  { id: 'm:anthropic/claude-sonnet-4.6', label: 'Claude Sonnet 4.6', model: 'anthropic/claude-sonnet-4.6' },
];

/** Pretty multi-line list of available models, for CLI help / errors. */
export function modelListHelp(): string {
  return MODELS.map((m) => `  ${m.id}  (${m.label})`).join('\n');
}

/**
 * Resolve a model from an id, full slug, or bare slug. Throws with the
 * available list if the identifier doesn't match any known model.
 */
export function resolveModel(idOrSlug: string): ArenaModel {
  const needle = idOrSlug.trim();
  const found =
    MODELS.find((m) => m.id === needle) ??
    MODELS.find((m) => m.model === needle) ??
    MODELS.find((m) => `m:${m.model}` === needle) ??
    MODELS.find((m) => m.label.toLowerCase() === needle.toLowerCase());
  if (!found) {
    throw new Error(
      `Unknown model "${idOrSlug}". Available models:\n${modelListHelp()}`,
    );
  }
  return found;
}
