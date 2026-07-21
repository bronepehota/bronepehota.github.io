import type { ElementType } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GitHubPagesImage } from '@/components/GitHubPagesImage';
import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

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
          return (
            <div
              key={source.id}
              className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border backdrop-blur-sm',
                'bg-gradient-to-br ' + config.bgColor,
              )}
              style={{ borderColor: `${config.color}80` }}
              title={`${config.name}: ${source.cost} очков`}
            >
              <GitHubPagesImage
                src={config.logo}
                alt={config.name}
                width={10}
                height={10}
                className="rounded-[1px]"
              />
              <span className="text-[8px] font-bold font-ibm-mono tabular-nums" style={{ color: config.color }}>
                {source.cost}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  const interactive = !!onSourceChange && unit.sources.length > 1;

  // Detail page version — larger cards; clickable to switch stats when onSourceChange is given.
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-military-rust/50 to-transparent" />
        <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-widest">
          ДОСТУПНОСТЬ В ИСТОЧНИКАХ
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-military-rust/50 to-transparent" />
      </div>

      <div className={cn('flex flex-wrap gap-3', interactive && 'grid grid-cols-1 sm:grid-cols-2')}>
        {unit.sources.map((source) => {
          const config = sourceConfig[source.id];
          if (!config) return null;

          const isActive = interactive && source.id === activeSource;
          const Tag: ElementType = interactive ? 'button' : 'div';

          return (
            <Tag
              key={source.id}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onSourceChange!(source.id) : undefined}
              aria-pressed={interactive ? isActive : undefined}
              className={cn(
                'relative group flex items-center gap-3.5 text-left w-full',
                'px-4 py-3.5 rounded-sm border-2 backdrop-blur-sm overflow-hidden',
                'bg-gradient-to-br ' + config.bgColor,
                'transition-all duration-200',
                interactive
                  ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                  : 'hover:scale-[1.02]',
                interactive && !isActive && 'opacity-60 hover:opacity-95',
              )}
              style={{
                borderColor: isActive ? config.color : 'rgba(120,113,108,0.25)',
                boxShadow: isActive ? `0 0 24px -8px ${config.color}` : undefined,
              }}
            >
              {/* Source logo in a framed, scan-lined tinted tile */}
              <div
                className="relative shrink-0 rounded-sm p-1.5 transition-colors duration-300"
                style={{ backgroundColor: `${config.color}26`, border: `1px solid ${config.color}55` }}
              >
                <GitHubPagesImage
                  src={config.logo}
                  alt={config.name}
                  width={28}
                  height={28}
                  className="rounded-[2px]"
                />
                <div className="absolute inset-0 rounded-sm bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.05)_50%)] bg-[length:100%_3px] pointer-events-none" />
              </div>

              {/* Source info */}
              <div className="flex-1 min-w-0">
                <div className="font-russo text-sm font-bold text-white mb-0.5">
                  {config.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-ibm-mono text-xs text-military-sand tabular-nums">
                    {source.cost} очков
                  </span>
                  <span className="text-military-steel/40">•</span>
                  <span className="font-ibm-mono text-[10px] text-military-steel/60 uppercase tracking-wide truncate">
                    {unit.encyclopedia?.class || (unit.type === 'squad' ? 'Пехота' : 'Техника')}
                  </span>
                </div>
              </div>

              {/* Active marker */}
              {isActive && (
                <span
                  className="absolute top-1.5 right-2 inline-flex items-center gap-1 font-ibm-mono text-[8px] uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: config.color }} />
                  активен
                </span>
              )}

              {/* Corner decorations */}
              <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-military-rust/30 rounded-tl opacity-50" />
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-military-rust/30 rounded-br opacity-50" />
            </Tag>
          );
        })}
      </div>

      {unit.sources.length > 1 && (
        <div className="mt-3 p-3 bg-military-charcoal/50 rounded border border-military-rust/20">
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-military-amber/70 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-military-taupe leading-relaxed">
              Юнит доступен в нескольких армейских списках с различной стоимостью и характеристиками.
              {' '}
              {interactive
                ? 'Нажмите на источник, чтобы посмотреть его характеристики ниже.'
                : 'Выберите соответствующий источник при создании армии.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
