import { Battle } from '@battler/engine/battle.ts'
import type { Action, SideId } from '@battler/engine/battle.ts'
import type { BattlePokemon } from '@battler/engine/battlePokemon.ts'
import { buildPlayerSide } from '@battler/factory.ts'
import {
  makeLLMChooser,
  makeLLMReplacer,
  makeLLMDrafter,
} from '@battler/agent/llmChooser.ts'
import { describeAction } from '@battler/agent/serialize.ts'
import { SNAKE_ORDER } from '@battler/agent/draft.ts'
import { randomDraftPool } from '@battler/data/draftPool.ts'
import { POKEMON_BY_ID } from '@battler/data/pokemon.ts'
import { RNG } from '@battler/engine/rng.ts'
import type { RentalPokemon } from '@battler/data/types.ts'
import type { ArenaModel } from '@battler/agent/models.ts'
import { proxyModelCaller } from './transport'
import { inferLogSide } from './logSide'
import type {
  BattleSnapshot,
  DraftPick,
  LogEntry,
  MonView,
  MoveView,
  RunnerState,
  SideView,
} from './types'
import {
  BOTH_COMMITTED_MS,
  BETWEEN_MOVES_MS,
  MOVE_CARET_MS,
  batchMoveLogs,
  captureField,
  phaseDuration,
  syncImpactField,
  syncStatusField,
  type FieldSnapshot,
  type FieldState,
} from './moveSequence'

const MAX_TURNS = 300
/** Minimum wall-clock time for each player's decision window (move pick or switch-in). */
const MIN_ACTION_MS = 1200

type Listener = (state: RunnerState) => void

const initialState: RunnerState = {
  phase: 'idle',
  snapshot: null,
  draftPicks: [],
  log: [],
  winnerLabel: null,
  thinking: null,
  error: null,
  autoplay: false,
  pausePending: false,
}

/**
 * Drives one AI-vs-AI match (draft + battle) and emits a fresh RunnerState to
 * subscribers after every step, so a React view can animate it turn-by-turn.
 *
 * Re-implements the driver loop (engine/driver.ts) using the public Battle API,
 * adding per-player decision clocks, fast move resolution, and abort.
 */
export class PokemonBattleRunner {
  private listeners = new Set<Listener>()
  private state: RunnerState = initialState
  private aborted = false
  private running = false
  private autoplay = false
  private runGeneration = 0
  private speedMs = 750

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

  private patch(p: Partial<RunnerState>, generation?: number): void {
    if (generation !== undefined && generation !== this.runGeneration) return
    this.state = { ...this.state, ...p }
    for (const fn of this.listeners) fn(this.state)
  }

  private appendLog(
    text: string,
    generation?: number,
    side?: SideId,
    kind: LogEntry['kind'] = 'message',
  ): void {
    if (/^--- Turn \d+ ---$/.test(text)) return
    this.patch({ log: [...this.state.log, { text, side, kind }] }, generation)
  }

  private setThinking(label: string | null, generation: number): void {
    this.patch({ thinking: label }, generation)
    this.syncTransportFields()
  }

  private delay(ms = this.speedMs): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }

  /** Wait out the remainder of `minMs` since `startMs`. */
  private async ensureMinDuration(startMs: number, minMs = MIN_ACTION_MS): Promise<void> {
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

  async run(modelA: ArenaModel, modelB: ArenaModel, seed?: number): Promise<void> {
    if (this.running) {
      this.abort()
      await this.delay(50)
    }
    const generation = ++this.runGeneration
    this.aborted = false
    this.autoplay = true
    this.running = true
    this.state = { ...initialState, phase: 'drafting', autoplay: true }
    for (const fn of this.listeners) fn(this.state)

    try {
      await this.draftAndBattle(modelA, modelB, seed, generation)
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

  private async draftAndBattle(
    modelA: ArenaModel,
    modelB: ArenaModel,
    seed: number | undefined,
    generation: number,
  ): Promise<void> {
    const call = proxyModelCaller

    // --- Draft (snake order), emitting each pick as it lands. ---
    const draftRng = new RNG(seed)
    const pool = randomDraftPool(draftRng)

    const drafterA = makeLLMDrafter(modelA.model, call, (l) => this.appendLog(l, generation))
    const drafterB = makeLLMDrafter(modelB.model, call, (l) => this.appendLog(l, generation))
    const remaining = [...pool]
    const teamA: RentalPokemon[] = []
    const teamB: RentalPokemon[] = []
    const picks: DraftPick[] = []

    let pickNumber = 0
    for (const side of SNAKE_ORDER) {
      if (this.aborted || generation !== this.runGeneration) return
      if (!(await this.waitForAutoplay(generation))) return

      const drafter = side === 0 ? drafterA : drafterB
      const myTeam = side === 0 ? teamA : teamB
      const oppTeam = side === 0 ? teamB : teamA
      this.setThinking(side === 0 ? modelA.label : modelB.label, generation)

      let idx = await drafter(remaining, myTeam, oppTeam, pickNumber)
      if (this.aborted || generation !== this.runGeneration) return
      if (!Number.isInteger(idx) || idx < 0 || idx >= remaining.length) idx = 0
      const [picked] = remaining.splice(idx, 1)
      myTeam.push(picked!)
      const sp = POKEMON_BY_ID[picked!.species]!
      picks.push({ side, species: sp.name, dexNumber: sp.dexNumber })
      this.appendLog(
        `${side === 0 ? modelA.label : modelB.label} drafts ${sp.name}`,
        generation,
        side,
      )
      this.patch({ draftPicks: [...picks] }, generation)
      this.setThinking(null, generation)
      pickNumber++
      await this.delay(350)
    }
    if (this.aborted || generation !== this.runGeneration) return

    // --- Battle ---
    const sideA = buildPlayerSide(modelA.label, teamA)
    const sideB = buildPlayerSide(modelB.label, teamB)
    const battle = new Battle(sideA, sideB, {
      seed,
      onLog: (l) => this.appendLog(l, generation, inferLogSide(l, battle)),
    })
    this.patch({ phase: 'battle' }, generation)
    this.emitSnapshot(battle, null, generation)
    await this.delay(400)

    const battleLog = (l: string) => this.appendLog(l, generation, inferLogSide(l, battle))
    const chooserA = makeLLMChooser(modelA.model, call, battleLog)
    const chooserB = makeLLMChooser(modelB.model, call, battleLog)
    const replacerA = makeLLMReplacer(modelA.model, call, battleLog)
    const replacerB = makeLLMReplacer(modelB.model, call, battleLog)
    let lastResolved: Record<SideId, Action | null> = { 0: null, 1: null }

    while (!battle.finished && battle.turn < MAX_TURNS && !this.aborted) {
      if (generation !== this.runGeneration) return
      if (!(await this.waitForAutoplay(generation))) return

      const phaseStartA = Date.now()
      this.setThinking(modelA.label, generation)
      this.emitSnapshot(battle, null, generation, { 0: null, 1: null })
      const actionA = await chooserA(battle, 0, {
        foeLastAction: lastResolved[1] ?? undefined,
      })
      if (this.aborted || generation !== this.runGeneration) return
      this.setThinking(null, generation)
      this.appendLog(describeAction(battle, 0, actionA), generation, 0)
      this.emitSnapshot(battle, null, generation, { 0: actionA, 1: null })
      await this.ensureMinDuration(phaseStartA)

      if (!(await this.waitForAutoplay(generation))) return
      const phaseStartB = Date.now()
      this.setThinking(modelB.label, generation)
      this.emitSnapshot(battle, null, generation, { 0: actionA, 1: null })
      const actionB = await chooserB(battle, 1, {
        foeLastAction: lastResolved[0] ?? undefined,
        foeCommittedAction: actionA,
      })
      if (this.aborted || generation !== this.runGeneration) return
      this.setThinking(null, generation)
      this.appendLog(describeAction(battle, 1, actionB), generation, 1)
      this.emitSnapshot(battle, null, generation, { 0: actionA, 1: actionB })
      await this.ensureMinDuration(phaseStartB)

      const actions: Record<SideId, Action> = { 0: actionA, 1: actionB }
      const moveOrder = battle.beginTurn(actions)
      // Brief beat with both move carets locked before resolution begins.
      this.emitSnapshot(battle, null, generation, { 0: actionA, 1: actionB })
      await this.delay(BOTH_COMMITTED_MS)

      for (let i = 0; i < moveOrder.length; i++) {
        if (this.aborted || generation !== this.runGeneration) return
        if (!(await this.waitForAutoplay(generation))) return

        const side = moveOrder[i]!
        const acted = await this.resolveMoveWithAnimation(
          battle,
          side,
          actions[side],
          generation,
        )
        if (!acted) return
        if (i < moveOrder.length - 1) await this.delay(BETWEEN_MOVES_MS)
        if (battle.finished) break
      }

      if (!battle.finished) {
        for (const side of battle.speedOrder()) {
          if (this.aborted || generation !== this.runGeneration) return
          if (!(await this.waitForAutoplay(generation))) return

          battle.executeTurnEndPhase(side)
          this.emitSnapshot(battle, null, generation, { 0: null, 1: null })
          if (battle.finished) break
        }
      }

      lastResolved = { 0: actionA, 1: actionB }

      for (const side of [0, 1] as SideId[]) {
        if (battle.active(side).isFainted) battle.announceFaint(side)
      }
      if (battle.finished) break

      for (const side of [0, 1] as SideId[]) {
        if (battle.needsReplacement(side)) {
          if (!(await this.waitForAutoplay(generation))) return

          const replStart = Date.now()
          this.setThinking(side === 0 ? modelA.label : modelB.label, generation)
          const replacer = side === 0 ? replacerA : replacerB
          const idx = await replacer(battle, side)
          if (this.aborted || generation !== this.runGeneration) return

          battle.sides[side].activeIndex = idx
          battle.onLog?.(
            `${battle.sides[side].name} sent out ${battle.active(side).displayName}!`,
          )
          this.setThinking(null, generation)
          this.emitSnapshot(battle, null, generation)
          await this.ensureMinDuration(replStart)
        }
      }
    }

    if (this.aborted || generation !== this.runGeneration) return

    let winner = battle.winner
    if (winner === null) {
      const hp = (s: SideId) => battle.sides[s].team.reduce((sum, p) => sum + p.hp, 0)
      winner = hp(0) >= hp(1) ? 0 : 1
    }
    const winnerLabel = winner === 0 ? modelA.label : modelB.label
    this.emitSnapshot(battle, winner, generation)
    this.appendLog(`${winnerLabel} wins!`, generation, winner, 'winner')
    this.patch({ phase: 'done', winnerLabel }, generation)
  }

  /**
   * Buffer engine logs, then replay them in phases:
   * caret → activity (announce) → hit animation (impact) → status badge.
   */
  private async resolveMoveWithAnimation(
    battle: Battle,
    side: SideId,
    action: Action,
    generation: number,
  ): Promise<boolean> {
    if (action.type === 'switch') {
      this.emitSnapshot(battle, null, generation, { 0: null, 1: null })
      return true
    }

    const field = captureField(battle)
    const buffered: LogEntry[] = []
    const prevOnLog = battle.onLog
    battle.onLog = (line) => {
      buffered.push({ text: line, side: inferLogSide(line, battle) })
    }

    battle.executeTurnMove(side, action)
    battle.onLog = prevOnLog

    const selection: Partial<Record<SideId, Action | null>> = { [side]: action }
    this.emitSnapshot(battle, null, generation, selection, field)
    await this.delay(MOVE_CARET_MS)
    if (this.aborted || generation !== this.runGeneration) return false
    if (!(await this.waitForAutoplay(generation))) return false

    const batches = batchMoveLogs(buffered)
    for (const batch of batches) {
      for (const line of batch.lines) {
        this.appendLog(line.text, generation, line.side)
      }

      if (batch.phase === 'impact') syncImpactField(field, battle)
      if (batch.phase === 'status') syncStatusField(field, battle)

      const showCaret = batch.phase === 'announce'
      this.emitSnapshot(
        battle,
        null,
        generation,
        showCaret ? selection : { 0: null, 1: null },
        field,
      )
      await this.delay(phaseDuration(batch.phase))
      if (this.aborted || generation !== this.runGeneration) return false
      if (!(await this.waitForAutoplay(generation))) return false
    }

    this.emitSnapshot(battle, null, generation, { 0: null, 1: null })
    return true
  }

  private emitSnapshot(
    battle: Battle,
    winner: 0 | 1 | null = null,
    generation?: number,
    selections: Partial<Record<SideId, Action | null>> = {},
    field?: FieldState,
  ): void {
    this.patch(
      {
        snapshot: {
          turn: battle.turn,
          sideA: sideView(battle, 0, selections[0] ?? null, field?.[0]),
          sideB: sideView(battle, 1, selections[1] ?? null, field?.[1]),
          finished: battle.finished,
          winner: winner ?? battle.winner,
        },
      },
      generation,
    )
  }
}

function moveViews(p: BattlePokemon): MoveView[] {
  return p.moves.map((slot) => ({
    name: slot.move.name,
    type: slot.move.type,
    pp: slot.pp,
    maxPp: slot.maxPp,
    disabled: slot.pp === 0 || slot.move === p.volatile.disabledMove,
  }))
}

function selectionForSide(action: Action | null): {
  selectedMoveIndex: number | null
  struggleSelected: boolean
} {
  if (!action || action.type === 'switch') {
    return { selectedMoveIndex: null, struggleSelected: false }
  }
  if (action.type === 'struggle') {
    return { selectedMoveIndex: null, struggleSelected: true }
  }
  return { selectedMoveIndex: action.moveIndex, struggleSelected: false }
}

function monView(p: BattlePokemon, field?: FieldSnapshot): MonView {
  const types = p.type1 === p.type2 ? [p.type1] : [p.type1, p.type2]
  const hp = field?.hp ?? Math.max(0, p.hp)
  const maxHp = p.stats.maxHp
  return {
    species: p.species.name,
    dexNumber: p.species.dexNumber,
    hp,
    maxHp,
    hpPct: Math.max(0, Math.round((hp / maxHp) * 100)),
    status: field?.status ?? p.status,
    types,
    fainted: field?.fainted ?? p.isFainted,
    moves: moveViews(p),
  }
}

function sideView(
  battle: Battle,
  side: SideId,
  selection: Action | null,
  field?: FieldSnapshot,
): SideView {
  const s = battle.sides[side]
  const { selectedMoveIndex, struggleSelected } = selectionForSide(selection)
  return {
    name: s.name,
    active: monView(battle.active(side), field),
    team: s.team.map((p) => ({
      species: p.species.name,
      dexNumber: p.species.dexNumber,
      hpPct: Math.max(0, Math.round((p.hp / p.stats.maxHp) * 100)),
      fainted: p.isFainted,
    })),
    selectedMoveIndex,
    struggleSelected,
  }
}

export type { RunnerState, BattleSnapshot, SideView, MonView, DraftPick }
