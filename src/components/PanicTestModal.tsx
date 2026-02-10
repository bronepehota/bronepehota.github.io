'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { ArmyUnit, RulesVersionID, PanicTestResult } from '@/lib/types';

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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const squad = unit.data;
  const soldiers = squad.soldiers || [];

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
          <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">
            Тест на панику
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-4">
              При гибели половины отряда пехотинцы должны пройти тест на панику
            </p>
            <p className="text-xs text-slate-500">
              Бросок D6: если результат > Армейского ранга — паника
            </p>
          </div>

          {/* TODO: Add soldier list and test functionality */}
          <div className="mt-6">
            {soldiers.map((soldier, index) => (
              <div
                key={index}
                className="bg-slate-800 p-3 rounded-lg mb-2 flex items-center justify-between"
              >
                <span className="text-sm">Боец #{index + 1} (Ранг: {soldier.rank})</span>
                <span className="text-xs text-slate-500">Ожидание...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
