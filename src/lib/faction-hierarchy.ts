import type { FactionID } from './types';

/** Minimal faction shape these helpers need (works for Faction & EncyclopediaFaction). */
export interface FactionLike {
  id: FactionID;
  parent?: FactionID;
}

/** Canonical display order of top-level (parent-less) factions. */
const TOP_LEVEL_ORDER: readonly FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

/** The parent faction of `factionId`, or undefined if it is top-level / unknown. */
export function getParent<T extends FactionLike>(factionId: FactionID, factions: T[]): T | undefined {
  const f = factions.find((x) => x.id === factionId);
  if (!f?.parent) return undefined;
  return factions.find((x) => x.id === f.parent);
}

/** Direct sub-factions of `parentId`. */
export function getSubFactions<T extends FactionLike>(parentId: FactionID, factions: T[]): T[] {
  return factions.filter((f) => f.parent === parentId);
}

/** True if `factionId` declares a `parent`. */
export function isSubFaction(factionId: FactionID, factions: FactionLike[]): boolean {
  return factions.some((f) => f.id === factionId && !!f.parent);
}

/**
 * Top-level factions (no `parent`) in canonical order, each immediately followed
 * by its sub-factions; custom top-level factions next (source order); orphan
 * children (whose `parent` is absent from the list) last.
 */
export function orderedFactions<T extends FactionLike>(factions: T[]): T[] {
  const byId = new Map(factions.map((f) => [f.id, f]));
  const out: T[] = [];
  const seen = new Set<FactionID>();
  const emit = (p: T) => {
    if (seen.has(p.id)) return;
    out.push(p);
    seen.add(p.id);
    for (const c of factions.filter((f) => f.parent === p.id)) {
      if (!seen.has(c.id)) {
        out.push(c);
        seen.add(c.id);
      }
    }
  };
  for (const id of TOP_LEVEL_ORDER) {
    const f = byId.get(id);
    if (f && !f.parent) emit(f);
  }
  for (const f of factions) {
    if (!f.parent && !seen.has(f.id)) emit(f);
  }
  for (const f of factions) {
    if (!seen.has(f.id)) {
      out.push(f);
      seen.add(f.id);
    }
  }
  return out;
}

export type FactionRelation = 'own' | 'subfaction' | 'parent' | 'ally';

/**
 * Relationship of a unit's faction to the player's selected faction.
 *  - `own`        — same faction (or no selection)
 *  - `subfaction` — the unit's faction is a child of the selected faction
 *  - `parent`     — the unit's faction is the parent of the selected (sub-)faction
 *  - `ally`       — anything else (incl. wildcard allies like mercenaries)
 */
export function relationTo(
  unitFactionId: FactionID,
  selectedFactionId: FactionID | undefined,
  factions: FactionLike[],
): FactionRelation {
  if (!selectedFactionId || unitFactionId === selectedFactionId) return 'own';
  const unit = factions.find((f) => f.id === unitFactionId);
  const selected = factions.find((f) => f.id === selectedFactionId);
  if (unit?.parent === selectedFactionId) return 'subfaction';
  if (selected?.parent === unitFactionId) return 'parent';
  return 'ally';
}
