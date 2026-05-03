import { Board, GameState, Player } from '../../types/game';
import { MAX_MARKS, WIN_SCORE } from '../../constants/gameConfig';
import { checkWin as defaultCheckWin } from '../winDetector';
import { Modifier, Rng, findInCategory, validateAndOrder } from './types';

const defaultRng: Rng = () => Math.random();

/**
 * Build the initial GameState given an active modifier list.
 * Calls each modifier's initState (to seed its slice) and initBoard (to mutate
 * the starting board) in CATEGORY_ORDER.
 */
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
 * Apply a move: place mark → run afterPlace hooks → eviction → win check →
 * scoring → turn flip → afterTurn hooks. Pure: returns a new state.
 */
export function applyMoveWithModifiers(
  state: GameState,
  cellIndex: number,
  modifiers: Modifier[],
  rng: Rng = defaultRng,
): GameState {
  if (state.phase !== 'playing') return state;
  if (state.board[cellIndex] !== null) return state;
  const legal = getLegalMoves(state, modifiers);
  if (!legal.includes(cellIndex)) return state;

  const ordered = validateAndOrder(modifiers);
  const player: Player = state.currentPlayer;
  const opponent: Player = player === 'X' ? 'O' : 'X';

  // ── 1. Place mark ────────────────────────────────────────────────
  let workingState: GameState = {
    ...state,
    board: [...state.board],
    players: {
      ...state.players,
      [player]: {
        marks: [...state.players[player].marks, { index: cellIndex, turn: state.turnNumber }],
        score: state.players[player].score,
      },
      [opponent]: { ...state.players[opponent] },
    },
    modifierState: { ...state.modifierState },
  };
  workingState.board[cellIndex] = player;

  // ── 2. afterPlace hooks (Mirror, Block Credits, etc.) ────────────
  for (const m of ordered) {
    if (m.afterPlace) {
      const result = m.afterPlace(workingState, cellIndex, player, workingState.modifierState[m.id], rng);
      workingState = result.state;
      workingState = {
        ...workingState,
        modifierState: { ...workingState.modifierState, [m.id]: result.slice },
      };
    }
  }

  // ── 3. Eviction loop ────────────────────────────────────────────
  // Loops in case afterPlace added multiple marks (e.g., Mirror puts the queue at +2).
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

  // ── 4. Win check ────────────────────────────────────────────────
  const winMod = findInCategory(ordered, 'winCondition');
  const winLine = winMod?.checkWin
    ? winMod.checkWin(workingState.board, player, workingState, workingState.modifierState[winMod.id])
    : defaultCheckWin(workingState.board, player);

  if (winLine) {
    const scoringMod = findInCategory(ordered, 'scoring');
    const score = scoringMod?.scoreFor
      ? scoringMod.scoreFor(winLine, WIN_SCORE, workingState, workingState.modifierState[scoringMod.id])
      : WIN_SCORE;

    return {
      ...workingState,
      players: {
        ...workingState.players,
        [player]: {
          ...workingState.players[player],
          score: workingState.players[player].score + score,
        },
      },
      phase: 'won',
      winner: player,
      winLine: [...winLine],
      turnNumber: state.turnNumber + 1,
    };
  }

  // ── 5. Draw check (only without an eviction modifier) ───────────
  if (!marksMod?.pickEviction && workingState.board.every((c) => c !== null)) {
    return {
      ...workingState,
      phase: 'draw',
      winner: null,
      winLine: null,
      turnNumber: state.turnNumber + 1,
    };
  }

  // ── 6. Turn flip ────────────────────────────────────────────────
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

  // ── 7. afterTurn hooks (chaos rotation, etc.) ───────────────────
  let newModState = { ...workingState.modifierState };
  for (const m of ordered) {
    if (m.afterTurn) {
      newModState[m.id] = m.afterTurn(workingState, cellIndex, newModState[m.id], rng);
    }
  }

  return {
    ...workingState,
    currentPlayer: nextPlayer,
    turnNumber: state.turnNumber + 1,
    modifierState: newModState,
  };
}
