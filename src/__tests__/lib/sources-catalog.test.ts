/**
 * Каталог произведений-первоисточников (/encyclopedia/sources) — валидность
 * данных src/data/sources-catalog.json. Фаза 4i (2026-08-30): лор-сводки
 * рассказов игроков переехали из Истории в каталог; записи реестра №1–16
 * получили публичные карточки с описанием и списком «→ взято».
 */
import {
  KIND_STAMPS,
  SOURCES_CATALOG_SECTIONS,
  getCatalogBySection,
  getSourcesCatalog,
} from '@/lib/sources-catalog';

const catalog = getSourcesCatalog();

describe('sources-catalog: структура записей', () => {
  it('в каталоге 23 произведения (16 из реестра + 7 рассказов игроков)', () => {
    expect(catalog).toHaveLength(23);
    expect(catalog.filter((e) => e.kind === 'story')).toHaveLength(7);
  });

  it('id уникальны, slug-формат', () => {
    const ids = catalog.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('у каждой записи валидные title/kind/description/takenTo и section из списка', () => {
    const sectionIds = new Set(SOURCES_CATALOG_SECTIONS.map((s) => s.id));
    const kinds = Object.keys(KIND_STAMPS);
    for (const e of catalog) {
      expect(`${e.id}: ${e.title.length > 3 ? 'title ok' : 'КОРОТКО'}`).toBe(`${e.id}: title ok`);
      expect(kinds).toContain(e.kind);
      expect(sectionIds.has(e.section)).toBe(true);
      // Описание — сжатая сводка, 2–4 предложения (допуск до 6 у рассказов)
      const sentences = e.description.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(sentences.length).toBeLessThanOrEqual(6);
      // «→ взято в энциклопедию» — непустой список непустых строк
      expect(e.takenTo.length).toBeGreaterThanOrEqual(1);
      for (const item of e.takenTo) expect(item.length).toBeGreaterThan(3);
    }
  });

  it('year — число; url — http(s); loreAuthor — валидная ось provenance', () => {
    const loreAuthors = new Set(['tehnolog', 'star_system', 'universestarsys', 'ai', 'avb']);
    for (const e of catalog) {
      if (e.year !== undefined) expect(Number.isInteger(e.year)).toBe(true);
      if (e.url !== undefined) expect(e.url).toMatch(/^https?:\/\//);
      if (e.loreAuthor !== undefined) expect(loreAuthors.has(e.loreAuthor)).toBe(true);
    }
  });
});

describe('sources-catalog: рассказы игроков', () => {
  const stories = catalog.filter((e) => e.kind === 'story');

  it('у каждого рассказа есть author и url на robogear.ru', () => {
    for (const s of stories) {
      expect(`${s.id}: ${s.author ?? 'БЕЗ АВТОРА'}`).toBe(`${s.id}: ${s.author}`);
      expect((s.author ?? '').length).toBeGreaterThan(2);
      expect(s.url).toMatch(/^http:\/\/www\.robogear\.ru\/skelet\/6\/story_\d+\.php$/);
    }
  });

  it('семь рассказов «Клуба Robogear» — известные авторы и работы', () => {
    expect(stories.map((s) => s.id)).toEqual([
      'krasnaya-yarost', 'seryy-leytenant', 'domashnyaya-voyna', 'general',
      'istoriya-odnogo-soldata', 'put-voyna', 'mayndfaytery',
    ]);
    const authors = new Set(stories.map((s) => s.author));
    for (const a of ['Rasher', 'Ervin', 'Chebur', 'Анатолий', 'Найтрос']) {
      expect(authors.has(a)).toBe(true);
    }
    // Майндфайтеры: три части рассказа — одна запись, url на первую страницу
    const mind = stories.find((s) => s.id === 'mayndfaytery')!;
    expect(mind.url).toBe('http://www.robogear.ru/skelet/6/story_16.php');
  });

  it('сводки рассказов сообщают и сюжет, и вклад во вселенную (3–5 предложений)', () => {
    for (const s of stories) {
      const sentences = s.description.split(/(?<=[.!?])\s+/).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(3);
      expect(sentences.length).toBeLessThanOrEqual(5);
    }
  });
});

describe('sources-catalog: секции страницы /encyclopedia/sources', () => {
  it('четыре секции в порядке вывода, каждая непустая', () => {
    const grouped = getCatalogBySection();
    expect(grouped.map((g) => g.section.id)).toEqual([
      'official', 'vchertischev', 'vk', 'players',
    ]);
    expect(grouped.map((g) => g.entries.length)).toEqual([7, 4, 5, 7]);
    for (const g of grouped) expect(g.entries.length).toBeGreaterThan(0);
    // Группировка без потерь и дублей
    const flat = grouped.flatMap((g) => g.entries);
    expect(flat.map((e) => e.id).sort()).toEqual(catalog.map((e) => e.id).sort());
  });

  it('у каждого типа произведения есть гриф (// РОМАН, // ХРОНИКА, // РАССКАЗ…)', () => {
    for (const [kind, stamp] of Object.entries(KIND_STAMPS)) {
      expect(stamp).toMatch(/^[А-ЯЁ]+$/);
    }
    // Используемые kind покрыты грифами карты (не story-виды не обязаны все встречаться)
    for (const e of catalog) expect(KIND_STAMPS[e.kind]).toBeDefined();
  });

  it('ключевые произведения реестра присутствуют', () => {
    const titles = catalog.map((e) => e.title).join('|');
    for (const t of [
      'Летопись: Звёздные герои',
      'Битва за Велиан',
      'Имперские войны',
      'Косары',
      'Штурмовики Протектората',
      'Роботех',
    ]) {
      expect(titles).toContain(t);
    }
  });
});
