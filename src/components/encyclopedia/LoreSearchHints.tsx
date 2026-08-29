'use client';

import Link from 'next/link';
import type { LorePageRef } from '@/lib/unit-search';

interface LoreSearchHintsProps {
  /** Pre-computed matches (matchLoreTitles) — the page already computes them
   *  for analytics, so the chips reuse the same result. */
  matches: LorePageRef[];
}

/** Chip prefix per page kind — dossier-style mono labels (in braces because
 *  of the leading `//`, see react/jsx-no-comment-textnodes). World entity
 *  pages override this per entry via `label` (ПЕРСОНА/ЛОКАЦИЯ/БИТВА/ТЕРМИН/
 *  КОРАБЛЬ — точнее, чем общий гриф «сущность»; гриф берётся из
 *  WORLD_KIND_LABELS в encyclopedia/page.tsx). */
const KIND_PREFIX: Record<LorePageRef['kind'], string> = {
  chapter: '// ГЛАВА',
  campaign: '// ХРОНИКИ',
  mission: '// МИССИЯ',
  'unit-lore': '// ЛОР',
  world: '// СУЩНОСТЬ',
};

/** Thin row of lore-page chips above the unit grid: chapters, campaigns,
 *  missions and unit-lore docs matching the query (title or body). Shows up
 *  to 3 chips; the rest fold into a non-link «+N» badge instead of being
 *  silently dropped. */
export function LoreSearchHints({ matches }: LoreSearchHintsProps) {
  if (matches.length === 0) return null;
  const visible = matches.slice(0, 3);
  const more = matches.length - visible.length;
  return (
    <div data-testid="lore-search-hints" className="flex flex-wrap items-center gap-2">
      {visible.map((p) => (
        <Link
          key={`${p.kind}-${p.href}`}
          href={p.href}
          data-testid="lore-search-hint"
          className="inline-flex items-center gap-1.5 rounded-full border border-military-amber/40 bg-military-charcoal/60 px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-wide text-military-amber/90 hover:border-military-amber transition-colors"
        >
          <span className="text-military-rust/60">{p.label ?? KIND_PREFIX[p.kind]}</span>
          <span>{p.title}</span>
          <span>→</span>
        </Link>
      ))}
      {more > 0 && (
        <span
          data-testid="lore-hints-more"
          className="inline-flex items-center rounded-full border border-military-steel/30 bg-military-charcoal/40 px-3 py-1 font-ibm-mono text-[10px] tracking-wide text-military-steel/70"
        >
          {`+${more}`}
        </span>
      )}
    </div>
  );
}

export default LoreSearchHints;
