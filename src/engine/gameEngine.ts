import { Board, GameState } from '../types/game';
import { resolveModifiers, CLASSIC_MODIFIERS } from './modifiers/registry';
import { Rng } from './modifiers/types';
import {
  applyMoveWithModifiers,
  createInitialStateWithModifiers,
  getLegalMoves as getLegalMovesPipeline,
} from './modifiers/pipeline';

/**
 * Build a fresh game state for the given modifier id list. Pass an empty list
 * for vanilla tic-tac-toe; pass [GhostEviction.id] for the classic Ghost Tac
 * Toe experience; pass a daily edition's modifier list for daily play.
 *
 * Pass a seeded Rng for deterministic behavior (used by the simulation harness).
 */
export function createInitialState(
  modifierIds: string[] = CLASSIC_MODIFIERS,
  rng?: Rng,
): GameState {
  return createInitialStateWithModifiers(resolveModifiers(modifierIds), rng);
}

/**
 * Pure reducer: apply a move and return the new state. The state itself
 * carries the active modifier list, so callers don't need to pass it.
 */
export function applyMove(state: GameState, cellIndex: number, rng?: Rng): GameState {
  const modifiers = resolveModifiers(state.modifiers);
  return applyMoveWithModifiers(state, cellIndex, modifiers, rng);
}

export function getLegalMoves(state: GameState): number[] {
  return getLegalMovesPipeline(state, resolveModifiers(state.modifiers));
}

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

export function resetScores(state: GameState): GameState {
  return {
    ...state,
    players: {
      X: { ...state.players.X, score: 0 },
      O: { ...state.players.O, score: 0 },
    },
  };
}
