import type { StatStageEntry } from './types';

// Stat stage multipliers from StatModifierRatios (main.asm:70630)
// stage ranges from -6 to +6
export const STAT_STAGES: StatStageEntry[] = [
  { stage: -6, numerator: 25, denominator: 100, multiplier: 0.25 },
  { stage: -5, numerator: 28, denominator: 100, multiplier: 0.28 },
  { stage: -4, numerator: 33, denominator: 100, multiplier: 0.33 },
  { stage: -3, numerator: 40, denominator: 100, multiplier: 0.40 },
  { stage: -2, numerator: 50, denominator: 100, multiplier: 0.50 },
  { stage: -1, numerator: 66, denominator: 100, multiplier: 0.66 },
  { stage:  0, numerator:  1, denominator:   1, multiplier: 1.00 },
  { stage:  1, numerator: 15, denominator:  10, multiplier: 1.50 },
  { stage:  2, numerator:  2, denominator:   1, multiplier: 2.00 },
  { stage:  3, numerator: 25, denominator:  10, multiplier: 2.50 },
  { stage:  4, numerator:  3, denominator:   1, multiplier: 3.00 },
  { stage:  5, numerator: 35, denominator:  10, multiplier: 3.50 },
  { stage:  6, numerator:  4, denominator:   1, multiplier: 4.00 },
];

export function getStatMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  return STAT_STAGES[clamped + 6]?.multiplier ?? 1;
}

// Gen 1 damage formula:
// damage = Math.floor(
//   Math.floor((Math.floor(2 * level / 5 + 2) * power * attack / defense) / 50) + 2
// ) * stab * typeEffectiveness * critMultiplier
//
// stab = 1.5 if move type matches attacker type1 or type2, else 1
// critMultiplier = 2 (critical hit), 1 (normal)
// typeEffectiveness = product of getTypeMultiplier() for each defender type
//
// Note: In Gen 1, Special is used for both Sp.Atk and Sp.Def.
// Physical types: Normal, Fighting, Flying, Poison, Ground, Rock, Bug, Ghost
// Special types: Fire, Water, Grass, Electric, Ice, Psychic, Dragon
export const PHYSICAL_TYPES = new Set([
  'NORMAL', 'FIGHTING', 'FLYING', 'POISON', 'GROUND', 'ROCK', 'BUG', 'GHOST',
]);

export function isPhysicalMove(type: string): boolean {
  return PHYSICAL_TYPES.has(type);
}

// Experience formulas by growth rate
// n = level
export const EXP_FORMULAS: Record<string, (n: number) => number> = {
  MEDIUM_FAST: (n) => Math.floor(n ** 3),
  MEDIUM_SLOW: (n) => Math.floor((6 / 5) * n ** 3 - 15 * n ** 2 + 100 * n - 140),
  FAST:        (n) => Math.floor((4 / 5) * n ** 3),
  SLOW:        (n) => Math.floor((5 / 4) * n ** 3),
};

// High critical hit moves (from HighCriticalMoves table, main.asm:67333)
// These use speed*8 as crit threshold instead of speed/2
export const HIGH_CRIT_MOVES = new Set(['SLASH', 'RAZOR_LEAF', 'CRABHAMMER', 'KARATE_CHOP']);
