import type { Move } from '../data/types.ts';
import { getTypeMultiplier } from '../data/typeChart.ts';
import { isPhysicalMove } from '../data/mechanics.ts';
import { getStatMultiplier } from '../data/mechanics.ts';
import type { BattlePokemon } from './battlePokemon.ts';
import type { RNG } from './rng.ts';

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  typeMultiplier: number; // combined effectiveness vs both defender types
  stab: boolean;
}

/**
 * Critical hit test (Gen 1).
 *   threshold = baseSpeed / 2   (normal moves)
 *   threshold = baseSpeed * 4   (high-crit moves, capped at 255)
 *   Focus Energy *quarters* it in Gen 1 (the famous bug) — we keep that quirk.
 * A random byte (0..255) under the threshold => crit.
 */
export function rollCritical(attacker: BattlePokemon, move: Move, rng: RNG): boolean {
  const baseSpeed = attacker.species.baseStats.speed;
  let threshold = Math.floor(baseSpeed / 2);

  if (attacker.volatile.focusEnergy) {
    threshold = Math.floor(threshold / 4); // Gen 1 bug: Focus Energy lowers crit rate
  }
  if (move.isHighCrit) {
    threshold = Math.min(255, threshold * 8);
  } else {
    threshold = Math.min(255, threshold);
  }
  return rng.int(256) < threshold;
}

/** Combined type effectiveness of a move vs a defender's one or two types. */
export function effectiveness(move: Move, defender: BattlePokemon): number {
  let mult = getTypeMultiplier(move.type, defender.type1);
  if (defender.type2 !== defender.type1) {
    mult *= getTypeMultiplier(move.type, defender.type2);
  }
  return mult;
}

/**
 * Full Gen 1 damage calculation for a damaging move.
 * Returns 0 damage for status moves (power 0) and for type-immune hits.
 */
export function calcDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: Move,
  rng: RNG,
  opts: { forceCrit?: boolean; randomize?: boolean } = {},
): DamageResult {
  const typeMult = effectiveness(move, defender);
  const stab = attacker.hasType(move.type);

  if (move.power <= 0 || typeMult === 0) {
    return { damage: 0, isCritical: false, typeMultiplier: typeMult, stab };
  }

  const isCrit = opts.forceCrit ?? rollCritical(attacker, move, rng);
  const physical = isPhysicalMove(move.type);

  // Choose the relevant stats. In Gen 1, Special covers both Sp.Atk and Sp.Def.
  let atk = physical ? attacker.stats.attack : attacker.stats.special;
  let def = physical ? defender.stats.defense : defender.stats.special;

  if (isCrit) {
    // Crits ignore stat-stage changes entirely (use raw computed stats).
    // (atk/def already the raw computed stats above.)
  } else {
    const atkStage = physical ? attacker.stages.attack : attacker.stages.special;
    const defStage = physical ? defender.stages.defense : defender.stages.special;
    atk = Math.floor(atk * getStatMultiplier(atkStage));
    def = Math.floor(def * getStatMultiplier(defStage));

    // Burn halves physical attack.
    if (physical && attacker.status === 'BURN') atk = Math.floor(atk / 2);

    // Reflect (physical) / Light Screen (special) double the defense — non-crit only.
    if (physical && defender.volatile.reflect) def = def * 2;
    if (!physical && defender.volatile.lightScreen) def = def * 2;
  }

  atk = Math.max(1, atk);
  def = Math.max(1, def);

  const level = isCrit ? attacker.level * 2 : attacker.level;

  // Core formula.
  let dmg = Math.floor((2 * level) / 5 + 2);
  dmg = Math.floor((dmg * move.power * atk) / def);
  dmg = Math.floor(dmg / 50) + 2;

  // STAB.
  if (stab) dmg = Math.floor(dmg * 1.5);

  // Type effectiveness.
  dmg = Math.floor(dmg * typeMult);

  // Random factor 217..255 / 255 (skip when randomize is explicitly false).
  if (opts.randomize !== false) {
    const r = rng.range(217, 255);
    dmg = Math.floor((dmg * r) / 255);
  }

  dmg = Math.max(1, dmg);

  return { damage: dmg, isCritical: isCrit, typeMultiplier: typeMult, stab };
}
