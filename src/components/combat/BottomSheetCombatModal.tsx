'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronLeft, Target, Sword, Bomb, Flame, EyeOff, Crosshair, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { CombatFlowState, CombatActionType, CombatParameters } from '@/lib/combat-types';
import { ActionSelector } from './ActionSelector';
import { ParameterInputs } from './ParameterInputs';
import { CombatResults } from './CombatResults';
import ActiveModifiersDisplay from './ActiveModifiersDisplay';
import { RulesVersionID, Army } from '@/lib/types';
import { resolveModifierSummary } from '@/lib/modifier-utils';
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';
import { getHeightBonusEnabled } from '@/components/toggles/HeightBonusToggle';

interface BottomSheetCombatModalProps {
  state: CombatFlowState;
  rulesVersion: RulesVersionID;
  army: Army;
  onGoBack: () => void;
  onClose: () => void;
  onSelectAction: (action: CombatActionType) => void;
  onSetParameters: (params: Partial<CombatParameters>) => void;
  onExecuteAction: () => void;
  onApplyResult: () => void;
  onGrenadeCheckTarget?: (armor: number) => void; // For grenade blast checks
  grenadesAvailable?: boolean;
  unitDisplayName?: string;
  autoCompleteEnabled?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
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
  army,
  onGoBack,
  onClose,
  onSelectAction,
  onSetParameters,
  onExecuteAction,
  onApplyResult,
  onGrenadeCheckTarget,
  grenadesAvailable = true,
  unitDisplayName: _unitDisplayName,
  autoCompleteEnabled = true,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
}: BottomSheetCombatModalProps) {
  const heightBonusAvailable = getHeightBonusEnabled();

  const { sheetRef, touchHandlers } = useBottomSheet({
    onClose,
    closeThreshold: 100,
    isEnabled: true,
  });

  // Track whether the content area is scrolled, to show a top-edge fade hint (#165)
  const [contentScrolled, setContentScrolled] = useState(false);

  // Access combat target context for memory
  const { getTargetMemory, updateTargetMemory } = useCombatTargetContext();

  // Focus trap — keep keyboard focus inside the modal while it's open.
  const isOpen = state.phase !== 'IDLE';
  const focusRef = useRef<HTMLDivElement>(null);
  useFocusTrap(focusRef, isOpen);

  // Compute active modifiers for the current combat phase
  const modifierPhase = state.actionType === 'melee' ? 'melee' as const : 'shot';
  const soldierIdx = state.unitType === 'squad' ? (state.soldierIndex ?? undefined) : undefined;
  const modifierSummary = useMemo(
    () => resolveModifierSummary(state.unit, army, modifierPhase, soldierIdx),
    [state.unit, army, modifierPhase, soldierIdx]
  );

  // Sync modifiers to combat state so executeShot/executeMelee can use them
  useEffect(() => {
    onSetParameters({ activeModifiers: modifierSummary });
  }, [modifierSummary, onSetParameters]);

  // Get memory for current unit
  const currentUnitId = state.unit?.instanceId || '';
  const targetMemory = currentUnitId ? getTargetMemory(currentUnitId) : {
    distance: null,
    targetArmor: null,
    targetMelee: null,
    targetIsVehicle: null,
    lastUpdateTimestamp: 0,
    isDirty: false,
  };

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
    <div
      ref={focusRef}
      data-testid="bottom-sheet-combat-modal"
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
    >
      <div
        ref={sheetRef}
        {...touchHandlers}
        className={cn(
          "w-full max-w-[600px] combat-glass combat-border-glow border-2 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col relative",
          actionColors.border
        )}
      >
        {/* Simplified background - removed overlays for performance */}
        {/* Previously: grid animation, scanlines, vignette, noise - all removed */}

        {/* Corner accents with pulsing glow */}
        <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 z-10", actionColors.accent)} />
        <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 z-10", actionColors.accent)} />
        <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 z-10", actionColors.accent)} />
        <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 z-10", actionColors.accent)} />

        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0 relative z-10">
          <div className="w-12 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Tech Header with faction branding */}
        <div className="flex items-center justify-between px-2 md:px-4 py-2 border-b border-slate-800/50 shrink-0 relative z-10 bg-gradient-to-r from-slate-900/50 to-transparent">
          {/* Tech decoration line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          <div className="flex items-center gap-3">
            {canGoBack && (
              <button
                onClick={onGoBack}
                className="p-2 hover:bg-slate-800/80 rounded-sm transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700 hover:border-slate-600 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            {/* Action type icon with pulsing glow */}
            {state.actionType && (
              <div className={cn(
                "p-2 rounded-sm border-2 relative",
                actionColors.bg,
                actionColors.border,
                "animate-pulse-glow"
              )}>
                {/* Tech corner markers */}
                <div className={cn("absolute top-0 left-0 w-1 h-1", actionColors.accent)} />
                <div className={cn("absolute top-0 right-0 w-1 h-1", actionColors.accent)} />
                <div className={cn("absolute bottom-0 left-0 w-1 h-1", actionColors.accent)} />
                <div className={cn("absolute bottom-0 right-0 w-1 h-1", actionColors.accent)} />
                {state.actionType === 'shot' && <Target className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'melee' && <Sword className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'grenade' && <Bomb className={cn("w-4 h-4", actionColors.primary)} />}
                {state.actionType === 'ram' && <Flame className={cn("w-4 h-4", actionColors.primary)} />}
              </div>
            )}
            <div>
              <h2 className={cn("text-sm font-mono font-bold uppercase tracking-wider", actionColors.primary)}>
                {getPhaseTitle()}
              </h2>
              {/* Tech label with status indicator */}
              <div className="flex items-center gap-2">
                {state.actionType && (
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    {state.actionType === 'shot' ? 'ВЫСТРЕЛ' :
                     state.actionType === 'melee' ? 'БЛИЖНИЙ БОЙ' :
                     state.actionType === 'ram' ? 'ТАРАН' : 'ГРАНАТА'}
                  </div>
                )}
                {/* Status indicator dots */}
                <div className="flex gap-0.5">
                  <div className={cn("w-1 h-1 rounded-full animate-pulse", actionColors.primary)} />
                  <div className={cn("w-1 h-1 rounded-full animate-pulse stagger-100", actionColors.primary)} />
                  <div className={cn("w-1 h-1 rounded-full animate-pulse stagger-200", actionColors.primary)} />
                </div>
              </div>
            </div>
          </div>
          {/* Tech hex code decoration - static value to avoid hydration errors */}
          <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="text-[7px] font-mono text-slate-700">
              SYS_7A2F
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/80 rounded-sm transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700 hover:border-slate-600 active:scale-95"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 md:p-3"
          onScroll={(e) => setContentScrolled(e.currentTarget.scrollTop > 4)}
        >
          {contentScrolled && (
            <div
              aria-hidden="true"
              className="sticky top-0 -mt-2 md:-mt-3 h-2 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none z-[5]"
            />
          )}
          {state.phase === 'ACTION_SELECT' && (
            <ActionSelector
              onSelect={(action) => onSelectAction(action)}
              grenadesAvailable={grenadesAvailable}
              unit={state.unit ?? undefined}
              soldierIndex={state.soldierIndex}
            />
          )}

          {state.phase === 'PARAMETERS' && (
            <div className="space-y-2 md:space-y-3">
              <ParameterInputs
                actionType={state.actionType!}
                parameters={state.parameters}
                onChange={onSetParameters}
                rulesVersion={rulesVersion}
                unit={state.unit}
                soldierIndex={state.soldierIndex}
                targetMemory={targetMemory}
                onMemoryUpdate={(params) => currentUnitId && updateTargetMemory(currentUnitId, params)}
                isAimedShot={state.parameters.isAimedShot}
                distanceInputUnit={distanceInputUnit}
                stepToCmFactor={stepToCmFactor}
                modifierSummary={modifierSummary}
              />

              {/* Active Modifiers Display */}
              {modifierSummary.descriptions.length > 0 && (
                <ActiveModifiersDisplay
                  summary={modifierSummary}
                  isAimedShot={state.parameters.isAimedShot}
                  isSurpriseAttack={state.parameters.isSurpriseAttack}
                />
              )}

              {/* Modifier bar — labeled pills (no section header) */}
              <div className="flex flex-wrap gap-1.5">
                {/* Surprise attack — shot and melee */}
                {(state.actionType === 'shot' || state.actionType === 'melee') && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isSurpriseAttack: !state.parameters.isSurpriseAttack })}
                    aria-label={state.parameters.isSurpriseAttack ? 'Внезапная атака включена' : 'Внезапная атака выключена'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isSurpriseAttack
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <EyeOff className={cn('w-3.5 h-3.5', state.parameters.isSurpriseAttack ? 'text-purple-400' : 'text-slate-400')} size={14} />
                    <span>с тыла</span>
                    {state.parameters.isSurpriseAttack && (
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {/* Aimed shot — shot, squads only */}
                {state.actionType === 'shot' && state.unitType === 'squad' && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isAimedShot: !state.parameters.isAimedShot })}
                    aria-label={state.parameters.isAimedShot ? 'Прицельный выстрел включён' : 'Прицельный выстрел выключен'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isAimedShot
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <Crosshair className={cn('w-3.5 h-3.5', state.parameters.isAimedShot ? 'text-cyan-400' : 'text-slate-400')} size={14} />
                    <span>прицельный</span>
                    {state.parameters.isAimedShot && (
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}

                {/* Height bonus — shot only, gated by the config toggle */}
                {heightBonusAvailable && state.actionType === 'shot' && (
                  <button
                    type="button"
                    onClick={() => onSetParameters({ isHeightBonus: !state.parameters.isHeightBonus })}
                    aria-label={state.parameters.isHeightBonus ? 'Бонус за высоту включён' : 'Бонус за высоту выключен'}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono min-h-[36px]',
                      'touch-manipulation active:scale-95 transition-all duration-200',
                      state.parameters.isHeightBonus
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700'
                    )}
                  >
                    <Mountain className={cn('w-3.5 h-3.5', state.parameters.isHeightBonus ? 'text-emerald-400' : 'text-slate-400')} size={14} />
                    <span>с высоты</span>
                    {state.parameters.isHeightBonus && (
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    )}
                  </button>
                )}
              </div>

              {/* Execute button — full width, own row */}
              <button
                onClick={onExecuteAction}
                className={cn(
                  "relative w-full font-mono text-xs md:text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[44px] md:min-h-[48px] mt-2",
                  "hover:scale-[1.01] active:scale-95 overflow-hidden shimmer-effect",
                  "shadow-lg",
                  actionColors.button
                )}
                style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
              >
                <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 opacity-40", actionColors.accent)} />
                <div className="absolute inset-0 shadow-inner pointer-events-none" />
                <div className="relative flex items-center justify-center gap-2 px-2 md:px-6 py-2 md:py-3">
                  <span>
                    {state.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                     state.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                  </span>
                  {/* Active modifiers subtitle (always visible) */}
                  {(state.parameters.isSurpriseAttack || state.parameters.isAimedShot || state.parameters.isHeightBonus) && (
                    <span className="text-[10px] opacity-80">
                      {[
                        state.parameters.isSurpriseAttack && 'с тыла',
                        state.parameters.isAimedShot && 'прицельный',
                        state.parameters.isHeightBonus && 'с высоты',
                      ].filter(Boolean).join(' + ')}
                    </span>
                  )}
                </div>
              </button>
            </div>
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
              autoCompleteEnabled={autoCompleteEnabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
