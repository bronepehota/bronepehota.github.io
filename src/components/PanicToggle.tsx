'use client';

import { useEffect } from 'react';
import { Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanicToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  rulesVersion: string;
}

const PANIC_STORAGE_KEY = 'bronepehota_panic_enabled';

export function PanicToggle({ enabled, onEnabledChange, rulesVersion }: PanicToggleProps) {
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(PANIC_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(PANIC_STORAGE_KEY, String(newValue));
  };

  // Rule description based on version
  const ruleText = rulesVersion === 'community_star_system'
    ? 'D6 > ранг при 50% потерь'
    : 'D6 = броня при уроне';

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'group relative w-full text-left rounded-lg border-2 transition-all duration-200',
        'p-3 min-h-[56px] touch-manipulation',
        'active:scale-[0.98]',
        enabled
          ? 'bg-orange-950/30 border-orange-600/60 hover:border-orange-500'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      )}
      data-testid="panic-toggle"
      aria-pressed={enabled}
      aria-label={`Паника: ${enabled ? 'включена' : 'выключена'}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
          enabled ? 'bg-orange-600/30' : 'bg-slate-700/50'
        )}>
          <Footprints className={cn(
            'w-4 h-4 transition-colors',
            enabled ? 'text-orange-400' : 'text-slate-500'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-orange-300' : 'text-slate-400'
            )}>
              ПАНИКА
            </span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-mono',
              enabled
                ? 'bg-orange-600/30 text-orange-300'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className={cn(
            'text-[10px] font-mono truncate mt-0.5',
            enabled ? 'text-orange-400/70' : 'text-slate-500'
          )}>
            {ruleText}
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={cn(
          'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative',
          enabled ? 'bg-orange-600/40' : 'bg-slate-700'
        )}>
          <div className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
            enabled
              ? 'left-[22px] bg-orange-400'
              : 'left-0.5 bg-slate-500'
          )} />
        </div>
      </div>
    </button>
  );
}
