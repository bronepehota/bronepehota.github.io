import type { ElementType } from 'react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EncyclopediaUnit, getUnitCostForSource } from '@/lib/encyclopedia-registry';

interface SourceAvailabilityProps {
  unit: EncyclopediaUnit;
  variant?: 'card' | 'detail';
  size?: 'compact' | 'full';
  /** Currently-shown source (makes detail cards highlight the active one). */
  activeSource?: string;
  /** When provided, detail-variant source cards become the stat switcher. */
  onSourceChange?: (id: string) => void;
}

const sourceConfig: Record<string, { name: string; short: string; logo: string; color: string; bgColor: string }> = {
  star_system: {
    name: 'Star System',
    short: 'SS',
    logo: '/images/credits/star_system.jpg',
    color: '#f59e0b',
    bgColor: 'from-amber-500/20 to-amber-600/20',
  },
  tehnolog: {
    name: 'Технолог',
    short: 'ТЕХ',
    logo: '/images/credits/tehnolog.png',
    color: '#06b6d4',
    bgColor: 'from-cyan-500/20 to-cyan-600/20',
  },
};

export function SourceAvailability({
  unit,
  variant = 'card',
  size: _size = 'compact',
  activeSource,
  onSourceChange,
}: SourceAvailabilityProps) {
  if (variant === 'card') {
    // Compact badges on the grid card — source logo + cost.
    return (
      <div className="flex items-center gap-1 mt-1">
        {unit.sources.map((source) => {
          const config = sourceConfig[source.id];
          if (!config) return null;
          const cost = getUnitCostForSource(unit.id, source.id);
          return (
            <div
              key={source.id}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border backdrop-blur-sm',
                'bg-gradient-to-br ' + config.bgColor,
              )}
              style={{ borderColor: `${config.color}80` }}
              title={`${config.name}: ${cost ?? '?'} очков`}
            >
              <GitHubPagesImage
                src={config.logo}
                alt={config.name}
                width={10}
                height={10}
                className="rounded-[1px]"
              />
              <span className="text-[8px] font-bold font-ibm-mono tabular-nums" style={{ color: config.color }}>
                {cost ?? '?'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Detail-page stat switcher — compact pills (the old big «Доступность в
  // источниках» cards were дубляж with the rest of the page; a small toggle
  // above the stats is enough to pick which army list's stats to view).
  return (
    <div data-testid="source-switcher" className="flex items-center gap-2 flex-wrap">
      <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
        Армлист:
      </span>
      {unit.sources.map((source) => {
        const config = sourceConfig[source.id];
        if (!config) return null;
        const cost = getUnitCostForSource(unit.id, source.id);
        const isActive = source.id === activeSource;
        const Tag: ElementType = onSourceChange ? 'button' : 'div';
        return (
          <Tag
            key={source.id}
            type={onSourceChange ? 'button' : undefined}
            onClick={onSourceChange ? () => onSourceChange(source.id) : undefined}
            aria-pressed={onSourceChange ? isActive : undefined}
            title={`${config.name}: ${cost ?? '?'} очков`}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border transition-all',
              onSourceChange && 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]',
              !isActive && 'opacity-55 hover:opacity-100',
            )}
            style={{
              borderColor: isActive ? config.color : 'rgba(120,113,108,0.3)',
              backgroundColor: isActive ? `${config.color}1f` : 'transparent',
            }}
          >
            <GitHubPagesImage src={config.logo} alt={config.name} width={22} height={22} className="rounded-[2px]" />
            <span className="font-russo text-sm font-bold" style={{ color: isActive ? config.color : '#a8a29e' }}>
              {config.name}
            </span>
            <span className="ml-auto inline-flex items-center gap-0.5 font-ibm-mono text-base font-bold text-military-amber tabular-nums">
              <span aria-hidden>⬡</span>{cost ?? '?'}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}
