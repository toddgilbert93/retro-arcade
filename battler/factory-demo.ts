// Simulate a Battle Factory streak with an AI-controlled player.
// Run with: node factory-demo.ts [seed] [verbose]
import { RNG } from './engine/rng.ts';
import { runBattle, aiChooser } from './engine/driver.ts';
import {
  FactoryRun,
  offerRentals,
  buildOpponent,
  buildPlayerSide,
} from './factory.ts';
import type { RentalPokemon } from './data/types.ts';
import { POKEMON_BY_ID } from './data/pokemon.ts';

const seed = process.argv[2] ? Number(process.argv[2]) : 99;
const verbose = process.argv[3] === 'verbose';

const run = new FactoryRun(seed);

// Draft the 3 offered Pokémon with the highest base-stat totals.
function draft(offered: RentalPokemon[]): RentalPokemon[] {
  const bst = (r: RentalPokemon): number => {
    const s = POKEMON_BY_ID[r.species]!.baseStats;
    return s.hp + s.attack + s.defense + s.speed + s.special;
  };
  return [...offered].sort((a, b) => bst(b) - bst(a)).slice(0, 3);
}

console.log(`=== Battle Factory run (seed ${seed}) ===\n`);

while (true) {
  // Draft a fresh team at the start of each set (every 7 battles), or keep roster.
  if (run.roster.length === 0) {
    const offered = offerRentals(run.streak, run.rng);
    run.roster = draft(offered);
    console.log(
      `Drafted: ${run.roster.map((r) => r.species).join(', ')} (Class ${run.currentClass})`,
    );
  }

  const player = buildPlayerSide('You', run.roster);
  const { side: enemy, isBoss, team: enemyTeam } = buildOpponent(run.streak, run.rng);

  const label = isBoss ? `BOSS — ${enemy.name}` : enemy.name;
  console.log(
    `\nBattle ${run.streak + 1} vs ${label}: ${enemyTeam.map((m) => m.species).join(', ')}`,
  );

  const result = await runBattle(player, enemy, {
    seed: run.rng.int(1_000_000),
    playerChooser: aiChooser,
    enemyChooser: aiChooser,
    onLog: verbose ? (l) => console.log('   ' + l) : undefined,
  });

  if (result.winner === 0) {
    run.streak++;
    console.log(`   → WON (${result.turns} turns). Streak: ${run.streak}`);
    // After a set boundary, re-draft.
    if (run.streak % 7 === 0) {
      run.roster = [];
      console.log('   (New set — redrafting.)');
    }
  } else {
    console.log(`   → LOST (${result.turns} turns).`);
    break;
  }

  if (run.streak >= 49) {
    console.log('\nPerfect 7-set run complete!');
    break;
  }
}

console.log(`\n=== Final streak: ${run.streak} wins ===`);
