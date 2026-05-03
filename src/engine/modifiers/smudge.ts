import { Modifier } from './types';

interface SmudgeSlice {
  cell: number;
}

/**
 * Smudge — one random cell, picked at game start, is permanently blocked.
 * No player can stamp there; no win line passes through it (because it's
 * never a marked cell of any player, the standard 3-in-a-row check skips it
 * naturally).
 *
 * Deterministic when given a seeded RNG (sim) or random in live play.
 *
 * Hypothesis: removing 1/9 of the board mostly preserves play but should
 * eliminate the X-corner-opening dominant line in vanilla TTT — fewer
 * symmetric wins, more board-aware play. Eviction handles the reduced
 * placement space gracefully.
 */
export const Smudge: Modifier = {
  id: 'smudge',
  name: 'The Smudge',
  category: 'topology',

  initState: (_board, rng) => ({ cell: Math.floor(rng() * 9) }) as SmudgeSlice,

  legalMoves: (defaultMoves, _state, slice) => {
    const s = slice as SmudgeSlice;
    return defaultMoves.filter((c) => c !== s.cell);
  },
};
