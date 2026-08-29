import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllHistoryChapters, getHistoryChapter, type HistoryChapter } from '@/lib/history';
import { LoreSourceRow } from '@/components/encyclopedia/LoreSourceRow';
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
 * Standalone page for a single history chapter — the SEO counterpart of the
 * longread hub (/encyclopedia/history).
 *
 * DELIBERATE CONTENT DUPLICATION hub ↔ chapter: the hub stays the reader
 * experience (one continuous chronicle, anchor TOC), while each chapter here
 * is the SEARCH ENTRY (own URL, self-canonical, unique title/description,
 * Article JSON-LD, prev/next). Both URLs are canonical to themselves — the
 * overlap is an accepted tradeoff for long-tail discoverability.
 *
 * A page-level openGraph object replaces the root-layout one entirely (Next
 * merges only top-level metadata fields) — pageOpenGraph() reassembles the
 * full set including the site og:image card.
 */
interface PageProps {
  params: { slug: string };
}

/** First ~150 chars of the chapter body (rendered HTML → plain text). */
function chapterDescription(chapter: HistoryChapter): string {
  const bodyText = htmlToPlainText(chapter.bodyHtml);
  if (!bodyText) {
    return `Глава «${chapter.title}» хроники вселенной Робогир${
      chapter.era ? ` (${chapter.era})` : ''
    }.`;
  }
  return metaDescription(bodyText, 150);
}

export function generateStaticParams() {
  return getAllHistoryChapters().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const chapter = await getHistoryChapter(params.slug);
  if (!chapter) {
    return { title: 'Глава не найдена — Энциклопедия Бронепехоты' };
  }
  const description = chapterDescription(chapter);
  return {
    title: `${chapter.title} — История вселенной — Энциклопедия Бронепехоты`,
    description,
    alternates: { canonical: `/encyclopedia/history/${chapter.slug}` },
    openGraph: pageOpenGraph({
      title: chapter.title,
      description,
      path: `/encyclopedia/history/${chapter.slug}`,
      type: 'article',
    }),
  };
}

export default async function HistoryChapterPage({ params }: PageProps) {
  const metas = getAllHistoryChapters();
  const index = metas.findIndex((m) => m.slug === params.slug);
  const chapter = index >= 0 ? await getHistoryChapter(params.slug) : null;
  if (!chapter) notFound();

  const prev = index > 0 ? metas[index - 1] : undefined;
  const next = index >= 0 && index < metas.length - 1 ? metas[index + 1] : undefined;
  // Same numbering rule as the hub: chrono chapters get NN, grouped sections '//' —
  // count only the chrono chapters up to this one (unified hub↔page counter).
  let chrono = 0;
  let chronoNumber: number | null = null;
  for (let i = 0; i <= index; i++) {
    if (!metas[i].group) chronoNumber = ++chrono;
  }
  if (chapter.group) chronoNumber = null;
  const description = chapterDescription(chapter);

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers — shared with the history hub / encyclopedia */}
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
        {/* Back to the longread TOC */}
        <nav aria-label="Навигация по истории" className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/encyclopedia/history"
            className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
          >
            <span className="text-lg">←</span>
            <span>К оглавлению</span>
          </Link>
          <p className="font-ibm-mono text-[10px] text-military-steel/50 tracking-wide hidden sm:block">
            {'// История вселенной Робогир'}
          </p>
        </nav>

        {/* Same dossier layout as the chapter section on the hub (the title
            becomes h1 here — on a standalone page the chapter IS the page):
            folder spine + uppercase title + the shared ChapterBody longread
            typography (65ch, drop cap, «// NN.M» h3 counters). */}
        <article
          data-testid="history-chapter-full"
          className="folded-paper military-corners relative pl-10 pr-5 py-6 mb-8"
        >
          <span aria-hidden className="history-spine">
            {chapter.group ? '//' : String(chronoNumber).padStart(2, '0')}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
            <h1 className="font-oswald text-xl md:text-2xl text-military-sand uppercase tracking-wide">
              {chapter.title}
            </h1>
            {chapter.era && (
              <span className="ml-auto font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60 whitespace-nowrap">
                {chapter.era}
              </span>
            )}
          </div>
          {/* Chapter body — build-time sanitized HTML (campaigns pipeline). */}
          <ChapterBody
            html={chapter.bodyHtml}
            chapterNumber={chronoNumber}
            chronicle={!chapter.group}
          />
          {/* Per-chapter attribution (audit legal checklist: the credit chip must
              live on EVERY chapter page, not only in the hub TOC). */}
          <LoreSourceRow loreAuthor={chapter.loreAuthor} credit={chapter.credit} className="mt-4" />
        </article>

        {/* prev/next by order — neighboring chapter titles */}
        <nav aria-label="Соседние главы" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prev ? (
            <Link
              href={`/encyclopedia/history/${prev.slug}`}
              data-testid="history-chapter-prev"
              className="folded-paper military-corners p-4 group"
            >
              <span className="block font-ibm-mono text-[10px] text-military-rust mb-1">
                ← предыдущая глава
              </span>
              <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/encyclopedia/history/${next.slug}`}
              data-testid="history-chapter-next"
              className="folded-paper military-corners p-4 group sm:text-right"
            >
              <span className="block font-ibm-mono text-[10px] text-military-rust mb-1">
                следующая глава →
              </span>
              <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                {next.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>

      {/* Article + publisher (the publisher @id resolves within this graph) */}
      <JsonLd
        data={[
          articleJsonLd({
            title: chapter.title,
            description,
            path: `/encyclopedia/history/${chapter.slug}`,
            authorName: chapter.credit?.author,
            isPartOfPath: '/encyclopedia/history',
          }),
          organizationJsonLd(),
        ]}
      />
    </main>
  );
}
