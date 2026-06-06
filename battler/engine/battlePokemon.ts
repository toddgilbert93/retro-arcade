import type { Move, PokemonSpecies, PokemonType } from '../data/types.ts';
import { MOVE_INDEX } from '../data/moves.ts';
import { POKEMON_BY_ID } from '../data/pokemon.ts';
import {
  computeStats,
  type ComputedStats,
  type IVs,
  type StatExp,
  PERFECT_IVS,
  ZERO_STAT_EXP,
} from './stats.ts';

export type MajorStatus =
  | 'NONE'
  | 'BURN'
  | 'FREEZE'
  | 'PARALYSIS'
  | 'POISON'
  | 'TOXIC' // badly poisoned (Toxic); damage ramps each turn
  | 'SLEEP';

export type StatKey = 'attack' | 'defense' | 'speed' | 'special';
export type StageKey = StatKey | 'accuracy' | 'evasion';

export interface MoveSlot {
  move: Move;
  pp: number;
  maxPp: number;
}

/** Volatile (battle-only) state, reset on switch out. */
export interface VolatileState {
  confusionTurns: number; // >0 means confused
  flinch: boolean;
  seeded: boolean; // Leech Seed
  // multi-turn lock-in (Thrash, Petal Dance, Hyper Beam recharge, Fly/Dig charge, etc.)
  lockedMove: Move | null;
  lockedTurns: number;
  recharging: boolean; // must skip next turn (Hyper Beam)
  charging: boolean; // mid two-turn move (turn 1 done, strikes turn 2)
  invulnerable: boolean; // Fly/Dig airborne/underground
  trapped: number; // Wrap/Bind/Fire Spin/Clamp remaining turns trapping the FOE
  substituteHp: number; // 0 = no substitute
  bideDamage: number; // accumulated while Biding
  bideTurns: number;
  toxicCounter: number; // ramps Toxic damage
  disabledMove: Move | null;
  disabledTurns: number;
  usedMoveLastTurn: Move | null; // for Rage / mirror-like behaviour
  reflect: boolean;
  lightScreen: boolean;
  mist: boolean;
  focusEnergy: boolean;
}

function freshVolatile(): VolatileState {
  return {
    confusionTurns: 0,
    flinch: false,
    seeded: false,
    lockedMove: null,
    lockedTurns: 0,
    recharging: false,
    charging: false,
    invulnerable: false,
    trapped: 0,
    substituteHp: 0,
    bideDamage: 0,
    bideTurns: 0,
    toxicCounter: 0,
    disabledMove: null,
    disabledTurns: 0,
    usedMoveLastTurn: null,
    reflect: false,
    lightScreen: false,
    mist: false,
    focusEnergy: false,
  };
}

export class BattlePokemon {
  readonly species: PokemonSpecies;
  readonly level: number;
  readonly stats: ComputedStats;
  readonly type1: PokemonType;
  readonly type2: PokemonType;
  readonly nickname: string;

  hp: number;
  status: MajorStatus = 'NONE';
  sleepTurns = 0; // remaining sleep turns
  moves: MoveSlot[];

  // -6..+6 stat stages, reset on switch
  stages: Record<StageKey, number> = {
    attack: 0,
    defense: 0,
    speed: 0,
    special: 0,
    accuracy: 0,
    evasion: 0,
  };

  volatile: VolatileState = freshVolatile();

  constructor(opts: {
    species: PokemonSpecies;
    level: number;
    moves: Move[];
    ivs?: IVs;
    statExp?: StatExp;
    nickname?: string;
  }) {
    this.species = opts.species;
    this.level = opts.level;
    this.type1 = opts.species.type1;
    this.type2 = opts.species.type2;
    this.nickname = opts.nickname ?? opts.species.name;
    this.stats = computeStats(
      opts.species.baseStats,
      opts.level,
      opts.ivs ?? PERFECT_IVS,
      opts.statExp ?? ZERO_STAT_EXP,
    );
    this.hp = this.stats.maxHp;
    this.moves = opts.moves.map((m) => ({
      move: m,
      pp: m.pp,
      maxPp: m.pp,
    }));
  }

  get isFainted(): boolean {
    return this.hp <= 0;
  }

  get displayName(): string {
    return this.nickname;
  }

  /** Reset volatile state + stat stages (on switch out / faint). */
  resetOnSwitch(): void {
    this.stages = {
      attack: 0,
      defense: 0,
      speed: 0,
      special: 0,
      accuracy: 0,
      evasion: 0,
    };
    this.volatile = freshVolatile();
  }

  hasType(t: PokemonType): boolean {
    return this.type1 === t || this.type2 === t;
  }

  damage(amount: number): number {
    const before = this.hp;
    this.hp = Math.max(0, this.hp - Math.max(0, Math.floor(amount)));
    return before - this.hp;
  }

  heal(amount: number): number {
    const before = this.hp;
    this.hp = Math.min(this.stats.maxHp, this.hp + Math.max(0, Math.floor(amount)));
    return this.hp - before;
  }
}

/**
 * Convenience builder: create a BattlePokemon from string IDs (as stored in the
 * rental pool / boss teams). Empty move slots ('0') are skipped.
 */
export function makePokemon(
  speciesId: string,
  moveIds: string[],
  level: number,
  opts: { ivs?: IVs; statExp?: StatExp; nickname?: string } = {},
): BattlePokemon {
  const species = POKEMON_BY_ID[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);

  const moves: Move[] = [];
  for (const id of moveIds) {
    if (id === '0' || id === '') continue;
    const move = MOVE_INDEX[id];
    if (!move) throw new Error(`Unknown move: ${id} (on ${speciesId})`);
    moves.push(move);
  }
  if (moves.length === 0) {
    // Fall back to Struggle-only if somehow empty.
    const struggle = MOVE_INDEX['STRUGGLE'];
    if (struggle) moves.push(struggle);
  }

  return new BattlePokemon({ species, level, moves, ...opts });
}
