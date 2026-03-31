export type Player = 'X' | 'O';
export type CellValue = Player | null;
export type Board = CellValue[]; // length 9, indices 0-8

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'ai' | 'friend' | 'online';

export interface MarkEntry {
  index: number; // board cell index (0-8)
  turn: number;  // global turn number for FIFO ordering
}

export interface PlayerState {
  marks: MarkEntry[]; // max MAX_MARKS entries, oldest first (index 0)
  score: number;
}

export type GamePhase = 'playing' | 'won' | 'draw';

export interface GameState {
  board: Board;
  players: { X: PlayerState; O: PlayerState };
  currentPlayer: Player;
  phase: GamePhase;
  winner: Player | null;
  winLine: number[] | null; // cell indices of winning cells
  turnNumber: number;
  chaosCell: number | null; // for Chaos Mode bonus
  ghostMode: boolean;
  chaosMode: boolean;
}

export interface GameSettings {
  mode: GameMode;
  difficulty: Difficulty;
  ghostMode: boolean;
  chaosMode: boolean;
}

export interface AppStats {
  ai: {
    easy: { wins: number; losses: number; draws: number };
    medium: { wins: number; losses: number; draws: number };
    hard: { wins: number; losses: number; draws: number };
  };
  friend: { wins: number; losses: number; draws: number };
  totalGames: number;
  winStreak: number;
  bestWinStreak: number;
}
