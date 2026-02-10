'use client';

import { useState, useEffect } from 'react';
import { Footprints, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanicToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  rulesVersion: string;
}

const PANIC_STORAGE_KEY = 'bronepehota_panic_enabled';

export function PanicToggle({ enabled, onEnabledChange, rulesVersion }: PanicToggleProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(PANIC_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);

  const handleToggle = (newValue: boolean) => {
    onEnabledChange(newValue);
    localStorage.setItem(PANIC_STORAGE_KEY, String(newValue));
  };

  // Show for all rules - panic can be toggled independently
  const isDisabled = false;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-slate-800/60 backdrop-blur-sm p-4 transition-all duration-300',
        isDisabled ? 'border-slate-700/50 opacity-50' : 'border-orange-900/30 hover:border-orange-700/50'
      )}
      data-testid="panic-toggle"
    >
      {/* Animated gradient background for enabled state */}
      {enabled && !isDisabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-transparent to-red-950/20 animate-pulse" />
      )}

      {/* Corner accent for enabled state */}
      {enabled && !isDisabled && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-orange-500/60" />
          <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-orange-500/60" />
        </>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg transition-all duration-300',
              enabled && !isDisabled ? 'bg-orange-950/50 border border-orange-700/50' : 'bg-slate-900/50 border border-slate-700/50'
            )}>
              <Footprints className={cn(
                'w-5 h-5 transition-colors duration-300',
                enabled && !isDisabled ? 'text-orange-400' : 'text-slate-500'
              )} />
            </div>
            <div>
              <h3 className={cn(
                'font-mono font-bold text-sm tracking-wide transition-colors duration-300',
                enabled && !isDisabled ? 'text-orange-300' : 'text-slate-400'
              )}>
                МЕХАНИКА ПАНИКИ
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {rulesVersion === 'community_star_system' ? 'Правила сообщества' : 'Дополнительная опция'}
              </p>
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-500 hover:text-slate-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Подробнее о панике"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="mb-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-orange-300">Правила сообщества:</strong> При 50% потерь отряд проходит тест на панику.
                  D6 &gt; Армейский ранг = паника.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p>
                  <strong className="text-blue-300">Официальные правила:</strong> При получении урона солдат проходит тест выживания.
                  D6 == Бр = паника (опционально).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle switch */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={cn(
              'text-xs font-mono transition-colors duration-300',
              enabled && !isDisabled ? 'text-orange-300/80' : 'text-slate-500'
            )}>
              {enabled ? 'ПАНИКА ВКЛЮЧЕНА' : 'ПАНИКА ОТКЛЮЧЕНА'}
            </p>
            {rulesVersion === 'tehnolog' && enabled && (
              <p className="text-[10px] text-blue-400/70 mt-1">Проверка при получении урона</p>
            )}
          </div>

          {/* Custom toggle switch */}
          <button
            onClick={() => !isDisabled && handleToggle(!enabled)}
            disabled={isDisabled}
            className={cn(
              'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50',
              'border flex items-center shrink-0 min-w-[56px] min-h-[28px]',
              isDisabled
                ? 'bg-slate-900 border-slate-700 cursor-not-allowed'
                : enabled
                  ? 'bg-orange-900/50 border-orange-600 cursor-pointer hover:bg-orange-900/70'
                  : 'bg-slate-900 border-slate-700 cursor-pointer hover:bg-slate-800'
            )}
            aria-label={enabled ? 'Отключить панику' : 'Включить панику'}
            aria-pressed={enabled}
          >
            {/* Toggle dot */}
            <span className={cn(
              'absolute w-5 h-5 rounded-full transition-all duration-300 shadow-md',
              isDisabled
                ? 'bg-slate-700 left-0.5'
                : enabled
                  ? 'bg-orange-400 left-[calc(100%-1.625rem)] shadow-orange-400/50'
                  : 'bg-slate-500 left-0.5'
            )}>
              {/* Inner glow for enabled state */}
              {enabled && !isDisabled && (
                <div className="absolute inset-0 rounded-full bg-orange-300/30 blur-[2px]" />
              )}
            </span>

            {/* Track glow for enabled state */}
            {enabled && !isDisabled && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
            )}
          </button>
        </div>

        {/* Visual indicator line */}
        <div className={cn(
          'h-px mt-3 transition-colors duration-300',
          enabled && !isDisabled ? 'bg-gradient-to-r from-orange-500/50 via-orange-400/30 to-transparent' : 'bg-slate-800'
        )} />
      </div>
    </div>
  );
}
