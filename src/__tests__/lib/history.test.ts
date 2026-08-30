import {
  buildHistoryFlow,
  estimateReadingMinutes,
  getAllHistoryChapters,
  historyCentury,
  type HistoryChapterMeta,
} from '@/lib/history';

describe('history chapters', () => {
  const chapters = getAllHistoryChapters();

  it('возвращает 15 глав, отсортированные по order', () => {
    // 22 → 15 (2026-08-30): 7 лор-записей рассказов игроков убраны из Истории —
    // сводки живут каталогом /encyclopedia/sources (решение владельца).
    expect(chapters).toHaveLength(15);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('группы «Творчество игроков» больше нет — максимальный order 15', () => {
    expect(chapters.some((c) => (c.order ?? 99) >= 100)).toBe(false);
    expect(chapters.every((c) => c.group === undefined || c.group === 'Справочник')).toBe(true);
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
});

describe('«ДЕЛО RG-4530» showcase helpers (Phase 2)', () => {
  const chapters = getAllHistoryChapters();

  it('historyCentury: век последней эры — 45 (главы дают 4530, войны продлевают до 4546)', () => {
    expect(historyCentury(chapters)).toBe(45);
    expect(historyCentury(chapters, '4451–4546')).toBe(45);
  });

  it('buildHistoryFlow: лента эпох = 6 лет + СПРАВОЧНИК + ВОЙНЫ', () => {
    const flow = buildHistoryFlow(chapters);
    expect(flow.ticks.map((t) => t.label)).toEqual([
      '1908', '2398', '2437', '2862', '3001', '4451',
      'СПРАВОЧНИК', 'ВОЙНЫ',
    ]);
    // Era ticks jump straight to the era-opening chapter anchors
    expect(flow.ticks[0]).toMatchObject({ href: '#tungusskiy-artefakt', kind: 'era' });
    expect(flow.ticks[5]).toMatchObject({ href: '#dve-sily', kind: 'era' });
    // Group ticks jump to their in-flow divider anchors
    const refZone = flow.zones.find((z) => z.divider.stamp === 'СПРАВОЧНИК')!;
    expect(flow.ticks[6].kind).toBe('group');
    expect(flow.ticks[6].href).toBe(`#${refZone.divider.anchorId}`);
    expect(flow.ticks[7]).toMatchObject({ href: '#wars', kind: 'wars' });
    expect(flow.warsZoneIndex).toBe(7);
  });

  it('buildHistoryFlow: зоны непрерывно покрывают все 15 глав + замыкающая зона войн', () => {
    const flow = buildHistoryFlow(chapters);
    // 6 эр + справочная групповая + войн; главы 08–11 (без эры) наследуют зону 4451
    expect(flow.zones.map((z) => z.slugs)).toEqual([
      ['tungusskiy-artefakt'],
      ['setka-mayakov'],
      ['velikaya-expansiya', 'razvedkorpus'],
      ['propavshaya-zemlya'],
      ['liga-i-dominion'],
      [
        'dve-sily', 'ekipirovka-pehoty-dominiona', 'konversiya-raskol-regentstvo',
        'flot-epokhi-regentstva', 'legendarnye-imperskie-lordy',
      ],
      ['kosmografiya-dominiona', 'politicheskoe-ustroystvo', 'sravnenie-voennykh-struktur', 'polyaris-perevorot'],
      [], // войн зона — оборачивает <CampaignsBlock>, не главы
    ]);
    // Каждая глава попала ровно в одну зону, порядок сохранён
    const zipped = flow.zones.flatMap((z) => z.slugs);
    expect(zipped).toEqual(chapters.map((c) => c.slug));
    // Индексы тиков у зон уникальны и плотны (зона N ↔ тик N ленты 1:1)
    expect(flow.zones.map((z) => z.tickIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('buildHistoryFlow: разделители — контурный год эры на стыках, групповые штампы', () => {
    const flow = buildHistoryFlow(chapters);
    // Первый разделитель двойной: контурный 1908 + штамп ХРОНИКА (группа без своей зоны)
    expect(flow.zones[0].divider).toMatchObject({ stamp: 'ХРОНИКА', outline: '1908' });
    expect(flow.zones[1].divider).toMatchObject({ outline: '2398' });
    expect(flow.zones[2].divider).toMatchObject({ outline: '2437' });
    expect(flow.zones[3].divider).toMatchObject({ outline: '2862' });
    expect(flow.zones[4].divider).toMatchObject({ outline: '3001' });
    expect(flow.zones[5].divider).toMatchObject({ stamp: 'ЭПОХА 4451–4530', outline: '4451' });
    expect(flow.zones[6].divider).toMatchObject({
      stamp: 'СПРАВОЧНИК', outline: '§', anchorId: 'history-anchor-6',
    });
    expect(flow.zones[7].divider).toMatchObject({ stamp: 'ВОЙНЫ', outline: '†' });
    // Штампы эр (кроме первого ХРОНИКА) повторяют era-строку главы
    expect(flow.zones[2].divider.stamp).toBe('ЭПОХА 2437–2862');
  });

  it('estimateReadingMinutes: ~160 слов в минуту, HTML-теги не считаются', () => {
    const words = '<p>слово</p>'.repeat(1600).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean);
    const html = words.join(' ');
    expect(estimateReadingMinutes([html])).toBe(10);
    expect(estimateReadingMinutes(['<h3>заголовок</h3> без слов'])).toBe(1);
  });
});

describe('buildHistoryFlow — защитные ветки безэройных глав', () => {
  const meta = (slug: string, extra: Partial<HistoryChapterMeta> = {}): HistoryChapterMeta => ({
    slug,
    title: slug,
    ...extra,
  });

  it('(a) поток, начинающийся главой без era/group: глава не выпадает — зона ХРОНИКА без контурного года', () => {
    const flow = buildHistoryFlow([meta('bez-epochi'), meta('s-epokhoy', { era: '3001–3100' })]);
    // Era-less opener opens its own zone instead of vanishing (zones was empty)
    expect(flow.zones[0].slugs).toEqual(['bez-epochi']);
    expect(flow.zones[0].divider).toMatchObject({ outline: '//', stamp: 'ХРОНИКА' });
    expect(flow.zones[0].divider.outline).not.toMatch(/\d{4}/);
    expect(flow.ticks[0]).toMatchObject({ label: 'ХРОНИКА', href: '#bez-epochi', kind: 'era' });
    // Following era still cuts its own zone; full coverage, in order
    expect(flow.zones.map((z) => z.slugs)).toEqual([['bez-epochi'], ['s-epokhoy'], []]);
    expect(flow.zones.flatMap((z) => z.slugs)).toEqual(['bez-epochi', 's-epokhoy']);
  });

  it('(b) группа → хроника без эры: зона ХРОНИКА, а не TypeError из groupDividerVisual', () => {
    const flow = buildHistoryFlow([
      meta('epokha', { era: '1908–2398' }),
      meta('spravka', { group: 'Справочник' }),
      meta('hronika-bez-ery'),
    ]);
    expect(flow.zones.map((z) => z.divider.stamp)).toEqual([
      'ХРОНИКА', 'СПРАВОЧНИК', 'ХРОНИКА', 'ВОЙНЫ',
    ]);
    expect(flow.zones[2].divider).toMatchObject({ outline: '//', stamp: 'ХРОНИКА' });
    expect(flow.zones[2].slugs).toEqual(['hronika-bez-ery']);
    expect(flow.zones.flatMap((z) => z.slugs)).toEqual(['epokha', 'spravka', 'hronika-bez-ery']);
  });
});
