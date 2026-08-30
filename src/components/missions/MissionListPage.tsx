'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';
import type { Mission, Campaign } from '@/lib/mission-types';
import { MissionCard } from './MissionCard';
import { EncyclopediaTabs } from '@/components/encyclopedia/EncyclopediaTabs';
import { cn } from '@/lib/utils';

interface MissionListPageProps {
  missions: Mission[];
  campaigns: Campaign[];
}

export default function MissionListPage({ missions, campaigns }: MissionListPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsLoaded(true), []);

  // Group missions by campaign, preserving campaign order; unknown campaigns go last.
  const orderedCampaigns: (Campaign | { id: string; name: string; intro?: string })[] = [
    ...campaigns,
    { id: '__uncategorized__', name: 'Прочие', intro: undefined },
  ];
  const groups = orderedCampaigns
    .map((c) => ({
      campaign: c,
      missions: missions.filter((m) =>
        c.id === '__uncategorized__'
          ? !campaigns.some((camp) => camp.id === m.campaign)
          : m.campaign === c.id,
      ),
    }))
    .filter((g) => g.missions.length > 0);

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)',
      }} />

      <div className="relative z-10">
        {/* Hero Header */}
        <header className="relative py-6 md:py-20 px-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/60 to-transparent animate-pulse" />

          <div className="max-w-7xl mx-auto">
            {/* Top row: back to the app + hub wordmark — the archive hub must be
                reachable from every section (review UX). Same nav-link styling. */}
            <div
              className={cn(
                'flex items-center justify-between gap-4 mb-4 md:mb-8',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100',
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <Link
                href="/app"
                className={cn(
                  'inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm',
                  'text-military-rust/60 hover:text-military-amber transition-colors',
                  'tracking-widest uppercase',
                )}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                <span>В приложение</span>
              </Link>
              <Link
                href="/encyclopedia"
                aria-label="На главную энциклопедии"
                className="inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
              >
                <span>Энциклопедия</span>
                <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Main title */}
            <div className="text-center mb-4 md:mb-10">
              <h1
                className={cn(
                  'font-russo font-black military-text-gradient',
                  'text-2xl sm:text-4xl md:text-6xl lg:text-7xl',
                  'mb-4 tracking-wide',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100',
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
              >
                МИССИИ
              </h1>
              <div
                className={cn(
                  'flex items-center justify-center gap-4',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100',
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
              >
                <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-military-rust/50" />
                <p className="font-ibm-mono text-xs md:text-sm text-military-amber/80 tracking-[0.2em] uppercase">
                  Боевые сценарии
                </p>
                <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-military-rust/50" />
              </div>
            </div>

            {/* Mode selector — Units / Missions / Factions */}
            <div
              className={cn(
                'max-w-4xl mx-auto mb-8 md:mb-10',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100',
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.35s' }}
            >
              <EncyclopediaTabs />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-12 military-divider" />
        </header>

        {/* Mission groups */}
        <main className="px-4 pb-20">
          <div className="max-w-7xl mx-auto space-y-12">
            {groups.map((group, gi) => (
              <section
                key={group.campaign.id}
                data-testid={`mission-group-${group.campaign.id}`}
                className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
                style={{ animationFillMode: 'forwards', animationDelay: `${0.4 + gi * 0.1}s` }}
              >
                {/* Scenario-set header. Deliberately NOT «кампания»: that word is
                    reserved for the lore chronicles of «Хроники войн» (history #wars)
                    — these JSON groups are scenario boxes («Цербер», «Классические»). */}
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <Target className="w-5 h-5 text-military-rust" />
                  <h2 className="font-oswald text-xl md:text-2xl text-military-sand uppercase tracking-wide">
                    Набор сценариев «{group.campaign.name}»
                  </h2>
                </div>
                {group.campaign.intro && (
                  <p className="font-oswald text-sm md:text-base text-military-taupe/80 leading-relaxed mb-6 md:mb-8 max-w-3xl">
                    {group.campaign.intro}
                  </p>
                )}

                {/* Cards grid */}
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                  data-testid="mission-grid"
                >
                  {group.missions.map((mission, index) => (
                    <div
                      key={mission.id}
                      className={cn('fade-in-up opacity-0', isLoaded && 'opacity-100')}
                      style={{ animationFillMode: 'forwards', animationDelay: `${0.5 + (index % 6) * 0.05}s` }}
                    >
                      <MissionCard mission={mission} />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>

        <div className="max-w-7xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
