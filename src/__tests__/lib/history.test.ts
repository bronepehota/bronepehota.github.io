import { getAllHistoryChapters } from '@/lib/history';

describe('history chapters', () => {
  const chapters = getAllHistoryChapters();

  it('возвращает 8 глав, отсортированных по order', () => {
    expect(chapters).toHaveLength(8);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('первая глава — Тунгусский артефакт, восьмая — экипировка пехоты', () => {
    expect(chapters[0]?.slug).toBe('tungusskiy-artefakt');
    expect(chapters[7]?.slug).toBe('ekipirovka-pehoty-dominiona');
  });

  it('каждая глава имеет title', () => {
    for (const c of chapters) expect(c.title.length).toBeGreaterThan(3);
  });
});
