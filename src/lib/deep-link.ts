// src/lib/deep-link.ts
import { Army } from './types';

/** Имя URL-параметра deep-link-моста «энциклопедия → приложение». */
export const FACTION_PARAM = 'faction';

/**
 * Достать ?faction= из search-строки и провалидировать по списку фракций
 * текущего источника. Невалидное/пустое значение → null (молча игнорируем).
 */
export function parseFactionParam(search: string, validFactions: string[]): string | null {
  if (!search) return null;
  const value = new URLSearchParams(search).get(FACTION_PARAM);
  if (!value) return null;
  return validFactions.includes(value) ? value : null;
}

/**
 * Решение о применении deep-link к армии: только «свежая» армия
 * (без юнитов и не в бою) — армию вернувшегося игрока не перезаписываем.
 */
export function factionParamToApply(
  search: string,
  army: Pick<Army, 'units' | 'isInBattle'>,
  validFactions: string[],
): string | null {
  if (army.units.length > 0 || army.isInBattle) return null;
  return parseFactionParam(search, validFactions);
}
