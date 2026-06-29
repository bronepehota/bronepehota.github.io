import { ArmyUnit, PanicTestResult, RulesVersionID, isSquad, Squad } from './types';

/**
 * Check if panic test should be triggered for a unit
 * @param unit - The army unit to check
 * @param rulesVersion - Current rules version
 * @returns true if panic test should be triggered
 */
export function checkPanicTrigger(
  unit: ArmyUnit,
  rulesVersion: RulesVersionID
): boolean {
  // Check if panic is enabled in settings
  if (typeof window !== 'undefined') {
    const panicEnabled = localStorage.getItem('bronepehota_panic_enabled');
    if (panicEnabled === 'false') {
      return false; // Panic is disabled by user
    }
  }

  // Only squads can panic
  if (!isSquad(unit)) {
    return false;
  }

  const totalSoldiers = unit.data.soldiers.length;
  const deadCount = unit.deadSoldiers?.length || 0;

  // Check if all soldiers are dead
  if (deadCount >= totalSoldiers) {
    return false;
  }

  // Community rules: automatic panic trigger at 50% losses, once per game
  if (rulesVersion === 'community_star_system') {
    // Panic test is once per game per squad
    if (unit.panicTestUsed) {
      return false;
    }

    const halfThreshold = Math.floor(totalSoldiers / 2);
    if (deadCount < halfThreshold) {
      return false;
    }

    return true;
  }

  // Official (tehnolog) rules: panic is checked during survival test
  // No automatic trigger - panic is determined during combat
  return false;
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
  const soldier = (unit.data as Squad).soldiers?.[soldierIndex];
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
  const armor = soldier.armor || 0;

  // Different panic conditions for different rules
  let isPanic = false;

  if (rulesVersion === 'community_star_system') {
    // Community rules: D6 > rank = panic
    const rank = soldier.rank || 0;
    isPanic = roll > rank;
    return {
      soldierIndex,
      isPanic,
      roll,
      rank,
    };
  } else if (rulesVersion === 'tehnolog') {
    // Official rules: D6 == armor = panic (during survival test)
    isPanic = roll === armor;
    return {
      soldierIndex,
      isPanic,
      roll,
      rank: armor,
    };
  }

  // Default: no panic
  return {
    soldierIndex,
    isPanic: false,
    roll,
    rank: armor,
  };
}

/**
 * Check panic after survival test (for official rules)
 * @param armor - Soldier's armor value
 * @param roll - D6 roll value
 * @returns true if panic should occur
 */
export function checkPanicAfterSurvivalTest(armor: number, roll: number): boolean {
  // Official rules: panic when D6 equals armor (Бр)
  // Only applies if panic is enabled
  if (typeof window !== 'undefined') {
    const panicEnabled = localStorage.getItem('bronepehota_panic_enabled');
    if (panicEnabled === 'false') {
      return false;
    }
  }

  return roll === armor;
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
    const { panicState: _panicState, ...rest } = unit;
    return rest;
  }

  return unit;
}
