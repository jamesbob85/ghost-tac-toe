import { Modifier } from './types';

/**
 * Inverted Possession — eviction takes the NEWEST mark, not the oldest.
 * Same queue size (3) as standard Ghost Eviction but flipped pickEviction.
 *
 * Hypothesis: punishes greedy placement — your most recent move is the one
 * about to vanish. Forces longer-term thinking about which existing marks to
 * preserve. Could collapse to "the last placed mark is meaningless," in
 * which case fun score will tank.
 */
export const InvertedPossession: Modifier = {
  id: 'inverted_possession',
  name: 'Inverted Possession',
  category: 'marks',
  pickEviction: (marks) => marks[marks.length - 1],
  maxMarks: () => 3,
};
