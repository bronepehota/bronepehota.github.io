import type { EncyclopediaUnit } from './encyclopedia-registry';
import { factionDisplayNames } from './faction-colors';

/** Lore page reference for search hints (chapters, campaigns, missions, unit lore). */
export interface LorePageRef {
  title: string;
  href: string;
  kind: 'chapter' | 'campaign' | 'mission' | 'unit-lore';
  /** Pre-lowered plain-text body for search matching (build-time, ~1-2KB).
   *  Optional — pages without it match by title only, as before. */
  body?: string;
}

/** Build-time: raw markdown / HTML text → compact lowercase search body.
 *
 *  A plain head-slice would lose words that sit deep in long chapters («Блауд»
 *  first occurs at char ~2300), and shipping full bodies (~310KB) bloats the
 *  client payload. So the body = HEAD (first `headLen` chars of cleaned text,
 *  covers early prose words) + TAIL (unique CAPITALIZED words from the whole
 *  text — proper nouns are the search-intent vocabulary: names, places,
 *  weapon models). A word that also occurs lowercase in the text is dropped
 *  from the tail (sentence-start noise like «Если»/«После», not a proper noun).
 *
 *  ~1.5KB per entry × ~54 pages ≈ 130KB of client payload — fits the phase
 *  size budget while making «Блауд»/«Вега»/«Кхораи» findable deep in chapters.
 */
export function toSearchBody(raw: string, headLen = 1000, tailWords = 120): string {
  const clean = raw
    .replace(/^---\n[\s\S]*?\n---\n?/, ' ')   // YAML frontmatter
    .replace(/<[^>]*>/g, ' ')                  // HTML tags
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')     // images → drop entirely
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // links → label
    .replace(/https?:\/\/\S+/g, ' ')           // bare URLs
    .replace(/[#>*_`~|]+/g, ' ')               // md punctuation
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, ' ')
    .trim();
  // Capitalized words of the WHOLE document, deduped, in order of appearance.
  // NB: \b is ASCII-only in JS, so token boundaries are spelled as lookarounds
  // with an explicit Cyrillic class.
  const capWords = clean.match(/[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]{2,}/g) ?? [];
  const tail: string[] = [];
  const seen = new Set<string>();
  for (const w of capWords) {
    const lw = w.toLowerCase();
    if (seen.has(lw)) continue;
    seen.add(lw);
    // Proper-noun filter: keep the word only if EVERY exact-form occurrence is
    // capitalized. A word that also appears lowercase («Если» … «если») is a
    // sentence-start common word, not a name — dropping it keeps the tail clean.
    // (Inflected forms don't count: «Блауда» ≠ exact token «блауд».)
    const token = new RegExp(`(?<![A-Za-zА-Яа-яЁё])${lw}(?![A-Za-zА-Яа-яЁё-])`, 'gi');
    const occurrences = clean.match(token) ?? [];
    if (occurrences.some((o) => !/^[A-ZА-ЯЁ]/.test(o))) continue;
    tail.push(lw);
    if (tail.length >= tailWords) break;
  }
  return `${clean.slice(0, headLen)} ${tail.join(' ')}`.toLowerCase().trim();
}

/** Precomputed per-unit search string: name, shortName, faction display name,
 *  manufacturer, lore fields and reference-book fields (shortDescription,
 *  designation, class, armament names), lowercased.
 *  Build once (useMemo) — the filter then does a cheap substring check. */
export function buildSearchHaystack(unit: EncyclopediaUnit): string {
  const enc = unit.encyclopedia;
  return [
    unit.name,
    unit.shortName,
    factionDisplayNames[unit.faction],
    enc?.shortDescription,
    enc?.designation,
    enc?.class,
    enc?.manufacturer,
    enc?.lore,
    enc?.history,
    enc?.tactics,
    ...(enc?.armament?.map((a) => a.name) ?? []),
  ]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
}

/** Case-insensitive token-AND match against the (optional precomputed) haystack:
 *  the query is split on whitespace and EVERY token must be a substring
 *  («полярис герой» finds heroes of Polaris without an exact phrase). */
export function matchesSearch(unit: EncyclopediaUnit, query: string, haystack?: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const h = haystack ?? buildSearchHaystack(unit);
  return tokens.every((t) => h.includes(t));
}

/** Lore pages matching the query (≥3 chars) by TITLE or BODY. Title matches
 *  rank above body matches (a chapter named like the query is the stronger
 *  intent signal); a page matching both appears once, in the title group. */
export function matchLoreTitles(query: string, pages: LorePageRef[]): LorePageRef[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const byTitle: LorePageRef[] = [];
  const byBody: LorePageRef[] = [];
  for (const p of pages) {
    if (p.title.toLowerCase().includes(q)) {
      byTitle.push(p);
    } else if (p.body && p.body.includes(q)) {
      byBody.push(p);
    }
  }
  return [...byTitle, ...byBody];
}
