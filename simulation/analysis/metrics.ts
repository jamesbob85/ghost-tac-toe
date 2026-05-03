import { Strategy } from '../strategies/types';
import { TournamentResult, PairingResult } from '../runners/tournament';
import { MatchResult } from '../runners/singleMatch';

// ─── Outcome counting ─────────────────────────────────────────────────

export interface Outcome {
  aWins: number;
  bWins: number;
  draws: number;
  total: number;
}

/** Tally A/B outcomes from a pairing's matches. A's id is treated as X-equivalent. */
export function tallyPairing(p: PairingResult): Outcome {
  let aWins = 0, bWins = 0, draws = 0;
  for (const m of p.matches) {
    if (m.winner === null) draws++;
    else if (m.winner === 'X') aWins++; // X is always A in our re-labeled matches
    else bWins++;
  }
  return { aWins, bWins, draws, total: p.matches.length };
}

// ─── Solvedness ───────────────────────────────────────────────────────

/**
 * Solvedness measures how predictable the outcome is between two equally-strong AIs.
 *
 * 1.0 = always one outcome (game is solved — boring)
 * 0.0 = uniform 1/3 distribution across X/O/Draw (max variance)
 *
 * We compute it from the strongest strategy's self-play matches.
 */
export function computeSolvedness(t: TournamentResult, strongestId: string): number {
  const selfPlay = t.pairings.find((p) => p.aId === strongestId && p.bId === strongestId);
  if (!selfPlay || selfPlay.matches.length === 0) return NaN;

  const { aWins, bWins, draws, total } = tallyPairing(selfPlay);
  // Note: in self-play the X/O labels are arbitrary, so we treat all three buckets independently
  const probs = [aWins / total, bWins / total, draws / total].filter((p) => p > 0);
  const entropy = -probs.reduce((s, p) => s + p * Math.log2(p), 0);
  // Max entropy for 3 outcomes = log2(3) ≈ 1.585
  const maxEntropy = Math.log2(3);
  return 1 - entropy / maxEntropy;
}

// ─── Skill gradient ───────────────────────────────────────────────────

/**
 * Pearson correlation between a strategy's rank and its overall win rate.
 * Higher correlation = cleaner skill ladder.
 */
export function computeSkillGradient(t: TournamentResult): number {
  const strategies = t.strategies;
  const winRates = strategies.map((s) => overallWinRate(t, s.id));
  const ranks = strategies.map((s) => s.rank);
  return pearson(ranks, winRates);
}

/** Overall win rate for a strategy across all opponents */
export function overallWinRate(t: TournamentResult, strategyId: string): number {
  let wins = 0, total = 0;
  for (const p of t.pairings) {
    // Skip self-play in win rate (no opponent to be "stronger than")
    if (p.aId === p.bId) continue;
    if (p.aId === strategyId) {
      const o = tallyPairing(p);
      wins += o.aWins;
      total += o.total;
    } else if (p.bId === strategyId) {
      const o = tallyPairing(p);
      wins += o.bWins;
      total += o.total;
    }
  }
  return total === 0 ? 0 : wins / total;
}

// ─── First-mover balance ──────────────────────────────────────────────

/**
 * |P(X wins) - P(O wins)| in self-play of strongest strategy.
 * Lower is better. 0 = perfectly balanced.
 */
export function computeFirstMoverImbalance(t: TournamentResult, strongestId: string): number {
  const selfPlay = t.pairings.find((p) => p.aId === strongestId && p.bId === strongestId);
  if (!selfPlay || selfPlay.matches.length === 0) return NaN;
  let xWins = 0, oWins = 0;
  for (const m of selfPlay.matches) {
    if (m.winner === 'X') xWins++;
    else if (m.winner === 'O') oWins++;
  }
  const total = selfPlay.matches.length;
  return Math.abs(xWins - oWins) / total;
}

// ─── Game length ──────────────────────────────────────────────────────

export function avgTurns(matches: MatchResult[]): number {
  if (matches.length === 0) return 0;
  return matches.reduce((s, m) => s + m.turns, 0) / matches.length;
}

// ─── Win matrix ───────────────────────────────────────────────────────

export interface WinMatrixCell {
  aWinPct: number;
  bWinPct: number;
  drawPct: number;
}

/** N×N matrix of win rates: rows=A, cols=B, value=A's win rate */
export function buildWinMatrix(t: TournamentResult): WinMatrixCell[][] {
  const n = t.strategies.length;
  const matrix: WinMatrixCell[][] = [];
  for (let i = 0; i < n; i++) {
    const row: WinMatrixCell[] = [];
    for (let j = 0; j < n; j++) {
      const a = t.strategies[i];
      const b = t.strategies[j];
      const p = t.pairings.find((p) => p.aId === a.id && p.bId === b.id);
      if (!p) {
        row.push({ aWinPct: 0, bWinPct: 0, drawPct: 0 });
        continue;
      }
      const o = tallyPairing(p);
      row.push({
        aWinPct: o.aWins / o.total,
        bWinPct: o.bWins / o.total,
        drawPct: o.draws / o.total,
      });
    }
    matrix.push(row);
  }
  return matrix;
}

// ─── Fun score ────────────────────────────────────────────────────────

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  matches: number;
  durationMs: number;

  solvedness: number;
  skillGradient: number;
  firstMoverImbalance: number;
  avgGameLength: number;

  funScore: number;
}

export function computeVariantMetrics(t: TournamentResult): VariantMetrics {
  const strongestId = strongestStrategyId(t);
  const solvedness = computeSolvedness(t, strongestId);
  const skillGradient = computeSkillGradient(t);
  const imbalance = computeFirstMoverImbalance(t, strongestId);
  const allMatches = t.pairings.flatMap((p) => p.matches);
  const length = avgTurns(allMatches);

  // Phase 0 fun score (decision richness + recovery rate added in later phases)
  const funScore =
    -2.0 * solvedness +
    1.5 * skillGradient -
    1.5 * imbalance;

  return {
    variantId: t.variant.id,
    variantName: t.variant.name,
    matches: allMatches.length,
    durationMs: t.durationMs,
    solvedness,
    skillGradient,
    firstMoverImbalance: imbalance,
    avgGameLength: length,
    funScore,
  };
}

function strongestStrategyId(t: TournamentResult): string {
  return [...t.strategies].sort((a, b) => b.rank - a.rank)[0].id;
}

// ─── Math ─────────────────────────────────────────────────────────────

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const mx = mean(xs), my = mean(ys);
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
