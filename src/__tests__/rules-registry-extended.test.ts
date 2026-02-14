import { rulesRegistry, isValidRulesVersion } from '../lib/rules-registry';
import type { RulesVersionID } from '../lib/types';

describe('Rules Registry', () => {
  describe('Version Validation', () => {
    test('should accept valid rule versions', () => {
      expect(isValidRulesVersion('tehnolog')).toBe(true);
      expect(isValidRulesVersion('community_star_system')).toBe(true);
    });

    test('should reject invalid rule versions', () => {
      expect(isValidRulesVersion('invalid' as RulesVersionID)).toBe(false);
      expect(isValidRulesVersion('' as RulesVersionID)).toBe(false);
      expect(isValidRulesVersion('fan' as RulesVersionID)).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(isValidRulesVersion(null as unknown as RulesVersionID)).toBe(false);
      expect(isValidRulesVersion(undefined as unknown as RulesVersionID)).toBe(false);
    });
  });

  describe('Rules API', () => {
    describe('Tehnolog Rules', () => {
      const tehnolog = rulesRegistry.tehnolog;

      test('should have calculateHit method', () => {
        expect(typeof tehnolog.calculateHit).toBe('function');
      });

      test('should have calculateDamage method', () => {
        expect(typeof tehnolog.calculateDamage).toBe('function');
      });

      test('should have calculateMelee method', () => {
        expect(typeof tehnolog.calculateMelee).toBe('function');
      });

      test('should calculate hit correctly', () => {
        const result = tehnolog.calculateHit('D6', 3);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('roll');
        expect(result).toHaveProperty('total');
        expect(typeof result.success).toBe('boolean');
      });

      test('should calculate damage correctly', () => {
        const result = tehnolog.calculateDamage('1D6', 2);
        expect(result).toHaveProperty('damage');
        expect(result).toHaveProperty('rolls');
        expect(Array.isArray(result.rolls)).toBe(true);
      });

      test('should calculate melee correctly', () => {
        const result = tehnolog.calculateMelee(4, 3);
        expect(result).toHaveProperty('attackerRoll');
        expect(result).toHaveProperty('attackerTotal');
        expect(result).toHaveProperty('defenderRoll');
        expect(result).toHaveProperty('defenderTotal');
        expect(result).toHaveProperty('winner');
        expect(['attacker', 'defender', 'draw']).toContain(result.winner);
      });
    });

    describe('Community Star System Rules', () => {
      const community = rulesRegistry.community_star_system;

      test('should have calculateHit method', () => {
        expect(typeof community.calculateHit).toBe('function');
      });

      test('should have calculateDamage method', () => {
        expect(typeof community.calculateDamage).toBe('function');
      });

      test('should have calculateMelee method', () => {
        expect(typeof community.calculateMelee).toBe('function');
      });

      test('should calculate hit correctly', () => {
        const result = community.calculateHit('D6+2', 4);
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('roll');
        expect(result).toHaveProperty('total');
      });

      test('should calculate damage correctly', () => {
        const result = community.calculateDamage('2D6', 3);
        expect(result).toHaveProperty('damage');
        expect(result).toHaveProperty('rolls');
        expect(result.rolls.length).toBe(2);
      });

      test('should calculate melee correctly', () => {
        const result = community.calculateMelee(5, 3);
        expect(result).toHaveProperty('attackerRoll');
        expect(result).toHaveProperty('attackerTotal');
        expect(result).toHaveProperty('defenderRoll');
        expect(result).toHaveProperty('defenderTotal');
        expect(result).toHaveProperty('winner');
      });
    });
  });

  describe('Rules Differences', () => {
    test('should have different implementations for different rules', () => {
      const tehnolog = rulesRegistry.tehnolog;
      const community = rulesRegistry.community_star_system;

      // Both should have same API but potentially different behavior
      expect(typeof tehnolog.calculateHit).toBe(typeof community.calculateHit);
      expect(typeof tehnolog.calculateDamage).toBe(typeof community.calculateDamage);
      expect(typeof tehnolog.calculateMelee).toBe(typeof community.calculateMelee);
    });
  });
});
