import {
  calculateShotResult,
  calculateMeleeResult,
  calculateGrenadeResult,
  checkGrenadePenetration,
} from '../lib/combat-calculator';
import type { CalculatorModifier } from '../lib/combat-calculator';

describe('combat-calculator', () => {
  describe('calculateShotResult', () => {
    it('should return hit/damage result for a successful shot', () => {
      const result = calculateShotResult({
        range: 'D12',
        rangeBonus: 0,
        power: '2D6',
        powerBonus: 0,
        distanceSteps: 5,
        targetArmor: 3,
        rulesVersion: 'community_star_system',
      });
      expect(result).toHaveProperty('hitResult');
      expect(result).toHaveProperty('damageResult');
      expect(result.hitResult).toHaveProperty('success');
      expect(result.hitResult).toHaveProperty('roll');
      expect(result.hitResult).toHaveProperty('total');
      expect(result.damageResult).toHaveProperty('damage');
      expect(result.damageResult).toHaveProperty('rolls');
    });

    it('should apply range bonus to hit roll', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 2,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 3,
        targetArmor: 2,
        rulesVersion: 'tehnolog',
      });
      expect(result.hitResult.bonus).toBe(2);
      expect(result.hitResult.total).toBe(result.hitResult.roll + 2);
    });

    it('should apply range multiplier', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 0,
        rangeMultiplier: 2,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 10,
        targetArmor: 2,
        rulesVersion: 'tehnolog',
      });
      expect(result.hitResult.roll).toBeGreaterThanOrEqual(1);
      expect(result.hitResult.roll).toBeLessThanOrEqual(12);
    });

    it('should apply power bonus', () => {
      const result = calculateShotResult({
        range: 'D12',
        rangeBonus: 0,
        power: '1D6',
        powerBonus: 2,
        distanceSteps: 2,
        targetArmor: 0,
        rulesVersion: 'tehnolog',
      });
      result.damageResult.rolls.forEach((r: number) => {
        expect(r).toBeGreaterThanOrEqual(3);
        expect(r).toBeLessThanOrEqual(8);
      });
    });

    it('should stack modifier range_bonus on top of manual range bonus', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 1,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 5,
        targetArmor: 2,
        rulesVersion: 'tehnolog',
        activeModifiers: [{ range_bonus: 2 }],
      });
      expect(result.hitResult.bonus).toBe(3);
    });

    it('should apply distance_penalty from modifiers', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 0,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 3,
        targetArmor: 2,
        rulesVersion: 'community_star_system',
        activeModifiers: [{ distance_penalty: 2 }],
      });
      expect(result).toBeDefined();
    });

    it('should apply range_multiply from modifiers (multiplied with manual multiplier)', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 0,
        rangeMultiplier: 2,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 20,
        targetArmor: 2,
        rulesVersion: 'tehnolog',
        activeModifiers: [{ range_multiply: 2 }],
      });
      expect(result.hitResult.roll).toBeGreaterThanOrEqual(1);
      expect(result.hitResult.roll).toBeLessThanOrEqual(24);
    });

    it('should work with both rules versions', () => {
      const tehnolog = calculateShotResult({
        range: 'D6', rangeBonus: 0, power: '1D6', powerBonus: 0,
        distanceSteps: 2, targetArmor: 2, rulesVersion: 'tehnolog',
      });
      const community = calculateShotResult({
        range: 'D6', rangeBonus: 0, power: '1D6', powerBonus: 0,
        distanceSteps: 2, targetArmor: 2, rulesVersion: 'community_star_system',
      });
      expect(tehnolog).toHaveProperty('hitResult');
      expect(community).toHaveProperty('hitResult');
    });

    it('should return damage with 0 hits on miss', () => {
      const result = calculateShotResult({
        range: 'D6',
        rangeBonus: 0,
        power: '1D6',
        powerBonus: 0,
        distanceSteps: 20,
        targetArmor: 10,
        rulesVersion: 'tehnolog',
      });
      if (!result.hitResult.success) {
        expect(result.damageResult.damage).toBe(0);
        expect(result.damageResult.rolls).toEqual([]);
      }
    });
  });

  describe('calculateMeleeResult', () => {
    it('should return attacker and defender rolls with winner', () => {
      const result = calculateMeleeResult({
        attackerMelee: 2,
        defenderMelee: 1,
        meleeBonus: 0,
        rulesVersion: 'tehnolog',
      });
      expect(result).toHaveProperty('attackerRoll');
      expect(result).toHaveProperty('attackerTotal');
      expect(result).toHaveProperty('defenderRoll');
      expect(result).toHaveProperty('defenderTotal');
      expect(result).toHaveProperty('winner');
      expect(['attacker', 'defender', 'draw']).toContain(result.winner);
    });

    it('should apply melee bonus to attacker total', () => {
      const result = calculateMeleeResult({
        attackerMelee: 0,
        defenderMelee: 0,
        meleeBonus: 3,
        rulesVersion: 'tehnolog',
      });
      expect(result.attackerTotal).toBe(result.attackerRoll + 3);
    });

    it('should stack melee_bonus from modifiers', () => {
      const result = calculateMeleeResult({
        attackerMelee: 1,
        defenderMelee: 0,
        meleeBonus: 1,
        rulesVersion: 'tehnolog',
        activeModifiers: [{ melee_bonus: 2 }],
      });
      expect(result.attackerTotal).toBe(result.attackerRoll + 4);
    });

    it('should work with community_star_system rules', () => {
      const result = calculateMeleeResult({
        attackerMelee: 2,
        defenderMelee: 1,
        meleeBonus: 0,
        rulesVersion: 'community_star_system',
      });
      expect(result).toHaveProperty('winner');
    });
  });

  describe('calculateGrenadeResult', () => {
    it('should return distance roll and blast zone', () => {
      const result = calculateGrenadeResult({
        soldierRank: 2,
        rulesVersion: 'tehnolog',
      });
      expect(result).toHaveProperty('distanceRoll');
      expect(result).toHaveProperty('totalDistance');
      expect(result).toHaveProperty('blastZone');
      expect(result).toHaveProperty('allRolls');
      expect(result.blastZone).toHaveProperty('minSteps');
      expect(result.blastZone).toHaveProperty('maxSteps');
      expect(result.blastZone.minSteps).toBe(Math.max(1, result.totalDistance - 1));
      expect(result.blastZone.maxSteps).toBe(result.totalDistance + 1);
    });

    it('should roll multiple dice for community_star_system with rank > 0', () => {
      const result = calculateGrenadeResult({
        soldierRank: 3,
        rulesVersion: 'community_star_system',
      });
      expect(result.allRolls.length).toBe(3);
      expect(result.distanceRoll).toBe(Math.max(...result.allRolls));
    });

    it('should roll single D6 for tehnolog', () => {
      const result = calculateGrenadeResult({
        soldierRank: 3,
        rulesVersion: 'tehnolog',
      });
      expect(result.allRolls.length).toBe(1);
    });
  });

  describe('checkGrenadePenetration', () => {
    it('should return hit/miss result with D20 roll', () => {
      const result = checkGrenadePenetration({
        targetArmor: 5,
        rulesVersion: 'tehnolog',
      });
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('armor');
      expect(result.roll).toBeGreaterThanOrEqual(1);
      expect(result.roll).toBeLessThanOrEqual(20);
      expect(result.hit).toBe(result.roll > 5);
    });
  });
});
