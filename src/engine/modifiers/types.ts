import { Board, GameState, MarkEntry, Player } from '../../types/game';

/**
 * Categories. At most ONE modifier per category may be active in a game
 * (enforced by composeModifiers). Daily editions are typically (1 to 3) modifiers,
 * each from a different category.
 */
export type ModifierCategory =
  | 'topology'      // changes the board / legal cells
  | 'marks'         // changes mark queue behavior (eviction, max marks, side effects on place)
  | 'turns'         // changes turn flow (extra moves, skipped first move)
  | 'winCondition'  // changes what counts as winning
  | 'visibility'    // changes information available to players
  | 'scoring'       // changes the score awarded for a win
  | 'resource';     // changes the powerup currency / energy economy

export const CATEGORY_ORDER: ModifierCategory[] = [
  'topology',
  'marks',
  'turns',
  'winCondition',
  'visibility',
  'scoring',
  'resource',
];

/** A unique modifier identifier, e.g. 'ghost_eviction' */
export type ModifierId = string;

/** Per-modifier state; stored on GameState.modifierState[modifier.id] */
export type ModifierSlice = unknown;

export interface Modifier {
  id: ModifierId;
  name: string;
  category: ModifierCategory;

  /** Returns the initial slice of state owned by this modifier. */
  initState?: (board: Board) => ModifierSlice;

  /** Transform the starting board (e.g., Smudge blocks a cell). */
  initBoard?: (board: Board, slice: ModifierSlice) => Board;

  /** Restrict legal moves. Receives default empties, returns filtered list. */
  legalMoves?: (defaultMoves: number[], state: GameState, slice: ModifierSlice) => number[];

  /** Override the max-marks threshold (default MAX_MARKS = 3). */
  maxMarks?: (defaultMax: number, state: GameState, slice: ModifierSlice) => number;

  /**
   * Run after a mark is placed but before eviction/win check.
   * Can mutate board, marks, scores, modifierState.
   */
  afterPlace?: (state: GameState, cell: number, player: Player, slice: ModifierSlice) =>
    { state: GameState; slice: ModifierSlice };

  /**
   * Pick which of the player's marks to evict when eviction triggers.
   * Default = marks[0] (FIFO oldest). The PRESENCE of a marks-category
   * modifier with pickEviction enables eviction at all; without one, marks
   * never evict (vanilla TTT behavior).
   */
  pickEviction?: (marks: MarkEntry[], state: GameState, slice: ModifierSlice) => MarkEntry;

  /** Override standard 3-in-a-row win detection. Returns winning line or null. */
  checkWin?: (board: Board, player: Player, state: GameState, slice: ModifierSlice) =>
    readonly [number, number, number] | null;

  /** Inverts/multiplies the score for a win. Receives default, returns final. */
  scoreFor?: (winLine: readonly [number, number, number], defaultScore: number, state: GameState, slice: ModifierSlice) => number;

  /** Choose the next player (default = opposite). Two Hands keeps the same player for the second placement. */
  nextPlayer?: (currentPlayer: Player, state: GameState, slice: ModifierSlice) =>
    { player: Player; slice: ModifierSlice };

  /** End-of-turn updates after the player has been chosen (e.g., chaos cell rotates). */
  afterTurn?: (state: GameState, prevCell: number, slice: ModifierSlice) => ModifierSlice;
}

/**
 * Validate a list of modifiers: throws if two share a category.
 * Returns them in canonical CATEGORY_ORDER for deterministic pipeline runs.
 */
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
