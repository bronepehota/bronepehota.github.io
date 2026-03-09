'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, Skull } from 'lucide-react';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { cn } from '@/lib/utils';
import { SoldierImages } from './UnitDetail/SoldierImages';
import { MachineImages } from './UnitDetail/MachineImages';
import PaintedExamples from './PaintedExamples';
import { UnitLore } from './UnitDetail/UnitLore';

interface UnitDetailPageProps {
  unit: UnitWithType;
}

const factionData = {
  polaris: {
    name: 'Империя Полярис',
    color: '#DC2626',
    icon: Shield,
    badge: 'ИМП',
  },
  protectorate: {
    name: 'Торговый Протекторат',
    color: '#3B82F6',
    icon: Zap,
    badge: 'ПРОТ',
  },
  mercenaries: {
    name: 'Наёмники',
    color: '#EAB308',
    icon: Skull,
    badge: 'НАЁМ',
  },
};

export default function UnitDetailPage({ unit }: UnitDetailPageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const faction = factionData[unit.faction];
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

                  {/* Cost badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-2 backdrop-blur-sm bg-military-dark/80 px-3 py-2 rounded border border-military-rust/30">
                      <span className="text-military-amber text-lg">⬡</span>
                      <span className="font-russo text-xl font-bold text-white">
                        {unit.cost}
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
                      <FactionIcon className="w-5 h-5" style={{ color: faction.color }} />
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
            {/* Stats section */}
            <section
              className={cn(
                'folded-paper military-corners p-6',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_STATS
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Cost */}
                <div className="text-center p-4 bg-military-charcoal/50 rounded">
                  <div className="text-military-amber text-2xl mb-1">⬡</div>
                  <div className="font-russo text-2xl font-bold text-white">{unit.cost}</div>
                  <div className="font-ibm-mono text-xs text-military-steel">очков</div>
                </div>

                {/* Faction */}
                <div className="text-center p-4 bg-military-charcoal/50 rounded">
                  <div className="mb-1">
                    <FactionIcon className="w-6 h-6 mx-auto" style={{ color: faction.color }} />
                  </div>
                  <div className="font-oswald text-sm text-military-sand">{faction.badge}</div>
                  <div className="font-ibm-mono text-xs text-military-steel">фракция</div>
                </div>

                {/* Type */}
                <div className="text-center p-4 bg-military-charcoal/50 rounded">
                  <div className="text-military-amber text-2xl mb-1">
                    {unit.type === 'squad' ? '◆' : '▲'}
                  </div>
                  <div className="font-oswald text-sm text-military-sand">
                    {unit.type === 'squad' ? 'Пехота' : 'Техника'}
                  </div>
                  <div className="font-ibm-mono text-xs text-military-steel">тип</div>
                </div>

                {/* ID */}
                <div className="text-center p-4 bg-military-charcoal/50 rounded">
                  <div className="text-military-rust text-2xl mb-1">#</div>
                  <div className="font-ibm-mono text-sm text-military-sand truncate px-2">
                    {unit.id}
                  </div>
                  <div className="font-ibm-mono text-xs text-military-steel">ID</div>
                </div>
              </div>
            </section>

            {/* Lore, Traditions, Battles, Locations sections */}
            <UnitLore unit={unit} />

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
