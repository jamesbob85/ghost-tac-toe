import { GameState, Player } from '../../src/types/game';
import { applyMove, getEmptyCells } from '../../src/engine/gameEngine';
import { Strategy, pickRandom } from './types';

const CENTER = [4];
const CORNERS = [0, 2, 6, 8];
const EDGES = [1, 3, 5, 7];

/**
 * Greedy: take a winning move if available, block an opponent winning move,
 * otherwise prefer center → corners → edges (random within tier).
 */
export const GreedyStrategy: Strategy = {
  id: 'greedy',
  name: 'Greedy',
  rank: 2,
  pickMove(state: GameState, me: Player, rng) {
    const empties = getEmptyCells(state.board);
    const opp: Player = me === 'X' ? 'O' : 'X';

    // 1. Take an immediate win
    for (const cell of empties) {
      const next = applyMove(state, cell);
      if (next.phase === 'won' && next.winner === me) return cell;
    }

    // 2. Block an opponent immediate win.
    // Construct a hypothetical "opponent's turn" state from the same board.
    const oppTurn: GameState = { ...state, currentPlayer: opp };
    for (const cell of empties) {
      const next = applyMove(oppTurn, cell);
      if (next.phase === 'won' && next.winner === opp) return cell;
    }

    // 3. Strategic — center > corners > edges
    for (const tier of [CENTER, CORNERS, EDGES]) {
      const avail = tier.filter((i) => empties.includes(i));
      if (avail.length > 0) return pickRandom(avail, rng);
    }
    return empties[0];
  },
};
