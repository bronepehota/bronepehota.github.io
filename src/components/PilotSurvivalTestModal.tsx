'use client';

import { useState, useEffect, useRef } from 'react';
import { Skull, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PilotSurvivalTestModalProps {
  isOpen: boolean;
  pilotArmor: number;
  onComplete: (roll: number, survived: boolean) => void;
  onClose: () => void;
}

type TestPhase = 'rolling' | 'result';

export function PilotSurvivalTestModal({
  isOpen,
  pilotArmor,
  onComplete,
  onClose,
}: PilotSurvivalTestModalProps) {
  const [phase, setPhase] = useState<TestPhase>('rolling');
  const [currentRoll, setCurrentRoll] = useState<number | null>(null);
  const [finalRoll, setFinalRoll] = useState<number>(0);
  const hasRunRef = useRef(false);

  const runTest = async () => {
    // Animate dice rolling
    const iterations = 10;
    const delay = 100;

    for (let i = 0; i < iterations; i++) {
      const tempRoll = Math.floor(Math.random() * 6) + 1;
      setCurrentRoll(tempRoll);
      await new Promise(r => setTimeout(r, delay));
    }

    // Final roll
    const roll = Math.floor(Math.random() * 6) + 1;
    const survived = roll <= pilotArmor;

    setFinalRoll(roll);
    setCurrentRoll(roll);
    setPhase('result');

    // Notify parent after a short delay to show result
    setTimeout(() => {
      onComplete(roll, survived);
    }, 1500);
  };

  useEffect(() => {
    if (isOpen && !hasRunRef.current) {
      hasRunRef.current = true;
      setPhase('rolling');
      setCurrentRoll(null);
      runTest();
    }
    // Reset when modal closes
    if (!isOpen) {
      hasRunRef.current = false;
      setPhase('rolling');
      setCurrentRoll(null);
      setFinalRoll(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pilotArmor]);

  if (!isOpen) return null;

  const survived = finalRoll > 0 && finalRoll <= pilotArmor;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-200">ТЕСТ ВЫЖИВАЕМОСТИ ПИЛОТА</h2>
          </div>
          <button
            onClick={onClose}
            disabled={phase === 'rolling'}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {phase === 'rolling' && (
            <div className="flex flex-col items-center py-8 space-y-6 w-full">
              {/* Rolling indicator */}
              <div className="text-center">
                <div className="text-xl md:text-2xl font-black text-purple-400 animate-pulse">
                  Бросаем кубик...
                </div>
                <div className="text-sm text-slate-400 mt-2">
                  Тест выживаемости при разрушении машины
                </div>
              </div>

              {/* Dice visual */}
              <div className="flex gap-8 items-center">
                {/* D6 Roll */}
                <div className="bg-slate-800 p-6 rounded-xl border-2 border-purple-500/50 animate-pulse">
                  <div className="text-[10px] opacity-50 uppercase mb-3 text-center">D6 Бросок</div>
                  <div className="flex justify-center">
                    <div className={cn(
                      "w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-black border-2 transition-all",
                      currentRoll !== null
                        ? "text-purple-400 border-purple-500/30"
                        : "text-purple-400/50 border-purple-500/20 animate-spin"
                    )}>
                      {currentRoll ?? '?'}
                    </div>
                  </div>
                </div>

                {/* Armor target */}
                <div className="bg-slate-800 p-6 rounded-xl border-2 border-yellow-500/50">
                  <div className="text-[10px] opacity-50 uppercase mb-3 text-center">Броня пилота</div>
                  <div className="flex justify-center">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-black text-yellow-400 border-2 border-yellow-500/30 flex flex-col">
                      <Shield className="w-8 h-8 md:w-10 md:h-10 mb-1" />
                      <span>{pilotArmor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading bar */}
              <div className="w-full max-w-xs h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-in slide-in-from-left-full duration-1000" />
              </div>
            </div>
          )}

          {phase === 'result' && (
            <div className="flex flex-col items-center py-8 space-y-6 w-full animate-in fade-in duration-300">
              {/* Result header */}
              <div className={cn(
                "text-center px-6 py-3 rounded-xl border-2",
                survived
                  ? "bg-green-900/30 border-green-500/50"
                  : "bg-red-900/30 border-red-500/50"
              )}>
                <div className={cn(
                  "text-2xl md:text-3xl font-black flex items-center justify-center gap-2",
                  survived ? "text-green-400" : "text-red-400"
                )}>
                  {survived ? (
                    <>
                      <Shield className="w-8 h-8" />
                      ВЫЖИЛ!
                    </>
                  ) : (
                    <>
                      <Skull className="w-8 h-8" />
                      ПОГИБ
                    </>
                  )}
                </div>
              </div>

              {/* Result details */}
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {/* Roll result */}
                <div className="bg-slate-800 p-4 rounded-xl border-2 border-purple-500/50">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Ваш бросок</div>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-purple-400 border-2 border-purple-500/30">
                      {finalRoll}
                    </div>
                  </div>
                </div>

                {/* Armor target */}
                <div className="bg-slate-800 p-4 rounded-xl border-2 border-yellow-500/50">
                  <div className="text-[10px] opacity-50 uppercase mb-2 text-center">Нужно ≤</div>
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-3xl font-black text-yellow-400 border-2 border-yellow-500/30">
                      {pilotArmor}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className={cn(
                "text-center px-4 py-2 rounded-lg text-sm",
                survived
                  ? "bg-green-900/20 text-green-300"
                  : "bg-red-900/20 text-red-300"
              )}>
                {survived
                  ? `Бросок ${finalRoll} ≤ брони ${pilotArmor} — пилот выжил!`
                  : finalRoll === 6
                  ? `Критический удар! Бросок 6 — пилот погиб.`
                  : `Бросок ${finalRoll} > брони ${pilotArmor} — пилот погиб.`
                }
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="w-full max-w-xs px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors min-h-[44px]"
              >
                ЗАКРЫТЬ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
