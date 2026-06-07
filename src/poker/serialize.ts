import type { Holdem } from './engine/holdem'
import type { ActionRecord, Card, Rank, Seat } from './types'

const RANK_CODE: Record<Rank, string> = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
  '9': '9', '10': 'T', J: 'J', Q: 'Q', K: 'K', A: 'A',
}
const SUIT_CODE: Record<Card['suit'], string> = {
  clubs: 'c', diamonds: 'd', hearts: 'h', spades: 's',
}

/** Standard poker notation, e.g. "As", "Td", "9c". */
export function cardCode(c: Card): string {
  return RANK_CODE[c.rank] + SUIT_CODE[c.suit]
}

/** System prompt: rules, hand rankings, and the strict JSON output contract. */
export function rulesPrimer(): string {
  return `You are an expert poker player in a 4-handed No-Limit Texas Hold'em sit-and-go.
Four AI players start with equal chip stacks. Blinds are posted each hand and the
dealer button rotates. A player is eliminated when they run out of chips; the last
player with chips wins the whole tournament. Play to win chips over the long run —
fold weak hands, value-bet strong ones, and use position and betting patterns.

HAND RANKINGS (best to worst): Straight Flush, Four of a Kind, Full House, Flush,
Straight, Three of a Kind, Two Pair, One Pair, High Card. Your best five-card hand
is made from your two hole cards plus the five community cards.

BETTING: Each betting round, you may fold, check (only if there is no bet to you),
call (match the current bet), bet/raise (increase it), or go all-in. A raise must be
at least the size of the previous raise unless you are going all-in for less.

CARD NOTATION: rank + suit, where ranks are A K Q J T 9 8 7 6 5 4 3 2 and suits are
s(spades) h(hearts) d(diamonds) c(clubs). Example: "Ah" is the Ace of hearts.

You will receive the current state as JSON, including your hole cards, the board, the
pot, every player's chips and status, the full betting history, and an explicit list
of your legal actions with their amounts.

Respond with EXACTLY ONE JSON object and nothing else:
  {"action":"fold"}
  {"action":"check"}
  {"action":"call"}
  {"action":"bet","amount":N}      // N = TOTAL chips you commit this round (a "raise to")
  {"action":"raise","amount":N}    // N = TOTAL chips you commit this round (a "raise to")
  {"action":"all-in"}
ALWAYS include a "reasoning" field: one short sentence explaining your decision, e.g.
  {"action":"raise","amount":120,"reasoning":"Top pair with a strong kicker, building the pot."}
Only choose an action that appears in legalActions. Output JSON only — no other text.`
}

function statusOf(seat: Seat, h: Holdem): string {
  const p = h.player(seat)
  if (p.out) return 'out'
  if (p.folded) return 'folded'
  if (p.allIn) return 'all-in'
  return 'active'
}

/** Compact one-line summary of a recorded action for the history feed. */
function historyLine(r: ActionRecord): string {
  return `H${r.handNumber} ${r.street} ${r.label}: ${r.action} (pot ${r.potAfter})`
}

/**
 * Build the user message (JSON) describing the table from `seat`'s point of
 * view. Only this seat's hole cards are revealed. Includes the recent betting
 * history so the model can read opponents across rounds.
 */
export function describePokerState(
  h: Holdem,
  seat: Seat,
  history: ActionRecord[],
  historyLimit = 40,
): string {
  const snap = h.snapshot()
  const you = h.player(seat)
  const la = h.legalActions(seat)
  const toCall = la.callAmount

  const players = snap.seats.map((s) => ({
    seat: s.seat,
    name: s.label,
    chips: s.stack,
    committedThisRound: s.committedThisStreet,
    status: statusOf(s.seat, h),
    isYou: s.seat === seat,
    isDealer: s.isDealer,
    isSmallBlind: s.isSmallBlind,
    isBigBlind: s.isBigBlind,
  }))

  const legalActions = {
    fold: la.canFold,
    check: la.canCheck,
    call: la.canCall ? { amountToAdd: toCall } : null,
    bet: la.canBet ? { minTotal: la.minRaiseTo, maxTotal: la.maxRaiseTo } : null,
    raise: la.canRaise ? { minTotal: la.minRaiseTo, maxTotal: la.maxRaiseTo } : null,
    allIn: la.canAllIn ? { total: la.maxRaiseTo } : null,
  }

  const state = {
    handNumber: snap.handNumber,
    street: snap.street,
    blinds: { small: h.smallBlind, big: h.bigBlind },
    board: snap.board.map(cardCode),
    pot: snap.pot,
    currentBet: snap.currentBet,
    you: {
      seat,
      name: you.label,
      holeCards: you.holeCards ? you.holeCards.map(cardCode) : [],
      chips: you.stack,
      committedThisRound: you.committedThisStreet,
      amountToCall: toCall,
    },
    players,
    legalActions,
    bettingHistory: history.slice(-historyLimit).map(historyLine),
  }
  return JSON.stringify(state, null, 2)
}
