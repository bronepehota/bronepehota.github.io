'use client';

import { useReducer, useCallback, useEffect, useState } from 'react';
import {
  CombatFlowState,
  CombatFlowAction,
  CombatActionType,
  CombatParameters,
  DiceDisplay,
  CombatResult,
  CombatConfig,
  GrenadeBlastResult,
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
    isSurpriseAttack: false,
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
        // Preserve grenade data if present
        grenadeData: action.grenadeData || state.grenadeData,
      };

    case 'APPLY_RESULT':
      return {
        ...state,
        phase: 'APPLY',
      };

    case 'CLOSE_COMBAT':
    case 'CANCEL':
      return initialCombatFlowState;

    // Grenade-specific actions
    case 'GRENADE_CHECK_TARGET':
      if (!state.grenadeData) return state;

      const d20Roll = rollDie(20);
      const hit = d20Roll > action.armor;

      const newCheck: GrenadeBlastResult = {
        armor: action.armor,
        roll: d20Roll,
        hit,
      };

      return {
        ...state,
        grenadeData: {
          ...state.grenadeData,
          blastChecks: [...(state.grenadeData.blastChecks || []), newCheck],
        },
      };

    case 'GRENADE_SET_ARMOR':
      if (!state.grenadeData) return state;
      return {
        ...state,
        grenadeData: {
          ...state.grenadeData,
        },
      };

    default:
      return state;
  }
}

/**
 * Hook for managing combat flow state machine
 */
export function useCombatFlow(_config?: Partial<CombatConfig>) {
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
    await animateDiceRoll((_display) => {});

    // Calculate hit (surprise attack doesn't affect hit roll)
    const hitResult = rules.calculateHit(
      range,
      state.parameters.distance,
      state.parameters.fortification
    );

    let damageResult: any = { damage: 0, rolls: [] };
    const finalDisplay: DiceDisplay = { hit: hitResult.roll };

    if (hitResult.success) {
      // Determine dice type from power string
      const diceMatch = power.match(/(\d*)D(\d+)/);
      const _sides = diceMatch?.[2] === '12' ? 12 : diceMatch?.[2] === '20' ? 20 : 6;
      const diceCount = parseInt(diceMatch?.[1] || '1');

      // Animate damage rolls
      await animateDiceRoll((display) => {
        finalDisplay.power = display.power?.slice(0, diceCount);
      });

      // For surprise attack, roll damage twice and take best result
      if (state.parameters.isSurpriseAttack) {
        const damage1 = rules.calculateDamage(
          power,
          state.parameters.targetArmor,
          state.parameters.fortification,
          undefined,
          state.unitType === 'machine'
        );
        const damage2 = rules.calculateDamage(
          power,
          state.parameters.targetArmor,
          state.parameters.fortification,
          undefined,
          state.unitType === 'machine'
        );

        // Take the better damage result (more damage is better)
        damageResult = damage1.damage >= damage2.damage ? damage1 : damage2;
        damageResult.isSurpriseAttack = true;
        damageResult.bothRolls = [damage1.rolls, damage2.rolls];
      } else {
        damageResult = rules.calculateDamage(
          power,
          state.parameters.targetArmor,
          state.parameters.fortification,
          undefined,
          state.unitType === 'machine'
        );
      }

      finalDisplay.power = damageResult.rolls;

      // Armor Test and Pilot Survival Test for machines with pilots
      if (state.unitType === 'machine' && damageResult.damage > 0) {
        const machine = state.unit;
        if (machine.pilotInfo && machine.pilotInfo.alive) {
          // Machine armor = current durability (where marker is on damage scale)
          const currentDurability = machine.currentDurability || (machine.data as any).durability_max;
          const machineArmor = currentDurability;

          // ARMOR TEST (Тест брони)
          const armorTestRoll = rollDie(12);

          // Animate armor test roll
          await animateDiceRoll(() => {});

          // Armor test: roll > machine armor means armor is penetrated
          if (armorTestRoll > machineArmor) {
            // Armor failed - run PILOT SURVIVAL TEST
            const survivalTestRoll = rollDie(6);
            const pilotArmor = machine.pilotInfo.pilotArmor;

            // Critical hit: roll of 6 always kills pilot
            // Otherwise, pilot dies if roll > pilot armor
            const pilotDied = survivalTestRoll === 6 || survivalTestRoll > pilotArmor;

            damageResult.pilotDied = pilotDied;
            damageResult.armorTestRoll = armorTestRoll;
            damageResult.survivalTestRoll = survivalTestRoll;
          } else {
            // Armor held - pilot survives
            damageResult.armorTestRoll = armorTestRoll;
          }
        }
      }
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
      pilotDied: damageResult.pilotDied,
      armorTestRoll: damageResult.armorTestRoll,
      survivalTestRoll: damageResult.survivalTestRoll,
    };

    dispatch({ type: 'ROLL_COMPLETE', result, diceDisplay: finalDisplay });
    return result;
  }, [state, rulesVersion, animateDiceRoll]);

  /**
   * Execute grenade attack - roll distance (D6 + soldier rank)
   * Phase 1: Determine explosion location
   */
  const executeGrenade = useCallback(async (): Promise<CombatResult> => {
    if (!state.unit || state.actionType !== 'grenade') {
      throw new Error('Cannot execute grenade: invalid state');
    }

    dispatch({ type: 'EXECUTE_ROLL' });

    // Get soldier rank for grenade throw bonus
    let soldierRank = 0;
    if (state.unitType === 'squad' && state.soldierIndex !== null) {
      const soldiers = (state.unit.data as any).soldiers;
      if (soldiers && soldiers[state.soldierIndex]) {
        soldierRank = soldiers[state.soldierIndex].rank || 0;
      }
    }

    // Animate distance roll (D6)
    await animateDiceRoll(() => {});

    const distanceRoll = rollDie(6);
    const totalDistance = distanceRoll + soldierRank;

    // Calculate blast zone (±1 step)
    const minSteps = Math.max(1, totalDistance - 1);
    const maxSteps = totalDistance + 1;
    const minCm = minSteps * 4;
    const maxCm = maxSteps * 4;

    const blastZone = { minSteps, maxSteps, minCm, maxCm };

    // Store grenade data in state for phase 2
    dispatch({
      type: 'UPDATE_DICE',
      diceDisplay: { hit: distanceRoll }
    } as any);

    // Create result for phase 1 (distance roll)
    const result: CombatResult = {
      actionType: 'grenade',
      unitType: state.unitType,
      parameters: { ...state.parameters },
      hitResult: {
        success: true,
        roll: distanceRoll,
        total: totalDistance,
        isGrenade: true
      },
      timestamp: Date.now(),
      unitName: state.unit.data.name,
      unitId: state.unit.instanceId,
      soldierIndex: state.soldierIndex ?? undefined,
      grenadeDistance: totalDistance,
      grenadeBlastZone: blastZone,
      soldierRank,
    };

    // Store grenade-specific data for target checks
    (dispatch as any)({
      type: 'ROLL_COMPLETE',
      result,
      diceDisplay: { hit: distanceRoll },
      grenadeData: {
        distanceRoll,
        soldierRank,
        totalDistance,
        blastZone,
        blastChecks: [],
      },
    });

    return result;
  }, [state, animateDiceRoll]);

  /**
   * Check a target in grenade blast zone (Phase 2)
   * Roll 1D20 vs target armor
   */
  const checkGrenadeTarget = useCallback(async (armor: number): Promise<void> => {
    if (!state.grenadeData) {
      throw new Error('Cannot check grenade target: no grenade data');
    }

    dispatch({ type: 'GRENADE_CHECK_TARGET', armor } as any);

    // Animate D20 roll
    await animateDiceRoll(() => {});

    const d20Roll = rollDie(20);
    const hit = d20Roll > armor;

    const blastCheck: GrenadeBlastResult = {
      armor,
      roll: d20Roll,
      hit,
    };

    // Update state with new check
    dispatch({
      type: 'UPDATE_DICE',
      diceDisplay: { hit: d20Roll }
    });

    // Update result with blast checks
    if (state.result) {
      const updatedResult: CombatResult = {
        ...state.result,
        grenadeBlastChecks: [...(state.result.grenadeBlastChecks || []), blastCheck],
      };
      dispatch({ type: 'ROLL_COMPLETE', result: updatedResult, diceDisplay: { hit: d20Roll } });
    }
  }, [state, animateDiceRoll]);

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

    // For surprise attack, attacker rolls twice and takes best (all rules versions)
    let meleeResult;
    if (state.parameters.isSurpriseAttack) {
      const roll1a = rollDie(6);
      const roll2a = rollDie(6);
      const attackerRoll = Math.max(roll1a, roll2a);
      const defenderRoll = rollDie(6);

      const aTotal = attackerRoll + attackerMelee;
      const dTotal = defenderRoll + state.parameters.targetMelee;

      let winner: 'attacker' | 'defender' | 'draw' = 'draw';
      if (aTotal > dTotal) winner = 'attacker';
      else if (dTotal > aTotal) winner = 'defender';

      meleeResult = {
        attackerRoll,
        attackerTotal: aTotal,
        defenderRoll,
        defenderTotal: dTotal,
        winner,
        isSurpriseAttack: true,
        attackerRolls: [roll1a, roll2a]
      };
    } else {
      meleeResult = rules.calculateMelee(attackerMelee, state.parameters.targetMelee);
    }

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
    checkGrenadeTarget, // Grenade-specific: check target in blast zone
    // Derived state
    isOpen: state.phase !== 'IDLE',
    currentPhase: state.phase,
    canGoBack: state.phase === 'PARAMETERS' || state.phase === 'RESULTS',
  };
}

export type UseCombatFlowReturn = ReturnType<typeof useCombatFlow>;
