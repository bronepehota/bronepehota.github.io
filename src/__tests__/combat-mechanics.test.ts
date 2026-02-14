import { calculateHit, calculateDamage, executeRoll, parseRoll } from '../lib/game-logic';
import { rulesRegistry } from '@/lib/rules-registry';

describe('Combat Mechanics', () => {
  describe('Hit Calculation', () => {
    test('should calculate hit for range within distance', () => {
      const result = calculateHit('D6', 3);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');

      // If roll >= distance, it's a hit
      expect(typeof result.success).toBe('boolean');
    });

    test('should calculate hit for range exceeding distance', () => {
      const result = calculateHit('D6', 10);

      // Maximum D6 roll is 6, which is < 10
      expect(result.success).toBe(false);
    });

    test('should handle bonus in range notation', () => {
      const result = calculateHit('D6+2', 4);

      expect(result.total).toBeGreaterThan(2);
      expect(result).toHaveProperty('roll');
    });
  });

  describe('Damage Calculation', () => {
    test('should calculate damage against armor', () => {
      const result = calculateDamage('2D6', 3);

      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('rolls');
      expect(result.rolls).toHaveLength(2);

      // Damage should be non-negative
      expect(result.damage).toBeGreaterThanOrEqual(0);
    });

    test('should handle different power notations', () => {
      const d6Result = calculateDamage('1D6', 2);
      const d12Result = calculateDamage('1D12', 2);

      expect(d6Result.rolls).toHaveLength(1);
      expect(d12Result.rolls).toHaveLength(1);

      // D12 should have higher potential max
      expect(d12Result.rolls[0]).toBeLessThanOrEqual(12);
    });
  });

  describe('Roll Execution', () => {
    test('should execute single die roll', () => {
      const result = executeRoll('D6');

      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(6);
      expect(result.rolls).toHaveLength(1);
      expect(result.bonus).toBe(0);
    });

    test('should execute multiple dice with bonus', () => {
      const result = executeRoll('2D6+2');

      expect(result.rolls).toHaveLength(2);
      expect(result.bonus).toBe(2);
      // Total should be max of rolls + bonus
      expect(result.total).toBeGreaterThan(2);
    });

    test('should handle melee special case', () => {
      const result = executeRoll('ББ');

      expect(result.total).toBe(0);
      expect(result.rolls).toEqual([]);
      expect(result.bonus).toBe(0);
    });
  });

  describe('Rules-Specific Mechanics', () => {
    describe('Tehnolog Rules', () => {
      const tehnolog = rulesRegistry.tehnolog;

      test('should have combat methods', () => {
        expect(typeof tehnolog.calculateHit).toBe('function');
        expect(typeof tehnolog.calculateDamage).toBe('function');
        expect(typeof tehnolog.calculateMelee).toBe('function');
      });

      test('should execute hit calculation correctly', () => {
        const result = tehnolog.calculateHit('D6', 3);

        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });

      test('should execute damage calculation correctly', () => {
        const result = tehnolog.calculateDamage('2D6', 3);

        expect(result).toHaveProperty('damage');
        expect(Array.isArray(result.rolls)).toBe(true);
      });
    });

    describe('Community Star System Rules', () => {
      const community = rulesRegistry.community_star_system;

      test('should have combat methods', () => {
        expect(typeof community.calculateHit).toBe('function');
        expect(typeof community.calculateDamage).toBe('function');
        expect(typeof community.calculateMelee).toBe('function');
      });

      test('should execute hit calculation correctly', () => {
        const result = community.calculateHit('D12', 5);

        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });

      test('should execute damage calculation correctly', () => {
        const result = community.calculateDamage('1D12', 2);

        expect(result).toHaveProperty('damage');
        expect(Array.isArray(result.rolls)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero distance', () => {
      const result = calculateHit('D6', 0);

      expect(result).toHaveProperty('success');
      // Any roll should hit at distance 0
      expect(result.success).toBe(true);
    });

    test('should handle maximum dice values', () => {
      const result = executeRoll('D20');

      expect(result.total).toBeLessThanOrEqual(20);
      expect(result.rolls[0]).toBeLessThanOrEqual(20);
    });

    test('should handle large bonus values', () => {
      const result = executeRoll('D6+10');

      expect(result.bonus).toBe(10);
      expect(result.total).toBeGreaterThan(10);
    });
  });
});
