import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Dev/preview-server middleware that proxies chat-completion requests to
 * OpenRouter, injecting the API key server-side so it is never shipped to the
 * browser. The client posts to `/api/openrouter/chat`.
 */
function openRouterProxy(apiKey: string): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.end('Method Not Allowed')
      return
    }
    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'OPENROUTER_API_KEY is not set (see .env.example).' }))
      return
    }
    try {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk as Buffer)
      const body = Buffer.concat(chunks).toString('utf8')

      const upstream = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'Chess Sim',
        },
        body,
      })
      const text = await upstream.text()
      res.statusCode = upstream.status
      res.setHeader('Content-Type', 'application/json')
      res.end(text)
    } catch (e) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: String(e) }))
    }
  }

  return {
    name: 'openrouter-proxy',
    configureServer(server) {
      server.middlewares.use('/api/openrouter/chat', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/openrouter/chat', handler)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), openRouterProxy(env.OPENROUTER_API_KEY ?? '')],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@battler': path.resolve(__dirname, './battler'),
      },
    },
  }
})
