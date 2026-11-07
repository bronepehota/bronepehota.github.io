'use client';

import { useState, useEffect } from 'react';
import { Coins, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

interface MachineDiscountToggleProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function MachineDiscountToggle({ enabled, onEnabledChange }: MachineDiscountToggleProps) {
  const [showModal, setShowModal] = useState(false);

  // Load saved preference on mount (only once, intentionally)
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MACHINE_DISCOUNT_ENABLED);
    if (saved !== null) {
      onEnabledChange(saved === 'true');
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleToggle = () => {
    const newValue = !enabled;
    onEnabledChange(newValue);
    localStorage.setItem(LOCAL_STORAGE_KEYS.MACHINE_DISCOUNT_ENABLED, String(newValue));
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
        data-testid="machine-discount-toggle"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors',
            enabled ? 'bg-emerald-600/30' : 'bg-slate-700/50'
          )}>
            <Coins className={cn(
              'w-4 h-4 transition-colors',
              enabled ? 'text-emerald-400' : 'text-slate-500'
            )} />
          </div>

          {/* Content */}
          <button
            onClick={handleToggle}
            className="flex-1 min-w-0 text-left touch-manipulation"
            aria-pressed={enabled}
            aria-label={`Скидка на технику: ${enabled ? 'включена' : 'выключена'}`}
          >
            <span className={cn(
              'text-xs font-mono font-bold tracking-wide',
              enabled ? 'text-emerald-300' : 'text-slate-400'
            )}>
              ТЕХНИКА −30%
            </span>
            <span className="ml-1.5 align-middle px-1 py-px rounded bg-amber-500/15 border border-amber-600/40 text-[8px] font-mono font-bold tracking-wider text-amber-400 uppercase">
              БЕТА
            </span>
            <p className={cn(
              'text-[10px] font-mono truncate mt-0.5',
              enabled ? 'text-emerald-400/70' : 'text-slate-500'
            )}>
              скидка на технику в армии
            </p>
          </button>

          {/* Info button */}
          <button
            onClick={() => setShowModal(true)}
            className="shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-slate-700/50"
            aria-label="Подробнее о скидке на технику"
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
            aria-label={enabled ? 'Отключить скидку на технику' : 'Включить скидку на технику'}
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
                  <Coins className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-mono font-bold text-emerald-300">
                  ТЕХНИКА −30%
                  <span className="ml-2 align-middle px-1 py-px rounded bg-amber-500/15 border border-amber-600/40 text-[9px] font-mono font-bold tracking-wider text-amber-400 uppercase">БЕТА</span>
                </h3>
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
                  «Шасси» машин (корпус и ходовая) дешевеет на 30% — орудия остаются по полной цене.
                  Итог округляется вверх до кратного 10. В бюджет помещается больше техники.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <h4 className="text-xs font-mono font-bold text-slate-400 mb-2">Применение</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Только машины (отряды — полная цена)</li>
                  <li>• Орудия — полная цена (разбивка из моноблочной модели Star System)</li>
                  <li>• Пример: Хеликс 220 → 170</li>
                  <li>• Только для правил Star System</li>
                  <li className="text-amber-400/80">• БЕТА: нет в правилах v0.3 — удобство по решению игрока</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function to get machine-discount gate state from localStorage
export function getMachineDiscountEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.MACHINE_DISCOUNT_ENABLED);
  return saved === 'true';
}
