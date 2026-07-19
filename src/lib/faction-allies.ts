import type { FactionID } from './types';

export interface FactionLike {
  id: FactionID;
  allies?: FactionID[];
}

/**
 * Returns the set of factions allied with `selected` (excluding `selected`).
 *
 * Symmetric + wildcard: A and B are allied if ANY is true:
 *   - A's allies include B
 *   - B's allies include A
 *   - A's allies include "*" (A is ally of all)
 *   - B's allies include "*" (B is ally of all)
 *
 * So a wildcard faction (e.g. mercenaries, allies:["*"]) is allied with every
 * other faction, and every faction is allied with it — mercenaries units are
 * available to all, and all units are available to mercenaries.
 *
 * Only factions present in `factions` (the current source's factions) can be
 * returned, so alliances only activate where both factions exist in the source.
 */
export function getAlliedFactions(
  selected: FactionID,
  factions: FactionLike[],
): Set<FactionID> {
  const me = factions.find((f) => f.id === selected);
  const out = new Set<FactionID>();
  for (const f of factions) {
    if (f.id === selected) continue;
    const meListsThem = !!me?.allies && (me.allies.includes(f.id) || me.allies.includes('*'));
    const theyListMe = !!f.allies && (f.allies.includes(selected) || f.allies.includes('*'));
    if (meListsThem || theyListMe) out.add(f.id);
  }
  return out;
}
