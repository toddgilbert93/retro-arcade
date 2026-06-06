import { parseChatCompletion, type ChatTransport } from '../players/chatTypes'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Headless transport that talks to OpenRouter directly (Node only). The browser uses
 * {@link proxyTransport}, whose relative `/api/openrouter/chat` URL only resolves against
 * the Vite middleware; the batch runner has no such server, so it injects this instead.
 *
 * Reuses {@link parseChatCompletion} so move extraction and error handling are identical
 * to the in-browser path.
 */
export function createDirectTransport(apiKey = process.env.OPENROUTER_API_KEY ?? ''): ChatTransport {
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set — required for the headless batch runner. ' +
        'Add it to .env (see .env.example) or export it in your shell.',
    )
  }
  return async (req) => {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Chess Sim (bench)',
      },
      body: JSON.stringify(req),
    })
    const text = await res.text()
    return parseChatCompletion(res.status, res.ok, text)
  }
}
