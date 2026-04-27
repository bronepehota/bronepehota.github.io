import type { RulesVersionID, HitResult, DamageResult, MeleeResult, FortificationType } from './types';
import { rollDie, multiplyRange, addBonusToRoll } from './game-logic';
import { rulesRegistry } from './rules-registry';

export interface CalculatorModifier {
  range_bonus?: number;
  power_bonus?: number;
  armor_bonus?: number;
  melee_bonus?: number;
  range_multiply?: number;
  distance_penalty?: number;
}

export interface ShotResult {
  hitResult: HitResult;
  damageResult: DamageResult;
}

export interface GrenadeDistanceResult {
  distanceRoll: number;
  totalDistance: number;
  blastZone: { minSteps: number; maxSteps: number; minCm: number; maxCm: number };
  allRolls: number[];
}

export interface GrenadePenetrationResult {
  roll: number;
  hit: boolean;
  armor: number;
}

function aggregateModifiers(modifiers: CalculatorModifier[] | undefined): {
  totalRangeBonus: number;
  totalRangeMultiplier: number;
  totalPowerBonus: number;
  totalMeleeBonus: number;
  totalArmorBonus: number;
  totalDistancePenalty: number;
} {
  if (!modifiers || modifiers.length === 0) {
    return { totalRangeBonus: 0, totalRangeMultiplier: 1, totalPowerBonus: 0, totalMeleeBonus: 0, totalArmorBonus: 0, totalDistancePenalty: 0 };
  }
  return {
    totalRangeBonus: modifiers.reduce((sum, m) => sum + (m.range_bonus || 0), 0),
    totalRangeMultiplier: modifiers.reduce((product, m) => product * (m.range_multiply || 1), 1),
    totalPowerBonus: modifiers.reduce((sum, m) => sum + (m.power_bonus || 0), 0),
    totalMeleeBonus: modifiers.reduce((sum, m) => sum + (m.melee_bonus || 0), 0),
    totalArmorBonus: modifiers.reduce((sum, m) => sum + (m.armor_bonus || 0), 0),
    totalDistancePenalty: modifiers.reduce((sum, m) => sum + (m.distance_penalty || 0), 0),
  };
}

export function calculateShotResult(params: {
  range: string;
  rangeBonus: number;
  rangeMultiplier?: number;
  power: string;
  powerBonus: number;
  distanceSteps: number;
  targetArmor: number;
  rulesVersion: RulesVersionID;
  fortification?: FortificationType;
  activeModifiers?: CalculatorModifier[];
}): ShotResult {
  const rules = rulesRegistry[params.rulesVersion];
  const fortification = params.fortification || 'none';
  const {
    totalRangeBonus,
    totalRangeMultiplier,
    totalPowerBonus,
    totalDistancePenalty,
  } = aggregateModifiers(params.activeModifiers);

  let range = addBonusToRoll(params.range, params.rangeBonus + totalRangeBonus);
  const effectiveMultiplier = (params.rangeMultiplier || 1) * totalRangeMultiplier;
  if (effectiveMultiplier !== 1) {
    range = multiplyRange(range, effectiveMultiplier);
  }

  const power = addBonusToRoll(params.power, params.powerBonus + totalPowerBonus);
  const effectiveDistance = params.distanceSteps + totalDistancePenalty;

  const hitResult = rules.calculateHit(range, effectiveDistance, fortification);

  let damageResult: DamageResult = { damage: 0, rolls: [] };
  if (hitResult.success) {
    damageResult = rules.calculateDamage(
      power,
      params.targetArmor,
      fortification,
      undefined,
      false,
    );
  }

  return { hitResult, damageResult };
}

export function calculateMeleeResult(params: {
  attackerMelee: number;
  defenderMelee: number;
  meleeBonus: number;
  rulesVersion: RulesVersionID;
  activeModifiers?: CalculatorModifier[];
}): MeleeResult {
  const rules = rulesRegistry[params.rulesVersion];
  const { totalMeleeBonus } = aggregateModifiers(params.activeModifiers);
  const effectiveMelee = params.attackerMelee + params.meleeBonus + totalMeleeBonus;
  return rules.calculateMelee(effectiveMelee, params.defenderMelee);
}

export function calculateGrenadeResult(params: {
  soldierRank: number;
  rulesVersion: RulesVersionID;
}): GrenadeDistanceResult {
  let distanceRoll: number;
  const allRolls: number[] = [];
  let totalDistance: number;

  if (params.rulesVersion === 'community_star_system' && params.soldierRank > 0) {
    for (let i = 0; i < params.soldierRank; i++) {
      allRolls.push(rollDie(6));
    }
    distanceRoll = Math.max(...allRolls);
    totalDistance = distanceRoll;
  } else {
    distanceRoll = rollDie(6);
    totalDistance = distanceRoll;
    allRolls.push(distanceRoll);
  }

  const minSteps = Math.max(1, totalDistance - 1);
  const maxSteps = totalDistance + 1;
  const minCm = minSteps * 4;
  const maxCm = maxSteps * 4;

  return {
    distanceRoll,
    totalDistance,
    blastZone: { minSteps, maxSteps, minCm, maxCm },
    allRolls,
  };
}

export function checkGrenadePenetration(params: {
  targetArmor: number;
  rulesVersion: RulesVersionID;
}): GrenadePenetrationResult {
  const roll = rollDie(20);
  return {
    roll,
    hit: roll > params.targetArmor,
    armor: params.targetArmor,
  };
}
