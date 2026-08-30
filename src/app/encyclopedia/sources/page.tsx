import type { Metadata } from 'next';
import Link from 'next/link';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { absoluteUrl, pageOpenGraph } from '@/lib/seo';
import { KIND_STAMPS, getCatalogBySection } from '@/lib/sources-catalog';

const TITLE = 'Источники и права — Энциклопедия Бронепехота';
const DESCRIPTION =
  'Каталог произведений-первоисточников энциклопедии Бронепехота: официальные издания «Технолога», книги V.Chertischev, материалы сообществ Star System и рассказы игроков robogear.ru — краткое описание каждого произведения и что взято из него в энциклопедию. Тексты — авторские адаптации; права на вселенную принадлежат ООО «Технолог».';

// PUBLIC page: canonical, no noindex (crawlers are welcome).
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/encyclopedia/sources') },
  openGraph: pageOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/encyclopedia/sources',
  }),
};

/**
 * «// ИСТОЧНИКИ И ПРАВА» — каталог произведений + правовая сводка.
 *
 * Каталог (сверху) собирается из src/data/sources-catalog.json — по секциям
 * «Официальные издания / Книги V.Chertischev / Материалы сообществ (VK) /
 * Творчество игроков robogear.ru». Правовая часть (внизу) — РУЧНАЯ сводка
 * (НЕ парсится из docs/ — он вне prod-сборки; файл и есть источник истины для
 * публики). Полные выходные данные и инвентаризация — в реестре разработчика
 * docs/ENCYCLOPEDIA_LORE_SOURCES.md.
 */
export default function SourcesPage() {
  const sections = getCatalogBySection();

  return (
    <main className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers — shared with the encyclopedia pages */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 md:py-14 pb-16">
        {/* Back to the encyclopedia */}
        <nav className="mb-6">
          <Link
            href="/encyclopedia"
            className="inline-flex items-center gap-2 font-ibm-mono text-xs text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
          >
            <span className="text-lg">←</span>
            <span>К энциклопедии</span>
          </Link>
        </nav>

        {/* Requisites header — dossier idiom */}
        <header className="mb-6 md:mb-8" data-testid="sources-header">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-3 mb-4 border-b border-military-steel/25">
            <span aria-hidden className="font-ibm-mono text-[10px] text-military-rust">
              {'//'}
            </span>
            <p className="font-ibm-mono text-[11px] uppercase tracking-[0.25em] text-military-sand">
              ИСТОЧНИКИ И ПРАВА
            </p>
          </div>
          <h1 className="font-russo font-black military-text-gradient text-3xl md:text-4xl uppercase tracking-wide">
            Источники и права
          </h1>
          <p className="mt-3 max-w-[65ch] text-sm md:text-[15px] leading-relaxed text-military-taupe">
            Каталог произведений, из которых собрана энциклопедия: что это за
            книга или рассказ, и что именно взято из неё в досье вселенной.
            Дословные тексты не воспроизводятся — везде наши адаптации
            (правовая сводка внизу страницы).
          </p>
        </header>

        <EncyclopediaTabs />

        {/* ——— Каталог произведений ——— */}
        <div className="mt-8 space-y-10" data-testid="sources-editions">
          {sections.map(({ section, entries }) => (
            <section key={section.id} data-testid={`sources-section-${section.id}`}>
              <div className="pb-3 mb-4 border-b border-military-steel/25">
                <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
                  {`// ${section.title.toUpperCase()}`}
                </p>
                <p className="mt-1.5 text-[13px] text-military-taupe/70">{section.note}</p>
              </div>
              <div className="space-y-4">
                {entries.map((entry) => (
                  <article
                    key={entry.id}
                    data-testid="source-card"
                    className="folded-paper military-corners relative pl-10 pr-5 py-5"
                  >
                    <span aria-hidden className="history-spine">
                      {'//'}
                    </span>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                      {/* Гриф по типу произведения — «// РОМАН», «// ХРОНИКА»… */}
                      <span className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-rust shrink-0">
                        {`// ${KIND_STAMPS[entry.kind]}`}
                      </span>
                      <h2 className="font-oswald text-military-sand uppercase tracking-wide text-base md:text-lg">
                        {entry.title}
                      </h2>
                    </div>
                    {/* Реквизиты: автор · год · эпоха произведения */}
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-2.5 font-ibm-mono text-[11px] text-military-steel/80">
                      {entry.author && <span className="text-military-taupe">{entry.author}</span>}
                      {entry.year !== undefined && <span>{entry.year}</span>}
                      {entry.era && <span className="text-military-amber/70">{entry.era}</span>}
                    </p>
                    <p className="text-[13px] md:text-sm leading-relaxed text-military-taupe max-w-[65ch]">
                      {entry.description}
                    </p>
                    {/* Что взято в энциклопедию */}
                    <ul className="mt-3 space-y-1">
                      {entry.takenTo.map((item) => (
                        <li
                          key={item}
                          className="flex items-baseline gap-2 text-[12px] leading-snug text-military-sand/70"
                        >
                          <span aria-hidden className="font-ibm-mono text-military-amber/70 shrink-0">
                            →
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-steel/60 hover:text-military-amber transition-colors"
                      >
                        Читать на robogear.ru ↗
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ——— Положение ——— */}
        <section
          className="folded-paper military-corners relative pl-10 pr-5 py-6 mt-10 mb-6"
          data-testid="sources-statement"
        >
          <span aria-hidden className="history-spine">
            {'//'}
          </span>
          <div className="space-y-4 text-military-sand/80 leading-relaxed text-sm md:text-[15px] max-w-[65ch]">
            <p>
              Энциклопедия «Бронепехота» — некоммерческий справочник сообщества игроков.
              Все тексты раздела — <strong className="text-military-sand">авторские адаптации</strong> по мотивам
              официальной вселенной настольных игр «Бронепехота» / «Робогир» (Robogear) /
              «СтарСис» (Star Systems). Права на вселенную, названия, торговые марки и
              оригинальные издания принадлежат правообладателю — ООО «Технолог» (tehnolog.ru).
            </p>
            <p>
              Материалы независимых авторов — писателя V.Chertischev, сообществ
              Star System и «Звёздные Системы», авторов миниатюр и покрасов, игроков
              robogear.ru — публикуются <strong className="text-military-sand">с атрибуцией</strong>:
              на каждой странице главы, хроники или досье юнита стоит блок
              «// ИСТОЧНИК» с именем автора, произведением и ссылкой. Контент сообществ
              помечается знаком «АВБ» (Альтернативная Версия Бронепехоты).
            </p>
            <p>
              <strong className="text-military-sand">Полные оригинальные тексты не воспроизводятся.</strong>{' '}
              Из источников берутся сведения о событиях, технике и формированиях; изложение
              переписано своими словами. Анти-копипаст-норма проекта — не более 11 совпадающих
              слов подряд с первоисточником — проверяется автоматически при каждой сборке.
            </p>
          </div>
        </section>

        {/* ——— Контакт ——— */}
        <section className="folded-paper military-corners p-5 md:p-6" data-testid="sources-contact">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 mb-3">
            {'// КОНТАКТ ДЛЯ ПРАВООБЛАДАТЕЛЕЙ'}
          </p>
          <p className="text-sm md:text-[15px] leading-relaxed text-military-sand/80 max-w-[65ch]">
            Вы правообладатель и считаете, что материал энциклопедии затрагивает ваши
            права? Напишите нам — поправим атрибуцию или уберём материал:
          </p>
          <a
            href="https://vk.ru/lastbpcoder"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 mt-4 min-h-[44px] px-5 border border-military-amber/50 hover:border-military-amber transition-colors font-ibm-mono text-xs uppercase tracking-widest text-military-amber touch-manipulation"
          >
            Сообщество ВКонтакте →
            <span className="text-military-steel/60 normal-case">vk.ru/lastbpcoder</span>
          </a>
        </section>
      </div>
    </main>
  );
}
