'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, Target, Sword, Bomb } from 'lucide-react';
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

// Action type colors for Military Tech Blueprint
const getActionColors = (actionType: CombatActionType | null) => {
  const colorMap = {
    shot: {
      primary: 'text-orange-400',
      border: 'border-orange-500/50',
      bg: 'bg-orange-500/10',
      accent: 'border-orange-500',
      button: 'border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
    },
    melee: {
      primary: 'text-red-400',
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      accent: 'border-red-500',
      button: 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
    },
    grenade: {
      primary: 'text-green-400',
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      accent: 'border-green-500',
      button: 'border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20'
    }
  };
  return colorMap[actionType as keyof typeof colorMap] || {
    primary: 'text-slate-400',
    border: 'border-slate-700',
    bg: 'bg-slate-800',
    accent: 'border-slate-600',
    button: 'border-slate-600 text-slate-400'
  };
};

const getPhaseTitle = () => 'БОЕВАЯ СИСТЕМА';

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

  const canGoBack = state.phase === 'PARAMETERS' || state.phase === 'RESULTS';
  const actionColors = getActionColors(state.actionType);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className={cn(
          "w-full md:w-[600px] bg-slate-900/95 backdrop-blur-sm border-t-2 md:border-2 shadow-2xl max-h-[90vh] md:max-h-[85vh] overflow-hidden flex flex-col relative",
          actionColors.border
        )}
      >
        {/* Corner accents */}
        <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-10", actionColors.accent)} />
        <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-10", actionColors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-10", actionColors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-10", actionColors.accent)} />

        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0 relative z-10">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            {/* Action type icon */}
            {state.actionType && (
              <div className={cn("p-1.5 rounded-lg border", actionColors.bg, actionColors.border)}>
                {state.actionType === 'shot' && <Target className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'melee' && <Sword className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'grenade' && <Bomb className={cn("w-4 h-4", actionColors.primary)} />}
              </div>
            )}
            <h2 className={cn("text-sm font-mono font-bold uppercase tracking-wider", actionColors.primary)}>
              {getPhaseTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700"
          >
            <X className="w-5 h-5 text-slate-400" />
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
                  "w-full py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  actionColors.button,
                  "hover:scale-102 active:scale-95"
                )}
              >
                {state.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                 state.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
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
