import { describe, it, expect } from '@jest/globals';
import { getFactionColors, factionDisplayNames } from '@/lib/faction-colors';
import type { FactionID } from '@/lib/types';

describe('faction-colors', () => {
  describe('getFactionColors', () => {
    it('should return correct colors for polaris faction', () => {
      const colors = getFactionColors('polaris');
      expect(colors).toEqual({
        text: 'text-red-400',
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        glow: 'shadow-red-500/20',
        primary: '#ef4444',
        borderSolid: 'border-red-500',
        bgSolid: 'bg-red-500',
        progress: 'bg-red-500',
        accent: 'border-red-500',
      });
    });

    it('should return correct colors for protectorate faction', () => {
      const colors = getFactionColors('protectorate');
      expect(colors).toEqual({
        text: 'text-cyan-400',
        border: 'border-cyan-500/50',
        bg: 'bg-cyan-500/10',
        glow: 'shadow-cyan-500/20',
        primary: '#06b6d4',
        borderSolid: 'border-cyan-500',
        bgSolid: 'bg-cyan-500',
        progress: 'bg-cyan-500',
        accent: 'border-cyan-500',
      });
    });

    it('should return correct colors for mercenaries faction', () => {
      const colors = getFactionColors('mercenaries');
      expect(colors).toEqual({
        text: 'text-yellow-400',
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/10',
        glow: 'shadow-yellow-500/20',
        primary: '#eab308',
        borderSolid: 'border-yellow-500',
        bgSolid: 'bg-yellow-500',
        progress: 'bg-yellow-500',
        accent: 'border-yellow-500',
      });
    });

    it('should return polaris colors for unknown faction', () => {
      const colors = getFactionColors('unknown' as FactionID);
      expect(colors).toEqual(getFactionColors('polaris'));
    });
  });

  describe('factionDisplayNames', () => {
    it('should return correct display names', () => {
      expect(factionDisplayNames.polaris).toBe('Полярис');
      expect(factionDisplayNames.protectorate).toBe('Протекторат');
      expect(factionDisplayNames.mercenaries).toBe('Наёмники');
    });
  });
});
