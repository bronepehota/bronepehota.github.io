'use client';

import { useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { CombatFlowState, CombatActionType, CombatParameters } from '@/lib/combat-types';
import { ActionSelector } from './ActionSelector';
import { ParameterInputs } from './ParameterInputs';
import { DiceAnimation } from './DiceAnimation';
import { CombatResults } from './CombatResults';
import { RulesVersionID } from '@/lib/types';

interface BottomSheetCombatModalProps {
  state: CombatFlowState;
  rulesVersion: RulesVersionID;
  onGoBack: () => void;
  onClose: () => void;
  onSelectAction: (action: CombatActionType) => void;
  onSetParameters: (params: Partial<CombatParameters>) => void;
  onExecuteAction: () => void;
  onApplyResult: () => void;
  grenadesAvailable?: boolean;
  unitDisplayName?: string;
}

export function BottomSheetCombatModal({
  state,
  rulesVersion,
  onGoBack,
  onClose,
  onSelectAction,
  onSetParameters,
  onExecuteAction,
  onApplyResult,
  grenadesAvailable = true,
  unitDisplayName: _unitDisplayName,
}: BottomSheetCombatModalProps) {
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
          onApplyResult();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [state.phase, onApplyResult, onClose]);

  const getPhaseTitle = () => {
    switch (state.phase) {
      case 'ACTION_SELECT':
        return 'Выберите действие';
      case 'PARAMETERS':
        return state.actionType === 'shot' ? 'Выстрел' :
               state.actionType === 'melee' ? 'Ближний бой' : 'Граната';
      case 'ROLLING':
        return 'Бросок кубиков...';
      case 'RESULTS':
        return 'Результат';
      case 'APPLY':
        return 'Применить результат';
      default:
        return '';
    }
  };

  const getPhaseColor = () => {
    switch (state.actionType) {
      case 'shot':
        return 'text-orange-500';
      case 'melee':
        return 'text-red-500';
      case 'grenade':
        return 'text-green-500';
      default:
        return 'text-slate-400';
    }
  };

  const canGoBack = state.phase === 'PARAMETERS' || state.phase === 'RESULTS';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className="w-full md:w-[600px] bg-slate-900 rounded-t-3xl md:rounded-3xl border-t-2 md:border-2 border-slate-700 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className={cn("text-sm font-black uppercase tracking-wider", getPhaseColor())}>
              {getPhaseTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
          {state.phase === 'ACTION_SELECT' && (
            <ActionSelector
              onSelect={(action) => onSelectAction(action)}
              grenadesAvailable={grenadesAvailable}
            />
          )}

          {state.phase === 'PARAMETERS' && (
            <div className="space-y-4">
              <ParameterInputs
                actionType={state.actionType!}
                parameters={state.parameters}
                onChange={onSetParameters}
                rulesVersion={rulesVersion}
                unit={state.unit}
                soldierIndex={state.soldierIndex}
              />

              {/* Execute button */}
              <button
                onClick={onExecuteAction}
                className={cn(
                  "w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg active:scale-95 transition-all min-h-[52px] md:min-h-[56px]",
                  state.actionType === 'shot' ? "bg-orange-600 hover:bg-orange-500" :
                  state.actionType === 'melee' ? "bg-red-600 hover:bg-red-500" :
                  "bg-green-700 hover:bg-green-600"
                )}
              >
                {state.actionType === 'shot' ? 'ОГОНЬ!' :
                 state.actionType === 'melee' ? 'АТАКОВАТЬ!' : 'БРОСОК!'}
              </button>
            </div>
          )}

          {state.phase === 'ROLLING' && (
            <DiceAnimation state={state} />
          )}

          {state.phase === 'RESULTS' && state.result && (
            <CombatResults
              result={state.result}
              parameters={state.parameters}
              rulesVersion={rulesVersion}
              onApply={onApplyResult}
              onGoBack={onGoBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
