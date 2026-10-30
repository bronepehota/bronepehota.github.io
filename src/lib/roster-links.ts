/**
 * Связка свободных текстов турнирных протоколов с энциклопедией.
 *
 * Принцип: строгие совпадения без ложных ссылок — не совпало, остаётся
 * текстом. Фракции протокола маппятся явно (словарь), составы матчатся
 * по нормализованным именам юнитов (уникальность обязательна).
 */
import type { EncyclopediaUnit } from './encyclopedia-registry';

/** Фракция протокола → id фракции приложения (для якоря на /encyclopedia/factions#id). */
const FACTION_LINKS: Record<string, string> = {
  ИМПЕРИЯ: 'polaris',
  ПРОТЕКТОРАТ: 'protectorate',
  НАЕМНИКИ: 'mercenaries',
  ВОЛКИ: 'snow_wolves',
  РУТЕНИЯ: 'rutenia',
  МФ: 'dead_fleet',
};

/** id фракции для строки протокола («ИМПЕРИЯ», «Наёмники»…) или undefined. */
export function factionLink(faction: string): string | undefined {
  return FACTION_LINKS[faction.trim().toUpperCase().replace('Ё', 'Е')];
}

/** Нормализация имени: нижний регистр, ё→е, без небуквенных символов. */
export function normalizeUnitName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');
}

/** Компактный индекс имен юнитов для матчинга (строится на рендер страницы). */
export function buildUnitIndex(units: Array<Pick<EncyclopediaUnit, 'id' | 'name'>>): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const u of units) {
    const key = normalizeUnitName(u.name);
    if (!key) continue;
    const arr = index.get(key);
    if (arr) arr.push(u.id);
    else index.set(key, [u.id]);
  }
  return index;
}

/** Разбивка состава на элементы с разделителями (запятая/точка с запятой). */
export function splitComposition(composition: string): Array<{ text: string; sep: string }> {
  const parts = composition.split(/([;,])/);
  const tokens: Array<{ text: string; sep: string }> = [];
  for (let i = 0; i < parts.length; i += 2) {
    const text = parts[i].trim();
    if (!text) continue;
    tokens.push({ text, sep: (parts[i + 1] ?? '') + ' ' });
  }
  return tokens;
}

/** Снятие служебных пометок протокола: (Т)/(Л)/(нов)/(стар.), *N, хвостовые числа. */
function stripMarkers(item: string): string {
  return item
    .replace(/\((?:т|л|нов|стар\.?|стар|нов\??)\)\s*$/gi, '')
    .replace(/\(\s*[-–]?\s*\)\s*$/g, '')
    .replace(/\*+\s*\d*\s*$/g, '')
    .replace(/\s+\d+\s*$/g, '');
}

/** id юнита для элемента состава: точное или уникальное префиксное совпадение
 *  нормализованного имени. Неоднозначные и короткие совпадения отбрасываются. */
export function matchUnitName(item: string, index: Map<string, string[]>): string | undefined {
  const normalized = normalizeUnitName(stripMarkers(item));
  if (normalized.length < 3) return undefined;
  const exact = index.get(normalized);
  if (exact) return exact.length === 1 ? exact[0] : undefined;
  // Префиксное: элемент — префикс имени или имя — префикс элемента (уникально).
  // forEach, не for-of: tsconfig es5 без downlevelIteration (см. src/lib/rating.ts).
  let found: string | undefined;
  let ambiguous = false;
  index.forEach((ids, key) => {
    if (key.length < 5 || (!(key.startsWith(normalized) || normalized.startsWith(key)))) return;
    if (found !== undefined || ids.length !== 1) {
      ambiguous = true;
      return;
    }
    found = ids[0];
  });
  return ambiguous ? undefined : found;
}

export interface CompositionPart {
  text: string;
  sep: string;
  unitId?: string;
}

/** Состав → части с проставленными id юнитов (для линковки в UI). */
export function linkComposition(
  composition: string,
  index: Map<string, string[]>,
): CompositionPart[] {
  return splitComposition(composition).map(({ text, sep }) => ({
    text,
    sep,
    unitId: matchUnitName(text, index),
  }));
}
