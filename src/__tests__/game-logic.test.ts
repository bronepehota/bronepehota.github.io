import { parseRoll, executeRoll, multiplyRange, calculateDamage, rollGrenadeDistance } from '../lib/game-logic';
import { rulesRegistry } from '@/lib/rules-registry';

describe('multiplyRange', () => {
  it('should double D6 to D12', () => {
    expect(multiplyRange('D6', 2)).toBe('D12');
  });

  it('should double D12 to D24', () => {
    expect(multiplyRange('D12', 2)).toBe('D24');
  });

  it('should double bonus as well', () => {
    expect(multiplyRange('D6+2', 2)).toBe('D12+4');
  });

  it('should handle dice count', () => {
    expect(multiplyRange('2D6', 2)).toBe('2D12');
  });

  it('should return unchanged for invalid format', () => {
    expect(multiplyRange('ББ', 2)).toBe('ББ');
  });

  it('should handle multiplier of 1 (no change)', () => {
    expect(multiplyRange('D6', 1)).toBe('D6');
  });

  it('should handle D20 with multiplier 2', () => {
    expect(multiplyRange('D20', 2)).toBe('D40');
  });

  it('should handle D20 with bonus', () => {
    expect(multiplyRange('D20+1', 2)).toBe('D40+2');
  });

  it('should double a negative bonus', () => {
    expect(multiplyRange('D6-1', 2)).toBe('D12-2');
  });

  it('should handle negative bonus with dice count', () => {
    expect(multiplyRange('2D6-1', 2)).toBe('2D12-2');
  });
});

describe('Game Logic - Dice Rolls', () => {
  test('parseRoll should correctly parse various formats', () => {
    expect(parseRoll('D6')).toEqual({ dice: 1, sides: 6, bonus: 0 });
    expect(parseRoll('D12+2')).toEqual({ dice: 1, sides: 12, bonus: 2 });
    expect(parseRoll('2D20')).toEqual({ dice: 2, sides: 20, bonus: 0 });
    expect(parseRoll('3D6+1')).toEqual({ dice: 3, sides: 6, bonus: 1 });
    expect(parseRoll('D6-1')).toEqual({ dice: 1, sides: 6, bonus: -1 });
    expect(parseRoll('2D6-1')).toEqual({ dice: 2, sides: 6, bonus: -1 });
  });

  test('executeRoll should return a total within expected range', () => {
    const result = executeRoll('2D6+2');
    // Takes maximum of rolls, then adds bonus: max(roll1, roll2) + 2
    // Min: max(1,1) + 2 = 3, Max: max(6,6) + 2 = 8
    expect(result.total).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeLessThanOrEqual(8);
    expect(result.rolls.length).toBe(2);
  });

  test('executeRoll should handle ББ special case', () => {
    const result = executeRoll('ББ');
    expect(result.total).toBe(0);
    expect(result.rolls).toEqual([]);
  });
});

describe('parseRoll - invalid notation must not silently fall back', () => {
  // B1: malformed dice notation previously produced silent wrong results:
  //  - 'D0'  → sides:0 → rollDie(0)===1 always (constant damage)
  //  - '2D'  → no match → silent fallback to a D6 roll
  // Invalid input now returns { dice:0, sides:0, bonus:0 }, which:
  //  - makes combat yield NO effect (no damage / miss), and
  //  - activates DiceNotationDisplay's dice===0 branch (render the raw string).
  test('D0 (zero sides) → zeros', () => {
    expect(parseRoll('D0')).toEqual({ dice: 0, sides: 0, bonus: 0 });
  });
  test('2D (missing sides) → zeros', () => {
    expect(parseRoll('2D')).toEqual({ dice: 0, sides: 0, bonus: 0 });
  });
  test('0D6 (zero dice) → zeros', () => {
    expect(parseRoll('0D6')).toEqual({ dice: 0, sides: 0, bonus: 0 });
  });
  test('empty string → zeros', () => {
    expect(parseRoll('')).toEqual({ dice: 0, sides: 0, bonus: 0 });
  });
  test('garbage → zeros', () => {
    expect(parseRoll('xyz')).toEqual({ dice: 0, sides: 0, bonus: 0 });
  });
});

describe('executeRoll - invalid input yields no roll (not -Infinity, not silent D6)', () => {
  test('D0 → total 0, no rolls (was silently always 1)', () => {
    const r = executeRoll('D0');
    expect(r.total).toBe(0);
    expect(r.rolls).toEqual([]);
  });
  test('2D → total 0 (was silently a 1D6 roll)', () => {
    expect(executeRoll('2D').total).toBe(0);
  });
  test('0D6 → total 0 (was -Infinity from Math.max of empty rolls)', () => {
    expect(executeRoll('0D6').total).toBe(0);
  });
});

describe('calculateDamage - invalid power deals no damage', () => {
  test('D0 vs armor 0 → 0 damage (was 1: rollDie(0)===1 > 0)', () => {
    expect(calculateDamage('D0', 0).damage).toBe(0);
  });
});

describe('rollGrenadeDistance - grenade blast-location (phase 1)', () => {
  // Deterministic via an injected D6 roller.
  test('Tehnolog: single D6, NO rank bonus (official rules §7.8)', () => {
    const r = rollGrenadeDistance('tehnolog', 3, () => 4);
    expect(r.distanceRoll).toBe(4);
    expect(r.allRolls).toEqual([4]);
    expect(r.totalDistance).toBe(4); // NOT 4 + rank(3)
    expect(r.bonus).toBe(0);         // previously wrongly reported soldierRank
    expect(r.blastZone).toEqual({ minSteps: 3, maxSteps: 5, minCm: 12, maxCm: 20 });
  });

  test('Community Star System: roll D6 per rank, keep best', () => {
    const rolls = [2, 5, 3];
    let i = 0;
    const r = rollGrenadeDistance('community_star_system', 3, () => rolls[i++]);
    expect(r.distanceRoll).toBe(5);
    expect(r.allRolls).toEqual([2, 5, 3]);
    expect(r.totalDistance).toBe(5);
    expect(r.bonus).toBe(0);
  });

  test('Community rank 0 falls back to a single D6', () => {
    const r = rollGrenadeDistance('community_star_system', 0, () => 6);
    expect(r.totalDistance).toBe(6);
    expect(r.allRolls).toEqual([6]);
  });

  test('D6=1 impact → blast zone reaches the thrower (minSteps clamped to 1)', () => {
    const r = rollGrenadeDistance('tehnolog', 2, () => 1);
    expect(r.blastZone).toEqual({ minSteps: 1, maxSteps: 2, minCm: 4, maxCm: 8 });
  });
});

describe('Grenade Combat Mechanics', () => {
  describe('Grenade Distance Calculation', () => {
    test('should calculate total distance as D6 + soldier rank', () => {
      const distanceRoll = 4;
      const soldierRank = 2;
      const totalDistance = distanceRoll + soldierRank;

      expect(totalDistance).toBe(6);
    });

    test('should calculate blast zone with ±1 step', () => {
      const totalDistance = 4;
      const minSteps = Math.max(1, totalDistance - 1);
      const maxSteps = totalDistance + 1;
      const minCm = minSteps * 4;
      const maxCm = maxSteps * 4;

      expect(minSteps).toBe(3);
      expect(maxSteps).toBe(5);
      expect(minCm).toBe(12);
      expect(maxCm).toBe(20);
    });

    test('should handle distance roll of 1 correctly', () => {
      const distanceRoll = 1;
      const soldierRank = 2;
      const totalDistance = distanceRoll + soldierRank;
      const minSteps = Math.max(1, totalDistance - 1);
      const maxSteps = totalDistance + 1;

      expect(totalDistance).toBe(3);
      expect(minSteps).toBe(2);
      expect(maxSteps).toBe(4);
    });

    test('should handle minimum distance (1)', () => {
      const distanceRoll = 1;
      const soldierRank = 0;
      const totalDistance = distanceRoll + soldierRank;
      const minSteps = Math.max(1, totalDistance - 1);
      const maxSteps = totalDistance + 1;

      expect(minSteps).toBe(1);
      expect(maxSteps).toBe(2);
    });

    test('should handle maximum distance', () => {
      const distanceRoll = 6;
      const soldierRank = 3;
      const totalDistance = distanceRoll + soldierRank;
      const minSteps = Math.max(1, totalDistance - 1);
      const maxSteps = totalDistance + 1;

      expect(minSteps).toBe(8);
      expect(maxSteps).toBe(10);
    });
  });

  describe('Grenade Blast Check (Phase 2)', () => {
    test('should correctly determine if armor is pierced (D20 > armor)', () => {
      const armor = 2;
      const d20Roll = 5;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(true);
    });

    test('should correctly determine if armor is NOT pierced (D20 <= armor)', () => {
      const armor = 3;
      const d20Roll = 3;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(false);
    });

    test('should handle edge case - D20 exactly equals armor', () => {
      const armor = 4;
      const d20Roll = 4;
      const isHit = d20Roll > armor;

      // If D20 equals armor, it's NOT pierced (needs to be GREATER than armor)
      expect(isHit).toBe(false);
    });

    test('should handle maximum armor value', () => {
      const armor = 10;
      const d20Roll = 20;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(true);
    });

    test('should handle zero armor', () => {
      const armor = 0;
      const d20Roll = 1;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(true);
    });

    test('should handle minimum D20 roll', () => {
      const armor = 2;
      const d20Roll = 1;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(false);
    });

    test('should handle maximum D20 roll', () => {
      const armor = 2;
      const d20Roll = 20;
      const isHit = d20Roll > armor;

      expect(isHit).toBe(true);
    });
  });
});

describe('Version-Specific Calculations', () => {
  describe('Tehnolog version', () => {
    const tehnolog = rulesRegistry.tehnolog;

    test('calculateHit works correctly', () => {
      const result = tehnolog.calculateHit('D6+2', 5);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');
    });

    test('calculateDamage works correctly', () => {
      const result = tehnolog.calculateDamage('2D6', 3);
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('rolls');
      expect(result.rolls.length).toBe(2);
    });

    test('calculateMelee works correctly', () => {
      const result = tehnolog.calculateMelee(4, 3);
      expect(result).toHaveProperty('attackerRoll');
      expect(result).toHaveProperty('attackerTotal');
      expect(result).toHaveProperty('defenderRoll');
      expect(result).toHaveProperty('defenderTotal');
      expect(result).toHaveProperty('winner');
      expect(['attacker', 'defender', 'draw']).toContain(result.winner);
    });
  });

  describe('Community Star System version', () => {
    const community = rulesRegistry.community_star_system;

    test('calculateHit works correctly', () => {
      const result = community.calculateHit('D6+2', 5);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('roll');
      expect(result).toHaveProperty('total');
    });

    test('calculateDamage works correctly', () => {
      const result = community.calculateDamage('2D6', 3);
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('rolls');
      expect(result.rolls.length).toBe(2);
    });

    test('calculateMelee works correctly', () => {
      const result = community.calculateMelee(4, 3);
      expect(result).toHaveProperty('attackerRoll');
      expect(result).toHaveProperty('attackerTotal');
      expect(result).toHaveProperty('defenderRoll');
      expect(result).toHaveProperty('defenderTotal');
      expect(result).toHaveProperty('winner');
      expect(['attacker', 'defender', 'draw']).toContain(result.winner);
    });
  });
});