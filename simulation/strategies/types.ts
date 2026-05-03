import { GameState, Player } from '../../src/types/game';

export interface Strategy {
  /** Stable identifier used in matrices and reports */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Approximate strength rank (1 = weakest, used for skill-gradient analysis) */
  readonly rank: number;
  /**
   * Pick a cell index to play.
   * `state.currentPlayer` is the player whose turn it is.
   * `me` is which side this strategy controls (so it can evaluate from its own perspective).
   */
  pickMove(state: GameState, me: Player, rng: () => number): number;
}

/** Mulberry32 PRNG. Deterministic given a seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick uniformly from an array using the provided RNG */
export function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}
