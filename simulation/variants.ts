import { MatchOptions } from './runners/singleMatch';

export interface Variant {
  id: string;
  name: string;
  description: string;
  /** Build base MatchOptions for this variant (seed is added per-match) */
  matchOptions: Omit<MatchOptions, 'seed'>;
}

export const VARIANTS: Record<string, Variant> = {
  vanilla_ttt: {
    id: 'vanilla_ttt',
    name: 'Vanilla TTT',
    description: 'Standard 3×3 tic-tac-toe (no modifiers). Solved baseline.',
    matchOptions: {
      modifiers: [],
      maxTurns: 9,
    },
  },
  ghost_only: {
    id: 'ghost_only',
    name: 'Ghost Only',
    description: 'Ghost eviction modifier active; nothing else.',
    matchOptions: {
      modifiers: ['ghost_eviction'],
      maxTurns: 60,
    },
  },
  ghost_chaos: {
    id: 'ghost_chaos',
    name: 'Ghost + Chaos',
    description: 'Ghost eviction with the Chaos Cell scoring modifier.',
    matchOptions: {
      modifiers: ['ghost_eviction', 'chaos_cell'],
      maxTurns: 60,
    },
  },
};

export const PHASE_0_VARIANTS: Variant[] = [
  VARIANTS.vanilla_ttt,
  VARIANTS.ghost_only,
];
