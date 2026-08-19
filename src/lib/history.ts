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
  /** Org-level author of the chapter text (frontmatter): «Летопись» chapters are
   *  tehnolog; chapter VIII (from «Косары») is star_system → carries the АВБ mark. */
  loreAuthor?: LoreSource;
  /** Named citation — the specific book the chapter was adapted from (frontmatter). */
  credit?: LoreCredit;
}

export interface HistoryChapter extends HistoryChapterMeta {
  bodyHtml: string;
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

// Async: dynamically imports remark via the campaigns pipeline — module stays Jest-importable.
export async function getHistoryChapter(slug: string): Promise<HistoryChapter | null> {
  const fullPath = path.join(HISTORY_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  return { slug, ...(data as Omit<HistoryChapterMeta, 'slug'>), bodyHtml };
}
