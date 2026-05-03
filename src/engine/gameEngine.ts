import { Board, GameState } from '../types/game';
import { resolveModifiers, CLASSIC_MODIFIERS } from './modifiers/registry';
import {
  applyMoveWithModifiers,
  createInitialStateWithModifiers,
  getLegalMoves as getLegalMovesPipeline,
} from './modifiers/pipeline';

/**
 * Build a fresh game state for the given modifier id list. Pass an empty list
 * for vanilla tic-tac-toe; pass [GhostEviction.id] for the classic Ghost Tac
 * Toe experience; pass a daily edition's modifier list for daily play.
 */
export function createInitialState(modifierIds: string[] = CLASSIC_MODIFIERS): GameState {
  return createInitialStateWithModifiers(resolveModifiers(modifierIds));
}

/**
 * Pure reducer: apply a move and return the new state. The state itself
 * carries the active modifier list, so callers don't need to pass it.
 */
export function applyMove(state: GameState, cellIndex: number): GameState {
  const modifiers = resolveModifiers(state.modifiers);
  return applyMoveWithModifiers(state, cellIndex, modifiers);
}

/** Legal moves on the current state, respecting any topology modifier. */
export function getLegalMoves(state: GameState): number[] {
  return getLegalMovesPipeline(state, resolveModifiers(state.modifiers));
}

/** All empty cells (ignores topology — used by AI heuristics that want raw cell info). */
export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

/** Reset scores while keeping the same modifier configuration. */
export function resetScores(state: GameState): GameState {
  return {
    ...state,
    players: {
      X: { ...state.players.X, score: 0 },
      O: { ...state.players.O, score: 0 },
    },
  };
}
