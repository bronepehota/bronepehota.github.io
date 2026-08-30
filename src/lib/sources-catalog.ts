/**
 * Sources Catalog — каталог произведений-первоисточников энциклопедии.
 *
 * Единая публичная витрина «что мы читали» для /encyclopedia/sources: книга →
 * краткое описание + что именно из неё взято в энциклопедию (takenTo).
 * Реестр разработчика (файлы, инвентаризация, решения по атрибуции) живёт
 * в docs/ENCYCLOPEDIA_LORE_SOURCES.md — в prod-сборку не входит.
 *
 * Данные: src/data/sources-catalog.json (паттерн factions.json).
 * loreAuthor — та же ось, что на кредит-чипах сущностей (src/lib/provenance.ts):
 * рассказы игроков и книги V.Chertischev несут «avb» (мини-АВБ-марка).
 */

import catalogJson from '@/data/sources-catalog.json';
import type { LoreSource } from './provenance';

/** Тип произведения — определяет гриф карточки («// РОМАН», «// ХРОНИКА»…). */
export type SourceKind =
  | 'novel'
  | 'chronicle'
  | 'handbook'
  | 'rules'
  | 'collection'
  | 'story'
  | 'game';

/** Секции каталога — порядок вывода на /encyclopedia/sources. */
export type CatalogSectionId = 'official' | 'vchertischev' | 'vk' | 'players';

export interface CatalogEntry {
  id: string;
  /** Секция каталога (см. CatalogSectionId). */
  section: CatalogSectionId;
  title: string;
  /** Именной автор (книги V.Chertischev, рассказы игроков); у официальных
   *  безымянных изданий отсутствует — паттерн «Летописи». */
  author?: string;
  /** Год издания (известен не у всех). */
  year?: number;
  kind: SourceKind;
  /** Внутримировая эпоха произведения («4451–4528», «Эпоха Регентства»). */
  era?: string;
  /** Org-level автор текста — ось мини-АВБ-марки (provenance.ts). */
  loreAuthor?: LoreSource;
  /** 2–4 предложения: что это и что дало вселенной. */
  description: string;
  /** Куда перенесено в энциклопедию (список «→ взято»). */
  takenTo: string[];
  /** Внешняя ссылка на первоисточник (рассказы robogear.ru). */
  url?: string;
}

/** Гриф карточки по типу произведения (без «// » — добавляется в UI). */
export const KIND_STAMPS: Record<SourceKind, string> = {
  novel: 'РОМАН',
  chronicle: 'ХРОНИКА',
  handbook: 'СПРАВОЧНИК',
  rules: 'ПРАВИЛА',
  collection: 'СБОРНИК',
  story: 'РАССКАЗ',
  game: 'ИГРА',
};

/** Порядок и заголовки секций каталога. */
export const SOURCES_CATALOG_SECTIONS: Array<{
  id: CatalogSectionId;
  title: string;
  note: string;
}> = [
  {
    id: 'official',
    title: 'Официальные издания',
    note: 'Канон «Технолога»: хроники, справочники и наборы игры',
  },
  {
    id: 'vchertischev',
    title: 'Книги V.Chertischev',
    note: 'Независимый автор вселенной — романы и книги о войсках',
  },
  {
    id: 'vk',
    title: 'Материалы сообществ (VK)',
    note: 'Справочники, сборники и статьи сообществ Star System и Мёртвого Флота',
  },
  {
    id: 'players',
    title: 'Творчество игроков robogear.ru',
    note: 'Рассказы «Клуба Robogear» — сводки: о сюжете и что дала вселенной',
  },
];

const ENTRIES = catalogJson as CatalogEntry[];

/** Полный каталог в порядке следования JSON (секции идут блоками). */
export function getSourcesCatalog(): CatalogEntry[] {
  return ENTRIES;
}

/** Каталог, сгруппированный по секциям в порядке вывода (для страницы). */
export function getCatalogBySection(): Array<{
  section: (typeof SOURCES_CATALOG_SECTIONS)[number];
  entries: CatalogEntry[];
}> {
  return SOURCES_CATALOG_SECTIONS.map((section) => ({
    section,
    entries: ENTRIES.filter((e) => e.section === section.id),
  }));
}
