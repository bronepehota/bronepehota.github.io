'use client';

import { parseRoll } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { RulesVersionID } from '@/lib/types';
import { Target, Shield } from 'lucide-react';

/**
 * Calculate hit probability based on range dice and distance
 * Hit occurs when roll >= effectiveDistance
 *
 * Surprise attack (§8.3) does NOT affect the hit roll — the double-roll
 * belongs to power (see calculatePenetrationProbability).
 *
 * Example: D6 vs distance 3
 * - Possible rolls: 1, 2, 3, 4, 5, 6
 * - Successful rolls (>=3): 3, 4, 5, 6 (4 outcomes)
 * - Probability: 4/6 ≈ 67%
 */
export function calculateHitProbability(
  rangeStr: string,
  distanceSteps: number,
  fortification: 'none' | 'light' | 'heavy',
  rulesVersion: RulesVersionID
): { probability: number; favorableRolls: number; totalRolls: number } {
  const { sides, bonus } = parseRoll(rangeStr);
  // Invalid/unusable notation (e.g. 'ББ', malformed editor input) → sides:0.
  if (sides < 1) return { probability: 0, favorableRolls: 0, totalRolls: 0 };

  // Community Star System: fortification adds to distance
  const effectiveDistance = rulesVersion === 'community_star_system'
    ? distanceSteps + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : distanceSteps;

  const maxRoll = sides + bonus;

  // Single-roll hit probability. Surprise attack (§8.3) does NOT affect the hit roll —
  // the double-roll belongs to power (see calculatePenetrationProbability).
  const favorableRolls = Math.min(sides, Math.max(0, maxRoll - effectiveDistance + 1));
  const totalRolls = sides;
  const probability = totalRolls > 0 ? (favorableRolls / totalRolls) * 100 : 0;
  return { probability, favorableRolls, totalRolls };
}

/**
 * Calculate armor penetration probability
 * For virtual fire: each die is rolled, and if result > armor, it penetrates
 * Probability = count of favorable outcomes / total possible outcomes
 *
 * Tehnolog rules: fortification adds to armor
 * Community Star System: fortification adds to distance (handled in hit probability)
 *
 * Surprise attack (§8.3 «с тыла»): power is rolled twice, take best.
 * Best-of-2 per-die: P(best of 2 penetrates) = 1 − (1 − p)²
 *
 * Example: 1D6 vs armor 3
 * - Normal: 3/6 = 50%
 * - Surprise: 1 − (1−0.5)² = 75%
 */
export function calculatePenetrationProbability(
  powerStr: string,
  targetArmor: number,
  fortification: 'none' | 'light' | 'heavy' = 'none',
  rulesVersion: RulesVersionID = 'tehnolog',
  isSurpriseAttack: boolean = false
): { probability: number; penetratingDice: number; totalDice: number } {
  const { dice, sides, bonus } = parseRoll(powerStr);
  // Invalid notation → sides:0 would divide by zero below; report 0% instead.
  if (sides < 1) return { probability: 0, penetratingDice: 0, totalDice: 0 };

  // Tehnolog rules: fortification adds to armor
  const effectiveArmor = rulesVersion === 'tehnolog'
    ? targetArmor + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : targetArmor;

  // Single-roll per-die penetration chance: result > effectiveArmor.
  const favorableOutcomes = Math.min(sides, Math.max(0, sides + bonus - effectiveArmor));
  const pPerDie = favorableOutcomes / sides;

  // Surprise attack (§8.3 «с тыла»): power is rolled twice, take best.
  // Best-of-2 on the per-die metric: P(best of 2 penetrates) = 1 − (1 − p)².
  // Exact for single-die power; slight over-estimate for multi-dice vs the true
  // "best pool" (acceptable for a preview).
  const pBest = isSurpriseAttack ? 1 - Math.pow(1 - pPerDie, 2) : pPerDie;

  const probability = pBest * 100;
  const expectedPenetratingDice = pBest * dice;

  return {
    probability,
    penetratingDice: Math.round(expectedPenetratingDice * 10) / 10,
    totalDice: dice
  };
}

/**
 * Get color based on probability
 */
export function getProbabilityColor(probability: number): string {
  if (probability >= 75) return 'text-emerald-400';
  if (probability >= 50) return 'text-amber-400';
  if (probability >= 25) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Compact inline indicator for integration into stat cards
 * Shows just the probability percentage with icon
 */
interface CompactProbabilityIndicatorProps {
  type: 'hit' | 'penetration';
  probability: number;
  color?: string; // Optional override color
  className?: string;
}

export function CompactProbabilityIndicator({
  type,
  probability,
  color,
  className,
}: CompactProbabilityIndicatorProps) {
  const defaultColor = getProbabilityColor(probability);
  const finalColor = color || defaultColor;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {type === 'hit' ? (
        <Target className="w-2.5 h-2.5 text-slate-500 shrink-0" />
      ) : (
        <Shield className="w-2.5 h-2.5 text-slate-500 shrink-0" />
      )}
      <span className={cn("text-[9px] font-bold font-mono", finalColor)}>
        {Math.round(probability)}%
      </span>
    </div>
  );
}
