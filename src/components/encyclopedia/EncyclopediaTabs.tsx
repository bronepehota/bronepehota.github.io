'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Target, Flag, ScrollText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabDef {
  id: string;
  index: string;
  href: string;
  label: string;
  icon: typeof Shield;
  isActive: (pathname: string) => boolean;
}

const TABS: TabDef[] = [
  {
    id: 'units',
    index: '01',
    href: '/encyclopedia/units',
    label: 'Юниты',
    icon: Shield,
    // The catalog lives at /encyclopedia/units since the root became the
    // «Архив вселенной» hub; unit DETAIL pages (/encyclopedia/unit/[id])
    // belong to the catalog's tab as well.
    isActive: (p) => p.startsWith('/encyclopedia/units') || p.startsWith('/encyclopedia/unit/'),
  },
  {
    id: 'history',
    index: '02',
    href: '/encyclopedia/history',
    label: 'История',
    icon: ScrollText,
    isActive: (p) => p.startsWith('/encyclopedia/history'),
  },
  {
    id: 'world',
    index: '03',
    href: '/encyclopedia/world',
    label: 'Вселенная',
    icon: Globe,
    isActive: (p) => p.startsWith('/encyclopedia/world'),
  },
  {
    id: 'missions',
    index: '04',
    href: '/encyclopedia/missions',
    label: 'Миссии',
    icon: Target,
    isActive: (p) => p.startsWith('/encyclopedia/mission'),
  },
  {
    id: 'factions',
    index: '05',
    href: '/encyclopedia/factions',
    label: 'Фракции',
    icon: Flag,
    // Exact match — `startsWith('/encyclopedia/faction')` was a leftover from a
    // planned per-faction detail route (/encyclopedia/faction/[id]) that never shipped.
    isActive: (p) => p === '/encyclopedia/factions',
  },
];

/**
 * Encyclopedia mode selector — a prominent tactical segmented switch between
 * Units / History / World / Missions / Factions. Rendered in the header of
 * every encyclopedia section page so the five sections are equally
 * discoverable. (The hub root /encyclopedia shows no tabs — its folder grid
 * IS the section map; «Источники» stays hub/crumbs-only, priority 0.3.)
 *
 * `dense` trims the segment padding for the sticky console on /encyclopedia/units,
 * where the bar shares the screen with search + filters while scrolling.
 *
 * Mobile fit with 5 segments: below 400px the icons hide AND the indexes stay
 * hidden up to md; labels drop to 10px with no letter-spacing so «ВСЕЛЕННАЯ»
 * doesn't push its siblings out of the bar.
 */
export function EncyclopediaTabs({ className, dense = false }: { className?: string; dense?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className={cn(
          // 5 segments measure ~739px of min-content with icons+indexes+text-sm
          // — the old max-w-2xl (672px) cap clipped «Фракции», so the cap is
          // 3xl (768px) now. Below md the max-w-md cap keeps the mobile fit.
          'relative inline-flex items-stretch w-full max-w-md md:max-w-3xl',
          'rounded-xl overflow-hidden',
          'border border-military-steel/40 bg-military-charcoal/70 backdrop-blur-md',
          'shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)]',
        )}
        data-testid="encyclopedia-tabs"
      >
        {/* Corner ticks */}
        <span className="pointer-events-none absolute top-1 left-1 w-2.5 h-2.5 border-l border-t border-military-rust/50" />
        <span className="pointer-events-none absolute top-1 right-1 w-2.5 h-2.5 border-r border-t border-military-rust/50" />
        <span className="pointer-events-none absolute bottom-1 left-1 w-2.5 h-2.5 border-l border-b border-military-rust/50" />
        <span className="pointer-events-none absolute bottom-1 right-1 w-2.5 h-2.5 border-r border-b border-military-rust/50" />

        {/* Tiny mode label */}
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 px-2 bg-military-dark font-ibm-mono text-[8px] tracking-[0.3em] text-military-rust/60 uppercase">
          data mode
        </span>

        {TABS.map((tab, i) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              data-testid={`encyclopedia-tab-${tab.id}`}
              className={cn(
                'group relative flex-1 flex items-center justify-center',
                'gap-0.5 min-[400px]:gap-1.5 md:gap-2',
                dense ? 'py-2 px-0.5 min-[400px]:px-2 md:py-2.5 md:px-3' : 'py-3 px-0.5 min-[400px]:px-2 md:py-3.5 md:px-3',
                'font-russo uppercase tracking-normal min-[400px]:tracking-wide md:tracking-wider',
                'text-[10px] min-[400px]:text-xs md:text-sm',
                'transition-all duration-300',
                active
                  ? 'text-white'
                  : 'text-military-taupe/50 hover:text-military-sand hover:bg-military-steel/15',
              )}
              style={
                active
                  ? {
                      background: 'linear-gradient(180deg, rgba(245,158,11,0.28) 0%, rgba(234,88,12,0.12) 100%)',
                      boxShadow: 'inset 0 1px 0 rgba(245,158,11,0.35), 0 0 26px -6px rgba(234,88,12,0.55)',
                    }
                  : undefined
              }
            >
              {/* Divider between segments */}
              {i > 0 && (
                <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-px bg-military-steel/40" />
              )}

              {/* Index + icon */}
              <span className="flex items-center gap-0.5 min-[400px]:gap-1.5 md:gap-2">
                <span
                  className={cn(
                    // Indexes only from lg: at md the 5-segment min-content
                    // (measured 739px) would overflow the 2xl bar cap and clip
                    // the last label.
                    'hidden lg:inline font-ibm-mono text-[9px] tracking-widest',
                    active ? 'text-military-amber' : 'text-military-steel/60',
                  )}
                >
                  {tab.index}
                </span>
                {/* Icon hidden below 400px: 5 segments don't fit with icons on
                    narrow phones — labels take priority (scrollWidth check). */}
                <Icon
                  className={cn(
                    'hidden min-[400px]:block w-4 h-4 md:w-5 md:h-5 transition-transform duration-300',
                    active ? 'text-military-amber' : 'group-hover:scale-110',
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span>{tab.label}</span>
              </span>

              {/* Active status LED */}
              {active && (
                <span className="pointer-events-none absolute top-1.5 right-2 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-military-amber opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-military-amber" />
                </span>
              )}

              {/* Bottom accent bar on active */}
              {active && (
                <span className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-2/3 rounded-full bg-gradient-to-r from-transparent via-military-amber to-transparent" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
