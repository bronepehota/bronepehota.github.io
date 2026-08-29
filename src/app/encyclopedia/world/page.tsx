import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllWorldEntries, WORLD_KIND_LABELS, type WorldKind } from '@/lib/world';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { pageOpenGraph } from '@/lib/seo';

const TITLE = 'Алфавит вселенной — Энциклопедия Бронепехоты';
const DESCRIPTION =
  'Персоны, локации, битвы, термины и корабли флотов вселенной Бронепехоты (Робогир): лорд Кросс, Империя Полярис, Доминион, линкор «Экзарх», носитель «Асгард», крейсер «Йорк» и другие сущности канона — с досье и связями с фракциями и хрониками.';

/**
 * «Алфавит вселенной» — индекс сущностных страниц (/encyclopedia/world/[slug]).
 * Табы энциклопедии в этой фазе не трогаем: вход на индекс — mono-строка
 * «// АЛФАВИТ ВСЕЛЕННОЙ →» в оглавлении Истории (+ сами URL страниц из поиска
 * и sitemap). Записи идут по `order`, затем по алфавиту — гриф kind даёт
 * ориентировку «кто это» без захода в досье.
 */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/encyclopedia/world' },
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/world',
  }),
};

/** Плашка-гриф kind в списке — цветовая кодировка по разделу канона.
 *  Корабли — светлый «стальной корпус» (sand): отличим и от бронзы персон,
 *  и от ржавчины битв. */
const KIND_BADGE: Record<WorldKind, string> = {
  person: 'border-military-amber/40 text-military-amber/90',
  location: 'border-military-steel/40 text-military-steel/80',
  battle: 'border-military-rust/50 text-military-rust/90',
  term: 'border-military-taupe/40 text-military-taupe/80',
  ship: 'border-military-sand/40 text-military-sand/90',
};

export default function WorldIndexPage() {
  const entries = getAllWorldEntries();
  // Счётчики по kind — архивная строка «N ДОСЬЕ» в шапке индекса.
  const byKind = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});

  return (
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14">
        {/* Шапка-досье индекса */}
        <header
          data-testid="world-index"
          className="folded-paper military-corners p-5 md:p-8 mb-6"
        >
          <p className="font-ibm-mono text-[10px] md:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.25em] text-military-rust/80 pb-3 mb-4 border-b border-military-steel/25">
            {`ДЕЛО № RG-4530 · ПРИЛОЖЕНИЕ · ЗАПИСЕЙ: ${entries.length}`}
          </p>
          <h1
            data-testid="world-index-title"
            className="font-russo font-black text-3xl md:text-5xl text-white military-text-gradient uppercase tracking-wide mb-4"
          >
            Алфавит вселенной
          </h1>
          <p className="max-w-[60ch] text-sm md:text-base text-military-taupe leading-relaxed">
            {`Персоны, локации, битвы, термины и корабли флотов канона — справочная картотека к «Истории вселенной». Каждая запись — досье со связями на юниты, фракции, главы и хроники войн.`}
          </p>
          <p className="mt-4 font-ibm-mono text-[10px] text-military-steel/60">
            {`// ${Object.entries(byKind)
              .map(([kind, n]) => `${WORLD_KIND_LABELS[kind as WorldKind]}: ${n}`)
              .join(' · ')}`}
          </p>
        </header>

        <EncyclopediaTabs className="mb-8" />

        {/* Картотека записей */}
        <nav aria-label="Алфавит вселенной" data-testid="world-index-list">
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/encyclopedia/world/${entry.slug}`}
                  data-testid="world-index-entry"
                  className="folded-paper military-corners p-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 group"
                >
                  <span
                    className={`inline-block font-ibm-mono text-[9px] uppercase tracking-[0.25em] border px-2 py-0.5 ${
                      KIND_BADGE[entry.kind]
                    }`}
                  >
                    {`// ${WORLD_KIND_LABELS[entry.kind]}`}
                  </span>
                  <span className="font-oswald text-lg text-military-sand group-hover:text-military-amber transition-colors">
                    {entry.title}
                  </span>
                  {entry.subtitle && (
                    <span className="text-sm text-military-taupe/80 basis-full sm:basis-auto">
                      {entry.subtitle}
                    </span>
                  )}
                  {entry.era && (
                    <span className="ml-auto shrink-0 whitespace-nowrap font-ibm-mono text-[10px] text-military-steel/50 pl-2">
                      {entry.era}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
