import { getAllHistoryChapters } from '@/lib/history';

describe('history chapters', () => {
  const chapters = getAllHistoryChapters();

  it('возвращает 24 главы, отсортированные по order', () => {
    expect(chapters).toHaveLength(24);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('справочные секции Star Heroes: order 12–15, группа «Справочник», без эры', () => {
    const ref = chapters.filter((c) => {
      const o = c.order ?? 99;
      return o >= 12 && o <= 15;
    });
    expect(ref).toHaveLength(4);
    expect(ref.map((c) => c.slug)).toEqual([
      'kosmografiya-dominiona',
      'politicheskoe-ustroystvo',
      'sravnenie-voennykh-struktur',
      'polyaris-perevorot',
    ]);
    for (const c of ref) {
      expect(`${c.slug}: ${c.group}`).toBe(`${c.slug}: Справочник`);
      expect(c.era).toBeUndefined();
      expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      expect(c.credit).toEqual({ work: 'Летопись: Звёздные герои' });
    }
  });

  it('первая глава — Тунгусский артефакт, восьмая — экипировка пехоты', () => {
    expect(chapters[0]?.slug).toBe('tungusskiy-artefakt');
    expect(chapters[7]?.slug).toBe('ekipirovka-pehoty-dominiona');
  });

  it('главы 9–11 — «Новейшая история Империи»: tehnolog, кредит издания без автора', () => {
    const empire = chapters.filter((c) => {
      const o = c.order ?? 99;
      return o >= 9 && o <= 11;
    });
    expect(empire).toHaveLength(3);
    expect(empire.map((c) => c.slug)).toEqual([
      'konversiya-raskol-regentstvo',
      'flot-epokhi-regentstva',
      'legendarnye-imperskie-lordy',
    ]);
    for (const c of empire) {
      expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      expect(c.credit).toEqual({ work: 'Новейшая история Империи' });
    }
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

  it('рассказы игроков: order 100+, группа, avb + именной кредит с URL', () => {
    const stories = chapters.filter((c) => (c.order ?? 99) >= 100);
    expect(stories).toHaveLength(9);
    for (const s of stories) {
      expect(`${s.slug}: ${s.group}`).toBe(`${s.slug}: Творчество игроков`);
      expect(`${s.slug}: ${s.loreAuthor}`).toBe(`${s.slug}: avb`);
      expect(s.credit?.author?.length).toBeGreaterThan(2);
      expect(s.credit?.url).toMatch(/^http:\/\/www\.robogear\.ru\/skelet\/6\//);
      expect(s.credit?.work).toBe(s.title);
    }
    expect(stories.map((s) => s.slug)).toEqual([
      'krasnaya-yarost', 'seryy-leytenant', 'domashnyaya-voyna', 'general',
      'istoriya-odnogo-soldata', 'put-voyna',
      'mayndfaytery-1', 'mayndfaytery-2', 'mayndfaytery-3',
    ]);
  });
});
