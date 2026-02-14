'use client';

import { useEffect } from 'react';
import { Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AimedShotToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const AIMED_SHOT_STORAGE_KEY = 'bronepehota_aimed_shot_enabled';

export function AimedShotToggle({ enabled, onEnabledChange }: AimedShotToggleProps) {
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(AIMED_SHOT_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(AIMED_SHOT_STORAGE_KEY, String(newValue));
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'group relative w-full text-left rounded-lg border-2 transition-all duration-200',
        'p-3 min-h-[56px] touch-manipulation',
        'active:scale-[0.98]',
        enabled
          ? 'bg-cyan-950/30 border-cyan-600/60 hover:border-cyan-500'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      )}
      data-testid="aimed-shot-toggle"
      aria-pressed={enabled}
      aria-label={`Прицельная стрельба: ${enabled ? 'включена' : 'выключена'}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
          enabled ? 'bg-cyan-600/30' : 'bg-slate-700/50'
        )}>
          <Crosshair className={cn(
            'w-4 h-4 transition-colors',
            enabled ? 'text-cyan-400' : 'text-slate-500'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-cyan-300' : 'text-slate-400'
            )}>
              ПРИЦЕЛЬНЫЙ
            </span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-mono',
              enabled
                ? 'bg-cyan-600/30 text-cyan-300'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className={cn(
            'text-[10px] font-mono truncate mt-0.5',
            enabled ? 'text-cyan-400/70' : 'text-slate-500'
          )}>
            Дальность x2 (только пехота)
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={cn(
          'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative',
          enabled ? 'bg-cyan-600/40' : 'bg-slate-700'
        )}>
          <div className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
            enabled
              ? 'left-[22px] bg-cyan-400'
              : 'left-0.5 bg-slate-500'
          )} />
        </div>
      </div>
    </button>
  );
}

// Helper function to get aimed shot state from localStorage
export function getAimedShotEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(AIMED_SHOT_STORAGE_KEY);
  return saved === 'true';
}
