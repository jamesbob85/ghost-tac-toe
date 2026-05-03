export { RandomStrategy } from './random';
export { GreedyStrategy } from './greedy';
export {
  Lookahead2,
  Lookahead4,
  MinimaxFull,
  MinimaxDeep,
  makeMinimaxStrategy,
} from './minimax';

import { RandomStrategy } from './random';
import { GreedyStrategy } from './greedy';
import { Lookahead2, Lookahead4, MinimaxFull } from './minimax';
import type { Strategy } from './types';

/** Default Phase 0 strength tier — ordered weakest → strongest */
export const PHASE_0_STRATEGIES: Strategy[] = [
  RandomStrategy,
  GreedyStrategy,
  Lookahead2,
  Lookahead4,
  MinimaxFull,
];
