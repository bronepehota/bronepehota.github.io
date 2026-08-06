import { hasUnitLoreDoc } from '@/lib/unit-lore';

describe('unit-lore loader', () => {
  it('finds a doc that exists (griffin sample)', () => {
    expect(hasUnitLoreDoc('griffin')).toBe(true);
  });

  it('returns false for a unit without a long-form doc', () => {
    expect(hasUnitLoreDoc('definitely-no-such-unit')).toBe(false);
  });
});
