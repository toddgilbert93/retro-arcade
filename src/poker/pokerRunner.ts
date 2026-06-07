import { RNG } from '@battler/engine/rng.ts'
import { MODELS, resolveModel } from '@battler/agent/models.ts'
import { Holdem, type PlayerConfig } from './engine/holdem'
import type { EngineLog } from './engine/holdem'
import { makePokerAgent, type PokerAgent } from './pokerAgent'
import { proxyPokerCaller } from './transport'
import type {
  ActionRecord,
  PokerLogEntry,
  PokerRunnerState,
  Seat,
} from './types'

const STARTING_STACK = 1000
const SMALL_BLIND = 50
const BIG_BLIND = 100
const NUM_SEATS = 4

export const DEFAULT_POKER_PLAYER_MODEL_IDS = MODELS.slice(0, NUM_SEATS).map((m) => m.id)

export const POKER_PLAYER_LABELS = DEFAULT_POKER_PLAYER_MODEL_IDS.map(
  (id) => resolveModel(id).label,
)

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

/** Floor for the "thinking" beat so fast models still flash it before acting. */
const MIN_THINK_MS = 600
const AFTER_DEAL_MS = 600
const BETWEEN_HANDS_MS = 2200
const MAX_HANDS = 500

type Listener = (state: PokerRunnerState) => void

const initialState: PokerRunnerState = {
  phase: 'idle',
  snapshot: null,
  log: [],
  thinking: null,
  commentary: null,
  winnerLabel: null,
  error: null,
  autoplay: false,
  pausePending: false,
}

/**
 * Drives a 4-player AI sit-and-go and emits a fresh PokerRunnerState after every
 * step so a React view can animate it action-by-action. Mirrors the Pokémon
 * battler's runner: generation token + running/autoplay flags give clean
 * pause/resume/reset, including aborting an in-flight model call.
 */
export class PokerRunner {
  private listeners = new Set<Listener>()
  private state: PokerRunnerState = initialState
  private aborted = false
  private running = false
  private autoplay = false
  private runGeneration = 0
  private speedMs = 700

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    fn(this.state)
    return () => {
      this.listeners.delete(fn)
    }
  }

  get isRunning(): boolean {
    return this.running
  }

  setSpeed(ms: number): void {
    this.speedMs = ms
  }

  abort(): void {
    this.aborted = true
  }

  pause(): void {
    this.autoplay = false
    this.syncTransportFields()
  }

  resume(): void {
    this.autoplay = true
    this.syncTransportFields()
  }

  reset(): void {
    this.runGeneration++
    this.aborted = true
    this.autoplay = false
    this.running = false
    this.state = { ...initialState }
    for (const fn of this.listeners) fn(this.state)
  }

  private syncTransportFields(): void {
    this.patch({
      autoplay: this.autoplay,
      pausePending: !this.autoplay && this.state.thinking !== null,
    })
  }

  private patch(p: Partial<PokerRunnerState>, generation?: number): void {
    if (generation !== undefined && generation !== this.runGeneration) return
    this.state = { ...this.state, ...p }
    for (const fn of this.listeners) fn(this.state)
  }

  private appendLogs(entries: EngineLog[], generation: number): void {
    if (entries.length === 0) return
    if (generation !== this.runGeneration) return
    this.patch({ log: [...this.state.log, ...entries] }, generation)
  }

  private setThinking(label: string | null, generation: number): void {
    this.patch({ thinking: label }, generation)
    this.syncTransportFields()
  }

  private setCommentary(value: PokerRunnerState['commentary'], generation: number): void {
    this.patch({ commentary: value }, generation)
  }

  private delay(ms = this.speedMs): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  private async ensureMinDuration(startMs: number, minMs = MIN_THINK_MS): Promise<void> {
    const remaining = minMs - (Date.now() - startMs)
    if (remaining > 0) await this.delay(remaining)
  }

  /** Block until autoplay resumes or the run is aborted/reset. */
  private async waitForAutoplay(generation: number): Promise<boolean> {
    while (!this.autoplay && !this.aborted && this.running) {
      this.syncTransportFields()
      await this.delay(50)
      if (generation !== this.runGeneration) return false
    }
    return !this.aborted && generation === this.runGeneration
  }

  async run(
    playerModelIds: string[] = DEFAULT_POKER_PLAYER_MODEL_IDS,
    seed?: number,
  ): Promise<void> {
    if (this.running) {
      this.abort()
      await this.delay(50)
    }
    const generation = ++this.runGeneration
    this.aborted = false
    this.autoplay = true
    this.running = true
    this.state = { ...initialState, phase: 'playing', autoplay: true }
    for (const fn of this.listeners) fn(this.state)

    try {
      await this.playSitNGo(playerModelIds, seed, generation)
    } catch (e) {
      this.patch(
        { phase: 'error', error: e instanceof Error ? e.message : String(e) },
        generation,
      )
    } finally {
      if (generation === this.runGeneration) {
        this.running = false
        this.autoplay = false
        this.patch({ thinking: null, autoplay: false, pausePending: false }, generation)
      }
    }
  }

  private async playSitNGo(
    playerModelIds: string[],
    seed: number | undefined,
    generation: number,
  ): Promise<void> {
    const rng = new RNG(seed)
    const configs = buildPlayerConfigs(playerModelIds)
    const holdem = new Holdem(configs, STARTING_STACK, SMALL_BLIND, BIG_BLIND)
    const agents: PokerAgent[] = configs.map((c) =>
      makePokerAgent(c.model, proxyPokerCaller, (line) =>
        this.appendLogs([{ text: line, seat: c.seat, kind: 'system' }], generation),
      ),
    )
    const history: ActionRecord[] = []

    let dealer = rng.int(NUM_SEATS) as Seat
    this.emitSnapshot(holdem, generation)

    let hands = 0
    while (holdem.tournamentWinner() === null && hands < MAX_HANDS) {
      if (this.aborted || generation !== this.runGeneration) return
      if (!(await this.waitForAutoplay(generation))) return

      hands++
      const dealLog = holdem.startHand(dealer, rng)
      this.appendLogs(dealLog, generation)
      this.emitSnapshot(holdem, generation, null)
      await this.delay(AFTER_DEAL_MS)

      while (!holdem.handComplete) {
        if (this.aborted || generation !== this.runGeneration) return
        if (!(await this.waitForAutoplay(generation))) return

        const seat = holdem.toAct
        if (seat === null) break

        // --- Thinking phase: highlight the acting seat and show its live "typing"
        // bubble at the bottom of the chat, in sync. Past messages stay above.
        const thinkStart = Date.now()
        this.setCommentary({ seat, reasoning: null }, generation)
        this.setThinking(holdem.label(seat), generation)
        this.emitSnapshot(holdem, generation, seat)

        const action = await agents[seat]!.decide(holdem, seat, history)
        if (this.aborted || generation !== this.runGeneration) return
        await this.ensureMinDuration(thinkStart, MIN_THINK_MS)
        this.setThinking(null, generation)
        // The typing bubble resolves into a posted chat message (appended below).
        this.setCommentary(null, generation)

        const { log, record } = holdem.applyAction(seat, action)
        history.push(record)
        this.appendLogs([log[0]!], generation)
        if (action.reasoning) {
          this.appendLogs([{ text: action.reasoning, seat, kind: 'reasoning' }], generation)
        }
        this.appendLogs(log.slice(1), generation)
        this.emitSnapshot(holdem, generation)
      }

      if (this.aborted || generation !== this.runGeneration) return
      this.emitSnapshot(holdem, generation, null)
      await this.delay(BETWEEN_HANDS_MS)

      const busted = holdem.eliminateBusted()
      for (const s of busted) {
        this.appendLogs(
          [{ text: `${holdem.label(s)} is eliminated`, seat: s, kind: 'system' }],
          generation,
        )
      }
      dealer = this.nextDealer(holdem, dealer)
    }

    if (this.aborted || generation !== this.runGeneration) return

    const winner = holdem.tournamentWinner()
    if (winner !== null) {
      const winnerLabel = holdem.label(winner)
      this.appendLogs(
        [{ text: `${winnerLabel} wins the tournament!`, seat: winner, kind: 'winner' }],
        generation,
      )
      this.emitSnapshot(holdem, generation, null)
      this.patch({ phase: 'done', winnerLabel }, generation)
    } else {
      this.patch({ phase: 'done' }, generation)
    }
  }

  private nextDealer(holdem: Holdem, dealer: Seat): Seat {
    for (let i = 1; i <= NUM_SEATS; i++) {
      const cand = ((dealer + i) % NUM_SEATS) as Seat
      if (!holdem.player(cand).out) return cand
    }
    return dealer
  }

  /**
   * Emit a snapshot. When `focusSeat` is provided, the seat highlight (`isTurn`)
   * is overridden to that seat — `null` clears the highlight, a seat keeps it on
   * the actor through the reveal beat regardless of the engine's advanced toAct.
   * Omitting `focusSeat` uses the engine's own toAct.
   */
  private emitSnapshot(holdem: Holdem, generation: number, focusSeat?: Seat | null): void {
    const snapshot = holdem.snapshot()
    if (focusSeat !== undefined) {
      snapshot.seats = snapshot.seats.map((s) =>
        s.isTurn === (s.seat === focusSeat) ? s : { ...s, isTurn: s.seat === focusSeat },
      )
    }
    this.patch({ snapshot }, generation)
  }
}

export type { PokerRunnerState, PokerLogEntry }
