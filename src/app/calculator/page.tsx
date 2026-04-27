'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Crosshair, Swords, Bomb, Dice1 } from 'lucide-react';
import type { RulesVersionID } from '@/lib/types';
import type { CombatActionType } from '@/lib/combat-types';
import type { ModifierPhase, BuffDefinition, DebuffTemplate, ModifierSummary } from '@/lib/modifier-types';
import { getAllBuffs, getAllDebuffs, buildCalculatorModifierSummary } from '@/lib/modifier-utils';
import { getAllRulesVersions } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';
import { useCalculator } from '@/hooks/useCalculator';
import type { CalculatorModifier } from '@/lib/combat-calculator';
import CalculatorModifierSelector from '@/components/calculator/CalculatorModifierSelector';
import CalculatorResultsAdapter from '@/components/calculator/CalculatorResultsAdapter';
import { HitProbabilityIndicator } from '@/components/combat/HitProbabilityIndicator';

const ACTION_ICONS: Record<CombatActionType, React.ReactNode> = {
  shot: <Crosshair className="w-4 h-4" />,
  melee: <Swords className="w-4 h-4" />,
  grenade: <Bomb className="w-4 h-4" />,
};

const ACTION_LABELS: Record<CombatActionType, string> = {
  shot: 'Стрельба',
  melee: 'Ближний бой',
  grenade: 'Граната',
};

function phaseFromAction(action: CombatActionType): ModifierPhase {
  if (action === 'melee') return 'melee';
  if (action === 'grenade') return 'grenade';
  return 'shot';
}

function RulesSelector({
  value,
  onChange,
}: {
  value: RulesVersionID;
  onChange: (v: RulesVersionID) => void;
}) {
  const versions = useMemo(() => getAllRulesVersions(), []);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as RulesVersionID)}
      className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-ibm-mono
        rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      data-testid="calculator-rules-select"
    >
      {versions.map(v => (
        <option key={v.id} value={v.id}>{v.name}</option>
      ))}
    </select>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  className,
  testId,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  className?: string;
  testId?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        min={min}
        max={max}
        data-testid={testId}
        className="w-16 bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1
          text-xs font-ibm-mono text-slate-200 text-right
          focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  className,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  testId?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <label className="text-xs text-slate-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        data-testid={testId}
        className="w-16 bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1
          text-xs font-ibm-mono text-slate-200 text-right
          focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  className,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  testId?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <label className="text-xs text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        data-testid={testId}
        className="w-20 bg-slate-900/50 border border-slate-700/50 rounded px-2 py-1
          text-xs font-ibm-mono text-slate-200 text-right
          focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ModifiersActiveDisplay({ summary }: { summary: ModifierSummary }) {
  if (summary.descriptions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {summary.descriptions.map((desc, i) => (
        <span
          key={i}
          className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-[10px] font-ibm-mono rounded"
        >
          {desc}
        </span>
      ))}
    </div>
  );
}

export default function CalculatorPage() {
  const calc = useCalculator();
  const [allBuffs, setAllBuffs] = useState<BuffDefinition[]>([]);
  const [allDebuffs, setAllDebuffs] = useState<DebuffTemplate[]>([]);

  useEffect(() => {
    setAllBuffs(getAllBuffs());
    setAllDebuffs(getAllDebuffs());
  }, []);

  const modifierSummary = useMemo(() => {
    const selectedBuffsList = allBuffs.filter(b => calc.selectedBuffs.has(b.id));
    const selectedDebuffsList = allDebuffs.filter(d => calc.selectedDebuffs.has(d.id));
    return buildCalculatorModifierSummary(selectedBuffsList, selectedDebuffsList, phaseFromAction(calc.actionType));
  }, [allBuffs, allDebuffs, calc.selectedBuffs, calc.selectedDebuffs, calc.actionType]);

  const buildCalculatorModifiers = useCallback((): CalculatorModifier[] => {
    if (modifierSummary.descriptions.length === 0) return [];
    const mod: CalculatorModifier = {};
    if (modifierSummary.rangeBonus !== 0) mod.range_bonus = modifierSummary.rangeBonus;
    if (modifierSummary.rangeMultiplier !== 1) mod.range_multiply = modifierSummary.rangeMultiplier;
    if (modifierSummary.powerBonus !== 0) mod.power_bonus = modifierSummary.powerBonus;
    if (modifierSummary.meleeBonus !== 0) mod.melee_bonus = modifierSummary.meleeBonus;
    if (modifierSummary.armorBonus !== 0) mod.armor_bonus = modifierSummary.armorBonus;
    if (modifierSummary.distancePenalty !== 0) mod.distance_penalty = modifierSummary.distancePenalty;
    return [mod];
  }, [modifierSummary]);

  const handleExecute = useCallback(() => {
    calc.executeAction(buildCalculatorModifiers());
  }, [calc, buildCalculatorModifiers]);

  const handleGrenadeCheckTarget = useCallback((targetArmor: number) => {
    calc.checkGrenadeTarget(targetArmor);
  }, [calc]);

  const resetResult = useCallback(() => {
  }, []);

  const { parameters } = calc;

  const actionButtonLabel = calc.actionType === 'grenade'
    ? (calc.result?.type === 'grenade_distance' ? 'ПРОВЕРИТЬ ЦЕЛЬ' : 'БРОСИТЬ ГРАНАТУ')
    : 'БРОСАТЬ';

  const isGrenadeTargetCheck = calc.result?.type === 'grenade_distance';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              data-testid="calculator-back-link"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-russo text-sm uppercase tracking-widest text-slate-300">
              Калькулятор боя
            </h1>
          </div>
          <RulesSelector value={calc.rulesVersion} onChange={calc.setRulesVersion} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
          {(Object.entries(ACTION_LABELS) as [CombatActionType, string][]).map(([type, label]) => (
            <button
              key={type}
              onClick={() => calc.handleActionTypeChange(type)}
              data-testid={`calculator-action-${type}`}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md',
                'text-xs font-russo uppercase tracking-wide transition-all',
                calc.actionType === type
                  ? 'bg-slate-700 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50',
              )}
            >
              {ACTION_ICONS[type]}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-3 space-y-3">
          {calc.actionType === 'shot' && (
            <>
              <TextInput label="Дальность" value={parameters.range} onChange={v => calc.updateParameters({ range: v })} testId="calculator-range" />
              <NumberInput label="Бонус дальн." value={parameters.rangeBonus} onChange={v => calc.updateParameters({ rangeBonus: v })} testId="calculator-range-bonus" />
              <NumberInput label="Множитель" value={parameters.rangeMultiplier} onChange={v => calc.updateParameters({ rangeMultiplier: v })} min={1} testId="calculator-range-multiplier" />
              <TextInput label="Мощность" value={parameters.power} onChange={v => calc.updateParameters({ power: v })} testId="calculator-power" />
              <NumberInput label="Бонус мощн." value={parameters.powerBonus} onChange={v => calc.updateParameters({ powerBonus: v })} testId="calculator-power-bonus" />
              <NumberInput label="Дистанция" value={parameters.distance} onChange={v => calc.updateParameters({ distance: v })} min={1} testId="calculator-distance" />
              <NumberInput label="Броня цели" value={parameters.targetArmor} onChange={v => calc.updateParameters({ targetArmor: v })} min={0} testId="calculator-armor" />
              <SelectInput
                label="Укрытие"
                value={parameters.fortification}
                onChange={v => calc.updateParameters({ fortification: v as any })}
                options={[
                  { value: 'none', label: 'Нет' },
                  { value: 'light', label: 'Лёгкое' },
                  { value: 'heavy', label: 'Тяжёлое' },
                ]}
                testId="calculator-fortification"
              />
              <div className="pt-1">
                <HitProbabilityIndicator
                  rangeStr={
                    (() => {
                      let r = parameters.range;
                      const totalBonus = parameters.rangeBonus + modifierSummary.rangeBonus;
                      if (totalBonus !== 0) r = `${r}+${totalBonus}`;
                      return r;
                    })()
                  }
                  distanceSteps={parameters.distance + modifierSummary.distancePenalty}
                  powerStr={parameters.power}
                  targetArmor={parameters.targetArmor + modifierSummary.armorBonus}
                  rulesVersion={calc.rulesVersion}
                />
              </div>
            </>
          )}

          {calc.actionType === 'melee' && (
            <>
              <NumberInput label="ББ атак." value={parameters.attackerMelee} onChange={v => calc.updateParameters({ attackerMelee: v })} min={0} testId="calculator-attacker-melee" />
              <NumberInput label="Бонус ББ" value={parameters.meleeBonus} onChange={v => calc.updateParameters({ meleeBonus: v })} testId="calculator-melee-bonus" />
              <NumberInput label="ББ защ." value={parameters.defenderMelee} onChange={v => calc.updateParameters({ defenderMelee: v })} min={0} testId="calculator-defender-melee" />
            </>
          )}

          {calc.actionType === 'grenade' && (
            <>
              <NumberInput label="Ранг" value={parameters.soldierRank} onChange={v => calc.updateParameters({ soldierRank: v })} min={0} max={7} testId="calculator-soldier-rank" />
              {isGrenadeTargetCheck && (
                <NumberInput label="Броня цели" value={parameters.targetArmor} onChange={v => calc.updateParameters({ targetArmor: v })} min={0} testId="calculator-grenade-armor" />
              )}
            </>
          )}
        </div>

        <CalculatorModifierSelector
          selectedBuffs={calc.selectedBuffs}
          selectedDebuffs={calc.selectedDebuffs}
          onToggleBuff={calc.toggleBuff}
          onToggleDebuff={calc.toggleDebuff}
          phase={phaseFromAction(calc.actionType)}
        />

        <ModifiersActiveDisplay summary={modifierSummary} />

        <button
          onClick={handleExecute}
          data-testid="calculator-execute-button"
          className={cn(
            'w-full py-3 rounded-lg font-russo text-sm uppercase tracking-widest',
            'transition-all duration-200 touch-manipulation min-h-[44px]',
            isGrenadeTargetCheck
              ? 'bg-amber-700/60 hover:bg-amber-700/80 text-amber-100 border border-amber-600/50'
              : 'bg-slate-700/60 hover:bg-slate-700/80 text-slate-100 border border-slate-600/50',
          )}
        >
          <Dice1 className="w-4 h-4 inline mr-2 -mt-0.5" />
          {actionButtonLabel}
        </button>

        {calc.result && (
          <CalculatorResultsAdapter
            result={calc.result}
            onReset={resetResult}
            onGrenadeCheckTarget={
              calc.result.type === 'grenade_distance' ? handleGrenadeCheckTarget : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
