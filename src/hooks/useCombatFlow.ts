'use client';

import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  CombatFlowState,
  CombatFlowAction,
  CombatPhase,
  CombatActionType,
  CombatUnitType,
  CombatParameters,
  DiceDisplay,
  CombatResult,
  CombatConfig,
} from '@/lib/combat-types';
import { rollDie } from '@/lib/game-logic';
import { rulesRegistry } from '@/lib/rules-registry';
import { getDefaultRulesVersion } from '@/lib/rules-registry';

/**
 * Initial combat flow state
 */
const initialCombatFlowState: CombatFlowState = {
  phase: 'IDLE',
  actionType: null,
  unit: null,
  unitType: 'squad',
  soldierIndex: null,
  parameters: {
    distance: 5,
    targetArmor: 2,
    targetMelee: 2,
    fortification: 'none',
  },
  diceDisplay: {},
  result: null,
  isRolling: false,
};

/**
 * Combat flow reducer
 */
function combatFlowReducer(
  state: CombatFlowState,
  action: CombatFlowAction
): CombatFlowState {
  switch (action.type) {
    case 'START_COMBAT':
      return {
        ...initialCombatFlowState,
        phase: action.actionType ? 'PARAMETERS' : 'ACTION_SELECT',
        actionType: action.actionType || null,
        unit: action.unit,
        unitType: action.unit.type,
        soldierIndex: action.soldierIndex ?? null,
        parameters: {
          ...initialCombatFlowState.parameters,
          weaponIndex: action.weaponIndex,
        },
      };

    case 'SELECT_ACTION':
      return {
        ...state,
        phase: 'PARAMETERS',
        actionType: action.actionType,
      };

    case 'GO_BACK_TO_ACTION_SELECT':
      return {
        ...state,
        phase: 'ACTION_SELECT',
        actionType: null,
      };

    case 'GO_BACK_TO_PARAMETERS':
      return {
        ...state,
        phase: 'PARAMETERS',
      };

    case 'SET_PARAMETERS':
      return {
        ...state,
        parameters: {
          ...state.parameters,
          ...action.parameters,
        },
      };

    case 'EXECUTE_ROLL':
      return {
        ...state,
        phase: 'ROLLING',
        isRolling: true,
        diceDisplay: {},
      };

    case 'UPDATE_DICE':
      return {
        ...state,
        diceDisplay: action.diceDisplay || {},
      };

    case 'ROLL_COMPLETE':
      return {
        ...state,
        phase: 'RESULTS',
        isRolling: false,
        result: action.result,
        diceDisplay: action.diceDisplay || {},
      };

    case 'APPLY_RESULT':
      return {
        ...state,
        phase: 'APPLY',
      };

    case 'CLOSE_COMBAT':
    case 'CANCEL':
      return initialCombatFlowState;

    default:
      return state;
  }
}

/**
 * Hook for managing combat flow state machine
 */
export function useCombatFlow(config?: Partial<CombatConfig>) {
  const [state, dispatch] = useReducer(combatFlowReducer, initialCombatFlowState);
  const [rulesVersion, setRulesVersion] = useState(getDefaultRulesVersion());

  // Load rules version from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved) {
      setRulesVersion(saved as any);
    }
  }, []);

  /**
   * Start combat for a unit
   */
  const startCombat = useCallback((unit: any, soldierIndex?: number, weaponIndex?: number, actionType?: CombatActionType) => {
    dispatch({ type: 'START_COMBAT', unit, soldierIndex, weaponIndex, actionType });
  }, []);

  /**
   * Select combat action type
   */
  const selectAction = useCallback((actionType: CombatActionType) => {
    dispatch({ type: 'SELECT_ACTION', actionType });
  }, []);

  /**
   * Update combat parameters
   */
  const setParameters = useCallback((params: Partial<CombatParameters>) => {
    dispatch({ type: 'SET_PARAMETERS', parameters: params });
  }, []);

  /**
   * Animate dice rolling with gradual updates
   */
  const animateDiceRoll = useCallback(async (
    updateFn: (display: DiceDisplay) => void
  ): Promise<void> => {
    const iterations = 8;
    const delay = 60;

    for (let i = 0; i < iterations; i++) {
      const display: DiceDisplay = {
        hit: rollDie(12),
        power: [rollDie(6), rollDie(6)],
        meleeA: rollDie(6),
        meleeD: rollDie(6),
      };
      updateFn(display);
      dispatch({ type: 'UPDATE_DICE', diceDisplay: display });
      await new Promise(r => setTimeout(r, delay));
    }
  }, []);

  /**
   * Execute shot attack
   */
  const executeShot = useCallback(async (): Promise<CombatResult> => {
    if (!state.unit || state.actionType !== 'shot') {
      throw new Error('Cannot execute shot: invalid state');
    }

    dispatch({ type: 'EXECUTE_ROLL' });

    const rules = rulesRegistry[rulesVersion];
    const unit = state.unit;
    const soldierIndex = state.soldierIndex;

    // Get range/power based on unit type
    let range = '';
    let power = '';

    if (state.unitType === 'squad' && soldierIndex !== null) {
      const soldier = (unit.data as any).soldiers[soldierIndex];
      range = soldier.range;
      power = soldier.power;
    } else if (state.unitType === 'machine' && state.parameters.weaponIndex !== undefined) {
      const weapon = (unit.data as any).weapons[state.parameters.weaponIndex];
      range = weapon.range;
      power = weapon.power;
    }

    // Animate hit roll
    await animateDiceRoll((display) => {});

    const hitResult = rules.calculateHit(
      range,
      state.parameters.distance,
      state.parameters.fortification
    );

    let damageResult: any = { damage: 0, rolls: [] };
    let finalDisplay: DiceDisplay = { hit: hitResult.roll };

    if (hitResult.success) {
      // Determine dice type from power string
      const diceMatch = power.match(/(\d*)D(\d+)/);
      const sides = diceMatch?.[2] === '12' ? 12 : diceMatch?.[2] === '20' ? 20 : 6;
      const diceCount = parseInt(diceMatch?.[1] || '1');

      // Animate damage rolls
      await animateDiceRoll((display) => {
        finalDisplay.power = display.power?.slice(0, diceCount);
      });

      damageResult = rules.calculateDamage(
        power,
        state.parameters.targetArmor,
        state.parameters.fortification,
        undefined,
        state.unitType === 'machine'
      );

      finalDisplay.power = damageResult.rolls;
    }

    const result: CombatResult = {
      actionType: 'shot',
      unitType: state.unitType,
      parameters: { ...state.parameters },
      hitResult,
      damageResult,
      timestamp: Date.now(),
      unitName: unit.data.name,
      unitId: unit.instanceId,
      soldierIndex: soldierIndex ?? undefined,
    };

    dispatch({ type: 'ROLL_COMPLETE', result, diceDisplay: finalDisplay });
    return result;
  }, [state, rulesVersion, animateDiceRoll]);

  /**
   * Execute grenade attack
   */
  const executeGrenade = useCallback(async (): Promise<CombatResult> => {
    dispatch({ type: 'EXECUTE_ROLL' });

    const rules = rulesRegistry[rulesVersion];

    // Animate distance roll
    await animateDiceRoll(() => {});

    const distanceRoll = rollDie(6);

    // Animate power roll (1D20)
    await animateDiceRoll(() => {});

    const damageResult = rules.calculateDamage(
      '1D20',
      state.parameters.targetArmor,
      state.parameters.fortification,
      undefined,
      false
    );

    const result: CombatResult = {
      actionType: 'grenade',
      unitType: state.unitType,
      parameters: { ...state.parameters },
      hitResult: { success: true, roll: distanceRoll, total: distanceRoll, isGrenade: true },
      damageResult,
      timestamp: Date.now(),
      unitName: state.unit?.data?.name || '',
      unitId: state.unit?.instanceId || '',
      soldierIndex: state.soldierIndex ?? undefined,
    };

    dispatch({
      type: 'ROLL_COMPLETE',
      result,
      diceDisplay: { hit: distanceRoll, power: damageResult.rolls }
    });
    return result;
  }, [state, rulesVersion, animateDiceRoll]);

  /**
   * Execute melee attack
   */
  const executeMelee = useCallback(async (): Promise<CombatResult> => {
    if (!state.unit || state.actionType !== 'melee') {
      throw new Error('Cannot execute melee: invalid state');
    }

    dispatch({ type: 'EXECUTE_ROLL' });

    const rules = rulesRegistry[rulesVersion];

    // Get attacker melee stat
    let attackerMelee = 0;
    if (state.unitType === 'squad' && state.soldierIndex !== null) {
      attackerMelee = (state.unit.data as any).soldiers[state.soldierIndex].melee;
    }

    // Animate melee rolls
    await animateDiceRoll(() => {});

    const meleeResult = rules.calculateMelee(attackerMelee, state.parameters.targetMelee);

    const result: CombatResult = {
      actionType: 'melee',
      unitType: state.unitType,
      parameters: { ...state.parameters },
      meleeResult,
      timestamp: Date.now(),
      unitName: state.unit.data.name,
      unitId: state.unit.instanceId,
      soldierIndex: state.soldierIndex ?? undefined,
    };

    dispatch({
      type: 'ROLL_COMPLETE',
      result,
      diceDisplay: { meleeA: meleeResult.attackerRoll, meleeD: meleeResult.defenderRoll }
    });
    return result;
  }, [state, rulesVersion, animateDiceRoll]);

  /**
   * Execute the current action based on actionType
   */
  const executeAction = useCallback(async () => {
    switch (state.actionType) {
      case 'shot':
        return await executeShot();
      case 'grenade':
        return await executeGrenade();
      case 'melee':
        return await executeMelee();
      default:
        throw new Error(`Unknown action type: ${state.actionType}`);
    }
  }, [state.actionType, executeShot, executeGrenade, executeMelee]);

  /**
   * Apply result to unit
   */
  const applyResult = useCallback(() => {
    dispatch({ type: 'APPLY_RESULT' });
  }, []);

  /**
   * Close combat modal
   */
  const closeCombat = useCallback(() => {
    dispatch({ type: 'CLOSE_COMBAT' });
  }, []);

  /**
   * Cancel combat
   */
  const cancelCombat = useCallback(() => {
    dispatch({ type: 'CANCEL' });
  }, []);

  /**
   * Go back to previous phase
   */
  const goBack = useCallback(() => {
    switch (state.phase) {
      case 'PARAMETERS':
        dispatch({ type: 'GO_BACK_TO_ACTION_SELECT' });
        break;
      case 'RESULTS':
        dispatch({ type: 'GO_BACK_TO_PARAMETERS' });
        break;
      default:
        cancelCombat();
    }
  }, [state.phase, cancelCombat]);

  return {
    state,
    // Actions
    startCombat,
    selectAction,
    setParameters,
    executeAction,
    applyResult,
    closeCombat,
    cancelCombat,
    goBack,
    // Derived state
    isOpen: state.phase !== 'IDLE',
    currentPhase: state.phase,
    canGoBack: state.phase === 'PARAMETERS' || state.phase === 'RESULTS',
  };
}

export type UseCombatFlowReturn = ReturnType<typeof useCombatFlow>;
