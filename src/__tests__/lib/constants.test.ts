import { describe, it, expect } from '@jest/globals';
import {
  LOCAL_STORAGE_KEYS,
  DEFAULT_POINT_BUDGETS,
  FACTIONS,
  MAX_SOLDIERS_PER_SQUAD,
  MAX_WEAPONS_PER_MACHINE,
  DICE_TYPES
} from '@/lib/constants';

describe('constants', () => {
  describe('BASE_PATH', () => {
    it('should be empty when NEXT_PUBLIC_GITHUB_PAGES is not set', () => {
      // In test environment, NEXT_PUBLIC_GITHUB_PAGES is not set
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BASE_PATH } = require('@/lib/constants');
      expect(BASE_PATH).toBe('');
    });

    it('should contain /bronepehota when NEXT_PUBLIC_GITHUB_PAGES is true', () => {
      // Set env var before importing
      process.env.NEXT_PUBLIC_GITHUB_PAGES = 'true';
      // Clear require cache to re-import with new env
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BASE_PATH } = require('@/lib/constants');
      expect(BASE_PATH).toBe('/bronepehota');
      // Clean up
      delete process.env.NEXT_PUBLIC_GITHUB_PAGES;
      jest.resetModules();
    });
  });
  describe('LOCAL_STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(LOCAL_STORAGE_KEYS.ARMY).toBe('bronepehota_army');
      expect(LOCAL_STORAGE_KEYS.RULES_VERSION).toBe('bronepehota_rules_version');
      expect(LOCAL_STORAGE_KEYS.PANIC_ENABLED).toBe('bronepehota_panic_enabled');
      expect(LOCAL_STORAGE_KEYS.AIMED_SHOT_ENABLED).toBe('bronepehota_aimed_shot_enabled');
      expect(LOCAL_STORAGE_KEYS.SURPRISE_ATTACK_ENABLED).toBe('bronepehota_surprise_attack_enabled');
      expect(LOCAL_STORAGE_KEYS.STRICT_PILOT_RANK_ENABLED).toBe('bronepehota_strict_pilot_rank_enabled');
    });

    it('should have correct types (as const provides compile-time readonly)', () => {
      // as const ensures TypeScript treats these as readonly literals
      // Note: Runtime immutability would require Object.freeze()
      expect(typeof LOCAL_STORAGE_KEYS.ARMY).toBe('string');
      expect(Object.keys(LOCAL_STORAGE_KEYS)).toHaveLength(6);
    });
  });

  describe('DEFAULT_POINT_BUDGETS', () => {
    it('should contain expected budgets', () => {
      expect(DEFAULT_POINT_BUDGETS).toEqual([250, 350, 500, 1000]);
    });
  });

  describe('FACTIONS', () => {
    it('should contain all factions', () => {
      expect(FACTIONS).toEqual(['polaris', 'protectorate', 'mercenaries']);
    });
  });

  describe('Game limits', () => {
    it('should define correct limits', () => {
      expect(MAX_SOLDIERS_PER_SQUAD).toBe(6);
      expect(MAX_WEAPONS_PER_MACHINE).toBe(4);
    });
  });

  describe('DICE_TYPES', () => {
    it('should contain all dice types', () => {
      expect(DICE_TYPES).toEqual(['D6', 'D12', 'D20']);
    });
  });
});
