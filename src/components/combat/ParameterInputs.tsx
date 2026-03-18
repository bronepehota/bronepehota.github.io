'use client';

import { CombatParameters, CombatActionType } from '@/lib/combat-types';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { FortificationSelector } from '@/components/controls/FortificationSelector';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DiceNotationDisplay } from './DiceNotationDisplay';
import { getUnitStats, multiplyRange } from '@/lib/game-logic';
import { Target, Shield } from 'lucide-react';
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
}: ParameterInputsProps) {
  const effectiveDistance = targetMemory?.isDirty && targetMemory?.distance !== null
    ? targetMemory.distance
    : parameters.distance;

  const effectiveTargetArmor = targetMemory?.isDirty && targetMemory?.targetArmor !== null
    ? targetMemory.targetArmor
    : parameters.targetArmor;

  const effectiveTargetMelee = targetMemory?.isDirty && targetMemory?.targetMelee !== null
    ? targetMemory.targetMelee
    : parameters.targetMelee;

  // Get unit stats for preview
  const unitStats = unit ? getUnitStats(unit, soldierIndex, parameters.weaponIndex) : null;

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
      const effectiveRange = isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range;
      const hitProb = actionType === 'shot'
        ? calculateHitProbability(effectiveRange, effectiveDistance, parameters.fortification, rulesVersion, parameters.isSurpriseAttack)
        : null;
      const penProb = actionType === 'shot'
        ? calculatePenetrationProbability(unitStats.power, effectiveTargetArmor, parameters.fortification, rulesVersion)
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
              <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Дальность</div>
              <div className="flex justify-center relative mb-1">
                <DiceNotationDisplay rollStr={effectiveRange} color="blue" />
              </div>
              {/* Hit probability indicator */}
              {hitProb && (
                <div className="flex justify-center">
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
              <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Мощность</div>
              <div className="flex justify-center relative mb-1">
                <DiceNotationDisplay rollStr={unitStats.power} color="orange" />
              </div>
              {/* Penetration probability indicator */}
              {penProb && (
                <div className="flex justify-center">
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
    if (!unitStats) return null;

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
            <div className="flex justify-center">
              <DiceNotationDisplay rollStr={`1D6+${unitStats.melee}`} color="cyan" />
            </div>
          </div>
          <div className="bg-slate-950/80 p-2 rounded-md border border-red-500/30 relative">
            <div className="text-[8px] opacity-40 uppercase font-bold mb-1 text-center">Цель</div>
            <div className="flex justify-center">
              <DiceNotationDisplay rollStr={`1D6+${effectiveTargetMelee}`} color="red" />
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

        <div className="text-[10px] md:text-xs opacity-50 uppercase font-bold mb-2 md:mb-3 tracking-wider relative text-center">Параметры атаки</div>

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
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                Броня цели
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
                className="flex-1 sm:justify-start"
              />
            </div>
          )}

          {/* Target Melee Input (for melee attacks) */}
          {actionType === 'melee' && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-center gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px]">
                ББ цели
              </label>
              <NumberStepper
                value={effectiveTargetMelee}
                onChange={(value) => {
                  onChange({ targetMelee: value });
                  onMemoryUpdate?.({ targetMelee: value });
                }}
                min={0}
                max={99}
                step={1}
                size="sm"
                className="flex-1 sm:justify-start"
              />
            </div>
          )}

          {/* Fortification Selector */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="flex flex-col sm:flex-row sm:grid sm:grid-cols-[auto_1fr] sm:gap-2 sm:items-start gap-1.5">
              <label className="text-[10px] md:text-xs opacity-50 uppercase font-bold whitespace-nowrap sm:min-w-[70px] sm:pt-1.5">
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
