import {
  buildHistoryFlow,
  estimateReadingMinutes,
  getAllHistoryChapters,
  historyCentury,
} from '@/lib/history';

describe('history chapters', () => {
  const chapters = getAllHistoryChapters();

  it('возвращает 22 главы, отсортированные по order', () => {
    expect(chapters).toHaveLength(22);
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

  it('лор-сведения из творчества игроков: order 100–106, группа, avb + именной кредит с URL', () => {
    const stories = chapters.filter((c) => (c.order ?? 99) >= 100);
    expect(stories).toHaveLength(7);
    expect(stories.map((s) => s.order)).toEqual([100, 101, 102, 103, 104, 105, 106]);
    for (const s of stories) {
      expect(`${s.slug}: ${s.group}`).toBe(`${s.slug}: Творчество игроков`);
      expect(`${s.slug}: ${s.loreAuthor}`).toBe(`${s.slug}: avb`);
      expect(s.credit?.author?.length).toBeGreaterThan(2);
      expect(s.credit?.url).toMatch(/^http:\/\/www\.robogear\.ru\/skelet\/6\//);
      expect(s.credit?.work).toBe(s.title);
    }
    expect(stories.map((s) => s.slug)).toEqual([
      'krasnaya-yarost', 'seryy-leytenant', 'domashnyaya-voyna', 'general',
      'istoriya-odnogo-soldata', 'put-voyna', 'mayndfaytery',
    ]);
    // Майндфайтеры: три части рассказа — одна лор-запись, кредит на первую страницу
    const mind = stories.find((s) => s.slug === 'mayndfaytery')!;
    expect(mind.credit?.work).toBe('Майндфайтеры');
    expect(mind.credit?.url).toBe('http://www.robogear.ru/skelet/6/story_16.php');
  });
});

describe('«ДЕЛО RG-4530» showcase helpers (Phase 2)', () => {
  const chapters = getAllHistoryChapters();

  it('historyCentury: век последней эры — 45 (главы дают 4530, войны продлевают до 4546)', () => {
    expect(historyCentury(chapters)).toBe(45);
    expect(historyCentury(chapters, '4451–4546')).toBe(45);
  });

  it('buildHistoryFlow: лента эпох = 6 лет + СПРАВОЧНИК + ФОНД ПИСАТЕЛЬСТВ + ВОЙНЫ', () => {
    const flow = buildHistoryFlow(chapters);
    expect(flow.ticks.map((t) => t.label)).toEqual([
      '1908', '2398', '2437', '2862', '3001', '4451',
      'СПРАВОЧНИК', 'ФОНД ПИСАТЕЛЬСТВ', 'ВОЙНЫ',
    ]);
    // Era ticks jump straight to the era-opening chapter anchors
    expect(flow.ticks[0]).toMatchObject({ href: '#tungusskiy-artefakt', kind: 'era' });
    expect(flow.ticks[5]).toMatchObject({ href: '#dve-sily', kind: 'era' });
    // Group ticks jump to their in-flow divider anchors
    const refZone = flow.zones.find((z) => z.divider.stamp === 'СПРАВОЧНИК')!;
    expect(flow.ticks[6].kind).toBe('group');
    expect(flow.ticks[6].href).toBe(`#${refZone.divider.anchorId}`);
    expect(flow.ticks[7].kind).toBe('group');
    expect(flow.ticks[8]).toMatchObject({ href: '#wars', kind: 'wars' });
    expect(flow.warsZoneIndex).toBe(8);
  });

  it('buildHistoryFlow: зоны непрерывно покрывают все 22 главы + замыкающая зона войн', () => {
    const flow = buildHistoryFlow(chapters);
    // 6 эр + 2 групповые + войн; главы 08–11 (без эры) наследуют зону 4451
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
      ['krasnaya-yarost', 'seryy-leytenant', 'domashnyaya-voyna', 'general',
        'istoriya-odnogo-soldata', 'put-voyna', 'mayndfaytery'],
      [], // войн зона — оборачивает <CampaignsBlock>, не главы
    ]);
    // Каждая глава попала ровно в одну зону, порядок сохранён
    const zipped = flow.zones.flatMap((z) => z.slugs);
    expect(zipped).toEqual(chapters.map((c) => c.slug));
    // Индексы тиков у зон уникальны и плотны (зона N ↔ тик N ленты 1:1)
    expect(flow.zones.map((z) => z.tickIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
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
    expect(flow.zones[7].divider).toMatchObject({
      stamp: 'ФОНД ПИСАТЕЛЬСТВ', outline: '//', sub: '// Творчество игроков',
      anchorId: 'history-anchor-7',
    });
    expect(flow.zones[8].divider).toMatchObject({ stamp: 'ВОЙНЫ', outline: '†' });
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
