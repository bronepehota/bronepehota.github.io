/**
 * Типы для редактора пользовательских армлистов
 */

import type { SourceID } from '@/lib/types';
import type { BuffDefinition } from '@/lib/modifier-types';
import type { CalculatorSoldierParams } from '@/lib/calculator-engine';

/**
 * Упрощённый интерфей фракции для пользовательских источников
 */
export interface CustomFaction {
  id: string;
  name: string;
  color: string;
  description?: string;
  /** Фракция из базового источника (для расширений) */
  isFromBase?: boolean;
}

/**
 * Пользовательский источник армлиста
 */
export interface CustomSource {
  id: string;
  name: string;
  description: string;
  version: string;
  /** Базовый источник для расширения (null = создан с нуля) */
  baseSource: SourceID | null;
  /** Версия базового источника (для предупреждений о несовместимости) */
  baseSourceVersion?: string;
  /** Фракции */
  factions: CustomFaction[];
  /** Отряды */
  squads: CustomSquad[];
  /** Техника */
  machines: CustomMachine[];
  /** Скрытые юниты из базового источника (IDs) */
  hiddenUnits?: string[];
  /** ISO дата создания */
  createdAt: string;
  /** ISO дата обновления */
  updatedAt: string;
}

/**
 * Расширенный отряд с опциональными полями
 */
export interface CustomSquad {
  id: string;
  name: string;
  shortName?: string;
  faction: string;
  cost: number;
  image?: string;
  soldiers: CustomSoldier[];
  buffs?: BuffDefinition[];
  calculatorParams?: CalculatorSoldierParams[];
}

/**
 * Расширенный солдат с опциональными полями
 */
export interface CustomSoldier {
  num?: number;
  rank: number;
  speed: number;
  range: string;
  power: string;
  melee: number;
  armor: number;
  image?: string;
  modifiers?: string[];  // Modifier IDs from catalog (see applyTo for target types)
}

/**
 * Расширенная машина с опциональными полями
 */
export interface CustomMachine {
  id: string;
  name: string;
  shortName?: string;
  faction: string;
  cost: number;
  rank: number;
  fire_rate: number;
  ammo_max: number;
  durability_max: number;
  image?: string;
  weapons: CustomWeapon[];
  speed_sectors: CustomSpeedSector[];
  buffs?: BuffDefinition[];
}

/**
 * Оружие с опциональными полями
 */
export interface CustomWeapon {
  name: string;
  range: string;
  power: string;
  ammo?: number;
  special?: {
    type: 'aoe' | 'repair' | 'burst';
    radius?: number;
    damage?: string;
    amount?: number;
    range?: number;
    count?: number;
    directions?: string[];
  } | string;
}

/**
 * Сектор скорости
 */
export interface CustomSpeedSector {
  min_durability: number;
  max_durability: number;
  speed: number;
}

/**
 * Результат валидации
 */
export interface ValidationResult {
  valid: boolean;
  warnings: ValidationWarning[];
}

/**
 * Предупреждение валидации
 */
export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Метаданные источника для списка
 */
export interface SourceListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'new' | 'extension';
  baseSource?: string;
  unitCount: number;
  factionCount: number;
  createdAt: string;
  updatedAt: string;
}
