import { GameState, Player } from '../../src/types/game';
import { applyMove, createInitialState } from '../../src/engine/gameEngine';
import { DOUBLE_STAMP_COST } from '../../src/engine/modifiers/blockCredits';
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

  let state: GameState = createInitialState(opts.modifiers, rng);
  const moves: MoveLogEntry[] = [];

  while (state.phase === 'playing' && state.turnNumber < maxTurns) {
    const player = state.currentPlayer;
    const strategy = player === 'X' ? xStrategy : oStrategy;
    const move = strategy.pickMove(state, player, rng);

    const cell = typeof move === 'number' ? move : move.cell;
    const andThen = typeof move === 'number' ? undefined : move.doubleStamp;

    if (cell < 0 || state.board[cell] !== null) {
      break;
    }

    moves.push({ turn: state.turnNumber, player, cell });
    state = applyMove(state, cell, rng, {
      andThen,
      costCredits: andThen !== undefined ? DOUBLE_STAMP_COST : undefined,
    });
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
