'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnitLoreDoc } from '@/lib/unit-lore';

/**
 * «Читать подробнее» — the fuller, multi-paragraph lore for a unit.
 *
 * The short summary lives in `<UnitLore>` (encyclopedia.lore/history). This is
 * the long-form Markdown doc (weapon-by-weapon detail, design history) rendered
 * to HTML at build time. Collapsed by default for scannability, but the HTML is
 * ALWAYS mounted in the DOM (CSS max-height collapse, not conditional render) so
 * the full text stays in the static page and stays crawlable. Ends with a
 * reference to the primary source (the official handbook / robogear.ru).
 */
export function UnitLoreDetail({ doc }: { doc: UnitLoreDoc }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="folded-paper military-corners p-6" data-testid="unit-lore-detail">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 font-oswald text-lg text-military-sand"
      >
        <BookOpen className="w-5 h-5 text-military-rust" />
        Полное описание
        <ChevronDown
          className={cn('w-4 h-4 ml-auto text-military-steel/60 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {/* Always in the DOM (CSS-collapsed) → the full text is in the static HTML and crawlable. */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div
            className="prose prose-invert max-w-none prose-headings:font-russo prose-headings:text-military-amber prose-h2:mt-6 prose-h2:tracking-wide prose-p:text-military-sand/90 prose-strong:text-military-sand prose-li:text-military-sand/85 prose-a:text-hud-green"
            dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
          />

          {(doc.sourceLabel || doc.sourceUrl) && (
            <div className="mt-5 pt-3 border-t border-military-steel/15">
              {doc.sourceUrl ? (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60 hover:text-military-amber transition-colors"
                >
                  <ExternalLink className="w-3 h-3" aria-hidden />
                  Первоисточник: {doc.sourceLabel || 'официальный канон «Технолог»'}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-ibm-mono text-[10px] uppercase tracking-wider text-military-steel/60">
                  <ExternalLink className="w-3 h-3" aria-hidden />
                  Первоисточник: {doc.sourceLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
