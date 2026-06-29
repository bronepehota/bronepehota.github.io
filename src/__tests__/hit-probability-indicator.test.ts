import {
  calculateHitProbability,
  calculatePenetrationProbability,
} from '@/components/combat/HitProbabilityIndicator';

// B1 follow-up: parseRoll now returns sides:0 for invalid notation. The probability
// math must not divide by zero (surprise branch) or produce NaN (penetration) — it
// should return a clean 0% for unusable input.
describe('probability calc — invalid notation stays finite / 0', () => {
  test('hit probability, garbage range, surprise attack → 0 (was -Infinity)', () => {
    const r = calculateHitProbability('xyz', 4, 'none', 'tehnolog', true);
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });

  test('hit probability, garbage range, normal → 0', () => {
    const r = calculateHitProbability('xyz', 4, 'none', 'tehnolog', false);
    expect(r.probability).toBe(0);
  });

  test('penetration probability, garbage power → 0 (was NaN)', () => {
    const r = calculatePenetrationProbability('xyz', 3);
    expect(Number.isFinite(r.probability)).toBe(true);
    expect(r.probability).toBe(0);
  });
});
