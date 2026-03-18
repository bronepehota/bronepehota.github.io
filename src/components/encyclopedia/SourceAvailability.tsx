import { Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EncyclopediaUnit } from '@/lib/encyclopedia-registry';
import { getAllSources } from '@/lib/sources-registry';

interface SourceAvailabilityProps {
  unit: EncyclopediaUnit;
  variant?: 'card' | 'detail';
  size?: 'compact' | 'full';
}

const sourceConfig: Record<string, { name: string; icon: any; color: string; bgColor: string }> = {
  star_system: {
    name: 'Star System',
    icon: Star,
    color: '#f59e0b',
    bgColor: 'from-amber-500/20 to-amber-600/20',
  },
  tehnolog: {
    name: 'Технолог',
    icon: Shield,
    color: '#3b82f6',
    bgColor: 'from-blue-500/20 to-blue-600/20',
  },
};

export function SourceAvailability({ unit, variant = 'card', size: _size = 'compact' }: SourceAvailabilityProps) {
  const _sources = getAllSources();

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
                "border-" + config.color + "/50"
              )}
              title={`${config.name}: ${source.cost} очков`}
            >
              <span className="text-[8px] font-bold" style={{ color: config.color }}>
                {config.name === 'Star System' ? 'SS' : 'ТЕХ'}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Detail page version - larger with more info
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-gradient-to-r from-military-rust/50 to-transparent" />
        <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-widest">
          ДОСТУПНОСТЬ В ИСТОЧНИКАХ
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-military-rust/50 to-transparent" />
      </div>

      <div className="flex flex-wrap gap-3">
        {unit.sources.map((source) => {
          const config = sourceConfig[source.id];
          if (!config) return null;

          const IconComponent = config.icon;

          return (
            <div
              key={source.id}
              className={cn(
                "relative group flex items-center gap-3",
                "px-4 py-3 rounded-sm border-2 backdrop-blur-sm",
                "bg-gradient-to-br " + config.bgColor,
                "border-" + config.color + "/40",
                "hover:border-" + config.color + "/60",
                "transition-all duration-300 hover:scale-105"
              )}
            >
              {/* Source icon */}
              <div
                className={cn(
                  "p-2 rounded-sm transition-colors duration-300",
                  "bg-" + config.color + "/20 group-hover:bg-" + config.color + "/30"
                )}
              >
                <IconComponent className="w-4 h-4" style={{ color: config.color }} />
              </div>

              {/* Source info */}
              <div className="flex-1">
                <div className="font-russo text-sm font-bold text-white mb-1">
                  {config.name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-ibm-mono text-xs text-military-sand">
                    {source.cost} очков
                  </span>
                  <span className="text-military-steel/40">•</span>
                  <span className="font-ibm-mono text-xs text-military-steel/60 uppercase">
                    {unit.encyclopedia?.class || unit.type === 'squad' ? 'Пехота' : 'Техника'}
                  </span>
                </div>
              </div>

              {/* Corner decorations */}
              <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-military-rust/30 rounded-tr opacity-50" />
              <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-military-rust/30 rounded-bl opacity-50" />
            </div>
          );
        })}
      </div>

      {unit.sources.length > 1 && (
        <div className="mt-3 p-3 bg-military-charcoal/50 rounded border border-military-rust/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-military-amber/70 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-military-taupe leading-relaxed">
              Юнит доступен в нескольких армейских списках с различной стоимостью.
              Выберите соответствующий источник при создании армии.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
