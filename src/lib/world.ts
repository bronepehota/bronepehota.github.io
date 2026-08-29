import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { renderMarkdownToSanitizedHtml } from './campaigns';

/**
 * «Алфавит вселенной» — сущностные страницы (entity pages) канона: персоны,
 * локации, битвы, термины и корабли флотов. SEO-поверхность под поисковые
 * запросы вида «лорд Кросс робогир», «империя полярис», «доминион» — каждая
 * сущность получает собственный URL с Article JSON-LD и связями (related) на
 * уже существующие разделы энциклопедии.
 *
 * Текст — НАША сводка по уже импортированным адаптациям (главы истории,
 * кампании), не дословный пересказ: происхождение сведений прозрачно
 * передаётся свободным текстом в `sources` (мелкий рендер, без кредит-чипов).
 *
 * `ship` — корабли военно-космических флотов (справочники VK): ОТДЕЛЬНЫЙ вид
 * записей, НЕ юниты — играть кораблями нельзя (решение владельца 2026-08-29),
 * related.units для них не используется.
 */

export type WorldKind = 'person' | 'location' | 'battle' | 'term' | 'ship';

/** Досье-гриф для kind — «// ПЕРСОНА», «// ЛОКАЦИЯ», «// БИТВА», «// ТЕРМИН», «// КОРАБЛЬ». */
export const WORLD_KIND_LABELS: Record<WorldKind, string> = {
  person: 'ПЕРСОНА',
  location: 'ЛОКАЦИЯ',
  battle: 'БИТВА',
  term: 'ТЕРМИН',
  ship: 'КОРАБЛЬ',
};

export function isWorldKind(value: unknown): value is WorldKind {
  return typeof value === 'string' && value in WORLD_KIND_LABELS;
}

/** Ссылки на существующие сущности сайта (ids валидируются тестами). */
export interface WorldRelated {
  /** Encyclopedia unit ids → /encyclopedia/unit/<id>. */
  units?: string[];
  /** Encyclopedia faction ids → /encyclopedia/factions. */
  factions?: string[];
  /** History chapter slugs → /encyclopedia/history/<slug>. */
  chapters?: string[];
  /** Campaign slugs → /campaigns/<slug>. */
  campaigns?: string[];
}

export interface WorldEntryMeta {
  slug: string;
  title: string;
  kind: WorldKind;
  /** Подзаголовок-должность/пояснение («Великий Адмирал Внутренней Империи»). */
  subtitle?: string;
  /** Хронологическая привязка страницы («4451–4530»). */
  era?: string;
  /** Faction id для цветовой привязки/бейджа (optional — термины без фракции). */
  faction?: string;
  /** Порядок в алфавитном индексе (fallback — сортировка по title). */
  order?: number;
  related?: WorldRelated;
  /** Происхождение сведений свободным текстом («Летопись: Звёздные герои»). */
  sources?: string[];
}

export interface WorldEntry extends WorldEntryMeta {
  bodyHtml: string;
}

const WORLD_DIR = path.join(process.cwd(), 'src', 'content', 'world');

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllWorldEntries(): WorldEntryMeta[] {
  if (!fs.existsSync(WORLD_DIR)) return [];
  const files = fs.readdirSync(WORLD_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(WORLD_DIR, f), 'utf8');
    return { slug, ...(matter(raw).data as Omit<WorldEntryMeta, 'slug'>) };
  });
  // Алфавит вселенной: order задаёт исключения, прочее — по алфавиту title,
  // чтобы индекс жил по буквам, а не по дате добавления записей.
  metas.sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title, 'ru'),
  );
  return metas;
}

/** Sync raw markdown (frontmatter + body) — для поисковых тел подсказок
 *  (encyclopedia page); без remark, Jest-safe. */
export function getWorldEntryRaw(slug: string): string | null {
  const fullPath = path.join(WORLD_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// Async: динамический импорт remark через пайплайн campaigns — модуль
// остаётся Jest-импортируемым (см. договорённость в campaigns.ts).
export async function getWorldEntry(slug: string): Promise<WorldEntry | null> {
  const fullPath = path.join(WORLD_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
  const bodyHtml = await renderMarkdownToSanitizedHtml(content);
  return { slug, ...(data as Omit<WorldEntryMeta, 'slug'>), bodyHtml };
}
