import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { LoreCredit, LoreSource } from './provenance';

export interface CampaignUnit {
  id: string;
  role: string;
}

export interface CampaignMission {
  name: string;
  box: string;
}

export interface CampaignMeta {
  slug: string;
  title: string;
  subtitle?: string;
  era?: string;
  factions?: string[];
  units?: CampaignUnit[];
  missions?: CampaignMission[];
  order?: number;
  /** Org-level author of the campaign text (frontmatter). A non-tehnolog source
   *  (a V.Chertischev novel) flags the credit chip with the mini АВБ mark. */
  loreAuthor?: LoreSource;
  /** Named citation — the specific novel the campaign retells (frontmatter). */
  credit?: LoreCredit;
}

export interface Campaign extends CampaignMeta {
  bodyHtml: string;
}

const CAMPAIGNS_DIR = path.join(process.cwd(), 'src', 'content', 'campaigns');

function readFrontmatter(slug: string) {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return matter(raw);
}

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllCampaigns(): CampaignMeta[] {
  if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data } = readFrontmatter(slug);
    return { slug, ...(data as Omit<CampaignMeta, 'slug'>) };
  });
  metas.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return metas;
}

/**
 * Markdown → sanitized HTML.
 *
 * `remark-html` does NOT sanitize (raw `<script>`/`onerror=` pass through), so we
 * bridge mdast→hast via `remark-rehype` and run `rehype-sanitize` before stringifying.
 * The default schema keeps the basic Markdown the campaigns use today (headings,
 * paragraphs, bold/emphasis, lists, blockquotes) and strips scripts, event handlers,
 * and `javascript:` URLs. Defense-in-depth: the source is first-party/build-time, but
 * any future Markdown field sourced from user input must not inherit an XSS hole.
 *
 * NB: if campaigns start using GFM tables/code/images, extend the schema passed to
 * `rehypeSanitize` (default schema drops `table`/`thead`/`td`/…).
 */
export async function renderMarkdownToSanitizedHtml(content: string): Promise<string> {
  const { remark } = await import('remark');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkRehype } = await import('remark-rehype');
  const { default: rehypeSanitize } = await import('rehype-sanitize');
  const { default: rehypeStringify } = await import('rehype-stringify');
  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype)        // mdast → hast (raw HTML in the .md is dropped by default)
    .use(rehypeSanitize)      // strip <script>, on* handlers, javascript: URLs
    .use(rehypeStringify)     // hast → HTML string
    .process(content);
  return String(file);
}

// Async: dynamically imports remark (ESM-only) so the module stays Jest-importable.
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = readFrontmatter(slug);
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  return { slug, ...(data as Omit<CampaignMeta, 'slug'>), bodyHtml };
}
