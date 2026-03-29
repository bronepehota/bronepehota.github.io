'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, Skull } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EnrichedUnit } from '@/lib/encyclopedia-utils';
import { cn } from '@/lib/utils';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { SoldierImages } from './UnitDetail/SoldierImages';
import { MachineImages } from './UnitDetail/MachineImages';
import PaintedExamples from './PaintedExamples';
import { UnitLore } from './UnitDetail/UnitLore';
import { SourceAvailability } from './SourceAvailability';
import { getFactionColors } from '@/lib/faction-colors';

interface UnitDetailPageProps {
  unit: EnrichedUnit;
}

const factionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  polaris: Shield,
  protectorate: Zap,
  mercenaries: Skull,
};

const factionBadges: Record<string, string> = {
  polaris: 'ИМП',
  protectorate: 'ПРОТ',
  mercenaries: 'НАЁМ',
};

const factionNames: Record<string, string> = {
  polaris: 'Империя Полярис',
  protectorate: 'Торговый Протекторат',
  mercenaries: 'Наёмники',
};

export default function UnitDetailPage({ unit }: UnitDetailPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const factionColors = getFactionColors(unit.faction);
  const faction = {
    name: factionNames[unit.faction] || unit.faction,
    color: factionColors.primary,
    icon: factionIcons[unit.faction] || Shield,
    badge: factionBadges[unit.faction] || '',
  };
  const FactionIcon = faction.icon;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />

      {/* Radial gradient vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.8) 100%)'
      }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="relative py-8 md:py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back link */}
            <Link
              href="/encyclopedia"
              className={cn(
                'inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm',
                'text-military-rust/60 hover:text-military-amber transition-colors',
                'tracking-widest uppercase mb-8',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>К энциклопедии</span>
            </Link>

            {/* Title section */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Unit image */}
              {unit.image && (
                <div
                  className={cn(
                    'relative aspect-[3/4] w-full md:w-64 lg:w-80',
                    'folded-paper military-corners overflow-hidden',
                    'fade-in-up opacity-0',
                    isLoaded && 'opacity-100'
                  )}
                  style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
                >
                  {/* Image */}
                  <div className="relative w-full h-full">
                    <GitHubPagesImage
                      src={unit.image}
                      alt={unit.name}
                      fill
                      className="object-cover"
                    />
                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-military-dark/60 to-transparent" />
                  </div>

                  {/* Faction badge */}
                  <div className="absolute top-3 left-3">
                    <div
                      className="px-3 py-1 backdrop-blur-sm rounded-sm"
                      style={{
                        backgroundColor: `${unit.faction === 'polaris' ? 'rgba(220, 38, 38, 0.3)' : unit.faction === 'protectorate' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
                        border: `1px solid ${faction.color}`,
                      }}
                    >
                      <span className="font-ibm-mono text-xs font-bold text-white tracking-wider">
                        {faction.badge}
                      </span>
                    </div>
                  </div>

                  {/* Type indicator */}
                  <div className="absolute top-3 right-3">
                    <div className="px-3 py-1 backdrop-blur-sm bg-military-amber/20 border border-military-amber/40 rounded-sm">
                      <span className="text-sm">
                        {unit.type === 'squad' ? '◆' : '▲'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info section */}
              <div className="flex-1">
                <div
                  className={cn(
                    'fade-in-up opacity-0',
                    isLoaded && 'opacity-100'
                  )}
                  style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
                >
                  {/* Classification stamp */}
                  <div className="mb-4 inline-block">
                    <div className="border-2 border-military-rust/60 px-3 py-1 rotate-[-2deg]">
                      <span className="font-ibm-mono text-xs text-military-rust tracking-wider">
                        СЕКРЕТНО
                      </span>
                    </div>
                  </div>

                  {/* Unit name */}
                  <h1 className="font-russo font-black text-3xl md:text-4xl lg:text-5xl text-white mb-3 military-text-gradient">
                    {unit.name}
                  </h1>

                  {/* Faction */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${faction.color}20` }}
                    >
                      <div className="w-5 h-5" style={{ color: faction.color }}>
                        <FactionIcon className="w-full h-full" />
                      </div>
                    </div>
                    <span
                      className="font-oswald text-lg md:text-xl"
                      style={{ color: faction.color }}
                    >
                      {faction.name}
                    </span>
                  </div>

                  {/* Class */}
                  {unit.encyclopedia?.class && (
                    <div className="mb-6">
                      <span className="font-ibm-mono text-xs text-military-steel/60 uppercase tracking-wider mr-2">
                        CLASS
                      </span>
                      <span className="font-oswald text-military-sand">
                        {unit.encyclopedia.class}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="military-divider max-w-xs mb-6" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content sections */}
        <main className="px-4 pb-20">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Source Availability section */}
            <section
              className={cn(
                'folded-paper military-corners p-6',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}
            >
              <SourceAvailability unit={unit} variant="detail" />
            </section>

            {/* Lore, Traditions, Battles, Locations sections */}
            <UnitLore unit={unit} />

            {/* Buffs section */}
            {unit.buffs && unit.buffs.length > 0 && (
              <section
                className={cn(
                  'folded-paper military-corners p-6',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100'
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.75s' }}
              >
                <h2 className="font-oswald text-lg text-military-sand mb-4 flex items-center gap-2">
                  <ModifierIcon size={20} className="text-emerald-500" />
                  Бафы
                </h2>
                <div className="space-y-3">
                  {unit.buffs.map(buff => (
                    <div key={buff.id} className="flex items-start gap-3 p-3 rounded-lg bg-military-dark/50 border border-military-steel/30">
                      <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-900/30 text-emerald-500">
                        <ModifierIcon name={buff.icon} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-oswald text-sm text-white">{buff.name}</span>
                          {buff.applyTo.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-ibm-mono bg-emerald-900/40 border border-emerald-600/30 text-emerald-400 uppercase">
                              {t === 'army' ? 'армия' : t === 'machine' ? 'машина' : 'солдат'}
                            </span>
                          ))}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-ibm-mono bg-military-steel/30 border border-military-steel/40 text-military-steel uppercase">
                            {buff.phase === 'always' ? 'всегда' : buff.phase === 'shot' ? 'стрельба' : buff.phase === 'melee' ? 'ББ' : buff.phase}
                          </span>
                        </div>
                        <p className="text-xs text-military-sand/60 mt-1">{buff.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Soldier Images section */}
            <section
              className={cn(
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.8s' }}
            >
              <SoldierImages unit={unit} />
            </section>

            {/* Machine Images section */}
            <section
              className={cn(
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.85s' }}
            >
              <MachineImages unit={unit} />
            </section>

            {/* Painted Examples section */}
            <section
              className={cn(
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.95s' }}
            >
              <PaintedExamples unit={unit} />
            </section>
          </div>
        </main>

        {/* Footer */}
        <div className="max-w-6xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
