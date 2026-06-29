import { CustomSource } from '@/lib/editor/types';
import { CustomModifiersData } from '@/lib/editor/modifier-storage';

export const CURRENT_CONFIG_VERSION = 1;

/** Reject configs larger than this before JSON.parse (memory-exhaustion guard). */
export const MAX_CONFIG_BYTES = 5_000_000; // 5 MB

/** Keys that enable prototype pollution when the object is later spread/merged. */
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'] as const;

/** Remove prototype-pollution keys from an object (in place). */
function stripDangerousKeys<T extends object>(obj: T): T {
  for (const key of DANGEROUS_KEYS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      delete (obj as Record<string, unknown>)[key];
    }
  }
  return obj;
}

/** Minimal shape check: a source must have a non-empty string `id` and a string `name`. */
function isValidSourceShape(src: unknown): src is Record<string, unknown> {
  if (!src || typeof src !== 'object') return false;
  const s = src as Record<string, unknown>;
  return typeof s.id === 'string' && s.id.length > 0 && typeof s.name === 'string';
}

export interface ConfigExportEnvelope {
  version: number;
  type: 'bronepehota_config';
  exportedAt: string;
  data: {
    sources: CustomSource[];
    modifiers: CustomModifiersData;
  };
}

export function createConfigEnvelope(
  sources: CustomSource[],
  modifiers: CustomModifiersData
): ConfigExportEnvelope {
  return {
    version: CURRENT_CONFIG_VERSION,
    type: 'bronepehota_config',
    exportedAt: new Date().toISOString(),
    data: { sources, modifiers },
  };
}

export function generateConfigFileName(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `bronepehota_config_${date}.json`;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: ConfigExportEnvelope['data'];
}

export function validateConfigEnvelope(jsonString: string): ValidationResult {
  if (jsonString.length > MAX_CONFIG_BYTES) {
    return { valid: false, error: 'Файл слишком большой (более 5 МБ)' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.type !== 'bronepehota_config') {
    return { valid: false, error: 'Это не файл настроек Бронепехоты' };
  }

  if (typeof obj.version !== 'number' || obj.version > CURRENT_CONFIG_VERSION) {
    return { valid: false, error: 'Обновите приложение для поддержки этого формата' };
  }

  if (!obj.data || typeof obj.data !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  const data = obj.data as Record<string, unknown>;
  if (!Array.isArray(data.sources)) {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }
  for (const src of data.sources) {
    if (!isValidSourceShape(src)) {
      return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
    }
  }

  const mods = data.modifiers as Record<string, unknown>;
  if (!mods || typeof mods !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  if (!Array.isArray(mods.buffs) || !Array.isArray(mods.debuffs)) {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  // Defense-in-depth: strip prototype-pollution keys from everything we hand back,
  // so later `{...src}` / `{...buff}` spreads can't poison Object.prototype.
  for (const src of data.sources) stripDangerousKeys(src);
  for (const b of mods.buffs) if (b && typeof b === 'object') stripDangerousKeys(b);
  for (const d of mods.debuffs) if (d && typeof d === 'object') stripDangerousKeys(d);

  return {
    valid: true,
    data: data as ConfigExportEnvelope['data'],
  };
}