import { Modifier } from './types';

/**
 * Mirror — when a player stamps a cell, they ALSO stamp the diagonally
 * opposite cell (8 - cell) if it's empty. The mirror mark joins the player's
 * mark queue. FIFO eviction with queue size 3 — but since each placement may
 * add 2 marks, the eviction loop may run twice per turn.
 *
 * Diagonal pairs (3x3): 0↔8, 1↔7, 2↔6, 3↔5; 4 is center (mirror = self).
 *
 * Hypothesis: the mirror move forces strong center play (since center=self,
 * one safe placement) and creates fast wins via parallel lines. May favor X
 * heavily because the first mirror move sets up two threats at once.
 */
export const Mirror: Modifier = {
  id: 'mirror',
  name: 'Mirror',
  category: 'marks',
  pickEviction: (marks) => marks[0],
  maxMarks: () => 3,

  afterPlace: (state, cell, player, slice) => {
    const mirrorCell = 8 - cell;
    if (mirrorCell === cell) return { state, slice }; // center, no mirror needed
    if (state.board[mirrorCell] !== null) return { state, slice };

    const newBoard = [...state.board];
    newBoard[mirrorCell] = player;
    const playerState = state.players[player];
    const newMarks = [
      ...playerState.marks,
      { index: mirrorCell, turn: state.turnNumber },
    ];
    return {
      state: {
        ...state,
        board: newBoard,
        players: {
          ...state.players,
          [player]: { ...playerState, marks: newMarks },
        },
      },
      slice,
    };
  },
};
