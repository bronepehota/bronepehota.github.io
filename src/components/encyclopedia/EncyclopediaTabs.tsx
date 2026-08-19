'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Target, Flag, ScrollText } from 'lucide-react';
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
    href: '/encyclopedia',
    label: 'Юниты',
    icon: Shield,
    isActive: (p) => p === '/encyclopedia' || p.startsWith('/encyclopedia/unit'),
  },
  {
    id: 'missions',
    index: '02',
    href: '/encyclopedia/missions',
    label: 'Миссии',
    icon: Target,
    isActive: (p) => p.startsWith('/encyclopedia/mission'),
  },
  {
    id: 'factions',
    index: '03',
    href: '/encyclopedia/factions',
    label: 'Фракции',
    icon: Flag,
    isActive: (p) => p.startsWith('/encyclopedia/faction'),
  },
  {
    id: 'history',
    index: '04',
    href: '/encyclopedia/history',
    label: 'История',
    icon: ScrollText,
    isActive: (p) => p.startsWith('/encyclopedia/history'),
  },
];

/**
 * Encyclopedia mode selector — a prominent tactical segmented switch between
 * Units / Missions / Factions / History. Rendered in the header of every
 * encyclopedia list page so the four sections are equally discoverable.
 */
export function EncyclopediaTabs({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn('flex justify-center', className)}>
      <div
        className={cn(
          // md: (≥768px) cell min-content grows to ~600px (icons + index + px-4 +
          // text-sm) — cap the bar at 2xl (672px) so the 4th segment is never
          // clipped by the container's overflow-hidden. Below md the 448px cap
          // keeps the mobile fit (icons hidden <400px) intact.
          'relative inline-flex items-stretch w-full max-w-md md:max-w-2xl',
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
                'group relative flex-1 flex items-center justify-center gap-2',
                'py-3 px-2 md:py-3.5 md:px-4',
                'font-russo uppercase tracking-wider text-xs md:text-sm',
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
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'hidden sm:inline font-ibm-mono text-[9px] tracking-widest',
                    active ? 'text-military-amber' : 'text-military-steel/60',
                  )}
                >
                  {tab.index}
                </span>
                {/* Icon hidden below 400px: 4 segments don't fit with icons on
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
