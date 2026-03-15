/**
 * Типы для редактора пользовательских армлистов
 */

import type { SourceID } from '@/lib/types';

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
  /** ISO дата создания */
  createdAt: string;
  /** ISO дата обновления */
  updatedAt: string;
}

/**
 * Чанк данных для QR-кода
 */
export interface QrChunk {
  /** Номер части (1-based) */
  index: number;
  /** Всего частей */
  total: number;
  /** Данные чанка */
  data: string;
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
  props: string[];
  armor: number;
  image?: string;
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
 * Состоя импорта QR
 */
export interface QrImportState {
  chunks: Map<number, QrChunk>;
  total: number;
  received: number;
  complete: boolean;
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
