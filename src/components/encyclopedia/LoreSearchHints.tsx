'use client';

import Link from 'next/link';
import { matchLoreTitles, type LorePageRef } from '@/lib/unit-search';

interface LoreSearchHintsProps {
  pages: LorePageRef[];
  query: string;
}

/** Thin row of lore-page chips above the unit grid: shows when the search query
 *  matches a history chapter / story / campaign TITLE. Hidden otherwise. */
export function LoreSearchHints({ pages, query }: LoreSearchHintsProps) {
  const matches = matchLoreTitles(query, pages).slice(0, 3);
  if (matches.length === 0) return null;
  return (
    <div data-testid="lore-search-hints" className="flex flex-wrap items-center gap-2">
      {matches.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          data-testid="lore-search-hint"
          className="inline-flex items-center gap-1.5 rounded-full border border-military-amber/40 bg-military-charcoal/60 px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-wide text-military-amber/90 hover:border-military-amber transition-colors"
        >
          <span className="text-military-rust/60">{p.kind === 'campaign' ? '// ХРОНИКИ' : '// ГЛАВА'}</span>
          <span>{p.title}</span>
          <span>→</span>
        </Link>
      ))}
    </div>
  );
}

export default LoreSearchHints;
