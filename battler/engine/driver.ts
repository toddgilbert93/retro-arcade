import { Battle, type Action, type Side, type SideId } from './battle.ts';
import { chooseAIAction, chooseAISwitch } from './ai.ts';

/** Extra battle intel passed to a chooser before it decides. */
export interface ChooserContext {
  /** Opponent's last fully resolved action from a prior turn. */
  foeLastAction?: Action;
  /** Opponent's committed action this turn (visible to the second picker). */
  foeCommittedAction?: Action;
}

/** A function that decides a side's action for the upcoming turn. */
export type Chooser = (
  battle: Battle,
  side: SideId,
  ctx?: ChooserContext,
) => Action | Promise<Action>;

/** A function that picks a replacement index after a faint. */
export type Replacer = (battle: Battle, side: SideId) => number | Promise<number>;

export const aiChooser: Chooser = (battle, side) => chooseAIAction(battle, side);
export const aiReplacer: Replacer = (battle, side) => chooseAISwitch(battle, side);

export interface BattleResult {
  winner: SideId;
  turns: number;
}

/**
 * Drive a battle to completion. The caller supplies choosers for each side
 * (use `aiChooser` for an AI-controlled side). Handles faints and forced
 * replacements between turns.
 */
export async function runBattle(
  player: Side,
  enemy: Side,
  opts: {
    seed?: number;
    onLog?: (line: string) => void;
    playerChooser: Chooser;
    enemyChooser?: Chooser;
    playerReplacer?: Replacer;
    enemyReplacer?: Replacer;
    maxTurns?: number;
  },
): Promise<BattleResult> {
  const battle = new Battle(player, enemy, { seed: opts.seed, onLog: opts.onLog });
  const enemyChooser = opts.enemyChooser ?? aiChooser;
  const playerReplacer = opts.playerReplacer ?? aiReplacer;
  const enemyReplacer = opts.enemyReplacer ?? aiReplacer;
  const maxTurns = opts.maxTurns ?? 500;

  battle.onLog?.(
    `${player.name} (${player.team.length}) vs ${enemy.name} (${enemy.team.length})!`,
  );

  let lastResolved: Record<SideId, Action | null> = { 0: null, 1: null };

  while (!battle.finished && battle.turn < maxTurns) {
    const playerAction = await opts.playerChooser(battle, 0, {
      foeLastAction: lastResolved[1] ?? undefined,
    });
    const enemyAction = await enemyChooser(battle, 1, {
      foeLastAction: lastResolved[0] ?? undefined,
      foeCommittedAction: playerAction,
    });

    battle.executeTurn(playerAction, enemyAction);
    lastResolved = { 0: playerAction, 1: enemyAction };

    // Handle faints + replacements.
    for (const side of [0, 1] as SideId[]) {
      if (battle.active(side).isFainted) {
        battle.announceFaint(side);
      }
    }
    if (battle.finished) break;

    for (const side of [0, 1] as SideId[]) {
      if (battle.needsReplacement(side)) {
        const replacer = side === 0 ? playerReplacer : enemyReplacer;
        const idx = await replacer(battle, side);
        battle.sides[side].activeIndex = idx;
        battle.onLog?.(
          `${battle.sides[side].name} sent out ${battle.active(side).displayName}!`,
        );
      }
    }
  }

  // Decide winner (fallback to HP-sum if maxTurns hit).
  if (battle.winner === null) {
    const hp = (s: SideId) =>
      battle.sides[s].team.reduce((sum, p) => sum + p.hp, 0);
    battle.winner = hp(0) >= hp(1) ? 0 : 1;
  }

  return { winner: battle.winner, turns: battle.turn };
}
