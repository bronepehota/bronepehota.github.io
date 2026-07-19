import { describe, it, expect } from '@jest/globals';
import { getFactionColors, factionDisplayNames, factionLogos } from '@/lib/faction-colors';

/**
 * Coverage for the rutenia faction's color palette, display name, and logo
 * entry. The existing `faction-colors.test.ts` only asserts the polaris /
 * protectorate / mercenaries triple — rutenia was added later as the Buffer
 * Zone faction (orange), so it gets its own spec to keep the assertions
 * discoverable when the palette changes.
 */
describe('faction-colors — rutenia', () => {
  it("getFactionColors('rutenia') returns the orange palette", () => {
    const colors = getFactionColors('rutenia');
    expect(colors.text).toBe('text-orange-400');
    expect(colors.primary).toBe('#ea580c');
  });

  it("factionDisplayNames.rutenia === 'Рутения'", () => {
    expect(factionDisplayNames.rutenia).toBe('Рутения');
  });

  it('factionLogos has all 4 faction keys (sorted)', () => {
    // `factionLogos` is a Partial<Record<FactionID, string>>, so its keys reflect
    // exactly which factions ship a logo PNG. All four core factions must be present.
    const keys = Object.keys(factionLogos).sort();
    expect(keys).toEqual(['mercenaries', 'polaris', 'protectorate', 'rutenia']);
  });
});
