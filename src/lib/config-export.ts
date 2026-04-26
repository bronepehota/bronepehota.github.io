import { CustomSource } from '@/lib/editor/types';
import { CustomModifiersData } from '@/lib/editor/modifier-storage';

export const CURRENT_CONFIG_VERSION = 1;

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

  const mods = data.modifiers as Record<string, unknown>;
  if (!mods || typeof mods !== 'object') {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  if (!Array.isArray(mods.buffs) || !Array.isArray(mods.debuffs)) {
    return { valid: false, error: 'Файл повреждён или имеет неверный формат' };
  }

  return {
    valid: true,
    data: data as ConfigExportEnvelope['data'],
  };
}