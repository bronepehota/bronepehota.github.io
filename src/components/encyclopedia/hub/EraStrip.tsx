'use client';

interface EraPeriod {
  /** Год периода (метка на линейке). */
  year: number;
  /** slug карты периода (инвентарь invasion-maps). */
  slug: string;
  /** Подпись для тултипа/доступности. */
  label: string;
}

interface EraStripProps {
  /** First year on record in the archive (history chapters + campaigns). */
  from: number | null;
  /** Last year on record. */
  to: number | null;
  /** Периоды войн на линейке — с onSelect линейка становится переключателем
   *  витрины «// ТЕАТРЫ ВОЙН» (решение владельца: лента эпох = переключатель). */
  periods?: EraPeriod[];
  /** Активный период (подсветка узла). */
  activeSlug?: string;
  onSelect?: (slug: string) => void;
}

/**
 * Лента эпох хаба. Без `onSelect` — тихая статичная линейка (как прежде);
 * с периодами и onSelect — годы войн превращаются в кнопки: клик переключает
 * карту и описание периода в витрине «// ТЕАТРЫ ВОЙН» ( карта — прямо над
 * линейкой; при клике из-под края экрана подтягиваем витрину в кадр).
 *
 * This is deliberately NOT the sticky EraRibbon (that one binds to scroll
 * timelines of the history page); the hub is short.
 */
export function EraStrip({ from, to, periods, activeSlug, onSelect }: EraStripProps) {
  if (from === null || to === null) return null;
  const interactive = Boolean(onSelect && periods && periods.length > 0);
  const span = Math.max(to - from, 1);

  return (
    <div
      data-testid="hub-era-strip"
      className="flex items-center gap-3 px-1 py-1"
      role={interactive ? 'group' : 'img'}
      aria-label={`Эпохи архива: ${from}–${to}${interactive ? ' — клик по году войны показывает карту периода' : ''}`}
    >
      <span className="font-ibm-mono text-[10px] md:text-[11px] tabular-nums text-military-amber/90 shrink-0">
        {from}
      </span>
      <div className="relative flex-1 h-6" {...(!interactive && { 'aria-hidden': true })}>
        {/* Базовая линейка */}
        <span className="absolute top-1/2 left-0 right-0 h-px bg-military-steel/30" />
        {/* Quarter ticks — ruler marks */}
        {[0, 25, 50, 75].map((left) => (
          <span
            key={left}
            className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-military-steel/40"
            style={{ left: `${left}%` }}
          />
        ))}
        {interactive ? (
          /* Годы войн — кнопки-узлы, переключают витрину театров */
          periods!.map((p) => {
            const isActive = p.slug === activeSlug;
            const left = Math.min(Math.max(((p.year - from) / span) * 100, 4), 96);
            return (
              <button
                key={p.slug}
                type="button"
                data-testid="era-period-node"
                aria-pressed={isActive}
                title={p.label}
                onClick={() => onSelect!(p.slug)}
                className="group absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 touch-manipulation"
                style={{ left: `${left}%` }}
              >
                <span
                  className={
                    isActive
                      ? 'h-2.5 w-2.5 rotate-45 border border-military-amber bg-military-amber shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                      : 'h-2 w-2 rotate-45 border border-military-rust/80 bg-military-dark group-hover:border-military-amber transition-colors'
                  }
                />
                <span
                  className={
                    'font-ibm-mono text-[9px] tabular-nums tracking-wide transition-colors ' +
                    (isActive
                      ? 'text-military-amber'
                      : 'text-military-rust group-hover:text-military-amber')
                  }
                >
                  {p.year}
                </span>
              </button>
            );
          })
        ) : (
          /* The present era — center diamond (статичный режим) */
          <span className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-military-rust/80 bg-military-dark" />
        )}
      </div>
      <span className="font-ibm-mono text-[10px] md:text-[11px] tabular-nums text-military-amber/90 shrink-0">
        {to}
      </span>
    </div>
  );
}
