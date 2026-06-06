// Watch a single AI-vs-AI battle play out. Run with: node demo.ts [seed]
import { makePokemon } from './engine/battlePokemon.ts';
import { runBattle, aiChooser } from './engine/driver.ts';
import type { Side } from './engine/battle.ts';

const seed = process.argv[2] ? Number(process.argv[2]) : 2024;

const player: Side = {
  name: 'Red',
  team: [
    makePokemon('CHARIZARD', ['FLAMETHROWER', 'EARTHQUAKE', 'SLASH', 'FIRE_SPIN'], 50),
    makePokemon('STARMIE', ['SURF', 'ICE_BEAM', 'THUNDERBOLT', 'RECOVER'], 50),
    makePokemon('SNORLAX', ['BODY_SLAM', 'EARTHQUAKE', 'REST', 'AMNESIA'], 50),
  ],
  activeIndex: 0,
};

const enemy: Side = {
  name: 'Blue',
  team: [
    makePokemon('VENUSAUR', ['RAZOR_LEAF', 'SLEEP_POWDER', 'LEECH_SEED', 'BODY_SLAM'], 50),
    makePokemon('ALAKAZAM', ['PSYCHIC', 'RECOVER', 'THUNDER_WAVE', 'SEISMIC_TOSS'], 50),
    makePokemon('RHYDON', ['EARTHQUAKE', 'ROCK_SLIDE', 'BODY_SLAM', 'SUBSTITUTE'], 50),
  ],
  activeIndex: 0,
};

const result = await runBattle(player, enemy, {
  seed,
  playerChooser: aiChooser,
  enemyChooser: aiChooser,
  onLog: (line) => console.log(line),
});

const winnerName = result.winner === 0 ? player.name : enemy.name;
console.log(`\n=== ${winnerName} wins in ${result.turns} turns! (seed ${seed}) ===`);
