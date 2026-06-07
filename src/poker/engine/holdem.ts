import { RNG } from '@battler/engine/rng.ts'
import { shuffledDeck } from './deck'
import { rankShowdown, describeBest } from './handEval'
import type {
  ActionRecord,
  Card,
  HandResult,
  LegalActions,
  PokerAction,
  PokerSnapshot,
  PotResult,
  Seat,
  SeatView,
  Street,
} from '../types'

export interface PlayerConfig {
  seat: Seat
  label: string
  model: string
}

interface PlayerState {
  seat: Seat
  label: string
  model: string
  stack: number
  committedThisStreet: number
  committedTotal: number
  holeCards: [Card, Card] | null
  folded: boolean
  allIn: boolean
  /** Eliminated from the sit-n-go (stack hit 0 between hands). */
  out: boolean
  hasActed: boolean
  lastActionLabel: string | null
  lastReasoning: string | null
  wonThisHand: number
  handDescr: string | null
}

export interface EngineLog {
  text: string
  seat?: Seat
  kind?: 'action' | 'reasoning' | 'street' | 'showdown' | 'winner' | 'system'
}

export interface ApplyResult {
  log: EngineLog[]
  record: ActionRecord
}

const NUM_SEATS = 4

/**
 * One Texas Hold'em table. Holds persistent chip stacks across hands; each
 * hand is run by `startHand()` then a sequence of `applyAction()` calls. The
 * engine auto-advances streets (dealing the board) and resolves showdown/side
 * pots internally, so the driver only has to ask the seat in `toAct` to decide.
 */
export class Holdem {
  readonly smallBlind: number
  readonly bigBlind: number
  private players: PlayerState[]

  handNumber = 0
  dealerSeat: Seat = 0
  street: Street = 'preflop'
  board: Card[] = []
  private deck: Card[] = []
  currentBet = 0
  private minRaise: number
  toAct: Seat | null = null
  private sbSeat: Seat | null = null
  private bbSeat: Seat | null = null
  private complete = false
  private handResult: HandResult | null = null

  constructor(configs: PlayerConfig[], startingStack: number, smallBlind: number, bigBlind: number) {
    this.smallBlind = smallBlind
    this.bigBlind = bigBlind
    this.minRaise = bigBlind
    this.players = configs.map((c) => ({
      seat: c.seat,
      label: c.label,
      model: c.model,
      stack: startingStack,
      committedThisStreet: 0,
      committedTotal: 0,
      holeCards: null,
      folded: false,
      allIn: false,
      out: false,
      hasActed: false,
      lastActionLabel: null,
      lastReasoning: null,
      wonThisHand: 0,
      handDescr: null,
    }))
  }

  player(seat: Seat): PlayerState {
    return this.players[seat]!
  }

  label(seat: Seat): string {
    return this.players[seat]!.label
  }

  model(seat: Seat): string {
    return this.players[seat]!.model
  }

  /** Seats still in the sit-n-go (chips remaining). */
  activeSeats(): Seat[] {
    return this.players.filter((p) => !p.out).map((p) => p.seat)
  }

  /** If exactly one player has chips, the sit-n-go is over. */
  tournamentWinner(): Seat | null {
    const alive = this.activeSeats()
    return alive.length === 1 ? alive[0]! : null
  }

  get handComplete(): boolean {
    return this.complete
  }

  result(): HandResult | null {
    return this.handResult
  }

  // ---- Hand setup ----------------------------------------------------------

  /** Mark players with no chips as eliminated. Call between hands. */
  eliminateBusted(): Seat[] {
    const busted: Seat[] = []
    for (const p of this.players) {
      if (!p.out && p.stack <= 0) {
        p.out = true
        busted.push(p.seat)
      }
    }
    return busted
  }

  startHand(dealerSeat: Seat, rng: RNG): EngineLog[] {
    this.handNumber++
    this.dealerSeat = dealerSeat
    this.street = 'preflop'
    this.board = []
    this.deck = shuffledDeck(rng)
    this.currentBet = 0
    this.minRaise = this.bigBlind
    this.complete = false
    this.handResult = null

    for (const p of this.players) {
      p.committedThisStreet = 0
      p.committedTotal = 0
      p.folded = false
      p.allIn = false
      p.hasActed = false
      p.holeCards = null
      p.lastActionLabel = null
      p.lastReasoning = null
      p.wonThisHand = 0
      p.handDescr = null
    }

    const order = this.seatsClockwiseFrom(dealerSeat).filter((s) => !this.players[s]!.out)
    // Deal two cards to each in-hand seat, starting left of the dealer.
    const firstCard = new Map<Seat, Card>()
    for (const s of order) firstCard.set(s, this.deck.pop()!)
    for (const s of order) {
      this.players[s]!.holeCards = [firstCard.get(s)!, this.deck.pop()!]
    }

    const log: EngineLog[] = [
      { text: `--- Hand ${this.handNumber} --- (${order.length} players)`, kind: 'system' },
    ]

    // Blinds + first to act.
    let firstToAct: Seat
    if (order.length === 2) {
      this.sbSeat = dealerSeat
      this.bbSeat = order.find((s) => s !== dealerSeat)!
      firstToAct = dealerSeat
    } else {
      this.sbSeat = order[0]!
      this.bbSeat = order[1]!
      firstToAct = order[2]!
    }
    log.push(...this.postBlind(this.sbSeat, this.smallBlind, 'small blind'))
    log.push(...this.postBlind(this.bbSeat, this.bigBlind, 'big blind'))
    this.currentBet = this.bigBlind
    this.minRaise = this.bigBlind

    this.beginBettingRound(firstToAct)
    return log
  }

  private postBlind(seat: Seat, amount: number, name: string): EngineLog[] {
    const p = this.players[seat]!
    const posted = Math.min(amount, p.stack)
    this.commit(p, posted)
    if (p.stack === 0) p.allIn = true
    p.lastActionLabel = `posts ${name} ${posted}`
    return [{ text: `${p.label} posts ${name} ${posted}`, seat, kind: 'action' }]
  }

  // ---- Action handling -----------------------------------------------------

  legalActions(seat: Seat): LegalActions {
    const p = this.players[seat]!
    const toCall = Math.max(0, this.currentBet - p.committedThisStreet)
    const maxRaiseTo = p.committedThisStreet + p.stack
    const canCheck = toCall === 0
    const canCall = toCall > 0 && p.stack > 0
    // Raising needs chips beyond the call amount.
    const canAggress = p.stack > toCall
    const isOpen = this.currentBet === 0
    const minRaiseTo = isOpen
      ? Math.min(p.committedThisStreet + this.bigBlind, maxRaiseTo)
      : Math.min(this.currentBet + this.minRaise, maxRaiseTo)
    return {
      canFold: toCall > 0,
      canCheck,
      canCall,
      callAmount: Math.min(toCall, p.stack),
      canBet: isOpen && canAggress,
      canRaise: !isOpen && canAggress,
      minRaiseTo,
      maxRaiseTo,
      canAllIn: p.stack > 0,
    }
  }

  applyAction(seat: Seat, action: PokerAction): ApplyResult {
    const p = this.players[seat]!
    const toCall = Math.max(0, this.currentBet - p.committedThisStreet)
    let label = ''
    let amountAdded = 0
    let type = action.type

    // Tolerate a check when facing a bet by treating it as a call.
    if (type === 'check' && toCall > 0) type = 'call'

    if (type === 'fold') {
      p.folded = true
      label = 'fold'
    } else if (type === 'check') {
      label = 'check'
    } else if (type === 'call') {
      amountAdded = Math.min(toCall, p.stack)
      this.commit(p, amountAdded)
      if (p.stack === 0) p.allIn = true
      label = amountAdded === 0 ? 'check' : `call ${amountAdded}${p.allIn ? ' (all-in)' : ''}`
    } else {
      // bet / raise / all-in
      const maxTo = p.committedThisStreet + p.stack
      let target: number
      if (type === 'all-in') {
        target = maxTo
      } else {
        const minTo = this.currentBet > 0
          ? this.currentBet + this.minRaise
          : Math.min(this.bigBlind, maxTo)
        target = action.amount ?? minTo
        // Raise up to the minimum, but never beyond an all-in (cap last).
        target = Math.min(Math.max(target, minTo), maxTo)
      }
      amountAdded = target - p.committedThisStreet
      this.commit(p, amountAdded)
      if (p.stack === 0) p.allIn = true
      const raiseSize = target - this.currentBet
      const opening = this.currentBet === 0
      label = opening
        ? `bet ${target}${p.allIn ? ' (all-in)' : ''}`
        : `raise to ${target}${p.allIn ? ' (all-in)' : ''}`
      if (target > this.currentBet) {
        this.currentBet = target
        // A full raise reopens the action; a short all-in does not.
        if (raiseSize >= this.minRaise) {
          this.minRaise = raiseSize
          this.reopen(seat)
        }
      }
    }

    p.hasActed = true
    p.lastActionLabel = label
    p.lastReasoning = action.reasoning ?? null

    const potAfter = this.pot()
    const record: ActionRecord = {
      handNumber: this.handNumber,
      street: this.street,
      seat,
      label: p.label,
      action: label,
      amountAdded,
      potAfter,
      reasoning: action.reasoning,
    }
    const log: EngineLog[] = [{ text: `${p.label}: ${label}`, seat, kind: 'action' }]

    const advanceLog = this.advanceAfterAction(seat)
    return { log: [...log, ...advanceLog], record }
  }

  private commit(p: PlayerState, amount: number): void {
    p.stack -= amount
    p.committedThisStreet += amount
    p.committedTotal += amount
  }

  private reopen(actorSeat: Seat): void {
    for (const p of this.players) {
      if (p.seat === actorSeat || p.out || p.folded || p.allIn) continue
      p.hasActed = false
    }
  }

  // ---- Round / street progression -----------------------------------------

  private contendersCount(): number {
    return this.players.filter((p) => !p.out && !p.folded).length
  }

  private beginBettingRound(startSeat: Seat): void {
    if (this.contendersCount() <= 1) {
      this.closeBettingRound()
      return
    }
    const s = this.firstEligibleFrom(startSeat, true)
    if (s === null) {
      this.closeBettingRound()
    } else {
      this.toAct = s
    }
  }

  private advanceAfterAction(actorSeat: Seat): EngineLog[] {
    if (this.contendersCount() <= 1) return this.closeBettingRound()
    const s = this.firstEligibleFrom(actorSeat, false)
    if (s !== null) {
      this.toAct = s
      return []
    }
    return this.closeBettingRound()
  }

  /** First seat (clockwise) that still owes an action this round, or null. */
  private firstEligibleFrom(seat: Seat, inclusive: boolean): Seat | null {
    for (let i = inclusive ? 0 : 1; i < NUM_SEATS; i++) {
      const cand = ((seat + i) % NUM_SEATS) as Seat
      const p = this.players[cand]!
      if (p.out || p.folded || p.allIn) continue
      if (!p.hasActed || p.committedThisStreet < this.currentBet) return cand
    }
    return null
  }

  private closeBettingRound(): EngineLog[] {
    this.toAct = null
    const contenders = this.players.filter((p) => !p.out && !p.folded)
    if (contenders.length <= 1) {
      return this.finishByFold(contenders[0])
    }
    if (this.street === 'river') {
      return this.goToShowdown()
    }
    const canAct = contenders.filter((p) => !p.allIn)
    if (canAct.length <= 1) {
      const log = this.runOutBoard()
      return [...log, ...this.goToShowdown()]
    }
    return this.dealNextStreet()
  }

  private dealNextStreet(): EngineLog[] {
    const log: EngineLog[] = []
    if (this.street === 'preflop') {
      this.board.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!)
      this.street = 'flop'
    } else if (this.street === 'flop') {
      this.board.push(this.deck.pop()!)
      this.street = 'turn'
    } else if (this.street === 'turn') {
      this.board.push(this.deck.pop()!)
      this.street = 'river'
    }
    log.push({ text: `*** ${this.street.toUpperCase()} *** ${this.boardText()}`, kind: 'street' })

    this.currentBet = 0
    this.minRaise = this.bigBlind
    for (const p of this.players) {
      if (p.out || p.folded) continue
      p.committedThisStreet = 0
      p.hasActed = false
    }
    this.beginBettingRound(this.seatsClockwiseFrom(this.dealerSeat)[0]!)
    return log
  }

  /** Deal any missing community cards (when remaining players are all-in). */
  private runOutBoard(): EngineLog[] {
    const log: EngineLog[] = []
    while (this.board.length < 5) {
      if (this.board.length === 0) {
        this.board.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!)
        this.street = 'flop'
      } else {
        this.board.push(this.deck.pop()!)
        this.street = this.board.length === 4 ? 'turn' : 'river'
      }
      log.push({ text: `*** ${this.street.toUpperCase()} *** ${this.boardText()}`, kind: 'street' })
    }
    return log
  }

  // ---- Resolution ----------------------------------------------------------

  private finishByFold(winner: PlayerState | undefined): EngineLog[] {
    this.complete = true
    if (!winner) {
      this.handResult = { potResults: [], totalPot: 0, wentToShowdown: false }
      return []
    }
    const total = this.pot()
    winner.stack += total
    winner.wonThisHand = total
    this.handResult = {
      potResults: [{ amount: total, winners: [winner.seat], eligibleSeats: [winner.seat] }],
      totalPot: total,
      wentToShowdown: false,
    }
    return [
      {
        text: `${winner.label} wins ${total} (all others folded)`,
        seat: winner.seat,
        kind: 'showdown',
      },
    ]
  }

  private goToShowdown(): EngineLog[] {
    this.street = 'showdown'
    this.complete = true
    const log: EngineLog[] = []
    const contenders = this.players.filter((p) => !p.out && !p.folded)

    // Describe each contender's hand for the UI.
    for (const p of contenders) {
      if (p.holeCards) p.handDescr = describeBest([...p.holeCards, ...this.board])
    }
    for (const p of contenders) {
      log.push({
        text: `${p.label} shows ${cardsText(p.holeCards)} — ${p.handDescr}`,
        seat: p.seat,
        kind: 'showdown',
      })
    }

    const pots = this.buildPots()
    const potResults: PotResult[] = []
    let totalPot = 0
    pots.forEach((potDef, idx) => {
      totalPot += potDef.amount
      const eligible = potDef.eligibleSeats
      const ranked = rankShowdown(
        eligible.map((seat) => ({
          seat,
          cards: [...this.players[seat]!.holeCards!, ...this.board],
        })),
      )
      const winners = ranked.winners as Seat[]
      const shares = this.splitChips(potDef.amount, winners)
      winners.forEach((seat, i) => {
        this.players[seat]!.stack += shares[i]!
        this.players[seat]!.wonThisHand += shares[i]!
      })
      potResults.push({ amount: potDef.amount, winners, eligibleSeats: eligible })
      const potName = pots.length > 1 ? (idx === 0 ? 'main pot' : `side pot ${idx}`) : 'pot'
      const names = winners.map((s) => this.players[s]!.label).join(', ')
      log.push({
        text: `${names} ${winners.length > 1 ? 'split' : 'wins'} ${potName} (${potDef.amount})`,
        seat: winners[0],
        kind: 'showdown',
      })
    })

    this.handResult = { potResults, totalPot, wentToShowdown: true }
    return log
  }

  /** Build main + side pots from each player's total contribution. */
  private buildPots(): { amount: number; eligibleSeats: Seat[] }[] {
    const contribs = this.players
      .filter((p) => p.committedTotal > 0)
      .map((p) => ({ seat: p.seat, total: p.committedTotal, folded: p.folded }))
    const levels = [...new Set(contribs.map((c) => c.total))].sort((a, b) => a - b)
    const pots: { amount: number; eligibleSeats: Seat[] }[] = []
    let prev = 0
    for (const level of levels) {
      let amount = 0
      for (const c of contribs) {
        amount += Math.min(c.total, level) - Math.min(c.total, prev)
      }
      if (amount > 0) {
        let eligible = contribs
          .filter((c) => !c.folded && c.total >= level)
          .map((c) => c.seat)
        // Dead money with no surviving contributor falls to the live contenders.
        if (eligible.length === 0) {
          eligible = contribs.filter((c) => !c.folded).map((c) => c.seat)
        }
        pots.push({ amount, eligibleSeats: eligible })
      }
      prev = level
    }
    return pots
  }

  /** Split `amount` among winners; odd chips go clockwise from the dealer. */
  private splitChips(amount: number, winners: Seat[]): number[] {
    const base = Math.floor(amount / winners.length)
    let remainder = amount - base * winners.length
    const shares = winners.map(() => base)
    const order = this.seatsClockwiseFrom(this.dealerSeat)
    const ordered = order.filter((s) => winners.includes(s))
    for (const seat of ordered) {
      if (remainder <= 0) break
      shares[winners.indexOf(seat)]! += 1
      remainder--
    }
    return shares
  }

  // ---- Views ---------------------------------------------------------------

  /** Total chips committed to the middle this hand. */
  pot(): number {
    return this.players.reduce((sum, p) => sum + p.committedTotal, 0)
  }

  private seatsClockwiseFrom(seat: Seat): Seat[] {
    return Array.from({ length: NUM_SEATS }, (_, i) => ((seat + 1 + i) % NUM_SEATS) as Seat)
  }

  private boardText(): string {
    return cardsText(this.board)
  }

  snapshot(): PokerSnapshot {
    return {
      handNumber: this.handNumber,
      dealerSeat: this.dealerSeat,
      street: this.street,
      board: [...this.board],
      pot: this.pot(),
      currentBet: this.currentBet,
      toAct: this.toAct,
      tournamentWinner: this.tournamentWinner(),
      seats: this.players.map((p) => this.seatView(p)),
    }
  }

  private seatView(p: PlayerState): SeatView {
    return {
      seat: p.seat,
      label: p.label,
      stack: p.stack,
      committedThisStreet: p.committedThisStreet,
      holeCards: p.holeCards,
      folded: p.folded,
      allIn: p.allIn,
      out: p.out,
      isDealer: p.seat === this.dealerSeat,
      isSmallBlind: p.seat === this.sbSeat,
      isBigBlind: p.seat === this.bbSeat,
      isTurn: p.seat === this.toAct,
      lastAction: p.lastActionLabel,
      lastReasoning: p.lastReasoning,
      wonThisHand: p.wonThisHand,
      handDescr: p.handDescr,
    }
  }
}

function cardsText(cards: readonly Card[] | null): string {
  if (!cards || cards.length === 0) return '—'
  return cards.map((c) => `${c.rank}${suitGlyph(c.suit)}`).join(' ')
}

function suitGlyph(suit: Card['suit']): string {
  return suit === 'clubs' ? '♣' : suit === 'diamonds' ? '♦' : suit === 'hearts' ? '♥' : '♠'
}
