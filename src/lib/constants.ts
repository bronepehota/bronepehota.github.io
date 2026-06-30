import type { FactionID } from './types';

// Base path for GitHub Pages deployment
// Must match next.config.mjs BASE_PATH value
// NEXT_PUBLIC_GITHUB_PAGES is set in deploy.yml and available in client code
export const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/bronepehota' : '';

export const LOCAL_STORAGE_KEYS = {
  ARMY: 'bronepehota_army',
  RULES_VERSION: 'bronepehota_rules_version',
  PANIC_ENABLED: 'bronepehota_panic_enabled',
  AIMED_SHOT_ENABLED: 'bronepehota_aimed_shot_enabled',
  SURPRISE_ATTACK_ENABLED: 'bronepehota_surprise_attack_enabled',
  HEIGHT_BONUS_ENABLED: 'bronepehota_height_bonus_enabled',
  STRICT_PILOT_RANK_ENABLED: 'bronepehota_strict_pilot_rank_enabled',
  DISTANCE_INPUT_UNIT: 'bronepehota_distance_input_unit',
  STEP_TO_CM_FACTOR: 'bronepehota_step_to_cm_factor',
  AUTO_COMPLETE_ENABLED: 'bronepehota_auto_complete_enabled',
  ARMY_LIST_SOURCE: 'bronepehota_army_list_source',
  CUSTOM_SOURCES: 'bronepehota_custom_sources',
  EDITOR_SHOW_BASE_UNITS: 'bronepehota_editor_show_base_units',
  SETUP_STEP: 'bronepehota_setup_step',
  CUSTOM_MODIFIERS: 'bronepehota_custom_modifiers',
} as const;

export const DEFAULT_POINT_BUDGETS = [250, 350, 500, 1000];

export const FACTIONS: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

export const MAX_SOLDIERS_PER_SQUAD = 6;
export const MAX_WEAPONS_PER_MACHINE = 4;

export const DICE_TYPES = ['D6', 'D12', 'D20'] as const;
