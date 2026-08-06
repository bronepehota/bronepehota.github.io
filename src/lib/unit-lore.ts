import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { renderMarkdownToSanitizedHtml } from './campaigns';

/**
 * Per-unit long-form lore docs — the «Читать подробнее» layer.
 *
 * The short summary lives in the unit JSON `encyclopedia.lore/history`; this is
 * the fuller, multi-paragraph version (weapon-by-weapon detail, design history)
 * authored as Markdown under `src/content/unit-lore/<unit-id>.md`. Rendered to
 * sanitized HTML at build time by the unit detail route and passed to the page
 * as a prop, so it lands in the static HTML (indexable) while a CSS-collapsed
 * expander keeps the page scannable.
 *
 * Frontmatter:
 *   sourceLabel — human name of the primary source (e.g. «Справочник техники Робогир»)
 *   sourceUrl   — link to the primary source (robogear.ru / official page)
 */
export interface UnitLoreDoc {
  id: string;
  bodyHtml: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

const UNIT_LORE_DIR = path.join(process.cwd(), 'src', 'content', 'unit-lore');

/** Sync existence check (safe in Jest). */
export function hasUnitLoreDoc(id: string): boolean {
  return fs.existsSync(path.join(UNIT_LORE_DIR, `${id}.md`));
}

/** Async: reads + renders the doc (dynamic remark import — do not unit-test). */
export async function getUnitLoreDoc(id: string): Promise<UnitLoreDoc | null> {
  const fullPath = path.join(UNIT_LORE_DIR, `${id}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  const d = data as { sourceLabel?: string; sourceUrl?: string };
  return { id, bodyHtml, sourceLabel: d.sourceLabel, sourceUrl: d.sourceUrl };
}
