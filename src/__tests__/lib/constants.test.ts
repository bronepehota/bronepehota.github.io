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

    it('should drop /bronepehota when a custom domain is set via NEXT_PUBLIC_SITE_URL', () => {
      process.env.NEXT_PUBLIC_GITHUB_PAGES = 'true';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bronepehota.ru';
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BASE_PATH, SITE_URL } = require('@/lib/constants');
      // Custom domain → served from domain root, no subpath prefix
      expect(BASE_PATH).toBe('');
      expect(SITE_URL).toBe('https://bronepehota.ru');
      // Clean up
      delete process.env.NEXT_PUBLIC_GITHUB_PAGES;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      jest.resetModules();
    });

    it('should keep /bronepehota when SITE_URL is still the github.io origin', () => {
      process.env.NEXT_PUBLIC_GITHUB_PAGES = 'true';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://luxor.github.io/bronepehota';
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BASE_PATH } = require('@/lib/constants');
      expect(BASE_PATH).toBe('/bronepehota');
      // Clean up
      delete process.env.NEXT_PUBLIC_GITHUB_PAGES;
      delete process.env.NEXT_PUBLIC_SITE_URL;
      jest.resetModules();
    });

    it('should drop basePath for a User/Org Pages root (bronepehota.github.io)', () => {
      process.env.NEXT_PUBLIC_GITHUB_PAGES = 'true';
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bronepehota.github.io';
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BASE_PATH, SITE_URL } = require('@/lib/constants');
      // Served from the account root — no subpath prefix
      expect(BASE_PATH).toBe('');
      expect(SITE_URL).toBe('https://bronepehota.github.io');
      // Clean up
      delete process.env.NEXT_PUBLIC_GITHUB_PAGES;
      delete process.env.NEXT_PUBLIC_SITE_URL;
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
      expect(LOCAL_STORAGE_KEYS.DISTANCE_INPUT_UNIT).toBe('bronepehota_distance_input_unit');
      expect(LOCAL_STORAGE_KEYS.STEP_TO_CM_FACTOR).toBe('bronepehota_step_to_cm_factor');
      expect(LOCAL_STORAGE_KEYS.AUTO_COMPLETE_ENABLED).toBe('bronepehota_auto_complete_enabled');
      expect(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE).toBe('bronepehota_army_list_source');
      expect(LOCAL_STORAGE_KEYS.CUSTOM_SOURCES).toBe('bronepehota_custom_sources');
      expect(LOCAL_STORAGE_KEYS.EDITOR_SHOW_BASE_UNITS).toBe('bronepehota_editor_show_base_units');
      expect(LOCAL_STORAGE_KEYS.SETUP_STEP).toBe('bronepehota_setup_step');
    });

    it('should have correct types (as const provides compile-time readonly)', () => {
      // as const ensures TypeScript treats these as readonly literals
      // Note: Runtime immutability would require Object.freeze()
      expect(typeof LOCAL_STORAGE_KEYS.ARMY).toBe('string');
      expect(Object.keys(LOCAL_STORAGE_KEYS)).toHaveLength(15);
    });
  });

  describe('DEFAULT_POINT_BUDGETS', () => {
    it('should contain expected budgets', () => {
      expect(DEFAULT_POINT_BUDGETS).toEqual([250, 350, 500, 1000]);
    });
  });

  describe('FACTIONS', () => {
    it('should contain all factions', () => {
      expect(FACTIONS).toEqual(['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet']);
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
