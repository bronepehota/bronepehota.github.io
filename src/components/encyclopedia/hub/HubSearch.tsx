'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { factionDisplayNames, getFactionColors } from '@/lib/faction-colors';
import {
  buildSearchHaystack,
  matchesSearch,
  matchLoreTitles,
  type LorePageRef,
} from '@/lib/unit-search';
import { LoreSearchHints } from '../LoreSearchHints';
import { trackEvent } from '@/lib/analytics';

const MIN_QUERY = 3; // same threshold as the lore hints (matchLoreTitles)
const MAX_UNIT_ROWS = 6;

interface HubSearchProps {
  /** Full unit list (build-time payload) — the same data the catalog filters. */
  units: EncyclopediaUnit[];
  /** Lore page index — shared builder with /encyclopedia/units (lore-pages.ts). */
  lorePages: LorePageRef[];
}

/**
 * «Поиск по вселенной» — the cover's centerpiece. One query searches BOTH
 * corpora: lore pages (chapters/campaigns/missions/world — via matchLoreTitles)
 * and units (matchesSearch over precomputed haystacks), so a name like
 * «Блауд» surfaces the chapter dossier while «клон» surfaces unit cards.
 *
 * The unit hits render as ledger rows (name + faction dot); the deep-link
 * «все совпадения →» carries the query to the catalog (?q= — its restore
 * effect picks it up), which owns the full filtered-grid experience.
 * Analytics mirrors the catalog: encyclopedia_search (+ _empty) once the
 * query and result count settle (1200ms debounce).
 */
export function HubSearch({ units, lorePages }: HubSearchProps) {
  const [query, setQuery] = useState('');

  const haystacks = useMemo(
    () => new Map(units.map((u) => [u.id, buildSearchHaystack(u)])),
    [units],
  );

  const loreMatches = useMemo(
    () => matchLoreTitles(query, lorePages),
    [query, lorePages],
  );

  const q = query.trim();
  const active = q.length >= MIN_QUERY;
  const unitMatches = useMemo(
    () => (active ? units.filter((u) => matchesSearch(u, query, haystacks.get(u.id))) : []),
    [active, query, units, haystacks],
  );

  // Debounced search tracking — the final state of a typing burst, exactly
  // like the catalog's console (see EncyclopediaPage).
  useEffect(() => {
    if (!q) return;
    const results = loreMatches.length + unitMatches.length;
    const timer = setTimeout(() => {
      trackEvent('encyclopedia_search', { query: q, results, surface: 'hub' });
      if (results === 0) trackEvent('encyclopedia_search_empty', { query: q, surface: 'hub' });
    }, 1200);
    return () => clearTimeout(timer);
  }, [q, loreMatches.length, unitMatches.length]);

  const hasResults = loreMatches.length > 0 || unitMatches.length > 0;

  return (
    <div data-testid="hub-search-root">
      <label
        htmlFor="hub-search-input"
        className="block font-ibm-mono text-[9px] uppercase tracking-[0.3em] text-military-rust mb-2"
      >
        {'// ПОИСК ПО ВСЕЛЕННОЙ'}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-military-rust" />
        <input
          id="hub-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="БЛАУД, КОСАРИ, ГРОНТ…"
          data-testid="hub-search"
          className="w-full min-h-[44px] rounded-full border border-military-steel/30 bg-military-dark/70 py-2 pl-9 pr-10 font-ibm-mono text-[11px] md:text-xs tracking-wide text-white placeholder:text-military-taupe/80 focus:border-military-amber/50 focus:outline-none touch-manipulation"
        />
        {query && (
          <button
            type="button"
            aria-label="Очистить поиск"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-1 flex w-10 items-center justify-center text-military-taupe/80 hover:text-military-amber transition-colors touch-manipulation"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Inline results panel — the cover grows instead of floating a dropdown
          (nothing clips against the folded-paper edges on mobile). */}
      {active && (
        <div
          data-testid="hub-search-results"
          className="mt-2 border border-military-steel/25 bg-military-dark/80"
        >
          {hasResults ? (
            <>
              {/* Lore chips — the component folds extras into a «+N» badge */}
              {loreMatches.length > 0 && (
                <div className="px-3 pt-2.5 pb-1">
                  <LoreSearchHints matches={loreMatches} />
                </div>
              )}
              {unitMatches.length > 0 && loreMatches.length > 0 && (
                <div className="mx-3 mt-1 h-px bg-military-steel/15" />
              )}
              <div>
                {unitMatches.slice(0, MAX_UNIT_ROWS).map((u) => {
                  const color = getFactionColors(u.faction).primary;
                  const faction = factionDisplayNames[u.faction] ?? u.faction;
                  return (
                    <Link
                      key={u.id}
                      href={`/encyclopedia/unit/${u.id}`}
                      data-testid="hub-search-unit"
                      className="group flex min-h-[44px] items-center gap-2.5 px-3 no-underline touch-manipulation"
                      title={faction}
                    >
                      <span className="shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                      <span className="truncate font-oswald text-sm text-military-sand group-hover:text-military-amber transition-colors">
                        {u.name}
                      </span>
                      {/* dotted ledger leader — dossier index typography */}
                      <span aria-hidden className="min-w-4 flex-1 border-b border-dotted border-military-steel/25" />
                      <span className="shrink-0 font-ibm-mono text-[9px] uppercase tracking-wider text-military-taupe/80">
                        {faction}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {/* Lore-only matches: the «все совпадения в каталоге» deep-link
                  would advertise a count of ZERO units — render it only when
                  there is actually something in the catalog (review UX). */}
              {unitMatches.length > 0 && (
                <Link
                  href={`/encyclopedia/units?q=${encodeURIComponent(query)}`}
                  data-testid="hub-search-more"
                  className="flex min-h-[44px] items-center justify-between px-3 border-t border-military-steel/20 font-ibm-mono text-[10px] uppercase tracking-wider text-military-amber/80 hover:text-military-amber transition-colors no-underline touch-manipulation"
                >
                  <span>{`все совпадения в каталоге (${unitMatches.length})`}</span>
                  <span aria-hidden>→</span>
                </Link>
              )}
            </>
          ) : (
            <p className="px-3 py-3 font-ibm-mono text-[10px] uppercase tracking-wider text-military-taupe/80">
              {`∅ по запросу «${query}» — в архиве ничего нет`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
