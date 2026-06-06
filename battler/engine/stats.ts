import type { BaseStats } from '../data/types.ts';

// Gen 1 stat calculation.
//
// In Gen 1, "IVs" are 4-bit DVs (0..15) and "EVs" are stat experience (0..65535).
// HP DV is derived from the parity of the other four DVs.
//
//   HP    = floor((2*(base + DV) + floor(sqrt(statExp)/4)) * level / 100) + level + 10
//   other = floor((2*(base + DV) + floor(sqrt(statExp)/4)) * level / 100) + 5

export interface IVs {
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export interface StatExp {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export interface ComputedStats {
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

/** Perfect DVs (15 each). The HP DV falls out of the others (all-15 => HP DV 15). */
export const PERFECT_IVS: IVs = { attack: 15, defense: 15, speed: 15, special: 15 };

export const ZERO_STAT_EXP: StatExp = {
  hp: 0,
  attack: 0,
  defense: 0,
  speed: 0,
  special: 0,
};

/** HP DV is the LSB of each of the four other DVs combined into a 4-bit value. */
export function hpDV(ivs: IVs): number {
  return (
    ((ivs.attack & 1) << 3) |
    ((ivs.defense & 1) << 2) |
    ((ivs.speed & 1) << 1) |
    (ivs.special & 1)
  );
}

function statExpBonus(exp: number): number {
  return Math.floor(Math.ceil(Math.sqrt(exp)) / 4);
}

function calcHp(base: number, dv: number, exp: number, level: number): number {
  return (
    Math.floor(((2 * (base + dv) + statExpBonus(exp)) * level) / 100) + level + 10
  );
}

function calcOther(base: number, dv: number, exp: number, level: number): number {
  return Math.floor(((2 * (base + dv) + statExpBonus(exp)) * level) / 100) + 5;
}

export function computeStats(
  base: BaseStats,
  level: number,
  ivs: IVs = PERFECT_IVS,
  statExp: StatExp = ZERO_STAT_EXP,
): ComputedStats {
  return {
    maxHp: calcHp(base.hp, hpDV(ivs), statExp.hp, level),
    attack: calcOther(base.attack, ivs.attack, statExp.attack, level),
    defense: calcOther(base.defense, ivs.defense, statExp.defense, level),
    speed: calcOther(base.speed, ivs.speed, statExp.speed, level),
    special: calcOther(base.special, ivs.special, statExp.special, level),
  };
}
