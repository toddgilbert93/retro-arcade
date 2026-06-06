# Pokémon Battler

A Gen 1 turn-based battle engine and **Battle Factory** mode in TypeScript, built
on data extracted from the [pokered](https://github.com/iimarckus/pokered)
disassembly (this repo's `main.asm`).

No build step needed — Node 23+ runs the TypeScript directly.

## Run

```bash
node test.ts            # sanity tests (16 checks)
node demo.ts [seed]     # watch one AI-vs-AI battle, blow by blow
node factory-demo.ts [seed] [verbose]   # simulate a Battle Factory streak
```

## Layout

```
data/        Extracted game data (see below)
  pokemon.ts       151 species: base stats, types, growth rate, starting moves
  moves.ts         165 moves: power, type, accuracy, PP, effect, high-crit flag
  levelUpMoves.ts  per-level learnsets + evolutions
  typeChart.ts     type effectiveness (incl. Gen 1 quirks) + getTypeMultiplier()
  mechanics.ts     stat-stage table, exp formulas, physical/special split
  rentalPool.ts    9 Battle Factory difficulty classes (329 rental sets)
  bossTeams.ts     7 boss trainers (Brock…Oak)
  types.ts         shared interfaces

engine/
  rng.ts           seedable PRNG (reproducible battles)
  stats.ts         Gen 1 stat formula (DVs + stat exp)
  battlePokemon.ts runtime Pokémon: HP, status, stages, volatile state
  damage.ts        full Gen 1 damage calc (STAB, crits, burn, screens, stages)
  battle.ts        turn engine + ~40 move effects
  ai.ts            move/switch selection
  driver.ts        runBattle() — drives a battle to completion w/ switching

factory.ts         Battle Factory: rental drafting, opponent/boss generation,
                   difficulty scaling by win streak
```

## What's modelled

- Gen 1 damage formula with stat stages, critical hits (speed-based, high-crit
  moves, Focus Energy bug), STAB, type effectiveness, burn attack-drop, Reflect /
  Light Screen.
- Status: burn, freeze, paralysis, poison/toxic, sleep — with their turn effects.
- Volatile state: confusion, flinch, Leech Seed, multi-hit, two-turn charge
  (Fly/Dig/Solar Beam), trapping (Wrap/Fire Spin), Substitute, Disable, Bide,
  Hyper Beam recharge, Thrash/Petal Dance lock-in, Haze, Mist, Metronome,
  Mirror Move.
- Fixed-damage moves (Seismic Toss, Night Shade, Sonic Boom, Dragon Rage,
  Psywave), OHKO moves with the speed check, Super Fang, Dream Eater, recoil,
  drain, self-destruct.
- Stat-changing moves (self-buffs and foe-debuffs) and all the secondary
  side-effect chances.

## Build a battle in code

```ts
import { makePokemon } from './engine/battlePokemon.ts';
import { runBattle, aiChooser } from './engine/driver.ts';

const player = {
  name: 'You',
  team: [makePokemon('CHARIZARD', ['FLAMETHROWER', 'EARTHQUAKE', 'SLASH'], 50)],
  activeIndex: 0,
};
const enemy = {
  name: 'Rival',
  team: [makePokemon('VENUSAUR', ['RAZOR_LEAF', 'SLEEP_POWDER'], 50)],
  activeIndex: 0,
};

await runBattle(player, enemy, {
  playerChooser: aiChooser,   // or supply your own to make decisions
  onLog: console.log,
});
```

The `playerChooser` is just `(battle, side) => Action` (sync or async), so you can
wire it to a CLI prompt, a UI, or your own AI.
