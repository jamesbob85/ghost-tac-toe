import { Modifier } from './types';

/**
 * Slow Ink — queue size 4 (max marks per player). One extra mark stays on the
 * board longer; FIFO oldest. Replaces standard Ghost Eviction (same category).
 *
 * Hypothesis: more crowded board, fewer eviction events, longer-lasting
 * threats. May tip back toward "solved" because more marks = closer to
 * vanilla TTT (with room for 4 each = 8 of 9 cells filled).
 */
export const SlowInk: Modifier = {
  id: 'slow_ink',
  name: 'Slow Ink',
  category: 'marks',
  pickEviction: (marks) => marks[0],
  maxMarks: () => 4,
};
