import { RENTAL_CLASSES } from './data/rentalPool.ts';
import { BOSS_TEAMS } from './data/bossTeams.ts';
import type { RentalPokemon } from './data/types.ts';
import { RNG } from './engine/rng.ts';
import { BattlePokemon, makePokemon } from './engine/battlePokemon.ts';
import type { Side } from './engine/battle.ts';

export const FACTORY_LEVEL = 50;

// In the Battle Factory you rent 3 of 6 offered Pokémon.
export const OFFER_SIZE = 6;
export const TEAM_SIZE = 3;

// A "special" boss trainer appears every 7th battle (the 7th of each set).
export const BOSS_INTERVAL = 7;

/** Difficulty class (1-9) for a given win streak. */
export function classForStreak(streak: number): number {
  return Math.min(9, Math.floor(streak / BOSS_INTERVAL) + 1);
}

/** True if the battle at this streak position is a boss battle. */
export function isBossBattle(streak: number): boolean {
  return streak > 0 && (streak + 1) % BOSS_INTERVAL === 0;
}

function rentalToPokemon(r: RentalPokemon): BattlePokemon {
  return makePokemon(r.species, r.moves, FACTORY_LEVEL);
}

/** Offer a set of rental Pokémon to choose from, drawn from the streak's class. */
export function offerRentals(streak: number, rng: RNG): RentalPokemon[] {
  const cls = classForStreak(streak);
  const pool = RENTAL_CLASSES[cls - 1]!.pokemon;
  const offered: RentalPokemon[] = [];
  const used = new Set<number>();
  while (offered.length < OFFER_SIZE && used.size < pool.length) {
    const i = rng.int(pool.length);
    if (used.has(i)) continue;
    used.add(i);
    offered.push(pool[i]!);
  }
  return offered;
}

/** Build the opponent's team for a given streak (boss every 7th battle). */
export function buildOpponent(
  streak: number,
  rng: RNG,
): { side: Side; isBoss: boolean; team: RentalPokemon[] } {
  if (isBossBattle(streak)) {
    const boss = rng.pick(BOSS_TEAMS);
    const team = boss.pokemon.slice(0, TEAM_SIZE);
    const mons = team.map((m) => makePokemon(m.species, m.moves, FACTORY_LEVEL));
    return {
      side: { name: `Boss ${capitalize(boss.name)}`, team: mons, activeIndex: 0 },
      isBoss: true,
      team: team.map((m) => ({ species: m.species, moves: m.moves })),
    };
  }

  const cls = classForStreak(streak);
  const pool = RENTAL_CLASSES[cls - 1]!.pokemon;
  const team: RentalPokemon[] = [];
  const used = new Set<number>();
  while (team.length < TEAM_SIZE && used.size < pool.length) {
    const i = rng.int(pool.length);
    if (used.has(i)) continue;
    used.add(i);
    team.push(pool[i]!);
  }
  return {
    side: {
      name: `Trainer (Class ${cls})`,
      team: team.map(rentalToPokemon),
      activeIndex: 0,
    },
    isBoss: false,
    team,
  };
}

/** Build a player Side from chosen rental specs. */
export function buildPlayerSide(name: string, chosen: RentalPokemon[]): Side {
  return {
    name,
    team: chosen.map(rentalToPokemon),
    activeIndex: 0,
  };
}

function capitalize(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** Tracks an ongoing Battle Factory run. */
export class FactoryRun {
  streak = 0;
  rng: RNG;
  /** The player's currently-rented Pokémon specs (swappable after wins). */
  roster: RentalPokemon[] = [];

  constructor(seed?: number) {
    this.rng = new RNG(seed);
  }

  get currentClass(): number {
    return classForStreak(this.streak);
  }

  get nextIsBoss(): boolean {
    return isBossBattle(this.streak);
  }
}
