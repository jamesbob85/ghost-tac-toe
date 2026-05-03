import { Board, GameState, Player } from '../../types/game';
import { MAX_MARKS, WIN_SCORE } from '../../constants/gameConfig';
import { checkWin as defaultCheckWin } from '../winDetector';
import { Modifier, Rng, findInCategory, validateAndOrder } from './types';
import { getCredits, spendCredits } from './blockCredits';

const defaultRng: Rng = () => Math.random();

/** Per-call options. `andThen` enables Double Stamp (costs `costCredits` of the resource modifier). */
export interface ApplyMoveOptions {
  andThen?: number;
  costCredits?: number;
}

export function createInitialStateWithModifiers(
  modifierList: Modifier[],
  rng: Rng = defaultRng,
): GameState {
  const ordered = validateAndOrder(modifierList);
  let board: Board = Array(9).fill(null);
  const modifierState: Record<string, unknown> = {};

  for (const m of ordered) {
    if (m.initState) modifierState[m.id] = m.initState(board, rng);
    if (m.initBoard) board = m.initBoard(board, modifierState[m.id], rng);
  }

  return {
    board,
    players: { X: { marks: [], score: 0 }, O: { marks: [], score: 0 } },
    currentPlayer: 'X',
    phase: 'playing',
    winner: null,
    winLine: null,
    turnNumber: 0,
    modifiers: ordered.map((m) => m.id),
    modifierState,
  };
}

export function getLegalMoves(state: GameState, modifiers: Modifier[]): number[] {
  let moves = state.board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
  const topology = findInCategory(modifiers, 'topology');
  if (topology?.legalMoves) {
    moves = topology.legalMoves(moves, state, state.modifierState[topology.id]);
  }
  return moves;
}

/**
 * Place a mark + run afterPlace hooks + eviction loop. Pure subroutine used
 * by applyMoveWithModifiers; runs once per "physical" placement (called
 * twice for Double Stamp).
 */
function placeMarkAndEvict(
  state: GameState,
  cell: number,
  ordered: Modifier[],
  rng: Rng,
): GameState {
  const player: Player = state.currentPlayer;
  const opponent: Player = player === 'X' ? 'O' : 'X';

  let workingState: GameState = {
    ...state,
    board: [...state.board],
    players: {
      ...state.players,
      [player]: {
        marks: [...state.players[player].marks, { index: cell, turn: state.turnNumber }],
        score: state.players[player].score,
      },
      [opponent]: { ...state.players[opponent] },
    },
    modifierState: { ...state.modifierState },
  };
  workingState.board[cell] = player;

  // afterPlace hooks
  for (const m of ordered) {
    if (m.afterPlace) {
      const result = m.afterPlace(workingState, cell, player, workingState.modifierState[m.id], rng);
      workingState = result.state;
      workingState = {
        ...workingState,
        modifierState: { ...workingState.modifierState, [m.id]: result.slice },
      };
    }
  }

  // Eviction loop
  const marksMod = findInCategory(ordered, 'marks');
  if (marksMod?.pickEviction) {
    while (true) {
      const max = marksMod.maxMarks
        ? marksMod.maxMarks(MAX_MARKS, workingState, workingState.modifierState[marksMod.id])
        : MAX_MARKS;
      const playerMarks = workingState.players[player].marks;
      if (playerMarks.length <= max) break;
      const evicted = marksMod.pickEviction(
        playerMarks,
        workingState,
        workingState.modifierState[marksMod.id],
      );
      const filteredMarks = playerMarks.filter((m) => m !== evicted);
      const newBoard = [...workingState.board];
      newBoard[evicted.index] = null;
      workingState = {
        ...workingState,
        board: newBoard,
        players: {
          ...workingState.players,
          [player]: { ...workingState.players[player], marks: filteredMarks },
        },
      };
    }
  }

  return workingState;
}

function checkWinForCurrent(
  state: GameState,
  ordered: Modifier[],
): readonly [number, number, number] | null {
  const winMod = findInCategory(ordered, 'winCondition');
  return winMod?.checkWin
    ? winMod.checkWin(state.board, state.currentPlayer, state, state.modifierState[winMod.id])
    : defaultCheckWin(state.board, state.currentPlayer);
}

function finalizeWin(
  state: GameState,
  winLine: readonly [number, number, number],
  ordered: Modifier[],
  startingTurn: number,
): GameState {
  const player: Player = state.currentPlayer;
  const scoringMod = findInCategory(ordered, 'scoring');
  const score = scoringMod?.scoreFor
    ? scoringMod.scoreFor(winLine, WIN_SCORE, state, state.modifierState[scoringMod.id])
    : WIN_SCORE;
  return {
    ...state,
    players: {
      ...state.players,
      [player]: { ...state.players[player], score: state.players[player].score + score },
    },
    phase: 'won',
    winner: player,
    winLine: [...winLine],
    turnNumber: startingTurn + 1,
  };
}

/**
 * Apply a move (with optional Double Stamp via `options.andThen`).
 * Place mark → afterPlace → eviction → win check; optionally repeat for
 * second placement; draw check; turn flip; afterTurn hooks.
 */
export function applyMoveWithModifiers(
  state: GameState,
  cellIndex: number,
  modifiers: Modifier[],
  rng: Rng = defaultRng,
  options?: ApplyMoveOptions,
): GameState {
  if (state.phase !== 'playing') return state;
  if (state.board[cellIndex] !== null) return state;
  const legal = getLegalMoves(state, modifiers);
  if (!legal.includes(cellIndex)) return state;

  const ordered = validateAndOrder(modifiers);
  const startingTurn = state.turnNumber;
  const player: Player = state.currentPlayer;
  const opponent: Player = player === 'X' ? 'O' : 'X';

  // ── First placement ──────────────────────────────────────────────
  let workingState = placeMarkAndEvict(state, cellIndex, ordered, rng);

  let winLine = checkWinForCurrent(workingState, ordered);
  if (winLine) return finalizeWin(workingState, winLine, ordered, startingTurn);

  // ── Optional Double Stamp ────────────────────────────────────────
  if (options?.andThen !== undefined && (options.costCredits ?? 0) > 0) {
    const legal2 = getLegalMoves(workingState, modifiers);
    if (
      legal2.includes(options.andThen) &&
      workingState.board[options.andThen] === null &&
      getCredits(workingState, player) >= (options.costCredits ?? 0)
    ) {
      workingState = placeMarkAndEvict(workingState, options.andThen, ordered, rng);
      workingState = spendCredits(workingState, player, options.costCredits ?? 0);

      winLine = checkWinForCurrent(workingState, ordered);
      if (winLine) return finalizeWin(workingState, winLine, ordered, startingTurn);
    }
  }

  // ── Draw check (only without an eviction modifier) ───────────────
  const marksMod = findInCategory(ordered, 'marks');
  if (!marksMod?.pickEviction && workingState.board.every((c) => c !== null)) {
    return {
      ...workingState,
      phase: 'draw',
      winner: null,
      winLine: null,
      turnNumber: startingTurn + 1,
    };
  }

  // ── Turn flip ────────────────────────────────────────────────────
  const turnMod = findInCategory(ordered, 'turns');
  let nextPlayer: Player = opponent;
  if (turnMod?.nextPlayer) {
    const result = turnMod.nextPlayer(player, workingState, workingState.modifierState[turnMod.id]);
    nextPlayer = result.player;
    workingState = {
      ...workingState,
      modifierState: { ...workingState.modifierState, [turnMod.id]: result.slice },
    };
  }

  // ── afterTurn hooks ──────────────────────────────────────────────
  let newModState = { ...workingState.modifierState };
  for (const m of ordered) {
    if (m.afterTurn) {
      newModState[m.id] = m.afterTurn(workingState, cellIndex, newModState[m.id], rng);
    }
  }

  return {
    ...workingState,
    currentPlayer: nextPlayer,
    turnNumber: startingTurn + 1,
    modifierState: newModState,
  };
}
