import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { LoreCredit, LoreSource } from './provenance';
import { renderMarkdownToSanitizedHtml } from './campaigns';

export interface HistoryChapterMeta {
  slug: string;
  title: string;
  era?: string;
  order?: number;
  /** Grouping label for non-chronicle sections (TOC subheader): «Справочник»,
   *  «Творчество игроков». Absent = the chronological flow (numbered chapters). */
  group?: string;
  /** Org-level author of the chapter text (frontmatter): «Летопись» chapters are
   *  tehnolog; chapter VIII (from «Косары») is avb → carries the АВБ mark. */
  loreAuthor?: LoreSource;
  /** Named citation — the specific book the chapter was adapted from (frontmatter). */
  credit?: LoreCredit;
}

export interface HistoryChapter extends HistoryChapterMeta {
  bodyHtml: string;
}

/* ============================================================
   «ДЕЛО RG-4530» showcase helpers — pure, build-time, Jest-safe.
   The hub cover, the sticky era ribbon and the era/group dividers
   all derive from the same frontmatter walk (no hardcoded years).
   ============================================================ */

/** One clickable mark on the sticky era ribbon (a year, a group or the wars). */
export interface HistoryEraTick {
  label: string;
  /** In-page anchor: `#slug` of the era-opening chapter, a divider anchor or `#wars`. */
  href: string;
  kind: 'era' | 'group' | 'wars';
}

/** Full-bleed divider rendered at the head of a zone (era or group seam). */
export interface HistoryDividerInfo {
  /** Giant outlined glyph: the era start year, `§` (reference) or `//` (fiction fund). */
  outline: string;
  /** Archival stamp text («ХРОНИКА», «СПРАВОЧНИК», «ФОНД ПИСАТЕЛЬСТВ», «ЭПОХА …»). */
  stamp: string;
  /** Small subline bridging the archival stamp to the data group name. */
  sub?: string;
  /** In-flow anchor id (group dividers — ribbon group ticks jump here). */
  anchorId?: string;
}

/** An era/group zone: its ribbon tick, divider and the chapters it spans. */
export interface HistoryZone {
  /** Index into the ribbon ticks — the zone wrapper carries the matching
   *  `view-timeline-name: --hist-tick-N` (active-epoch highlight binds to it). */
  tickIndex: number;
  divider: HistoryDividerInfo;
  slugs: string[];
}

export interface HistoryFlow {
  /** Ribbon marks in flow order (era years, group labels and the wars tick
   *  wherever WARS_BEFORE_SLUG places it). */
  ticks: HistoryEraTick[];
  /** Contiguous zones covering every chapter in order; + the wars zone (no slugs). */
  zones: HistoryZone[];
  /** Zone index of the wars block (wraps <CampaignsBlock>). */
  warsZoneIndex: number;
}

/** Archival stamp + outline glyph for a group value (chrono flow = no group). */
function groupDividerVisual(group: string): { outline: string; stamp: string; sub?: string } {
  if (group === 'Справочник') return { outline: '§', stamp: 'СПРАВОЧНИК' };
  if (group === 'Творчество игроков')
    return { outline: '//', stamp: 'ФОНД ПИСАТЕЛЬСТВ', sub: '// Творчество игроков' };
  return { outline: '//', stamp: group.toUpperCase() };
}

/** Глава, ПЕРЕД которой в поток встаёт блок «Хроники войн»: кампании
 *  (4360–4546) хронологически старше новейшей истории (Конверсия→Раскол,
 *  4530–4554), поэтому читатель проходит войны ДО Раскола — и хроника
 *  заканчивается самой свежей точкой (решение владельца 2026-09-01).
 *  Если главы-якоря нет (переименование), wars остаются в конце страницы. */
export const WARS_BEFORE_SLUG = 'konversiya-raskol-regentstvo';

/**
 * Single walk over the order-sorted chapters producing BOTH the ribbon ticks
 * and the reading zones, so their indices stay in lockstep (tick N highlights
 * while zone N — the element carrying `view-timeline-name: --hist-tick-N` —
 * is anywhere on screen; binding to the divider alone would go dark as soon
 * as the reader scrolls past it into the chapter body).
 *
 * Era ticks use the FIRST year of the chapter `era` (e.g. «1908–2398» → 1908);
 * the divider repeats it as the giant outlined year. Chapters without `era`
 * (the Regency tail after Конверсия) inherit the latest era zone — no divider
 * of their own. An era-less chrono chapter that STARTS the flow or resumes it
 * after a group section cuts a bare «ХРОНИКА» zone (no outlined year).
 * Group seams (Справочник / Творчество игроков) always cut a zone.
 * The wars zone is cut before WARS_BEFORE_SLUG (or appended, if absent).
 */
export function buildHistoryFlow(chapters: HistoryChapterMeta[]): HistoryFlow {
  const ticks: HistoryEraTick[] = [];
  const zones: HistoryZone[] = [];
  let prevGroup: string | undefined; // undefined = the chrono flow (ХРОНИКА)
  let prevEra: string | undefined;
  let seenChrono = false;
  let warsZoneIndex = -1;

  const openZone = (divider: HistoryDividerInfo, tick: HistoryEraTick) => {
    ticks.push(tick);
    zones.push({ tickIndex: ticks.length - 1, divider, slugs: [] });
  };
  const openWarsZone = () => {
    warsZoneIndex = zones.length;
    openZone(
      { outline: '†', stamp: 'ВОЙНЫ' },
      { label: 'ВОЙНЫ', href: '#wars', kind: 'wars' },
    );
  };

  for (const c of chapters) {
    if (warsZoneIndex === -1 && c.slug === WARS_BEFORE_SLUG) openWarsZone();
    const groupChanged = (c.group ?? undefined) !== prevGroup;
    const eraChanged = c.group === undefined && c.era !== undefined && c.era !== prevEra;
    // Every chapter must land in a zone: a flow that STARTS with an era-less
    // chrono chapter cuts no seam of its own — open the ХРОНИКА zone here or
    // the slug would be silently dropped (zones is still empty below).
    const needsZone = zones.length === 0;
    if (groupChanged || eraChanged || needsZone) {
      if (eraChanged) {
        const year = c.era!.match(/\d{4}/)?.[0] ?? c.era!;
        const stamp =
          c.group === undefined && !seenChrono
            ? 'ХРОНИКА' // the very first divider doubles as the chrono group stamp
            : `ЭПОХА ${c.era}`;
        openZone({ outline: year, stamp }, { label: year, href: `#${c.slug}`, kind: 'era' });
      } else if (c.group !== undefined) {
        // Group seam (Справочник / Творчество игроков): label tick + archival stamp
        const anchorId = `history-anchor-${ticks.length}`;
        openZone(
          { anchorId, ...groupDividerVisual(c.group) },
          { label: groupDividerVisual(c.group).stamp, href: `#${anchorId}`, kind: 'group' },
        );
      } else {
        // Chrono chapter with no seam of its own: the flow either starts or
        // resumes (after a group section) without an era — ХРОНИКА zone with
        // no outlined year (was a TypeError via groupDividerVisual(undefined)).
        openZone(
          { outline: '//', stamp: 'ХРОНИКА' },
          { label: 'ХРОНИКА', href: `#${c.slug}`, kind: 'era' },
        );
      }
      prevGroup = c.group ?? undefined;
      if (c.group === undefined) {
        prevEra = c.era ?? prevEra;
        seenChrono = true;
      }
    }
    zones[zones.length - 1]?.slugs.push(c.slug);
  }

  // Fallback: no anchor chapter in this content set — wars close the page.
  if (warsZoneIndex === -1) openWarsZone();
  return { ticks, zones, warsZoneIndex };
}

/** All 4-digit years mentioned in chapter eras (e.g. [1908, 2398, 2440, …]). */
export function historyEraYears(chapters: HistoryChapterMeta[]): number[] {
  return chapters.flatMap((c) => (c.era?.match(/\b\d{4}\b/g) ?? []).map(Number));
}

/** Century of the latest year on record (chapters + wars) — «45 ВЕК». */
export function historyCentury(chapters: HistoryChapterMeta[], warsEra?: string): number {
  const years = historyEraYears(chapters);
  if (warsEra) years.push(...(warsEra.match(/\b\d{4}\b/g) ?? []).map(Number));
  const max = Math.max(0, ...years);
  return Math.floor(max / 100);
}

/** Reading-time estimate for the hub meta line («22 ДОСЬЕ · ≈85 МИН»), ~160 wpm. */
export function estimateReadingMinutes(htmls: string[], wpm = 160): number {
  const words = htmls.reduce(
    (sum, html) => sum + html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
    0,
  );
  return Math.max(1, Math.round(words / wpm));
}

const HISTORY_DIR = path.join(process.cwd(), 'src', 'content', 'history');

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllHistoryChapters(): HistoryChapterMeta[] {
  if (!fs.existsSync(HISTORY_DIR)) return [];
  const files = fs.readdirSync(HISTORY_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(HISTORY_DIR, f), 'utf8');
    return { slug, ...(matter(raw).data as Omit<HistoryChapterMeta, 'slug'>) };
  });
  metas.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return metas;
}

/** Sync raw markdown (frontmatter + body) of a chapter — no remark. Used at
 *  build time to feed search-hint bodies (encyclopedia page); Jest-safe. */
export function getHistoryChapterRaw(slug: string): string | null {
  const fullPath = path.join(HISTORY_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// Async: dynamically imports remark via the campaigns pipeline — module stays Jest-importable.
export async function getHistoryChapter(slug: string): Promise<HistoryChapter | null> {
  const fullPath = path.join(HISTORY_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  return { slug, ...(data as Omit<HistoryChapterMeta, 'slug'>), bodyHtml };
}
