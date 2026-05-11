'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Target, Sword, Bomb, SlidersHorizontal, X, EyeOff, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { ActionSelector } from '@/components/combat/ActionSelector';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatResults } from '@/components/combat/CombatResults';
import { RulesSelector } from './RulesSelector';
import { ModifiersSelector } from './ModifiersSelector';
import { DiceInputPopup } from './DiceInputPopup';
import type { CombatActionType } from '@/lib/combat-types';

const ACTION_TABS: Array<{ type: CombatActionType; label: string; icon: typeof Target }> = [
  { type: 'shot', label: 'ВЫСТРЕЛ', icon: Target },
  { type: 'melee', label: 'БЛИЖНИЙ БОЙ', icon: Sword },
  { type: 'grenade', label: 'ГРАНАТА', icon: Bomb },
];

// Action type colors — matches BottomSheetCombatModal
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

type DicePopupField = 'range' | 'power' | 'melee' | 'rank' | null;

export function CalculatorPage() {
  const {
    combatState,
    selectAction,
    setParameters,
    executeAction,
    applyResult,
    goBack,
    checkGrenadeTarget,
    combatantData,
    updateCombatantField,
    rulesVersion,
    updateRulesVersion,
    modifierSummary,
    setModifierSummary,
    switchAction,
    newCalculation,
  } = useStandaloneCombatFlow();

  const [dicePopupField, setDicePopupField] = useState<DicePopupField>(null);
  const [showModifiers, setShowModifiers] = useState(false);

  const handleDataNeeded = useCallback((field: 'range' | 'power' | 'melee' | 'rank') => {
    setDicePopupField(field);
  }, []);

  const handleDiceSubmit = useCallback((value: string) => {
    if (dicePopupField === 'range') {
      updateCombatantField('range', value);
    } else if (dicePopupField === 'power') {
      updateCombatantField('power', value);
    } else if (dicePopupField === 'melee') {
      updateCombatantField('melee', parseInt(value, 10) || 0);
    } else if (dicePopupField === 'rank') {
      updateCombatantField('rank', parseInt(value, 10) || 0);
    }
    setDicePopupField(null);
  }, [dicePopupField, updateCombatantField]);

  const currentAction = combatState.actionType;
  const phase = currentAction === 'melee' ? 'melee' as const : currentAction === 'grenade' ? 'grenade' as const : 'shot' as const;
  const actionColors = getActionColors(currentAction, combatState.parameters.isSurpriseAttack);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        <Link
          href="/"
          className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Link>
        {/* Action type icon in header — matches BottomSheetCombatModal */}
        {currentAction && (
          <div className={cn(
            "p-1.5 rounded border-2 relative",
            actionColors.bg,
            actionColors.border,
          )}>
            {currentAction === 'shot' && <Target className={cn("w-4 h-4", actionColors.primary)} />}
            {currentAction === 'melee' && <Sword className={cn("w-4 h-4", actionColors.primary)} />}
            {currentAction === 'grenade' && <Bomb className={cn("w-4 h-4", actionColors.primary)} />}
          </div>
        )}
        <h1 className={cn(
          "font-mono font-bold text-sm uppercase tracking-wider",
          currentAction ? actionColors.primary : "text-slate-300"
        )}>
          {currentAction === 'shot' ? 'ВЫСТРЕЛ' :
           currentAction === 'melee' ? 'БЛИЖНИЙ БОЙ' :
           currentAction === 'grenade' ? 'ГРАНАТА' : 'Калькулятор боя'}
        </h1>
        <div className="ml-auto">
          <RulesSelector value={rulesVersion} onChange={updateRulesVersion} />
        </div>
      </div>

      {/* Action Type Tabs — always visible */}
      <div className="flex border-b border-slate-800">
        {ACTION_TABS.map(({ type, label, icon: Icon }) => {
          const tabColors = getActionColors(type);
          return (
            <button
              key={type}
              onClick={() => {
                if (combatState.phase === 'ACTION_SELECT') {
                  selectAction(type);
                } else if (combatState.phase !== 'ROLLING') {
                  switchAction(type);
                }
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-all font-mono text-xs uppercase tracking-wider min-h-[48px]",
                currentAction === type
                  ? `${tabColors.primary} ${tabColors.border} ${tabColors.bg}`
                  : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="max-w-[600px] mx-auto p-4 space-y-3 relative">
        {/* Modifiers side button */}
        <button
          onClick={() => setShowModifiers(!showModifiers)}
          className={cn(
            "fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-lg border-2 transition-all min-w-[48px] min-h-[48px] flex items-center justify-center",
            showModifiers
              ? "border-purple-500 bg-purple-950/80 text-purple-400 shadow-lg shadow-purple-500/20"
              : "border-slate-600 bg-slate-900/80 text-slate-400 hover:border-slate-500"
          )}
          aria-label="Модификаторы"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Modifiers slide-out panel */}
        {showModifiers && (
          <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setShowModifiers(false)}>
            <div className="bg-transparent flex-1" />
            <div
              className="w-80 max-w-[85vw] h-full bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider text-slate-300">
                  Модификаторы
                </h3>
                <button
                  onClick={() => setShowModifiers(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <ModifiersSelector
                value={modifierSummary}
                onChange={setModifierSummary}
                phase={phase}
              />
            </div>
          </div>
        )}

        {/* ACTION_SELECT phase */}
        {combatState.phase === 'ACTION_SELECT' && (
          <ActionSelector
            onSelect={selectAction}
            grenadesAvailable={combatantData.grenadesAvailable}
          />
        )}

        {/* PARAMETERS phase */}
        {combatState.phase === 'PARAMETERS' && (
          <div className="space-y-3">
            <ParameterInputs
              actionType={combatState.actionType!}
              parameters={combatState.parameters}
              onChange={setParameters}
              rulesVersion={rulesVersion}
              combatantData={combatantData}
              onDataNeeded={handleDataNeeded}
              isAimedShot={combatState.parameters.isAimedShot}
              modifierSummary={modifierSummary}
            />

            {/* Execute button panel — matches BottomSheetCombatModal */}
            <div className="flex gap-2 md:gap-3">
              {/* Surprise Attack toggle — shot and melee only */}
              {(combatState.actionType === 'shot' || combatState.actionType === 'melee') && (
                <button
                  type="button"
                  onClick={() => setParameters({ isSurpriseAttack: !combatState.parameters.isSurpriseAttack })}
                  className={cn(
                    'relative h-10 w-10 min-h-[40px] min-w-[40px] md:h-12 md:w-12 md:min-h-[48px] md:min-w-[48px] rounded-lg border-2 flex items-center justify-center shrink-0',
                    'touch-manipulation active:scale-95 transition-all duration-200',
                    combatState.parameters.isSurpriseAttack
                      ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                  )}
                  aria-label={combatState.parameters.isSurpriseAttack ? 'Внезапная атака включена' : 'Внезапная атака выключена'}
                >
                  <EyeOff
                    className={cn('transition-colors duration-200', combatState.parameters.isSurpriseAttack ? 'text-purple-400' : 'text-slate-400')}
                    size={16}
                  />
                  {combatState.parameters.isSurpriseAttack && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                  )}
                </button>
              )}

              {/* Aimed Shot toggle — shot only, squads only */}
              {combatState.actionType === 'shot' && combatantData.type === 'squad' && (
                <button
                  type="button"
                  onClick={() => setParameters({ isAimedShot: !combatState.parameters.isAimedShot })}
                  className={cn(
                    'relative h-10 w-10 min-h-[40px] min-w-[40px] md:h-12 md:w-12 md:min-h-[48px] md:min-w-[48px] rounded-lg border-2 flex items-center justify-center shrink-0',
                    'touch-manipulation active:scale-95 transition-all duration-200',
                    combatState.parameters.isAimedShot
                      ? 'bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                  )}
                  aria-label={combatState.parameters.isAimedShot ? 'Прицельный выстрел включён' : 'Прицельный выстрел выключен'}
                >
                  <Crosshair
                    className={cn('transition-colors duration-200', combatState.parameters.isAimedShot ? 'text-cyan-400' : 'text-slate-400')}
                    size={16}
                  />
                  {combatState.parameters.isAimedShot && (
                    <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </button>
              )}

              {/* Execute button — matches BottomSheetCombatModal styling */}
              <button
                onClick={() => executeAction()}
                className={cn(
                  "relative flex-1 font-mono text-xs md:text-sm font-bold uppercase tracking-wider border-2 transition-all min-h-[44px] md:min-h-[48px]",
                  "hover:scale-[1.02] active:scale-95 overflow-hidden",
                  "shadow-lg",
                  actionColors.button
                )}
                style={{
                  textShadow: '0 0 10px rgba(255,255,255,0.3)'
                }}
              >
                {/* Tech decoration corners */}
                <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 opacity-40", actionColors.accent)} />
                <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 opacity-40", actionColors.accent)} />

                <div className="relative flex items-center justify-center gap-2 px-2 md:px-6 py-2 md:py-3">
                  <span>
                    {combatState.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                     combatState.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                  </span>
                  {(combatState.parameters.isSurpriseAttack || combatState.parameters.isAimedShot) && (
                    <span className="text-purple-300 text-[10px] opacity-80 hidden md:inline">
                      {combatState.parameters.isSurpriseAttack && 'с тыла'}
                      {combatState.parameters.isSurpriseAttack && combatState.parameters.isAimedShot && ' + '}
                      {combatState.parameters.isAimedShot && 'прицельный'}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* RESULTS phase */}
        {combatState.phase === 'RESULTS' && combatState.result && (
          <CombatResults
            result={combatState.result}
            parameters={combatState.parameters}
            rulesVersion={rulesVersion}
            onApply={() => applyResult()}
            onGoBack={goBack}
            unitType={combatState.unitType}
            onGrenadeCheckTarget={checkGrenadeTarget}
          />
        )}

        {/* APPLY phase */}
        {combatState.phase === 'APPLY' && (
          <div className="text-center py-8 space-y-4">
            <div className="text-slate-400 font-mono text-sm">Результат принят</div>
            <button
              onClick={newCalculation}
              className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
            >
              Новый расчёт
            </button>
          </div>
        )}
      </div>

      {/* Dice Input Popup */}
      {dicePopupField && (
        <DiceInputPopup
          title={
            dicePopupField === 'range' ? 'ДАЛЬНОСТЬ' :
            dicePopupField === 'power' ? 'МОЩНОСТЬ' :
            dicePopupField === 'melee' ? 'БЛИЖНИЙ БОЙ' : 'РАНГ'
          }
          value={dicePopupField === 'range' ? combatantData.range : dicePopupField === 'power' ? combatantData.power : undefined}
          mode={dicePopupField === 'melee' || dicePopupField === 'rank' ? 'number' : 'dice'}
          numericValue={dicePopupField === 'melee' ? combatantData.melee : dicePopupField === 'rank' ? combatantData.rank : 0}
          min={0}
          max={dicePopupField === 'rank' ? 5 : 10}
          color={
            dicePopupField === 'range' ? 'blue' :
            dicePopupField === 'power' ? 'orange' :
            dicePopupField === 'melee' ? 'cyan' : 'emerald'
          }
          onSubmit={handleDiceSubmit}
          onClose={() => setDicePopupField(null)}
        />
      )}
    </div>
  );
}
