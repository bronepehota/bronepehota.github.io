import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { HubCounts } from './ArchiveHub';
import { cn } from '@/lib/utils';

export interface FactionDot {
  id: string;
  label: string;
  color: string;
}

interface HubSectionsProps {
  counts: HubCounts;
  /** Colored faction dots for the units folder — data-driven (from units). */
  factionDots: FactionDot[];
}

interface FolderDef {
  id: string;
  index: string;
  title: string;
  href: string;
  caption: string;
}

/**
 * «// РАЗДЕЛЫ АРХИВА» — seven folder entries into the archive. The ЮНИТЫ
 * folder is first among equals: same cell, but accented (amber rail + tint +
 * faction dots) — players arrive for the cards, the archive explains them.
 */
export function HubSections({ counts, factionDots }: HubSectionsProps) {
  const folders: FolderDef[] = [
    {
      id: 'history',
      index: '01',
      title: 'История',
      href: '/encyclopedia/history',
      caption: `Летопись · ${counts.chapters} глав`,
    },
    {
      id: 'wars',
      index: '02',
      title: 'Хроники войн',
      href: '/encyclopedia/history#wars',
      caption: `${counts.campaigns} кампаний · эры`,
    },
    {
      id: 'world',
      index: '03',
      title: 'Вселенная',
      href: '/encyclopedia/world',
      caption: `${counts.world} досье`,
    },
    {
      id: 'units',
      index: '04',
      title: 'Юниты',
      href: '/encyclopedia/units',
      caption: `${counts.units} карт · ${counts.factions} фракций`,
    },
    {
      id: 'factions',
      index: '05',
      title: 'Фракции',
      href: '/encyclopedia/factions',
      caption: `${counts.factions} сторон конфликта`,
    },
    {
      id: 'missions',
      index: '06',
      title: 'Миссии',
      href: '/encyclopedia/missions',
      caption: `${counts.missions} сценариев`,
    },
    {
      id: 'sources',
      index: '07',
      title: 'Источники',
      href: '/encyclopedia/sources',
      caption: `${counts.sources} произведений`,
    },
  ];

  return (
    <section aria-label="Разделы архива">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
        <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-amber/80">
          {'// РАЗДЕЛЫ АРХИВА'}
        </p>
        <p className="font-ibm-mono text-[10px] tabular-nums text-military-taupe/80 whitespace-nowrap">
          {`${folders.length} ПАПОК`}
        </p>
      </div>

      <div
        data-testid="hub-sections"
        className="grid grid-cols-2 gap-2.5 md:gap-3 items-stretch"
      >
        {folders.map((f) => {
          const featured = f.id === 'units';
          return (
            <Link
              key={f.id}
              href={f.href}
              data-testid={`hub-section-${f.id}`}
              className={cn(
                'group relative folded-paper military-corners flex flex-col p-3.5 min-h-[104px] no-underline touch-manipulation',
                featured &&
                  // First among equals: amber rail + tint (border color lives
                  // in .folded-paper, so the accent rides on inner layers).
                  'min-h-[124px]',
              )}
            >
              {featured && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ background: 'linear-gradient(180deg, #F59E0B, rgba(245,158,11,0.05))' }}
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(120% 80% at 0% 0%, rgba(245,158,11,0.10), transparent 60%)',
                    }}
                  />
                </>
              )}

              <span
                className={cn(
                  'relative font-ibm-mono text-[9px] tracking-[0.25em] uppercase',
                  featured ? 'text-military-amber' : 'text-military-rust',
                )}
              >
                {f.index}
              </span>
              <span
                className={cn(
                  'relative font-russo uppercase tracking-wide mt-1',
                  featured ? 'text-base md:text-lg text-white' : 'text-sm md:text-base text-military-sand',
                  'group-hover:text-military-amber transition-colors',
                )}
              >
                {f.title}
              </span>

              {/* Faction dots — the units folder carries the conflict's colors */}
              {featured && (
                <span aria-hidden className="relative flex flex-wrap items-center gap-1.5 mt-2 max-w-[220px]">
                  {factionDots.map((d) => (
                    <span
                      key={d.id}
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                      title={d.label}
                    />
                  ))}
                </span>
              )}

              <span className="relative mt-auto pt-2 font-ibm-mono text-[9px] md:text-[10px] uppercase tracking-wider text-military-taupe/80">
                {f.caption}
              </span>

              <ArrowUpRight
                aria-hidden
                className={cn(
                  'absolute top-2.5 right-2.5 w-3.5 h-3.5 transition-all',
                  featured
                    ? 'text-military-amber/70 group-hover:text-military-amber'
                    : 'text-military-taupe/80 group-hover:text-military-amber',
                )}
                strokeWidth={2}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
