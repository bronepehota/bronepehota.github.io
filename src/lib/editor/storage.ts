/**
 * Storage abstraction для пользовательских армлистов
 * Текущая реализация: localStorage
 * Будущее: Firestore adapter
 */

import { CustomSource } from './types';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { getSource } from '@/lib/sources-registry';

const STORAGE_KEY = LOCAL_STORAGE_KEYS.CUSTOM_SOURCES;

/**
 * Класс для работы с хранилищем пользовательских источников
 */
export class CustomSourcesStorage {
  private storage: typeof localStorage | null = null;

  constructor() {
    // Проверяем доступность localStorage
    if (typeof window !== 'undefined') {
      this.storage = localStorage;
    }
  }

  /**
   * Получить все пользовательские источники
   */
  getAll(): CustomSource[] {
    if (!this.storage) return [];

    try {
      const data = this.storage.getItem(STORAGE_KEY);
      if (!data) return [];

      const sources = JSON.parse(data);
      return Array.isArray(sources) ? sources : [];
    } catch (error) {
      console.error('Failed to load custom sources:', error);
      return [];
    }
  }

  /**
   * Получить источник по ID
   */
  getById(id: string): CustomSource | null {
    const sources = this.getAll();
    return sources.find(s => s.id === id) || null;
  }

  /**
   * Сохранить источник (создать или обновить)
   */
  save(source: CustomSource): void {
    if (!this.storage) {
      throw new Error('Storage not available');
    }

    const sources = this.getAll();
    const existingIndex = sources.findIndex(s => s.id === source.id);

    // Обновляем timestamp
    const now = new Date().toISOString();
    const updatedSource = {
      ...source,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      // Обновление существующего
      sources[existingIndex] = {
        ...updatedSource,
        createdAt: sources[existingIndex].createdAt,
      };
    } else {
      // Создание нового
      sources.push({
        ...updatedSource,
        createdAt: now,
      });
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(sources));
    } catch (error) {
      console.error('Failed to save custom source:', error);
      throw new Error('Failed to save: storage quota exceeded');
    }
  }

  /**
   * Удалить источник по ID
   */
  delete(id: string): void {
    if (!this.storage) return;

    const sources = this.getAll();
    const filtered = sources.filter(s => s.id !== id);

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete custom source:', error);
      throw new Error('Failed to delete source');
    }
  }

  /**
   * Экспорт источника в JSON строку
   * Переопределённые юниты (с тем же ID, что в базе) не включаются в экспорт
   */
  exportToJson(source: CustomSource): string {
    let squads = source.squads;
    let machines = source.machines;

    // Если это расширение, фильтруем переопределённые юниты
    if (source.baseSource) {
      const baseData = getSource(source.baseSource);
      if (baseData) {
        const baseSquadIds = new Set(baseData.squads.map(s => s.id));
        const baseMachineIds = new Set(baseData.machines.map(m => m.id));

        // Исключаем переопределённые отряды (с тем же ID, что в базе)
        squads = source.squads.filter(s => !baseSquadIds.has(s.id));
        // Исключаем переопределённую технику (с тем же ID, что в базе)
        machines = source.machines.filter(m => !baseMachineIds.has(m.id));
      }
    }

    // Создаём экспортируемую версию источника
    const exportData = {
      ...source,
      squads,
      machines,
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Импорт источника из JSON строки
   * @throws Error если JSON невалидный или не соответствует схеме
   */
  importFromJson(json: string): CustomSource {
    let source: Record<string, unknown>;

    try {
      source = JSON.parse(json);
    } catch {
      throw new Error('Invalid JSON format');
    }

    // Базовая валидация структуры
    if (!this.isValidSource(source)) {
      throw new Error('Invalid source structure');
    }

    return source as CustomSource;
  }

  /**
   * Проверка наличия источника с таким ID
   */
  exists(id: string): boolean {
    return this.getById(id) !== null;
  }

  /**
   * Получить количество источников
   */
  count(): number {
    return this.getAll().length;
  }

  /**
   * Очистить все пользовательские источники
   */
  clear(): void {
    if (!this.storage) return;
    this.storage.removeItem(STORAGE_KEY);
  }

  /**
   * Базовая валидация структуры источника
   */
  private isValidSource(data: unknown): data is CustomSource {
    if (!data || typeof data !== 'object') return false;

    const source = data as Record<string, unknown>;

    // Обязательные поля
    const requiredFields = ['id', 'name', 'version', 'factions', 'squads', 'machines'];
    for (const field of requiredFields) {
      if (!(field in source)) return false;
    }

    // Типы полей
    if (typeof source.id !== 'string') return false;
    if (typeof source.name !== 'string') return false;
    if (typeof source.version !== 'string') return false;
    if (!Array.isArray(source.factions)) return false;
    if (!Array.isArray(source.squads)) return false;
    if (!Array.isArray(source.machines)) return false;

    return true;
  }
}

// Singleton instance
let storageInstance: CustomSourcesStorage | null = null;

/**
 * Получить singleton instance хранилища
 */
export function getCustomSourcesStorage(): CustomSourcesStorage {
  if (!storageInstance) {
    storageInstance = new CustomSourcesStorage();
  }
  return storageInstance;
}
