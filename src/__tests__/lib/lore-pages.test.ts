/**
 * Бюджет поискового индекса лора (lorePages). Тела документов уезжают на
 * клиент ОБЕИМ поисковым поверхностям (хаб + каталог) — их суммарный размер
 * осознанно ограничен. Комментарий у buildLorePages обещает «~130KB»; после
 * волн досье факт — ~180KB: этот тест фиксирует границы, чтобы рост был
 * решением (поднять цифру), а не ползучей деградацией пейлоада.
 */
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { buildLorePages } from '@/lib/lore-pages';
import type { LorePageRef } from '@/lib/unit-search';

describe('lore-pages: бюджет поискового индекса', () => {
  let pages: LorePageRef[] = [];

  beforeAll(async () => {
    pages = buildLorePages(await getAllUnits());
  });

  it('каждая запись несёт title/href/kind', () => {
    expect(pages.length).toBeGreaterThan(100);
    for (const p of pages) {
      expect(p.title).toBeTruthy();
      expect(p.href).toMatch(/^\//);
      expect(p.kind).toBeTruthy();
    }
  });

  it('суммарный размер тел в бюджете (≤ 220 000 знаков)', () => {
    const total = pages.reduce((sum, p) => sum + (p.body?.length ?? 0), 0);
    // Факт на 2026-08-31: ~179К. Порог = факт + запас на пару досье;
    // рост дальше — осознанное решение (поднять порог или сжать toSearchBody).
    expect(total).toBeLessThanOrEqual(220_000);
  });

  it('число страниц в бюджете (≤ 150)', () => {
    // Факт: ~130 (главы + кампании + миссии + unit-lore + world).
    expect(pages.length).toBeLessThanOrEqual(150);
  });
});
