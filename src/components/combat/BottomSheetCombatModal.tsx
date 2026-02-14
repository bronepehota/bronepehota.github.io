'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, Target, Sword, Bomb, EyeOff, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { CombatFlowState, CombatActionType, CombatParameters } from '@/lib/combat-types';
import { ActionSelector } from './ActionSelector';
import { ParameterInputs } from './ParameterInputs';
import { DiceAnimation } from './DiceAnimation';
import { CombatResults } from './CombatResults';
import { RulesVersionID } from '@/lib/types';
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';

interface BottomSheetCombatModalProps {
  state: CombatFlowState;
  rulesVersion: RulesVersionID;
  onGoBack: () => void;
  onClose: () => void;
  onSelectAction: (action: CombatActionType) => void;
  onSetParameters: (params: Partial<CombatParameters>) => void;
  onExecuteAction: () => void;
  onApplyResult: () => void;
  onGrenadeCheckTarget?: (armor: number) => void; // For grenade blast checks
  grenadesAvailable?: boolean;
  unitDisplayName?: string;
}

// Action type colors for Military Tech Blueprint
const getActionColors = (actionType: CombatActionType | null, isSurpriseAttack?: boolean) => {
  const surpriseBase = isSurpriseAttack
    ? 'border-purple-600 bg-purple-950/40 text-purple-300 hover:bg-purple-950/60 shadow-lg shadow-purple-900/20'
    : '';

  const colorMap = {
    shot: {
      primary: 'text-amber-400',
      border: 'border-amber-600/40',
      bg: 'bg-amber-950/20',
      accent: 'border-amber-500',
      button: surpriseBase || 'border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50'
    },
    melee: {
      primary: 'text-red-400',
      border: 'border-red-600/40',
      bg: 'bg-red-950/20',
      accent: 'border-red-500',
      button: surpriseBase || 'border-red-600 bg-red-950/30 text-red-400 hover:bg-red-950/50'
    },
    grenade: {
      primary: 'text-emerald-400',
      border: 'border-emerald-600/40',
      bg: 'bg-emerald-950/20',
      accent: 'border-emerald-500',
      button: 'border-emerald-600 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50'
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
  onGrenadeCheckTarget,
  grenadesAvailable = true,
  unitDisplayName: _unitDisplayName,
}: BottomSheetCombatModalProps) {
  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  // Access combat target context for memory
  const { targetMemory, updateTargetMemory } = useCombatTargetContext();

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
  const actionColors = getActionColors(state.actionType, state.parameters.isSurpriseAttack);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={sheetRef}
        {...touchHandlers}
        className={cn(
          "w-full max-w-[600px] bg-slate-900/90 backdrop-blur-sm border-2 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col relative",
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
          <div className="w-16 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Tech Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            {/* Action type icon */}
            {state.actionType && (
              <div className={cn("p-2 rounded-sm border-2", actionColors.bg, actionColors.border)}>
                {state.actionType === 'shot' && <Target className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'melee' && <Sword className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'grenade' && <Bomb className={cn("w-4 h-4", actionColors.primary)} />}
              </div>
            )}
            <div>
              <h2 className={cn("text-sm font-mono font-bold uppercase tracking-wider", actionColors.primary)}>
                {getPhaseTitle()}
              </h2>
              {/* Tech label */}
              {state.actionType && (
                <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                  {state.actionType.toUpperCase()} PROTOCOL
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/80 rounded-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700"
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
                targetMemory={targetMemory}
                onMemoryUpdate={updateTargetMemory}
              />

              {/* Execute button with surprise attack toggle */}
              <div className="flex gap-3">
                {/* Surprise Attack toggle - shot and melee only */}
                {(state.actionType === 'shot' || state.actionType === 'melee') && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isSurpriseAttack: !state.parameters.isSurpriseAttack })}
                    className={cn(
                      'relative h-14 w-14 min-h-[56px] min-w-[56px] rounded-lg border-2 flex items-center justify-center shrink-0',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isSurpriseAttack
                        ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    )}
                    aria-label={state.parameters.isSurpriseAttack ? 'Внезапная атака включена' : 'Внезапная атака выключена'}
                  >
                    <EyeOff
                      className={cn('transition-colors duration-200', state.parameters.isSurpriseAttack ? 'text-purple-400' : 'text-slate-400')}
                      size={22}
                    />
                    {/* Pulsing status indicator when active */}
                    {state.parameters.isSurpriseAttack && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {/* Aimed Shot toggle - shot only, squads only */}
                {state.actionType === 'shot' && state.unitType === 'squad' && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isAimedShot: !state.parameters.isAimedShot })}
                    className={cn(
                      'relative h-14 w-14 min-h-[56px] min-w-[56px] rounded-lg border-2 flex items-center justify-center shrink-0',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isAimedShot
                        ? 'bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                    )}
                    aria-label={state.parameters.isAimedShot ? 'Прицельный выстрел включён' : 'Прицельный выстрел выключен'}
                  >
                    <Crosshair
                      className={cn('transition-colors duration-200', state.parameters.isAimedShot ? 'text-cyan-400' : 'text-slate-400')}
                      size={22}
                    />
                    {state.parameters.isAimedShot && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {/* Execute button - Tactical Control */}
                <button
                  onClick={onExecuteAction}
                  className={cn(
                    "relative flex-1 font-mono text-sm md:text-base font-bold uppercase tracking-wider border-2 transition-all min-h-[56px]",
                    actionColors.button,
                    "hover:scale-[1.02] active:scale-95 overflow-hidden"
                  )}
                >
                  {/* Tech decoration */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-30" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-30" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-30" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-30" />
                  <div className="flex items-center justify-center gap-2 py-3 md:py-4">
                    <span>
                      {state.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                       state.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                    </span>
                    {state.parameters.isSurpriseAttack && (
                      <span className="text-purple-300 text-[10px] opacity-80">
                        с тыла x2
                      </span>
                    )}
                  </div>
                </button>
              </div>
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
              unitType={state.unitType}
              onGrenadeCheckTarget={onGrenadeCheckTarget}
            />
          )}
        </div>
      </div>
    </div>
  );
}
