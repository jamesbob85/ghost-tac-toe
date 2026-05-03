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
  // ─── Phase 1: marks-category alternatives ───────────────────────
  quick_ink: {
    id: 'quick_ink',
    name: 'Quick Ink',
    description: 'Marks queue size 2 (FIFO eviction every other turn).',
    matchOptions: {
      modifiers: ['quick_ink'],
      maxTurns: 60,
    },
  },
  slow_ink: {
    id: 'slow_ink',
    name: 'Slow Ink',
    description: 'Marks queue size 4 (more crowded board).',
    matchOptions: {
      modifiers: ['slow_ink'],
      maxTurns: 60,
    },
  },
  inverted: {
    id: 'inverted',
    name: 'Inverted Possession',
    description: 'Eviction takes the newest mark instead of the oldest.',
    matchOptions: {
      modifiers: ['inverted_possession'],
      maxTurns: 60,
    },
  },
  mirror: {
    id: 'mirror',
    name: 'Mirror',
    description: 'Each placement also stamps the diagonally opposite cell.',
    matchOptions: {
      modifiers: ['mirror'],
      maxTurns: 60,
    },
  },
};

export const PHASE_0_VARIANTS: Variant[] = [
  VARIANTS.vanilla_ttt,
  VARIANTS.ghost_only,
];

/** Phase 1 batch: ghost baseline + 4 marks-category alternatives */
export const PHASE_1_MARKS_VARIANTS: Variant[] = [
  VARIANTS.ghost_only,
  VARIANTS.quick_ink,
  VARIANTS.slow_ink,
  VARIANTS.inverted,
  VARIANTS.mirror,
];
