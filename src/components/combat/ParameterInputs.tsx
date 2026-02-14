'use client';

import { CombatParameters, CombatActionType } from '@/lib/combat-types';
import { NumberStepper } from '@/components/ui/NumberStepper';
import { FortificationSelector } from '@/components/FortificationSelector';
import { RulesVersionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { StaticDiceDisplay } from './StaticDiceDisplay';
import { getUnitStats, multiplyRange } from '@/lib/game-logic';
import { Target, Shield } from 'lucide-react';
import { Machine } from '@/lib/types';
import { TargetMemory } from '@/contexts/CombatTargetContext';
import { DistanceConverter } from './DistanceConverter';

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
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
          <div className="text-[10px] opacity-50 uppercase font-bold mb-3 tracking-wider text-center">
            Граната
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-blue-500/30">
              <div className="text-[8px] opacity-40 uppercase font-bold mb-2 text-center">Дальность</div>
              <div className="flex justify-center">
                <StaticDiceDisplay rollStr="D6" size="md" color="blue" />
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-orange-500/30">
              <div className="text-[8px] opacity-40 uppercase font-bold mb-2 text-center">Мощность</div>
              <div className="flex justify-center">
                <StaticDiceDisplay rollStr="1D20" size="md" color="orange" />
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

      return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-3 md:p-4 rounded-xl border border-slate-700 mb-4">
          <div className="text-[10px] md:text-xs opacity-50 uppercase font-bold mb-2 md:mb-3 tracking-wider text-center flex items-center justify-center gap-2">
            {isMachine && weaponName && (
              <>
                <Target className="w-3 h-3 md:w-4 md:h-4" />
                <span>{weaponName}</span>
              </>
            )}
            {!isMachine && 'Ваше оружие'}
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="bg-slate-900/50 p-2 md:p-3 rounded-lg border border-blue-500/30">
              <div className="text-[8px] md:text-[10px] opacity-40 uppercase font-bold mb-1 md:mb-2 text-center">Дальность</div>
              <div className="flex justify-center">
                <StaticDiceDisplay
                  rollStr={isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range}
                  size="sm"
                  color="blue"
                  showLabel
                />
              </div>
            </div>
            <div className="bg-slate-900/50 p-2 md:p-3 rounded-lg border border-orange-500/30">
              <div className="text-[8px] md:text-[10px] opacity-40 uppercase font-bold mb-1 md:mb-2 text-center">Мощность</div>
              <div className="flex justify-center">
                <StaticDiceDisplay rollStr={unitStats.power} size="sm" color="orange" showLabel />
              </div>
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
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
        <div className="text-[10px] opacity-50 uppercase font-bold mb-3 tracking-wider text-center">
          Ближний бой
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-blue-500/30">
            <div className="text-[8px] opacity-40 uppercase font-bold mb-2 text-center">Вы</div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg font-black text-blue-400">ББ: +{unitStats.melee}</div>
              <StaticDiceDisplay rollStr="1D6" size="sm" color="blue" />
            </div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-red-500/30">
            <div className="text-[8px] opacity-40 uppercase font-bold mb-2 text-center">Цель</div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-lg font-black text-red-400">ББ: {effectiveTargetMelee}</div>
              <StaticDiceDisplay rollStr="1D6" size="sm" color="red" />
            </div>
          </div>
        </div>
        <div className="mt-3 text-center text-xs opacity-60">
          Ваш итог: D6 + {unitStats.melee} vs Цель: D6 + {effectiveTargetMelee}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Unit Stats Preview */}
      {(actionType === 'shot' || actionType === 'grenade') && renderShotGrenadeStats()}
      {actionType === 'melee' && renderMeleeStats()}

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="text-xs opacity-50 uppercase font-bold mb-4 tracking-wider">Параметры атаки</div>

        <div className="grid grid-cols-1 gap-4">
          {/* Distance Input with Converter */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <DistanceConverter
              steps={effectiveDistance}
              onChange={(steps) => {
                onChange({ distance: steps });
                onMemoryUpdate?.({ distance: steps });
              }}
              rulesVersion={rulesVersion}
            />
          )}

          {/* Target Armor Input */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
              <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
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
                size="lg"
                className="flex-1 justify-start"
              />
            </div>
          )}

          {/* Target Melee Input (for melee attacks) */}
          {actionType === 'melee' && (
            <div className="grid grid-cols-[100px_1fr] gap-3 items-center">
              <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap">
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
                size="lg"
                className="flex-1 justify-start"
              />
            </div>
          )}

          {/* Fortification Selector */}
          {(actionType === 'shot' || actionType === 'grenade') && (
            <div className="grid grid-cols-[100px_1fr] gap-3 items-start">
              <label className="text-xs opacity-50 uppercase font-bold whitespace-nowrap pt-2">
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
        <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-900/10 border border-orange-700/30 rounded">
          <Shield size={12} className="text-orange-400 shrink-0" />
          <span className="text-[10px] text-orange-400">
            Укрытие: +{parameters.fortification === 'light' ? '1' : '2'} к {rulesVersion === 'community_star_system' ? 'дистанции' : 'броне'}
          </span>
        </div>
      )}
    </div>
  );
}
