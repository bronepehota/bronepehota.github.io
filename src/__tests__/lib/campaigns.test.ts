import { getAllCampaigns, unitCampaigns, warsEraSpan } from '@/lib/campaigns';

describe('campaigns loader', () => {
  it('discovers the Корпоративные войны campaign', () => {
    const all = getAllCampaigns();
    expect(all.length).toBeGreaterThan(0);
    const hv2 = all.find((c) => c.slug === 'korporativnye-voyny');
    expect(hv2).toBeDefined();
    expect(hv2!.title).toBe('Корпоративные войны');
  });

  it('parses units and missions frontmatter', () => {
    const hv2 = getAllCampaigns().find((c) => c.slug === 'korporativnye-voyny')!;
    expect(hv2.units?.length).toBeGreaterThan(0);
    expect(
      hv2.units?.some((u) => u.id === 'protectorate_tyazhyolaya_shturmovaya_pehota_veliana')
    ).toBe(true);
    expect(hv2.missions?.length).toBe(4);
  });

  it('sorts campaigns by order', () => {
    const all = getAllCampaigns();
    // Order-based, not era-based: mostly chronological, but the 4451 Первая
    // волна (order 5) closes the pre-existing block; the 4d wave (orders
    // 6–10) appends Блауд, Полярис, Мидгаард, Теклиус и Косары.
    expect(all.map((c) => c.slug)).toEqual([
      'imperatorskie-voyny',
      'shturm-velyana',
      'skrytyj-vrag',
      'korporativnye-voyny',
      'pervaya-volna-gront-i-rum',
      'oborona-blauda',
      'myatezh-na-polyarise',
      'padenie-midgaarda',
      'teklius',
      'voyny-kosarey',
    ]);
  });

  it('discovers the Скрытый враг chronicle', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag');
    expect(sv).toBeDefined();
    expect(sv!.title).toBe('Операция «Скрытый враг»');
  });

  it('Скрытый враг has a units roster and a mission', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag')!;
    expect(sv.units?.length).toBeGreaterThan(0);
    expect(
      sv.units?.some((u) => u.id === 'mercenaries_piraty_markusa_novye')
    ).toBe(true);
    expect(sv.missions?.length).toBe(1);
  });

  it('discovers the Штурм Велиана chronicle (роман V.Chertischev — не-Технолог канон)', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana');
    expect(sv).toBeDefined();
    expect(sv!.title).toBe('Штурм Велиана');
    expect(sv!.era).toBe('4527–4528');
    // The battle pitted both superpowers against each other.
    expect(sv!.factions).toEqual(expect.arrayContaining(['protectorate', 'polaris']));
  });

  it('Штурм Велиана rosters real machines and Велиан units', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana')!;
    expect(sv.units?.length).toBeGreaterThan(0);
    // Holder's «Предатор», the recon «Саламандра», and the dual-side «Раптор».
    expect(sv.units?.some((u) => u.id === 'predator')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'salamander')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'raptor')).toBe(true);
    // Советник Ольгерд and Велиан defenders.
    expect(sv.units?.some((u) => u.id === 'protectorate_olgerd')).toBe(true);
    expect(sv.units?.some((u) => u.id === 'protectorate_regulyary_planety_velian')).toBe(true);
  });

  it('включает кампанию «Имперские войны» — самая ранняя эра, открывает хронику', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'imperatorskie-voyny');
    expect(c).toBeDefined();
    expect(c?.order).toBe(1);
    expect(c?.factions).toContain('polaris');
    // Chronological order: this 4451 campaign is first, before shturm-velyana (2),
    // skrytyj (3) and korporativnye (4).
    expect(all[0]?.slug).toBe('imperatorskie-voyny');
    // Roster carries the war's signature machines.
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'bronekhod')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'mercenaries_kosari')).toBe(true);
  });

  it('Штурм Велиана несёт кредит романа V.Chertischev (независимый автор — avb)', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana')!;
    expect(sv.loreAuthor).toBe('avb');
    expect(sv.credit?.author).toBe('V.Chertischev');
    expect(sv.credit?.work).toBe('Битва за Велиан');
    expect(sv.credit?.year).toBe(2022);
  });

  it('Имперские войны несут кредит романа V.Chertischev — без года (не указан в издании)', () => {
    const iv = getAllCampaigns().find((c) => c.slug === 'imperatorskie-voyny')!;
    expect(iv.loreAuthor).toBe('avb');
    expect(iv.credit?.author).toBe('V.Chertischev');
    expect(iv.credit?.work).toBe('Имперские войны');
    expect(iv.credit?.year).toBeUndefined();
  });

  it('кампании без установленного источника не выдумывают атрибуцию', () => {
    for (const slug of ['korporativnye-voyny', 'skrytyj-vrag']) {
      const c = getAllCampaigns().find((x) => x.slug === slug)!;
      expect(c.loreAuthor).toBeUndefined();
      expect(c.credit).toBeUndefined();
    }
  });

  it('включает кампанию «Первая волна: Гронт и Рун» — наборы «СтарСис» 2001, order 5', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'pervaya-volna-gront-i-rum');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Первая волна: Гронт и Рун');
    expect(c?.order).toBe(5);
    expect(c?.era).toBe('4451');
    expect(all[all.length - 1]?.slug).toBe('voyny-kosarey');
    expect(c?.factions).toEqual(expect.arrayContaining(['polaris', 'protectorate', 'snow_wolves']));
    // Roster: клон-пехота вторжения + мидгаардские ульфхеднары.
    expect(c?.units?.some((u) => u.id === 'polaris_lineynaya_klon_pehota')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'snow_wolves_ulfhednary')).toBe(true);
  });

  it('«Первая волна» несёт кредит наборов «СтарСис» — официальный «Технолог», без АВБ и без автора', () => {
    const c = getAllCampaigns().find((x) => x.slug === 'pervaya-volna-gront-i-rum')!;
    expect(c.loreAuthor).toBe('tehnolog');
    expect(c.credit?.author).toBeUndefined();
    expect(c.credit?.work).toBe(
      'Наборы «СтарСис»: «Схватка на Гронте» и «Вторжение на Рун» (2001)'
    );
    expect(c.credit?.year).toBeUndefined();
  });

  it('включает «Оборону Блауда» — святыня Хорана, эра Второй волны, order 6', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'oborona-blauda');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Оборона Блауда');
    expect(c?.order).toBe(6);
    expect(c?.era).toBe('4478–4495');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    // Hurricane is the canonical Блауд defender tank (existing lore).
    expect(c?.units?.some((u) => u.id === 'hurricane')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'werewolf')).toBe(true);
    expect(c?.missions?.length).toBe(2);
    // Летопись credit — официальный «Технолог», без автора, без АВБ.
    expect(c?.loreAuthor).toBe('tehnolog');
    expect(c?.credit?.work).toBe('Летопись: Звёздные герои');
    expect(c?.credit?.author).toBeUndefined();
  });

  it('включает «Мятеж на Полярисе» — переворот 4451-го, order 7', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'myatezh-na-polyarise');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Мятеж на Полярисе');
    expect(c?.order).toBe(7);
    expect(c?.era).toBe('4451–4461');
    expect(c?.factions).toEqual(['polaris']);
    // The Долгорукий roster: the hero himself + his three unit types.
    expect(c?.units?.some((u) => u.id === 'polaris_dolgorukiy')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'polaris_regulyarnaya_pehota_dolgorukogo')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'polaris_shturmovaya_pehota_dolgorukogo')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'polaris_inzhenernyy_otryad_dolgorukogo')).toBe(true);
    expect(c?.missions?.length).toBe(2);
    expect(c?.loreAuthor).toBe('tehnolog');
    expect(c?.credit?.work).toBe('Летопись: Звёздные герои');
  });

  it('включает «Падение Мидгаарда» — канун Вторжения, order 8, кредит наборов «СтарСис»', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'padenie-midgaarda');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Падение Мидгаарда');
    expect(c?.order).toBe(8);
    expect(c?.era).toBe('4449–4451');
    expect(c?.factions).toEqual(['polaris', 'snow_wolves']);
    expect(c?.units?.some((u) => u.id === 'snow_wolves_ulfhednary')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.missions?.length).toBe(2);
    expect(c?.loreAuthor).toBe('tehnolog');
    expect(c?.credit?.work).toBe(
      'Наборы «СтарСис»: «Схватка на Гронте» и «Вторжение на Рун» (2001)'
    );
  });

  it('включает «Сражение за Теклиус» — реванш после Бдительного Мира, order 9', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'teklius');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Сражение за Теклиус');
    expect(c?.order).toBe(9);
    expect(c?.era).toBe('4540');
    expect(c?.factions).toEqual(['protectorate', 'polaris']);
    // Ти-Рэкс и Супер Локуст несут имя Теклиуса в собственном лоре юнитов.
    expect(c?.units?.some((u) => u.id === 'trex')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'superlocust')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'polaris_ledi_agata')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'protectorate_piriel')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'protectorate_zheleznyy_general')).toBe(true);
    expect(c?.missions?.length).toBe(2);
    expect(c?.loreAuthor).toBe('tehnolog');
    expect(c?.credit?.work).toBe('Летопись: Звёздные герои');
  });

  it('включает «Войны Косарей» — Доимперские конфликты, order 10, кредит книги V.Chertischev', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'voyny-kosarey');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Войны Косарей');
    expect(c?.order).toBe(10);
    expect(c?.era).toBe('4360–4451');
    expect(c?.factions).toEqual(['mercenaries', 'protectorate']);
    expect(c?.units?.some((u) => u.id === 'mercenaries_kosari')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'mercenaries_piraty_tortugi')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'polaris_markus_trehglazyy')).toBe(true);
    expect(c?.missions?.length).toBe(2);
    // Роман-справочник V.Chertischev — независимый автор → мини-АВБ.
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.author).toBe('V.Chertischev');
    expect(c?.credit?.work).toBe('Косары');
  });
});

describe('warsEraSpan — эпоха всего блока «Хроники войн»', () => {
  it('текущие 10 кампаний → «4360–4546» (min–max по всем годам всех кампаний)', () => {
    // Порядок по `order`: Имперские войны (4451–4528), Штурм Велиана (4527–4528),
    // Скрытый враг (4537), Корпоративные войны (4546), Первая волна (4451!),
    // + волна 4d: Блауд (4478–4495), Полярис (4451–4461), Мидгаард (4449–4451),
    // Теклиус (4540), Косары (4360–4451 — нижняя граница всего блока).
    // Порядковый first/last давал «4451–4451» — регрессия этого кейса.
    expect(warsEraSpan(getAllCampaigns())).toBe('4360–4546');
  });

  it('кампания без эры пропускается', () => {
    expect(
      warsEraSpan([{ era: '4451–4528' }, { era: undefined }, { era: '4546' }])
    ).toBe('4451–4546');
  });

  it('нет эр ни у одной кампании → undefined (бейдж не рендерится)', () => {
    expect(warsEraSpan([{ era: undefined }, {}])).toBeUndefined();
    expect(warsEraSpan([])).toBeUndefined();
  });

  it('эры без четырёхзначных годов игнорируются', () => {
    expect(warsEraSpan([{ era: 'без даты' }, { era: 'около 330-го цикла' }])).toBeUndefined();
  });

  it('все войны в одном году → год без диапазона', () => {
    expect(warsEraSpan([{ era: '4546' }, { era: '4546–4546' }])).toBe('4546');
  });

  it('внутри одной эры-диапазона берутся оба конца', () => {
    expect(warsEraSpan([{ era: '4527–4528' }])).toBe('4527–4528');
  });
});

describe('unitCampaigns — обратный индекс юнит → хроники («// УЧАСТИЕ В ВОЙНАХ»)', () => {
  it('raptor воевал в пяти хрониках — в порядке блока (по order)', () => {
    expect(unitCampaigns('raptor').map((c) => c.slug)).toEqual([
      'imperatorskie-voyny',
      'shturm-velyana',
      'pervaya-volna-gront-i-rum',
      'oborona-blauda',
      'padenie-midgaarda',
    ]);
  });

  it('каждая запись несёт title и роль из ростера кампании', () => {
    const shturm = unitCampaigns('raptor').find((c) => c.slug === 'shturm-velyana')!;
    expect(shturm.title).toBe('Штурм Велиана');
    // Роли в frontmatter хранятся вместе с кавычками «…» (как на детальной кампании).
    expect(shturm.role).toBe('«Линейная танкетка — на службе обеих сторон»');
  });

  it('снежные волки: ульфхеднары — Первая волна и Падение Мидгаарда', () => {
    expect(unitCampaigns('snow_wolves_ulfhednary').map((c) => c.slug)).toEqual([
      'pervaya-volna-gront-i-rum',
      'padenie-midgaarda',
    ]);
  });

  it('юнит вне хроник → пустой массив (блок на досье не рендерится)', () => {
    expect(unitCampaigns('nonexistent_unit')).toEqual([]);
  });
});
