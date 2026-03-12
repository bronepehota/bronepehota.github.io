import { Shield, Footprints, Flame, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DurabilityZone } from '@/lib/types';

interface MachineStatsPanelProps {
  currentDurability: number;
  maxDurability: number;
  speed: number;
  zone: DurabilityZone;
  onUpdateDurability: (delta: number) => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

const getZoneColor = (color: 'green' | 'yellow' | 'red') => {
  const colors = {
    green: { bar: 'bg-green-500', text: 'text-green-400' },
    yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400' },
    red: { bar: 'bg-red-500', text: 'text-red-400' }
  };
  return colors[color];
};

export function MachineStatsPanel({
  currentDurability,
  maxDurability,
  speed,
  zone,
  onUpdateDurability,
  distanceInputUnit,
  stepToCmFactor
}: MachineStatsPanelProps) {
  return (
    <div className="relative bg-slate-900/60 p-2 rounded-sm">
      {/* Tech corners */}
      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

      <div className="flex justify-between items-center mb-1">
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" /> Прочность
        </span>
        <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
          <Footprints className="w-2.5 h-2.5 md:w-3 md:h-3" /> Скорость
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* Durability controls - Tech Style */}
        <div className="flex-1 flex items-center gap-1">
          {/* Damage Button */}
          <button
            onClick={() => onUpdateDurability(-1)}
            disabled={currentDurability === 0}
            data-testid="durability-decrease"
            className={cn(
              "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-red-950/30 hover:bg-red-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-red-800/50 shrink-0 overflow-hidden",
              getZoneColor(zone.color).text
            )}
            title="Нанести урон"
          >
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-600/40" />
            <Flame className="w-4 h-4" />
          </button>

          {/* Durability Value */}
          <span className={cn("text-sm md:text-base font-mono font-black min-w-[20px] text-center shrink-0", getZoneColor(zone.color).text)}>
            {currentDurability}
          </span>

          {/* Repair Button */}
          <button
            onClick={() => onUpdateDurability(1)}
            disabled={currentDurability === maxDurability}
            data-testid="durability-increase"
            className={cn(
              "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-emerald-950/30 hover:bg-emerald-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-emerald-800/50 shrink-0 overflow-hidden",
              getZoneColor(zone.color).text
            )}
            title="Ремонт"
          >
            <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-emerald-600/40" />
            <Wrench className="w-4 h-4" />
          </button>

          {/* Segmented Progress Bar - Military Style */}
          <div className="flex-1 flex items-center gap-px">
            {Array.from({ length: maxDurability }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-sm transition-all flex-1",
                  i < (currentDurability || 0)
                    ? getZoneColor(zone.color).bar
                    : "bg-slate-800"
                )}
              />
            ))}
          </div>
        </div>
        {/* Speed display - Tech Style */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <Footprints className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 mb-1 md:mb-0.5 shrink-0" />
          <span className="text-sm md:text-base font-mono font-black text-yellow-400">
            {distanceInputUnit === 'cm' ? `${speed * stepToCmFactor}см` : `${speed}шаг`}
          </span>
        </div>
      </div>
    </div>
  );
}
