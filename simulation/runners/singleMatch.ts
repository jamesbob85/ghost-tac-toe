import { GameState, Player } from '../../src/types/game';
import { applyMove, createInitialState } from '../../src/engine/gameEngine';
import { Strategy, mulberry32 } from '../strategies/types';

export interface MatchOptions {
  /** Modifier ids active for this match. Empty = vanilla TTT. */
  modifiers: string[];
  /** Hard cap on turns to prevent infinite ghost-mode loops */
  maxTurns?: number;
  /** Deterministic seed for tie-breaking RNG */
  seed: number;
}

export interface MoveLogEntry {
  turn: number;
  player: Player;
  cell: number;
}

export interface MatchResult {
  xId: string;
  oId: string;
  winner: Player | null;
  hitTurnCap: boolean;
  turns: number;
  moves: MoveLogEntry[];
  variant: string;
}

/**
 * Play one game between two strategies. Pure: deterministic given the seed.
 */
export function playMatch(
  xStrategy: Strategy,
  oStrategy: Strategy,
  variant: string,
  opts: MatchOptions,
): MatchResult {
  const rng = mulberry32(opts.seed);
  const maxTurns = opts.maxTurns ?? 60;

  let state: GameState = createInitialState(opts.modifiers);
  const moves: MoveLogEntry[] = [];

  while (state.phase === 'playing' && state.turnNumber < maxTurns) {
    const player = state.currentPlayer;
    const strategy = player === 'X' ? xStrategy : oStrategy;
    const cell = strategy.pickMove(state, player, rng);

    if (cell < 0 || state.board[cell] !== null) {
      // Strategy returned an illegal move — bail safely
      break;
    }

    moves.push({ turn: state.turnNumber, player, cell });
    state = applyMove(state, cell);
  }

  const hitTurnCap = state.phase === 'playing' && state.turnNumber >= maxTurns;

  return {
    xId: xStrategy.id,
    oId: oStrategy.id,
    winner: state.winner,
    hitTurnCap,
    turns: state.turnNumber,
    moves,
    variant,
  };
}
