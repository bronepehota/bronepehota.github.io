import { describe, it, expect } from '@jest/globals';
import { hasLoreExpansion, formatBattleYear, getLocationIcon } from '@/lib/lore-utils';
import type { Location } from '@/lib/types';

describe('lore-utils', () => {
  describe('hasLoreExpansion', () => {
    it('should return false when encyclopedia is undefined', () => {
      expect(hasLoreExpansion(undefined)).toBe(false);
    });

    it('should return false when encyclopedia has no expansion fields', () => {
      const encyclopedia = {};
      expect(hasLoreExpansion(encyclopedia)).toBe(false);
    });

    it('should return true when encyclopedia has traditions', () => {
      const encyclopedia = {
        traditions: 'Каждый воин проходит ритуал инициации.'
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });

    it('should return true when encyclopedia has non-empty keyBattles array', () => {
      const encyclopedia = {
        keyBattles: [
          {
            name: 'Битва при Полярисе',
            year: '3450 год',
            description: 'Великое сражение',
            outcome: 'Победа'
          }
        ]
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });

    it('should return false when encyclopedia has empty keyBattles array', () => {
      const encyclopedia = {
        keyBattles: []
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(false);
    });

    it('should return true when encyclopedia has non-empty locations array', () => {
      const encyclopedia = {
        locations: [
          {
            name: 'Академия',
            type: 'academy' as Location['type'],
            description: 'Тренировочный центр'
          }
        ]
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });

    it('should return false when encyclopedia has empty locations array', () => {
      const encyclopedia = {
        locations: []
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(false);
    });

    it('should return true when encyclopedia has all expansion fields', () => {
      const encyclopedia = {
        traditions: 'Священные ритуалы',
        keyBattles: [
          {
            name: 'Осада',
            year: '3400 год',
            description: 'Долгая осада',
            outcome: 'Успех'
          }
        ],
        locations: [
          {
            name: 'База',
            type: 'base' as Location['type'],
            description: 'Главная база'
          }
        ]
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });
  });

  describe('formatBattleYear', () => {
    it('should return the year string as-is (placeholder implementation)', () => {
      expect(formatBattleYear('3410 год')).toBe('3410 год');
      expect(formatBattleYear('Эпоха Expansion, 3412 год')).toBe('Эпоха Expansion, 3412 год');
      expect(formatBattleYear('3455')).toBe('3455');
    });

    // TODO: Add tests when formatBattleYear is fully implemented
    // it('should strip " год" suffix when implemented', () => {
    //   expect(formatBattleYear('3410 год')).toBe('3410');
    // });
  });

  describe('getLocationIcon', () => {
    it('should return house emoji for base type', () => {
      expect(getLocationIcon('base')).toBe('🏠');
    });

    it('should return graduation cap emoji for academy type', () => {
      expect(getLocationIcon('academy')).toBe('🎓');
    });

    it('should return crossed swords emoji for battlefield type', () => {
      expect(getLocationIcon('battlefield')).toBe('⚔️');
    });

    it('should return globe emoji for homeworld type', () => {
      expect(getLocationIcon('homeworld')).toBe('🌍');
    });

    it('should return pin emoji for unknown type', () => {
      expect(getLocationIcon('unknown' as Location['type'])).toBe('📍');
      expect(getLocationIcon('port' as Location['type'])).toBe('📍');
      expect(getLocationIcon('tavern' as Location['type'])).toBe('📍');
    });
  });
});
