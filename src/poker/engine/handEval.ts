import pokersolver from 'pokersolver'
import type { Card, Rank, Suit } from '../types'

const { Hand } = pokersolver

// pokersolver card strings: rank (A K Q J T 9..2) + suit (s h d c).
const RANK_TO_SOLVER: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', '10': 'T', J: 'J', Q: 'Q', K: 'K', A: 'A',
}
const SUIT_TO_SOLVER: Record<Suit, string> = {
  clubs: 'c', diamonds: 'd', hearts: 'h', spades: 's',
}

export function cardToSolver(c: Card): string {
  return RANK_TO_SOLVER[c.rank] + SUIT_TO_SOLVER[c.suit]
}

/** Best-5 description for a set of (5–7) cards, e.g. "Full House, 8's over K's". */
export function describeBest(cards: Card[]): string {
  return Hand.solve(cards.map(cardToSolver)).descr
}

export interface ShowdownEntry {
  seat: number
  /** This seat's 7 available cards (2 hole + up to 5 board). */
  cards: Card[]
}

export interface ShowdownResult {
  winners: number[]
  descrBySeat: Record<number, string>
}

/**
 * Rank the given seats' hands and return the winning seat(s) (ties included)
 * plus a hand description per seat. Uses pokersolver for correct kicker/tie
 * handling.
 */
export function rankShowdown(entries: ShowdownEntry[]): ShowdownResult {
  const solved = entries.map((e) => ({
    seat: e.seat,
    hand: Hand.solve(e.cards.map(cardToSolver)),
  }))
  const winningHands = Hand.winners(solved.map((s) => s.hand))
  const winners = solved
    .filter((s) => winningHands.includes(s.hand))
    .map((s) => s.seat)
  const descrBySeat: Record<number, string> = {}
  for (const s of solved) descrBySeat[s.seat] = s.hand.descr
  return { winners, descrBySeat }
}
