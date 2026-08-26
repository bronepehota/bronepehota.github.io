import type { FactionID } from './types';

// Canonical site origin INCLUDING basePath — used for absolute URLs in
// sitemap.xml, canonical links, Open Graph / Twitter images.
// Override with NEXT_PUBLIC_SITE_URL when moving to a custom domain
// (e.g. https://bronepehota.ru — no basePath). Defaults to the GitHub Pages URL.
// NOTE: use || not ?? — deploy.yml renders an ABSENT secret as '' (empty string);
// ?? passes '' through → new URL('') crashes the build. || treats '' as unset.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true'
    ? 'https://luxor.github.io/bronepehota'
    : 'http://localhost:3000');

// basePath = the subpath the site is mounted at, read from SITE_URL's pathname.
// '' when served from a domain/account ROOT (custom domain like
// https://bronepehota.ru, or a User/Org Pages root like https://bronepehota.github.io);
// '/bronepehota' only for the legacy Project Pages subpath (luxor.github.io/bronepehota).
// A single env var (NEXT_PUBLIC_SITE_URL) controls origin + mount point.
// Must match next.config.mjs BASE_PATH value.
let parsedBasePath = '';
try {
  parsedBasePath = new URL(SITE_URL).pathname.replace(/\/+$/, '');
} catch {
  parsedBasePath = '';
}
export const BASE_PATH = parsedBasePath;

// Yandex.Metrica counter id (numeric string). Optional — component no-ops without it.
export const YANDEX_METRICA_ID = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

// Google Analytics 4 measurement id. Optional — component no-ops without it.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

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
  ANALYTICS_QUEUE: 'bronepehota_analytics_queue',
} as const;

export const DEFAULT_POINT_BUDGETS = [250, 350, 500, 1000];

export const FACTIONS: FactionID[] = ['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet', 'snow_wolves'];

export const MAX_SOLDIERS_PER_SQUAD = 6;
export const MAX_WEAPONS_PER_MACHINE = 4;

export const DICE_TYPES = ['D6', 'D12', 'D20'] as const;
