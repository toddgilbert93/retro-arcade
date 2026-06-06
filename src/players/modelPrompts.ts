import type { MoveContext, MoveErrorKind } from '../engine/types'

export type OutputMode = 'analysis' | 'tools' | 'json'

export function buildSystemPrompt(mode: OutputMode): string {
  const base =
    'You are a strong chess player.\n\n' +
    'You will receive the board, game history, a list of legal moves, and tactical context ' +
    '(material balance, available captures and checks, and which pieces are hanging or under attack) ' +
    'for this position.\n' +
    'Use the position to choose the best move from that list.\n\n'

  if (mode === 'tools') {
    return (
      base +
      'Think through the position first, then call the play_move tool with your chosen move.\n' +
      '"move" must be the UCI key from the legal list (e.g. e2e4, g1f3). Do not invent moves.'
    )
  }

  if (mode === 'json') {
    return (
      base +
      'Respond with JSON only (no markdown fences):\n' +
      '{"reasoning":"<one short sentence>","move":"<uci>"}\n\n' +
      '"move" must be the UCI key from the legal list (e.g. e2e4, g1f3). Do not invent moves.'
    )
  }

  return (
    base +
    'End your reply with these two lines (no other text after them):\n' +
    'Reasoning: <brief explanation of your choice>\n' +
    'Move: <uci>\n\n' +
    '"<uci>" must be copied from the legal list (e.g. e2e4, g1f3). Do not invent moves.\n' +
    'Do not repeat the prompt, board, or legal move list. Do not use markdown.'
  )
}

export function buildRetryHint(ctx: MoveContext, mode: OutputMode): string {
  if (ctx.attempt === 0 || !ctx.lastErrorKind) return ''

  const parseHints: Record<OutputMode, string> = {
    analysis:
      'Your previous response could not be parsed. End with:\n' +
      'Reasoning: <brief explanation of your choice>\n' +
      'Move: <uci>\n' +
      'where <uci> is copied from the legal list.',
    json:
      'Your previous response could not be parsed. Return JSON only: ' +
      '{"reasoning":"...","move":"..."} with "move" copied from the legal list (UCI).',
    tools:
      'Your previous response could not be parsed. Call play_move with "move" copied from the legal list (UCI).',
  }

  const hints: Record<MoveErrorKind, string> = {
    parse: parseHints[mode],
    illegal:
      (ctx.lastError ?? 'Your move was not legal.') +
      ' Pick a different move from the list below.',
    transport: 'Your previous request failed. Try again.',
  }

  return `Your previous answer (attempt ${ctx.attempt}) was REJECTED: ${hints[ctx.lastErrorKind]}`
}

export function buildUserMessage(ctx: MoveContext, positionBlock: string, mode: OutputMode): string {
  const retry = buildRetryHint(ctx, mode)
  const parts = [positionBlock]
  if (retry) parts.push('', retry)
  parts.push('', 'Choose the best move from the legal list.')
  return parts.join('\n')
}
