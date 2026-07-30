'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown } from 'lucide-react';
import { EncyclopediaUnit, getFactions } from '@/lib/encyclopedia-registry';
import { FactionID } from '@/lib/types';
import { orderedFactions } from '@/lib/faction-hierarchy';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import { UnitCard } from './UnitCard';
import { EncyclopediaTabs } from './EncyclopediaTabs';
import { EncyclopediaAttributionBanner } from './EncyclopediaAttributionBanner';
import { SQUAD_GROUP_IMAGE } from '@/lib/painted-images';
import { cn } from '@/lib/utils';

interface EncyclopediaPageProps {
  initialUnits: EncyclopediaUnit[];
}

// Faction filter is derived from the units data inside the component (data-driven).

type TypeFilter = 'all' | 'squad' | 'hero' | 'machine' | 'орудие';

const types: { value: TypeFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'ВСЕ', icon: '▣' },
  { value: 'squad', label: 'ПЕХОТА', icon: '◆' },
  { value: 'hero', label: 'ГЕРОИ', icon: '★' },
  { value: 'machine', label: 'ТЕХНИКА', icon: '▲' },
  { value: 'орудие', label: 'ОРУДИЯ', icon: '⬢' },
];

export default function EncyclopediaPage({ initialUnits }: EncyclopediaPageProps) {
  const [units] = useState<EncyclopediaUnit[]>(initialUnits);
  const [filteredUnits, setFilteredUnits] = useState<EncyclopediaUnit[]>(initialUnits);
  const [selectedFaction, setSelectedFaction] = useState<FactionID | 'all'>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Derive the faction filter from the units data — a new faction appears here
  // automatically once it has units (no hardcoded faction list to maintain).
  const factions = useMemo(() => {
    // Data-driven order: sub-factions nest right after their parent. Pulls
    // `parent` from the registry so the {id,parent} shape carries hierarchy.
    const present = new Set(units.map((u) => u.faction));
    const ordered = orderedFactions(
      getFactions().filter((f) => present.has(f.id)).map((f) => ({ id: f.id, parent: f.parent })),
    );
    return [
      { value: 'all' as const, label: 'ВСЕ', color: '#A8A29E', parent: undefined },
      ...ordered.map((f) => ({
        value: f.id,
        label: (factionDisplayNames[f.id] ?? f.id).toUpperCase(),
        color: getFactionColors(f.id).primary,
        parent: f.parent,
      })),
    ];
  }, [units]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Restore filter on mount: a URL deep-link (?faction=&type=&q=) takes priority,
  // otherwise fall back to sessionStorage — so the filter survives a
  // unit → «назад» round-trip (the page remounts on return).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let saved: { faction?: string; type?: string; search?: string } = {};
    try { saved = JSON.parse(sessionStorage.getItem('enc_filter') || '{}'); } catch {}
    const fac = params.get('faction') ?? saved.faction;
    const typ = params.get('type') ?? saved.type;
    const q = params.get('q') ?? saved.search;
    if (fac && fac !== 'all' && units.some((u) => u.faction === fac)) setSelectedFaction(fac as FactionID);
    if (typ && typ !== 'all') setSelectedType(typ as TypeFilter);
    if (q) setSearchQuery(q);
  }, []);

  // Persist the active filter so returning from a unit page restores it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('enc_filter', JSON.stringify({
        faction: selectedFaction, type: selectedType, search: searchQuery,
      }));
    } catch { /* sessionStorage unavailable (private mode) — deep-link still works */ }
  }, [selectedFaction, selectedType, searchQuery]);

  useEffect(() => {
    const filtered = units.filter(unit => {
      if (selectedFaction !== 'all' && unit.faction !== selectedFaction) return false;
      if (selectedType !== 'all') {
        if (selectedType === 'hero') {
          // Герои — отряды с пометкой о предварительных статах
          if (!(unit.type === 'squad' && unit.statsNote)) return false;
        } else if (selectedType === 'squad') {
          // Пехота — обычные отряды (без героев)
          if (!(unit.type === 'squad' && !unit.statsNote)) return false;
        } else if (unit.type !== selectedType) {
          // Техника / Орудия
          return false;
        }
      }
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

  const activeFilterCount =
    (selectedFaction !== 'all' ? 1 : 0) + (selectedType !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-military-dark relative overflow-hidden">
      {/* Background layers */}
      <div className="fixed inset-0 diagonal-stripes opacity-30 pointer-events-none" />
      <div className="fixed inset-0 film-grain-overlay pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(12, 10, 9, 0.7) 100%)'
      }} />

      <div className="relative z-10">
        {/* Compact header */}
        <header className="px-4 pt-5 pb-3">
          <div className="mx-auto max-w-7xl">
            {/* Top row: nav links + small wordmark */}
            <div
              className={cn(
                'flex items-center justify-between gap-4',
                'fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.05s' }}
            >
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] text-military-rust/60 hover:text-military-amber transition-colors tracking-widest uppercase whitespace-nowrap"
              >
                <span>←</span>
                <span className="hidden sm:inline">В приложение</span>
                <span className="sm:hidden">Назад</span>
              </Link>

              {/* Small wordmark (replaces the giant title) */}
              <div className="text-center leading-none">
                <div className="font-russo text-sm md:text-base tracking-[0.25em] text-military-sand">
                  ЭНЦИКЛОПЕДИЯ
                </div>
                <div className="mt-0.5 font-ibm-mono text-[8px] md:text-[9px] text-military-rust/60 tracking-[0.3em] uppercase">
                  {'// База боевых единиц'}
                </div>
              </div>

              <Link
                href="/campaigns"
                data-testid="encyclopedia-campaigns-link"
                className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] text-military-amber/70 hover:text-military-amber transition-colors tracking-widest uppercase whitespace-nowrap"
              >
                <span className="hidden sm:inline">Хроники</span>
                <span className="sm:hidden">Хроники</span>
                <span>→</span>
              </Link>
            </div>

            {/* Tabs */}
            <div
              className={cn(
                'mt-3 fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.12s' }}
            >
              <EncyclopediaTabs />
            </div>
          </div>
        </header>

        {/* Sticky compact filter console */}
        <div
          className={cn(
            'sticky top-0 z-30 border-y border-military-steel/20 bg-military-dark/95 backdrop-blur-md',
            'fade-in-up opacity-0',
            isLoaded && 'opacity-100'
          )}
          style={{ animationFillMode: 'forwards', animationDelay: '0.18s' }}
        >
          <div className="mx-auto max-w-7xl px-4 py-2 space-y-2">
            {/* Search + count */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-military-rust/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ПОИСК ПО НАЗВАНИЮ…"
                  className="w-full rounded-full border border-military-steel/30 bg-military-charcoal/60 py-1.5 pl-9 pr-3 font-ibm-mono text-[11px] tracking-wide text-white placeholder:text-military-steel/50 focus:border-military-amber/50 focus:outline-none"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-military-amber px-1 font-ibm-mono text-[9px] font-bold text-military-dark">
                    {activeFilterCount}
                  </span>
                )}
                <span className="font-ibm-mono text-[10px] text-military-rust/60 tabular-nums whitespace-nowrap">
                  {filteredUnits.length}/{units.length}
                </span>
              </div>
            </div>

            {/* Faction + type selectors — compact on mobile */}
            <div className="flex gap-2">
              {/* Faction selector (color dot = selected faction) */}
              <div className="relative flex-1 min-w-0">
                <span
                  className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-2 w-2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: factions.find(f => f.value === selectedFaction)?.color ?? '#A8A29E' }}
                />
                <select
                  aria-label="Фракция"
                  value={selectedFaction}
                  onChange={e => setSelectedFaction(e.target.value as FactionID | 'all')}
                  className="w-full appearance-none rounded-full border border-military-steel/30 bg-military-charcoal/70 py-1.5 pl-7 pr-7 font-ibm-mono text-[10px] tracking-wide text-white focus:border-military-amber/50 focus:outline-none md:text-xs"
                >
                  {factions.map(f => (
                    <option key={f.value} value={f.value} className="bg-military-charcoal text-white">
                      {f.parent ? '  ' : ''}{f.value === 'all' ? 'ВСЕ ФРАКЦИИ' : f.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-military-rust/60" />
              </div>

              {/* Type selector */}
              <div className="relative w-28 shrink-0 md:w-36">
                <select
                  aria-label="Тип"
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as TypeFilter)}
                  className="w-full appearance-none rounded-full border border-military-steel/30 bg-military-charcoal/70 py-1.5 pl-3 pr-7 font-ibm-mono text-[10px] tracking-wide text-white focus:border-military-amber/50 focus:outline-none md:text-xs"
                >
                  {types.map(t => (
                    <option key={t.value} value={t.value} className="bg-military-charcoal text-white">
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-military-rust/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Units grid */}
        <main className="px-4 py-4 pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4">
              <EncyclopediaAttributionBanner />
            </div>
            {filteredUnits.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mb-3 text-5xl opacity-20">∅</div>
                <p className="font-oswald text-lg text-military-taupe">НИЧЕГО НЕ НАЙДЕНО</p>
                <p className="mt-1 font-ibm-mono text-xs text-military-steel">
                  Измените параметры фильтрации
                </p>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 gap-3 [grid-auto-flow:dense] items-start sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                data-testid="unit-grid"
              >
                {filteredUnits.map((unit, index) => {
                  const wide = !!SQUAD_GROUP_IMAGE[unit.id];
                  return (
                    <div
                      key={unit.id}
                      className={cn(
                        'fade-in-up opacity-0',
                        isLoaded && 'opacity-100',
                        wide && 'col-span-2'
                      )}
                      style={{
                        animationFillMode: 'forwards',
                        animationDelay: `${Math.min(0.25 + (index % 16) * 0.035, 0.9)}s`,
                      }}
                    >
                      <UnitCard unit={unit} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <div className="mx-auto max-w-7xl">
          <div className="military-divider mb-8" />
        </div>
      </div>
    </div>
  );
}
