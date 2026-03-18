/**
 * Генерация ID для пользовательских источников и юнитов
 */

import { nanoid } from 'nanoid';

/**
 * Генерирует ID для нового источника
 * Формат: custom_{8 случайных символов}
 * Пример: custom_x7Kp2mNq
 */
export function generateSourceId(): string {
  return `custom_${nanoid(8)}`;
}

/**
 * Генерирует ID для нового юнита (отряда или техники)
 * Формат: {faction_id}_custom_{slugified_name}
 * Пример: polaris_custom_elite_snipers
 */
export function generateUnitId(factionId: string, name: string): string {
  const slug = slugify(name);
  return `${factionId}_custom_${slug}`;
}

/**
 * Генерирует ID для новой фракции
 * Формат: custom_{slugified_name}
 * Пример: custom_mercenary_elite
 */
export function generateFactionId(name: string): string {
  const slug = slugify(name);
  return `custom_${slug}`;
}

/**
 * Преобразует строку в slug
 * - В нижний регистр
 * - Только буквенно-цифровые символы и дефисы
 * - Пробелы заменяются на дефисы
 * - Русские буквы транслитерируются
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Транслитерация русских букв
    .replace(/а/g, 'a')
    .replace(/б/g, 'b')
    .replace(/в/g, 'v')
    .replace(/г/g, 'g')
    .replace(/д/g, 'd')
    .replace(/е/g, 'e')
    .replace(/ё/g, 'yo')
    .replace(/ж/g, 'zh')
    .replace(/з/g, 'z')
    .replace(/и/g, 'i')
    .replace(/й/g, 'y')
    .replace(/к/g, 'k')
    .replace(/л/g, 'l')
    .replace(/м/g, 'm')
    .replace(/н/g, 'n')
    .replace(/о/g, 'o')
    .replace(/п/g, 'p')
    .replace(/р/g, 'r')
    .replace(/с/g, 's')
    .replace(/т/g, 't')
    .replace(/у/g, 'u')
    .replace(/ф/g, 'f')
    .replace(/х/g, 'kh')
    .replace(/ц/g, 'ts')
    .replace(/ч/g, 'ch')
    .replace(/ш/g, 'sh')
    .replace(/щ/g, 'sch')
    .replace(/ъ/g, '')
    .replace(/ы/g, 'y')
    .replace(/ь/g, '')
    .replace(/э/g, 'e')
    .replace(/ю/g, 'yu')
    .replace(/я/g, 'ya')
    // Удаление не-буквенно-цифровых символов (кроме дефисов)
    .replace(/[^a-z0-9-]/g, '-')
    // Удаление повторяющихся дефисов
    .replace(/-+/g, '-')
    // Удаление дефисов в начале и конце
    .replace(/^-|-$/g, '');
}

/**
 * Проверяет, является ли ID пользовательским
 */
export function isCustomId(id: string): boolean {
  return id.startsWith('custom_') || id.includes('_custom_');
}

/**
 * Извлекает базовый ID юнита из переопределяющего ID
 * Если юнит новый (содержит _custom_), возвращает null
 */
export function extractBaseUnitId(unitId: string): string | null {
  if (!unitId.includes('_custom_')) {
    return unitId;
  }
  return null;
}
