import { ArmyUnit, PanicState, PanicTestResult, RulesVersionID } from './types';

/**
 * Check if panic test should be triggered for a unit
 * @param unit - The army unit to check
 * @param rulesVersion - Current rules version
 * @param currentTurn - Current turn number (optional)
 * @returns true if panic test should be triggered
 */
export function checkPanicTrigger(
  unit: ArmyUnit,
  rulesVersion: RulesVersionID,
  currentTurn?: number
): boolean {
  // Only fan rules have automatic panic trigger
  if (rulesVersion !== 'fan') {
    return false;
  }

  // Only squads can panic
  if (unit.type !== 'squad') {
    return false;
  }

  const squad = unit.data;
  const totalSoldiers = squad.soldiers.length;
  const deadCount = unit.deadSoldiers?.length || 0;

  // Check if all soldiers are dead
  if (deadCount >= totalSoldiers) {
    return false;
  }

  // Check if 50% losses reached
  const halfThreshold = Math.floor(totalSoldiers / 2);
  if (deadCount < halfThreshold) {
    return false;
  }

  // Check if panic already triggered this turn
  if (currentTurn !== undefined && unit.panicState) {
    const triggeredThisTurn = unit.panicState.some(
      p => p.triggeredAtTurn === currentTurn
    );
    if (triggeredThisTurn) {
      return false;
    }
  }

  return true;
}

/**
 * Execute panic test for a specific soldier
 * @param unit - The army unit
 * @param soldierIndex - Index of the soldier to test
 * @param rulesVersion - Current rules version
 * @returns PanicTestResult with roll and panic status
 */
export function executePanicTest(
  unit: ArmyUnit,
  soldierIndex: number,
  rulesVersion: RulesVersionID
): PanicTestResult {
  // For now, only fan rules implement panic logic
  if (rulesVersion !== 'fan') {
    const soldier = (unit.data as any).soldiers?.[soldierIndex];
    return {
      soldierIndex,
      isPanic: false,
      roll: 0,
      rank: soldier?.rank || 0,
    };
  }

  const soldier = (unit.data as any).soldiers?.[soldierIndex];
  if (!soldier) {
    return {
      soldierIndex,
      isPanic: false,
      roll: 0,
      rank: 0,
    };
  }

  // Roll D6
  const roll = Math.floor(Math.random() * 6) + 1;
  const rank = soldier.rank || 0;

  // Panic if roll > rank (fan rules)
  const isPanic = roll > rank;

  return {
    soldierIndex,
    isPanic,
    roll,
    rank,
  };
}

/**
 * Resolve panic state at the start of a new turn
 * @param unit - The army unit to resolve panic for
 * @param currentTurn - Current turn number
 * @returns Updated unit with panic resolved
 */
export function resolvePanic(unit: ArmyUnit, currentTurn: number): ArmyUnit {
  if (!unit.panicState || unit.panicState.length === 0) {
    return unit;
  }

  // Check if any panic was triggered in current turn
  const hasCurrentTurnPanic = unit.panicState.some(
    p => p.triggeredAtTurn === currentTurn
  );

  if (!hasCurrentTurnPanic) {
    // Clear all panic states
    const { panicState, ...rest } = unit;
    return rest;
  }

  return unit;
}
