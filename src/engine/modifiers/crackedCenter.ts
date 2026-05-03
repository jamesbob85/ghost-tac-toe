import { Modifier } from './types';

const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

/**
 * Cracked Center — the centre cell can never be claimed by either player,
 * but it counts as "wild" in any line that passes through it. So if X holds
 * cells 0 and 8 (the diagonal corners), the cracked centre completes the
 * line and X wins. The four lines through centre — top-bottom column,
 * left-right row, both diagonals — each become "two-in-a-row wins" for
 * either player.
 *
 * Hypothesis: removes the most-valuable cell while making lines through it
 * easier to complete, shifting opening play to the four mid-cross paths.
 * Players who learn to fork two of the four center-lines win quickly. May
 * give X a strong first-mover edge (worth measuring).
 */
export const CrackedCenter: Modifier = {
  id: 'cracked_center',
  name: 'Cracked Centre',
  category: 'topology',

  legalMoves: (defaultMoves) => defaultMoves.filter((c) => c !== 4),

  checkWin: (board, player) => {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      const ownsOrWild = (i: number) => i === 4 || board[i] === player;
      if (ownsOrWild(a) && ownsOrWild(b) && ownsOrWild(c)) {
        // Make sure the player owns at least 2 of the 3 cells (the third is the wild centre).
        // If the line doesn't pass through centre, this is just a normal 3-in-a-row check.
        const owns = [a, b, c].filter((i) => board[i] === player).length;
        if (owns >= 2) return line;
      }
    }
    return null;
  },
};
