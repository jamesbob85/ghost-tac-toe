import { Modifier } from './types';
import { GhostEviction } from './ghostEviction';
import { ChaosCell } from './chaosCell';

/** All known modifiers, keyed by id. The simulation and engine consult this. */
export const MODIFIER_REGISTRY: Record<string, Modifier> = {
  [GhostEviction.id]: GhostEviction,
  [ChaosCell.id]: ChaosCell,
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

export { GhostEviction, ChaosCell };
