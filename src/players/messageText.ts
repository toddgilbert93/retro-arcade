/** Extract displayable text from OpenRouter / provider assistant messages. */

function extractStringContent(content: unknown): string | undefined {
  if (typeof content === 'string' && content.trim() !== '') return content
  if (!Array.isArray(content)) return undefined

  const parts = content
    .map((part) => {
      if (typeof part === 'string' && part.trim() !== '') return part
      if (part && typeof part === 'object') {
        const p = part as { type?: string; text?: string }
        if (typeof p.text === 'string' && p.text.trim() !== '') return p.text
      }
      return ''
    })
    .filter(Boolean)

  return parts.length ? parts.join('\n') : undefined
}

function extractReasoningDetails(details: unknown): string | undefined {
  if (!Array.isArray(details)) return undefined

  const parts: string[] = []
  for (const item of details) {
    if (!item || typeof item !== 'object') continue
    const d = item as { type?: string; text?: string; summary?: string | string[] }

    if (d.type === 'reasoning.text' && typeof d.text === 'string' && d.text.trim()) {
      parts.push(d.text.trim())
      continue
    }

    if (d.type === 'reasoning.summary') {
      if (typeof d.summary === 'string' && d.summary.trim()) {
        parts.push(d.summary.trim())
      } else if (Array.isArray(d.summary)) {
        const joined = d.summary.filter((s): s is string => typeof s === 'string' && s.trim() !== '').join('\n')
        if (joined) parts.push(joined)
      }
    }
  }

  return parts.length ? parts.join('\n\n') : undefined
}

export function parseAssistantMessage(message: unknown): { content?: string; reasoning?: string } {
  if (!message || typeof message !== 'object') return {}

  const m = message as {
    content?: unknown
    reasoning?: unknown
    reasoning_content?: unknown
    reasoning_details?: unknown
  }

  const content = extractStringContent(m.content)
  const reasoning =
    (typeof m.reasoning === 'string' && m.reasoning.trim() !== '' ? m.reasoning.trim() : undefined) ??
    (typeof m.reasoning_content === 'string' && m.reasoning_content.trim() !== ''
      ? m.reasoning_content.trim()
      : undefined) ??
    extractReasoningDetails(m.reasoning_details)

  return { content, reasoning }
}
