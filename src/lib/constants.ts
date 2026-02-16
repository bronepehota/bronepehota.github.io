import type { FactionID } from './types';

export const LOCAL_STORAGE_KEYS = {
  ARMY: 'bronepehota_army',
  RULES_VERSION: 'bronepehota_rules_version',
  PANIC_ENABLED: 'bronepehota_panic_enabled',
  AIMED_SHOT_ENABLED: 'bronepehota_aimed_shot_enabled',
  SURPRISE_ATTACK_ENABLED: 'bronepehota_surprise_attack_enabled',
} as const;

export const DEFAULT_POINT_BUDGETS = [250, 350, 500, 1000];

export const FACTIONS: FactionID[] = ['polaris', 'protectorate', 'mercenaries'];

export const MAX_SOLDIERS_PER_SQUAD = 6;
export const MAX_WEAPONS_PER_MACHINE = 4;

export const DICE_TYPES = ['D6', 'D12', 'D20'] as const;
