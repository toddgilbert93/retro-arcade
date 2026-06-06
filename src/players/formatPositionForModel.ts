import { Chess } from 'chess.js'
import type { MoveContext } from '../engine/types'
import {
  formatAnnotatedLegalMoves,
  formatGroupedAnnotatedLegalMoves,
  formatTacticalContext,
} from './positionAnalysis'

const GROUP_THRESHOLD = 15

function formatCastling(fen: string): string {
  const part = fen.split(' ')[2] ?? '-'
  if (part === '-') return 'none'
  const w = part.includes('K') ? 'K' : ''
  const wq = part.includes('Q') ? 'Q' : ''
  const b = part.includes('k') ? 'k' : ''
  const bq = part.includes('q') ? 'q' : ''
  const white = w || wq ? `White ${w}${wq}` : 'White none'
  const black = b || bq ? `Black ${b}${bq}` : 'Black none'
  return `${white} | ${black}`
}

function formatNumberedMovetext(history: string[]): string {
  if (!history.length) return 'This is the first move.'
  const parts: string[] = []
  for (let i = 0; i < history.length; i += 2) {
    const num = Math.floor(i / 2) + 1
    const white = history[i]
    const black = history[i + 1]
    parts.push(black ? `${num}. ${white} ${black}` : `${num}. ${white}`)
  }
  return `Moves: ${parts.join(' ')}`
}

function formatLegalMovesFlat(ctx: MoveContext): string {
  return formatAnnotatedLegalMoves(ctx)
}

function formatLegalMovesGrouped(ctx: MoveContext): string {
  return formatGroupedAnnotatedLegalMoves(ctx)
}

function formatFenMetadata(fen: string, inCheck: boolean): string {
  const parts = fen.split(' ')
  const ep = parts[3] && parts[3] !== '-' ? parts[3] : 'none'
  const half = parts[4] ?? '0'
  const full = parts[5] ?? '1'
  return [
    `Castling: ${formatCastling(fen)}`,
    `En passant: ${ep}`,
    `Halfmove clock: ${half} | Fullmove: ${full}`,
    `In check: ${inCheck ? 'yes' : 'no'}`,
  ].join('\n')
}

/** Formats board, history, and legal moves for the model user message. */
export function formatPositionForModel(ctx: MoveContext): string {
  const chess = new Chess(ctx.fen)
  const color = ctx.turn === 'w' ? 'White' : 'Black'
  const lines: string[] = [
    `You are playing ${color}. Move ${ctx.moveNumber}.`,
    '',
    'Board (rank 8 at top):',
    chess.ascii(),
    '',
    `Position (FEN): ${ctx.fen}`,
    formatFenMetadata(ctx.fen, ctx.check),
    '',
    formatNumberedMovetext(ctx.history),
  ]

  const lastSan = ctx.history.at(-1)
  if (lastSan) {
    lines.push(`Opponent's last move: ${lastSan}`)
  }

  if (ctx.check) {
    lines.push('You are IN CHECK — your move must get the king out of check.')
  }

  lines.push('')
  lines.push(formatTacticalContext(ctx))
  lines.push('')
  lines.push(`Legal moves (${ctx.legalMoves.length}):`)
  if (ctx.legalMoves.length > GROUP_THRESHOLD) {
    lines.push(formatLegalMovesGrouped(ctx))
  } else {
    lines.push(formatLegalMovesFlat(ctx))
  }

  return lines.join('\n')
}
