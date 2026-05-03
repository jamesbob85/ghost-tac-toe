import { GameState, Player } from '../../types/game';
import { Modifier } from './types';

/**
 * Block Credits — the resource economy.
 *
 * Each player accumulates credits by BLOCKING the opponent's potential wins.
 * "Block" defined strictly: placing on a cell that completes the opponent's
 * 3-in-a-row IF you hadn't placed there. One credit per blocking placement,
 * regardless of how many opponent lines you blocked simultaneously.
 *
 * Powerup: Double Stamp — costs 2 credits, lets you place 2 marks in one
 * turn. (See pipeline.ts for deployment handling and strategies/credit*.ts
 * for AI usage.)
 *
 * Hypothesis: rewarding defense gives the player a counter-incentive to
 * pure-attack play, creating a real strategic tension. May tip toward
 * defense-dominant if credits are too cheap or powerup too strong.
 */

export const DOUBLE_STAMP_COST = 2;

const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export interface BlockCreditsSlice {
  X: number;
  O: number;
}

/**
 * Was the placement at `cell` by `player` a block? Returns true if any
 * win-line through `cell` had the opponent occupying both other cells
 * BEFORE this placement (state.board reflects post-placement, so we just
 * check the OTHER two cells in the line).
 */
export function isBlock(state: GameState, cell: number, player: Player): boolean {
  const opp: Player = player === 'X' ? 'O' : 'X';
  for (const line of WIN_LINES) {
    if (!line.includes(cell)) continue;
    const others = line.filter((i) => i !== cell);
    if (others.every((i) => state.board[i] === opp)) return true;
  }
  return false;
}

export function getCredits(state: GameState, player: Player): number {
  const slice = state.modifierState[BlockCredits.id] as BlockCreditsSlice | undefined;
  return slice?.[player] ?? 0;
}

export function spendCredits(state: GameState, player: Player, amount: number): GameState {
  const slice = (state.modifierState[BlockCredits.id] as BlockCreditsSlice | undefined) ?? { X: 0, O: 0 };
  return {
    ...state,
    modifierState: {
      ...state.modifierState,
      [BlockCredits.id]: { ...slice, [player]: slice[player] - amount },
    },
  };
}

export const BlockCredits: Modifier = {
  id: 'block_credits',
  name: 'Block Credits',
  category: 'resource',

  initState: () => ({ X: 0, O: 0 }) as BlockCreditsSlice,

  afterPlace: (state, cell, player, slice) => {
    const credits = (slice as BlockCreditsSlice) ?? { X: 0, O: 0 };
    if (isBlock(state, cell, player)) {
      return {
        state,
        slice: { ...credits, [player]: credits[player] + 1 } as BlockCreditsSlice,
      };
    }
    return { state, slice };
  },
};
