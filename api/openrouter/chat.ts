// Vercel serverless function — the production counterpart to the Vite dev/preview
// proxy in vite.config.ts. The browser posts to `/api/openrouter/chat`; this handler
// injects the OPENROUTER_API_KEY server-side so it is never shipped to the client.
// Reads the key from the Vercel project env var (Production).

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'OPENROUTER_API_KEY is not set (configure it in Vercel project env vars).' },
      { status: 500 },
    )
  }

  try {
    const body = await req.text()
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://agentarcade.dev',
        'X-Title': 'Chess Sim',
      },
      body,
    })
    const text = await upstream.text()
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 })
  }
}
