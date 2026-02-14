'use client';

import { useState, useEffect } from 'react';
import { Crosshair, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AimedShotToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

const AIMED_SHOT_STORAGE_KEY = 'bronepehota_aimed_shot_enabled';

export function AimedShotToggle({ enabled, onEnabledChange }: AimedShotToggleProps) {
  const [showModal, setShowModal] = useState(false);

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
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3 min-h-[56px]',
          enabled
            ? 'bg-cyan-950/30 border-cyan-600/60'
            : 'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="aimed-shot-toggle"
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
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={enabled}
            aria-label={`Прицельная стрельба: ${enabled ? 'включена' : 'выключена'}`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-cyan-300' : 'text-slate-400'
            )}>
              ПРИЦЕЛЬНЫЙ
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              enabled ? 'text-cyan-400/70' : 'text-slate-500'
            )}>
              Дальность x2 (только пехота)
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о прицельной стрельбе"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>

          {/* Toggle indicator */}
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative touch-manipulation',
              enabled ? 'bg-cyan-600/40' : 'bg-slate-700'
            )}
            aria-label={enabled ? 'Отключить прицельную стрельбу' : 'Включить прицельную стрельбу'}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
              enabled
                ? 'left-[22px] bg-cyan-400'
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
                <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-cyan-300">ПРИЦЕЛЬНАЯ СТРЕЛЬБА</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
                <h4 className="text-xs font-mono font-bold text-cyan-400 mb-2">Правило 11.1</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Если пехотинец не предпринимает никаких действий кроме стрельбы,
                  то прицельная дальность его выстрела увеличивается <strong>ВДВОЕ</strong>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Применение</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Только для пехоты (не техники)</li>
                  <li>• Мощность выстрела не меняется</li>
                  <li>• Не распространяется на гранаты</li>
                  <li>• Нужно объявить до выстрела</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get aimed shot state from localStorage
export function getAimedShotEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(AIMED_SHOT_STORAGE_KEY);
  return saved === 'true';
}
