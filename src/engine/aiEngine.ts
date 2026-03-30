import { GameState, Player, Board, Difficulty } from '../types/game';
import { applyMove, getEmptyCells } from './gameEngine';

/**
 * Returns the best cell index for the AI to play.
 * The AI always plays as 'O'.
 */
export function getBestMove(state: GameState, difficulty: Difficulty): number {
  const emptyCells = getEmptyCells(state.board);
  if (emptyCells.length === 0) return -1;

  switch (difficulty) {
    case 'easy':
      return getRandomMove(emptyCells);
    case 'medium':
      return getMediumMove(state, emptyCells);
    case 'hard':
      return getHardMove(state, emptyCells);
    default:
      return getRandomMove(emptyCells);
  }
}

// ─── Easy: Random ─────────────────────────────────────────────────────────────

function getRandomMove(emptyCells: number[]): number {
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

// ─── Medium: Win/Block/Random ─────────────────────────────────────────────────

function getMediumMove(state: GameState, emptyCells: number[]): number {
  // 1. Can AI ('O') win in one move?
  for (const cell of emptyCells) {
    const next = applyMove(state, cell);
    if (next.winner === 'O') return cell;
  }

  // 2. Must AI block player ('X') from winning?
  // Use applyMove with currentPlayer swapped to X so ghost eviction is respected
  const xTurnState = { ...state, currentPlayer: 'X' as const };
  for (const cell of emptyCells) {
    const next = applyMove(xTurnState, cell);
    if (next.winner === 'X') return cell;
  }

  // 3. Prefer center, then corners, then edges
  return getStrategicMove(emptyCells);
}

// ─── Hard: Ghost-Aware Minimax ────────────────────────────────────────────────

const MINIMAX_DEPTH = 6;

function getHardMove(state: GameState, emptyCells: number[]): number {
  let bestScore = -Infinity;
  let bestMove = emptyCells[0];

  for (const cell of emptyCells) {
    const next = applyMove(state, cell);
    const score = minimax(next, MINIMAX_DEPTH, false, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }

  return bestMove;
}

/**
 * Minimax with alpha-beta pruning.
 * isMaximizing = true means it's 'O' (AI) turn.
 */
function minimax(
  state: GameState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
): number {
  // Terminal states
  if (state.phase === 'won') {
    return state.winner === 'O' ? 10 + depth : -(10 + depth);
  }
  if (state.phase === 'draw') return 0;
  if (depth === 0) return evaluateBoard(state.board);

  const emptyCells = getEmptyCells(state.board);
  if (emptyCells.length === 0) return evaluateBoard(state.board);

  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const cell of emptyCells) {
      const next = applyMove(state, cell);
      const score = minimax(next, depth - 1, false, alpha, beta);
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // alpha-beta pruning
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const cell of emptyCells) {
      const next = applyMove(state, cell);
      const score = minimax(next, depth - 1, true, alpha, beta);
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

/**
 * Simple heuristic for non-terminal boards at max depth.
 * Counts lines where O has advantage.
 */
function evaluateBoard(board: Board): number {
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

/** Prefer center > corners > edges */
function getStrategicMove(emptyCells: number[]): number {
  const center = [4];
  const corners = [0, 2, 6, 8];
  const edges = [1, 3, 5, 7];

  for (const preferred of [center, corners, edges]) {
    const available = preferred.filter((i) => emptyCells.includes(i));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }

  return emptyCells[0];
}
