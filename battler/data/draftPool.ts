import type { RentalPokemon } from './types.ts';
import { GROWTH_BY_ID } from './levelUpMoves.ts';
import { MOVE_INDEX } from './moves.ts';
import { POKEMON, POKEMON_BY_ID } from './pokemon.ts';
import { ALL_RENTAL_POKEMON } from './rentalPool.ts';
import { RNG } from '../engine/rng.ts';

/** All drafted Pokémon fight at this fixed level (mirrors FACTORY_LEVEL). */
export const DRAFT_LEVEL = 50;

/** Number of species offered in the shared draft pool each match. */
export const DRAFT_POOL_SIZE = 40;

/** Gen 1 National Dex #1–151. */
export const ALL_DRAFT_SPECIES = POKEMON.filter((p) => p.dexNumber <= 151).map((p) => p.id);

const MOVE_ALIASES: Record<string, string> = {
  PSYCHIC_M: 'PSYCHIC',
};

const RENTAL_BY_SPECIES = new Map<string, RentalPokemon[]>();
for (const rental of ALL_RENTAL_POKEMON) {
  const list = RENTAL_BY_SPECIES.get(rental.species) ?? [];
  list.push(rental);
  RENTAL_BY_SPECIES.set(rental.species, list);
}

function normalizeMoveId(id: string): string {
  const aliased = MOVE_ALIASES[id] ?? id;
  return MOVE_INDEX[aliased] ? aliased : id;
}

function padMoves(moves: string[]): [string, string, string, string] {
  const out = moves.filter((m) => m === '0' || MOVE_INDEX[normalizeMoveId(m)]).map(normalizeMoveId);
  while (out.length < 4) out.push('0');
  return out.slice(0, 4) as [string, string, string, string];
}

/** Moves known at `level`, using starting moves + level-up learnset (Gen 1 slot rules). */
export function movesAtLevel(speciesId: string, level: number): [string, string, string, string] {
  const species = POKEMON_BY_ID[speciesId];
  if (!species) throw new Error(`Unknown species: ${speciesId}`);

  const known: string[] = [...species.startingMoves];
  for (const { level: lv, move } of GROWTH_BY_ID[speciesId]?.levelUpMoves ?? []) {
    if (lv > level) continue;
    const idx = known.indexOf(move);
    if (idx >= 0) known.splice(idx, 1);
    known.push(move);
  }

  const moves: string[] = [];
  for (let i = known.length - 1; i >= 0 && moves.length < 4; i--) {
    const id = normalizeMoveId(known[i]!);
    if (MOVE_INDEX[id]) moves.unshift(id);
  }
  return padMoves(moves);
}

/** Build a rental entry for one species (prefers a rental-pool moveset when available). */
export function rentalForSpecies(speciesId: string, rng?: RNG): RentalPokemon {
  const rentals = RENTAL_BY_SPECIES.get(speciesId);
  if (rentals?.length) {
    const pick = rng ? rng.pick(rentals) : rentals[0]!;
    return {
      species: pick.species,
      moves: padMoves(pick.moves.map(normalizeMoveId)),
    };
  }
  return { species: speciesId, moves: movesAtLevel(speciesId, DRAFT_LEVEL) };
}

/** Sample `DRAFT_POOL_SIZE` unique species from the full Gen 1 dex for one match. */
export function randomDraftPool(rng: RNG = new RNG()): RentalPokemon[] {
  const shuffled = [...ALL_DRAFT_SPECIES];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled.slice(0, DRAFT_POOL_SIZE).map((id) => rentalForSpecies(id, rng));
}
