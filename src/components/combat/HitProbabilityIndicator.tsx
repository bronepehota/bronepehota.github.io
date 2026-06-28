'use client';

import { parseRoll } from '@/lib/game-logic';
import { cn } from '@/lib/utils';
import { RulesVersionID } from '@/lib/types';
import { Target, Shield } from 'lucide-react';

interface HitProbabilityIndicatorProps {
  rangeStr: string;
  distanceSteps: number;
  powerStr: string;
  targetArmor: number;
  fortification?: 'none' | 'light' | 'heavy';
  rulesVersion?: RulesVersionID;
  isSurpriseAttack?: boolean;
  className?: string;
}

/**
 * Calculate hit probability based on range dice and distance
 * Hit occurs when roll >= effectiveDistance
 *
 * Surprise attack (rear attack): roll twice, take best result
 * Significantly increases hit probability
 *
 * Example: D6 vs distance 4
 * - Normal: Possible rolls: 1, 2, 3, 4, 5, 6
 * - Successful rolls (>=4): 4, 5, 6 (3 outcomes)
 * - Probability: 3/6 = 50%
 * - Surprise: P(best >= 4) = 1 - P(both < 4)^2 = 1 - (3/6)^2 = 75%
 *
 * Example: D6+2 vs distance 4
 * - Normal: maxRoll = 8, favorable: 4-8 (5 outcomes), Probability: 5/6 = 83%
 * - Surprise: unfavorable = 3, P(best >= 4) = 1 - (3/6)^2 = 96.7%
 */
export function calculateHitProbability(
  rangeStr: string,
  distanceSteps: number,
  fortification: 'none' | 'light' | 'heavy',
  rulesVersion: RulesVersionID,
  isSurpriseAttack: boolean = false
): { probability: number; favorableRolls: number; totalRolls: number } {
  const { sides, bonus } = parseRoll(rangeStr);
  // Invalid/unusable notation (e.g. 'ББ', malformed editor input) → sides:0.
  // Bail out before the surprise-attack branch divides by totalRolls (=sides).
  if (sides < 1) return { probability: 0, favorableRolls: 0, totalRolls: 0 };

  // Community Star System: fortification adds to distance
  const effectiveDistance = rulesVersion === 'community_star_system'
    ? distanceSteps + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : distanceSteps;

  const maxRoll = sides + bonus;

  // Count unfavorable outcomes (rolls < effectiveDistance)
  const unfavorableRolls = Math.max(0, effectiveDistance - 1 - bonus);

  // Single roll probability
  if (!isSurpriseAttack) {
    // Count favorable outcomes (rolls >= effectiveDistance)
    // Must be capped at 'sides' to avoid probability > 100%
    const favorableRolls = Math.min(sides, Math.max(0, maxRoll - effectiveDistance + 1));
    const totalRolls = sides;
    const probability = totalRolls > 0 ? (favorableRolls / totalRolls) * 100 : 0;
    return { probability, favorableRolls, totalRolls };
  }

  // Surprise attack: roll twice, take best result
  // P(best >= target) = 1 - P(both < target)
  const totalRolls = sides;
  const probOneFail = unfavorableRolls / totalRolls;
  const probBothFail = probOneFail * probOneFail;
  const probability = (1 - probBothFail) * 100;

  // For display: show equivalent favorable outcomes
  const favorableRolls = Math.round(totalRolls * totalRolls * (probability / 100));

  return { probability, favorableRolls, totalRolls: totalRolls * totalRolls };
}

/**
 * Calculate armor penetration probability
 * For virtual fire: each die is rolled, and if result > armor, it penetrates
 * Probability = count of favorable outcomes / total possible outcomes
 *
 * Tehnolog rules: fortification adds to armor
 * Community Star System: fortification adds to distance (handled in hit probability)
 *
 * Example: 1D6 vs armor 3
 * - Possible rolls: 1, 2, 3, 4, 5, 6
 * - Penetrating rolls (>3): 4, 5, 6 (3 outcomes)
 * - Probability: 3/6 = 50%
 *
 * Example: 1D6+1 vs armor 3
 * - Possible rolls: 2, 3, 4, 5, 6, 7
 * - Penetrating rolls (>3): 4, 5, 6, 7 (4 outcomes)
 * - Probability: 4/6 = 67%
 */
export function calculatePenetrationProbability(
  powerStr: string,
  targetArmor: number,
  fortification: 'none' | 'light' | 'heavy' = 'none',
  rulesVersion: RulesVersionID = 'tehnolog'
): { probability: number; penetratingDice: number; totalDice: number } {
  const { dice, sides, bonus } = parseRoll(powerStr);
  // Invalid notation → sides:0 would divide by zero below; report 0% instead.
  if (sides < 1) return { probability: 0, penetratingDice: 0, totalDice: 0 };

  // Tehnolog rules: fortification adds to armor
  const effectiveArmor = rulesVersion === 'tehnolog'
    ? targetArmor + (fortification === 'light' ? 1 : fortification === 'heavy' ? 2 : 0)
    : targetArmor;

  // Calculate probability for one die
  // Favorable outcomes: rolls where result > effectiveArmor
  // With bonus, possible results are: (1+bonus) to (sides+bonus)
  // Result > armor means result >= (armor + 1)
  // So we need: (sides + bonus) - (armor + 1) + 1 = sides + bonus - armor favorable outcomes
  // Must be capped at 'sides' to avoid probability > 100%
  const favorableOutcomes = Math.min(sides, Math.max(0, sides + bonus - effectiveArmor));
  const probabilityPerDie = (favorableOutcomes / sides) * 100;

  // For multiple dice, probability is the same per die
  // penetratingDice represents expected number of penetrating dice
  const expectedPenetratingDice = (favorableOutcomes / sides) * dice;

  return {
    probability: probabilityPerDie,
    penetratingDice: Math.round(expectedPenetratingDice * 10) / 10, // Round to 1 decimal
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
 * Get background style based on probability
 */
function getProbabilityBg(probability: number): string {
  if (probability >= 75) return 'bg-emerald-950/40 border-emerald-500/30';
  if (probability >= 50) return 'bg-amber-950/40 border-amber-500/30';
  if (probability >= 25) return 'bg-orange-950/40 border-orange-500/30';
  return 'bg-red-950/40 border-red-500/30';
}

export function HitProbabilityIndicator({
  rangeStr,
  distanceSteps,
  powerStr,
  targetArmor,
  fortification = 'none',
  rulesVersion = 'tehnolog',
  isSurpriseAttack = false,
  className,
}: HitProbabilityIndicatorProps) {
  const hitProb = calculateHitProbability(rangeStr, distanceSteps, fortification, rulesVersion, isSurpriseAttack);
  const penProb = calculatePenetrationProbability(powerStr, targetArmor, fortification, rulesVersion);

  const hitColor = getProbabilityColor(hitProb.probability);
  const penColor = getProbabilityColor(penProb.probability);
  const hitBg = getProbabilityBg(hitProb.probability);
  const penBg = getProbabilityBg(penProb.probability);

  return (
    <div className={cn("space-y-2 fade-in-up", className)}>
      {/* Compact horizontal probability bars */}
      <div className="flex items-center gap-2">
        {/* Hit probability */}
        <div className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          hitBg
        )}>
          <Target className="w-4 h-4 shrink-0 text-slate-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] uppercase font-bold text-slate-500">ПОПАДАНИЕ</span>
              <span className={cn("text-sm font-black font-mono leading-none", hitColor)}>
                {Math.round(hitProb.probability)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  hitProb.probability >= 75 && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                  hitProb.probability >= 50 && hitProb.probability < 75 && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                  hitProb.probability >= 25 && hitProb.probability < 50 && "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
                  hitProb.probability < 25 && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                )}
                style={{ width: `${hitProb.probability}%` }}
              />
            </div>
            <div className="text-[8px] text-slate-600 font-mono">
              {hitProb.favorableRolls}/{hitProb.totalRolls}
            </div>
          </div>
        </div>

        {/* Penetration probability */}
        <div className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          penBg
        )}>
          <Shield className="w-4 h-4 shrink-0 text-slate-400" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] uppercase font-bold text-slate-500">ПРОБИТИЕ</span>
              <span className={cn("text-sm font-black font-mono leading-none", penColor)}>
                {Math.round(penProb.probability)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  penProb.probability >= 75 && "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                  penProb.probability >= 50 && penProb.probability < 75 && "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
                  penProb.probability >= 25 && penProb.probability < 50 && "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
                  penProb.probability < 25 && "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                )}
                style={{ width: `${penProb.probability}%` }}
              />
            </div>
            <div className="text-[8px] text-slate-600 font-mono">
              {penProb.penetratingDice}/{penProb.totalDice} куб
            </div>
          </div>
        </div>
      </div>

      {/* Roll details tooltip */}
      <div className="text-center text-[9px] text-slate-600 font-mono">
        {isSurpriseAttack ? (
          <span>Бросок x2, лучший результат</span>
        ) : (
          <span>Нужно бросить ≥{distanceSteps}{rulesVersion === 'community_star_system' && fortification !== 'none' ? ` +${fortification === 'light' ? '1' : '2'}` : ''}</span>
        )}
      </div>
    </div>
  );
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
