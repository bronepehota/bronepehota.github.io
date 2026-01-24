export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Roll twice and return the better result (Surprise Attack - Fan rules)
 * @param sides - Number of sides on the die (6, 12, 20)
 * @returns Object with both rolls and the better roll
 */
export const rollWithAdvantage = (sides: number): { roll1: number; roll2: number; best: number } => {
  const roll1 = rollDie(sides);
  const roll2 = rollDie(sides);
  return {
    roll1,
    roll2,
    best: Math.max(roll1, roll2)
  };
};

export const parseRoll = (rollStr: string): { dice: number, sides: number, bonus: number } => {
  // Matches formats like "D6", "D6+2", "2D12", "D12+1", etc.
  const regex = /(?:(\d+))?D(\d+)(?:\+(\d+))?/;
  const match = rollStr.match(regex);
  if (!match) return { dice: 1, sides: 6, bonus: 0 };

  return {
    dice: parseInt(match[1] || '1'),
    sides: parseInt(match[2]),
    bonus: parseInt(match[3] || '0')
  };
};

export const executeRoll = (rollStr: string): { total: number, rolls: number[] } => {
  if (rollStr === 'ББ') return { total: 0, rolls: [] }; // Special case for melee range
  
  const { dice, sides, bonus } = parseRoll(rollStr);
  const rolls = [];
  let total = 0;
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides);
    rolls.push(r);
    total += r;
  }
  return { total: total + bonus, rolls };
};

export const calculateHit = (rangeStr: string, distanceSteps: number): { success: boolean, roll: number, total: number } => {
  const { total, rolls } = executeRoll(rangeStr);
  return {
    success: total >= distanceSteps,
    roll: rolls[0], // Assuming single die for range most of the time
    total
  };
};

export const calculateDamage = (powerStr: string, targetArmor: number): { damage: number, rolls: number[] } => {
  const { dice, sides, bonus } = parseRoll(powerStr);
  let damage = 0;
  const rolls = [];
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides) + bonus;
    rolls.push(r);
    if (r > targetArmor) {
      damage += 1;
    }
  }
  return { damage, rolls };
};

export const calculateMelee = (attackerMelee: number, defenderMelee: number): {
  attackerRoll: number,
  attackerTotal: number,
  defenderRoll: number,
  defenderTotal: number,
  winner: 'attacker' | 'defender' | 'draw'
} => {
  const aRoll = rollDie(6);
  const dRoll = rollDie(6);
  const aTotal = aRoll + attackerMelee;
  const dTotal = dRoll + defenderMelee;

  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  if (aTotal > dTotal) winner = 'attacker';
  else if (dTotal > aTotal) winner = 'defender';

  return {
    attackerRoll: aRoll,
    attackerTotal: aTotal,
    defenderRoll: dRoll,
    defenderTotal: dTotal,
    winner
  };
};

/**
 * Calculate damage with surprise attack (Fan rules: roll twice, take best)
 * @param powerStr - Dice notation for damage (e.g., "2D6", "D12")
 * @param targetArmor - Target's armor value
 * @returns DamageResult with both roll sets and best result
 */
export function calculateDamageWithSurpriseAttack(powerStr: string, targetArmor: number): {
  rolls1: number[];
  rolls2: number[];
  bestRolls: number[];
  damage: number;
} {
  const { dice, sides, bonus } = parseRoll(powerStr);
  const rolls1: number[] = [];
  const rolls2: number[] = [];

  // First set of damage rolls
  let damage1 = 0;
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides) + bonus;
    rolls1.push(r);
    if (r > targetArmor) damage1 += 1;
  }

  // Second set of damage rolls
  let damage2 = 0;
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides) + bonus;
    rolls2.push(r);
    if (r > targetArmor) damage2 += 1;
  }

  // Take the better result (more damage is better)
  const bestResult = damage1 >= damage2 ? { rolls: rolls1, damage: damage1 } : { rolls: rolls2, damage: damage2 };

  return {
    rolls1,
    rolls2,
    bestRolls: bestResult.rolls,
    damage: bestResult.damage
  };
}

/**
 * Calculate melee with surprise attack (Fan rules: attacker rolls twice, takes best)
 * @param attackerMelee - Attacker's melee stat
 * @param defenderMelee - Defender's melee stat (use 0 for machine in surprise attack)
 * @returns MeleeResult with both attacker rolls and best result
 */
export function calculateMeleeWithSurpriseAttack(attackerMelee: number, defenderMelee: number): {
  attackerRoll1: number;
  attackerRoll2: number;
  attackerRoll: number;
  attackerTotal: number;
  defenderRoll: number;
  defenderTotal: number;
  winner: 'attacker' | 'defender' | 'draw';
} {
  const { roll1: aRoll1, roll2: aRoll2, best: aRoll } = rollWithAdvantage(6);
  const dRoll = rollDie(6);
  const aTotal = aRoll + attackerMelee;
  const dTotal = dRoll + defenderMelee;

  let winner: 'attacker' | 'defender' | 'draw' = 'draw';
  if (aTotal > dTotal) winner = 'attacker';
  else if (dTotal > aTotal) winner = 'defender';

  return {
    attackerRoll1: aRoll1,
    attackerRoll2: aRoll2,
    attackerRoll: aRoll,
    attackerTotal: aTotal,
    defenderRoll: dRoll,
    defenderTotal: dTotal,
    winner
  };
}

/**
 * Combat flow validation utilities
 */

export interface CombatValidation {
  isValid: boolean;
  errors: string[];
}

export function validateCombatParameters(
  actionType: 'shot' | 'melee' | 'grenade',
  distance: number,
  targetArmor: number,
  targetMelee: number,
  ammo?: number,
  grenadesAvailable?: boolean
): CombatValidation {
  const errors: string[] = [];

  if (actionType === 'shot' || actionType === 'grenade') {
    if (distance < 1 || distance > 20) {
      errors.push('Дистанция должна быть от 1 до 20');
    }
    if (targetArmor < 0 || targetArmor > 10) {
      errors.push('Броня должна быть от 0 до 10');
    }
    if (actionType === 'grenade' && !grenadesAvailable) {
      errors.push('Гранаты уже израсходованы');
    }
  }

  if (actionType === 'melee') {
    if (targetMelee < 0 || targetMelee > 10) {
      errors.push('Ближний бой цели должен быть от 0 до 10');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format combat result for display
 */
export function formatCombatResult(
  actionType: 'shot' | 'melee' | 'grenade',
  hitResult?: { success: boolean; roll: number; total: number },
  damageResult?: { damage: number; rolls: number[] },
  meleeResult?: { attackerRoll: number; attackerTotal: number; defenderRoll: number; defenderTotal: number; winner: 'attacker' | 'defender' | 'draw' }
): string {
  if (actionType === 'melee' && meleeResult) {
    if (meleeResult.winner === 'attacker') return 'Победа в ближнем бою';
    if (meleeResult.winner === 'defender') return 'Контратака';
    return 'Ничья в ближнем бою';
  }

  if (hitResult) {
    if (!hitResult.success) return 'Промах';
    if (damageResult) {
      if (damageResult.damage === 0) return 'Попадание, но не пробито';
      return `Попадание: ${damageResult.damage} ранений`;
    }
  }

  return 'Завершено';
}

/**
 * Calculate dice type from roll string
 */
export function getDiceType(rollStr: string): 6 | 12 | 20 {
  if (rollStr.includes('D20')) return 20;
  if (rollStr.includes('D12')) return 12;
  return 6;
}

/**
 * Format dice notation for display
 * Returns the roll string as-is, or could be extended for localized display
 */
export function formatDiceNotation(rollStr: string): string {
  return rollStr;
}

/**
 * Get unit stats for combat display
 * Returns range, power, and melee values based on unit type and soldier index
 */
export interface UnitStats {
  range: string;
  power: string;
  melee: number;
  displayName: string;
}

export function getUnitStats(unit: any, soldierIndex?: number | null, weaponIndex?: number): UnitStats | null {
  if (!unit || !unit.data) return null;

  const isSquad = unit.type === 'squad';

  if (isSquad && soldierIndex !== null && soldierIndex !== undefined) {
    const soldiers = unit.data.soldiers;
    if (!soldiers || !soldiers[soldierIndex]) return null;
    const soldier = soldiers[soldierIndex];
    if (!soldier) return null;

    return {
      range: soldier.range || 'D6',
      power: soldier.power || '1D6',
      melee: soldier.melee || 0,
      displayName: soldier.rank || 'Боец',
    };
  }

  if (!isSquad && weaponIndex !== undefined) {
    const weapon = unit.data.weapons?.[weaponIndex];
    if (!weapon) return null;

    return {
      range: weapon.range || 'D6',
      power: weapon.power || '1D6',
      melee: 0, // Machines typically don't have melee stats
      displayName: weapon.name || 'Оружие',
    };
  }

  return null;
}