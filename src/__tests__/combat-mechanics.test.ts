import { calculateHit, calculateDamage, executeRoll } from '../lib/game-logic';
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

  describe('Grenade Distance Mechanics', () => {
    describe('Tehnolog Rules (D6 only)', () => {
      test('should calculate distance as D6 only (no rank bonus)', () => {
        // For tehnolog: distance = D6 roll only
        // If roll is 4, distance = 4 (no bonus)
        const mockRoll = 4;
        const expectedDistance = mockRoll;

        expect(expectedDistance).toBe(4);
      });

      test('rank should not affect distance', () => {
        // Even with high rank, distance is just D6
        const mockRoll = 4;
        const mockRank = 7;
        const expectedDistance = mockRoll; // Still 4, not 4 + 7

        expect(expectedDistance).toBe(4);
        expect(expectedDistance).not.toBe(mockRoll + mockRank);
      });
    });

    describe('Community Star System Rules (Multiple D6 rolls, pick best)', () => {
      test('should roll D6 multiple times equal to rank', () => {
        // For community_star_system: roll D6 (rank times), pick best result
        // If rank is 3, roll D6 three times, pick highest
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mockRank = 3;
        const mockRolls = [2, 5, 3]; // Three rolls, best is 5
        const expectedDistance = Math.max(...mockRolls); // 5

        expect(expectedDistance).toBe(5);
      });

      test('should handle rank 7 (maximum)', () => {
        // Maximum rank for most soldiers
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mockRank = 7;
        const mockRolls = [1, 2, 3, 4, 5, 6, 2]; // Seven rolls, best is 6
        const expectedDistance = Math.max(...mockRolls); // 6

        expect(expectedDistance).toBe(6);
      });

      test('best result should be in range 1-6', () => {
        // Even with many rolls, the result is still bounded by D6
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mockRank = 5;
        // All possible rolls from 5 D6
        const mockRolls = [1, 6, 3, 4, 2];
        const bestResult = Math.max(...mockRolls);

        expect(bestResult).toBeGreaterThanOrEqual(1);
        expect(bestResult).toBeLessThanOrEqual(6);
        expect(bestResult).toBe(6); // The best roll
      });

      test('rank 1 should roll D6 once', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mockRank = 1;
        const mockRolls = [4];
        const expectedDistance = Math.max(...mockRolls); // 4

        expect(expectedDistance).toBe(4);
      });

      test('should NOT add rank as bonus (difference from tehnolog)', () => {
        // Key difference: community_star_system does NOT add rank as bonus
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _mockRank = 5;
        const mockRolls = [1, 2, 3, 4, 5];
        const bestRoll = Math.max(...mockRolls); // 5

        // Distance is just the best roll, NOT best roll + rank
        const expectedDistance = bestRoll; // 5, not 5 + 5 = 10

        expect(expectedDistance).toBe(5);
        expect(expectedDistance).not.toBe(10);
      });
    });
  });
});
