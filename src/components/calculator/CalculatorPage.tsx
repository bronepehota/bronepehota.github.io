'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { ActionSelector } from '@/components/combat/ActionSelector';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatResults } from '@/components/combat/CombatResults';
import { RulesSelector } from './RulesSelector';
import { ModifiersSelector } from './ModifiersSelector';
import { DiceInputPopup } from './DiceInputPopup';
import { NumberStepper } from '@/components/ui/NumberStepper';

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
    startStandaloneCombat,
  } = useStandaloneCombatFlow();

  const [dicePopupField, setDicePopupField] = useState<'range' | 'power' | null>(null);

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

  const handleStart = useCallback(() => {
    startStandaloneCombat();
  }, [startStandaloneCombat]);

  const isOpen = combatState.phase !== 'IDLE';

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
      </div>

      <div className="max-w-[600px] mx-auto p-4 space-y-4">
        {/* Rules Selector */}
        <RulesSelector value={rulesVersion} onChange={updateRulesVersion} />

        {/* Modifiers Selector */}
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
          <ModifiersSelector value={modifierSummary} onChange={setModifierSummary} />
        </div>

        {/* Combat Flow */}
        {!isOpen ? (
          <div className="space-y-4">
            {/* Unit type selector */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Тип юнита</div>
              <div className="flex gap-2">
                {(['squad', 'machine'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => updateCombatantField('type', t)}
                    className={cn(
                      "flex-1 p-2.5 rounded-lg border-2 text-center font-mono text-xs uppercase tracking-wider transition-all min-h-[44px]",
                      combatantData.type === t
                        ? "border-cyan-500 bg-cyan-950/40 text-cyan-400"
                        : "border-slate-600 bg-slate-800/60 text-slate-400"
                    )}
                  >
                    {t === 'squad' ? 'Пехота' : 'Техника'}
                  </button>
                ))}
              </div>
            </div>

            {/* Combat stats inputs */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Параметры бойца</div>

              {/* Range */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Дальность</span>
                <button
                  onClick={() => setDicePopupField('range')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono font-bold transition-all min-h-[44px] flex items-center",
                    combatantData.range
                      ? "border-blue-500/50 bg-blue-950/30 text-blue-400"
                      : "border-dashed border-slate-600 text-slate-500 hover:border-blue-500/40"
                  )}
                >
                  {combatantData.range || 'Нажмите'}
                </button>
              </div>

              {/* Power */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Мощность</span>
                <button
                  onClick={() => setDicePopupField('power')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono font-bold transition-all min-h-[44px] flex items-center",
                    combatantData.power
                      ? "border-orange-500/50 bg-orange-950/30 text-orange-400"
                      : "border-dashed border-slate-600 text-slate-500 hover:border-orange-500/40"
                  )}
                >
                  {combatantData.power || 'Нажмите'}
                </button>
              </div>

              {/* Melee */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Ближний бой</span>
                <NumberStepper
                  value={combatantData.melee}
                  onChange={(v) => updateCombatantField('melee', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Armor */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Броня</span>
                <NumberStepper
                  value={combatantData.armor}
                  onChange={(v) => updateCombatantField('armor', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Rank */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Ранг</span>
                <NumberStepper
                  value={combatantData.rank}
                  onChange={(v) => updateCombatantField('rank', v)}
                  min={0}
                  max={10}
                  step={1}
                  size="sm"
                />
              </div>

              {/* Grenades */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">Гранаты</span>
                <button
                  onClick={() => updateCombatantField('grenadesAvailable', !combatantData.grenadesAvailable)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border-2 font-mono text-xs transition-all min-h-[44px]",
                    combatantData.grenadesAvailable
                      ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-400"
                      : "border-slate-600 bg-slate-800/60 text-slate-500"
                  )}
                >
                  {combatantData.grenadesAvailable ? 'Да' : 'Нет'}
                </button>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              className="w-full py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
            >
              Начать расчёт
            </button>
          </div>
        ) : (
          /* Combat flow phases */
          <div className="space-y-3">
            {combatState.phase === 'ACTION_SELECT' && (
              <ActionSelector
                onSelect={selectAction}
                grenadesAvailable={combatantData.grenadesAvailable}
                combatantData={combatantData}
              />
            )}

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

                {/* Surprise Attack + Aimed Shot toggles + Execute button */}
                <div className="flex gap-2">
                  {/* Back button */}
                  <button
                    onClick={goBack}
                    className="px-3 py-2 rounded-lg border border-slate-600 text-slate-400 font-mono text-xs min-h-[44px] active:scale-95 transition-all"
                  >
                    &larr;
                  </button>

                  {/* Surprise Attack toggle */}
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

                  {/* Aimed Shot toggle - squads only */}
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

                  {/* Execute button */}
                  <button
                    onClick={() => executeAction()}
                    className="flex-1 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
                  >
                    {combatState.actionType === 'shot' ? 'ВЫСТРЕЛИТЬ' :
                     combatState.actionType === 'melee' ? 'АТАКОВАТЬ' : 'БРОСИТЬ'}
                  </button>
                </div>
              </div>
            )}

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

            {combatState.phase === 'APPLY' && (
              <div className="text-center py-8 space-y-4">
                <div className="text-slate-400 font-mono text-sm">Результат принят</div>
                <button
                  onClick={handleStart}
                  className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[48px] active:scale-95"
                >
                  Новый расчёт
                </button>
              </div>
            )}
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
