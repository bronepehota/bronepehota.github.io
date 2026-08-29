import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAllWorldEntries,
  getWorldEntry,
  WORLD_KIND_LABELS,
  type WorldEntry,
} from '@/lib/world';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { ChapterBody } from '@/components/encyclopedia/history/ChapterBody';
import JsonLd from '@/components/JsonLd';
import {
  articleJsonLd,
  htmlToPlainText,
  metaDescription,
  organizationJsonLd,
  pageOpenGraph,
} from '@/lib/seo';

/**
 * Сущностная страница вселенной («Алфавит вселенной»): персона, локация, битва
 * или термин канона. SEO-механизм под запросы вида «лорд Кросс робогир» или
 * «империя полярис» — собственный URL, self-canonical, Article JSON-LD.
 *
 * Текст — сводка по уже импортированным адаптациям; происхождение сведений
 * рендерится мелкой mono-строкой по frontmatter `sources` (кредиты не нужны —
 * это не перевод, а наша энциклопедическая выжимка). Блок «// СВЯЗАННОЕ»
 * связывает сущность с юнитами, фракциями, главами и кампаниями сайта.
 * Prev/next не нужен: это справочник, а не линейное чтение.
 */
interface PageProps {
  params: { slug: string };
}

/** Первые ~150 символов тела (rendered HTML → plain text). */
function entryDescription(entry: WorldEntry): string {
  const bodyText = htmlToPlainText(entry.bodyHtml);
  if (!bodyText) {
    return `${entry.title} — ${WORLD_KIND_LABELS[entry.kind].toLowerCase()} вселенной Бронепехоты${
      entry.subtitle ? `: ${entry.subtitle.toLowerCase()}` : '.'
    }`;
  }
  return metaDescription(bodyText, 150);
}

export function generateStaticParams() {
  return getAllWorldEntries().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const entry = await getWorldEntry(params.slug);
  if (!entry) {
    return { title: 'Запись не найдена — вселенная Бронепехоты' };
  }
  const description = entryDescription(entry);
  return {
    title: `${entry.title} — вселенная Бронепехоты`,
    description,
    alternates: { canonical: `/encyclopedia/world/${entry.slug}` },
    openGraph: pageOpenGraph({
      title: entry.title,
      description,
      path: `/encyclopedia/world/${entry.slug}`,
      type: 'article',
    }),
  };
}

/** Одна плашка «// СВЯЗАННОЕ» — mono-гриф раздела + список ссылок. */
function RelatedGroup({
  label,
  items,
}: {
  label: string;
  items: Array<{ href: string; title: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust/80 mb-2">
        {`// ${label}`}
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="inline-flex items-center gap-1.5 border border-military-steel/30 bg-military-charcoal/50 px-3 py-1.5 font-oswald text-sm text-military-sand hover:border-military-amber hover:text-military-amber transition-colors"
            >
              {item.title}
              <span aria-hidden className="font-ibm-mono text-[10px] text-military-rust/70">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function WorldEntryPage({ params }: PageProps) {
  const entry = await getWorldEntry(params.slug);
  if (!entry) notFound();

  const description = entryDescription(entry);
  // Резолв related-ссылок в человекочитаемые имена (реестры — sync fs).
  // Карточки фракций несут якоря id={faction.id} (FactionsListPage) — ссылки
  // ведут на конкретную карточку /encyclopedia/factions#<id>.
  const chapterTitles = new Map(getAllHistoryChapters().map((c) => [c.slug, c.title]));
  const campaignTitles = new Map(getAllCampaigns().map((c) => [c.slug, c.title]));
  const relatedUnits = (entry.related?.units ?? []).map((id) => ({
    href: `/encyclopedia/unit/${id}`,
    title: getEncyclopediaUnit(id)?.name ?? id,
  }));
  const relatedFactions = (entry.related?.factions ?? []).map((id) => ({
    href: `/encyclopedia/factions#${id}`,
    title: getEncyclopediaFaction(id)?.name ?? id,
  }));
  const relatedChapters = (entry.related?.chapters ?? []).map((slug) => ({
    href: `/encyclopedia/history/${slug}`,
    title: chapterTitles.get(slug) ?? slug,
  }));
  const relatedCampaigns = (entry.related?.campaigns ?? []).map((slug) => ({
    href: `/campaigns/${slug}`,
    title: campaignTitles.get(slug) ?? slug,
  }));
  const hasRelated =
    relatedUnits.length +
      relatedFactions.length +
      relatedChapters.length +
      relatedCampaigns.length >
    0;
  // Фракционная привязка — цветной маркер в шапке (не ссылка: ссылка в СВЯЗАННОМ).
  const factionName = entry.faction
    ? (getEncyclopediaFaction(entry.faction)?.name ?? undefined)
    : undefined;

  return (
    <main className="min-h-screen bg-military-dark relative overflow-x-clip">
      {/* Background layers — shared with the history pages */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14">
        {/* Back to the alphabet index */}
        <nav
          aria-label="Навигация по вселенной"
          className="mb-6 flex items-center justify-between gap-4"
        >
          <Link
            href="/encyclopedia/world"
            className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
          >
            <span className="text-lg">←</span>
            <span>К алфавиту вселенной</span>
          </Link>
          <p className="font-ibm-mono text-[10px] text-military-steel/50 tracking-wide hidden sm:block">
            {'// Вселенная Бронепехоты'}
          </p>
        </nav>

        {/* Досье сущности: folded-paper, kind-гриф mono, Russo uppercase, era-реквизит */}
        <article
          data-testid="world-page"
          className="folded-paper military-corners relative pl-6 pr-5 py-6 md:pl-10 mb-8"
        >
          <div data-testid="world-kind" className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 border border-military-rust/30 px-2 py-0.5">
              {`// ${WORLD_KIND_LABELS[entry.kind]}`}
            </span>
            {entry.era && (
              <span
                data-testid="world-era"
                className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60 whitespace-nowrap"
              >
                {entry.era}
              </span>
            )}
            {factionName && (
              <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-taupe/70 whitespace-nowrap">
                {factionName}
              </span>
            )}
          </div>
          <h1
            data-testid="world-title"
            className="font-russo font-black text-2xl md:text-4xl text-white military-text-gradient uppercase tracking-wide mb-2"
          >
            {entry.title}
          </h1>
          {entry.subtitle && (
            <p className="font-oswald text-military-taupe text-base md:text-lg mb-5 pb-4 border-b border-military-steel/25">
              {entry.subtitle}
            </p>
          )}
          {/* Тело — та же лонгрид-типографика глав (65ch, без нумерации h3) */}
          <ChapterBody html={entry.bodyHtml} chapterNumber={null} />
          {/* Происхождение сведений — мелкая mono-строка (прозрачность сводки) */}
          {entry.sources && entry.sources.length > 0 && (
            <p
              data-testid="world-sources"
              className="mt-5 pt-3 border-t border-military-steel/20 font-ibm-mono text-[10px] leading-relaxed text-military-steel/60"
            >
              {`// ИСТОЧНИКИ: ${entry.sources.join(' · ')}`}
            </p>
          )}
        </article>

        {/* // СВЯЗАННОЕ — связи с юнитами, фракциями, главами и кампаниями */}
        {hasRelated && (
          <section
            data-testid="world-related"
            className="folded-paper military-corners p-5 space-y-4"
          >
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 pb-3 border-b border-military-steel/25">
              {'// СВЯЗАННОЕ'}
            </p>
            <RelatedGroup label="ЮНИТЫ" items={relatedUnits} />
            <RelatedGroup label="ФРАКЦИИ" items={relatedFactions} />
            <RelatedGroup label="ГЛАВЫ ИСТОРИИ" items={relatedChapters} />
            <RelatedGroup label="ХРОНИКИ ВОЙН" items={relatedCampaigns} />
          </section>
        )}
      </div>

      {/* Article + publisher (publisher @id резолвится внутри этого графа) */}
      <JsonLd
        data={[
          articleJsonLd({
            title: entry.title,
            description,
            path: `/encyclopedia/world/${entry.slug}`,
            isPartOfPath: '/encyclopedia/world',
          }),
          organizationJsonLd(),
        ]}
      />
    </main>
  );
}
