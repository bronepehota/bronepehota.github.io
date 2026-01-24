'use client';

import { useEffect } from 'react';
import { Check, Shield, Skull, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';

export type PilotTestPhase = 'ARMOR_ROLL' | 'SURVIVAL_ROLL' | 'RESULTS';

export interface PilotTestState {
  phase: PilotTestPhase;
  machineArmor: number;
  pilotArmor: number;
  armorRoll: number | null;
  survivalRoll: number | null;
  armorBreached: boolean | null;
  survived: boolean | null;
  isRolling: boolean;
}

interface PilotTestModalProps {
  isOpen: boolean;
  state: PilotTestState;
  onClose: () => void;
  onApply: (armorRoll: number, survivalRoll: number | null, survived: boolean) => void;
}

export function PilotTestModal({
  isOpen,
  state,
  onClose,
  onApply,
}: PilotTestModalProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.phase === 'RESULTS') {
          onClose();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [state.phase, onClose]);

  const getPhaseTitle = () => {
    switch (state.phase) {
      case 'ARMOR_ROLL':
        return 'Тест брони пилота';
      case 'SURVIVAL_ROLL':
        return 'Тест выживаемости';
      case 'RESULTS':
        return 'Результат';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (state.phase) {
      case 'ARMOR_ROLL':
        return 'text-yellow-500';
      case 'SURVIVAL_ROLL':
        return 'text-purple-500';
      case 'RESULTS':
        return state.survived ? 'text-green-500' : 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  const handleApply = () => {
    if (state.armorRoll !== null) {
      onApply(
        state.armorRoll,
        state.survivalRoll,
        state.survived ?? false
      );
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className="w-full md:w-[500px] bg-slate-900 rounded-t-3xl md:rounded-3xl border-t-2 md:border-2 border-slate-700 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <h2 className={cn("text-sm font-black uppercase tracking-wider", getPhaseColor())}>
            {getPhaseTitle()}
          </h2>
          <button
            onClick={onClose}
            disabled={state.isRolling}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {/* Armor Roll Phase */}
          {state.phase === 'ARMOR_ROLL' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black text-yellow-400 animate-pulse">
                  Бросаем кубик...
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Тест брони пилота при разрушении машины
                </div>
              </div>

              {/* Dice visuals */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {/* D12 Roll */}
                <div className="bg-slate-800 p-4 md:p-6 rounded-xl border-2 border-yellow-500/50 animate-pulse">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">D12 Бросок</div>
                  <div className="flex justify-center">
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-black border-2",
                      state.armorRoll !== null
                        ? "text-yellow-400 border-yellow-500/30"
                        : "text-yellow-400/50 border-yellow-500/20 animate-spin"
                    )}>
                      {state.armorRoll ?? '?'}
                    </div>
                  </div>
                </div>

                {/* Armor target */}
                <div className="bg-slate-800 p-4 md:p-6 rounded-xl border-2 border-blue-500/50">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Броня машины</div>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-black text-blue-400 border-2 border-blue-500/30 flex flex-col">
                      <Shield className="w-6 h-6 md:w-8 md:h-8 mb-1" />
                      <span>{state.machineArmor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="text-center text-sm text-slate-400 max-w-xs">
                {state.machineArmor === 0
                  ? 'Бросок D12. Если результат > 0, броня пробита.'
                  : `Бросок D12. Если результат > ${state.machineArmor}, броня пробита и пилот получает тест выживаемости.`
                }
              </div>

              {/* Loading bar */}
              <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 animate-in slide-in-from-left-full duration-1000" />
              </div>
            </div>
          )}

          {/* Survival Roll Phase */}
          {state.phase === 'SURVIVAL_ROLL' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-black text-purple-400 animate-pulse">
                  Тест выживаемости!
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Броня пробита, проверяем survivability
                </div>
              </div>

              {/* Dice visuals */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {/* D6 Roll */}
                <div className="bg-slate-800 p-4 md:p-6 rounded-xl border-2 border-purple-500/50 animate-pulse">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">D6 Бросок</div>
                  <div className="flex justify-center">
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-black border-2",
                      state.survivalRoll !== null
                        ? "text-purple-400 border-purple-500/30"
                        : "text-purple-400/50 border-purple-500/20 animate-spin"
                    )}>
                      {state.survivalRoll ?? '?'}
                    </div>
                  </div>
                </div>

                {/* Target (≤ pilotArmor) */}
                <div className="bg-slate-800 p-4 md:p-6 rounded-xl border-2 border-green-500/50">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Нужно ≤</div>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-xl flex items-center justify-center text-3xl md:text-4xl font-black text-green-400 border-2 border-green-500/30">
                      {state.pilotArmor}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="text-center text-sm text-slate-400 max-w-xs">
                {state.pilotArmor === 0
                  ? 'Бросок D6. Если результат > 0, пилот погибает. Крит (6) всегда убивает.'
                  : `Бросок D6. Если результат ≤ ${state.pilotArmor}, пилот выживает. Крит (6) всегда убивает.`
                }
              </div>

              {/* Loading bar */}
              <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-in slide-in-from-left-full duration-1000" />
              </div>
            </div>
          )}

          {/* Results Phase */}
          {state.phase === 'RESULTS' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in fade-in duration-300">
              {/* Result header */}
              <div className={cn(
                "text-center px-6 py-4 rounded-xl border-2 w-full",
                state.survived
                  ? "bg-green-900/30 border-green-500/50"
                  : "bg-red-900/30 border-red-500/50"
              )}>
                <div className={cn(
                  "text-3xl md:text-4xl font-black flex items-center justify-center gap-3",
                  state.survived ? "text-green-400" : "text-red-400"
                )}>
                  {state.survived ? (
                    <>
                      <Shield className="w-10 h-10" />
                      ВЫЖИЛ!
                    </>
                  ) : (
                    <>
                      <Skull className="w-10 h-10" />
                      ПОГИБ
                    </>
                  )}
                </div>
              </div>

              {/* Result details */}
              <div className="grid grid-cols-1 gap-3 w-full">
                {/* Armor result */}
                <div className={cn(
                  "bg-slate-800 p-4 rounded-xl border-2",
                  state.armorBreached
                    ? "border-red-500/50"
                    : "border-green-500/50"
                )}>
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Тест брони (D12)</div>
                  <div className={cn(
                    "text-center text-sm",
                    state.armorBreached ? "text-red-400" : "text-green-400"
                  )}>
                    Бросок: <span className="font-black text-lg">{state.armorRoll}</span>
                    {state.armorBreached
                      ? ` > ${state.machineArmor} — Пробита!`
                      : ` ≤ ${state.machineArmor} — Удержала`
                    }
                  </div>
                </div>

                {/* Survival result (only if armor was breached) */}
                {state.armorBreached && state.survivalRoll !== null && (
                  <div className={cn(
                    "bg-slate-800 p-4 rounded-xl border-2",
                    state.survived
                      ? "border-green-500/50"
                      : "border-red-500/50"
                  )}>
                    <div className="text-[10px] opacity-50 uppercase mb-2 text-center">
                      Тест выживания (D6 ≤ {state.pilotArmor})
                      {state.survivalRoll === 6 && <span className="text-red-400 ml-1">КРИТ!</span>}
                    </div>
                    <div className={cn(
                      "text-center text-sm",
                      state.survived ? "text-green-400" : "text-red-400"
                    )}>
                      Бросок: <span className="font-black text-lg">{state.survivalRoll}</span>
                      {state.survived
                        ? ' — Выжил!'
                        : ' — Погиб'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Apply button */}
              <button
                onClick={handleApply}
                className={cn(
                  "w-full max-w-xs px-6 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px] mt-4 flex items-center justify-center gap-2",
                  state.survived
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-red-600 hover:bg-red-500 text-white"
                )}
              >
                <Check className="w-5 h-5" />
                ПРИМЕНИТЬ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
