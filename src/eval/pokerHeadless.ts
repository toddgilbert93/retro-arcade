import { RNG } from '@battler/engine/rng.ts'
import { resolveModel } from '@battler/agent/models.ts'
import { callModel } from '@battler/agent/llm.ts'
import { Holdem, type PlayerConfig } from '../poker/engine/holdem'
import { makePokerAgent, type PokerModelCaller } from '../poker/pokerAgent'
import type { ActionRecord, Seat } from '../poker/types'

const STARTING_STACK = 1000
const SMALL_BLIND = 50
const BIG_BLIND = 100
const NUM_SEATS = 4
const MAX_HANDS = 500

export interface SitNGoResult {
  playerIds: string[]
  winnerId: string
  winnerLabel: string
  winnerSeat: Seat
  hands: number
}

function buildPlayerConfigs(modelIds: string[]): PlayerConfig[] {
  if (modelIds.length !== NUM_SEATS) {
    throw new Error(`Expected ${NUM_SEATS} player model ids, got ${modelIds.length}`)
  }
  return modelIds.map((id, i) => {
    const m = resolveModel(id)
    return {
      seat: i as Seat,
      label: m.label,
      model: m.model,
    }
  })
}

function nextDealer(holdem: Holdem, dealer: Seat): Seat {
  for (let i = 1; i <= NUM_SEATS; i++) {
    const cand = ((dealer + i) % NUM_SEATS) as Seat
    if (!holdem.player(cand).out) return cand
  }
  return dealer
}

/**
 * Run one 4-player sit-and-go to completion with no UI delays. Uses the same
 * Holdem engine and poker agents as the browser runner.
 */
export async function runHeadlessSitNGo(
  playerModelIds: string[],
  opts: {
    seed?: number
    /** Shared caller for every seat. */
    caller?: PokerModelCaller
    /** Per-seat callers; overrides `caller` when provided. */
    callers?: PokerModelCaller[]
    onLog?: (line: string) => void
  } = {},
): Promise<SitNGoResult> {
  const rng = new RNG(opts.seed)
  const configs = buildPlayerConfigs(playerModelIds)
  const holdem = new Holdem(configs, STARTING_STACK, SMALL_BLIND, BIG_BLIND)
  const agents = configs.map((c, i) => {
    const call = opts.callers?.[i] ?? opts.caller ?? callModel
    return makePokerAgent(c.model, call, (line) => opts.onLog?.(line))
  })
  const history: ActionRecord[] = []

  let dealer = rng.int(NUM_SEATS) as Seat
  let hands = 0

  while (holdem.tournamentWinner() === null && hands < MAX_HANDS) {
    hands++
    holdem.startHand(dealer, rng)

    while (!holdem.handComplete) {
      const seat = holdem.toAct
      if (seat === null) break

      const action = await agents[seat]!.decide(holdem, seat, history)
      const { record } = holdem.applyAction(seat, action)
      history.push(record)
    }

    holdem.eliminateBusted()
    dealer = nextDealer(holdem, dealer)
  }

  const winnerSeat = holdem.tournamentWinner()
  if (winnerSeat === null) {
    throw new Error(`Sit-n-go did not finish within ${MAX_HANDS} hands`)
  }

  const winnerId = playerModelIds[winnerSeat]!
  return {
    playerIds: [...playerModelIds],
    winnerId,
    winnerLabel: holdem.label(winnerSeat),
    winnerSeat,
    hands,
  }
}
