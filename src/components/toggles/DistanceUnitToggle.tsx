'use client';

import { useState, useEffect } from 'react';
import { Ruler, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DistanceUnit = 'steps' | 'cm';

interface DistanceUnitToggleProps {
  value: DistanceUnit;
  onValueChange: (value: DistanceUnit) => void;
}

const DISTANCE_UNIT_STORAGE_KEY = 'bronepehota_distance_input_unit';

export function DistanceUnitToggle({ value, onValueChange }: DistanceUnitToggleProps) {
  const [showModal, setShowModal] = useState(false);

  // Load saved preference on mount (only once, intentionally)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem(DISTANCE_UNIT_STORAGE_KEY);
    if (saved === 'steps' || saved === 'cm') {
      onValueChange(saved);
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleToggle = () => {
    const newValue: DistanceUnit = value === 'steps' ? 'cm' : 'steps';
    onValueChange(newValue);
    localStorage.setItem(DISTANCE_UNIT_STORAGE_KEY, newValue);
  };

  return (
    <>
      <div
        className={cn(
          'relative w-full rounded-lg border-2 transition-all duration-200',
          'p-3 min-h-[56px]',
          value === 'cm'
            ? 'bg-amber-950/30 border-amber-600/60'
            : 'bg-slate-800/40 border-slate-700/50'
        )}
        data-testid="distance-unit-toggle"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
            value === 'cm' ? 'bg-amber-600/30' : 'bg-slate-700/50'
          )}>
            <Ruler className={cn(
              'w-4 h-4 transition-colors',
              value === 'cm' ? 'text-amber-400' : 'text-slate-500'
            )} />
          </div>

          {/* Content */}
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={value === 'cm'}
            aria-label={`Единицы измерения: ${value === 'steps' ? 'шаги' : 'сантиметры'}`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              value === 'cm' ? 'text-amber-300' : 'text-slate-400'
            )}>
              ЕДИНИЦЫ
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              value === 'cm' ? 'text-amber-400/70' : 'text-slate-500'
            )}>
              {value === 'steps' ? 'Ввод в шагах' : 'Ввод в сантиметрах'}
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о единицах измерения"
          >
            <Info className="w-4 h-4 text-slate-500" />
          </button>

          {/* Toggle indicator */}
          <button
            onClick={handleToggle}
            className={cn(
              'shrink-0 w-10 h-5 rounded-full transition-all duration-200 relative touch-manipulation',
              value === 'cm' ? 'bg-amber-600/40' : 'bg-slate-700'
            )}
            aria-label={value === 'steps' ? 'Переключить на сантиметры' : 'Переключить на шаги'}
          >
            <div className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
              value === 'cm'
                ? 'left-[22px] bg-amber-400'
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
                <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-amber-300">ЕДИНИЦЫ ИЗМЕРЕНИЯ</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/30">
                <h4 className="text-xs font-mono font-bold text-amber-400 mb-2">Настройка ввода дистанции</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Выберите удобную единицу измерения для ввода дистанции в бою.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Варианты</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong className="text-slate-300">Шаги</strong> — ввод в шагах (гексах), как в правилах</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span><strong className="text-slate-300">Сантиметры</strong> — ввод в реальных сантиметрах на столе</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Примечание</h4>
                <p className="text-sm text-slate-400">
                  Это влияет только на ввод расстояния. Отображение дальности на карточках бойцов также изменится.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get distance unit state from localStorage
export function getDistanceUnit(): 'steps' | 'cm' {
  if (typeof window === 'undefined') return 'steps';
  const saved = localStorage.getItem(DISTANCE_UNIT_STORAGE_KEY);
  return saved === 'cm' ? 'cm' : 'steps';
}
