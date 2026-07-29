'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe, Quote, Users, Shield, Zap, Skull, Flag, Star, Anchor, ExternalLink } from 'lucide-react';
import type { EncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { getUnitsForFaction } from '@/lib/encyclopedia-registry';
import { FactionLogo } from '@/components/FactionLogo';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import { resolveFactionProvenance } from '@/lib/provenance';
import { EncyclopediaTabs } from './EncyclopediaTabs';
import { ProvenanceRow } from './AttributionLabel';
import { cn } from '@/lib/utils';

interface FactionsListPageProps {
  factions: EncyclopediaFaction[];
}

export default function FactionsListPage({ factions }: FactionsListPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => setIsLoaded(true), []);

  // Stable display order: polaris, protectorate, mercenaries, rutenia
  const order = ['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet'];
  // Fallback glyph when a faction has no logo image (e.g. mercenaries)
  const symbolIcon: Record<string, typeof Shield> = { Shield, Zap, Skull, Flag, Star, Anchor };
  const sorted = [...factions].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  );

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)',
      }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="relative py-6 md:py-20 px-4 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/60 to-transparent animate-pulse" />

          <div className="max-w-7xl mx-auto">
            <Link
              href="/app"
              className={cn(
                'inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm',
                'text-military-rust/60 hover:text-military-amber transition-colors',
                'tracking-widest uppercase mb-4 md:mb-8',
                'fade-in-up opacity-0', isLoaded && 'opacity-100',
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>В приложение</span>
            </Link>

            <div className="text-center mb-6 md:mb-10">
              <h1
                className={cn(
                  'font-russo font-black military-text-gradient',
                  'text-2xl sm:text-4xl md:text-6xl lg:text-7xl',
                  'mb-4 tracking-wide',
                  'fade-in-up opacity-0', isLoaded && 'opacity-100',
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
              >
                ФРАКЦИИ
              </h1>
              <div
                className={cn('flex items-center justify-center gap-4', 'fade-in-up opacity-0', isLoaded && 'opacity-100')}
                style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
              >
                <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-military-rust/50" />
                <p className="font-ibm-mono text-xs md:text-sm text-military-amber/80 tracking-[0.2em] uppercase">
                  Стороны конфликта
                </p>
                <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-military-rust/50" />
              </div>
            </div>

            {/* Mode selector */}
            <div
              className={cn('max-w-4xl mx-auto', 'fade-in-up opacity-0', isLoaded && 'opacity-100')}
              style={{ animationFillMode: 'forwards', animationDelay: '0.35s' }}
            >
              <EncyclopediaTabs />
            </div>
          </div>

          <div className="max-w-4xl mx-auto mt-12 military-divider" />
        </header>

        {/* Faction dossier cards */}
        <main className="px-4 pb-20">
          <div className="max-w-5xl mx-auto space-y-6" data-testid="faction-grid">
            {sorted.map((faction, index) => {
              const colors = getFactionColors(faction.id);
              const unitCount = getUnitsForFaction(faction.id).length;
              return (
                <section
                  key={faction.id}
                  data-testid={`encyclopedia-faction-card-${faction.id}`}
                  className={cn(
                    'relative folded-paper military-corners overflow-hidden',
                    'fade-in-up opacity-0', isLoaded && 'opacity-100',
                  )}
                  style={{
                    animationFillMode: 'forwards',
                    animationDelay: `${0.45 + index * 0.1}s`,
                  }}
                >
                  {/* Color side rail + glow */}
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: `linear-gradient(180deg, ${colors.primary}, transparent)` }}
                  />
                  <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{ background: `radial-gradient(120% 80% at 0% 0%, ${colors.primary}14, transparent 60%)` }}
                  />

                  <div className="relative p-5 md:p-7 flex flex-col md:flex-row gap-5 md:gap-7">
                    {/* Emblem */}
                    <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 md:w-44 shrink-0">
                      <div
                        className="relative w-20 h-20 md:w-28 md:h-28 flex items-center justify-center rounded-lg overflow-hidden"
                        style={{
                          backgroundColor: `${colors.primary}14`,
                          border: `1px solid ${colors.primary}66`,
                          boxShadow: `0 0 30px -8px ${colors.primary}80`,
                          color: colors.primary,
                        }}
                      >
                        <div className="absolute inset-2">
                          <FactionLogo
                            faction={faction.id}
                            className="w-full h-full"
                            fallback={symbolIcon[faction.symbol ?? 'Flag']}
                            fallbackClassName="w-full h-full"
                          />
                        </div>
                        {/* Scanline */}
                        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.04)_50%)] bg-[length:100%_4px]" />
                      </div>
                      <div className="md:hidden flex-1" />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3 flex-wrap mb-1">
                        <h2 className="font-russo font-black text-2xl md:text-3xl text-white">
                          {faction.name}
                        </h2>
                      </div>

                      {/* Motto */}
                      {faction.motto && (
                        <p
                          className="font-oswald text-sm md:text-base italic mb-3 flex items-center gap-2"
                          style={{ color: colors.primary }}
                        >
                          <Quote className="w-3.5 h-3.5 shrink-0" />
                          {faction.motto}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {faction.homeWorld && (
                          <span className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] px-2.5 py-1 rounded bg-military-charcoal/70 border border-military-steel/40 text-military-taupe uppercase tracking-wider">
                            <Globe className="w-3 h-3 text-military-rust" />
                            {faction.homeWorld}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] px-2.5 py-1 rounded bg-military-charcoal/70 border border-military-steel/40 text-military-taupe uppercase tracking-wider">
                          <Users className="w-3 h-3 text-military-amber" />
                          {unitCount} {unitCount === 1 ? 'юнит' : 'юнитов'}
                        </span>
                        <ProvenanceRow
                          provenance={resolveFactionProvenance(faction)}
                          compact
                          withHeader={false}
                        />
                      </div>

                      {faction.description && (
                        <p className="text-military-sand/75 leading-relaxed text-sm md:text-base">
                          {faction.description}
                        </p>
                      )}

                      <div className="mt-4">
                        <Link
                          href={`/encyclopedia?faction=${faction.id}`}
                          className="inline-flex items-center gap-2 font-ibm-mono text-xs uppercase tracking-wider transition-opacity hover:opacity-80"
                          style={{ color: colors.primary }}
                        >
                          <span>Отряды фракции «{factionDisplayNames[faction.id] ?? faction.id}»</span>
                          <span>→</span>
                        </Link>
                        {faction.siteUrl && (
                          <a
                            href={faction.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 font-ibm-mono text-[11px] uppercase tracking-wider text-military-taupe/70 transition-colors hover:text-military-amber"
                            title={faction.siteUrl}
                          >
                            <ExternalLink className="w-3 h-3" /> Официальный сайт
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        <div className="max-w-7xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
