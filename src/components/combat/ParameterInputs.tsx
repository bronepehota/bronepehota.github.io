'use client';

import { CombatParameters, CombatActionType } from '@/lib/combat-types';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { FortificationSelector } from '@/components/controls/FortificationSelector';
import type { ModifierSummary } from '@/lib/modifier-types';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DiceNotationDisplay } from './DiceNotationDisplay';
import { getUnitStats, multiplyRange, addBonusToRoll } from '@/lib/game-logic';
import { Target, Shield } from 'lucide-react';
import type { CombatantData } from '@/lib/combatant-data';
import { Machine } from '@/lib/types';
import { TargetMemory } from '@/contexts/CombatTargetContext';
import { DistanceConverter } from './DistanceConverter';
import {
  CompactProbabilityIndicator,
  calculateHitProbability,
  calculatePenetrationProbability
} from './HitProbabilityIndicator';

interface ParameterInputsProps {
  actionType: CombatActionType;
  parameters: CombatParameters;
  onChange: (params: Partial<CombatParameters>) => void;
  rulesVersion: RulesVersionID;
  className?: string;
  unit?: any;
  soldierIndex?: number | null;
  targetMemory?: TargetMemory;
  onMemoryUpdate?: (params: Partial<TargetMemory>) => void;
  isAimedShot?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  modifierSummary?: ModifierSummary;
  onDataNeeded?: (field: 'range' | 'power' | 'melee' | 'rank') => void;
  combatantData?: CombatantData;
}

export function ParameterInputs({
  actionType,
  parameters,
  onChange,
  rulesVersion,
  className,
  unit,
  soldierIndex,
  targetMemory,
  onMemoryUpdate,
  isAimedShot,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  modifierSummary,
  onDataNeeded,
  combatantData,
}: ParameterInputsProps) {
  const effectiveDistance = targetMemory?.isDirty && targetMemory?.distance !== null
    ? targetMemory.distance
    : parameters.distance;

  const effectiveTargetArmor = targetMemory?.isDirty && targetMemory?.targetArmor !== null
    ? targetMemory.targetArmor
    : parameters.targetArmor;

  const effectiveTargetIsVehicle = targetMemory?.isDirty && targetMemory?.targetIsVehicle !== null
    ? !!targetMemory.targetIsVehicle
    : !!parameters.targetIsVehicle;

  // Get unit stats for preview — combatantData takes priority (calculator mode)
  const unitStats = combatantData
    ? { range: combatantData.range || '', power: combatantData.power || '', melee: combatantData.melee, displayName: 'Боец' }
    : unit
      ? getUnitStats(unit, soldierIndex, parameters.weaponIndex)
      : null;

  // Modifier bonus pill — compact +N/-N badge inline with dice
  const ModBadge = ({ bonus }: { bonus: number }) => {
    if (bonus === 0) return null;
    const pos = bonus > 0;
    return (
      <span className={cn(
        'inline-flex items-center justify-center px-1.5 py-px rounded-sm text-xs font-extrabold font-mono leading-none',
        pos
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30',
      )}>
        {pos ? `+${bonus}` : `${bonus}`}
      </span>
    );
  };

  // Extract modifier values for display
  const rangeBonus = modifierSummary?.rangeBonus ?? 0;
  const powerBonus = modifierSummary?.powerBonus ?? 0;
  const meleeBonus = modifierSummary?.meleeBonus ?? 0;

  // Render stats preview for shot/grenade
  const renderShotGrenadeStats = () => {
    if (actionType === 'grenade') {
      // Grenades have fixed dice
      return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-2 md:p-3 rounded-lg border border-slate-700/50 mb-2 md:mb-3 relative overflow-hidden">
          {/* Tech decoration */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-emerald-500/30" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-emerald-500/30" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-emerald-500/30" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-emerald-500/30" />

          {/* Scanline effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 opacity-50 pointer-events-none" />

          <div className="text-[8px] md:text-[10px] opacity-50 uppercase font-bold mb-2 md:mb-3 tracking-wider text-center relative">
            Граната
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/80 p-2 rounded-md border border-blue-500/30 relative">
              <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Дальность</div>
              <div className="flex justify-center">
                <DiceNotationDisplay rollStr="D6" color="blue" />
              </div>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-md border border-orange-500/30 relative">
              <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Мощность</div>
              <div className="flex justify-center">
                <DiceNotationDisplay rollStr="1D20" color="orange" />
              </div>
            </div>
            {/* Rank for grenade blast distance (D6 + rank) */}
            {combatantData && onDataNeeded && (
              <div className="mt-2 bg-slate-950/80 p-2 rounded-md border border-emerald-500/30">
                <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Ранг (дистанция D6+ранг)</div>
                <div className="flex justify-center">
                  <button
                    onClick={() => onDataNeeded('rank')}
                    className={cn(
                      "px-3 py-1 rounded border-2 font-mono transition-all min-h-[44px] flex items-center justify-center",
                      combatantData.rank === 0
                        ? "border-dashed border-emerald-500/40 text-emerald-400/60 text-xs hover:border-emerald-500/70 hover:text-emerald-400"
                        : "border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 text-sm font-bold"
                    )}
                  >
                    {combatantData.rank === 0 ? 'Нажмите для ввода' : combatantData.rank}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (unitStats) {
      const isMachine = unit?.type === 'machine';
      const weaponName = isMachine && parameters.weaponIndex !== undefined
        ? (unit.data as Machine).weapons[parameters.weaponIndex].name
        : null;

      // Calculate probabilities for shot action
      let effectiveRange = isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range;
      if (parameters.isHeightBonus && actionType === 'shot') {
        effectiveRange = addBonusToRoll(effectiveRange, 1);
      }
      const hitProb = actionType === 'shot'
        ? calculateHitProbability(effectiveRange, effectiveDistance, parameters.fortification, rulesVersion)
        : null;
      const penProb = actionType === 'shot'
        ? calculatePenetrationProbability(unitStats.power, effectiveTargetArmor, parameters.fortification, rulesVersion, actionType === 'shot' && parameters.isSurpriseAttack)
        : null;

      return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-2 md:p-3 rounded-lg border border-slate-700/50 mb-2 md:mb-3 relative overflow-hidden">
          {/* Tech decoration */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/30" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/30" />
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-500/30" />
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-cyan-500/30" />

          <div className="text-[8px] md:text-xs opacity-50 uppercase font-bold mb-1.5 md:mb-2 tracking-wider text-center flex items-center justify-center gap-1.5 md:gap-2 relative">
            {isMachine && weaponName && (
              <>
                <Target className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[8px] md:text-[10px]">{weaponName}</span>
              </>
            )}
            {!isMachine && <span className="text-[8px] md:text-[10px]">Ваше оружие</span>}
          </div>
          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
            {/* Range Card */}
            <div className="bg-slate-950/80 p-1.5 md:p-2 rounded-md border border-blue-500/30 relative">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-[8px] opacity-40 uppercase font-bold">Дальность</span>
                <ModBadge bonus={rangeBonus} />
              </div>
              <div className="flex justify-center relative mb-1">
                {onDataNeeded && combatantData ? (
                  <button
                    onClick={() => onDataNeeded('range')}
                    className={cn(
                      "rounded transition-all min-h-[44px] flex items-center justify-center",
                      !effectiveRange
                        ? "px-3 py-1 border-2 border-dashed border-blue-500/40 text-blue-400/60 text-xs font-mono hover:border-blue-500/70 hover:text-blue-400"
                        : "hover:bg-blue-950/20 px-1 py-0.5"
                    )}
                  >
                    {!effectiveRange ? 'Нажмите для ввода' : <DiceNotationDisplay rollStr={effectiveRange} color="blue" />}
                  </button>
                ) : (
                  <DiceNotationDisplay rollStr={effectiveRange} color="blue" />
                )}
              </div>
              {/* Hit probability indicator */}
              {hitProb && (
                <div data-testid="hit-probability" className="flex justify-center">
                  <CompactProbabilityIndicator
                    type="hit"
                    probability={hitProb.probability}
                    className="text-[7px] md:text-[9px]"
                  />
                </div>
              )}
            </div>

            {/* Power Card */}
            <div className="bg-slate-950/80 p-1.5 md:p-2 rounded-md border border-orange-500/30 relative">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className="text-[8px] opacity-40 uppercase font-bold">Мощность</span>
                <ModBadge bonus={powerBonus} />
              </div>
              <div className="flex justify-center relative mb-1">
                {onDataNeeded && combatantData ? (
                  <button
                    onClick={() => onDataNeeded('power')}
                    className={cn(
                      "rounded transition-all min-h-[44px] flex items-center justify-center",
                      !unitStats.power
                        ? "px-3 py-1 border-2 border-dashed border-orange-500/40 text-orange-400/60 text-xs font-mono hover:border-orange-500/70 hover:text-orange-400"
                        : "hover:bg-orange-950/20 px-1 py-0.5"
                    )}
                  >
                    {!unitStats.power ? 'Нажмите для ввода' : (
                      <span className="flex items-center gap-1">
                        <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
                        {parameters.isSurpriseAttack && actionType === 'shot' && (
                          <span className="text-purple-400 text-[10px] font-mono font-bold" data-testid="power-max-marker">макс</span>
                        )}
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="flex items-center gap-1">
                    <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
                    {parameters.isSurpriseAttack && actionType === 'shot' && (
                      <span className="text-purple-400 text-[10px] font-mono font-bold" data-testid="power-max-marker">макс</span>
                    )}
                  </span>
                )}
              </div>
              {/* Penetration probability indicator */}
              {penProb && (
                <div data-testid="penetration-probability" className="flex justify-center">
                  <CompactProbabilityIndicator
                    type="penetration"
                    probability={penProb.probability}
                    className="text-[7px] md:text-[9px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render stats preview for melee
  const renderMeleeStats = () => {
    if (!unitStats && !combatantData) return null;

    const meleeValue = unitStats?.melee ?? combatantData?.melee ?? 0;

    return (
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-2 md:p-3 rounded-lg border border-slate-700/50 mb-2 md:mb-3 relative overflow-hidden">
        {/* Tech decoration */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/30" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-red-500/30" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-red-500/30" />

        <div className="text-[8px] md:text-[10px] opacity-50 uppercase font-bold mb-2 md:mb-3 tracking-wider text-center relative">
          Ближний бой
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/80 p-2 rounded-md border border-cyan-500/30 relative">
            <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Вы</div>
            <div className="flex items-center justify-center gap-1.5">
              {combatantData && onDataNeeded ? (
                <button
                  onClick={() => onDataNeeded('melee')}
                  className={cn(
                    "px-3 py-1 rounded border-2 font-mono transition-all min-h-[44px] flex items-center justify-center",
                    meleeValue === 0
                      ? "border-dashed border-cyan-500/40 text-cyan-400/60 text-xs hover:border-cyan-500/70 hover:text-cyan-400"
                      : "border-cyan-500/30 text-cyan-400 hover:border-cyan-500/60 text-sm font-bold"
                  )}
                >
                  {meleeValue === 0 ? 'Нажмите для ввода' : `1D6+${meleeValue}`}
                </button>
              ) : (
                <DiceNotationDisplay rollStr={`1D6+${meleeValue}`} color="cyan" />
              )}
              <ModBadge bonus={meleeBonus} />
            </div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-md border border-red-500/30 relative">
            <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Цель</div>
            <div className="flex justify-center">
              <DiceNotationDisplay rollStr={`1D6+${effectiveTargetArmor}`} color="red" />
            </div>
          </div>
        </div>
        <div className="mt-2 text-center text-[10px] md:text-xs opacity-60 relative">
          Сравните результаты бросков
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-2 md:space-y-3", className)}>
      {/* Unit Stats Preview */}
      {(actionType === 'shot' || actionType === 'grenade') && renderShotGrenadeStats()}
      {actionType === 'melee' && renderMeleeStats()}

      {/* Parameters section with enhanced styling */}
      <div className="bg-slate-900/80 p-2 md:p-3 rounded-lg border border-slate-700/50 relative overflow-hidden">
        {/* Tech decoration */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-slate-600/30" />
        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-slate-600/30" />
        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-slate-600/30" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-slate-600/30" />

        {/* Subtle scanline effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-slate-500/5 opacity-30 pointer-events-none" />

        {rulesVersion === 'community_star_system' && actionType === 'shot' ? (
          <div
            role="group"
            aria-label="Тип цели"
            className="flex gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/60 mb-2 md:mb-3 relative"
          >
            <button
              type="button"
              aria-pressed={!effectiveTargetIsVehicle}
              onClick={() => {
                onChange({ targetIsVehicle: false });
                onMemoryUpdate?.({ targetIsVehicle: false });
              }}
              className={cn(
                'flex-1 min-h-[36px] px-3 rounded-md text-xs md:text-sm font-mono uppercase font-bold tracking-wide transition-all touch-manipulation',
                !effectiveTargetIsVehicle
                  ? 'bg-slate-600/70 text-slate-100 shadow'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              Пехота
            </button>
            <button
              type="button"
              aria-pressed={effectiveTargetIsVehicle}
              onClick={() => {
                onChange({ targetIsVehicle: true });
                onMemoryUpdate?.({ targetIsVehicle: true });
              }}
              className={cn(
                'flex-1 min-h-[36px] px-3 rounded-md text-xs md:text-sm font-mono uppercase font-bold tracking-wide transition-all touch-manipulation',
                effectiveTargetIsVehicle
                  ? 'bg-cyan-600/30 text-cyan-200 ring-1 ring-cyan-500/60'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              Техника
            </button>
          </div>
        ) : (
          <div className="text-[10px] md:text-xs opacity-50 uppercase font-bold mb-2 md:mb-3 tracking-wider relative text-center">Параметры атаки</div>
        )}

        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {/* Distance Input with Converter */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <DistanceConverter
              steps={effectiveDistance}
              onChange={(steps) => {
                onChange({ distance: steps });
                onMemoryUpdate?.({ distance: steps });
              }}
              rulesVersion={rulesVersion}
              stepToCmFactor={stepToCmFactor}
              defaultMode={distanceInputUnit}
            />
          )}

          {/* Target Armor Input */}
          {(actionType === 'shot' || actionType === 'grenade' || actionType === 'melee') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold">
                {effectiveTargetIsVehicle ? 'макс зоны' : 'Броня цели'}
              </label>
              <NumberStepper
                value={effectiveTargetArmor}
                onChange={(value) => {
                  onChange({ targetArmor: value });
                  onMemoryUpdate?.({ targetArmor: value });
                }}
                min={0}
                max={99}
                step={1}
                size="sm"
                className="flex-1"
              />
              {effectiveTargetIsVehicle && rulesVersion === 'community_star_system' && actionType === 'shot' && (
                <div className="text-[9px] md:text-[10px] font-mono text-cyan-400/70 leading-tight">
                  Урон по зонам прочности: D6→1, D12→2, D20→3
                </div>
              )}
            </div>
          )}

          {/* Fortification Selector */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold">
                Укрытие
              </label>
              <FortificationSelector
                value={parameters.fortification}
                onChange={(value) => onChange({ fortification: value })}
                rulesVersion={rulesVersion}
                className="flex-1"
              />
            </div>
          )}

        </div>
      </div>

      {/* Rules hint based on version */}
      {(actionType === 'shot' || actionType === 'grenade') && parameters.fortification !== 'none' && (
        <div className="flex items-center gap-1 px-1.5 py-1 bg-orange-900/10 border border-orange-700/30 rounded">
          <Shield size={10} className="text-orange-400 shrink-0" />
          <span className="text-[9px] text-orange-400">
            Укрытие: +{parameters.fortification === 'light' ? '1' : '2'} к {rulesVersion === 'community_star_system' ? 'дистанции' : 'броне'}
          </span>
        </div>
      )}
    </div>
  );
}
