export { RandomStrategy } from './random';
export { GreedyStrategy } from './greedy';
export {
  Lookahead2,
  Lookahead4,
  MinimaxFull,
  MinimaxDeep,
  makeMinimaxStrategy,
} from './minimax';
export { PowerupHoarder, PowerupSpammer, PowerupBalanced } from './credit';

import { RandomStrategy } from './random';
import { GreedyStrategy } from './greedy';
import { Lookahead2, Lookahead4, MinimaxFull } from './minimax';
import { PowerupHoarder, PowerupSpammer, PowerupBalanced } from './credit';
import type { Strategy } from './types';

/** Default Phase 0 strength tier — ordered weakest → strongest */
export const PHASE_0_STRATEGIES: Strategy[] = [
  RandomStrategy,
  GreedyStrategy,
  Lookahead2,
  Lookahead4,
  MinimaxFull,
];

/**
 * Resource-test strategy mix — combines spatial-strength tier with the
 * credit-aware variants. Use with Block Credits variants to test whether
 * powerup deployment changes outcomes.
 */
export const RESOURCE_STRATEGIES: Strategy[] = [
  RandomStrategy,
  GreedyStrategy,
  Lookahead4,
  MinimaxFull,
  PowerupHoarder,
  PowerupBalanced,
  PowerupSpammer,
];
