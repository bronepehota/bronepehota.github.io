import { getHeightBonusEnabled } from '@/components/toggles/HeightBonusToggle';

describe('getHeightBonusEnabled', () => {
  const KEY = 'bronepehota_height_bonus_enabled';

  afterEach(() => {
    localStorage.removeItem(KEY);
  });

  it('returns false when unset', () => {
    localStorage.removeItem(KEY);
    expect(getHeightBonusEnabled()).toBe(false);
  });

  it('returns true when set to "true"', () => {
    localStorage.setItem(KEY, 'true');
    expect(getHeightBonusEnabled()).toBe(true);
  });

  it('returns false when set to "false"', () => {
    localStorage.setItem(KEY, 'false');
    expect(getHeightBonusEnabled()).toBe(false);
  });
});
