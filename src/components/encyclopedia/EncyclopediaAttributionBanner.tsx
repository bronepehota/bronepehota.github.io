'use client';

import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { cn } from '@/lib/utils';

/**
 * Always-visible legend explaining the provenance badges on unit cards.
 * Uses the actual Tehnolog + Star System credit logos.
 */
export function EncyclopediaAttributionBanner() {
  return (
    <aside
      data-testid="encyclopedia-sources-banner"
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-2',
        'rounded border border-military-steel/30 bg-military-charcoal/40 px-3 py-2',
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 overflow-hidden rounded-sm shrink-0">
          <GitHubPagesImage src="/images/credits/tehnolog.png" alt="" fill className="object-contain" />
        </div>
        <span className="font-ibm-mono text-[10px] text-military-sand/70">
          Официальный (Технолог)
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-5 w-5 overflow-hidden rounded-sm shrink-0">
          <GitHubPagesImage src="/images/credits/star_system.jpg" alt="" fill className="object-contain" />
        </div>
        <span className="font-ibm-mono text-[10px] text-military-sand/70">
          Сообщество (различные)
        </span>
      </div>
      <a
        href="https://vk.ru/lastbpcoder"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex items-center gap-1 rounded-sm border border-military-amber/40 bg-military-amber/10 px-2 py-0.5 font-ibm-mono text-[10px] text-military-amber transition-colors hover:bg-military-amber/20"
      >
        ✎ Дополнить
      </a>
    </aside>
  );
}
