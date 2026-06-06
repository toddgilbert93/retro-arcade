import type { Move } from '../data/types.ts';
import { MOVES, MOVE_INDEX } from '../data/moves.ts';
import { BattlePokemon, type MajorStatus, type StageKey } from './battlePokemon.ts';
import { calcDamage } from './damage.ts';
import { getStatMultiplier } from '../data/mechanics.ts';
import { RNG } from './rng.ts';

export interface Side {
  name: string;
  team: BattlePokemon[];
  activeIndex: number;
}

export type Action =
  | { type: 'move'; moveIndex: number }
  | { type: 'switch'; target: number }
  | { type: 'struggle' };

export type SideId = 0 | 1;

const STRUGGLE = MOVE_INDEX['STRUGGLE']!;

// Moves that act with +1 priority (Gen 1 only Quick Attack, plus Counter quirks aside).
const PRIORITY_MOVES = new Set(['QUICK_ATTACK']);

function moveKey(m: Move): string {
  return m.name.toUpperCase().replace(/ /g, '_').replace(/-/g, '_');
}

export class Battle {
  readonly sides: [Side, Side];
  readonly rng: RNG;
  log: string[] = [];
  onLog?: (line: string) => void;
  turn = 0;
  finished = false;
  winner: SideId | null = null;

  constructor(
    player: Side,
    enemy: Side,
    opts: { seed?: number; onLog?: (line: string) => void } = {},
  ) {
    this.sides = [player, enemy];
    this.rng = new RNG(opts.seed);
    this.onLog = opts.onLog;
  }

  // ---- helpers ----------------------------------------------------------

  active(side: SideId): BattlePokemon {
    const s = this.sides[side];
    return s.team[s.activeIndex]!;
  }

  private emit(line: string): void {
    this.log.push(line);
    this.onLog?.(line);
  }

  private opponent(side: SideId): SideId {
    return side === 0 ? 1 : 0;
  }

  hasRemaining(side: SideId): boolean {
    return this.sides[side].team.some((p) => !p.isFainted);
  }

  livingIndices(side: SideId): number[] {
    return this.sides[side].team
      .map((p, i) => (p.isFainted ? -1 : i))
      .filter((i) => i >= 0);
  }

  // ---- turn execution ---------------------------------------------------

  /** Execute one full turn given both sides' chosen actions. */
  executeTurn(playerAction: Action, enemyAction: Action): void {
    const actions: Record<SideId, Action> = { 0: playerAction, 1: enemyAction };
    const order = this.beginTurn(actions);
    for (const side of order) {
      if (this.finished) break;
      this.executeTurnMove(side, actions[side]);
    }
    if (this.finished) return;
    for (const side of this.speedOrder()) {
      if (this.finished) break;
      this.executeTurnEndPhase(side);
    }
  }

  /**
   * Start a turn: bump the counter, log the header, and resolve switches.
   * Returns move order for the scheduled attacks (switches are already done).
   */
  beginTurn(actions: Record<SideId, Action>): SideId[] {
    if (this.finished) return [];
    this.turn++;
    this.emit(`--- Turn ${this.turn} ---`);

    for (const side of [0, 1] as SideId[]) {
      if (actions[side].type === 'switch') {
        this.doSwitch(side, (actions[side] as { target: number }).target);
      }
    }

    return this.resolveOrder(actions);
  }

  /** Execute one side's scheduled move for the current turn. */
  executeTurnMove(side: SideId, act: Action): void {
    if (this.finished) return;
    if (act.type === 'switch') return;
    if (this.active(side).isFainted) return;
    this.performMove(side, act);
    this.checkFaints();
  }

  /** Apply end-of-turn residuals for one side. */
  executeTurnEndPhase(side: SideId): void {
    if (this.finished) return;
    this.endOfTurn(side);
    this.checkFaints();
  }

  private resolveOrder(actions: Record<SideId, Action>): SideId[] {
    const priority = (side: SideId): number => {
      const a = actions[side];
      if (a.type === 'move') {
        const user = this.active(side);
        const slot = user.moves[a.moveIndex];
        if (slot && PRIORITY_MOVES.has(moveKey(slot.move))) return 1;
      }
      return 0;
    };
    const p0 = priority(0);
    const p1 = priority(1);
    if (p0 !== p1) return p0 > p1 ? [0, 1] : [1, 0];
    return this.speedOrder();
  }

  speedOrder(): SideId[] {
    const spd = (side: SideId): number => {
      const p = this.active(side);
      let s = Math.floor(p.stats.speed * getStatMultiplier(p.stages.speed));
      if (p.status === 'PARALYSIS') s = Math.floor(s / 4);
      return s;
    };
    const s0 = spd(0);
    const s1 = spd(1);
    if (s0 === s1) return this.rng.chance(0.5) ? [0, 1] : [1, 0];
    return s0 > s1 ? [0, 1] : [1, 0];
  }

  private doSwitch(side: SideId, target: number): void {
    const s = this.sides[side];
    if (target === s.activeIndex) return;
    const incoming = s.team[target];
    if (!incoming || incoming.isFainted) return;
    this.active(side).resetOnSwitch();
    s.activeIndex = target;
    this.emit(`${s.name} sent out ${incoming.displayName}!`);
  }

  // ---- move performance -------------------------------------------------

  private performMove(side: SideId, act: Action): void {
    const user = this.active(side);
    const foeId = this.opponent(side);
    const foe = this.active(foeId);

    // Forced/locked moves take over (Thrash, Hyper Beam recharge, charging move).
    let move: Move;
    let slot = act.type === 'move' ? user.moves[act.moveIndex] : undefined;

    if (user.volatile.recharging) {
      user.volatile.recharging = false;
      this.emit(`${user.displayName} must recharge!`);
      return;
    }

    if (act.type === 'struggle' || !slot) {
      move = STRUGGLE;
    } else {
      move = slot.move;
    }

    // Pre-move status gates.
    if (!this.canAct(side, move)) return;

    // Locked-in moves (Thrash/Petal Dance) override the choice.
    if (user.volatile.lockedMove) {
      move = user.volatile.lockedMove;
      slot = user.moves.find((m) => m.move === move);
    }

    // Deduct PP (not for Struggle / locked continuation).
    if (slot && move !== STRUGGLE && !user.volatile.charging) {
      if (slot.pp <= 0) {
        move = STRUGGLE;
      } else {
        slot.pp--;
      }
    }

    user.volatile.usedMoveLastTurn = move;
    this.emit(`${user.displayName} used ${move.name}!`);

    this.executeMove(side, foeId, move, user, foe);
  }

  /** Returns false if the user cannot act this turn (and emits the reason). */
  private canAct(side: SideId, _move: Move): boolean {
    const user = this.active(side);

    if (user.status === 'SLEEP') {
      if (user.sleepTurns > 0) user.sleepTurns--;
      if (user.sleepTurns <= 0) {
        user.status = 'NONE';
        this.emit(`${user.displayName} woke up!`);
      } else {
        this.emit(`${user.displayName} is fast asleep.`);
        return false;
      }
    }

    if (user.status === 'FREEZE') {
      // Gen 1: only defrosts when hit by a fire move; ~no natural thaw.
      this.emit(`${user.displayName} is frozen solid!`);
      return false;
    }

    if (user.volatile.flinch) {
      user.volatile.flinch = false;
      this.emit(`${user.displayName} flinched!`);
      return false;
    }

    if (user.status === 'PARALYSIS' && this.rng.chance(0.25)) {
      this.emit(`${user.displayName} is paralyzed! It can't move!`);
      return false;
    }

    if (user.volatile.confusionTurns > 0) {
      user.volatile.confusionTurns--;
      if (user.volatile.confusionTurns <= 0) {
        this.emit(`${user.displayName} snapped out of confusion!`);
      } else {
        this.emit(`${user.displayName} is confused!`);
        if (this.rng.chance(0.5)) {
          // Hurt itself: 40-power typeless physical hit on itself.
          const self = user;
          const dmg = this.confusionSelfDamage(self);
          self.damage(dmg);
          this.emit(`It hurt itself in its confusion! (${dmg})`);
          return false;
        }
      }
    }

    return true;
  }

  private confusionSelfDamage(p: BattlePokemon): number {
    // 40 power physical, no STAB/type, uses own attack vs own defense.
    const atk = Math.floor(p.stats.attack * getStatMultiplier(p.stages.attack));
    const def = Math.floor(p.stats.defense * getStatMultiplier(p.stages.defense));
    let dmg = Math.floor((2 * p.level) / 5 + 2);
    dmg = Math.floor((dmg * 40 * Math.max(1, atk)) / Math.max(1, def));
    dmg = Math.floor(dmg / 50) + 2;
    return Math.max(1, dmg);
  }

  // ---- the effect dispatcher -------------------------------------------

  private executeMove(
    side: SideId,
    foeId: SideId,
    move: Move,
    user: BattlePokemon,
    foe: BattlePokemon,
  ): void {
    const eff = move.effect;
    const key = moveKey(move);

    // Two-turn charge moves (Razor Wind, Sky Attack, Solar Beam, Fly, Dig, Skull Bash).
    if ((eff === 'CHARGE_EFFECT' || eff === 'FLY_EFFECT') && !user.volatile.charging) {
      user.volatile.charging = true;
      if (eff === 'FLY_EFFECT' || key === 'DIG') user.volatile.invulnerable = true;
      this.emit(`${user.displayName} began charging ${move.name}!`);
      return;
    }
    if (user.volatile.charging) {
      user.volatile.charging = false;
      user.volatile.invulnerable = false;
    }

    // Status / non-damaging move accuracy still applies.
    const hits = this.accuracyCheck(user, foe, move);
    if (!hits) {
      this.emit(`${user.displayName}'s attack missed!`);
      // Jump Kick crash damage on miss.
      if (eff === 'JUMP_KICK_EFFECT') {
        const crash = Math.max(1, Math.floor(foe.stats.maxHp / 8));
        const d = user.damage(crash);
        this.emit(`${user.displayName} kept going and crashed! (${d})`);
      }
      this.endLockedMove(user);
      return;
    }

    // Dispatch by effect.
    switch (eff) {
      case 'OHKO_EFFECT':
        this.doOhko(user, foe);
        return;
      case 'SPECIAL_DAMAGE_EFFECT':
        this.doFixedDamage(user, foe, key);
        return;
      case 'SUPER_FANG_EFFECT': {
        const d = foe.damage(Math.max(1, Math.floor(foe.hp / 2)));
        this.emit(`${foe.displayName} lost ${d} HP!`);
        return;
      }
      case 'DREAM_EATER_EFFECT': {
        if (foe.status !== 'SLEEP') {
          this.emit('But it failed!');
          return;
        }
        const res = this.dealDamage(user, foe, move);
        if (res > 0) {
          const healed = user.heal(Math.floor(res / 2));
          if (healed > 0) this.emit(`${user.displayName} restored ${healed} HP.`);
        }
        return;
      }
      case 'HEAL_EFFECT':
        this.doHeal(user);
        return;
      case 'REST_EFFECT':
        this.doRest(user);
        return;
      case 'LEECH_SEED_EFFECT':
        if (foe.hasType('GRASS')) { this.emit('It doesn\'t affect ' + foe.displayName + '...'); return; }
        if (foe.volatile.seeded) { this.emit('But it failed!'); return; }
        foe.volatile.seeded = true;
        this.emit(`${foe.displayName} was seeded!`);
        return;
      case 'SPLASH_EFFECT':
        this.emit('But nothing happened!');
        return;
      case 'MIST_EFFECT':
        user.volatile.mist = true;
        this.emit(`${user.displayName} became shrouded in mist!`);
        return;
      case 'REFLECT_EFFECT':
        user.volatile.reflect = true;
        this.emit(`${user.displayName} gained Reflect!`);
        return;
      case 'LIGHT_SCREEN_EFFECT':
        user.volatile.lightScreen = true;
        this.emit(`${user.displayName} gained Light Screen!`);
        return;
      case 'HAZE_EFFECT':
        this.doHaze();
        return;
      case 'FOCUS_ENERGY_EFFECT':
        user.volatile.focusEnergy = true;
        this.emit(`${user.displayName} is getting pumped!`);
        return;
      case 'SWITCH_AND_TELEPORT_EFFECT':
        // Roar/Whirlwind/Teleport: no effect in a 1v1 / trainer battle.
        this.emit('But it failed!');
        return;
      case 'CONVERSION_EFFECT':
        this.emit('But it failed!');
        return;
      case 'METRONOME_EFFECT': {
        const random = this.rng.pick(MOVES.filter((m) => m.effect !== 'METRONOME_EFFECT'));
        this.emit(`Metronome became ${random.name}!`);
        this.executeMove(side, foeId, random, user, foe);
        return;
      }
      case 'MIRROR_MOVE_EFFECT': {
        const last = foe.volatile.usedMoveLastTurn;
        if (!last) { this.emit('But it failed!'); return; }
        this.executeMove(side, foeId, last, user, foe);
        return;
      }
      case 'DISABLE_EFFECT': {
        const candidates = foe.moves.filter((m) => m.pp > 0);
        if (candidates.length === 0) { this.emit('But it failed!'); return; }
        const target = this.rng.pick(candidates);
        foe.volatile.disabledMove = target.move;
        foe.volatile.disabledTurns = this.rng.range(2, 8);
        this.emit(`${foe.displayName}'s ${target.move.name} was disabled!`);
        return;
      }
      case 'SUBSTITUTE_EFFECT': {
        const cost = Math.floor(user.stats.maxHp / 4);
        if (user.hp <= cost) { this.emit('But it failed!'); return; }
        user.damage(cost);
        user.volatile.substituteHp = cost + 1;
        this.emit(`${user.displayName} made a Substitute!`);
        return;
      }
      case 'BIDE_EFFECT':
        user.volatile.bideTurns = this.rng.range(2, 3);
        user.volatile.bideDamage = 0;
        this.emit(`${user.displayName} is storing energy!`);
        return;
      case 'NO_ADDITIONAL_EFFECT':
      default:
        break;
    }

    // Stat-changing status moves (no damage).
    if (move.power === 0 && this.handleStatStatusMove(eff, user, foe)) {
      return;
    }
    // Pure status-inflicting moves (no damage).
    if (move.power === 0 && this.handleStatusMove(eff, user, foe, move)) {
      return;
    }
    if (move.power === 0) {
      // A power-0 move we don't otherwise model.
      this.emit('But nothing happened!');
      return;
    }

    // --- Damaging moves below ---
    this.doDamagingMove(side, foeId, move, user, foe, eff, key);
  }

  private doDamagingMove(
    _side: SideId,
    _foeId: SideId,
    move: Move,
    user: BattlePokemon,
    foe: BattlePokemon,
    eff: string,
    _key: string,
  ): void {
    // Multi-hit handling.
    let hitCount = 1;
    if (eff === 'ATTACK_TWICE_EFFECT' || eff === 'TWINEEDLE_EFFECT') hitCount = 2;
    else if (eff === 'TWO_TO_FIVE_ATTACKS_EFFECT') hitCount = this.rollMultiHit();

    let totalDamage = 0;
    let lastTypeMult = 1;
    for (let i = 0; i < hitCount; i++) {
      if (foe.isFainted) break;
      const result = calcDamage(user, foe, move, this.rng);
      lastTypeMult = result.typeMultiplier;
      const dealt = this.applyDamageToTarget(foe, result.damage);
      totalDamage += dealt;
      if (result.isCritical) this.emit('A critical hit!');
    }

    if (hitCount > 1) this.emit(`Hit ${hitCount} time(s)!`);
    this.reportEffectiveness(lastTypeMult, foe);
    if (totalDamage > 0) this.emit(`${foe.displayName} took ${totalDamage} damage. (${foe.hp}/${foe.stats.maxHp})`);

    // Post-damage effects.
    this.applySecondaryEffects(eff, move, user, foe, totalDamage);
  }

  private applySecondaryEffects(
    eff: string,
    move: Move,
    user: BattlePokemon,
    foe: BattlePokemon,
    damageDealt: number,
  ): void {
    switch (eff) {
      case 'RECOIL_EFFECT': {
        const recoil = Math.max(1, Math.floor(damageDealt / 4));
        const d = user.damage(recoil);
        this.emit(`${user.displayName} is hit with recoil! (${d})`);
        break;
      }
      case 'EXPLODE_EFFECT': {
        const d = user.hp;
        user.damage(user.hp);
        this.emit(`${user.displayName} fainted from the blast! (${d})`);
        break;
      }
      case 'DRAIN_HP_EFFECT': {
        if (damageDealt > 0) {
          const healed = user.heal(Math.floor(damageDealt / 2));
          if (healed > 0) this.emit(`${user.displayName} drained ${healed} HP!`);
        }
        break;
      }
      case 'HYPER_BEAM_EFFECT':
        if (!foe.isFainted) user.volatile.recharging = true;
        break;
      case 'JUMP_KICK_EFFECT':
        // crash handled on miss only
        break;
      case 'THRASH_PETAL_DANCE_EFFECT':
        this.handleLockedMove(user, move);
        break;
      case 'TRAPPING_EFFECT':
        if (foe.volatile.trapped <= 0) foe.volatile.trapped = this.rng.range(2, 5);
        break;
      case 'PAY_DAY_EFFECT':
        this.emit('Coins scattered everywhere!');
        break;
      case 'RAGE_EFFECT':
        this.handleLockedMove(user, move);
        break;
      // Status side effects:
      case 'BURN_SIDE_EFFECT1':
        this.maybeStatus(foe, 'BURN', 0.1);
        break;
      case 'BURN_SIDE_EFFECT2':
        this.maybeStatus(foe, 'BURN', 0.3);
        break;
      case 'FREEZE_SIDE_EFFECT':
        this.maybeStatus(foe, 'FREEZE', 0.1);
        break;
      case 'PARALYZE_SIDE_EFFECT1':
        this.maybeStatus(foe, 'PARALYSIS', 0.1);
        break;
      case 'PARALYZE_SIDE_EFFECT2':
        this.maybeStatus(foe, 'PARALYSIS', 0.3);
        break;
      case 'POISON_SIDE_EFFECT1':
        this.maybeStatus(foe, 'POISON', 0.1);
        break;
      case 'POISON_SIDE_EFFECT2':
      case 'TWINEEDLE_EFFECT':
        this.maybeStatus(foe, 'POISON', 0.2);
        break;
      case 'CONFUSION_SIDE_EFFECT':
        if (this.rng.chance(0.1)) this.inflictConfusion(foe);
        break;
      case 'FLINCH_SIDE_EFFECT1':
        if (this.rng.chance(0.1)) foe.volatile.flinch = true;
        break;
      case 'FLINCH_SIDE_EFFECT2':
        if (this.rng.chance(0.3)) foe.volatile.flinch = true;
        break;
      case 'ATTACK_DOWN_SIDE_EFFECT':
        if (this.rng.chance(0.33)) this.changeStage(foe, 'attack', -1);
        break;
      case 'DEFENSE_DOWN_SIDE_EFFECT':
        if (this.rng.chance(0.1)) this.changeStage(foe, 'defense', -1);
        break;
      case 'SPEED_DOWN_SIDE_EFFECT':
        if (this.rng.chance(0.33)) this.changeStage(foe, 'speed', -1);
        break;
      case 'SPECIAL_DOWN_SIDE_EFFECT':
        if (this.rng.chance(0.33)) this.changeStage(foe, 'special', -1);
        break;
      default:
        break;
    }
  }

  // ---- effect helpers ---------------------------------------------------

  private rollMultiHit(): number {
    // 2 (37.5%), 3 (37.5%), 4 (12.5%), 5 (12.5%)
    const r = this.rng.next();
    if (r < 0.375) return 2;
    if (r < 0.75) return 3;
    if (r < 0.875) return 4;
    return 5;
  }

  private applyDamageToTarget(foe: BattlePokemon, amount: number): number {
    if (foe.volatile.substituteHp > 0) {
      const before = foe.volatile.substituteHp;
      foe.volatile.substituteHp = Math.max(0, foe.volatile.substituteHp - amount);
      if (foe.volatile.substituteHp === 0) this.emit(`${foe.displayName}'s Substitute broke!`);
      return before - foe.volatile.substituteHp;
    }
    return foe.damage(amount);
  }

  private dealDamage(user: BattlePokemon, foe: BattlePokemon, move: Move): number {
    const res = calcDamage(user, foe, move, this.rng);
    if (res.isCritical) this.emit('A critical hit!');
    const dealt = this.applyDamageToTarget(foe, res.damage);
    this.reportEffectiveness(res.typeMultiplier, foe);
    if (dealt > 0) this.emit(`${foe.displayName} took ${dealt} damage. (${foe.hp}/${foe.stats.maxHp})`);
    return dealt;
  }

  private doOhko(user: BattlePokemon, foe: BattlePokemon): void {
    if (foe.stats.speed > user.stats.speed) {
      this.emit('But it failed!');
      return;
    }
    foe.damage(foe.hp);
    this.emit(`It's a one-hit KO!`);
  }

  private doFixedDamage(user: BattlePokemon, foe: BattlePokemon, key: string): void {
    let dmg: number;
    switch (key) {
      case 'SEISMIC_TOSS':
      case 'NIGHT_SHADE':
        dmg = user.level;
        break;
      case 'SONICBOOM':
        dmg = 20;
        break;
      case 'DRAGON_RAGE':
        dmg = 40;
        break;
      case 'PSYWAVE':
        dmg = this.rng.range(1, Math.max(1, Math.floor(user.level * 1.5)));
        break;
      default:
        dmg = user.level;
    }
    const dealt = this.applyDamageToTarget(foe, dmg);
    this.emit(`${foe.displayName} took ${dealt} damage. (${foe.hp}/${foe.stats.maxHp})`);
  }

  private doHeal(user: BattlePokemon): void {
    const healed = user.heal(Math.floor(user.stats.maxHp / 2));
    if (healed > 0) this.emit(`${user.displayName} regained ${healed} HP!`);
    else this.emit('But it failed!');
  }

  private doRest(user: BattlePokemon): void {
    if (user.hp === user.stats.maxHp) { this.emit('But it failed!'); return; }
    user.status = 'SLEEP';
    user.sleepTurns = 2;
    user.heal(user.stats.maxHp);
    this.emit(`${user.displayName} went to sleep and became healthy!`);
  }

  private doHaze(): void {
    for (const side of [0, 1] as SideId[]) {
      const p = this.active(side);
      (Object.keys(p.stages) as StageKey[]).forEach((k) => (p.stages[k] = 0));
      p.volatile.reflect = false;
      p.volatile.lightScreen = false;
      p.volatile.mist = false;
      p.volatile.focusEnergy = false;
      p.volatile.confusionTurns = 0;
    }
    this.emit('All stat changes were eliminated!');
  }

  private handleLockedMove(user: BattlePokemon, move: Move): void {
    if (user.volatile.lockedMove) {
      user.volatile.lockedTurns--;
      if (user.volatile.lockedTurns <= 0) {
        user.volatile.lockedMove = null;
        this.inflictConfusion(user);
      }
    } else {
      user.volatile.lockedMove = move;
      user.volatile.lockedTurns = this.rng.range(1, 2); // total 2-3 turns
    }
  }

  private endLockedMove(user: BattlePokemon): void {
    if (user.volatile.lockedMove) {
      user.volatile.lockedMove = null;
      user.volatile.lockedTurns = 0;
    }
  }

  /** Stat-up (self) / stat-down (foe) moves. Returns true if handled. */
  private handleStatStatusMove(eff: string, user: BattlePokemon, foe: BattlePokemon): boolean {
    const selfMap: Record<string, [StageKey, number]> = {
      ATTACK_UP1_EFFECT: ['attack', 1],
      ATTACK_UP2_EFFECT: ['attack', 2],
      DEFENSE_UP1_EFFECT: ['defense', 1],
      DEFENSE_UP2_EFFECT: ['defense', 2],
      SPEED_UP2_EFFECT: ['speed', 2],
      SPECIAL_UP1_EFFECT: ['special', 1],
      SPECIAL_UP2_EFFECT: ['special', 2],
      EVASION_UP1_EFFECT: ['evasion', 1],
    };
    const foeMap: Record<string, [StageKey, number]> = {
      ATTACK_DOWN1_EFFECT: ['attack', -1],
      DEFENSE_DOWN1_EFFECT: ['defense', -1],
      DEFENSE_DOWN2_EFFECT: ['defense', -2],
      SPEED_DOWN1_EFFECT: ['speed', -1],
      ACCURACY_DOWN1_EFFECT: ['accuracy', -1],
    };
    if (selfMap[eff]) {
      const [stat, delta] = selfMap[eff];
      this.changeStage(user, stat, delta);
      return true;
    }
    if (foeMap[eff]) {
      if (foe.volatile.mist) { this.emit(`${foe.displayName} is protected by Mist!`); return true; }
      const [stat, delta] = foeMap[eff];
      this.changeStage(foe, stat, delta);
      return true;
    }
    return false;
  }

  /** Pure status-inflicting moves. Returns true if handled. */
  private handleStatusMove(eff: string, _user: BattlePokemon, foe: BattlePokemon, _move: Move): boolean {
    switch (eff) {
      case 'SLEEP_EFFECT':
        if (foe.status !== 'NONE') { this.emit('But it failed!'); return true; }
        foe.status = 'SLEEP';
        foe.sleepTurns = this.rng.range(1, 7);
        this.emit(`${foe.displayName} fell asleep!`);
        return true;
      case 'POISON_EFFECT': {
        // Toxic vs PoisonPowder etc. — Toxic uses TOXIC status.
        if (foe.hasType('POISON')) { this.emit('It doesn\'t affect ' + foe.displayName + '...'); return true; }
        if (foe.status !== 'NONE') { this.emit('But it failed!'); return true; }
        foe.status = 'POISON';
        this.emit(`${foe.displayName} was poisoned!`);
        return true;
      }
      case 'PARALYZE_EFFECT':
        if (foe.status !== 'NONE') { this.emit('But it failed!'); return true; }
        foe.status = 'PARALYSIS';
        this.emit(`${foe.displayName} was paralyzed!`);
        return true;
      case 'CONFUSION_EFFECT':
        this.inflictConfusion(foe);
        return true;
      default:
        return false;
    }
  }

  private maybeStatus(foe: BattlePokemon, status: MajorStatus, chance: number): void {
    if (foe.status !== 'NONE') return;
    if (status === 'BURN' && foe.hasType('FIRE')) return;
    if (status === 'FREEZE' && foe.hasType('ICE')) return;
    if (status === 'POISON' && foe.hasType('POISON')) return;
    if (this.rng.chance(chance)) {
      foe.status = status;
      const verb: Record<string, string> = {
        BURN: 'was burned',
        FREEZE: 'was frozen solid',
        PARALYSIS: 'was paralyzed',
        POISON: 'was poisoned',
      };
      this.emit(`${foe.displayName} ${verb[status] ?? 'was afflicted'}!`);
    }
  }

  private inflictConfusion(target: BattlePokemon): void {
    if (target.volatile.confusionTurns > 0) { this.emit('But it failed!'); return; }
    target.volatile.confusionTurns = this.rng.range(2, 5);
    this.emit(`${target.displayName} became confused!`);
  }

  private changeStage(p: BattlePokemon, stat: StageKey, delta: number): void {
    const before = p.stages[stat];
    p.stages[stat] = Math.max(-6, Math.min(6, before + delta));
    const actual = p.stages[stat] - before;
    if (actual === 0) {
      this.emit(`${p.displayName}'s ${stat} won't go ${delta > 0 ? 'higher' : 'lower'}!`);
      return;
    }
    const dir = delta > 0 ? 'rose' : 'fell';
    const amt = Math.abs(delta) >= 2 ? ' sharply' : '';
    this.emit(`${p.displayName}'s ${stat}${amt} ${dir}!`);
  }

  private reportEffectiveness(mult: number, foe: BattlePokemon): void {
    if (mult === 0) this.emit(`It doesn't affect ${foe.displayName}...`);
    else if (mult >= 2) this.emit('It\'s super effective!');
    else if (mult > 0 && mult < 1) this.emit('It\'s not very effective...');
  }

  private accuracyCheck(user: BattlePokemon, foe: BattlePokemon, move: Move): boolean {
    if (move.effect === 'SWIFT_EFFECT' || move.accuracy <= 0) return true;
    if (foe.volatile.invulnerable) return false;
    // Accuracy * accuracy-stage * evasion-stage.
    const accStage = getStatMultiplier(user.stages.accuracy);
    const evaStage = getStatMultiplier(foe.stages.evasion);
    const effective = (move.accuracy / 100) * accStage / evaStage;
    return this.rng.next() < effective;
  }

  // ---- end of turn ------------------------------------------------------

  private endOfTurn(side: SideId): void {
    const p = this.active(side);
    if (p.isFainted) return;

    if (p.status === 'BURN') {
      const d = p.damage(Math.max(1, Math.floor(p.stats.maxHp / 16)));
      this.emit(`${p.displayName} is hurt by its burn! (${d})`);
    } else if (p.status === 'POISON') {
      const d = p.damage(Math.max(1, Math.floor(p.stats.maxHp / 16)));
      this.emit(`${p.displayName} is hurt by poison! (${d})`);
    } else if (p.status === 'TOXIC') {
      p.volatile.toxicCounter++;
      const d = p.damage(Math.max(1, Math.floor((p.stats.maxHp / 16) * p.volatile.toxicCounter)));
      this.emit(`${p.displayName} is hurt by poison! (${d})`);
    }

    if (p.volatile.seeded && !p.isFainted) {
      const foe = this.active(this.opponent(side));
      const drain = Math.max(1, Math.floor(p.stats.maxHp / 16));
      const lost = p.damage(drain);
      foe.heal(lost);
      this.emit(`${p.displayName}'s health is sapped by Leech Seed! (${lost})`);
    }

    // Disable countdown.
    if (p.volatile.disabledMove) {
      p.volatile.disabledTurns--;
      if (p.volatile.disabledTurns <= 0) {
        this.emit(`${p.displayName}'s ${p.volatile.disabledMove.name} is no longer disabled!`);
        p.volatile.disabledMove = null;
      }
    }
  }

  // ---- faint / win detection -------------------------------------------

  private checkFaints(): void {
    for (const side of [0, 1] as SideId[]) {
      const p = this.active(side);
      if (p.isFainted && p.hp <= 0) {
        // Only announce once: mark by zero hp; the driver handles replacement.
      }
    }
    for (const side of [0, 1] as SideId[]) {
      if (!this.hasRemaining(side)) {
        this.finished = true;
        this.winner = this.opponent(side);
      }
    }
  }

  /** Called by the driver after a faint to bring in a replacement. */
  announceFaint(side: SideId): void {
    const p = this.active(side);
    if (p.isFainted) this.emit(`${p.displayName} fainted!`);
  }

  needsReplacement(side: SideId): boolean {
    return this.active(side).isFainted && this.hasRemaining(side);
  }
}
