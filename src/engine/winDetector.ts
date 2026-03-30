import { Board, Player } from '../types/game';
import { WIN_LINES } from '../constants/gameConfig';

/**
 * Check if a player has won on the given board.
 * Returns the winning line [i, j, k] or null.
 */
export function checkWin(board: Board, player: Player): [number, number, number] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] === player && board[b] === player && board[c] === player) {
      return line;
    }
  }
  return null;
}

/**
 * Returns true if the board is completely full (no empty cells).
 */
export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}
