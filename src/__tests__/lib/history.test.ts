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

  it('главы 1–7 — «Летопись» (loreAuthor tehnolog, кредит конкретного издания без автора)', () => {
    const letopis = chapters.filter((c) => (c.order ?? 99) <= 7);
    expect(letopis).toHaveLength(7);
    for (const c of letopis) {
      expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      expect(c.credit).toEqual({ work: 'Летопись: Звёздные герои' });
    }
  });

  it('глава 8 (пехота Доминиона) — из «Косарей»: avb + кредит V.Chertischev', () => {
    const ch8 = chapters.find((c) => c.slug === 'ekipirovka-pehoty-dominiona')!;
    expect(ch8.loreAuthor).toBe('avb');
    expect(ch8.credit?.author).toBe('V.Chertischev');
    expect(ch8.credit?.work).toBe('Косары');
  });
});
