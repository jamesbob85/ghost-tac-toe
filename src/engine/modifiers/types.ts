import { Board, GameState, MarkEntry, Player } from '../../types/game';

/**
 * Categories. At most ONE modifier per category may be active in a game
 * (enforced by composeModifiers). Daily editions are typically (1 to 3) modifiers,
 * each from a different category.
 */
export type ModifierCategory =
  | 'topology'
  | 'marks'
  | 'turns'
  | 'winCondition'
  | 'visibility'
  | 'scoring'
  | 'resource';

export const CATEGORY_ORDER: ModifierCategory[] = [
  'topology',
  'marks',
  'turns',
  'winCondition',
  'visibility',
  'scoring',
  'resource',
];

export type ModifierId = string;
export type ModifierSlice = unknown;

/**
 * Pure pseudo-random number generator: returns floats in [0, 1).
 * Pass a seeded one (mulberry32) from simulation; falls back to Math.random in the live game.
 */
export type Rng = () => number;

export interface Modifier {
  id: ModifierId;
  name: string;
  category: ModifierCategory;

  initState?: (board: Board, rng: Rng) => ModifierSlice;
  initBoard?: (board: Board, slice: ModifierSlice, rng: Rng) => Board;
  legalMoves?: (defaultMoves: number[], state: GameState, slice: ModifierSlice) => number[];
  maxMarks?: (defaultMax: number, state: GameState, slice: ModifierSlice) => number;

  afterPlace?: (state: GameState, cell: number, player: Player, slice: ModifierSlice, rng: Rng) =>
    { state: GameState; slice: ModifierSlice };

  pickEviction?: (marks: MarkEntry[], state: GameState, slice: ModifierSlice) => MarkEntry;
  checkWin?: (board: Board, player: Player, state: GameState, slice: ModifierSlice) =>
    readonly [number, number, number] | null;
  scoreFor?: (winLine: readonly [number, number, number], defaultScore: number, state: GameState, slice: ModifierSlice) => number;

  nextPlayer?: (currentPlayer: Player, state: GameState, slice: ModifierSlice) =>
    { player: Player; slice: ModifierSlice };

  afterTurn?: (state: GameState, prevCell: number, slice: ModifierSlice, rng: Rng) => ModifierSlice;
}

export function validateAndOrder(modifiers: Modifier[]): Modifier[] {
  const seen = new Set<ModifierCategory>();
  for (const m of modifiers) {
    if (seen.has(m.category)) {
      throw new Error(`Two modifiers share category "${m.category}": only one per category allowed`);
    }
    seen.add(m.category);
  }
  return [...modifiers].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
}

export function findInCategory(
  modifiers: Modifier[],
  category: ModifierCategory,
): Modifier | undefined {
  return modifiers.find((m) => m.category === category);
}
