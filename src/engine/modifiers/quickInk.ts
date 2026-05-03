import { Modifier } from './types';

/**
 * Quick Ink — queue size 2 (max marks per player). Eviction triggers every
 * other turn; FIFO oldest. Replaces standard Ghost Eviction (same category).
 *
 * Hypothesis: faster eviction = more dynamic board, but may compress decision
 * space too aggressively.
 */
export const QuickInk: Modifier = {
  id: 'quick_ink',
  name: 'Quick Ink',
  category: 'marks',
  pickEviction: (marks) => marks[0],
  maxMarks: () => 2,
};
