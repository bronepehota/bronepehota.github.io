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
 * ONE DOM, layout switched by breakpoints (no JS hook, no duplicated testids):
 * below md the bar is a 5-column grid of vertical cells — icon on top, label
 * under it, everything centred, both always visible (the old inline-flex row
 * had a ~739px min-content and below 400px resorted to hiding icons and
 * squeezing labels — the grid ends those compromises). From md up it is the
 * classic segmented row, unchanged. The active LED exists on the row only (it
 * reads as noise on the grid); the bottom accent bar spans the full cell on
 * mobile. `dense` on mobile becomes an icon strip where only the ACTIVE cell
 * keeps its label (inactive labels are `hidden md:inline`).
 */
export function EncyclopediaTabs({ className, dense = false }: { className?: string; dense?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className={cn(
          // One DOM, two layouts: a 5-column grid of vertical cells on phones
          // (grid-cols-5 — nothing hides, nothing squeezes), the segmented row
          // from md up. On the row 5 segments measure ~739px of min-content
          // with icons+indexes+text-sm — the old max-w-2xl (672px) cap clipped
          // «Фракции», so the cap is 3xl (768px).
          'relative grid grid-cols-5 md:flex md:items-stretch w-full md:max-w-3xl',
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
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 px-2 bg-military-dark font-ibm-mono text-[8px] tracking-[0.3em] text-military-rust uppercase">
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
                // Mobile: vertical cell — icon over label, both centred, always
                // rendered. Desktop: the segmented row (padding unchanged).
                'group relative flex flex-col items-center justify-center text-center',
                !dense && 'gap-1 px-1 py-2.5 min-h-[56px]',
                dense && 'gap-0.5 px-1 py-1.5 min-h-[44px]',
                'md:flex-1 md:flex-row md:gap-2 md:px-3 md:min-h-0',
                dense ? 'md:py-2.5' : 'md:py-3.5',
                'font-russo uppercase tracking-normal md:tracking-wider',
                'text-[10px] md:text-sm',
                'transition-all duration-300',
                active
                  ? 'text-white'
                  : 'text-military-taupe/80 hover:text-military-sand hover:bg-military-steel/15',
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
              {/* Divider between segments — row layout only; the grid separates
                  cells on its own */}
              {i > 0 && (
                <span className="pointer-events-none hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-px bg-military-steel/40" />
              )}

              {/* Indexes only from lg (unchanged) */}
              <span
                className={cn(
                  'hidden lg:inline font-ibm-mono text-[9px] tracking-widest',
                  active ? 'text-military-amber' : 'text-military-taupe/80',
                )}
              >
                {tab.index}
              </span>

              <Icon
                className={cn(
                  'w-5 h-5 transition-transform duration-300',
                  active ? 'text-military-amber' : 'group-hover:scale-110',
                )}
                strokeWidth={active ? 2.4 : 2}
              />

              <span
                className={cn(
                  'leading-tight md:leading-normal',
                  // dense on mobile: only the active cell keeps its label
                  dense && !active && 'hidden md:inline',
                )}
              >
                {tab.label}
              </span>

              {/* Active status LED — row layout only (noise on the mobile grid) */}
              {active && (
                <span className="pointer-events-none hidden md:flex absolute top-1.5 right-2 h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-military-amber opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-military-amber" />
                </span>
              )}

              {/* Bottom accent bar on active — full cell width on mobile */}
              {active && (
                <span className="pointer-events-none absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-military-amber to-transparent md:left-1/2 md:w-2/3 md:-translate-x-1/2" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
