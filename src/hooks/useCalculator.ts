'use client';

import { useState, useCallback } from 'react';
import type { RulesVersionID, FortificationType, MeleeResult } from '@/lib/types';
import type { CombatActionType } from '@/lib/combat-types';
import {
  calculateShotResult,
  calculateMeleeResult,
  calculateGrenadeResult,
  checkGrenadePenetration,
} from '@/lib/combat-calculator';
import type { ShotResult, GrenadeDistanceResult, GrenadePenetrationResult, CalculatorModifier } from '@/lib/combat-calculator';
import { getDefaultRulesVersion } from '@/lib/rules-registry';

export interface CalculatorParameters {
  range: string;
  rangeBonus: number;
  rangeMultiplier: number;
  power: string;
  powerBonus: number;
  distance: number;
  targetArmor: number;
  fortification: FortificationType;
  attackerMelee: number;
  defenderMelee: number;
  meleeBonus: number;
  soldierRank: number;
}

const DEFAULT_PARAMS: CalculatorParameters = {
  range: 'D6',
  rangeBonus: 0,
  rangeMultiplier: 1,
  power: '1D6',
  powerBonus: 0,
  distance: 5,
  targetArmor: 2,
  fortification: 'none',
  attackerMelee: 2,
  defenderMelee: 2,
  meleeBonus: 0,
  soldierRank: 0,
};

export type CalculatorResult =
  | { type: 'shot'; data: ShotResult }
  | { type: 'melee'; data: MeleeResult }
  | { type: 'grenade_distance'; data: GrenadeDistanceResult }
  | { type: 'grenade_penetration'; data: GrenadePenetrationResult };

export function useCalculator() {
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(getDefaultRulesVersion());
  const [actionType, setActionType] = useState<CombatActionType>('shot');
  const [parameters, setParameters] = useState<CalculatorParameters>(DEFAULT_PARAMS);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [selectedBuffs, setSelectedBuffs] = useState<Set<string>>(new Set());
  const [selectedDebuffs, setSelectedDebuffs] = useState<Set<string>>(new Set());

  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_rules_version');
      if (saved && (saved === 'tehnolog' || saved === 'community_star_system')) {
        setRulesVersion(saved);
      }
    }
  });

  const toggleBuff = useCallback((id: string) => {
    setSelectedBuffs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleDebuff = useCallback((id: string) => {
    setSelectedDebuffs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const getActiveModifiers = useCallback((): CalculatorModifier[] => {
    const mods: CalculatorModifier[] = [];
    return mods;
  }, []);

  const executeShot = useCallback((modifiers: CalculatorModifier[]) => {
    const data = calculateShotResult({
      range: parameters.range,
      rangeBonus: parameters.rangeBonus,
      rangeMultiplier: parameters.rangeMultiplier,
      power: parameters.power,
      powerBonus: parameters.powerBonus,
      distanceSteps: parameters.distance,
      targetArmor: parameters.targetArmor,
      rulesVersion,
      fortification: parameters.fortification,
      activeModifiers: modifiers.length > 0 ? modifiers : undefined,
    });
    setResult({ type: 'shot', data });
  }, [parameters, rulesVersion]);

  const executeMelee = useCallback((modifiers: CalculatorModifier[]) => {
    const data = calculateMeleeResult({
      attackerMelee: parameters.attackerMelee,
      defenderMelee: parameters.defenderMelee,
      meleeBonus: parameters.meleeBonus,
      rulesVersion,
      activeModifiers: modifiers.length > 0 ? modifiers : undefined,
    });
    setResult({ type: 'melee', data });
  }, [parameters, rulesVersion]);

  const executeGrenade = useCallback(() => {
    const data = calculateGrenadeResult({
      soldierRank: parameters.soldierRank,
      rulesVersion,
    });
    setResult({ type: 'grenade_distance', data });
  }, [parameters, rulesVersion]);

  const checkGrenadeTarget = useCallback((targetArmor: number) => {
    const data = checkGrenadePenetration({
      targetArmor,
      rulesVersion,
    });
    setResult(prev => {
      if (prev?.type === 'grenade_distance') {
        return { type: 'grenade_penetration', data };
      }
      return { type: 'grenade_penetration', data };
    });
  }, [rulesVersion]);

  const executeAction = useCallback((modifiers: CalculatorModifier[]) => {
    switch (actionType) {
      case 'shot':
        executeShot(modifiers);
        break;
      case 'melee':
        executeMelee(modifiers);
        break;
      case 'grenade':
        executeGrenade();
        break;
    }
  }, [actionType, executeShot, executeMelee, executeGrenade]);

  const handleActionTypeChange = useCallback((newAction: CombatActionType) => {
    setActionType(newAction);
    setResult(null);
  }, []);

  const updateParameters = useCallback((updates: Partial<CalculatorParameters>) => {
    setParameters(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    rulesVersion,
    setRulesVersion,
    actionType,
    handleActionTypeChange,
    parameters,
    updateParameters,
    result,
    executeAction,
    executeShot,
    executeMelee,
    executeGrenade,
    checkGrenadeTarget,
    selectedBuffs,
    selectedDebuffs,
    toggleBuff,
    toggleDebuff,
  };
}
