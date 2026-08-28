// src/__tests__/app/app-layout.test.ts
import { metadata } from '@/app/app/layout';

describe('метаданные /app', () => {
  it('короткий тайтл штаба', () => {
    expect(metadata.title).toBe('Штаб — Бронепехота');
  });
});
