// src/__tests__/lib/text-format.test.ts
import { splitParagraphs, normalizeRussianTypography } from '@/lib/text-format';

describe('splitParagraphs', () => {
  it('пустые значения → []', () => {
    expect(splitParagraphs(undefined)).toEqual([]);
    expect(splitParagraphs(null)).toEqual([]);
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs('   ')).toEqual([]);
  });
  it('одиночный абзац без переносов', () => {
    expect(splitParagraphs('Ракетная самоходка-ветеран.')).toEqual(['Ракетная самоходка-ветеран.']);
  });
  it('режет по \\n\\n, триммит и выкидывает пустые', () => {
    expect(splitParagraphs('Первый.\n\n\n  Второй.  \n\n\n\nТретий.'))
      .toEqual(['Первый.', 'Второй.', 'Третий.']);
  });
  it('одиночный \\n НЕ разрывает абзац (внутристрочный перенос)', () => {
    expect(splitParagraphs('строка одна\nстрока две')).toEqual(['строка одна\nстрока две']);
  });
  it('\\r\\n нормализуется до разреза', () => {
    expect(splitParagraphs('А.\r\n\r\nБ.')).toEqual(['А.', 'Б.']);
  });
});

describe('normalizeRussianTypography', () => {
  it('парные прямые кавычки → «ёлочки»', () => {
    expect(normalizeRussianTypography('Пушка «Алебарда» стоит "много"')).toBe('Пушка «Алебарда» стоит «много»');
  });
  it('дефис между пробелами → длинное тире', () => {
    expect(normalizeRussianTypography('броня - тонкая')).toBe('броня — тонкая');
  });
  it('многоточие из трёх точек → …', () => {
    expect(normalizeRussianTypography('и всё...')).toBe('и всё…');
  });
  it('двойные пробелы → одинарные; трим', () => {
    expect(normalizeRussianTypography('  слово  слово ')).toBe('слово слово');
  });
  it('дефис в составных словах НЕ трогает', () => {
    expect(normalizeRussianTypography('самоходная установка Mk12-А')).toBe('самоходная установка Mk12-А');
  });
  it('диапазоны чисел с дефисом НЕ трогает', () => {
    expect(normalizeRussianTypography('ракеты 3-5 км')).toBe('ракеты 3-5 км');
  });
});
