import { Modifier } from './types';
import { GhostEviction } from './ghostEviction';
import { ChaosCell } from './chaosCell';
import { QuickInk } from './quickInk';
import { SlowInk } from './slowInk';
import { InvertedPossession } from './invertedPossession';
import { Mirror } from './mirror';
import { Smudge } from './smudge';
import { CrackedCenter } from './crackedCenter';
import { BlockCredits } from './blockCredits';

/** All known modifiers, keyed by id. The simulation and engine consult this. */
export const MODIFIER_REGISTRY: Record<string, Modifier> = {
  [GhostEviction.id]: GhostEviction,
  [ChaosCell.id]: ChaosCell,
  [QuickInk.id]: QuickInk,
  [SlowInk.id]: SlowInk,
  [InvertedPossession.id]: InvertedPossession,
  [Mirror.id]: Mirror,
  [Smudge.id]: Smudge,
  [CrackedCenter.id]: CrackedCenter,
  [BlockCredits.id]: BlockCredits,
};

/** Convert ids → Modifier objects. Throws if any id is unknown. */
export function resolveModifiers(ids: string[]): Modifier[] {
  return ids.map((id) => {
    const m = MODIFIER_REGISTRY[id];
    if (!m) throw new Error(`Unknown modifier id: ${id}`);
    return m;
  });
}

/** Default modifier set for the live game (until daily editions take over). */
export const CLASSIC_MODIFIERS = [GhostEviction.id];

export {
  GhostEviction,
  ChaosCell,
  QuickInk,
  SlowInk,
  InvertedPossession,
  Mirror,
  Smudge,
  CrackedCenter,
  BlockCredits,
};
