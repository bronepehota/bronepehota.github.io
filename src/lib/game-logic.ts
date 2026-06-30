export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Sentinel for unparseable dice notation ('ББ', '', 'xyz', '2D', 'D0', '0D6').
 * Returning dice:0 (instead of a silent D6 fallback) means:
 *  - combat yields NO effect (no damage / miss), and
 *  - DiceNotationDisplay renders the raw string via its `dice === 0` branch.
 * Previously 'D0' dealt constant damage (rollDie(0)===1) and '2D'/'' silently
 * became a D6 roll — both wrong with no error surfaced.
 */
const INVALID_ROLL = Object.freeze({ dice: 0, sides: 0, bonus: 0 });

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
  // Matches formats like "D6", "D6+2", "2D12", "D12+1", "2D6-1", etc. (negative bonuses supported)
  const regex = /(?:(\d+))?D(\d+)(?:([+-])(\d+))?/;
  const match = rollStr.match(regex);
  if (!match) return INVALID_ROLL; // 'ББ', '', 'xyz', '2D' (missing sides) — no silent D6 fallback

  const dice = parseInt(match[1] || '1');
  const sides = parseInt(match[2]);
  // Reject nonsensical dice: 'D0' (zero sides → rollDie(0)===1) and '0D6' (zero dice → -Infinity).
  if (dice < 1 || sides < 1) return INVALID_ROLL;

  const sign = match[3] === '-' ? -1 : 1;
  return { dice, sides, bonus: match[4] ? sign * parseInt(match[4]) : 0 };
};

/**
 * Multiply range string by a factor (e.g., D6 -> D12 for aimed shot)
 * Handles formats: D6, D12, D6+2, 2D6, 2D6-1 (negative bonuses supported)
 */
export const multiplyRange = (rangeStr: string, multiplier: number = 2): string => {
  const regex = /(?:(\d+))?D(\d+)(?:([+-])(\d+))?/;
  const match = rangeStr.match(regex);
  if (!match) return rangeStr; // Return as-is for ББ or invalid

  const diceCount = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]) * multiplier;
  const sign = match[3] === '-' ? -1 : 1;
  const bonus = match[4] ? sign * parseInt(match[4]) * multiplier : 0;

  const dicePart = diceCount === 1 ? `D${sides}` : `${diceCount}D${sides}`;
  const bonusPart = bonus > 0 ? `+${bonus}` : bonus < 0 ? `${bonus}` : '';

  return `${dicePart}${bonusPart}`;
};

/**
 * Add a flat bonus to a dice roll string.
 * e.g., addBonusToRoll('D6', 1) → 'D6+1'
 * e.g., addBonusToRoll('D6+2', 1) → 'D6+3'
 * e.g., addBonusToRoll('2D12', -1) → '2D12-1'
 */
export const addBonusToRoll = (rollStr: string, bonus: number): string => {
  if (rollStr === 'ББ') return rollStr;

  const regex = /(?:(\d+))?D(\d+)(?:([+-])(\d+))?/;
  const match = rollStr.match(regex);
  if (!match) return rollStr;

  const diceCount = match[1] ? parseInt(match[1]) : 1;
  const sides = parseInt(match[2]);
  const sign = match[3] === '-' ? -1 : 1;
  const existingBonus = match[4] ? sign * parseInt(match[4]) : 0;
  const newBonus = existingBonus + bonus;

  const dicePart = diceCount === 1 ? `D${sides}` : `${diceCount}D${sides}`;
  const bonusPart = newBonus > 0 ? `+${newBonus}` : newBonus < 0 ? `${newBonus}` : '';

  return `${dicePart}${bonusPart}`;
};

export const executeRoll = (rollStr: string): { total: number, rolls: number[], bonus: number } => {
  if (rollStr === 'ББ') return { total: 0, rolls: [], bonus: 0 }; // Special case for melee range

  const { dice, sides, bonus } = parseRoll(rollStr);
  const rolls = [];
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides);
    rolls.push(r);
  }
  // Take maximum roll, not sum. Guard empty rolls (dice:0 / invalid notation)
  // — Math.max() with no args returns -Infinity, which would leak into total.
  const maxRoll = rolls.length ? Math.max(...rolls) : 0;
  return { total: maxRoll + bonus, rolls, bonus };
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
  const rolls = [];
  let damage = 0;
  // Virtual fire: each die is an independent shot that can cause 1 damage
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides) + bonus;
    rolls.push(r);
    if (r > targetArmor) {
      damage += 1;
    }
  }
  return { damage, rolls };
};

export interface GrenadeBlastZone {
  minSteps: number;
  maxSteps: number;
  minCm: number;
  maxCm: number;
}

export interface GrenadeDistanceResult {
  distanceRoll: number;
  allRolls: number[];
  totalDistance: number;
  bonus: number;
  blastZone: GrenadeBlastZone;
}

/**
 * Grenade attack — phase 1: determine the blast location.
 *
 * Official Tehnolog rules (docs/tehnolog/official_rules.md §7.8):
 *   "игрок бросает кубик Д6, чтобы определить дальность" — a single D6, and the
 *   roll IS the distance in steps. No rank bonus.
 *
 * Community Star System rules (docs/star_system/fan_rules.md):
 *   roll D6 a number of times equal to the thrower's Army Rank, keep the best.
 *
 * Blast zone is ±1 step around the impact point (1 step = 4 cm). A roll of 1
 * means the blast reaches the thrower (self-danger warning, handled by the UI).
 *
 * @param rulesVersion 'tehnolog' | 'community_star_system'
 * @param soldierRank  thrower's Army Rank (number of D6 rolled under community rules)
 * @param rollD6       injectable D6 roller (defaults to rollDie(6)) — for deterministic tests
 */
export function rollGrenadeDistance(
  rulesVersion: string,
  soldierRank: number,
  rollD6: () => number = () => rollDie(6),
): GrenadeDistanceResult {
  const allRolls: number[] = [];

  if (rulesVersion === 'community_star_system' && soldierRank > 0) {
    for (let i = 0; i < soldierRank; i++) allRolls.push(rollD6());
  } else {
    // Tehnolog (official §7.8): a single D6, no rank bonus.
    allRolls.push(rollD6());
  }

  const distanceRoll = Math.max(...allRolls);
  const totalDistance = distanceRoll; // rank never adds to distance in either ruleset
  const minSteps = Math.max(1, totalDistance - 1);
  const maxSteps = totalDistance + 1;

  return {
    distanceRoll,
    allRolls,
    totalDistance,
    bonus: 0,
    blastZone: { minSteps, maxSteps, minCm: minSteps * 4, maxCm: maxSteps * 4 },
  };
}

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

  // First set of damage rolls - take max roll
  for (let i = 0; i < dice; i++) {
    rolls1.push(rollDie(sides) + bonus);
  }
  const maxRoll1 = Math.max(...rolls1);
  const damage1 = maxRoll1 > targetArmor ? 1 : 0;

  // Second set of damage rolls - take max roll
  for (let i = 0; i < dice; i++) {
    rolls2.push(rollDie(sides) + bonus);
  }
  const maxRoll2 = Math.max(...rolls2);
  const damage2 = maxRoll2 > targetArmor ? 1 : 0;

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