import type { Move } from '../data/types.ts';
import { Battle, type Action, type SideId } from './battle.ts';
import { effectiveness } from './damage.ts';
import type { BattlePokemon } from './battlePokemon.ts';

/**
 * Simple battle AI. Scores each usable move and picks the best, with a little
 * randomness so it isn't perfectly predictable. Roughly mirrors the original
 * Battle Factory "use the most effective move" behaviour.
 */
export function chooseAIAction(battle: Battle, side: SideId): Action {
  const self = battle.active(side);
  const foe = battle.active(side === 0 ? 1 : 0);

  const usable = self.moves
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.pp > 0 && slot.move !== self.volatile.disabledMove);

  if (usable.length === 0) {
    return { type: 'struggle' };
  }

  let best = usable[0]!;
  let bestScore = -Infinity;

  for (const cand of usable) {
    const score = scoreMove(cand.slot.move, self, foe) + battle.rng.next() * 8;
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  return { type: 'move', moveIndex: best.index };
}

function scoreMove(move: Move, self: BattlePokemon, foe: BattlePokemon): number {
  // Damaging moves: power × STAB × type effectiveness.
  if (move.power > 0) {
    const typeMult = effectiveness(move, foe);
    const stab = self.hasType(move.type) ? 1.5 : 1;
    let score = move.power * stab * typeMult * (move.accuracy <= 0 ? 1 : move.accuracy / 100);
    if (typeMult === 0) score = -10; // never pick an immune move
    return score;
  }

  // Status / setup moves: modest baseline, higher when the foe is healthy
  // (worth setting up) and lower when we're in danger.
  const foeHealthPct = foe.hp / foe.stats.maxHp;
  let score = 25 * foeHealthPct;

  switch (move.effect) {
    case 'SLEEP_EFFECT':
    case 'PARALYZE_EFFECT':
    case 'CONFUSION_EFFECT':
      score = foe.status === 'NONE' ? 45 : -5;
      break;
    case 'POISON_EFFECT':
      score = foe.status === 'NONE' && !foe.hasType('POISON') ? 40 : -5;
      break;
    case 'HEAL_EFFECT':
    case 'REST_EFFECT':
      score = self.hp < self.stats.maxHp / 2 ? 60 : -10;
      break;
    case 'SWORDS_DANCE_EFFECT' as Move['effect']:
    case 'ATTACK_UP2_EFFECT':
    case 'SPECIAL_UP2_EFFECT':
    case 'SPEED_UP2_EFFECT':
      score = self.hp > self.stats.maxHp * 0.6 ? 35 : 5;
      break;
    default:
      break;
  }
  return score;
}

/** Pick a replacement after a faint: the surviving mon with the best matchup. */
export function chooseAISwitch(battle: Battle, side: SideId): number {
  const foe = battle.active(side === 0 ? 1 : 0);
  const team = battle.sides[side].team;
  let best = battle.livingIndices(side)[0]!;
  let bestScore = -Infinity;
  for (const i of battle.livingIndices(side)) {
    const mon = team[i]!;
    // Score by best move's effectiveness against the current foe.
    let s = 0;
    for (const slot of mon.moves) {
      if (slot.move.power > 0) {
        s = Math.max(s, effectiveness(slot.move, foe) * slot.move.power);
      }
    }
    // Prefer healthier mons and those the foe is weak/neutral to.
    s += (mon.hp / mon.stats.maxHp) * 20;
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  return best;
}
