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
