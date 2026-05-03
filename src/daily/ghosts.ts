/**
 * The roster of ghosts. Each daily edition pairs one ghost with a modifier
 * set; for now we ship a single ghost as the always-on antagonist while the
 * full daily seed system is being built.
 */
import { Difficulty } from '../types/game';

export interface Ghost {
  id: string;
  /** Headline name — "The Wailing Cartographer" */
  name: string;
  /** One italic line, dramatic — "His maps end where the cliffs begin." */
  epithet: string;
  /** A short flavor paragraph in newspaper voice */
  flavor: string;
  /** Inherent strength — players don't pick difficulty; it's the ghost's */
  difficulty: Difficulty;
}

export const GHOSTS: Ghost[] = [
  {
    id: 'wailing_cartographer',
    name: 'The Wailing Cartographer',
    epithet: 'His maps end where the cliffs begin.',
    flavor:
      'A surveyor lost his mind charting the coast in 1887. He still draws — in chalk, on the parlour walls — and weeps when the lines do not connect. He favours the corners.',
    difficulty: 'medium',
  },
  {
    id: 'mrs_plumtree',
    name: 'Mrs. Plumtree',
    epithet: 'She would rather you didn’t, dear.',
    flavor:
      'A reluctant hostess who haunts a Yorkshire B&B, blocking guests from leaving by simply standing in doorways. Polite to a fault. Defensive to the core.',
    difficulty: 'medium',
  },
];

/**
 * The ghost of the day. For now: rotates by date but doesn't yet pull from a
 * seeded daily edition. Phase 2 will route this through the daily seed picker.
 */
export function getTodaysGhost(): Ghost {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  return GHOSTS[dayOfYear % GHOSTS.length];
}

export function getGhostById(id: string): Ghost | undefined {
  return GHOSTS.find((g) => g.id === id);
}
