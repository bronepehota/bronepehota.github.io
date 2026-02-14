'use client';

import { useEffect } from 'react';
import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurpriseAttackToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const SURPRISE_ATTACK_STORAGE_KEY = 'bronepehota_surprise_attack_enabled';

export function SurpriseAttackToggle({ enabled, onEnabledChange }: SurpriseAttackToggleProps) {
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(SURPRISE_ATTACK_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(SURPRISE_ATTACK_STORAGE_KEY, String(newValue));
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'group relative w-full text-left rounded-lg border-2 transition-all duration-200',
        'p-3 min-h-[56px] touch-manipulation',
        'active:scale-[0.98]',
        enabled
          ? 'bg-purple-950/30 border-purple-600/60 hover:border-purple-500'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      )}
      data-testid="surprise-attack-toggle"
      aria-pressed={enabled}
      aria-label={`Атака с тыла: ${enabled ? 'включена' : 'выключена'}`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
          enabled ? 'bg-purple-600/30' : 'bg-slate-700/50'
        )}>
          <EyeOff className={cn(
            'w-4 h-4 transition-colors',
            enabled ? 'text-purple-400' : 'text-slate-500'
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-purple-300' : 'text-slate-400'
            )}>
              С ТЫЛА
            </span>
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-mono',
              enabled
                ? 'bg-purple-600/30 text-purple-300'
                : 'bg-slate-700/50 text-slate-500'
            )}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </div>
          <p className={cn(
            'text-[10px] font-mono truncate mt-0.5',
            enabled ? 'text-purple-400/70' : 'text-slate-500'
          )}>
            Урон x2 / 2D6 в ББ
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={cn(
          'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative',
          enabled ? 'bg-purple-600/40' : 'bg-slate-700'
        )}>
          <div className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
            enabled
              ? 'left-[22px] bg-purple-400'
              : 'left-0.5 bg-slate-500'
          )} />
        </div>
      </div>
    </button>
  );
}

// Helper function to get surprise attack state from localStorage
export function getSurpriseAttackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(SURPRISE_ATTACK_STORAGE_KEY);
  return saved === 'true';
}
