import type { Metadata } from 'next';
import Link from 'next/link';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { absoluteUrl, pageOpenGraph } from '@/lib/seo';

const TITLE = 'Источники и права — Энциклопедия Бронепехота';
const DESCRIPTION =
  'Правовая сводка энциклопедии: тексты — авторские адаптации по мотивам официальной вселенной настольных игр «Бронепехота» / «Робогир» / «СтарСис» © ООО «Технолог»; независимые авторы и сообщества — с атрибуцией на страницах.';

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
 * «// ИСТОЧНИКИ И ПРАВА» — правовая сводка энциклопедии.
 *
 * РУЧНАЯ сводка (НЕ парсится из docs/ — он вне prod-сборки; этот файл и есть
 * источник истины для публики). Говорит три вещи: чья вселенная, чьи адаптации,
 * и куда писать правообладателям. Издания перечислены кратко (название/год);
 * полные выходные данные — в реестре разработчика docs/ENCYCLOPEDIA_LORE_SOURCES.md.
 */
export default function SourcesPage() {
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
        </header>

        <EncyclopediaTabs />

        {/* ——— Положение ——— */}
        <section className="folded-paper military-corners relative pl-10 pr-5 py-6 mt-8 mb-6" data-testid="sources-statement">
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

        {/* ——— Ключевые издания ——— */}
        <section className="mb-6" data-testid="sources-editions">
          <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80 pb-3 mb-3 border-b border-military-steel/25">
            {'// РЕЕСТР · КЛЮЧЕВЫЕ ИЗДАНИЯ'}
          </p>
          <div className="folded-paper military-corners p-5 md:p-6">
            <p className="text-[13px] text-military-taupe mb-4">
              Основа текстов энциклопедии — краткий перечень использованных изданий
              (полный реестр ведётся разработчиками):
            </p>
            <dl className="space-y-4">
              <div>
                <dt className="font-oswald text-military-sand uppercase tracking-wide text-sm mb-1.5">
                  Официальные издания «Технолога»
                </dt>
                <dd className="text-[13px] leading-relaxed text-military-taupe">
                  «Летопись: Звёздные герои» (2005) · «Новейшая история Империи» (2007) ·
                  «Легенды мира Робогир» (2007) · Справочник техники «Робогир» ·
                  наборы «СтарСис»: «Схватка на Гронте» и «Вторжение на Рун» (2001) ·
                  веб-справочник «Описание войск» (robogear.ru)
                </dd>
              </div>
              <div>
                <dt className="font-oswald text-military-sand uppercase tracking-wide text-sm mb-1.5">
                  Независимый автор — V.Chertischev
                </dt>
                <dd className="text-[13px] leading-relaxed text-military-taupe">
                  «Битва за Велиан» (2022) · «Имперские войны» · «Косары» ·
                  «Штурмовики Протектората»
                </dd>
              </div>
              <div>
                <dt className="font-oswald text-military-sand uppercase tracking-wide text-sm mb-1.5">
                  Творчество игроков
                </dt>
                <dd className="text-[13px] leading-relaxed text-military-taupe">
                  Рассказы «Клуба Robogear» (robogear.ru): Rasher, Ervin, Chebur, Анатолий,
                  Найтрос — публикуются как лор-выжимки, дословные тексты не переносятся
                </dd>
              </div>
            </dl>
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
