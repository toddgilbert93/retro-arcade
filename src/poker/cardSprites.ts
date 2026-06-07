import type { Card, Rank, Suit } from './types'

// Pixel-art deck provided under public/PixelCardDeck/{Suit}/{rank}.png.
const SUIT_DIR: Record<Suit, string> = {
  clubs: 'Clubs',
  diamonds: 'Diamonds',
  hearts: 'Hearts',
  spades: 'Spades',
}
const RANK_FILE: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', '10': '10', J: 'jack', Q: 'queen', K: 'king', A: 'ace',
}

export function cardImage(card: Card): string {
  return `/PixelCardDeck/${SUIT_DIR[card.suit]}/${RANK_FILE[card.rank]}.png`
}

export function cardAlt(card: Card): string {
  return `${card.rank} of ${card.suit}`
}
