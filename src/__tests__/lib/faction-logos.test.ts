import { describe, it, expect } from '@jest/globals';
import { factionLogos } from '@/lib/faction-colors';

/**
 * `factionLogos` is consumed by FactionLogo, the alliance badge in UnitSelector,
 * and the encyclopedia faction pages. A missing key silently renders nothing
 * (no crash, just an invisible logo), so this spec pins down the contract:
 * every core faction has a logo path that points under /images/factions/.
 */
describe('factionLogos', () => {
  const EXPECTED_FACTIONS = ['dead_fleet', 'mercenaries', 'polaris', 'protectorate', 'rutenia', 'snow_wolves'] as const;

  it('has all 6 faction keys', () => {
    const keys = Object.keys(factionLogos).sort();
    expect(keys).toEqual([...EXPECTED_FACTIONS].sort());
  });

  for (const faction of EXPECTED_FACTIONS) {
    it(`factionLogos.${faction} is a non-empty string under /images/factions/`, () => {
      const logo = factionLogos[faction];
      expect(typeof logo).toBe('string');
      expect(logo!.length).toBeGreaterThan(0);
      expect(logo!.startsWith('/images/factions/')).toBe(true);
    });
  }
});
