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
    // Хронологический порядок (решение владельца 2026-09-01): сортировка по
    // началу эры, при равенстве — по концу. Косары открывают (4360),
    // Корпоративные войны замыкают (4546); волны идут в каноническом порядке
    // ПВ → ВВ → ТВ, рейдовый хвост (Скрытый враг, Теклиус, Димекса) — после.
    expect(all.map((c) => c.slug)).toEqual([
      'voyny-kosarey',
      'padenie-midgaarda',
      'pervaya-volna-gront-i-rum',
      'myatezh-na-polyarise',
      'imperatorskie-voyny',
      'voyny-pylnoy-zony',
      'vtoraya-volna',
      'oborona-blauda',
      'liberator-zheleznyy-veter',
      'operatsii-tso',
      'tretiya-volna',
      'shturm-velyana',
      'skrytyj-vrag',
      'teklius',
      'dimeksa',
      'korporativnye-voyny',
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

  it('«Имперские войны» — охватный роман 4451–4528, order 5 (после первой волны событий)', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'imperatorskie-voyny');
    expect(c).toBeDefined();
    expect(c?.order).toBe(5);
    expect(c?.factions).toContain('polaris');
    // Хронология списка: Косары (4360) открывают, Корпоративные войны (4546) замыкают.
    expect(all[0]?.slug).toBe('voyny-kosarey');
    expect(all[all.length - 1]?.slug).toBe('korporativnye-voyny');
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

  it('включает «Операции ЦСО» — штурмовые батальоны Протектората, order 10', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'operatsii-tso');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Операции ЦСО');
    expect(c?.order).toBe(10);
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

  it('включает «Вторую волну» — манёвренная война 4478–4495, order 7', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'vtoraya-volna');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Вторая волна');
    expect(c?.order).toBe(7);
    expect(c?.era).toBe('4478–4495');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    expect(c?.units?.some((u) => u.id === 'raptor')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'snow_wolves_ulfhednary')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.work).toBe('Имперские войны');
  });

  it('включает «Третью волну» — восстания и супероружие 4522–4528, order 11', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'tretiya-volna');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Третья волна');
    expect(c?.order).toBe(11);
    expect(c?.era).toBe('4522–4528');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    expect(c?.units?.some((u) => u.id === 'polaris_ledi_agata')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'madbull')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.work).toBe('Имперские войны');
  });

  it('включает «Либератор: Железный ветер» — оккупированная Рутения 4513–4528, order 9', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'liberator-zheleznyy-veter');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Либератор: Железный ветер');
    expect(c?.order).toBe(9);
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

  it('кампании сообщества «Технолог/СтарСис» несут кредит источника', () => {
    // «Корпоративные войны» — docx «Хало и Вахо 2» (кампания, 2020).
    const kv = getAllCampaigns().find((x) => x.slug === 'korporativnye-voyny')!;
    expect(kv.loreAuthor).toBe('avb');
    expect(kv.credit?.author).toBe('Сообщество ВК «Технолог/СтарСис»');
    expect(kv.credit?.work).toBe('«Хало и Вахо 2» — кампания (docx, 2020)');
    // «Скрытый враг» — фанатская редакция правил Jeek (рутенийский цикл).
    const sv = getAllCampaigns().find((x) => x.slug === 'skrytyj-vrag')!;
    expect(sv.loreAuthor).toBe('avb');
    expect(sv.credit?.author).toBe('Сообщество ВК «Технолог/СтарСис»');
    expect(sv.credit?.work).toBe('«Бронепехота»: правила, редакция Jeek (2020)');
    expect(sv.credit?.url).toBe('https://vk.ru/docs-207479666');
  });

  it('включает кампанию «Первая волна: Гронт и Рун» — наборы «СтарСис» 2001, order 3', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'pervaya-volna-gront-i-rum');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Первая волна: Гронт и Рун');
    expect(c?.order).toBe(3);
    expect(c?.era).toBe('4451');
    expect(all[2]?.slug).toBe('pervaya-volna-gront-i-rum');
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

  it('включает «Оборону Блауда» — святыня Хорана, эра Второй волны, order 8', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'oborona-blauda');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Оборона Блауда');
    expect(c?.order).toBe(8);
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

  it('включает «Мятеж на Полярисе» — переворот 4451-го, order 4', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'myatezh-na-polyarise');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Мятеж на Полярисе');
    expect(c?.order).toBe(4);
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

  it('включает «Падение Мидгаарда» — канун Вторжения, order 2, кредит наборов «СтарСис»', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'padenie-midgaarda');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Падение Мидгаарда');
    expect(c?.order).toBe(2);
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

  it('включает «Сражение за Теклиус» — реванш после Бдительного Мира, order 14', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'teklius');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Сражение за Теклиус');
    expect(c?.order).toBe(14);
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

  it('включает «Войны Косарей» — доимперские конфликты, открывают хронику (order 1), кредит книги V.Chertischev', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'voyny-kosarey');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Войны Косарей');
    expect(c?.order).toBe(1);
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

  it('включает «4541: Димекса» — «Троянский конь» Рейдовых войн, order 15, кредит Коржика', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'dimeksa');
    expect(c).toBeDefined();
    expect(c?.title).toBe('4541: Димекса');
    expect(c?.order).toBe(15);
    expect(c?.era).toBe('4541');
    expect(c?.factions).toEqual(['polaris', 'protectorate']);
    // Ростер: бронегруппа Белински (Локусты, Супер Локуст Корн) + патрули «Ти-Рэксов».
    expect(c?.units?.some((u) => u.id === 'locust')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'superlocust')).toBe(true);
    expect(c?.units?.some((u) => u.id === 'trex')).toBe(true);
    expect(c?.missions?.length).toBe(3);
    // Статья клуба «ЭПОХА РОБОГИР», подписана Сержем Коржиком → avb + именной кредит.
    expect(c?.loreAuthor).toBe('avb');
    expect(c?.credit?.author).toBe('Серж Коржик');
    expect(c?.credit?.url).toBe(
      'https://vk.ru/@age_of_robogear-4541-g-zahvat-resursov-na-planete-dimeksa-imperiei-polyaris'
    );
  });

  it('включает «Войны Пыльной Зоны» — альдебаранский рейд 4472, order 6', () => {
    const all = getAllCampaigns();
    const c = all.find((x) => x.slug === 'voyny-pylnoy-zony');
    expect(c).toBeDefined();
    expect(c?.title).toBe('Войны Пыльной Зоны');
    expect(c?.order).toBe(6);
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
  it('текущие 16 кампаний → «4360–4546» (min–max по всем годам всех кампаний)', () => {
    // Список хронологичен (Косари 4360 → Корпоративные войны 4546), но
    // min–max остаётся устойчивым к любому расхождению order↔era: first/last
    // по порядку раньше давал «4451–4451» — регрессия этого кейса.
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
      'padenie-midgaarda',
      'pervaya-volna-gront-i-rum',
      'imperatorskie-voyny',
      'voyny-pylnoy-zony',
      'vtoraya-volna',
      'oborona-blauda',
      'liberator-zheleznyy-veter',
      'shturm-velyana',
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
      'padenie-midgaarda',
      'pervaya-volna-gront-i-rum',
      'vtoraya-volna',
    ]);
  });

  it('юнит вне хроник → пустой массив (блок на досье не рендерится)', () => {
    expect(unitCampaigns('nonexistent_unit')).toEqual([]);
  });
});
