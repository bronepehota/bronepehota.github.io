'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { EncyclopediaUnit, getFactions } from '@/lib/encyclopedia-registry';
import { FactionID } from '@/lib/types';
import { orderedFactions } from '@/lib/faction-hierarchy';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import { buildSearchHaystack, matchesSearch, matchLoreTitles, type LorePageRef } from '@/lib/unit-search';
import { LoreSearchHints } from './LoreSearchHints';
import { LoreGuide } from './LoreGuide';
import { UnitCard } from './UnitCard';
import { EncyclopediaTabs } from './EncyclopediaTabs';
import { EncyclopediaAttributionBanner } from './EncyclopediaAttributionBanner';
import { SQUAD_GROUP_IMAGE, getCredit } from '@/lib/painted-images';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

interface EncyclopediaPageProps {
  initialUnits: EncyclopediaUnit[];
  /** Lore page titles for search hints (history chapters + campaigns). */
  lorePages: LorePageRef[];
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

// Example queries on the empty state: manufacturer (units), a lore word from
// chapter BODIES (hints) and a place name from a campaign — three different
// kinds of hit, showing what the search covers.
const SEARCH_EXAMPLES = ['Робогир', 'Блауд', 'Велиан'];

export default function EncyclopediaPage({ initialUnits, lorePages }: EncyclopediaPageProps) {
  const [units] = useState<EncyclopediaUnit[]>(initialUnits);
  const [filteredUnits, setFilteredUnits] = useState<EncyclopediaUnit[]>(initialUnits);
  const [selectedFaction, setSelectedFaction] = useState<FactionID | 'all'>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  // Sculptor (miniature source) filter. Технолог is the IMPLICIT default — units
  // without a `miniatureSource` field are sculpted by Технолог, so we resolve a
  // unit's sculptor as `unit.miniatureSource ?? 'tehnolog'`.
  const [selectedSculptor, setSelectedSculptor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Haystacks are built once (lore fields are stable per unit); the filter
  // effect below then does a cheap token-AND check per keystroke.
  const haystacks = useMemo(
    () => new Map(units.map((u) => [u.id, buildSearchHaystack(u)])),
    [units],
  );

  // Lore hints (chapters/campaigns/missions/unit-lore by title or body) —
  // computed here (not inside LoreSearchHints) so analytics reports the same
  // match count the user sees.
  const loreMatches = useMemo(
    () => matchLoreTitles(searchQuery, lorePages),
    [searchQuery, lorePages],
  );

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

  // Derive the sculptor (miniature source) filter from the units data — same
  // data-driven pattern as the faction filter. Технолог is the implicit default
  // (no `miniatureSource` field ⇒ 'tehnolog'); only sculptors actually present
  // in the data appear as options. Labels resolve via `getCredit` (CREDITS map).
  const sculptors = useMemo(() => {
    const present = new Set(units.map((u) => u.miniatureSource ?? 'tehnolog'));
    // Stable display order: Технолог first (the canon/implicit default), then the
    // other known credit ids in their CREDITS declaration order, then any
    // unknown ids alphabetically (future-proofs new sculptors).
    const preferred = ['tehnolog', 'lisitsin', 'universestarsys', 'shnayder', 'sukov', 'pereverzev', 'star_system'];
    const ordered = Array.from(present).sort((a, b) => {
      const ia = preferred.indexOf(a);
      const ib = preferred.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b);
    });
    return [
      { value: 'all' as const, label: 'ВСЕ' },
      ...ordered.map((id) => ({ value: id, label: (getCredit(id)?.name ?? id).toUpperCase() })),
    ];
  }, [units]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Restore filter on mount: a URL deep-link (?faction=&type=&sculptor=&q=) takes
  // priority, otherwise fall back to sessionStorage — so the filter survives a
  // unit → «назад» round-trip (the page remounts on return).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let saved: { faction?: string; type?: string; sculptor?: string; search?: string } = {};
    try { saved = JSON.parse(sessionStorage.getItem('enc_filter') || '{}'); } catch {}
    const fac = params.get('faction') ?? saved.faction;
    const typ = params.get('type') ?? saved.type;
    const sc = params.get('sculptor') ?? saved.sculptor;
    const q = params.get('q') ?? saved.search;
    if (fac && fac !== 'all' && units.some((u) => u.faction === fac)) setSelectedFaction(fac as FactionID);
    if (typ && typ !== 'all') setSelectedType(typ as TypeFilter);
    if (sc && sc !== 'all' && units.some((u) => (u.miniatureSource ?? 'tehnolog') === sc)) setSelectedSculptor(sc);
    if (q) setSearchQuery(q);
  }, []);

  // Persist the active filter so returning from a unit page restores it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('enc_filter', JSON.stringify({
        faction: selectedFaction, type: selectedType, sculptor: selectedSculptor, search: searchQuery,
      }));
    } catch { /* sessionStorage unavailable (private mode) — deep-link still works */ }
  }, [selectedFaction, selectedType, selectedSculptor, searchQuery]);

  useEffect(() => {
    const filtered = units.filter(unit => {
      if (selectedFaction !== 'all' && unit.faction !== selectedFaction) return false;
      if (selectedSculptor !== 'all' && (unit.miniatureSource ?? 'tehnolog') !== selectedSculptor) return false;
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
      // Search covers name, shortName, faction, manufacturer, reference-book
      // fields (designation/class/armament) and lore — see buildSearchHaystack
      // and matchesSearch (token-AND: «полярис герой» needs both words).
      if (searchQuery && !matchesSearch(unit, searchQuery, haystacks.get(unit.id))) {
        return false;
      }
      return true;
    });
    setFilteredUnits(filtered);
  }, [units, haystacks, selectedFaction, selectedSculptor, selectedType, searchQuery]);

  // Debounced search tracking: fires once 1200ms after the query AND result
  // count settle (the final state of a typing burst, not every keystroke).
  // Zero results additionally fire encyclopedia_search_empty — demand without
  // content is the SEO/content priority signal from the search audit.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;
    const results = filteredUnits.length + loreMatches.length;
    const timer = setTimeout(() => {
      trackEvent('encyclopedia_search', { query: q, results });
      if (results === 0) trackEvent('encyclopedia_search_empty', { query: q });
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery, filteredUnits.length, loreMatches.length]);

  const resetFilters = () => {
    setSelectedFaction('all');
    setSelectedType('all');
    setSelectedSculptor('all');
    setSearchQuery('');
  };

  // Example queries on the empty state: fill the search AND drop the other
  // filters so the example is guaranteed to produce results.
  const applySearchExample = (q: string) => {
    setSelectedFaction('all');
    setSelectedType('all');
    setSelectedSculptor('all');
    setSearchQuery(q);
  };

  const activeFilterCount =
    (selectedFaction !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedSculptor !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    // NOTE: `overflow-hidden` here would break the sticky console below (an
    // overflow ancestor becomes the sticky element's scrollport, which never
    // scrolls). `overflow-x-clip` clips stray horizontal paint WITHOUT creating
    // a scroll container — sticky keeps working.
    <div className="min-h-screen bg-military-dark relative overflow-x-clip">
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

              {/* Small wordmark (replaces the giant title). H1 — the page's only
                  one (units below start at h3); visually identical to the old div. */}
              <div className="text-center leading-none">
                <h1 className="font-russo text-sm md:text-base tracking-[0.25em] text-military-sand">
                  ЭНЦИКЛОПЕДИЯ
                </h1>
                <div className="mt-0.5 font-ibm-mono text-[8px] md:text-[9px] text-military-rust/60 tracking-[0.3em] uppercase">
                  {'// База боевых единиц'}
                </div>
              </div>

              <Link
                href="/encyclopedia/history#wars"
                data-testid="encyclopedia-campaigns-link"
                className="inline-flex items-center gap-1.5 font-ibm-mono text-[11px] text-military-amber/70 hover:text-military-amber transition-colors tracking-widest uppercase whitespace-nowrap"
              >
                <span className="hidden sm:inline">Хроники</span>
                <span className="sm:hidden">Хроники</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Мост в режим боя — тонкая строка-телетайп, вся кликабельна
            (вернули по решению владельца 2026-08-28: прятали только песочницу) */}
        <div data-testid="encyclopedia-battle-banner" className="mx-auto max-w-7xl px-4">
          <Link
            href="/app"
            onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_main' })}
            data-testid="encyclopedia-battle-banner-link"
            className="flex items-center gap-3 min-h-[44px] px-2 border border-military-rust/30 hover:border-military-amber/60 transition-colors group touch-manipulation no-underline"
          >
            <span className="font-ibm-mono text-[10px] uppercase tracking-[0.25em] text-military-rust/80 shrink-0">
              {'// РЕЖИМ БОЯ'}
            </span>
            <span className="hidden sm:inline font-ibm-mono text-[10px] md:text-xs text-military-steel/70 truncate">
              любой отряд — в строй
            </span>
            <span className="flex-1" />
            <span className="font-russo text-[10px] md:text-xs uppercase tracking-widest text-military-rust group-hover:text-military-amber transition-colors shrink-0">
              ШТАБ →
            </span>
          </Link>
        </div>

        {/* Sticky navigation console — tabs + search + filters stay reachable
            from anywhere in the 20+ screen catalog. Sticky works because the
            page root clips with `overflow-x-clip`, NOT `overflow-hidden`. */}
        <div
          className={cn(
            'sticky top-0 z-30 border-b border-military-steel/20 bg-military-dark/90 backdrop-blur-md',
            'fade-in-up opacity-0',
            isLoaded && 'opacity-100'
          )}
          style={{ animationFillMode: 'forwards', animationDelay: '0.18s' }}
        >
          <div className="mx-auto max-w-7xl px-4 py-1.5 space-y-1.5">
            {/* Section tabs (Юниты/Миссии/Фракции/История) — moved INTO the
                sticky console: the audit measured both tabs and search gone
                after 3000px of scroll (returning to search cost ~10 screens). */}
            <div
              className={cn(
                'flex justify-center fade-in-up opacity-0',
                isLoaded && 'opacity-100'
              )}
              style={{ animationFillMode: 'forwards', animationDelay: '0.12s' }}
            >
              <EncyclopediaTabs dense />
            </div>

            {/* Search + count */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-military-rust/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ПОИСК…"
                  className="w-full rounded-full border border-military-steel/30 bg-military-charcoal/60 py-1.5 pl-9 pr-9 font-ibm-mono text-[11px] tracking-wide text-white placeholder:text-military-steel/50 focus:border-military-amber/50 focus:outline-none"
                />
                {/* ✕ — clear the query without long backspacing (mobile audit point) */}
                {searchQuery && (
                  <button
                    type="button"
                    data-testid="search-clear"
                    aria-label="Очистить поиск"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-1 flex w-8 items-center justify-center text-military-steel/60 hover:text-military-amber transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
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

            {/* Lore hints — chapters/campaigns/missions/unit-lore matching the
                query by title or body (computed above, shared with analytics) */}
            <LoreSearchHints matches={loreMatches} />

            {/* Faction + type + sculptor selectors — on phones the faction gets its
                own full-width row (so long names like «МЁРТВЫЙ ФЛОТ» aren't clipped
                beside two other selects), with type + sculptor sharing the row below.
                One inline row from `sm` up. */}
            <div className="flex flex-col gap-2 sm:flex-row">
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
                  className="w-full rounded-full border border-military-steel/30 bg-military-charcoal/70 py-1.5 pl-7 pr-3 font-ibm-mono text-[10px] tracking-wide text-white focus:border-military-amber/50 focus:outline-none md:text-xs"
                >
                  {factions.map(f => (
                    <option key={f.value} value={f.value} className="bg-military-charcoal text-white">
                      {f.parent ? '  ' : ''}{f.value === 'all' ? 'ВСЕ ФРАКЦИИ' : f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                {/* Type selector */}
                <div className="relative flex-1 sm:w-28 sm:flex-none">
                  <select
                    aria-label="Тип"
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value as TypeFilter)}
                    className="w-full rounded-full border border-military-steel/30 bg-military-charcoal/70 py-1.5 pl-3 pr-3 font-ibm-mono text-[10px] tracking-wide text-white focus:border-military-amber/50 focus:outline-none md:text-xs"
                  >
                    {types.map(t => (
                      <option key={t.value} value={t.value} className="bg-military-charcoal text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sculptor (miniature source) selector — data-driven, mirrors faction filter */}
                <div className="relative flex-1 sm:w-36 sm:flex-none">
                  <select
                    aria-label="Источник миниатюр"
                    value={selectedSculptor}
                    onChange={e => setSelectedSculptor(e.target.value)}
                    className="w-full rounded-full border border-military-steel/30 bg-military-charcoal/70 py-1.5 pl-3 pr-3 font-ibm-mono text-[10px] tracking-wide text-white focus:border-military-amber/50 focus:outline-none md:text-xs"
                  >
                    {sculptors.map(s => (
                      <option key={s.value} value={s.value} className="bg-military-charcoal text-white">
                        {s.value === 'all' ? 'ВСЕ ИСТОЧНИКИ' : s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Units grid */}
        <main className="px-4 py-4 pb-20">
          <div className="mx-auto max-w-7xl">
            {/* Новичковый путь «с чего начать» — над сеткой: вход во вселенную
                через сюжет (глава 01 → Летопись → войны → фракции), не через каталог. */}
            <div className="mb-4">
              <LoreGuide />
            </div>
            <div className="mb-4">
              <EncyclopediaAttributionBanner />
            </div>
            {filteredUnits.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mb-3 text-5xl opacity-20">∅</div>
                <p className="font-oswald text-lg text-military-taupe">НИЧЕГО НЕ НАЙДЕНО</p>
                {searchQuery ? (
                  // Empty state WITH a query: echo it, offer a one-tap reset
                  // (a forgotten faction selector + query = zero without a clue)
                  // and example queries that are known to hit.
                  <>
                    <p className="mt-1 font-ibm-mono text-xs text-military-steel">
                      по запросу «{searchQuery}»
                    </p>
                    <div className="mt-5">
                      <button
                        type="button"
                        data-testid="search-empty-reset"
                        onClick={resetFilters}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-military-amber/50 bg-military-charcoal/60 px-5 font-ibm-mono text-[11px] uppercase tracking-wider text-military-amber hover:border-military-amber transition-colors touch-manipulation"
                      >
                        <X className="h-3.5 w-3.5" />
                        Сбросить фильтры
                      </button>
                    </div>
                    <p className="mt-6 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/50">
                      возможно, вы искали:
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      {SEARCH_EXAMPLES.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          data-testid="search-example"
                          onClick={() => applySearchExample(ex)}
                          className="inline-flex items-center rounded-full border border-military-amber/40 bg-military-charcoal/60 px-3 py-1.5 font-ibm-mono text-[10px] uppercase tracking-wide text-military-amber/90 hover:border-military-amber transition-colors touch-manipulation"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 font-ibm-mono text-xs text-military-steel">
                    Измените параметры фильтрации
                  </p>
                )}
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
