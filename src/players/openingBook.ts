/** FEN-keyed mainline replies for the first few plies. */
const OPENING_BOOK: Record<string, string> = {
  // 1.
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': 'e2e4',
  // 1...e5
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': 'e7e5',
  // 2.Nf3
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2': 'g1f3',
  // 2...Nc6
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2': 'b8c6',
  // 3.Bb5 (Ruy Lopez)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3': 'f1b5',
  // 3...a6
  'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3': 'a7a6',
}

/** Returns a book move when the position is known and the move is still legal. */
export function lookupBookMove(fen: string, legalMoves: string[]): string | undefined {
  const move = OPENING_BOOK[fen]
  if (move && legalMoves.includes(move)) return move
  return undefined
}
