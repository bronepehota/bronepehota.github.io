'use client';

import { useEffect, useState } from 'react';
import { X, Check, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { ArmyUnit, RulesVersionID, PanicTestResult } from '@/lib/types';
import { executePanicTest } from '@/lib/panic-logic';

interface PanicTestModalProps {
  isOpen: boolean;
  unit: ArmyUnit;
  rulesVersion: RulesVersionID;
  onTestComplete: (results: PanicTestResult[]) => void;
  onClose: () => void;
}

export function PanicTestModal({
  isOpen,
  unit,
  rulesVersion,
  onTestComplete,
  onClose,
}: PanicTestModalProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  const [isRolling, setIsRolling] = useState(false);
  const [results, setResults] = useState<PanicTestResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRolling) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isRolling]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResults([]);
      setShowResults(false);
      setIsRolling(false);
    }
  }, [isOpen]);

  const handleConductTest = () => {
    setIsRolling(true);
    const squad = unit.data as any;
    const soldiers = squad.soldiers || [];
    const deadIndices = unit.deadSoldiers || [];

    // Test all alive soldiers
    const testResults: PanicTestResult[] = [];

    soldiers.forEach((_soldier: any, index: number) => {
      if (!deadIndices.includes(index)) {
        const result = executePanicTest(unit, index, rulesVersion);
        testResults.push(result);
      }
    });

    // Simulate dice rolling animation
    setTimeout(() => {
      setResults(testResults);
      setShowResults(true);
      setIsRolling(false);
    }, 1000);
  };

  const handleApply = () => {
    onTestComplete(results);
    onClose();
  };

  if (!isOpen) return null;

  const squad = unit.data as any;
  const soldiers = squad.soldiers || [];
  const deadIndices = unit.deadSoldiers || [];

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
          <h2 data-testid="panic-modal-title" className="text-sm font-black uppercase tracking-wider text-orange-500">
            Тест на панику
          </h2>
          <button
            onClick={onClose}
            disabled={isRolling}
            aria-label="Close"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          {!showResults ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  При гибели половины отряда пехотинцы должны пройти тест на панику
                </p>
                <p className="text-xs text-slate-500">
                  Бросок D6: если результат &gt; Армейского ранга — паника
                </p>
              </div>

              {/* Soldier list */}
              <div className="w-full space-y-2">
                {soldiers.map((soldier: any, index: number) => {
                  if (deadIndices.includes(index)) return null;
                  return (
                    <div
                      key={index}
                      className="bg-slate-800 p-3 rounded-lg flex items-center justify-between"
                    >
                      <span className="text-sm">Боец #{index + 1}</span>
                      <span className="text-xs text-slate-500">
                        Ранг: {soldier.rank}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                data-testid="panic-test-button"
                onClick={handleConductTest}
                disabled={isRolling}
                className="w-full max-w-xs px-6 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px] mt-4 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isRolling ? 'Бросаем кубики...' : 'ПРОВЕСТИ ТЕСТ'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    "bg-slate-800 p-4 rounded-xl border-2",
                    result.isPanic
                      ? "border-orange-500/50"
                      : "border-green-500/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] opacity-50 uppercase mb-1">
                        Боец #{result.soldierIndex + 1}
                      </div>
                      <div className={cn(
                        "text-sm font-bold",
                        result.isPanic ? "text-orange-400" : "text-green-400"
                      )}>
                        {result.isPanic ? (
                          <span data-testid="panic-indicator" className="flex items-center gap-2">
                            <Footprints className="w-4 h-4" />
                            В ПАНИКЕ!
                          </span>
                        ) : (
                          'Справился'
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] opacity-50 uppercase mb-1">
                        Бросок / Ранг
                      </div>
                      <div className="text-lg font-black">
                        {result.roll} / {result.rank}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                data-testid="panic-apply-button"
                onClick={handleApply}
                className="w-full px-6 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px] mt-4 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white"
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
