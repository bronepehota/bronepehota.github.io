'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { getFactions } from '@/lib/encyclopedia-registry';
import { orderedFactions } from '@/lib/faction-hierarchy';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import type { LorePageRef } from '@/lib/unit-search';
import { LoreGuide } from '../LoreGuide';
import { InvasionMapShowcase } from '../history/InvasionMaps';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { HubCover } from './HubCover';
import { HubSearch } from './HubSearch';
import { EraStrip } from './EraStrip';
import { HubSections } from './HubSections';
import { HubFresh } from './HubFresh';

/** Ledger counts for the cover/folders — computed from the data at build time. */
export interface HubCounts {
  chapters: number;
  campaigns: number;
  world: number;
  units: number;
  missions: number;
  sources: number;
  factions: number;
}

export interface HubEra {
  from: number | null;
  to: number | null;
}

interface ArchiveHubProps {
  initialUnits: EncyclopediaUnit[];
  lorePages: LorePageRef[];
  counts: HubCounts;
  era: HubEra;
}

/** Legacy catalog deep-link params — any of them forwards to /encyclopedia/units. */
const FORWARD_PARAMS = ['faction', 'type', 'sculptor', 'q'] as const;

/**
 * «АРХИВ ВСЕЛЕННОЙ» — the encyclopedia root: a showcase cover for the whole
 * universe (history, wars, dossiers, units) in the «ДЕЛА RG-4530» language.
 * The unit catalog itself lives at /encyclopedia/units.
 *
 * Backward compatibility: for years the root WAS the catalog and external
 * links carry its filter params (?faction=&type=&sculptor=&q=). On mount we
 * detect those and router.replace to the catalog with the query preserved
 * verbatim — the hub never flashes (it stays invisible until the check passes,
 * mirroring the page-load cascade the other pages already use).
 */
export default function ArchiveHub({ initialUnits, lorePages, counts, era }: ArchiveHubProps) {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [forwarded, setForwarded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (FORWARD_PARAMS.some((k) => params.get(k))) {
      // Verbatim query preservation — no re-encoding/reordering round-trip.
      setForwarded(true);
      router.replace(`/encyclopedia/units${window.location.search}`);
      return;
    }
    setIsLoaded(true);
  }, [router]);

  // Faction dots for the units folder — data-driven, hierarchy order.
  const factionDots = useMemo(() => {
    const present = new Set(initialUnits.map((u) => u.faction));
    return orderedFactions(
      getFactions().filter((f) => present.has(f.id)).map((f) => ({ id: f.id, parent: f.parent })),
    ).map((f) => ({
      id: f.id,
      label: factionDisplayNames[f.id] ?? f.id,
      color: getFactionColors(f.id).primary,
    }));
  }, [initialUnits]);

  // While the forward check resolves (or the replace lands), render a quiet
  // stub — the hub content must not flash before the redirect.
  if (forwarded) {
    return <div className="min-h-screen bg-military-dark" aria-hidden />;
  }

  return (
    <div className="min-h-screen bg-military-dark relative overflow-x-clip">
      {/* Background layers — same dossier atmosphere as the sibling pages */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)',
      }} />

      <div className="relative z-10">
        {/* Compact header — the page's only H1 */}
        <header className="px-4 pt-5 pb-3">
          <div className="mx-auto max-w-4xl">
            <div
              className={cn('flex items-center justify-between gap-4', 'fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.05s' }}
            >
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] text-military-rust hover:text-military-amber transition-colors tracking-widest uppercase whitespace-nowrap"
              >
                <span>←</span>
                <span className="hidden sm:inline">В приложение</span>
                <span className="sm:hidden">Назад</span>
              </Link>

              <div className="text-center leading-none">
                <h1 className="font-russo text-sm md:text-base tracking-[0.25em] text-military-sand">
                  ЭНЦИКЛОПЕДИЯ
                </h1>
                <div className="mt-0.5 font-ibm-mono text-[8px] md:text-[9px] text-military-rust tracking-[0.3em] uppercase">
                  {'// Архив вселенной'}
                </div>
              </div>

              {/* Plain nav shortcut — the battle banner below is the tracked CTA */}
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] text-military-amber/70 hover:text-military-amber transition-colors tracking-widest uppercase whitespace-nowrap"
              >
                <span className="hidden sm:inline">Штаб</span>
                <span className="sm:hidden">Штаб</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Мост в режим боя — тонкая строка-телетайп, вся кликабельна (те же
            data-testid, что были на корне-каталоге) */}
        <div data-testid="encyclopedia-battle-banner" className="mx-auto max-w-4xl px-4">
          <Link
            href="/app"
            onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_main' })}
            data-testid="encyclopedia-battle-banner-link"
            className="flex items-center gap-3 min-h-[44px] px-2 border border-military-rust/30 hover:border-military-amber/60 transition-colors group touch-manipulation no-underline"
          >
            <span className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust shrink-0">
              {'// РЕЖИМ БОЯ'}
            </span>
            <span className="hidden sm:inline font-ibm-mono text-[10px] md:text-xs text-military-taupe/80 truncate">
              любой отряд — в строй
            </span>
            <span className="flex-1" />
            <span className="font-russo text-[10px] md:text-xs uppercase tracking-widest text-military-rust group-hover:text-military-amber transition-colors shrink-0">
              ШТАБ →
            </span>
          </Link>
        </div>

        <main className="px-4 pt-5 pb-16">
          <div className="mx-auto max-w-4xl space-y-6">
            {/* Обложка дела: гриф + счётчики из данных + поиск по вселенной */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.15s' }}
            >
              <HubCover counts={counts}>
                <HubSearch units={initialUnits} lorePages={lorePages} />
              </HubCover>
            </div>

            {/* Театры войн: карта РЯДОМ с описанием периода — визуальный якорь
                хаба (полная галерея — на хабе Истории, #maps). */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.22s' }}
            >
              <InvasionMapShowcase />
            </div>

            {/* Лента эпох — статичная полоса времени архива */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
            >
              <EraStrip from={era.from} to={era.to} />
            </div>

            {/* Папки-разделы */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.36s' }}
            >
              <HubSections counts={counts} factionDots={factionDots} />
            </div>

            {/* Рукописная витрина пополнений */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.38s' }}
            >
              <HubFresh />
            </div>

            {/* Футер-гид для новичков (переехал со страницы юнитов) */}
            <div
              className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.44s' }}
            >
              <LoreGuide unitsHref="/encyclopedia/units" />
            </div>
          </div>
        </main>

        <div className="mx-auto max-w-4xl">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
