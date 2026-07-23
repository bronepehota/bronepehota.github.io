import { getCredit, CREDITS } from '../lib/painted-images';

describe('getCredit', () => {
  it('returns the credit for a valid id', () => {
    const c = getCredit('lisitsin');
    expect(c).toBeDefined();
    expect(c?.name).toBe('Миниатюры Лисицина');
    expect(c?.logo).toBe('/images/credits/lisitsin.jpg');
  });

  it('returns undefined for an unknown id', () => {
    expect(getCredit('unknown')).toBeUndefined();
    expect(getCredit('lisitzin')).toBeUndefined(); // typo
  });

  it('returns credits for all PhotoSource keys', () => {
    const ids = Object.keys(CREDITS);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    ids.forEach(id => {
      expect(getCredit(id)).toBeDefined();
    });
  });
});
