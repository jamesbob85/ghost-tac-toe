import { GameState, Player, Board, MarkEntry } from '../types/game';
import { MAX_MARKS, BOARD_SIZE, CHAOS_BONUS_SCORE, WIN_SCORE } from '../constants/gameConfig';
import { checkWin, isBoardFull } from './winDetector';

// ─── Initial State Factory ────────────────────────────────────────────────────

export function createInitialState(
  ghostMode: boolean,
  chaosMode: boolean,
): GameState {
  return {
    board: Array(BOARD_SIZE).fill(null) as Board,
    players: {
      X: { marks: [], score: 0 },
      O: { marks: [], score: 0 },
    },
    currentPlayer: 'X',
    phase: 'playing',
    winner: null,
    winLine: null,
    turnNumber: 0,
    chaosCell: chaosMode ? randomEmptyCell(Array(BOARD_SIZE).fill(null) as Board) : null,
    ghostMode,
    chaosMode,
  };
}

// ─── Core Reducer ─────────────────────────────────────────────────────────────

/**
 * Pure reducer — applies a move and returns the new state.
 * Does NOT mutate the input state.
 */
export function applyMove(state: GameState, cellIndex: number): GameState {
  // Guard: only allow moves during 'playing' phase on empty cells
  if (state.phase !== 'playing') return state;
  if (state.board[cellIndex] !== null) return state;

  const player: Player = state.currentPlayer;
  const opponent: Player = player === 'X' ? 'O' : 'X';

  // Deep-clone only what we'll mutate
  const newBoard: Board = [...state.board];
  const newPlayerState = {
    marks: [...state.players[player].marks],
    score: state.players[player].score,
  };
  const opponentState = { ...state.players[opponent] };

  // ── 1. Place the mark ───────────────────────────────────────────────────────
  newBoard[cellIndex] = player;
  const newEntry: MarkEntry = { index: cellIndex, turn: state.turnNumber };
  newPlayerState.marks = [...newPlayerState.marks, newEntry];

  // ── 2. Ghost Eviction (FIFO) ────────────────────────────────────────────────
  let evictedIndex: number | null = null;
  if (state.ghostMode && newPlayerState.marks.length > MAX_MARKS) {
    const oldest = newPlayerState.marks[0];
    evictedIndex = oldest.index;
    newBoard[oldest.index] = null;
    newPlayerState.marks = newPlayerState.marks.slice(1); // remove oldest
  }

  // ── 3. Win Check (after eviction so evicted marks don't count) ─────────────
  const winLine = checkWin(newBoard, player);

  if (winLine) {
    // Determine score: bonus if win line passes through chaos cell
    const throughChaos =
      state.chaosMode &&
      state.chaosCell !== null &&
      winLine.includes(state.chaosCell);
    const scoreGain = throughChaos ? CHAOS_BONUS_SCORE : WIN_SCORE;

    return {
      ...state,
      board: newBoard,
      players: {
        ...state.players,
        [player]: { ...newPlayerState, score: newPlayerState.score + scoreGain },
        [opponent]: opponentState,
      },
      phase: 'won',
      winner: player,
      winLine,
      turnNumber: state.turnNumber + 1,
      chaosCell: null,
    };
  }

  // ── 4. Draw Check ───────────────────────────────────────────────────────────
  // In ghost mode a true draw is extremely rare, but handle it:
  // draw if board full and no winner
  if (!state.ghostMode && isBoardFull(newBoard)) {
    return {
      ...state,
      board: newBoard,
      players: {
        ...state.players,
        [player]: newPlayerState,
        [opponent]: opponentState,
      },
      phase: 'draw',
      winner: null,
      winLine: null,
      turnNumber: state.turnNumber + 1,
      chaosCell: null,
    };
  }

  // ── 5. Advance turn ─────────────────────────────────────────────────────────
  const nextTurn = state.turnNumber + 1;
  const nextChaosCell =
    state.chaosMode ? randomEmptyCell(newBoard, cellIndex) : null;

  return {
    ...state,
    board: newBoard,
    players: {
      ...state.players,
      [player]: newPlayerState,
      [opponent]: opponentState,
    },
    currentPlayer: opponent,
    phase: 'playing',
    winner: null,
    winLine: null,
    turnNumber: nextTurn,
    chaosCell: nextChaosCell,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get all empty cell indices on the board */
export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

/** Pick a random empty cell, optionally excluding a specific index */
function randomEmptyCell(board: Board, exclude?: number): number | null {
  const empty = getEmptyCells(board).filter((i) => i !== exclude);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

/** Reset scores but keep mode settings */
export function resetScores(state: GameState): GameState {
  return {
    ...state,
    players: {
      X: { ...state.players.X, score: 0 },
      O: { ...state.players.O, score: 0 },
    },
  };
}
