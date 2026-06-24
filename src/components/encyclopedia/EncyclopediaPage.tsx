'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { FactionID } from '@/lib/types';
import { Search } from 'lucide-react';
import { UnitCard } from './UnitCard';
import { EncyclopediaTabs } from './EncyclopediaTabs';
import { cn } from '@/lib/utils';

interface EncyclopediaPageProps {
  initialUnits: EncyclopediaUnit[];
}

const factions: { value: FactionID | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'ВСЕ ФРАКЦИИ', color: '#A8A29E' },
  { value: 'polaris', label: 'ПОЛЯРИС', color: '#DC2626' },
  { value: 'protectorate', label: 'ПРОТЕКТОРАТ', color: '#06b6d4' },
  { value: 'mercenaries', label: 'НАЁМНИКИ', color: '#EAB308' },
];

const types: { value: 'all' | 'squad' | 'machine'; label: string; icon: string }[] = [
  { value: 'all', label: 'ВСЕ ТИПЫ', icon: '▣' },
  { value: 'squad', label: 'ПЕХОТА', icon: '◆' },
  { value: 'machine', label: 'ТЕХНИКА', icon: '▲' },
];

export default function EncyclopediaPage({ initialUnits }: EncyclopediaPageProps) {
  const [units] = useState<EncyclopediaUnit[]>(initialUnits);
  const [filteredUnits, setFilteredUnits] = useState<EncyclopediaUnit[]>(initialUnits);
  const [selectedFaction, setSelectedFaction] = useState<FactionID | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'squad' | 'machine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Optional deep-link: /encyclopedia?faction=polaris pre-selects that faction filter.
  // Read on the client (not via useSearchParams) so the page stays statically renderable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const f = new URLSearchParams(window.location.search).get('faction');
    if (f === 'polaris' || f === 'protectorate' || f === 'mercenaries') {
      setSelectedFaction(f);
    }
  }, []);

  useEffect(() => {
    const filtered = units.filter(unit => {
      if (selectedFaction !== 'all' && unit.faction !== selectedFaction) return false;
      if (selectedType !== 'all' && unit.type !== selectedType) return false;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = unit.name.toLowerCase().includes(searchLower);
        const shortNameMatch = unit.shortName?.toLowerCase().includes(searchLower);
        if (!nameMatch && !shortNameMatch) return false;
      }
      return true;
    });
    setFilteredUnits(filtered);
  }, [units, selectedFaction, selectedType, searchQuery]);

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />

      {/* Radial gradient vignette */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)'
      }} />

      <div className="relative z-10">
        {/* Hero Header */}
        <header className="relative py-6 md:py-12 px-4 overflow-hidden">
          {/* Animated scanline */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-military-rust/60 to-transparent animate-pulse" />

          <div className="max-w-7xl mx-auto">
            {/* Top nav row: back to app + link to Chronicles */}
            <div
              className={cn(
                'flex items-center justify-between mb-4 md:mb-8',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.1s' }}
            >
              <Link
                href="/app"
                className="inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase"
              >
                <span className="text-lg">←</span>
                <span>В приложение</span>
              </Link>
              <Link
                href="/campaigns"
                data-testid="encyclopedia-campaigns-link"
                className="inline-flex items-center gap-2 font-ibm-mono text-xs md:text-sm text-military-amber/70 hover:text-military-amber transition-colors tracking-widest uppercase"
              >
                <span>Хроники войн</span>
                <span className="text-lg">→</span>
              </Link>
            </div>

            {/* Main title */}
            <div className="text-center mb-4 md:mb-10">
              <h1
                className={cn(
                  'font-russo font-black military-text-gradient',
                  'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
                  'mb-4 tracking-wide',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100'
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}
              >
                ЭНЦИКЛОПЕДИЯ
              </h1>

              {/* Subtitle with technical decoration */}
              <div
                className={cn(
                  'flex items-center justify-center gap-4',
                  'fade-in-up opacity-0',
                  isLoaded && 'opacity-100'
                )}
                style={{ animationFillMode: 'forwards', animationDelay: '0.3s' }}
              >
                <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent to-military-rust/50" />
                <p className="font-ibm-mono text-xs md:text-sm text-military-amber/80 tracking-[0.2em] uppercase">
                  База данных боевых единиц
                </p>
                <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent to-military-rust/50" />
              </div>
            </div>

            {/* Mode selector — Units / Missions / Factions */}
            <div
              className={cn(
                'max-w-4xl mx-auto mb-8 md:mb-10',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.35s' }}
            >
              <EncyclopediaTabs />
            </div>

            {/* Tactical Command Panel - Search & Filters */}
            <div
              className={cn(
                'max-w-4xl mx-auto',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.4s' }}
            >
              {/* Search Input */}
              <div className="relative mb-4 md:mb-6 folded-paper military-corners">
                <div className="absolute inset-0 bg-military-charcoal/80 backdrop-blur-sm pointer-events-none" />
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-military-rust/60 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ПОИСК ПО НАЗВАНИЮ..."
                    className="w-full pl-12 pr-4 py-3 md:py-4 bg-transparent text-white placeholder:text-military-steel/60 font-ibm-mono text-sm tracking-wider focus:outline-none relative z-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="font-ibm-mono text-xs text-military-rust/40">
                      {filteredUnits.length}/{units.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Faction Filter */}
                <div className="folded-paper military-corners p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                      FILTER_FACTION
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {factions.map(faction => (
                      <button
                        key={faction.value}
                        onClick={() => setSelectedFaction(faction.value)}
                        className={cn(
                          'font-ibm-mono text-xs px-2.5 py-1.5 md:px-3 md:py-2 rounded transition-all duration-300',
                          'border border-transparent',
                          'hover:scale-105 active:scale-95',
                          selectedFaction === faction.value
                            ? 'text-white shadow-lg'
                            : 'text-military-sand/60 hover:text-military-sand hover:bg-military-steel/20'
                        )}
                        style={{
                          backgroundColor: selectedFaction === faction.value ? faction.color : undefined,
                          borderColor: selectedFaction === faction.value ? faction.color : undefined,
                        }}
                      >
                        {faction.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Filter */}
                <div className="folded-paper military-corners p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                      FILTER_TYPE
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {types.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={cn(
                          'font-ibm-mono text-xs px-2.5 py-1.5 md:px-3 md:py-2 rounded transition-all duration-300',
                          'flex items-center gap-2',
                          'border border-transparent',
                          'hover:scale-105 active:scale-95',
                          selectedType === type.value
                            ? 'text-military-amber bg-military-amber/20 border-military-amber/50 shadow-lg'
                            : 'text-military-sand/60 hover:text-military-sand hover:bg-military-steel/20'
                        )}
                      >
                        <span className="text-sm">{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="max-w-4xl mx-auto mt-12 military-divider" />
        </header>

        {/* Units Grid */}
        <main className="px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            {filteredUnits.length === 0 ? (
              // Empty state
              <div className="text-center py-20">
                <div className="inline-block mb-4">
                  <div className="text-6xl opacity-20">∅</div>
                </div>
                <p className="font-oswald text-xl text-military-taupe mb-2">
                  НИЧЕГО НЕ НАЙДЕНО
                </p>
                <p className="font-ibm-mono text-sm text-military-steel">
                  Попробуйте изменить параметры фильтрации
                </p>
              </div>
            ) : (
              // Units grid with staggered animation
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
                data-testid="unit-grid"
              >
                {filteredUnits.map((unit, index) => (
                  <div
                    key={unit.id}
                    className={cn(
                      'fade-in-up opacity-0',
                      isLoaded && 'opacity-100'
                    )}
                    style={{
                      animationFillMode: 'forwards',
                      animationDelay: `${0.5 + (index % 12) * 0.05}s`,
                    }}
                  >
                    <UnitCard unit={unit} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Footer divider */}
        <div className="max-w-7xl mx-auto">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
