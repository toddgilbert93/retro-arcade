import { RNG } from '@battler/engine/rng.ts'
import type { Card, Rank, Suit } from '../types'

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades']
const RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',
]

/** A fresh, ordered 52-card deck. */
export function freshDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ rank, suit })
  }
  return deck
}

/** Fisher–Yates shuffle using the shared seedable RNG (reproducible games). */
export function shuffledDeck(rng: RNG): Card[] {
  const deck = freshDeck()
  for (let i = deck.length - 1; i > 0; i--) {
    const j = rng.int(i + 1)
    const tmp = deck[i]!
    deck[i] = deck[j]!
    deck[j] = tmp
  }
  return deck
}
