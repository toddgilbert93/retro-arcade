import { Chess, SQUARES, type Color, type PieceSymbol, type Square } from 'chess.js'
import type { MoveContext } from '../engine/types'

const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

function opponent(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

function describePiece(square: Square, type: PieceSymbol): string {
  return `${PIECE_NAMES[type]} on ${square}`
}

function formatSideMaterial(chess: Chess, color: Color): string {
  const counts = new Map<PieceSymbol, number>()
  for (const square of SQUARES) {
    const piece = chess.get(square)
    if (!piece || piece.color !== color || piece.type === 'k') continue
    counts.set(piece.type, (counts.get(piece.type) ?? 0) + 1)
  }

  const parts: string[] = []
  let total = 0
  for (const type of ['q', 'r', 'b', 'n', 'p'] as PieceSymbol[]) {
    const count = counts.get(type) ?? 0
    if (count === 0) continue
    parts.push(`${count}${type}`)
    total += count * PIECE_VALUES[type]
  }

  const label = color === 'w' ? 'White' : 'Black'
  return `${label}: ${parts.join(' ')} (${total})`
}

function formatMaterialBalance(chess: Chess): string {
  let white = 0
  let black = 0
  for (const square of SQUARES) {
    const piece = chess.get(square)
    if (!piece || piece.type === 'k') continue
    const value = PIECE_VALUES[piece.type]
    if (piece.color === 'w') white += value
    else black += value
  }

  const diff = white - black
  let balance: string
  if (diff === 0) balance = 'equal material'
  else if (diff > 0) balance = `White +${diff}`
  else balance = `Black +${-diff}`

  return [
    'Material:',
    `  ${formatSideMaterial(chess, 'w')}`,
    `  ${formatSideMaterial(chess, 'b')}`,
    `  Balance: ${balance}`,
  ].join('\n')
}

function isHanging(chess: Chess, square: Square, pieceColor: Color): boolean {
  const foe = opponent(pieceColor)
  if (!chess.isAttacked(square, foe)) return false
  const defenders = chess.attackers(square, pieceColor).length
  const attackers = chess.attackers(square, foe).length
  return defenders === 0 || attackers > defenders
}

function formatPieceStatus(
  chess: Chess,
  square: Square,
  pieceColor: Color,
  foe: Color,
): string | null {
  const piece = chess.get(square)
  if (!piece || piece.color !== pieceColor || piece.type === 'k') return null

  const attacked = chess.isAttacked(square, foe)
  if (!attacked) return null

  const defenders = chess.attackers(square, pieceColor).length
  const attackers = chess.attackers(square, foe).length
  const hanging = isHanging(chess, square, pieceColor)
  const tag = hanging ? 'HANGING' : 'under attack'
  return `${describePiece(square, piece.type)} (${tag}, ${attackers} attacker(s) vs ${defenders} defender(s))`
}

function formatHangingAndAttacked(chess: Chess, turn: Color): string {
  const foe = opponent(turn)
  const ownIssues: string[] = []
  const targets: string[] = []

  for (const square of SQUARES) {
    const own = formatPieceStatus(chess, square, turn, foe)
    if (own) ownIssues.push(own)

    const piece = chess.get(square)
    if (!piece || piece.color !== foe || piece.type === 'k') continue
    if (!chess.isAttacked(square, turn)) continue

    const defenders = chess.attackers(square, foe).length
    const attackers = chess.attackers(square, turn).length
    const hanging = defenders === 0 || attackers > defenders
    const tag = hanging ? 'undefended' : 'defended'
    targets.push(`${describePiece(square, piece.type)} (${tag}, you have ${attackers} attacker(s))`)
  }

  const lines: string[] = ['Tactical notes:']
  if (ownIssues.length) {
    lines.push('  Your pieces under threat:')
    for (const entry of ownIssues) lines.push(`    - ${entry}`)
  } else {
    lines.push('  Your pieces under threat: none')
  }

  if (targets.length) {
    lines.push('  Opponent pieces you can attack:')
    for (const entry of targets) lines.push(`    - ${entry}`)
  } else {
    lines.push('  Opponent pieces you can attack: none')
  }

  return lines.join('\n')
}

function annotateMove(chess: Chess, san: string, uci: string): string {
  const verbose = chess.moves({ verbose: true }).find((m) => m.from + m.to + (m.promotion ?? '') === uci)
  if (!verbose) return `${san} (${uci})`

  const tags: string[] = []
  if (verbose.isCapture() && verbose.captured) {
    tags.push(`captures ${PIECE_NAMES[verbose.captured]} (+${PIECE_VALUES[verbose.captured]})`)
  }
  if (san.includes('#')) tags.push('checkmate')
  else if (san.includes('+')) tags.push('check')
  if (verbose.isPromotion()) tags.push('promotion')
  if (verbose.isKingsideCastle() || verbose.isQueensideCastle()) tags.push('castle')

  if (!tags.length) return `${san} (${uci})`
  return `${san} (${uci}) [${tags.join(', ')}]`
}

export function formatAnnotatedLegalMoves(ctx: MoveContext): string {
  const chess = new Chess(ctx.fen)
  const san = ctx.legalSan ?? []
  return ctx.legalMoves
    .map((uci, i) => annotateMove(chess, san[i] ?? uci, uci))
    .join(', ')
}

export function formatGroupedAnnotatedLegalMoves(ctx: MoveContext): string {
  const chess = new Chess(ctx.fen)
  const verbose = chess.moves({ verbose: true })
  const groups = new Map<string, { label: string; entries: string[] }>()

  for (const m of verbose) {
    const uci = m.from + m.to + (m.promotion ?? '')
    const entry = annotateMove(chess, m.san, uci)
    let label: string
    if (m.san === 'O-O' || m.san === 'O-O-O') {
      label = 'King'
    } else {
      label = `${m.from} ${PIECE_NAMES[m.piece]}`
    }
    const g = groups.get(label)
    if (g) g.entries.push(entry)
    else groups.set(label, { label, entries: [entry] })
  }

  return [...groups.values()]
    .map((g) => `  ${g.label}: ${g.entries.join(', ')}`)
    .join('\n')
}

/** Material balance, hanging/attacked pieces, and annotated legal moves for the model. */
export function formatTacticalContext(ctx: MoveContext): string {
  const chess = new Chess(ctx.fen)
  return [formatMaterialBalance(chess), '', formatHangingAndAttacked(chess, ctx.turn)].join('\n')
}
