'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCombatFlow } from './useCombatFlow';
import type { CombatantData } from '@/lib/combatant-data';
import { combatantToUnitLike } from '@/lib/combatant-data';
import type { RulesVersionID } from '@/lib/types';
import type { ModifierSummary } from '@/lib/modifier-types';
import { EMPTY_MODIFIER_SUMMARY } from '@/lib/modifier-types';
import type { CombatActionType, CombatParameters } from '@/lib/combat-types';

const DEFAULT_COMBATANT: CombatantData = {
  type: 'squad',
  melee: 0,
  armor: 0,
  rank: 0,
  grenadesAvailable: true,
};

export function useStandaloneCombatFlow() {
  const combatFlow = useCombatFlow();
  const [combatantData, setCombatantData] = useState<CombatantData>(DEFAULT_COMBATANT);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>('tehnolog');
  const [modifierSummary, setModifierSummary] = useState<ModifierSummary>({
    ...EMPTY_MODIFIER_SUMMARY,
  });

  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_calculator_rules');
    if (saved === 'community_star_system' || saved === 'tehnolog') {
      setRulesVersion(saved);
    }
  }, []);

  const updateRulesVersion = useCallback((version: RulesVersionID) => {
    setRulesVersion(version);
    localStorage.setItem('bronepehota_calculator_rules', version);
  }, []);

  const startStandaloneCombat = useCallback((actionType?: CombatActionType) => {
    const unitLike = combatantToUnitLike(combatantData);
    combatFlow.startCombat(unitLike, 0, undefined, actionType, combatantData);
  }, [combatantData, combatFlow]);

  const setParameters = useCallback((params: Partial<CombatParameters>) => {
    if (!params.activeModifiers) {
      combatFlow.setParameters({ ...params, activeModifiers: modifierSummary });
    } else {
      combatFlow.setParameters(params);
    }
  }, [combatFlow, modifierSummary]);

  const updateCombatantField = useCallback(<K extends keyof CombatantData>(field: K, value: CombatantData[K]) => {
    setCombatantData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    combatState: combatFlow.state,
    selectAction: combatFlow.selectAction,
    setParameters,
    executeAction: combatFlow.executeAction,
    applyResult: combatFlow.applyResult,
    closeCombat: combatFlow.closeCombat,
    goBack: combatFlow.goBack,
    checkGrenadeTarget: combatFlow.checkGrenadeTarget,
    isOpen: combatFlow.isOpen,
    combatantData,
    updateCombatantField,
    setCombatantData,
    rulesVersion,
    updateRulesVersion,
    modifierSummary,
    setModifierSummary,
    startStandaloneCombat,
  };
}