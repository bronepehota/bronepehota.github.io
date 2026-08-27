// src/components/encyclopedia/UnitDetail/UnitCombatSandbox.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Target, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { soldierToCombatantData } from '@/lib/combatant-data';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatResults } from '@/components/combat/CombatResults';
import { DiceInputPopup } from '@/components/calculator/DiceInputPopup';
import { RulesSelector } from '@/components/calculator/RulesSelector';
import { trackEvent } from '@/lib/analytics';
import type { CombatActionType } from '@/lib/combat-types';
import type { Soldier } from '@/lib/types';
import type { EnrichedUnit } from '@/lib/encyclopedia-utils';

interface UnitCombatSandboxProps {
  unit: EnrichedUnit;
  soldiers: Soldier[];
  onClose: () => void;
}

/** Песочница предлагает только выстрел и ближний бой — гранату не экспонируем
 *  (хук её поддерживает, но вкладку не рендерим). */
const SANDBOX_ACTIONS: Array<{
  type: Extract<CombatActionType, 'shot' | 'melee'>;
  label: string;
  description: string;
}> = [
  { type: 'shot', label: 'ВЫСТРЕЛ', description: 'Дистанция • Броня • Укрытие' },
  { type: 'melee', label: 'БЛИЖНИЙ БОЙ', description: 'Кубики против кубиков' },
];

const ACTION_COLORS = {
  shot: {
    primary: 'text-amber-400',
    border: 'border-amber-600/50',
    bg: 'bg-amber-950/30',
    hover: 'hover:bg-amber-950/50',
    button: 'border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50',
  },
  melee: {
    primary: 'text-red-400',
    border: 'border-red-600/50',
    bg: 'bg-red-950/30',
    hover: 'hover:bg-red-950/50',
    button: 'border-red-600 bg-red-950/30 text-red-400 hover:bg-red-950/50',
  },
} as const;

/** Чипы солдат показываем только если их боевые статы различаются. */
function distinctSoldiers(soldiers: Soldier[]): boolean {
  const sig = (s: Soldier) => JSON.stringify([s.rank, s.range, s.power, s.melee, s.armor]);
  return new Set(soldiers.map(sig)).size > 1;
}

type DicePopupField = 'range' | 'power' | 'melee' | 'rank' | null;

/**
 * Bottom-sheet боевая песочница на странице юнита энциклопедии:
 * «а как этот боец вообще стреляет?» — prefill статов первого солдата,
 quick-расчёт выстрела/ближнего боя без создания армии.
 */
export function UnitCombatSandbox({ unit, soldiers, onClose }: UnitCombatSandboxProps) {
  const [soldierIdx, setSoldierIdx] = useState(0);
  const [dicePopupField, setDicePopupField] = useState<DicePopupField>(null);
  const [resetTick, setResetTick] = useState(0);

  const flow = useStandaloneCombatFlow(
    soldiers.length > 0 ? soldierToCombatantData(soldiers[0]) : undefined,
  );
  const { sheetRef, touchHandlers } = useBottomSheet({ onClose });

  useEffect(() => {
    trackEvent('sandbox_open', { unit: unit.id });
  }, [unit.id]);

  const showChips = useMemo(() => distinctSoldiers(soldiers), [soldiers]);

  // Хук берёт initialCombatant только при монтировании — пересоздать поток нельзя,
  // поэтому переключение солдата проталкиваем полями. Расчёт сбрасываем ОТЛОЖЕННО:
  // синхронный newCalculation в том же обработчике замыкался бы на прошлое
  // combatantData (useCallback deps [combatantData]) и стартовал бой со статами
  // предыдущего солдата.
  const pickSoldier = (i: number) => {
    setSoldierIdx(i);
    const d = soldierToCombatantData(soldiers[i]);
    flow.updateCombatantField('range', d.range);
    flow.updateCombatantField('power', d.power);
    flow.updateCombatantField('melee', d.melee);
    flow.updateCombatantField('armor', d.armor);
    flow.updateCombatantField('rank', d.rank);
    setResetTick((t) => t + 1);
  };

  // Отложенный сброс: эффект выполняется после коммита новых статов —
  // замыкание newCalculation уже свежее (deps [combatantData]).
  useEffect(() => {
    if (resetTick > 0) flow.newCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTick]);

  const handleDataNeeded = useCallback((field: 'range' | 'power' | 'melee' | 'rank') => {
    setDicePopupField(field);
  }, []);

  const handleDiceSubmit = useCallback(
    (value: string) => {
      if (dicePopupField === 'range') {
        flow.updateCombatantField('range', value);
      } else if (dicePopupField === 'power') {
        flow.updateCombatantField('power', value);
      } else if (dicePopupField === 'melee') {
        flow.updateCombatantField('melee', parseInt(value, 10) || 0);
      } else if (dicePopupField === 'rank') {
        flow.updateCombatantField('rank', parseInt(value, 10) || 0);
      }
      setDicePopupField(null);
    },
    [dicePopupField, flow.updateCombatantField],
  );

  const { combatState } = flow;
  const currentAction = combatState.actionType;
  const colors = currentAction === 'melee' ? ACTION_COLORS.melee : ACTION_COLORS.shot;

  return (
    <div
      data-testid="unit-combat-sandbox-overlay"
      className="fixed inset-0 z-[70] bg-black/60 animate-fadeIn"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        data-testid="unit-combat-sandbox"
        className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-slate-900 border-t-2 border-slate-700 shadow-2xl max-h-[90dvh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
        {...touchHandlers}
      >
        {/* Шапка */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {'// ПЕСОЧНИЦА'}
            </div>
            <div className="font-mono font-bold text-sm uppercase tracking-wider text-slate-200 truncate">
              {unit.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="p-2 hover:bg-slate-800 rounded-lg border border-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 active:scale-95 transition-all"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Правила */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-800">
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0">
            Правила
          </span>
          <RulesSelector
            value={flow.rulesVersion}
            onChange={flow.updateRulesVersion}
            className="flex-1 min-w-0"
          />
        </div>

        {/* Чипы солдат — только если статы различаются */}
        {showChips && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 overflow-x-auto scrollbar-hide">
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 shrink-0">
              Солдат
            </span>
            {soldiers.map((_, i) => (
              <button
                key={i}
                type="button"
                data-testid={`sandbox-soldier-${i}`}
                aria-pressed={soldierIdx === i}
                onClick={() => pickSoldier(i)}
                className={cn(
                  'min-w-[44px] min-h-[44px] px-2 rounded-lg border-2 font-mono font-bold text-sm transition-all active:scale-95 shrink-0',
                  soldierIdx === i
                    ? 'border-amber-500 bg-amber-950/40 text-amber-400'
                    : 'border-slate-600 bg-slate-800/60 text-slate-400 hover:border-slate-500',
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Вкладки действий — всегда видны, без гранаты */}
        <div className="flex border-b border-slate-800">
          {SANDBOX_ACTIONS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                if (combatState.phase === 'ACTION_SELECT') {
                  flow.selectAction(type);
                } else if (combatState.phase !== 'ROLLING') {
                  flow.switchAction(type);
                }
              }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 transition-all font-mono text-xs uppercase tracking-wider min-h-[48px]',
                currentAction === type
                  ? cn(ACTION_COLORS[type].primary, ACTION_COLORS[type].border, ACTION_COLORS[type].bg)
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Фаза: выбор действия */}
        {combatState.phase === 'ACTION_SELECT' && (
          <div className="p-4 space-y-2">
            {SANDBOX_ACTIONS.map(({ type, label, description }) => {
              const c = ACTION_COLORS[type];
              return (
                <button
                  key={type}
                  type="button"
                  data-testid={`sandbox-action-${type}`}
                  onClick={() => flow.selectAction(type)}
                  className={cn(
                    'w-full p-2.5 rounded-lg border-2 bg-slate-900/80 transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] text-left',
                    c.border,
                    c.hover,
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg border shrink-0', c.bg, c.border)}>
                      {type === 'shot' ? (
                        <Target className={cn('w-5 h-5', c.primary)} />
                      ) : (
                        <Sword className={cn('w-5 h-5', c.primary)} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={cn('font-mono font-black text-sm uppercase tracking-wider', c.primary)}>
                        {label}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider truncate">
                        {description}
                      </div>
                    </div>
                    <div className="text-slate-700 font-mono text-lg" aria-hidden="true">→</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Фаза: параметры */}
        {combatState.phase === 'PARAMETERS' && (
          <div className="p-4 space-y-3">
            <ParameterInputs
              actionType={combatState.actionType!}
              parameters={combatState.parameters}
              onChange={flow.setParameters}
              rulesVersion={flow.rulesVersion}
              combatantData={flow.combatantData}
              onDataNeeded={handleDataNeeded}
              isAimedShot={combatState.parameters.isAimedShot}
              modifierSummary={flow.modifierSummary}
            />

            <button
              type="button"
              onClick={() => flow.executeAction()}
              className={cn(
                'w-full font-mono text-xs font-bold uppercase tracking-wider border-2 transition-all min-h-[44px] active:scale-95 shadow-lg',
                colors.button,
              )}
            >
              {currentAction === 'melee' ? 'АТАКОВАТЬ' : 'ВЫСТРЕЛИТЬ'}
            </button>
          </div>
        )}

        {/* Фаза: результаты */}
        {combatState.phase === 'RESULTS' && combatState.result && (
          <div className="p-4">
            <CombatResults
              result={combatState.result}
              parameters={combatState.parameters}
              rulesVersion={flow.rulesVersion}
              onApply={() => flow.applyResult()}
              onGoBack={flow.goBack}
              unitType={combatState.unitType}
              onGrenadeCheckTarget={flow.checkGrenadeTarget}
            />
          </div>
        )}

        {/* Фаза: результат принят */}
        {combatState.phase === 'APPLY' && (
          <div className="p-4 text-center space-y-3">
            <div className="text-slate-400 font-mono text-sm">Результат принят</div>
            <button
              type="button"
              onClick={flow.newCalculation}
              className="px-6 py-3 rounded-lg font-mono font-bold uppercase tracking-wider border-2 border-amber-600 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 transition-all min-h-[44px] active:scale-95"
            >
              Новый расчёт
            </button>
          </div>
        )}

        {/* iOS safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
      </div>

      {/* Ввод недостающих кубиков */}
      {dicePopupField && (
        <DiceInputPopup
          title={
            dicePopupField === 'range'
              ? 'ДАЛЬНОСТЬ'
              : dicePopupField === 'power'
                ? 'МОЩНОСТЬ'
                : dicePopupField === 'melee'
                  ? 'БЛИЖНИЙ БОЙ'
                  : 'РАНГ'
          }
          value={
            dicePopupField === 'range'
              ? flow.combatantData.range
              : dicePopupField === 'power'
                ? flow.combatantData.power
                : undefined
          }
          mode={dicePopupField === 'melee' || dicePopupField === 'rank' ? 'number' : 'dice'}
          numericValue={
            dicePopupField === 'melee'
              ? flow.combatantData.melee
              : dicePopupField === 'rank'
                ? flow.combatantData.rank
                : 0
          }
          min={0}
          max={dicePopupField === 'rank' ? 5 : 10}
          color={
            dicePopupField === 'range'
              ? 'blue'
              : dicePopupField === 'power'
                ? 'orange'
                : dicePopupField === 'melee'
                  ? 'cyan'
                  : 'emerald'
          }
          onSubmit={handleDiceSubmit}
          onClose={() => setDicePopupField(null)}
        />
      )}
    </div>
  );
}
