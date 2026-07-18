'use client';

import { Shield, Zap, Skull, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

interface FactionsSectionProps {
  className?: string;
}

const iconMap = {
  Shield,
  Zap,
  Skull,
  Star,
} as const;

const factionIds = ['polaris', 'protectorate', 'mercenaries', 'rutenia'] as const;

export default function FactionsSection({ className }: FactionsSectionProps) {
  return (
    <section
      className={cn(
        'relative py-20 md:py-32 px-4 md:px-8 overflow-hidden',
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
        </div>
      </div>

      {/* Factions grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {factionIds.map((factionId, index) => {
          const faction = getEncyclopediaFaction(factionId);
          if (!faction) return null;

          const IconComponent = iconMap[faction.symbol as keyof typeof iconMap];

          return (
            <div
              key={faction.id}
              className={cn(
                'folded-paper military-corners p-6 md:p-8',
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
              <div className="flex items-start justify-between mb-6">
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
                </div>
                <div
                  className={cn(
                    'p-3 rounded-lg transition-all duration-300',
                    'bg-opacity-10 group-hover:scale-110'
                  )}
                  style={{ backgroundColor: `${faction.color}20` }}
                >
                  {IconComponent && (
                    <IconComponent
                      className="w-6 h-6 md:w-8 md:h-8"
                      style={{ color: faction.color }}
                    />
                  )}
                </div>
              </div>

              {/* Faction description */}
              <p className="font-oswald text-sm md:text-base text-military-taupe leading-relaxed mb-6">
                {faction.description}
              </p>

              {/* Faction details */}
              <div className="space-y-3 border-t border-military-steel/30 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-ibm-mono text-xs text-military-steel/60 uppercase">
                    Родной мир
                  </span>
                  <span className="font-oswald text-sm text-military-sand">
                    {faction.homeWorld}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-ibm-mono text-xs text-military-steel/60 uppercase">
                    Девиз
                  </span>
                  <span
                    className="font-oswald text-sm font-semibold text-right"
                    style={{ color: faction.color }}
                  >
                    {faction.motto}
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
            </div>
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
