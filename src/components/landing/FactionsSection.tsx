'use client';

import { Shield, Zap, Skull, Star, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFactions } from '@/lib/encyclopedia-registry';
import { orderedFactions, getParent } from '@/lib/faction-hierarchy';
import { factionDisplayNames } from '@/lib/faction-colors';
import { FactionLogo } from '@/components/FactionLogo';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { resolveFactionProvenance, isAlternativeVersion } from '@/lib/provenance';
import { ALTERNATIVE_VERSION_HINT } from '@/components/encyclopedia/AttributionLabel';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface FactionsSectionProps {
  className?: string;
}

const iconMap = {
  Shield,
  Zap,
  Skull,
  Star,
  Anchor,
} as const;

const allFactions = orderedFactions(getFactions());

export default function FactionsSection({ className }: FactionsSectionProps) {
  return (
    <section
      className={cn(
        'relative py-14 md:py-32 px-4 md:px-8 overflow-hidden',
        'bg-gradient-to-b from-military-dark to-military-charcoal',
        className
      )}
    >
      {/* Section header */}
      <div className="max-w-6xl mx-auto mb-16 md:mb-24">
        <div className="fade-in-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <h2 className="font-russo text-3xl md:text-5xl text-center military-text-gradient mb-4">
            ФРАКЦИИ
          </h2>
          <div className="military-divider max-w-md mx-auto" />
          <p className="mt-4 text-center text-sm text-military-sand/60 max-w-2xl mx-auto">
            Вселенная общая с настольной игрой «Робогир» (Robogear) — СтарСис
            (Star Systems): Протекторат, Полярис и боевая техника — те же.
          </p>
        </div>
      </div>

      {/* Factions grid — single column on phones (cards are content-rich),
          multi-column from small tablets up. Was grid-cols-2 which crammed
          long lore + motto rows into 152px and overflowed on mobile. */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8">
        {allFactions.map((faction, index) => {
          const IconComponent = iconMap[faction.symbol as keyof typeof iconMap];
          // АВБ — marks community (non-Технолог) factions: Рутения, Мёртвый Флот.
          const isAltVersion = isAlternativeVersion(resolveFactionProvenance(faction));

          return (
            <Link
              key={faction.id}
              href="/encyclopedia/factions"
              data-testid="landing-faction-card"
              onClick={() => trackEvent('battle_entry', { from: 'landing_factions' })}
              className={cn(
                'folded-paper military-corners p-4 md:p-6 block no-underline',
                'group cursor-pointer transition-all duration-300',
                'fade-in-up opacity-0',
                `stagger-${index + 1}`
              )}
              style={{
                animationFillMode: 'forwards',
                borderColor: `${faction.color}20`,
              }}
            >
              {/* Faction header with icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="font-ibm-mono text-xs text-military-rust/60 mb-2">
                    FACTION_{(index + 1).toString().padStart(2, '0')}
                  </div>
                  <h3
                    className="font-russo font-bold text-xl md:text-2xl mb-1"
                    style={{ color: faction.color }}
                  >
                    {faction.name}
                  </h3>
                  {faction.parent && (
                    <div
                      className="font-ibm-mono text-[10px] uppercase tracking-wider mt-1"
                      style={{ color: getParent(faction.id, allFactions)?.color ?? faction.color }}
                    >
                      Подфракция «{factionDisplayNames[getParent(faction.id, allFactions)?.id ?? ''] ?? ''}»
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    'relative flex items-center justify-center rounded-lg overflow-hidden shrink-0',
                    'w-12 h-12 md:w-14 md:h-14 group-hover:scale-110 transition-transform duration-300'
                  )}
                  style={{
                    backgroundColor: `${faction.color}1f`,
                    border: `1px solid ${faction.color}55`,
                    boxShadow: `0 0 22px -8px ${faction.color}80`,
                  }}
                >
                  <FactionLogo
                    faction={faction.id}
                    className="w-3/4 h-3/4"
                    fallback={IconComponent ?? Shield}
                    fallbackClassName="w-3/4 h-3/4"
                  />
                  {/* Scanline texture — HUD/military feel over the emblem */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.04)_50%)] bg-[length:100%_4px] pointer-events-none" />
                </div>
              </div>

              {/* Faction teaser — короткое описание с переносами (полный лор в энциклопедии) */}
              <p className="font-oswald text-sm md:text-base text-military-taupe leading-snug mb-4">
                {faction.shortDescription ?? faction.description}
              </p>

              {/* Компактная мета: девиз одной строкой + мир/переход — без рваных justify-строк.
                  Доп. отступ справа у АВБ-фракций, чтобы бейдж не налез на «отряды →». */}
              <div className={cn('border-t border-military-steel/30 pt-3', isAltVersion && 'pr-10')}>
                <p
                  className="font-oswald text-sm md:text-base font-semibold truncate"
                  style={{ color: faction.color }}
                >
                  «{faction.motto}»
                </p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-ibm-mono text-[10px] md:text-[11px] text-military-steel/60 uppercase tracking-wide truncate">
                    {faction.homeWorld}
                  </span>
                  <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/50 group-hover:text-military-amber transition-colors shrink-0">
                    отряды →
                  </span>
                </div>
              </div>

              {/* Decorative corner accent */}
              <div
                className="absolute bottom-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, transparent 50%, ${faction.color}30 50%)`,
                }}
              />

              {/* АВБ mark — bottom-right corner, only for community (non-Технолог) factions */}
              {isAltVersion && (
                <div
                  title={ALTERNATIVE_VERSION_HINT}
                  className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-sm border border-emerald-500/40 bg-military-dark/80 px-1.5 py-0.5 backdrop-blur-sm"
                >
                  <GitHubPagesImage
                    src="/images/credits/avb.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="shrink-0"
                  />
                  <span className="font-ibm-mono text-[9px] uppercase tracking-wider text-emerald-300">
                    АВБ
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto mt-16 md:mt-24">
        <div className="military-divider" />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-military-rust/10 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-military-steel/10 rounded-full" />
      </div>
    </section>
  );
}
