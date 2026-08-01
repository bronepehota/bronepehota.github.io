import { Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Always-visible legend explaining the provenance badges on unit cards.
 * Replaces the old dismissible "с миру по нитке" banner that users couldn't find.
 */
export function EncyclopediaAttributionBanner() {
  return (
    <aside
      data-testid="encyclopedia-sources-banner"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1',
        'rounded border border-military-steel/30 bg-military-charcoal/40 px-3 py-2',
      )}
    >
      <div className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: '#22d3ee' }} />
        <span className="font-ibm-mono text-[10px] text-military-sand/70">
          Официальный канон (Технолог)
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 shrink-0" style={{ color: '#f59e0b' }} />
        <span className="font-ibm-mono text-[10px] text-military-sand/70">
          Материалы сообщества (Звёздные Системы)
        </span>
      </div>
    </aside>
  );
}
