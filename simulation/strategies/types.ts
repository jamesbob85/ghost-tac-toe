import { GameState, Player } from '../../src/types/game';

/**
 * A move is either a single cell (regular placement) or a Double Stamp
 * pair (places at `cell` then `doubleStamp`, costing 2 Block Credits).
 * Strategies that don't use powerups just return numbers.
 */
export type Move = number | { cell: number; doubleStamp: number };

export interface Strategy {
  readonly id: string;
  readonly name: string;
  readonly rank: number;
  pickMove(state: GameState, me: Player, rng: () => number): Move;
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
