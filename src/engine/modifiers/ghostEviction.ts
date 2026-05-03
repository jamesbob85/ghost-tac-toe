import { Modifier } from './types';

/**
 * Ghost Eviction — the core mechanic.
 *
 * Each player can hold at most MAX_MARKS marks (default 3). Placing a 4th
 * evicts the oldest, FIFO. The presence of this modifier is what enables
 * eviction at all — a game with no marks-category modifier accumulates marks
 * forever (vanilla tic-tac-toe behavior).
 */
export const GhostEviction: Modifier = {
  id: 'ghost_eviction',
  name: 'Ghost Eviction',
  category: 'marks',
  pickEviction: (marks) => marks[0],
};
