import { GameState, Player, Board, Difficulty } from '../types/game';
import { applyMove, getEmptyCells, getLegalMoves } from './gameEngine';
import { resolveModifiers } from './modifiers/registry';
import { findInCategory } from './modifiers/types';
import { checkWin as defaultCheckWin } from './winDetector';

/**
 * Returns the best cell for the AI (always plays as 'O' in the live game).
 * Modifier-aware: respects custom win-conditions and topology restrictions
 * via the active modifier list on `state`.
 */
export function getBestMove(state: GameState, difficulty: Difficulty): number {
  const empties = getLegalMoves(state);
  if (empties.length === 0) return -1;

  switch (difficulty) {
    case 'easy':
      return getRandomMove(empties);
    case 'medium':
      return getMediumMove(state, empties);
    case 'hard':
      return getHardMove(state, empties);
    default:
      return getRandomMove(empties);
  }
}

function getRandomMove(empties: number[]): number {
  return empties[Math.floor(Math.random() * empties.length)];
}

function getMediumMove(state: GameState, empties: number[]): number {
  // 1. Take an immediate win
  for (const cell of empties) {
    const next = applyMove(state, cell);
    if (next.winner === 'O') return cell;
  }

  // 2. Block opponent's immediate win — flip currentPlayer to X then test
  const oppTurn: GameState = { ...state, currentPlayer: 'X' };
  for (const cell of empties) {
    const next = applyMove(oppTurn, cell);
    if (next.winner === 'X') return cell;
  }

  // 3. Strategic — center > corners > edges (from the legal-moves set)
  return getStrategicMove(empties);
}

const MINIMAX_DEPTH = 6;

function getHardMove(state: GameState, empties: number[]): number {
  let bestScore = -Infinity;
  let bestMove = empties[0];

  for (const cell of empties) {
    const next = applyMove(state, cell);
    const score = minimax(next, MINIMAX_DEPTH, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }
  return bestMove;
}

function minimax(
  state: GameState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
): number {
  if (state.phase === 'won') return state.winner === 'O' ? 100 + depth : -(100 + depth);
  if (state.phase === 'draw') return 0;
  if (depth === 0) return evaluateBoard(state);

  const empties = getLegalMoves(state);
  if (empties.length === 0) return evaluateBoard(state);

  if (isMaximizing) {
    let best = -Infinity;
    for (const c of empties) {
      const next = applyMove(state, c);
      const score = minimax(next, depth - 1, false, alpha, beta);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of empties) {
      const next = applyMove(state, c);
      const score = minimax(next, depth - 1, true, alpha, beta);
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Heuristic — counts line ownership from O's perspective.
 * Modifier-aware: if an active winCondition modifier exists, defer to its
 * checkWin only as a terminal indicator (we can't easily score partial misère
 * boards generically, so we fall back to the standard line-count heuristic).
 */
function evaluateBoard(state: GameState): number {
  const board: Board = state.board;
  let score = 0;
  const lines: [number, number, number][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const cells = [board[a], board[b], board[c]];
    const oCount = cells.filter((v) => v === 'O').length;
    const xCount = cells.filter((v) => v === 'X').length;
    if (xCount === 0) score += oCount;
    if (oCount === 0) score -= xCount;
  }
  return score;
}

function getStrategicMove(empties: number[]): number {
  const center = [4];
  const corners = [0, 2, 6, 8];
  const edges = [1, 3, 5, 7];
  for (const tier of [center, corners, edges]) {
    const avail = tier.filter((i) => empties.includes(i));
    if (avail.length > 0) return avail[Math.floor(Math.random() * avail.length)];
  }
  return empties[0];
}

// Suppress unused-import warnings until we use these for win-condition reads
const _unused = { getEmptyCells, resolveModifiers, findInCategory, defaultCheckWin };
