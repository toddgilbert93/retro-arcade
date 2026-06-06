import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

let dotEnvLoaded = false;

/**
 * Minimal .env loader so `npm run arena` finds OPENROUTER_API_KEY without extra
 * tooling. Tries the battler/ dir then the repo root (parent), where the chess
 * game's key already lives. Ported from src/eval/batchRunner.ts.
 */
export function loadDotEnv(): void {
  if (dotEnvLoaded) return;
  dotEnvLoaded = true;
  for (const path of ['.env', '../.env']) {
    try {
      const text = readFileSync(resolve(process.cwd(), path), 'utf8');
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        const [, key, rawVal] = m;
        const val = rawVal!.replace(/^['"]|['"]$/g, '');
        if (!(key! in process.env)) process.env[key!] = val;
      }
    } catch {
      /* no .env at this path — try the next */
    }
  }
}

/** True if an OpenRouter API key is available (after loading .env). */
export function hasApiKey(): boolean {
  loadDotEnv();
  return Boolean(process.env.OPENROUTER_API_KEY);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Call an OpenRouter chat-completion and return the assistant message content.
 * Requests JSON output and retries a couple times on transient/network errors.
 * Throws on hard failure so callers can fall back to the heuristic AI.
 */
export async function callModel(
  model: string,
  system: string,
  user: string,
  opts: { maxTokens?: number; retries?: number; temperature?: number } = {},
): Promise<string> {
  loadDotEnv();
  const apiKey = process.env.OPENROUTER_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set (add it to .env or export it).');
  }

  const retries = opts.retries ?? 2;
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    max_tokens: opts.maxTokens ?? 800,
    temperature: opts.temperature ?? 0.7,
  });

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'Pokered Battler (arena)',
        },
        body,
      });
      const text = await res.text();
      if (!res.ok) {
        // 429/5xx are worth retrying; 4xx (other than 429) are not.
        if (res.status === 429 || res.status >= 500) {
          throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
        }
        throw Object.assign(new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`), {
          fatal: true,
        });
      }
      const data = JSON.parse(text);
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content || !content.trim()) {
        throw new Error(
          `empty response (finish_reason: ${data?.choices?.[0]?.finish_reason ?? 'unknown'})`,
        );
      }
      return content;
    } catch (e) {
      lastErr = e;
      if ((e as { fatal?: boolean }).fatal || attempt === retries) break;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
