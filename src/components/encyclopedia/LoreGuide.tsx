import Link from 'next/link';

/**
 * «// С ЧЕГО НАЧАТЬ» — новичковый путь по вселенной (IA-аудит, нах. 2.3:
 * «вход в лор — каталог юнитов, а не сюжет»). Компактная досье-карточка:
 * хронология чтения от первой главы Летописи — к войнам, фракциям и досье
 * техники. Живёт на хабе «Архив вселенной» (/encyclopedia) футером.
 *
 * Последний шаг («юниты») — ссылка, когда гид стоит НЕ на странице юнитов
 * (`unitsHref`, хаб); передавайте его всегда, кроме рендера внутри каталога.
 *
 * Статична и без хуков; слаг первой главы зафиксирован осознанно (гид —
 * рукописная навигация, как «Читать с начала» на хабе Истории).
 */
export function LoreGuide({ unitsHref }: { unitsHref?: string }) {
  return (
    <section data-testid="lore-guide" className="folded-paper military-corners px-4 py-3 md:px-5 md:py-4">
      <p className="font-ibm-mono text-[10px] text-military-rust/70 uppercase tracking-wider mb-1.5">
        {'// С ЧЕГО НАЧАТЬ'}
      </p>
      <p className="text-[13px] leading-relaxed text-military-taupe mb-2.5">
        Вселенная читается как хроника — от первой главы к войнам, фракциям и досье техники:
      </p>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-ibm-mono text-[10px] md:text-[11px] uppercase tracking-wide">
        <li>
          <Link
            href="/encyclopedia/history#tungusskiy-artefakt"
            data-testid="lore-guide-chapter"
            className="inline-flex items-baseline gap-1.5 text-military-amber/90 hover:text-military-amber transition-colors"
          >
            <span className="text-military-rust/60">01</span>
            Тунгусский артефакт
          </Link>
        </li>
        <li aria-hidden className="text-military-steel/40">→</li>
        <li>
          <Link
            href="/encyclopedia/history"
            data-testid="lore-guide-history"
            className="text-military-amber/90 hover:text-military-amber transition-colors"
          >
            вся Летопись
          </Link>
        </li>
        <li aria-hidden className="text-military-steel/40">→</li>
        <li>
          <Link
            href="/encyclopedia/history#wars"
            data-testid="lore-guide-wars"
            className="text-military-amber/90 hover:text-military-amber transition-colors"
          >
            Хроники войн
          </Link>
        </li>
        <li aria-hidden className="text-military-steel/40">→</li>
        <li>
          <Link
            href="/encyclopedia/factions"
            data-testid="lore-guide-factions"
            className="text-military-amber/90 hover:text-military-amber transition-colors"
          >
            фракции
          </Link>
        </li>
        <li aria-hidden className="text-military-steel/40">→</li>
        {/* On the hub every step is a link into the archive; only a guide
            rendered ON the units page would mark the last step «вы здесь». */}
        {unitsHref ? (
          // <li> обязательна: <ol> допускает только li-потомков (ревью хаба, Major)
          <li>
            <Link
              href={unitsHref}
              data-testid="lore-guide-units"
              className="text-military-amber/90 hover:text-military-amber transition-colors"
            >
              юниты
            </Link>
          </li>
        ) : (
          <li className="text-military-steel/60" aria-current="step">
            юниты <span className="text-military-rust/60">· вы здесь</span>
          </li>
        )}
      </ol>
    </section>
  );
}

export default LoreGuide;
