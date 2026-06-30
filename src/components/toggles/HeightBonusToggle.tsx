'use client';

import { useState, useEffect } from 'react';
import { Mountain, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeightBonusToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const HEIGHT_BONUS_STORAGE_KEY = 'bronepehota_height_bonus_enabled';

export function HeightBonusToggle({ enabled, onEnabledChange }: HeightBonusToggleProps) {
  const [showModal, setShowModal] = useState(false);

  // Load saved preference on mount (only once, intentionally)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem(HEIGHT_BONUS_STORAGE_KEY);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(HEIGHT_BONUS_STORAGE_KEY, String(newValue));
  };

  return (
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3 min-h-[56px]',
          enabled
            ? 'bg-emerald-950/30 border-emerald-600/60'
            : 'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="height-bonus-toggle"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
            enabled ? 'bg-emerald-600/30' : 'bg-slate-700/50'
          )}>
            <Mountain className={cn(
              'w-4 h-4 transition-colors',
              enabled ? 'text-emerald-400' : 'text-slate-500'
            )} />
          </div>

          {/* Content */}
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={enabled}
            aria-label={`Стрельба с высоты: ${enabled ? 'включена' : 'выключена'}`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-emerald-300' : 'text-slate-400'
            )}>
              С ВЫСОТЫ
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              enabled ? 'text-emerald-400/70' : 'text-slate-500'
            )}>
              +1 к попаданию
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о стрельбе с высоты"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>

          {/* Toggle indicator */}
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative touch-manipulation',
              enabled ? 'bg-emerald-600/40' : 'bg-slate-700'
            )}
            aria-label={enabled ? 'Отключить стрельбу с высоты' : 'Включить стрельбу с высоты'}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
              enabled
                ? 'left-[22px] bg-emerald-400'
                : 'left-0.5 bg-slate-500'
            )} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                  <Mountain className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-emerald-300">СТРЕЛЬБА С ВЫСОТЫ</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/30">
                <h4 className="text-xs font-mono font-bold text-emerald-400 mb-2">Правило</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Стрельба с возвышенности даёт +1 к броску на попадание.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Применение</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Только для выстрелов (не гранаты / не ближний бой)</li>
                  <li>• Пехота и техника</li>
                  <li>• Включается на конкретный выстрел</li>
                  <li>• Нет в правилах v0.3 — удобство по решению игрока</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get height-bonus gate state from localStorage
export function getHeightBonusEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(HEIGHT_BONUS_STORAGE_KEY);
  return saved === 'true';
}
