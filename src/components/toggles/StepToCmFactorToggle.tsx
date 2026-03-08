'use client';

import { useState, useEffect } from 'react';
import { Scale, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepFactor = '4' | '5';

interface StepToCmFactorToggleProps {
  value: StepFactor;
  onValueChange: (value: StepFactor) => void;
}

const STEP_TO_CM_FACTOR_STORAGE_KEY = 'bronepehota_step_to_cm_factor';

export function StepToCmFactorToggle({ value, onValueChange }: StepToCmFactorToggleProps) {
  const [showModal, setShowModal] = useState(false);

  // Load saved preference on mount (only once, intentionally)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem(STEP_TO_CM_FACTOR_STORAGE_KEY);
    if (saved === '4' || saved === '5') {
      onValueChange(saved);
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleToggle = () => {
    const newValue: StepFactor = value === '5' ? '4' : '5';
    onValueChange(newValue);
    localStorage.setItem(STEP_TO_CM_FACTOR_STORAGE_KEY, newValue);
  };

  return (
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3 min-h-[56px]',
          value === '4'
            ? 'bg-violet-950/30 border-violet-600/60'
            : 'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="step-to-cm-factor-toggle"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
            value === '4' ? 'bg-violet-600/30' : 'bg-slate-700/50'
          )}>
            <Scale className={cn(
              'w-4 h-4 transition-colors',
              value === '4' ? 'text-violet-400' : 'text-slate-500'
            )} />
          </div>

          {/* Content */}
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={value === '4'}
            aria-label={`Масштаб: 1 шаг = ${value}см`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              value === '4' ? 'text-violet-300' : 'text-slate-400'
            )}>
              МАСШТАБ
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              value === '4' ? 'text-violet-400/70' : 'text-slate-500'
            )}>
              1 шаг = {value}см
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о масштабе"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>

          {/* Toggle indicator */}
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative touch-manipulation',
              value === '4' ? 'bg-violet-600/40' : 'bg-slate-700'
            )}
            aria-label={value === '5' ? 'Переключить на 4см' : 'Переключить на 5см'}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
              value === '4'
                ? 'left-[22px] bg-violet-400'
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
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-violet-300">МАСШТАБ ИГРЫ</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-violet-950/30 border border-violet-800/30">
                <h4 className="text-xs font-mono font-bold text-violet-400 mb-2">Коэффициент перевода</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Выберите масштаб перевода шагов в сантиметры для вашего игрового поля.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Варианты масштаба</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><strong className="text-slate-300">1 шаг = 5см</strong> — стандарт Tehnolog (для полей 40×50см)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">•</span>
                    <span><strong className="text-slate-300">1 шаг = 4см</strong> — Community Star System (для полей 32×40см)</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Рекомендация</h4>
                <p className="text-sm text-slate-400">
                  Выберите масштаб в зависимости от размера вашего игрового поля и используемых миниатюр.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get step-to-cm factor from localStorage
export function getStepToCmFactor(): '4' | '5' {
  if (typeof window === 'undefined') return '5';
  const saved = localStorage.getItem(STEP_TO_CM_FACTOR_STORAGE_KEY);
  return saved === '4' ? '4' : '5';
}
