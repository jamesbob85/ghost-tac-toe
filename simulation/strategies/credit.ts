import { GameState, Player } from '../../src/types/game';
import { applyMove, getLegalMoves } from '../../src/engine/gameEngine';
import {
  DOUBLE_STAMP_COST,
  getCredits,
} from '../../src/engine/modifiers/blockCredits';
import { Strategy, Move, pickRandom } from './types';

const CENTER = [4];
const CORNERS = [0, 2, 6, 8];
const EDGES = [1, 3, 5, 7];

/** Greedy single-move pick, used as a fallback by all credit strategies. */
function greedyCell(state: GameState, me: Player, rng: () => number): number {
  const empties = getLegalMoves(state);
  const opp: Player = me === 'X' ? 'O' : 'X';

  // 1. Take an immediate win
  for (const cell of empties) {
    const next = applyMove(state, cell);
    if (next.phase === 'won' && next.winner === me) return cell;
  }

  // 2. Block opponent's immediate win
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
}

/**
 * PowerupSpammer — uses Double Stamp the moment they can afford it.
 * First placement: greedy. Second placement: greedy on the resulting state.
 *
 * Tests "is rushing powerups dominant?" — if Spammer beats MinimaxFull on
 * Block Credits variants, the powerup is too cheap or too strong.
 */
export const PowerupSpammer: Strategy = {
  id: 'powerup_spammer',
  name: 'Powerup Spammer',
  rank: 3,
  pickMove(state, me, rng): Move {
    const empties = getLegalMoves(state);
    if (empties.length === 0) return -1;

    const credits = getCredits(state, me);
    const firstCell = greedyCell(state, me, rng);

    if (credits >= DOUBLE_STAMP_COST) {
      // Simulate first placement, then greedy from there
      const after = applyMove(state, firstCell, rng);
      if (after.phase === 'playing') {
        const empties2 = getLegalMoves(after);
        if (empties2.length > 0) {
          const secondCell = greedyCell(after, me, rng);
          return { cell: firstCell, doubleStamp: secondCell };
        }
      }
    }

    return firstCell;
  },
};

/**
 * PowerupHoarder — never deploys. Plays standard greedy. Acts as the
 * baseline for "what if you ignore the powerup layer entirely?"
 *
 * Distinct from MinimaxFull because it's a weaker spatial player — the
 * comparison vs Spammer/Balanced isolates the value of the powerup itself,
 * not depth of search.
 */
export const PowerupHoarder: Strategy = {
  id: 'powerup_hoarder',
  name: 'Powerup Hoarder',
  rank: 2,
  pickMove(state, me, rng): Move {
    return greedyCell(state, me, rng);
  },
};

/**
 * PowerupBalanced — deploys Double Stamp ONLY if the second placement
 * completes a winning line. Otherwise plays greedy. Tests "is the powerup
 * useful when used surgically?"
 */
export const PowerupBalanced: Strategy = {
  id: 'powerup_balanced',
  name: 'Powerup Balanced',
  rank: 4,
  pickMove(state, me, rng): Move {
    const empties = getLegalMoves(state);
    if (empties.length === 0) return -1;

    const credits = getCredits(state, me);

    // If we can afford it, look for a (cell1, cell2) pair that wins this turn
    if (credits >= DOUBLE_STAMP_COST) {
      for (const c1 of empties) {
        const after1 = applyMove(state, c1, rng);
        if (after1.phase === 'won' && after1.winner === me) {
          // First mark already wins — no need for double stamp
          return c1;
        }
        if (after1.phase !== 'playing') continue;
        const empties2 = getLegalMoves(after1);
        for (const c2 of empties2) {
          const after2 = applyMove(after1, c2, rng);
          if (after2.phase === 'won' && after2.winner === me) {
            return { cell: c1, doubleStamp: c2 };
          }
        }
      }
    }

    return greedyCell(state, me, rng);
  },
};
