import { Player } from '../../src/types/game';
import { Strategy } from '../strategies/types';
import { Variant } from '../variants';
import { playMatch, MatchResult } from './singleMatch';

export interface PairingResult {
  aId: string;
  bId: string;
  /** 'a-x' = strategy A played X. We alternate to remove first-mover bias from the matrix. */
  matches: MatchResult[];
}

export interface TournamentResult {
  variant: Variant;
  /** All N×N strategy pairings (including self-play) */
  pairings: PairingResult[];
  /** Strategies in the order they were entered */
  strategies: Strategy[];
  /** Matches per pairing (per side — actual matches = matchesPerPairing × 2 because we alternate X/O) */
  matchesPerPairing: number;
  durationMs: number;
}

export interface TournamentOptions {
  /** How many games each (A vs B) pairing plays as A=X, then again as A=O. Total per pairing = 2 × this. */
  matchesPerPairing: number;
  /** Deterministic seed; per-match seeds are derived from this */
  seed: number;
  /** Optional progress callback */
  onProgress?: (done: number, total: number) => void;
}

/**
 * Round-robin tournament between strategies for a single variant.
 * Every (A, B) pair is run twice: once with A as X, once with A as O.
 */
export function runTournament(
  strategies: Strategy[],
  variant: Variant,
  opts: TournamentOptions,
): TournamentResult {
  const start = Date.now();
  const pairings: PairingResult[] = [];
  const totalPairings = strategies.length * strategies.length;
  let pairingIndex = 0;

  for (const a of strategies) {
    for (const b of strategies) {
      const matches: MatchResult[] = [];
      // Half the matches: A plays X, B plays O
      for (let i = 0; i < opts.matchesPerPairing; i++) {
        const seed = hashSeed(opts.seed, a.id, b.id, 'AX', i);
        matches.push(playMatch(a, b, variant.id, { ...variant.matchOptions, seed }));
      }
      // Other half: A plays O, B plays X — swap labels in result so we still track A vs B
      for (let i = 0; i < opts.matchesPerPairing; i++) {
        const seed = hashSeed(opts.seed, a.id, b.id, 'AO', i);
        const m = playMatch(b, a, variant.id, { ...variant.matchOptions, seed });
        // Re-label the match so xId/oId always refer to A/B respectively for this pairing
        matches.push({
          ...m,
          xId: a.id,
          oId: b.id,
          winner: m.winner === null ? null : (m.winner === 'X' ? 'O' : 'X') as Player,
        });
      }
      pairings.push({ aId: a.id, bId: b.id, matches });
      pairingIndex++;
      opts.onProgress?.(pairingIndex, totalPairings);
    }
  }

  return {
    variant,
    pairings,
    strategies,
    matchesPerPairing: opts.matchesPerPairing,
    durationMs: Date.now() - start,
  };
}

/** Stable per-match seed derived from tournament seed + pairing identifiers */
function hashSeed(
  baseSeed: number,
  aId: string,
  bId: string,
  side: 'AX' | 'AO',
  iteration: number,
): number {
  let h = baseSeed >>> 0;
  const s = `${aId}|${bId}|${side}|${iteration}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0;
  }
  return h;
}
