// Headless verification of the poker engine (run with `npx tsx test/poker.test.ts`).
import { RNG } from '../battler/engine/rng.ts'
import { Holdem } from '../src/poker/engine/holdem'
import type { LegalActions, PokerAction, Seat } from '../src/poker/types'

let passed = 0
function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`)
  passed++
}

function randomAction(la: LegalActions, rng: RNG): PokerAction {
  const choices: PokerAction[] = []
  if (la.canCheck) choices.push({ type: 'check' })
  if (la.canCall) choices.push({ type: 'call' })
  if (la.canFold) choices.push({ type: 'fold' })
  if (la.canBet || la.canRaise) {
    const span = Math.max(1, la.maxRaiseTo - la.minRaiseTo + 1)
    const amount = la.minRaiseTo + rng.int(span)
    choices.push({ type: la.canBet ? 'bet' : 'raise', amount })
  }
  if (la.canAllIn) choices.push({ type: 'all-in' })
  return rng.pick(choices)
}

const START = 1000
const SB = 50
const BB = 100
const SEATS: Seat[] = [0, 1, 2, 3]

function totalChips(h: Holdem): number {
  return SEATS.reduce((sum, s) => sum + h.player(s).stack, 0)
}

function nextActiveDealer(h: Holdem, dealer: Seat): Seat {
  for (let i = 1; i <= 4; i++) {
    const cand = ((dealer + i) % 4) as Seat
    if (!h.player(cand).out) return cand
  }
  return dealer
}

// --- Run many full sit-n-go tournaments with random legal play. ----------
for (let game = 0; game < 40; game++) {
  const h = new Holdem(
    SEATS.map((s) => ({ seat: s, label: `P${s}`, model: `m${s}` })),
    START,
    SB,
    BB,
  )
  const rng = new RNG(1000 + game)
  let dealer: Seat = 0
  let hands = 0

  while (h.tournamentWinner() === null && hands < 5000) {
    hands++
    h.startHand(dealer, rng)
    let guard = 0
    while (!h.handComplete) {
      if (++guard > 1000) throw new Error(`hand did not terminate (game ${game})`)
      const seat = h.toAct
      assert(seat !== null, `toAct set while hand in progress (game ${game})`)
      const la = h.legalActions(seat!)
      h.applyAction(seat!, randomAction(la, rng))
    }
    assert(
      totalChips(h) === START * 4,
      `chips conserved after hand ${hands} of game ${game} (got ${totalChips(h)})`,
    )
    for (const s of SEATS) {
      assert(h.player(s).stack >= 0, `no negative stack (game ${game}, seat ${s})`)
    }
    h.eliminateBusted()
    dealer = nextActiveDealer(h, dealer)
  }

  assert(h.tournamentWinner() !== null, `game ${game} produced a winner within 5000 hands`)
  assert(totalChips(h) === START * 4, `final chips conserved (game ${game})`)
  const winner = h.tournamentWinner()!
  assert(h.player(winner).stack === START * 4, `winner holds all chips (game ${game})`)
}

console.log(`poker engine: ${passed} assertions passed across 40 sit-n-go games`)
