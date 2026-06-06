// Lightweight sanity tests for the battler. Run with: node test.ts
import { computeStats, PERFECT_IVS } from './engine/stats.ts';
import { POKEMON_BY_ID } from './data/pokemon.ts';
import { MOVE_INDEX, MOVES } from './data/moves.ts';
import { POKEMON } from './data/pokemon.ts';
import { getTypeMultiplier } from './data/typeChart.ts';
import { makePokemon } from './engine/battlePokemon.ts';
import { calcDamage } from './engine/damage.ts';
import { RNG } from './engine/rng.ts';
import { RENTAL_CLASSES } from './data/rentalPool.ts';
import { runBattle, aiChooser } from './engine/driver.ts';
import { buildOpponent, buildPlayerSide, offerRentals } from './factory.ts';
import {
  ALL_DRAFT_SPECIES,
  DRAFT_POOL_SIZE,
  randomDraftPool,
  rentalForSpecies,
} from './data/draftPool.ts';
import { runMatch } from './agent/match.ts';
import { MODELS } from './agent/models.ts';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

// --- Data integrity ---
check('151 Pokémon loaded', POKEMON.length === 151, `(got ${POKEMON.length})`);
check('165 moves loaded', MOVES.length === 165, `(got ${MOVES.length})`);
check('9 rental classes', RENTAL_CLASSES.length === 9);

// --- Stat calc: Lv100 perfect-DV, zero-stat-exp Mewtwo. ---
//   HP    = floor(2*(106+15)*100/100) + 100 + 10 = 352
//   Spec  = floor(2*(154+15)*100/100) + 5         = 343
const mewtwo = POKEMON_BY_ID['MEWTWO']!;
const mtStats = computeStats(mewtwo.baseStats, 100, PERFECT_IVS);
check('Mewtwo Lv100 HP = 352', mtStats.maxHp === 352, `(got ${mtStats.maxHp})`);
check('Mewtwo Lv100 Special = 343', mtStats.special === 343, `(got ${mtStats.special})`);

// --- Type chart: classic Gen 1 quirks ---
check('Water > Fire = 2x', getTypeMultiplier('WATER', 'FIRE') === 2);
check('Ghost vs Psychic = 0 (Gen1 bug)', getTypeMultiplier('GHOST', 'PSYCHIC') === 0);
check('Electric vs Ground = 0', getTypeMultiplier('ELECTRIC', 'GROUND') === 0);
check('Normal vs Ghost = 0', getTypeMultiplier('NORMAL', 'GHOST') === 0);
check('Bug vs Poison = 2x (Gen1)', getTypeMultiplier('BUG', 'POISON') === 2);
check('Fire vs Water = 0.5', getTypeMultiplier('FIRE', 'WATER') === 0.5);

// --- Damage: STAB + super effective should beat neutral ---
const rng = new RNG(123);
const charizard = makePokemon('CHARIZARD', ['FLAMETHROWER', 'EARTHQUAKE'], 50);
const venusaur = makePokemon('VENUSAUR', ['TACKLE'], 50);
const fireOnGrass = calcDamage(charizard, venusaur, MOVE_INDEX['FLAMETHROWER']!, rng, {
  forceCrit: false,
  randomize: false,
});
check('Fire STAB vs Grass is super-effective', fireOnGrass.typeMultiplier === 2 && fireOnGrass.stab);
check('Flamethrower deals real damage', fireOnGrass.damage > 0, `(got ${fireOnGrass.damage})`);

// --- Full battle runs to completion ---
const factoryRng = new RNG(777);
const offered = offerRentals(5, factoryRng);
const player = buildPlayerSide('You', offered.slice(0, 3));
const { side: enemy } = buildOpponent(5, factoryRng);
let lines = 0;
const result = await runBattle(player, enemy, {
  seed: 42,
  playerChooser: aiChooser,
  enemyChooser: aiChooser,
  onLog: () => lines++,
});
check('Battle produced a winner', result.winner === 0 || result.winner === 1);
check('Battle logged events', lines > 5, `(got ${lines} lines)`);
check('Battle terminated under turn cap', result.turns < 500, `(turns ${result.turns})`);

// --- Draft pool integrity ---
check('Draft catalog is Gen 1 dex', ALL_DRAFT_SPECIES.length === 151, `(got ${ALL_DRAFT_SPECIES.length})`);
const draftPool = randomDraftPool(new RNG(4242));
check('Random draft pool has 40 Pokémon', draftPool.length === DRAFT_POOL_SIZE, `(got ${draftPool.length})`);
check(
  'Random draft pool has unique species',
  new Set(draftPool.map((r) => r.species)).size === DRAFT_POOL_SIZE,
);
let badSpecies = '';
let badMove = '';
for (const r of draftPool) {
  if (!POKEMON_BY_ID[r.species]) badSpecies ||= r.species;
  for (const m of r.moves) {
    if (m !== '0' && m !== '' && !MOVE_INDEX[m]) badMove ||= `${m} (on ${r.species})`;
  }
}
for (const id of ['METAPOD', 'ABRA', 'MEWTWO', 'MEW']) {
  const r = rentalForSpecies(id);
  if (!POKEMON_BY_ID[r.species]) badSpecies ||= r.species;
  for (const m of r.moves) {
    if (m !== '0' && m !== '' && !MOVE_INDEX[m]) badMove ||= `${m} (on ${r.species})`;
  }
}
check('All draft species exist', badSpecies === '', `(bad: ${badSpecies})`);
check('All draft moves exist', badMove === '', `(bad: ${badMove})`);
check('At least 4 models available', MODELS.length >= 4, `(got ${MODELS.length})`);

// --- No-key arena smoke test: draft -> battle -> winner with heuristic AI ---
const match = await runMatch({
  modelA: MODELS[0]!,
  modelB: MODELS[1]!,
  seed: 7,
  useLLM: false,
});
check('Match drafted 4 mons for A', match.teamA.length === 4, `(got ${match.teamA.length})`);
check('Match drafted 4 mons for B', match.teamB.length === 4, `(got ${match.teamB.length})`);
check('Match teams have no duplicates', new Set([...match.teamA, ...match.teamB].map((r) => r.species)).size === 8);
check('Match produced a winner', match.winner === 0 || match.winner === 1);
check('Match logged a transcript', match.transcript.length > 5, `(got ${match.transcript.length})`);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
