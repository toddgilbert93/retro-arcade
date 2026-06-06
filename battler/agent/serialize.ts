import type { Battle, Action, SideId } from '../engine/battle.ts';
import type { ChooserContext } from '../engine/driver.ts';
import type { BattlePokemon } from '../engine/battlePokemon.ts';
import type { RentalPokemon } from '../data/types.ts';
import { TYPE_CHART_LOOKUP } from '../data/typeChart.ts';
import { isPhysicalMove } from '../data/mechanics.ts';
import { POKEMON_BY_ID } from '../data/pokemon.ts';
import { MOVE_INDEX } from '../data/moves.ts';

/** The actions a side may legally take this turn. */
export interface LegalActions {
  /** Move slot indices with PP remaining and not disabled. */
  moveIndices: number[];
  /** Team indices the side may switch to (living, non-active). */
  switchIndices: number[];
  /** True if the side has no usable move (must Struggle). */
  mustStruggle: boolean;
}

/** Compute the legal actions for a side, mirroring the engine's own rules. */
export function legalActionsFor(battle: Battle, side: SideId): LegalActions {
  const self = battle.active(side);
  const moveIndices = self.moves
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.pp > 0 && slot.move !== self.volatile.disabledMove)
    .map(({ index }) => index);
  const activeIndex = battle.sides[side].activeIndex;
  const switchIndices = battle.livingIndices(side).filter((i) => i !== activeIndex);
  return { moveIndices, switchIndices, mustStruggle: moveIndices.length === 0 };
}

function types(p: { type1: string; type2: string }): string[] {
  return p.type1 === p.type2 ? [p.type1] : [p.type1, p.type2];
}

function nonZeroStages(stages: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(stages)) if (v !== 0) out[k] = v;
  return out;
}

function pct(n: number, max: number): number {
  return Math.max(0, Math.round((n / max) * 100));
}

/** Static rules primer used as the system prompt. Type chart is data-generated. */
export function rulesPrimer(): string {
  const chartLines: string[] = [];
  for (const [atk, defs] of Object.entries(TYPE_CHART_LOOKUP)) {
    if (!defs) continue;
    const supers = Object.entries(defs).filter(([, m]) => m === 2).map(([d]) => d);
    const halves = Object.entries(defs).filter(([, m]) => m === 0.5).map(([d]) => d);
    const immune = Object.entries(defs).filter(([, m]) => m === 0).map(([d]) => d);
    const parts: string[] = [];
    if (supers.length) parts.push(`2x vs ${supers.join(',')}`);
    if (halves.length) parts.push(`0.5x vs ${halves.join(',')}`);
    if (immune.length) parts.push(`0x vs ${immune.join(',')}`);
    if (parts.length) chartLines.push(`  ${atk}: ${parts.join('; ')}`);
  }

  return `You are an expert Pokémon trainer playing a Generation 1 (Red/Blue) battle.
Both sides field a team; the last side with a Pokémon standing wins.

TURN STRUCTURE:
- Each turn, one side commits an action first; the other sees that choice before deciding.
- You may also see the opponent's last resolved action from the previous turn.
- After both choices are locked in, the faster Pokémon acts first.
- Actions are: use one of your active Pokémon's moves, or switch to a benched Pokémon.
- Switching uses your whole turn (the foe still attacks).

DAMAGE BASICS:
- Damage scales with the attacker's Attack/Special, the move's power, and the
  defender's Defense/Special. Physical moves use Attack vs Defense; special moves
  use Special vs Special.
- STAB: a move whose type matches the user's type deals 1.5x.
- Type effectiveness multiplies damage (see chart). 0x means no effect at all.
- Critical hits (random, higher for fast/high-crit moves) deal ~2x and ignore stat changes.

STATUS & EFFECTS:
- SLEEP/FREEZE: the Pokémon cannot act (freeze rarely thaws).
- PARALYSIS: speed quartered; 25% chance to be fully unable to move.
- BURN: deals chip damage each turn and halves physical Attack.
- POISON/TOXIC: chip damage each turn (Toxic ramps up).
- Confusion / flinch / stat stages (-6..+6) also matter. Leech Seed drains HP each turn.

TYPE EFFECTIVENESS (Gen 1; attacker -> targets):
${chartLines.join('\n')}

You will receive the battle state as JSON, including an explicit list of legal
actions. Respond with EXACTLY ONE JSON object and nothing else:
  {"action":"move","moveIndex":N}     // N must be one of legalActions.moveIndices
  {"action":"switch","target":N}      // N must be one of legalActions.switchIndices
  {"action":"struggle"}               // only when legalActions.mustStruggle is true
Pick the action that best wins the battle. No prose, no explanation — JSON only.`;
}

/** Human-readable summary of a chosen or resolved action. */
export function describeAction(battle: Battle, side: SideId, action: Action): string {
  const name = battle.sides[side].name;
  if (action.type === 'switch') {
    const mon = battle.sides[side].team[action.target];
    return `${name} chose to switch to ${mon?.displayName ?? '???'}`;
  }
  if (action.type === 'struggle') return `${name} chose Struggle`;
  const slot = battle.active(side).moves[action.moveIndex];
  return `${name} chose ${slot?.move.name ?? '???'}`;
}

/** Structured action summary for model prompts. */
export function summarizeAction(
  battle: Battle,
  side: SideId,
  action: Action,
): Record<string, string | number> {
  if (action.type === 'switch') {
    const mon = battle.sides[side].team[action.target];
    return { action: 'switch', target: mon?.displayName ?? 'unknown', switchIndex: action.target };
  }
  if (action.type === 'struggle') return { action: 'struggle', move: 'Struggle' };
  const slot = battle.active(side).moves[action.moveIndex];
  return {
    action: 'move',
    move: slot?.move.name ?? 'unknown',
    moveIndex: action.moveIndex,
  };
}

/** Battle-visible JSON state for the side to move. */
export function describeBattleState(
  battle: Battle,
  side: SideId,
  ctx?: ChooserContext,
): string {
  const self = battle.active(side);
  const foe = battle.active(side === 0 ? 1 : 0);
  const legal = legalActionsFor(battle, side);
  const activeIndex = battle.sides[side].activeIndex;

  const moveLine = (slot: BattlePokemon['moves'][number], index: number) => ({
    index,
    name: slot.move.name,
    type: slot.move.type,
    power: slot.move.power,
    category: slot.move.power > 0 ? (isPhysicalMove(slot.move.type) ? 'physical' : 'special') : 'status',
    accuracy: slot.move.accuracy,
    pp: slot.pp,
    maxPp: slot.maxPp,
  });

  const state = {
    turn: battle.turn,
    you: {
      species: self.species.name,
      types: types(self),
      hp: self.hp,
      maxHp: self.stats.maxHp,
      hpPct: pct(self.hp, self.stats.maxHp),
      status: self.status,
      statStages: nonZeroStages(self.stages),
      moves: self.moves.map(moveLine),
    },
    foe: {
      species: foe.species.name,
      types: types(foe),
      hpPct: pct(foe.hp, foe.stats.maxHp),
      status: foe.status,
      statStages: nonZeroStages(foe.stages),
    },
    bench: battle.sides[side].team
      .map((mon, i) => ({ mon, i }))
      .filter(({ mon, i }) => i !== activeIndex && !mon.isFainted)
      .map(({ mon, i }) => ({
        switchIndex: i,
        species: mon.species.name,
        types: types(mon),
        hpPct: pct(mon.hp, mon.stats.maxHp),
        status: mon.status,
      })),
    legalActions: legal,
    ...(ctx?.foeLastAction && {
      foeLastAction: summarizeAction(battle, side === 0 ? 1 : 0, ctx.foeLastAction),
    }),
    ...(ctx?.foeCommittedAction && {
      foeCommittedAction: summarizeAction(battle, side === 0 ? 1 : 0, ctx.foeCommittedAction),
    }),
  };

  return JSON.stringify(state, null, 2);
}

/** Draft-time JSON state: remaining pool + picks so far + whose turn. */
export function describeDraftState(
  remainingPool: RentalPokemon[],
  myTeam: RentalPokemon[],
  oppTeam: RentalPokemon[],
  pickNumber: number,
): string {
  const describe = (r: RentalPokemon) => {
    const sp = POKEMON_BY_ID[r.species]!;
    return {
      species: sp.name,
      types: types(sp),
      baseStats: sp.baseStats,
      moves: r.moves
        .filter((m) => m !== '0' && m !== '')
        .map((m) => {
          const mv = MOVE_INDEX[m]!;
          return { name: mv.name, type: mv.type, power: mv.power };
        }),
    };
  };

  const state = {
    pickNumber,
    teamSizeTarget: 4,
    yourPicks: myTeam.map((r) => POKEMON_BY_ID[r.species]!.name),
    opponentPicks: oppTeam.map((r) => POKEMON_BY_ID[r.species]!.name),
    available: remainingPool.map((r, poolIndex) => ({ poolIndex, ...describe(r) })),
  };

  return JSON.stringify(state, null, 2);
}

/** System prompt for the draft phase. */
export function draftPrimer(): string {
  return `You are drafting a 4-Pokémon team for a Generation 1 battle, picking one
Pokémon at a time from a shared pool (alternating snake order with your opponent;
a Pokémon taken by either side is gone). Build a balanced, type-diverse team that
covers threats and avoids shared weaknesses.

You will receive the draft state as JSON, including "available" with a poolIndex
for each remaining Pokémon. Respond with EXACTLY ONE JSON object and nothing else:
  {"pick": N}     // N must be one of the poolIndex values in "available"
No prose, no explanation — JSON only.`;
}
