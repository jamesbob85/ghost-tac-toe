import { Board } from '../../types/game';
import { Modifier } from './types';
import { CHAOS_BONUS_SCORE, WIN_SCORE } from '../../constants/gameConfig';

/** Slice shape for the Chaos Cell modifier */
interface ChaosSlice {
  cell: number | null;
}

/**
 * Chaos Cell — a glowing cell rotates each turn. Winning through it doubles
 * (or otherwise multiplies) the score.
 */
export const ChaosCell: Modifier = {
  id: 'chaos_cell',
  name: 'Chaos Cell',
  category: 'scoring',

  initState: (board) => ({ cell: pickRandomEmpty(board) }) as ChaosSlice,

  scoreFor: (winLine, defaultScore, _state, slice) => {
    const s = slice as ChaosSlice;
    if (s.cell !== null && winLine.includes(s.cell)) return CHAOS_BONUS_SCORE;
    return defaultScore;
  },

  afterTurn: (state, prevCell, slice) => {
    const s = slice as ChaosSlice;
    return { cell: pickRandomEmpty(state.board, prevCell) } as ChaosSlice;
  },
};

function pickRandomEmpty(board: Board, exclude?: number): number | null {
  const empty: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null && i !== exclude) empty.push(i);
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

/** Ensure WIN_SCORE imported for tree-shaking sanity */
export const _DEFAULT_SCORE_REF = WIN_SCORE;
