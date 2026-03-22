/**
 * Storage for custom modifiers (user-created buffs and debuffs).
 * Uses localStorage with JSON export/import support.
 */

import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { BuffDefinition, DebuffTemplate } from '@/lib/modifier-types';

const STORAGE_KEY = LOCAL_STORAGE_KEYS.CUSTOM_MODIFIERS;

export interface CustomModifiersData {
  buffs: BuffDefinition[];
  debuffs: DebuffTemplate[];
}

/**
 * Get all custom modifiers from localStorage.
 */
export function getCustomModifiers(): CustomModifiersData {
  if (typeof window === 'undefined') return { buffs: [], debuffs: [] };

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { buffs: [], debuffs: [] };

    const parsed = JSON.parse(data);
    return {
      buffs: Array.isArray(parsed.buffs) ? parsed.buffs : [],
      debuffs: Array.isArray(parsed.debuffs) ? parsed.debuffs : [],
    };
  } catch (error) {
    console.error('Failed to load custom modifiers:', error);
    return { buffs: [], debuffs: [] };
  }
}

/**
 * Save all custom modifiers to localStorage.
 */
export function saveCustomModifiers(data: CustomModifiersData): void {
  if (typeof window === 'undefined') {
    throw new Error('Storage not available');
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save custom modifiers:', error);
    throw new Error('Не удалось сохранить модификаторы');
  }
}

/**
 * Add a custom buff.
 */
export function addCustomBuff(buff: BuffDefinition): void {
  const data = getCustomModifiers();
  // Replace if same ID exists, otherwise add
  const idx = data.buffs.findIndex(b => b.id === buff.id);
  if (idx >= 0) {
    data.buffs[idx] = buff;
  } else {
    data.buffs.push(buff);
  }
  saveCustomModifiers(data);
}

/**
 * Remove a custom buff by ID.
 */
export function removeCustomBuff(id: string): void {
  const data = getCustomModifiers();
  data.buffs = data.buffs.filter(b => b.id !== id);
  saveCustomModifiers(data);
}

/**
 * Add a custom debuff template.
 */
export function addCustomDebuff(debuff: DebuffTemplate): void {
  const data = getCustomModifiers();
  const idx = data.debuffs.findIndex(d => d.id === debuff.id);
  if (idx >= 0) {
    data.debuffs[idx] = debuff;
  } else {
    data.debuffs.push(debuff);
  }
  saveCustomModifiers(data);
}

/**
 * Remove a custom debuff by ID.
 */
export function removeCustomDebuff(id: string): void {
  const data = getCustomModifiers();
  data.debuffs = data.debuffs.filter(d => d.id !== id);
  saveCustomModifiers(data);
}

/**
 * Export custom modifiers as JSON string.
 */
export function exportCustomModifiers(): string {
  const data = getCustomModifiers();
  return JSON.stringify(data, null, 2);
}

/**
 * Import custom modifiers from JSON string.
 * Merges with existing: adds new, replaces by ID if conflict.
 */
export function importCustomModifiers(jsonStr: string): { added: number; updated: number; errors: string[] } {
  const result = { added: 0, updated: 0, errors: [] as string[] };

  try {
    const imported = JSON.parse(jsonStr) as CustomModifiersData;
    const current = getCustomModifiers();

    // Merge buffs
    if (Array.isArray(imported.buffs)) {
      for (const buff of imported.buffs) {
        if (!buff.id || !buff.name || !buff.target) {
          result.errors.push(`Некорректный баф: ${buff.id || 'без ID'}`);
          continue;
        }
        const idx = current.buffs.findIndex(b => b.id === buff.id);
        if (idx >= 0) {
          current.buffs[idx] = { ...buff, isCustom: true };
          result.updated++;
        } else {
          current.buffs.push({ ...buff, isCustom: true });
          result.added++;
        }
      }
    }

    // Merge debuffs
    if (Array.isArray(imported.debuffs)) {
      for (const debuff of imported.debuffs) {
        if (!debuff.id || !debuff.name || !debuff.target) {
          result.errors.push(`Некорректный дебаф: ${debuff.id || 'без ID'}`);
          continue;
        }
        const idx = current.debuffs.findIndex(d => d.id === debuff.id);
        if (idx >= 0) {
          current.debuffs[idx] = { ...debuff, isCustom: true };
          result.updated++;
        } else {
          current.debuffs.push({ ...debuff, isCustom: true });
          result.added++;
        }
      }
    }

    saveCustomModifiers(current);
  } catch {
    result.errors.push('Некорректный JSON');
  }

  return result;
}

/**
 * Check if storage is available.
 */
export function isStorageAvailable(): boolean {
  return typeof window !== 'undefined';
}
