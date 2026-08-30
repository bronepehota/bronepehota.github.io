import type { CSSProperties } from 'react';
import type { HistoryEraTick } from '@/lib/history';
import { cn } from '@/lib/utils';

interface EraRibbonProps {
  ticks: HistoryEraTick[];
  className?: string;
}

/**
 * Sticky era ribbon (≤32px mobile) — the signature element of «ДЕЛО RG-4530».
 *
 * Doubles as navigation (tap a mark → jump to the era-opening chapter / group
 * divider / #wars) and as reading progress:
 *  - the rust fill crawls along the ruler via `animation-timeline: scroll()`;
 *  - a tick lights up while ITS divider is on screen via `animation-timeline:
 *    view()` (named timelines, one per divider — inline styles below).
 * Both are CSS-only; browsers without scroll-driven animations get a static,
 * fully clickable ruler. `prefers-reduced-motion` turns both off (globals.css).
 */
export function EraRibbon({ ticks, className }: EraRibbonProps) {
  return (
    <div data-testid="history-era-ribbon" className={cn('sticky top-0 z-30', className)}>
      {/* h-8 (border-box, includes the 1px border) = exactly 32px mobile cap */}
      <div className="relative h-8 bg-military-dark/95 backdrop-blur-sm border-b border-military-rust/25 overflow-x-auto">
        <nav
          aria-label="Лента эпох истории"
          className="flex items-center h-full min-w-max px-1.5 mx-auto"
        >
          {ticks.map((t, i) => (
            <span key={t.href + t.label} className="flex items-center">
              {i > 0 && (
                <span aria-hidden className="font-ibm-mono text-[8px] text-military-rust px-0.5 select-none">
                  ·
                </span>
              )}
              <a
                href={t.href}
                style={{ animationTimeline: `--hist-tick-${i}` } as CSSProperties}
                data-testid={`era-tick-${i}`}
                className={cn(
                  'era-tick--sd flex items-center h-full px-2.5 -mb-px whitespace-nowrap',
                  'font-ibm-mono text-[10px] tracking-[0.15em] uppercase',
                  'text-military-taupe/80 hover:text-military-amber transition-colors',
                  'border-b-2 border-transparent',
                )}
              >
                {t.label}
              </a>
            </span>
          ))}
        </nav>
        {/* Progress ruler — dim track always, rust fill only where
            scroll-driven animations are supported (width stays 0 otherwise). */}
        <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px bg-military-steel/25" />
        <div
          aria-hidden
          className="era-ribbon-progress absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-military-rust via-military-amber to-military-rust"
        />
      </div>
    </div>
  );
}
