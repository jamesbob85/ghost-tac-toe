import { GameState, Player } from '../../src/types/game';
import { getEmptyCells } from '../../src/engine/gameEngine';
import { Strategy, pickRandom } from './types';

export const RandomStrategy: Strategy = {
  id: 'random',
  name: 'Random',
  rank: 1,
  pickMove(state: GameState, _me: Player, rng) {
    return pickRandom(getEmptyCells(state.board), rng);
  },
};
