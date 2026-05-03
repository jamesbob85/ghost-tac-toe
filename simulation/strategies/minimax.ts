import { GameState, Player } from '../../src/types/game';
import { applyMove, getEmptyCells } from '../../src/engine/gameEngine';
import { Strategy, pickRandom } from './types';

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/**
 * Player-agnostic minimax. Evaluates from `me`'s perspective.
 * Picks RANDOMLY among equally-valued top moves so self-play surfaces
 * variance instead of always playing the same game.
 */
function minimax(
  state: GameState,
  depth: number,
  me: Player,
  isMaxTurn: boolean,
  alpha: number,
  beta: number,
): number {
  if (state.phase === 'won') {
    if (state.winner === me) return 100 + depth;
    return -(100 + depth);
  }
  if (state.phase === 'draw') return 0;
  if (depth === 0) return evaluate(state, me);

  const empties = getEmptyCells(state.board);
  if (empties.length === 0) return evaluate(state, me);

  if (isMaxTurn) {
    let best = -Infinity;
    for (const c of empties) {
      const next = applyMove(state, c);
      const score = minimax(next, depth - 1, me, false, alpha, beta);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of empties) {
      const next = applyMove(state, c);
      const score = minimax(next, depth - 1, me, true, alpha, beta);
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

/** Heuristic: count line ownership from `me`'s perspective */
function evaluate(state: GameState, me: Player): number {
  const opp: Player = me === 'X' ? 'O' : 'X';
  let score = 0;
  for (const [a, b, c] of WIN_LINES) {
    const cells = [state.board[a], state.board[b], state.board[c]];
    const meCount = cells.filter((v) => v === me).length;
    const oppCount = cells.filter((v) => v === opp).length;
    if (oppCount === 0) score += meCount * meCount;
    if (meCount === 0) score -= oppCount * oppCount;
  }
  return score;
}

/**
 * Build a minimax-based strategy at the given depth.
 * `rank` is the strength rank (used in metrics); higher depth = higher rank.
 */
export function makeMinimaxStrategy(opts: {
  id: string;
  name: string;
  depth: number;
  rank: number;
}): Strategy {
  return {
    id: opts.id,
    name: opts.name,
    rank: opts.rank,
    pickMove(state, me, rng) {
      const empties = getEmptyCells(state.board);
      if (empties.length === 0) return -1;

      // Score each move; track best & all moves tied at best
      let best = -Infinity;
      const scored: { cell: number; score: number }[] = [];
      for (const cell of empties) {
        const next = applyMove(state, cell);
        const score = minimax(next, opts.depth - 1, me, false, -Infinity, Infinity);
        scored.push({ cell, score });
        if (score > best) best = score;
      }

      // Random tiebreak among top moves (within a tiny epsilon)
      const eps = 1e-6;
      const top = scored.filter((s) => s.score >= best - eps).map((s) => s.cell);
      return pickRandom(top, rng);
    },
  };
}

// Convenience presets
export const Lookahead2 = makeMinimaxStrategy({
  id: 'lookahead2',
  name: 'Lookahead-2',
  depth: 2,
  rank: 3,
});

export const Lookahead4 = makeMinimaxStrategy({
  id: 'lookahead4',
  name: 'Lookahead-4',
  depth: 4,
  rank: 4,
});

/**
 * "Full" search at depth 9 for vanilla TTT, depth 8 for ghost mode (capped
 * for tractability — ghost mode has no natural terminal beyond eviction).
 */
export const MinimaxFull = makeMinimaxStrategy({
  id: 'minimax_full',
  name: 'Minimax (depth 9)',
  depth: 9,
  rank: 5,
});

export const MinimaxDeep = makeMinimaxStrategy({
  id: 'minimax_deep',
  name: 'Minimax (depth 12)',
  depth: 12,
  rank: 6,
});
