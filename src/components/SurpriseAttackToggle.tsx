'use client';

import { useState, useEffect } from 'react';
import { EyeOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurpriseAttackToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const SURPRISE_ATTACK_STORAGE_KEY = 'bronepehota_surprise_attack_enabled';

export function SurpriseAttackToggle({ enabled, onEnabledChange }: SurpriseAttackToggleProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(SURPRISE_ATTACK_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);

  const handleToggle = (newValue: boolean) => {
    onEnabledChange(newValue);
    localStorage.setItem(SURPRISE_ATTACK_STORAGE_KEY, String(newValue));
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-slate-800/60 backdrop-blur-sm p-4 transition-all duration-300',
        'border-purple-900/30 hover:border-purple-700/50'
      )}
      data-testid="surprise-attack-toggle"
    >
      {/* Animated gradient background for enabled state */}
      {enabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-pink-950/20 animate-pulse" />
      )}

      {/* Corner accents for enabled state */}
      {enabled && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-purple-500/60" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-purple-500/60" />
        </>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg transition-all duration-300',
              enabled ? 'bg-purple-950/50 border border-purple-700/50' : 'bg-slate-900/50 border border-slate-700/50'
            )}>
              <EyeOff className={cn(
                'w-5 h-5 transition-colors duration-300',
                enabled ? 'text-purple-400' : 'text-slate-500'
              )} />
            </div>
            <div>
              <h3 className={cn(
                'font-mono font-bold text-sm tracking-wide transition-colors duration-300',
                enabled ? 'text-purple-300' : 'text-slate-400'
              )}>
                АТАКА С ТЫЛА
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Опциональное правило
              </p>
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-500 hover:text-slate-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Подробнее об атаке с тыла"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <p>
                <strong className="text-purple-300">Выстрел с тыла:</strong> При атаке в спину противника,
                бросок урона выполняется <strong className="text-purple-400">дважды</strong> — берётся лучший результат.
              </p>
              <p>
                <strong className="text-purple-300">Ближний бой с тыла:</strong> Атакующий бросает 2D6
                и берёт лучший результат для определения победителя.
              </p>
              <p className="text-slate-500">
                У техники ББ игнорируется при атаке с тыла.
              </p>
            </div>
          </div>
        )}

        {/* Toggle switch */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              'text-xs font-mono transition-colors duration-300',
              enabled ? 'text-purple-300/80' : 'text-slate-500'
            )}>
              {enabled ? 'С ТЫЛА ВКЛЮЧЕНА' : 'С ТЫЛА ОТКЛЮЧЕНА'}
            </p>
          </div>

          {/* Custom toggle switch */}
          <button
            onClick={() => handleToggle(!enabled)}
            className={cn(
              'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50',
              'border flex items-center shrink-0 min-w-[56px] min-h-[28px]',
              enabled
                ? 'bg-purple-900/50 border-purple-600 cursor-pointer hover:bg-purple-900/70'
                : 'bg-slate-900 border-slate-700 cursor-pointer hover:bg-slate-800'
            )}
            aria-label={enabled ? 'Отключить атаку с тыла' : 'Включить атаку с тыла'}
            aria-pressed={enabled}
          >
            {/* Toggle dot */}
            <span className={cn(
              'absolute w-5 h-5 rounded-full transition-all duration-300 shadow-md',
              enabled
                ? 'bg-purple-400 left-[calc(100%-1.625rem)] shadow-purple-400/50'
                : 'bg-slate-500 left-0.5'
            )}>
              {/* Inner glow for enabled state */}
              {enabled && (
                <div className="absolute inset-0 rounded-full bg-purple-300/30 blur-[2px]" />
              )}
            </span>

            {/* Track glow for enabled state */}
            {enabled && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
            )}
          </button>
        </div>

        {/* Visual indicator line */}
        <div className={cn(
          'h-px mt-3 transition-colors duration-300',
          enabled ? 'bg-gradient-to-r from-purple-500/50 via-purple-400/30 to-transparent' : 'bg-slate-800'
        )} />
      </div>
    </div>
  );
}

// Helper function to get surprise attack state from localStorage
export function getSurpriseAttackEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(SURPRISE_ATTACK_STORAGE_KEY);
  return saved === 'true';
}
