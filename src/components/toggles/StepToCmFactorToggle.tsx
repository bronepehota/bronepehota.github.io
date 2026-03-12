'use client';

import { useState, useEffect } from 'react';
import { Scale, Info, X, Check } from 'lucide-react';
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

  const handleSelect = (newValue: StepFactor) => {
    onValueChange(newValue);
    localStorage.setItem(STEP_TO_CM_FACTOR_STORAGE_KEY, newValue);
  };

  return (
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3',
          'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="step-to-cm-factor-toggle"
      >
        {/* Header row with title and info button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-slate-700/50">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold tracking-wide text-slate-300">
                1 шаг = ?
              </span>
            </div>
          </div>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о масштабе"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        {/* Two clear option buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* 4cm option */}
          <button
            onClick={() => handleSelect('4')}
            className={cn(
              'relative p-2 rounded-lg border-2 transition-all duration-200',
              'flex flex-col items-center justify-center gap-0.5',
              'touch-manipulation min-h-[48px]',
              value === '4'
                ? 'bg-violet-950/40 border-violet-500'
                : 'bg-slate-900/40 border-slate-700 hover:border-slate-600'
            )}
            aria-pressed={value === '4'}
            aria-label="1 шаг = 4см"
          >
            {value === '4' && (
              <div className="absolute top-1 right-1">
                <Check className="w-3 h-3 text-violet-400" />
              </div>
            )}

            <span className={cn(
              'text-xl font-mono font-black leading-none',
              value === '4' ? 'text-violet-400' : 'text-slate-600'
            )}>
              4
            </span>
            <span className={cn(
              'text-[10px] font-mono leading-tight',
              value === '4' ? 'text-violet-300' : 'text-slate-500'
            )}>
              см
            </span>
          </button>

          {/* 5cm option */}
          <button
            onClick={() => handleSelect('5')}
            className={cn(
              'relative p-2 rounded-lg border-2 transition-all duration-200',
              'flex flex-col items-center justify-center gap-0.5',
              'touch-manipulation min-h-[48px]',
              value === '5'
                ? 'bg-emerald-950/40 border-emerald-500'
                : 'bg-slate-900/40 border-slate-700 hover:border-slate-600'
            )}
            aria-pressed={value === '5'}
            aria-label="1 шаг = 5см"
          >
            {value === '5' && (
              <div className="absolute top-1 right-1">
                <Check className="w-3 h-3 text-emerald-400" />
              </div>
            )}

            <span className={cn(
              'text-xl font-mono font-black leading-none',
              value === '5' ? 'text-emerald-400' : 'text-slate-600'
            )}>
              5
            </span>
            <span className={cn(
              'text-[10px] font-mono leading-tight',
              value === '5' ? 'text-emerald-300' : 'text-slate-500'
            )}>
              см
            </span>
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
