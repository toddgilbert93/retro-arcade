export type PokemonType =
  | 'NORMAL'
  | 'FIRE'
  | 'WATER'
  | 'ELECTRIC'
  | 'GRASS'
  | 'ICE'
  | 'FIGHTING'
  | 'POISON'
  | 'GROUND'
  | 'FLYING'
  | 'PSYCHIC'
  | 'BUG'
  | 'ROCK'
  | 'GHOST'
  | 'DRAGON';

// Growth rate index from GrowthRateTable (main.asm:94430)
// Formula: 0=n^3, 3=6/5n^3-15n^2+100n-140, 4=4/5n^3, 5=5/4n^3
export type GrowthRate = 'MEDIUM_FAST' | 'MEDIUM_SLOW' | 'FAST' | 'SLOW';

// Move effect constants from the ROM move table
export type MoveEffect =
  | 'NO_ADDITIONAL_EFFECT'
  | 'SLEEP_EFFECT'
  | 'POISON_EFFECT'
  | 'DRAIN_HP_EFFECT'
  | 'BURN_SIDE_EFFECT1'        // 10% burn chance
  | 'BURN_SIDE_EFFECT2'        // 30% burn chance
  | 'FREEZE_SIDE_EFFECT'       // 10% freeze chance
  | 'PARALYZE_EFFECT'          // always paralyzes (Thunder Wave, Stun Spore, Glare)
  | 'PARALYZE_SIDE_EFFECT1'    // 10% paralyze chance
  | 'PARALYZE_SIDE_EFFECT2'    // 30% paralyze chance (Body Slam, Lick)
  | 'CONFUSION_EFFECT'         // always confuses (Confuse Ray, Supersonic)
  | 'CONFUSION_SIDE_EFFECT'    // 10% confusion chance
  | 'FLINCH_SIDE_EFFECT1'      // 10% flinch chance
  | 'FLINCH_SIDE_EFFECT2'      // 30% flinch chance
  | 'POISON_SIDE_EFFECT1'      // 10% poison chance
  | 'POISON_SIDE_EFFECT2'      // 30% poison chance (Smog, Sludge)
  | 'OHKO_EFFECT'              // One-hit KO (speed check + 30% base)
  | 'RECOIL_EFFECT'            // user takes 1/4 damage dealt as recoil
  | 'EXPLODE_EFFECT'           // user faints; target defense halved in calc
  | 'CHARGE_EFFECT'            // 2-turn: charge then strike (Razor Wind, Fly, Dig, etc.)
  | 'FLY_EFFECT'               // 2-turn fly (invulnerable turn 1)
  | 'TRAPPING_EFFECT'          // 2-5 turns, traps target (Bind, Wrap, Fire Spin, Clamp)
  | 'SPECIAL_DAMAGE_EFFECT'    // fixed/level-based damage (Seismic Toss, Night Shade, etc.)
  | 'SUPER_FANG_EFFECT'        // halves target's current HP
  | 'DRAIN_HP_EFFECT'          // heals user for 50% of damage dealt
  | 'DREAM_EATER_EFFECT'       // heals user 50%; only works on sleeping target
  | 'LEECH_SEED_EFFECT'        // drains 1/16 HP per turn
  | 'HYPER_BEAM_EFFECT'        // must recharge next turn
  | 'SWIFT_EFFECT'             // never misses
  | 'DISABLE_EFFECT'
  | 'MIMIC_EFFECT'
  | 'METRONOME_EFFECT'
  | 'MIRROR_MOVE_EFFECT'
  | 'BIDE_EFFECT'
  | 'RAGE_EFFECT'
  | 'THRASH_PETAL_DANCE_EFFECT' // 2-3 turns, confused after
  | 'ATTACK_TWICE_EFFECT'       // hits exactly twice
  | 'TWO_TO_FIVE_ATTACKS_EFFECT'
  | 'TWINEEDLE_EFFECT'          // 2 hits + 20% poison
  | 'JUMP_KICK_EFFECT'          // crash damage on miss
  | 'PAY_DAY_EFFECT'
  | 'SWITCH_AND_TELEPORT_EFFECT'
  | 'TRANSFORM_EFFECT'
  | 'SUBSTITUTE_EFFECT'
  | 'FOCUS_ENERGY_EFFECT'
  | 'MIST_EFFECT'
  | 'HAZE_EFFECT'
  | 'REFLECT_EFFECT'
  | 'LIGHT_SCREEN_EFFECT'
  | 'CONVERSION_EFFECT'
  | 'COUNTER_EFFECT'
  | 'HEAL_EFFECT'              // restores 50% max HP (Recover, Softboiled)
  | 'REST_EFFECT'              // full heal + sleep 2 turns
  | 'PSYWAVE_EFFECT'           // random damage 1-1.5× level
  | 'SPLASH_EFFECT'            // does nothing
  | 'ATTACK_UP1_EFFECT'
  | 'ATTACK_UP2_EFFECT'
  | 'ATTACK_DOWN1_EFFECT'
  | 'ATTACK_DOWN_SIDE_EFFECT'  // 33% chance lower atk 1 stage
  | 'DEFENSE_UP1_EFFECT'
  | 'DEFENSE_UP2_EFFECT'
  | 'DEFENSE_DOWN1_EFFECT'
  | 'DEFENSE_DOWN2_EFFECT'
  | 'DEFENSE_DOWN_SIDE_EFFECT' // 10% chance lower def 1 stage (Acid)
  | 'SPEED_UP2_EFFECT'
  | 'SPEED_DOWN1_EFFECT'
  | 'SPEED_DOWN_SIDE_EFFECT'   // 33% chance lower speed 1 stage (Bubble, Constrict)
  | 'SPECIAL_UP1_EFFECT'
  | 'SPECIAL_UP2_EFFECT'
  | 'SPECIAL_DOWN_SIDE_EFFECT' // 33% chance lower special 1 stage (Psychic)
  | 'ACCURACY_DOWN1_EFFECT'
  | 'EVASION_UP1_EFFECT';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

export interface PokemonSpecies {
  id: string;          // ALL_CAPS constant (matches MonClass rental pool references)
  name: string;        // Display name e.g. 'Bulbasaur'
  dexNumber: number;   // Pokédex number 1-151
  baseStats: BaseStats;
  type1: PokemonType;
  type2: PokemonType;  // same as type1 if single-type
  catchRate: number;
  baseExpYield: number;
  growthRate: GrowthRate;
  startingMoves: string[];  // move IDs known at level 1 (up to 4, may be fewer)
}

export interface LevelUpMove {
  level: number;
  move: string;  // move constant e.g. 'VINE_WHIP'
}

export interface Evolution {
  method: 'LEVEL' | 'ITEM' | 'TRADE';
  condition: number | string;  // level number, or item constant
  into: string;                // Pokémon constant
}

export interface PokemonGrowth {
  id: string;
  evolutions: Evolution[];
  levelUpMoves: LevelUpMove[];
}

export interface Move {
  id: number;          // 1-indexed, matches position in ROM Moves table
  name: string;        // display name e.g. 'Flamethrower'
  effect: MoveEffect;
  power: number;       // 0 for status/non-damaging moves
  type: PokemonType;
  accuracy: number;    // 0-100; 100 = always hits ($FF); 0 = perfect accuracy bypass (Swift)
  pp: number;
  isHighCrit: boolean; // Slash, Razor Leaf, Crabhammer, Karate Chop
}

// Indexed by move constant name for fast lookup
export type MoveIndex = Record<string, Move>;

// Type chart: only non-neutral matchups are listed (all others = 1×)
export interface TypeMatchup {
  attackingType: PokemonType;
  defendingType: PokemonType;
  multiplier: 0 | 0.5 | 2;
}

// Stat stage modifier table (index 0=stage -6, index 6=neutral, index 12=stage +6)
// Values are [numerator, denominator] pairs from StatModifierRatios (main.asm:70630)
export interface StatStageEntry {
  stage: number;       // -6 to +6
  numerator: number;
  denominator: number;
  multiplier: number;  // pre-computed ratio
}

export interface RentalPokemon {
  species: string;     // Pokémon constant e.g. 'BULBASAUR'
  moves: [string, string, string, string];  // '0' means empty slot
}

export interface RentalClass {
  classNumber: number;   // 1-9 (higher = harder)
  pokemon: RentalPokemon[];
}

export interface BossTeamMember {
  species: string;
  moves: [string, string, string, string];
}

export interface BossTeam {
  name: string;          // e.g. 'BROCK', 'KOGA'
  pokemon: BossTeamMember[];
}
