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
    // 6–10) appends Блауд, Полярис, Мидгаард, Теклиус и Косары; the 4e wave
    // (orders 11–13) appends ЦСО и обе волны Имперских войн; the 4f wave —
    // Войны Пыльной Зоны (order 14, эра 4472 — между волнами); the 4g wave —
    // «Либератор: Железный ветер» (order 15, статьи Мёртвого Флота).
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
      'operatsii-tso',
      'vtoraya-volna',
      'tretiya-volna',
      'voyny-pylnoy-zony',
      'liberator-zheleznyy-veter',
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

  it('Штурм Велиана расширены миссиями романа — контратака, монорельс, блокада, бастион', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'shturm-velyana')!;
    expect(sv.missions?.length).toBe(4);
    expect(sv.missions?.map((m) => m.name)).toEqual([
      'Улица Свободы',
      'Рейд по монорельсу',
      'Караван руды',
      'Двенадцатый бастион',
    ]);
  });

  it('включает «Операции ЦСО» — штурмовые батальоны Протектората, order 11', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'operatsii-tso');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Операции ЦСО');
    expect(c?.order).toBe(11);
    expect(c?.era).toBe('4521–4530');
    expect(c?.factions).toEqual(['protectorate']);
    // Ростер: штурмовые отряды + командные «Карниворы» и звенья бронедивизиона.
    expect(c?.units?.some((u) => u.id === 'protectorate_shturmovoy_otryad_stervyatniki')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'carnivore')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'varan')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    // Повесть V.Chertischev — независимый автор → мини-АВБ.
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.author).toBe('V.Chertischev');
    expect(c?.credit?.work).toBe('Штурмовики Протектората');
  });

  it('включает «Вторую волну» — манёвренная война 4478–4495, order 12', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'vtoraya-volna');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Вторая волна');
    expect(c?.order).toBe(12);
    expect(c?.era).toBe('4478–4495');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'snow_wolves_ulfhednary')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.work).toBe('Имперские войны');
  });

  it('включает «Третью волну» — восстания и супероружие 4522–4528, order 13', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'tretiya-volna');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Третья волна');
    expect(c?.order).toBe(13);
    expect(c?.era).toBe('4522–4528');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    expect(c?.units?.some((u) => u.id === 'polaris_ledi_agata')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'madbull')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.work).toBe('Имперские войны');
  });

  it('включает «Либератор: Железный ветер» — оккупированная Рутения 4513–4528, order 15', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'liberator-zheleznyy-veter');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Либератор: Железный ветер');
    expect(c?.order).toBe(15);
    expect(c?.era).toBe('4513–4528');
    // Имперский гарнизон оккупации + протекторатская операция «Железный ветер».
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    // Ростер: Советник Ольгерд (мост к «Третьей волне») + машины гарнизона и Велиана.
    expect(c?.units?.some((u) => u.id === 'protectorate_olgerd')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'wildbear')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'hunter')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'trex')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'varan')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'thunder')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'grinder')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    // Статьи сообщества «Голоса мёртвых флотов» — АВБ-контент, кредит сообщества.
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.author).toBe('Сообщество «Голоса мёртвых флотов»');
    expect(c?.credit?.work).toBe('Либератор: Железный ветер');
    expect(c?.credit?.url).toBe('https://vk.ru/@dead_fleet-liberator-zheleznyi-veter1');
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
    // Блок замыкает уже не Третья волна (13) и не 4f (14), а фаза 4g: «Либератор» (15).
    expect(all[all.length - 1]?.slug).toBe('liberator-zheleznyy-veter');
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

  it('включает «Войны Пыльной Зоны» — альдебаранский рейд 4472, order 14', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'voyny-pylnoy-zony');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Войны Пыльной Зоны');
    expect(c?.order).toBe(14);
    // Эра «4472» — середина перемирия между Первой (4451–4461) и Второй
    // (4478+) волнами: расхождение с романами (4478) оговорено в тексте.
    expect(c?.era).toBe('4472');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    // Ростер: танкетки Альдебаранского Корпуса + бронемашины роботанковых бригад.
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'bronekhod')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    // Исходник — игра «Роботех», прародитель вселенной: правообладатель не
    // установлен → паттерн безымянного официального издания (без АВБ, без автора).
    expect(c?.loreAuthor).toBe('tehnolog');
    expect(c?.credit?.work).toBe('Роботех (исходник)');
    expect(c?.credit?.author).toBeUndefined();
  });
});

describe('warsEraSpan — эпоха всего блока «Хроники войн»', () => {
  it('текущие 15 кампаний → «4360–4546» (min–max по всем годам всех кампаний)', () => {
    // Порядок по `order`: Имперские войны (4451–4528), Штурм Велиана (4527–4528),
    // Скрытый враг (4537), Корпоративные войны (4546), Первая волна (4451!),
    // + волна 4d: Блауд (4478–4495), Полярис (4451–4461), Мидгаард (4449–4451),
    // Теклиус (4540), Косары (4360–4451 — нижняя граница всего блока),
    // + волна 4e: ЦСО (4521–4530), Вторая волна (4478–4495), Третья волна
    // (4522–4528),
    // + волна 4f: Войны Пыльной Зоны (4472 — пограничная стычка между волнами;
    // расхождение 4472/4478 с романами оговорено в самой кампании),
    // + волна 4g: Либератор (4513–4528) — все внутри коридора 4360–4546,
    // границы не сдвигаются.
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
  it('raptor воевал в восьми хрониках — в порядке блока (по order)', () => {
    expect(unitCampaigns('raptor').map((c) => c.slug)).toEqual([
      'imperatorskie-voyny',
      'shturm-velyana',
      'pervaya-volna-gront-i-rum',
      'oborona-blauda',
      'padenie-midgaarda',
      'vtoraya-volna',
      'voyny-pylnoy-zony',
      'liberator-zheleznyy-veter',
    ]);
  });

  it('каждая запись несёт title и роль из ростера кампании', () => {
    const shturm = unitCampaigns('raptor').find((c) => c.slug === 'shturm-velyana')!;
    expect(shturm.title).toBe('Штурм Велиана');
    // Роли в frontmatter хранятся вместе с кавычками «…» (как на детальной кампании).
    expect(shturm.role).toBe('«Линейная танкетка — на службе обеих сторон»');
  });

  it('снежные волки: ульфхеднары — Первая волна, Падение Мидгаарда и Вторая волна (Сера 4479)', () => {
    expect(unitCampaigns('snow_wolves_ulfhednary').map((c) => c.slug)).toEqual([
      'pervaya-volna-gront-i-rum',
      'padenie-midgaarda',
      'vtoraya-volna',
    ]);
  });

  it('юнит вне хроник → пустой массив (блок на досье не рендерится)', () => {
    expect(unitCampaigns('nonexistent_unit')).toEqual([]);
  });
});
