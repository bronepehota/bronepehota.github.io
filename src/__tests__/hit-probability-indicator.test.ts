import {
  calculateHitProbability,
  calculatePenetrationProbability,
} from '@/components/combat/HitProbabilityIndicator';

describe('probability calc — invalid notation stays finite / 0', () => {
  test('hit probability, garbage range → 0', () => {
    const r = calculateHitProbability('xyz', 4, 'none', 'tehnolog');
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });

  test('penetration probability, garbage power → 0 (was NaN)', () => {
    const r = calculatePenetrationProbability('xyz', 3);
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });
});

describe('hit probability — single-roll only (surprise does not affect hit)', () => {
  test('hit probability is single-roll: D6 vs distance 3 → 67% (4 of 6)', () => {
    const r = calculateHitProbability('D6', 3, 'none', 'tehnolog');
    expect(r.probability).toBeCloseTo(66.67, 0);
    expect(r.favorableRolls).toBe(4);
    expect(r.totalRolls).toBe(6);
  });
});

describe('penetration probability — surprise attack best-of-2', () => {
  test('penetration probability: D6 vs armor 3, normal → 50%', () => {
    const r = calculatePenetrationProbability('D6', 3, 'none', 'tehnolog', false);
    expect(r.probability).toBe(50);
  });

  test('penetration probability: D6 vs armor 3, surprise (с тыла) → best-of-2 = 75%', () => {
    // pPerDie = 3/6 = 0.5 → pBest = 1 − (1−0.5)² = 0.75
    const r = calculatePenetrationProbability('D6', 3, 'none', 'tehnolog', true);
    expect(r.probability).toBe(75);
    expect(r.penetratingDice).toBe(0.8); // 1 die × 0.75, rounded to 1 decimal
  });

  test('penetration probability: garbage power + surprise → 0 (no NaN)', () => {
    const r = calculatePenetrationProbability('xyz', 3, 'none', 'tehnolog', true);
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });
});
