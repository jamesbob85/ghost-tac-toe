import { Board } from '../../types/game';
import { Modifier, Rng } from './types';
import { CHAOS_BONUS_SCORE } from '../../constants/gameConfig';

interface ChaosSlice {
  cell: number | null;
}

/**
 * Chaos Cell — a glowing cell rotates each turn. Winning through it grants
 * bonus score (CHAOS_BONUS_SCORE instead of WIN_SCORE).
 *
 * Deterministic when given a seeded Rng (e.g. from the simulation harness);
 * uses Math.random in the live game.
 */
export const ChaosCell: Modifier = {
  id: 'chaos_cell',
  name: 'Chaos Cell',
  category: 'scoring',

  initState: (board, rng) => ({ cell: pickRandomEmpty(board, rng) }) as ChaosSlice,

  scoreFor: (winLine, defaultScore, _state, slice) => {
    const s = slice as ChaosSlice;
    if (s.cell !== null && winLine.includes(s.cell)) return CHAOS_BONUS_SCORE;
    return defaultScore;
  },

  afterTurn: (state, prevCell, _slice, rng) => {
    return { cell: pickRandomEmpty(state.board, rng, prevCell) } as ChaosSlice;
  },
};

function pickRandomEmpty(board: Board, rng: Rng, exclude?: number): number | null {
  const empty: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null && i !== exclude) empty.push(i);
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(rng() * empty.length)];
}
