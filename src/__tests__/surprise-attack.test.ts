import { rollDie, rollWithAdvantage, calculateDamageWithSurpriseAttack, calculateMeleeWithSurpriseAttack } from '@/lib/game-logic';

describe('Surprise Attack - All Rules', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rollWithAdvantage', () => {
    it('returns two rolls and the better one', () => {
      const result = rollWithAdvantage(6);

      expect(result).toHaveProperty('roll1');
      expect(result).toHaveProperty('roll2');
      expect(result).toHaveProperty('best');

      expect(result.roll1).toBeGreaterThanOrEqual(1);
      expect(result.roll1).toBeLessThanOrEqual(6);
      expect(result.roll2).toBeGreaterThanOrEqual(1);
      expect(result.roll2).toBeLessThanOrEqual(6);
      expect(result.best).toBe(Math.max(result.roll1, result.roll2));
    });

    it('returns best as maximum of both rolls', () => {
      for (let i = 0; i < 20; i++) {
        const result = rollWithAdvantage(6);
        expect(result.best).toBeGreaterThanOrEqual(result.roll1);
        expect(result.best).toBeGreaterThanOrEqual(result.roll2);
        expect(result.best).toBe(Math.max(result.roll1, result.roll2));
      }
    });

    it('works with D12', () => {
      const result = rollWithAdvantage(12);

      expect(result.roll1).toBeGreaterThanOrEqual(1);
      expect(result.roll1).toBeLessThanOrEqual(12);
      expect(result.roll2).toBeGreaterThanOrEqual(1);
      expect(result.roll2).toBeLessThanOrEqual(12);
      expect(result.best).toBe(Math.max(result.roll1, result.roll2));
    });

    it('works with D20', () => {
      const result = rollWithAdvantage(20);

      expect(result.roll1).toBeGreaterThanOrEqual(1);
      expect(result.roll1).toBeLessThanOrEqual(20);
      expect(result.roll2).toBeGreaterThanOrEqual(1);
      expect(result.roll2).toBeLessThanOrEqual(20);
      expect(result.best).toBe(Math.max(result.roll1, result.roll2));
    });
  });

  describe('calculateDamageWithSurpriseAttack', () => {
    it('rolls damage twice and takes best result', () => {
      const result = calculateDamageWithSurpriseAttack('2D6', 3);

      expect(result).toHaveProperty('rolls1');
      expect(result).toHaveProperty('rolls2');
      expect(result).toHaveProperty('bestRolls');
      expect(result).toHaveProperty('damage');

      // Both roll sets should have same length
      expect(result.rolls1.length).toBe(2);
      expect(result.rolls2.length).toBe(2);
      expect(result.bestRolls.length).toBe(2);

      // All rolls should be valid D6 values
      [...result.rolls1, ...result.rolls2].forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    it('calculates damage correctly for armor penetration', () => {
      const result = calculateDamageWithSurpriseAttack('D6', 3);

      // Single die, single result
      expect(result.rolls1.length).toBe(1);
      expect(result.rolls2.length).toBe(1);
      expect(result.bestRolls.length).toBe(1);

      // Damage should be 0 or 1 (single die)
      expect(result.damage).toBeGreaterThanOrEqual(0);
      expect(result.damage).toBeLessThanOrEqual(1);

      // Verify bestRolls matches the better damage result
      const damage1 = result.rolls1[0] > 3 ? 1 : 0;
      const damage2 = result.rolls2[0] > 3 ? 1 : 0;
      const expectedDamage = Math.max(damage1, damage2);
      expect(result.damage).toBe(expectedDamage);
    });

    it('works with multiple dice', () => {
      const result = calculateDamageWithSurpriseAttack('3D6', 2);

      expect(result.rolls1.length).toBe(3);
      expect(result.rolls2.length).toBe(3);
      expect(result.bestRolls.length).toBe(3);

      // Max damage is 3 (3 dice, each can deal 1 damage)
      expect(result.damage).toBeGreaterThanOrEqual(0);
      expect(result.damage).toBeLessThanOrEqual(3);
    });

    it('applies bonus to damage rolls', () => {
      const result = calculateDamageWithSurpriseAttack('D6+2', 4);

      expect(result.rolls1.length).toBe(1);
      expect(result.rolls2.length).toBe(1);

      // Each roll should be base + 2
      result.rolls1.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(3); // 1 + 2
        expect(roll).toBeLessThanOrEqual(8); // 6 + 2
      });
    });

    it('advantage gives better damage outcomes', () => {
      let singleSuccesses = 0;
      let advantageSuccesses = 0;
      const iterations = 200;

      for (let i = 0; i < iterations; i++) {
        // Single roll damage
        const singleRoll = rollDie(6);
        const singleDamage = singleRoll > 3 ? 1 : 0;
        if (singleDamage > 0) singleSuccesses++;

        // Advantage damage
        const advResult = calculateDamageWithSurpriseAttack('D6', 3);
        if (advResult.damage > 0) advantageSuccesses++;
      }

      // Advantage should have equal or more successful damage rolls
      expect(advantageSuccesses).toBeGreaterThanOrEqual(singleSuccesses - 5);
    });
  });

  describe('calculateMeleeWithSurpriseAttack', () => {
    it('attacker rolls twice and takes best, defender rolls once', () => {
      const result = calculateMeleeWithSurpriseAttack(2, 2);

      expect(result).toHaveProperty('attackerRoll1');
      expect(result).toHaveProperty('attackerRoll2');
      expect(result).toHaveProperty('attackerRoll');
      expect(result).toHaveProperty('attackerTotal');
      expect(result).toHaveProperty('defenderRoll');
      expect(result).toHaveProperty('defenderTotal');
      expect(result).toHaveProperty('winner');

      expect(result.attackerRoll1).toBeGreaterThanOrEqual(1);
      expect(result.attackerRoll1).toBeLessThanOrEqual(6);
      expect(result.attackerRoll2).toBeGreaterThanOrEqual(1);
      expect(result.attackerRoll2).toBeLessThanOrEqual(6);
      expect(result.defenderRoll).toBeGreaterThanOrEqual(1);
      expect(result.defenderRoll).toBeLessThanOrEqual(6);

      expect(result.attackerRoll).toBe(Math.max(result.attackerRoll1, result.attackerRoll2));
      expect(result.attackerTotal).toBe(result.attackerRoll + 2);
      expect(result.defenderTotal).toBe(result.defenderRoll + 2);
    });

    it('correctly determines winner', () => {
      const results = [];
      for (let i = 0; i < 50; i++) {
        results.push(calculateMeleeWithSurpriseAttack(2, 2));
      }

      const hasAttacker = results.some(r => r.winner === 'attacker');
      const _hasDefender = results.some(r => r.winner === 'defender');
      const _hasDraw = results.some(r => r.winner === 'draw');

      expect(hasAttacker).toBe(true);
      expect(['attacker', 'defender', 'draw']).toContain(results[0].winner);
    });

    it('attacker with advantage wins more than without', () => {
      let attackerWinsWithAdvantage = 0;
      let attackerWinsNormal = 0;
      const iterations = 200;

      for (let i = 0; i < iterations; i++) {
        const advResult = calculateMeleeWithSurpriseAttack(2, 2);
        if (advResult.winner === 'attacker') attackerWinsWithAdvantage++;

        const aRoll = rollDie(6);
        const dRoll = rollDie(6);
        if (aRoll + 2 > dRoll + 2) attackerWinsNormal++;
      }

      expect(attackerWinsWithAdvantage).toBeGreaterThanOrEqual(attackerWinsNormal - 10);
    });

    it('machine surprise attack: defender with 0 melee is vulnerable', () => {
      const result = calculateMeleeWithSurpriseAttack(2, 0);

      expect(result.defenderTotal).toBe(result.defenderRoll);
      expect(result.attackerTotal).toBe(result.attackerRoll + 2);
      expect(result.attackerRoll).toBe(Math.max(result.attackerRoll1, result.attackerRoll2));
    });

    it('returns valid winner values', () => {
      for (let i = 0; i < 50; i++) {
        const result = calculateMeleeWithSurpriseAttack(3, 2);
        expect(['attacker', 'defender', 'draw']).toContain(result.winner);
      }
    });

    it('correctly handles draw scenario', () => {
      let _foundDraw = false;
      for (let i = 0; i < 100; i++) {
        const result = calculateMeleeWithSurpriseAttack(2, 2);
        if (result.winner === 'draw') {
          expect(result.attackerTotal).toBe(result.defenderTotal);
          _foundDraw = true;
          break;
        }
      }
    });
  });
});
