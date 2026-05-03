import { Board, GameState } from '../types/game';
import { resolveModifiers, CLASSIC_MODIFIERS } from './modifiers/registry';
import { Rng } from './modifiers/types';
import {
  applyMoveWithModifiers,
  ApplyMoveOptions,
  createInitialStateWithModifiers,
  getLegalMoves as getLegalMovesPipeline,
} from './modifiers/pipeline';

export function createInitialState(
  modifierIds: string[] = CLASSIC_MODIFIERS,
  rng?: Rng,
): GameState {
  return createInitialStateWithModifiers(resolveModifiers(modifierIds), rng);
}

/**
 * Apply a move. `options.andThen` enables Double Stamp (place a second mark
 * in the same turn, costing `options.costCredits` from the player's
 * Block Credits balance).
 */
export function applyMove(
  state: GameState,
  cellIndex: number,
  rng?: Rng,
  options?: ApplyMoveOptions,
): GameState {
  const modifiers = resolveModifiers(state.modifiers);
  return applyMoveWithModifiers(state, cellIndex, modifiers, rng, options);
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
