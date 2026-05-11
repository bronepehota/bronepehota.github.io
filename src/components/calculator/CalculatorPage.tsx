'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, Target, Sword, Bomb, SlidersHorizontal, X } from 'lucide-react';
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

const actionColors = {
  shot: 'text-amber-400 border-amber-500/50 bg-amber-950/30',
  melee: 'text-red-400 border-red-500/50 bg-red-950/30',
  grenade: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/30',
};

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

  const [dicePopupField, setDicePopupField] = useState<'range' | 'power' | null>(null);
  const [showModifiers, setShowModifiers] = useState(false);

  const handleDataNeeded = useCallback((field: 'range' | 'power') => {
    setDicePopupField(field);
  }, []);

  const handleDiceSubmit = useCallback((value: string) => {
    if (dicePopupField === 'range') {
      updateCombatantField('range', value);
    } else if (dicePopupField === 'power') {
      updateCombatantField('power', value);
    }
    setDicePopupField(null);
  }, [dicePopupField, updateCombatantField]);

  const currentAction = combatState.actionType;
  const phase = currentAction === 'melee' ? 'melee' as const : currentAction === 'grenade' ? 'grenade' as const : 'shot' as const;

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
        <h1 className="font-mono font-black text-lg uppercase tracking-wider text-slate-300">
          Калькулятор боя
        </h1>
        <div className="ml-auto">
          <RulesSelector value={rulesVersion} onChange={updateRulesVersion} />
        </div>
      </div>

      {/* Action Type Tabs — always visible */}
      <div className="flex border-b border-slate-800">
        {ACTION_TABS.map(({ type, label, icon: Icon }) => (
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
                ? actionColors[type]
                : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
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

            {/* Toggles + Execute */}
            <div className="flex gap-2">
              {/* Surprise Attack */}
              {(combatState.actionType === 'shot' || combatState.actionType === 'melee') && (
                <button
                  onClick={() => setParameters({ isSurpriseAttack: !combatState.parameters.isSurpriseAttack })}
                  className={cn(
                    "h-10 w-10 min-h-[40px] min-w-[40px] rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-95",
                    combatState.parameters.isSurpriseAttack
                      ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                  )}
                  aria-label="Внезапная атака"
                >
                  <span className={cn("text-sm", combatState.parameters.isSurpriseAttack ? "text-purple-400" : "text-slate-400")}>&#9889;</span>
                </button>
              )}

              {/* Aimed Shot */}
              {combatState.actionType === 'shot' && combatantData.type === 'squad' && (
                <button
                  onClick={() => setParameters({ isAimedShot: !combatState.parameters.isAimedShot })}
                  className={cn(
                    "h-10 w-10 min-h-[40px] min-w-[40px] rounded-lg border-2 flex items-center justify-center shrink-0 transition-all active:scale-95",
                    combatState.parameters.isAimedShot
                      ? "bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-500/20"
                      : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                  )}
                  aria-label="Прицельный выстрел"
                >
                  <span className={cn("text-sm", combatState.parameters.isAimedShot ? "text-cyan-400" : "text-slate-400")}>&#9678;</span>
                </button>
              )}

              {/* Execute */}
              <button
                onClick={() => executeAction()}
                className={cn(
                  "flex-1 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 transition-all min-h-[48px] active:scale-95",
                  currentAction && actionColors[currentAction]
                )}
              >
                {combatState.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                 combatState.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
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
          title={dicePopupField === 'range' ? 'ДАЛЬНОСТЬ' : 'МОЩНОСТЬ'}
          value={dicePopupField === 'range' ? combatantData.range : combatantData.power}
          color={dicePopupField === 'range' ? 'blue' : 'orange'}
          onSubmit={handleDiceSubmit}
          onClose={() => setDicePopupField(null)}
        />
      )}
    </div>
  );
}
