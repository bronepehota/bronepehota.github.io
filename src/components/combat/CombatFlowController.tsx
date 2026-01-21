'use client';

import { CombatResult, CombatLogEntry } from '@/lib/combat-types';
import { useCombatFlow, UseCombatFlowReturn } from '@/hooks/useCombatFlow';

/**
 * CombatFlowController provides the state machine logic for combat.
 * It wraps useCombatFlow and adds combat log management.
 */

export interface CombatFlowContextValue extends UseCombatFlowReturn {
  combatLog: CombatLogEntry[];
  addToCombatLog: (result: CombatResult, applied: boolean) => void;
  clearCombatLog: () => void;
}

export function useCombatFlowController() {
  const combatFlow = useCombatFlow();
  const [combatLog, setCombatLog] = React.useState<CombatLogEntry[]>([]);

  const addToCombatLog = (result: CombatResult, applied: boolean = false) => {
    const entry: CombatLogEntry = {
      id: `${result.unitId}-${result.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: result.timestamp,
      result,
      applied,
    };
    setCombatLog(prev => [entry, ...prev]);
  };

  const clearCombatLog = () => {
    setCombatLog([]);
  };

  return {
    ...combatFlow,
    combatLog,
    addToCombatLog,
    clearCombatLog,
  };
}

// Need to import React for useState
import React from 'react';
