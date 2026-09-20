import type { BuffDefinition } from './modifier-types';
import { getStandardCatalog } from './modifier-utils';

/**
 * Классические спец-свойства взводов (Пр4, Пр5, Рм) выводятся из каталога
 * модификаторов по названию отряда — без копий каталога в данных каждого
 * взвода (владелец 2026-09-20: «ничего не надо обновлять и переносить, всё
 * уже есть в данных; не дублируем — вытаскиваем из модификаторов»).
 *
 * Правило намеренно именное и простое:
 *   «кибер»          → Пр5 (прыжковой ускоритель на 5е)
 *   «фелиц»          → Рм  (ремонт техники)
 *   «штурмовая клон» → Пр4 (прыжковой ускоритель на 4е)
 *
 * Определения берутся из standard-modifiers.json как есть (semantика
 * oneTimeUse/описания/иконки — единственный источник истины). Действует
 * на все источники (star_system, tehnolog): правило — по названию.
 */
const CLASSIC_PROP_RULES: Array<[pattern: RegExp, buffId: string]> = [
  [/кибер/i, 'jump_boost_5'],
  [/фелиц/i, 'mechanic'],
  [/штурмовая клон/i, 'jump_boost_4'],
];

export function getClassicProps(squadName?: string): BuffDefinition[] {
  if (!squadName) return [];
  const ids = CLASSIC_PROP_RULES
    .filter(([pattern]) => pattern.test(squadName))
    .map(([, buffId]) => buffId);
  if (ids.length === 0) return [];
  return getStandardCatalog().buffs.filter(
    b => ids.includes(b.id) && b.target === 'custom'
  );
}

/**
 * Бафы-шаблоны взвода + выведенные классические свойства, без дублей по id:
 * явно заданные в данных бафы приоритетнее (кастомные описания не затираем).
 */
export function withClassicProps(
  buffs: BuffDefinition[] | undefined,
  squadName?: string,
): BuffDefinition[] {
  const base = buffs || [];
  const have = new Set(base.map(b => b.id));
  const derived = getClassicProps(squadName).filter(b => !have.has(b.id));
  return derived.length > 0 ? [...base, ...derived] : base;
}
