import type { Battle, Action, SideId } from '../engine/battle.ts';
import type { Chooser, ChooserContext, Replacer } from '../engine/driver.ts';
import { chooseAIAction, chooseAISwitch } from '../engine/ai.ts';
import type { RentalPokemon } from '../data/types.ts';
import { POKEMON_BY_ID } from '../data/pokemon.ts';
import {
  rulesPrimer,
  draftPrimer,
  describeBattleState,
  describeDraftState,
  legalActionsFor,
} from './serialize.ts';

/** Picks a pool index for the next draft selection. */
export type Drafter = (
  remainingPool: RentalPokemon[],
  myTeam: RentalPokemon[],
  oppTeam: RentalPokemon[],
  pickNumber: number,
) => number | Promise<number>;

export type Logger = (line: string) => void;

/**
 * Sends a system+user prompt to a model and returns the raw reply text.
 * Injected so the same chooser logic works with the Node OpenRouter client
 * (CLI) or a browser proxy transport (web UI).
 */
export type ModelCallOptions = { temperature?: number };

export type ModelCaller = (
  model: string,
  system: string,
  user: string,
  opts?: ModelCallOptions,
) => Promise<string>;

/** Draft picks can be a bit more varied than in-battle move selection. */
export const DRAFT_MODEL_TEMPERATURE = 1.0;

/** Extract the first JSON object from a model reply (tolerates code fences/prose). */
function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asInt(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isInteger(n) ? n : null;
}

/** An LLM-driven Chooser. Falls back to the heuristic AI on any failure. */
export function makeLLMChooser(model: string, call: ModelCaller, log?: Logger): Chooser {
  return async (battle: Battle, side: SideId, ctx?: ChooserContext): Promise<Action> => {
    const legal = legalActionsFor(battle, side);
    const fallback = (reason: string): Action => {
      log?.(`[fallback] ${model} move: ${reason}`);
      return chooseAIAction(battle, side);
    };

    try {
      const user = describeBattleState(battle, side, ctx);
      const reply = await call(model, rulesPrimer(), user);
      const obj = parseJsonObject(reply);
      if (!obj) return fallback('unparseable reply');

      const action = String(obj.action ?? '').toLowerCase();
      if (action === 'move') {
        const idx = asInt(obj.moveIndex);
        if (idx !== null && legal.moveIndices.includes(idx)) {
          return { type: 'move', moveIndex: idx };
        }
        return fallback(`illegal moveIndex ${String(obj.moveIndex)}`);
      }
      if (action === 'switch') {
        const idx = asInt(obj.target);
        if (idx !== null && legal.switchIndices.includes(idx)) {
          return { type: 'switch', target: idx };
        }
        return fallback(`illegal switch target ${String(obj.target)}`);
      }
      if (action === 'struggle' && legal.mustStruggle) {
        return { type: 'struggle' };
      }
      return fallback(`invalid action "${action}"`);
    } catch (e) {
      return fallback(e instanceof Error ? e.message : String(e));
    }
  };
}

/** An LLM-driven Replacer (after a faint). Falls back to the heuristic AI. */
export function makeLLMReplacer(model: string, call: ModelCaller, log?: Logger): Replacer {
  return async (battle: Battle, side: SideId): Promise<number> => {
    const living = battle.livingIndices(side);
    const fallback = (reason: string): number => {
      log?.(`[fallback] ${model} switch: ${reason}`);
      return chooseAISwitch(battle, side);
    };

    try {
      const user =
        describeBattleState(battle, side) +
        '\n\nYour active Pokémon fainted. Choose a replacement from ' +
        'legalActions.switchIndices. Respond with {"action":"switch","target":N}.';
      const reply = await call(model, rulesPrimer(), user);
      const obj = parseJsonObject(reply);
      if (!obj) return fallback('unparseable reply');
      const idx = asInt(obj.target);
      if (idx !== null && living.includes(idx)) return idx;
      return fallback(`illegal replacement ${String(obj.target)}`);
    } catch (e) {
      return fallback(e instanceof Error ? e.message : String(e));
    }
  };
}

function bst(r: RentalPokemon): number {
  const s = POKEMON_BY_ID[r.species]!.baseStats;
  return s.hp + s.attack + s.defense + s.speed + s.special;
}

/** Deterministic heuristic drafter: pick the highest base-stat-total available. */
export const heuristicDrafter: Drafter = (remainingPool) => {
  let best = 0;
  for (let i = 1; i < remainingPool.length; i++) {
    if (bst(remainingPool[i]!) > bst(remainingPool[best]!)) best = i;
  }
  return best;
};

/** An LLM-driven Drafter. Falls back to the highest-BST available pick. */
export function makeLLMDrafter(model: string, call: ModelCaller, log?: Logger): Drafter {
  return async (remainingPool, myTeam, oppTeam, pickNumber): Promise<number> => {
    const fallback = (reason: string): number => {
      log?.(`[fallback] ${model} draft: ${reason}`);
      return heuristicDrafter(remainingPool, myTeam, oppTeam, pickNumber) as number;
    };

    try {
      const user = describeDraftState(remainingPool, myTeam, oppTeam, pickNumber);
      const reply = await call(model, draftPrimer(), user, { temperature: DRAFT_MODEL_TEMPERATURE });
      const obj = parseJsonObject(reply);
      if (!obj) return fallback('unparseable reply');
      const idx = asInt(obj.pick);
      if (idx !== null && idx >= 0 && idx < remainingPool.length) return idx;
      return fallback(`illegal pick ${String(obj.pick)}`);
    } catch (e) {
      return fallback(e instanceof Error ? e.message : String(e));
    }
  };
}
