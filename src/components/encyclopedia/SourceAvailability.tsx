import type { ElementType } from 'react';
import { Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const sourceConfig: Record<string, { name: string; short: string; icon: any; color: string; bgColor: string }> = {
  star_system: {
    name: 'Star System',
    short: 'SS',
    icon: Star,
    color: '#f59e0b',
    bgColor: 'from-amber-500/20 to-amber-600/20',
  },
  tehnolog: {
    name: 'Технолог',
    short: 'ТЕХ',
    icon: Shield,
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
    return (
      <div className="flex items-center gap-1 mt-1">
        {unit.sources.map((source) => {
          const config = sourceConfig[source.id];
          if (!config) return null;

          return (
            <div
              key={source.id}
              className={cn(
                "px-1.5 py-0.5 rounded-[2px] border backdrop-blur-sm",
                "bg-gradient-to-br " + config.bgColor,
              )}
              style={{ borderColor: `${config.color}80` }}
              title={`${config.name}: ${source.cost} очков`}
            >
              <span className="text-[8px] font-bold" style={{ color: config.color }}>
                {config.short}
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

          const IconComponent = config.icon;
          const isActive = interactive && source.id === activeSource;
          const Tag: ElementType = interactive ? 'button' : 'div';

          return (
            <Tag
              key={source.id}
              type={interactive ? 'button' : undefined}
              onClick={interactive ? () => onSourceChange!(source.id) : undefined}
              aria-pressed={interactive ? isActive : undefined}
              className={cn(
                'relative group flex items-center gap-3 text-left',
                'px-4 py-3 rounded-sm border-2 backdrop-blur-sm w-full',
                'bg-gradient-to-br ' + config.bgColor,
                'transition-all duration-200',
                interactive
                  ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                  : 'hover:scale-105',
                interactive && !isActive && 'opacity-55 hover:opacity-95',
              )}
              style={{ borderColor: isActive ? config.color : 'rgba(120,113,108,0.25)' }}
            >
              {/* Source icon */}
              <div
                className="p-2 rounded-sm transition-colors duration-300"
                style={{ backgroundColor: `${config.color}33` }}
              >
                <IconComponent className="w-4 h-4" style={{ color: config.color }} />
              </div>

              {/* Source info */}
              <div className="flex-1 min-w-0">
                <div className="font-russo text-sm font-bold text-white mb-1">
                  {config.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-ibm-mono text-xs text-military-sand">
                    {source.cost} очков
                  </span>
                  <span className="text-military-steel/40">•</span>
                  <span className="font-ibm-mono text-xs text-military-steel/60 uppercase truncate">
                    {unit.encyclopedia?.class || (unit.type === 'squad' ? 'Пехота' : 'Техника')}
                  </span>
                </div>
              </div>

              {/* Active marker */}
              {isActive && (
                <span
                  className="absolute top-1 right-2 font-ibm-mono text-[8px] uppercase tracking-wider"
                  style={{ color: config.color }}
                >
                  ● активен
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
            <Shield className="w-4 h-4 text-military-amber/70 flex-shrink-0 mt-0.5" />
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
