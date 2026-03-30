/** Maximum number of marks a player can have on the board at once in Ghost Mode */
export const MAX_MARKS = 3;

/** Board size (always 3x3 = 9 cells) */
export const BOARD_SIZE = 9;

/** All 8 winning lines as cell index triples */
export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left col
  [1, 4, 7], // middle col
  [2, 5, 8], // right col
  [0, 4, 8], // diagonal TL-BR
  [2, 4, 6], // diagonal TR-BL
];

/** Artificial AI "thinking" delay in ms */
export const AI_THINK_DELAY_MS = 500;

/** Chaos Mode bonus score for winning through the chaos cell */
export const CHAOS_BONUS_SCORE = 2;

/** Normal win score */
export const WIN_SCORE = 1;
