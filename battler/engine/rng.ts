// Small seedable PRNG (mulberry32) so battles are reproducible for testing.
// Pass a seed for deterministic runs, or omit for a random battle.

export class RNG {
  private state: number;

  constructor(seed?: number) {
    // If no seed, derive one from the current time.
    this.state = (seed ?? (Date.now() & 0xffffffff)) >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  /** Integer in [min, max] inclusive. */
  range(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  /** True with probability p (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Gen 1 accuracy check. Game stores accuracy as a byte 0..255; we use 0..100.
   * The ROM rolls a random byte and compares; we approximate with percentage.
   * accuracy of 0 here means "bypass accuracy" (e.g. Swift) -> always hits.
   */
  accuracyRoll(accuracyPercent: number): boolean {
    if (accuracyPercent <= 0) return true; // Swift / never-miss
    if (accuracyPercent >= 100) return true;
    return this.next() < accuracyPercent / 100;
  }

  /** Pick a random element. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('RNG.pick on empty array');
    return arr[this.int(arr.length)]!;
  }
}
