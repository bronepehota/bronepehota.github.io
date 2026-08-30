import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import {
  buildHistoryFlow,
  estimateReadingMinutes,
  getAllHistoryChapters,
  getHistoryChapter,
  historyCentury,
  historyEraYears,
} from '@/lib/history';
import { getAllCampaigns, warsEraSpan } from '@/lib/campaigns';
import { CampaignsBlock } from '@/components/encyclopedia/CampaignsBlock';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { LoreSourceRow } from '@/components/encyclopedia/LoreSourceRow';
import { ChapterBody } from '@/components/encyclopedia/history/ChapterBody';
import { EraRibbon } from '@/components/encyclopedia/history/EraRibbon';
import { HistoryDivider } from '@/components/encyclopedia/history/HistoryDivider';
import { TocCopyLink } from '@/components/encyclopedia/history/TocCopyLink';
import { BackToToc } from '@/components/encyclopedia/history/BackToToc';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'История вселенной Робогир — Энциклопедия Бронепехоты';
const DESCRIPTION =
  'Хроника вселенной Робогир (Robogear) — общего мира настольных игр «Робогир» и «Бронепехота»: от Тунгусского артефакта и первых прыжков к звёздам до Доминиона, Новейшей истории Империи, Легендарных Лордов и хроник войн.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia/history' },
  // A page-level openGraph object REPLACES the root-layout one (Next merges
  // top-level fields only) — pageOpenGraph reassembles the full set, including
  // the site og:image card, and adds this page's own og:url.
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/history',
  }),
};

/** Nested single-name timeline-scope wrappers (see scopeRules note above). */
function TimelineScope({ count, children }: { count: number; children: ReactNode }) {
  let node = <>{children}</>;
  for (let i = count - 1; i >= 0; i--) {
    node = <div className={`history-scope-${i}`}>{node}</div>;
  }
  return <>{node}</>;
}

export default async function HistoryPage() {
  const metas = getAllHistoryChapters();
  const chapters = (await Promise.all(metas.map((m) => getHistoryChapter(m.slug)))).filter(
    (c): c is NonNullable<typeof c> => c !== null,
  );
  // «Хроники войн» live as the closing section of the history page (#wars) —
  // chronological order, the standalone /campaigns list redirects here.
  const campaigns = getAllCampaigns();
  // Era span of the whole wars block (TOC badge): min–max year across ALL
  // campaigns, e.g. 4451–4546 (order-based first/last used to yield «4451–4451»).
  const warsEra = warsEraSpan(campaigns);

  // ——— «ДЕЛО RG-4530» showcase data (all computed at build time) ———
  const flow = buildHistoryFlow(metas);
  const century = historyCentury(metas, warsEra);
  // Unified chrono numbering (one counter for the TOC AND the sections —
  // they used to be two separate counters that matched only by luck).
  const chronoNumber = new Map<string, number>();
  let seq = 0;
  for (const c of chapters) if (!c.group) chronoNumber.set(c.slug, ++seq);
  const firstChronoSlug = chapters.find((c) => !c.group)?.slug;
  const readingMinutes = Math.max(
    5,
    Math.round(estimateReadingMinutes(chapters.map((c) => c.bodyHtml)) / 5) * 5,
  );
  // «Свидетельств» = кампании; лор-сводки рассказов игроков живут отдельным
  // каталогом /encyclopedia/sources (решение владельца 2026-08-30) — сюда не считаются.
  const testimonies = campaigns.length;
  const years = historyEraYears(metas);
  if (warsEra) years.push(...(warsEra.match(/\b\d{4}\b/g) ?? []).map(Number));
  // Guard: Math.min(...[]) is Infinity — with no eras on record the lead
  // paragraph simply drops the year clause instead of printing «Infinity».
  const firstYear = years.length ? Math.min(...years) : null;
  const spanYears = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '';
  const spanCenturies = years.length ? Math.round((Math.max(...years) - Math.min(...years)) / 100) : 0;

  const stats = [
    { value: century, unit: 'ВЕК', caption: 'эпоха летописи' },
    // Meaningful hardcode: the two superpowers the whole chronicle is about.
    { value: 2, unit: 'ДЕРЖАВЫ', caption: 'Империя Полярис и Протекторат' },
    { value: chapters.length, unit: 'ДОСЬЕ', caption: 'глав и справок' },
    { value: testimonies, unit: 'СВИДЕТЕЛЬСТВ', caption: 'хроники войн' },
  ];

  // timeline-scope lifts each named view-timeline of the zone wrappers to a
  // common ancestor so the sticky-ribbon ticks can bind to them. Chromium
  // gotcha: multi-name `timeline-scope` values are ignored — hence one nested
  // wrapper per timeline name, each scoped by its own generated rule below.
  const scopeRules = flow.ticks
    .map((_, i) => `.history-scope-${i} { timeline-scope: --hist-tick-${i}; }`)
    .join('\n');

  return (
    // overflow-x-clip (not -hidden): full-bleed era dividers must not scroll
    // horizontally, but overflow:hidden would create a scroll container and
    // kill the sticky era ribbon inside.
    <main className="min-h-screen bg-military-dark relative overflow-x-clip">
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      {/* Scroll-timeline scope: generated rules (see scopeRules) + one nested
          wrapper per name so ribbon ticks can reference the zone timelines. */}
      <style>{scopeRules}</style>
      <TimelineScope count={flow.ticks.length}>
        <div className="relative z-10 pb-20">
        {/* ——— Обложка дела: dossier cover instead of a form-like header ——— */}
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-14">
          {/* Hub entry — the archive root must stay reachable from the section
              pages (review UX). Same compact mono nav as the chapter pages. */}
          <nav
            aria-label="Навигация по энциклопедии"
            className="mb-4 flex items-center justify-between gap-4"
          >
            <Link
              href="/encyclopedia"
              aria-label="На главную энциклопедии"
              className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust hover:text-military-amber transition-colors tracking-widest uppercase"
            >
              <span className="text-lg">←</span>
              <span>Энциклопедия</span>
            </Link>
          </nav>
          <header
            data-testid="history-cover"
            className="relative folded-paper military-corners p-5 md:p-8 mb-6 overflow-hidden"
          >
            {/* Denser cardboard than the body pages (audit: «обложка плотнее листов») */}
            <div aria-hidden className="absolute inset-0 diagonal-stripes opacity-60 pointer-events-none" />
            <span
              aria-hidden
              className="absolute top-4 right-4 rotate-6 border-2 border-military-rust/40 px-2 py-0.5 font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust select-none hidden sm:block"
            >
              ХРОНИКА {spanYears}
            </span>
            <div className="relative">
              <p className="font-ibm-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-military-rust pb-3 mb-4 border-b border-military-steel/25">
                {`ДЕЛО № RG-4530 · ЛЕТОПИСЬ ДОМИНИОНА · ЛИСТОВ: ${chapters.length}`}
              </p>
              <h1
                data-testid="history-title"
                className="font-russo font-black text-3xl md:text-5xl text-white military-text-gradient uppercase tracking-wide mb-4"
              >
                История вселенной
              </h1>
              <p className="max-w-[60ch] text-sm md:text-base text-military-taupe leading-relaxed mb-5">
                {`Общий мир настольных игр «Робогир» и «Бронепехота» — вселенная СтарСис (Star Systems):`}
                {firstYear !== null &&
                  ` от Тунгусского артефакта ${firstYear} года — к звёздным державам ${century}-го века.`}
                {` За ${spanCenturies} веков человечество разделили две сверхдержавы — Империя Полярис и Протекторат Доминиона; между ними — наёмники, корпорации и шагающие боевые машины.`}
              </p>
              <dl
                data-testid="history-stats"
                className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-military-steel/25 border border-military-steel/25 mb-5"
              >
                {stats.map((s) => (
                  <div
                    key={s.unit}
                    data-testid={`history-stat-${s.unit}`}
                    className="bg-military-dark/80 px-3 py-3"
                  >
                    <dt className="font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-rust mb-1.5">
                      {s.unit}
                    </dt>
                    <dd className="font-ibm-mono tabular-nums text-2xl md:text-3xl leading-none text-military-amber">
                      {s.value}
                    </dd>
                    <p className="text-[10px] text-military-taupe/80 mt-1.5 leading-snug">{s.caption}</p>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {firstChronoSlug && (
                  <a
                    href={`#${firstChronoSlug}`}
                    data-testid="history-read-cta"
                    className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-6 bg-military-rust hover:bg-military-amber text-military-dark font-russo font-bold uppercase tracking-widest text-sm transition-colors touch-manipulation"
                  >
                    Читать с начала
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                )}
                <a
                  href="#wars"
                  className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-taupe/80 hover:text-military-amber transition-colors py-2"
                >
                  Хроники войн →
                </a>
              </div>
              <p className="mt-4 font-ibm-mono text-[10px] text-military-taupe/80 leading-relaxed">
                {'// Тексты — сжатые адаптации; полные первоисточники — в блоках «// ИСТОЧНИК» каждой главы'}
              </p>
            </div>
          </header>
          <EncyclopediaTabs />
        </div>

        {/* ——— Sticky лента эпох: navigation + reading progress (CSS scroll-driven,
            static ruler fallback) — height capped at 32px mobile ——— */}
        <EraRibbon ticks={flow.ticks} className="mt-4" />

        {/* ——— TOC as an archival index ——— */}
        <div className="max-w-4xl mx-auto px-4">
          <nav
            id="history-toc"
            data-testid="history-toc"
            className="folded-paper military-corners p-5 md:p-6 mb-10 md:mb-14 scroll-mt-12"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4 pb-3 border-b border-military-steel/25">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
                {'// ОГЛАВЛЕНИЕ · АРХИВНЫЙ ИНДЕКС'}
              </p>
              <p
                data-testid="history-reading-meta"
                className="font-ibm-mono text-[10px] tabular-nums text-military-taupe/80 whitespace-nowrap"
              >
                {`${chapters.length} ДОСЬЕ · ≈${readingMinutes} МИН`}
              </p>
            </div>
            <ol className="md:grid md:grid-cols-2 md:gap-x-8">
              {(() => {
                let lastGroupKey: string | undefined;
                return chapters.map((c) => {
                  const groupKey = c.group ?? '__chrono';
                  const showHeader = groupKey !== lastGroupKey;
                  lastGroupKey = groupKey;
                  const number = chronoNumber.get(c.slug);
                  return (
                    <li key={c.slug} className={showHeader ? 'pt-2 mt-2 border-t border-military-steel/20' : ''}>
                      {showHeader && (
                        <p
                          data-testid={`history-group-${c.group ?? 'ХРОНИКА'}`}
                          className="inline-block font-ibm-mono text-[9px] uppercase tracking-[0.25em] text-military-amber/70 border border-military-rust/30 px-2 py-0.5 mb-1"
                        >
                          {`// ${c.group ?? 'ХРОНИКА'}`}
                        </p>
                      )}
                      <div className="flex items-center">
                        <a
                          href={`#${c.slug}`}
                          className="flex flex-1 items-baseline gap-3 py-2.5 group"
                        >
                          <span className="font-ibm-mono text-[10px] text-military-rust shrink-0">
                            {c.group ? '//' : String(number).padStart(2, '0')}
                          </span>
                          <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                            {c.title}
                          </span>
                          {c.era && (
                            <span className="ml-auto shrink-0 whitespace-nowrap font-ibm-mono text-[10px] text-military-taupe/80 pl-2">
                              {c.era}
                            </span>
                          )}
                        </a>
                        <TocCopyLink slug={c.slug} title={c.title} />
                      </div>
                    </li>
                  );
                });
              })()}
              {/* Wars chronicle — not a chapter; separated entry anchoring #wars */}
              <li className="pt-2 mt-2 border-t border-military-steel/20">
                <div className="flex items-center">
                  <a href="#wars" className="flex flex-1 items-baseline gap-3 py-2.5 group">
                    <span className="font-ibm-mono text-[10px] text-military-rust shrink-0">{'//'}</span>
                    <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
                      Хроники войн
                    </span>
                    {warsEra && (
                      <span className="ml-auto shrink-0 whitespace-nowrap font-ibm-mono text-[10px] text-military-taupe/80 pl-2">
                        {warsEra}
                      </span>
                    )}
                  </a>
                </div>
              </li>
            </ol>
            {/* Алфавит вселенной — сущностные страницы (персоны/локации/термины),
                вход с Истории маленькой mono-строкой после блока войн */}
            <Link
              href="/encyclopedia/world"
              data-testid="world-index-link"
              className="block mt-3 pt-3 border-t border-military-steel/20 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-taupe/80 hover:text-military-amber transition-colors"
            >
              {'// АЛФАВИТ ВСЕЛЕННОЙ →'}
            </Link>
            {/* Правовая сводка — сноска той же mono-строкой (адаптации, © Технолог) */}
            <Link
              href="/encyclopedia/sources"
              className="block mt-1 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-taupe/80 hover:text-military-amber transition-colors"
            >
              {'// ИСТОЧНИКИ И ПРАВА →'}
            </Link>
          </nav>
        </div>

        {/* ——— Reading zones: full-bleed era/group divider + the chapters of the
            era. The zone wrapper carries the named view-timeline (tick N lights
            up on the ribbon while zone N is on screen — CSS scroll-driven).
            SEO NOTE: the hub↔chapter content duplication is deliberate — the hub is
            the reading experience, each chapter also has its own indexable page
            (/encyclopedia/history/[slug], self-canonical + Article JSON-LD). ——— */}
        {flow.zones.map((zone) => {
          const zoneChapters = zone.slugs
            .map((slug) => chapters.find((c) => c.slug === slug))
            .filter((c): c is (typeof chapters)[number] => c !== undefined);
          return (
            <div
              key={zone.tickIndex}
              style={{ viewTimelineName: `--hist-tick-${zone.tickIndex}` } as CSSProperties}
              data-testid={`history-zone-${zone.tickIndex}`}
            >
              <HistoryDivider info={zone.divider} />
              {zoneChapters.map((c) => {
                const number = chronoNumber.get(c.slug);
                return (
                  <div key={c.slug} className="max-w-4xl mx-auto px-4 mb-8">
                    <section
                      id={c.slug}
                      data-testid="history-chapter"
                      className="folded-paper military-corners relative pl-10 pr-5 py-6 scroll-mt-12 [content-visibility:auto] [contain-intrinsic-size:auto_1500px]"
                    >
                      <span aria-hidden className="history-spine">
                        {c.group ? '//' : String(number).padStart(2, '0')}
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
                        <h2 className="font-oswald text-xl md:text-2xl text-military-sand uppercase tracking-wide">
                          {c.title}
                        </h2>
                        <span className="ml-auto flex items-baseline gap-3 whitespace-nowrap">
                          {c.era && (
                            <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-taupe/80">
                              {c.era}
                            </span>
                          )}
                          {/* Unobtrusive chapter permalink — own URL for saving/sharing */}
                          <Link
                            href={`/encyclopedia/history/${c.slug}`}
                            data-testid="chapter-permalink"
                            className="font-ibm-mono text-[10px] text-military-taupe/80 hover:text-military-amber transition-colors"
                          >
                            ⤴ отдельная страница
                          </Link>
                        </span>
                      </div>
                      {/* Chapter body — build-time sanitized HTML, editorial longread
                          typography (65ch, drop cap, «// NN.M» h3 counters). */}
                      <ChapterBody
                        html={c.bodyHtml}
                        chapterNumber={number ?? null}
                        chronicle={!c.group}
                      />
                      {/* Source row — «Летопись» chapters cite the official edition;
                          chapter VIII cites the «Косары» novel (non-Технолог → carries
                          the mini АВБ mark). Renders nothing without attribution. */}
                      <LoreSourceRow loreAuthor={c.loreAuthor} credit={c.credit} className="mt-4" />
                    </section>
                  </div>
                );
              })}
              {/* The wars zone wraps <CampaignsBlock> — campaigns as the closing
                  section (anchor #wars, stays last on the page). */}
              {zone.slugs.length === 0 && (
                <div className="max-w-4xl mx-auto px-4">
                  <CampaignsBlock campaigns={campaigns} />
                </div>
              )}
            </div>
          );
        })}

        {/* Фонд писателей — лор-сводки рассказов игроков убраны из хроники
            (факты уже в досье юнитов) и живут каталогом первоисточников. */}
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/encyclopedia/sources"
            data-testid="stories-catalog-link"
            className="block pt-3 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-taupe/80 hover:text-military-amber transition-colors"
          >
            {'// ТВОРЧЕСТВО ИГРОКОВ → КАТАЛОГ ИСТОЧНИКОВ'}
          </Link>
        </div>
        </div>
      </TimelineScope>

      {/* Docked «▲ ОГЛАВЛЕНИЕ» console — appears once the TOC is scrolled past */}
      <BackToToc />
    </main>
  );
}
