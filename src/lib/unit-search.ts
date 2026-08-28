import type { EncyclopediaUnit } from './encyclopedia-registry';
import { factionDisplayNames } from './faction-colors';

/** Lore page reference for search hints (chapters + campaigns). */
export interface LorePageRef {
  title: string;
  href: string;
  kind: 'chapter' | 'campaign';
}

/** Precomputed per-unit search string: name, shortName, faction display name,
 *  manufacturer and lore fields (lore/history/tactics), lowercased.
 *  Build once (useMemo) — the filter then does a cheap substring check. */
export function buildSearchHaystack(unit: EncyclopediaUnit): string {
  const enc = unit.encyclopedia;
  return [
    unit.name,
    unit.shortName,
    factionDisplayNames[unit.faction],
    enc?.manufacturer,
    enc?.lore,
    enc?.history,
    enc?.tactics,
  ]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
}

/** Case-insensitive substring match against the (optional precomputed) haystack. */
export function matchesSearch(unit: EncyclopediaUnit, query: string, haystack?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (haystack ?? buildSearchHaystack(unit)).includes(q);
}

/** Chapters/campaigns whose TITLE matches the query (≥3 chars). Body text is
 *  intentionally not searched — titles cover discovery intent. */
export function matchLoreTitles(query: string, pages: LorePageRef[]): LorePageRef[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  return pages.filter((p) => p.title.toLowerCase().includes(q));
}
