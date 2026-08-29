import {
  getAllWorldEntries,
  isWorldKind,
  WORLD_KIND_LABELS,
} from '@/lib/world';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

describe('world entries («Алфавит вселенной»)', () => {
  const entries = getAllWorldEntries();

  it('возвращает 62 записи (6 первой партии + 20 контент-волны + 18 кораблей флотов + 12 волны 4g + 6 волны 4g-2)', () => {
    expect(entries).toHaveLength(62);
    expect(entries.map((e) => e.slug)).toEqual([
      // Первая партия
      'lord-kross',
      'lord-erkhart',
      'markus-trehglazyy',
      'impireya-polyaris',
      'dominion',
      'gront',
      // Волна 4g-2: локация Пояс Мрака (сборник «Империя Полярис»)
      'poyas-mraka',
      // Контент-волна: персоны
      'lord-dolgorukiy',
      'ledi-agata',
      'lord-shindzhi',
      'elvit',
      'breyg-ulufson',
      'prizrak',
      'mark-ballard',
      // Волна 4g-2: персона Вайсман (сборник «Империя Полярис»)
      'benedikt-vaysman',
      'fon-hanneman',
      // Волна 4g-2: персона Пириэль (сборники «Империя Полярис»/«Протекторат»)
      'elena-piriel',
      // Контент-волна: локации, битвы, топонимы-термины
      'velian',
      'blaund',
      'run',
      'midgaard',
      'buffernaya-zona',
      'teklius',
      'zolotaya-sotnya',
      'pylnaya-zona',
      'shturm-velyana',
      // Волна 4g: локация Кейта (статьи «КРАСНЫЙ КОРПУС»)
      'keyta',
      // Контент-волна: термины
      'klon-pehota',
      'protectorat-torgovyy',
      'bditelnyy-mir',
      // Волна 4g: военный словарь (статьи Мёртвого Флота) — слоты 33–39
      'reksmarine',
      'vspomogatelnyy-flot',
      'katafrakty',
      'tafgai',
      'rezhimniki',
      'df-batareya-nuska',
      't5-garpun',
      // Корабли флотов (справочники VK): Империя — 8
      'ezarh',
      'asgard',
      'direvolf',
      'suvorov',
      'varyag',
      'tayfun',
      'molnienosnyy',
      'mamba',
      // Корабли флотов: Протекторат — 10
      'york',
      'altair',
      'kovcheg',
      'ares',
      'temza',
      'mstitel',
      'archer',
      'yarost',
      'svobodnyy',
      'proekt-22',
      // Волна 4g: корабль ЧВК + хвост военного словаря (слоты 58–61)
      'torturador',
      'bpr',
      'gurs',
      'prizrachnye-linii',
      // Волна 4g-2: термины сборников фракций (слоты 62–64)
      'tribunatory',
      'oap',
      'torgovyy-reyder',
    ]);
  });

  it('каждая запись: валидный kind, title, гриф из WORLD_KIND_LABELS', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (!isWorldKind(e.kind)) invalid.push(`${e.slug}: kind=${String(e.kind)}`);
      if (!/^(ПЕРСОНА|ЛОКАЦИЯ|БИТВА|ТЕРМИН|КОРАБЛЬ)$/.test(WORLD_KIND_LABELS[e.kind as keyof typeof WORLD_KIND_LABELS] ?? ''))
        invalid.push(`${e.slug}: label`);
      if (!e.title || e.title.length <= 2) invalid.push(`${e.slug}: title`);
    }
    expect(invalid).toEqual([]);
  });

  it('меты первой партии: три персоны, два термина, локация Гронт', () => {
    const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
    expect(byslug['lord-kross']).toMatchObject({
      kind: 'person',
      faction: 'polaris',
      subtitle: 'Великий Адмирал Внутренней Империи',
    });
    expect(byslug['lord-erkhart']!.kind).toBe('person');
    expect(byslug['markus-trehglazyy']!.kind).toBe('person');
    expect(byslug['impireya-polyaris']!.kind).toBe('term');
    expect(byslug['dominion']!.kind).toBe('term');
    expect(byslug['gront']).toMatchObject({
      kind: 'location',
      era: '4451',
      subtitle: expect.stringContaining('Нонус'),
    });
  });

  it('меты контент-волны: kinds и фракции ключевых записей', () => {
    const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
    // Персоны волны.
    expect(byslug['lord-dolgorukiy']).toMatchObject({ kind: 'person', faction: 'polaris' });
    expect(byslug['ledi-agata']!.kind).toBe('person');
    expect(byslug['lord-shindzhi']).toMatchObject({ kind: 'person', faction: 'polaris' });
    expect(byslug['elvit']).toMatchObject({ kind: 'person', faction: 'protectorate' });
    expect(byslug['breyg-ulufson']).toMatchObject({ kind: 'person', faction: 'snow_wolves' });
    expect(byslug['prizrak']).toMatchObject({ kind: 'person', faction: 'protectorate' });
    expect(byslug['mark-ballard']).toMatchObject({ kind: 'person', faction: 'dead_fleet' });
    expect(byslug['fon-hanneman']).toMatchObject({ kind: 'person', faction: 'polaris' });
    // Локации и битва.
    expect(byslug['velian']).toMatchObject({ kind: 'location' });
    expect(byslug['blaund']).toMatchObject({ kind: 'location', faction: 'protectorate' });
    expect(byslug['run']).toMatchObject({ kind: 'location', faction: 'protectorate' });
    expect(byslug['midgaard']).toMatchObject({ kind: 'location', faction: 'snow_wolves' });
    expect(byslug['teklius']).toMatchObject({ kind: 'location', faction: 'polaris' });
    // «Штурм Велиана» — первая запись вида battle.
    const battles = entries.filter((e) => e.kind === 'battle');
    expect(battles.map((e) => e.slug)).toEqual(['shturm-velyana']);
    // Термины волны.
    expect(byslug['buffernaya-zona']!.kind).toBe('term');
    expect(byslug['zolotaya-sotnya']).toMatchObject({ kind: 'term', faction: 'protectorate' });
    expect(byslug['pylnaya-zona']).toMatchObject({ kind: 'term', faction: 'mercenaries' });
    expect(byslug['klon-pehota']).toMatchObject({ kind: 'term', faction: 'polaris' });
    expect(byslug['protectorat-torgovyy']).toMatchObject({ kind: 'term', faction: 'protectorate' });
    expect(byslug['bditelnyy-mir']!.kind).toBe('term');
  });

  it('волна 4g (статьи «Голоса мёртвых флотов»): Кейта, Тортурадор и военный словарь', () => {
    const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
    // Кейта — Окраинный мир без фракции держав (гражданская война корпораций).
    expect(byslug['keyta']).toMatchObject({ kind: 'location' });
    expect(byslug['keyta']!.faction).toBeUndefined();
    expect(byslug['keyta']!.related?.units).toEqual(
      expect.arrayContaining(['madbull', 'raptor', 'bronekhod', 'condor', 'trex', 'octopus']),
    );
    // Военный словарь — слаги списком (порядок = order).
    expect(entries.filter((e) => e.kind === 'term').map((e) => e.slug)).toEqual([
      'impireya-polyaris',
      'dominion',
      'buffernaya-zona',
      'zolotaya-sotnya',
      'pylnaya-zona',
      'klon-pehota',
      'protectorat-torgovyy',
      'bditelnyy-mir',
      'reksmarine',
      'vspomogatelnyy-flot',
      'katafrakty',
      'tafgai',
      'rezhimniki',
      'df-batareya-nuska',
      't5-garpun',
      'bpr',
      'gurs',
      'prizrachnye-linii',
      'tribunatory',
      'oap',
      'torgovyy-reyder',
    ]);
    // Ключевые меты словаря: фракции и связки.
    expect(byslug['reksmarine']).toMatchObject({ kind: 'term', faction: 'polaris' });
    expect(byslug['tafgai']).toMatchObject({ kind: 'term', faction: 'dead_fleet' });
    expect(byslug['katafrakty']).toMatchObject({ kind: 'term', faction: 'protectorate' });
    expect(byslug['rezhimniki']!.related?.units).toContain('polaris_rezhimnaya_klon_pehota');
    expect(byslug['df-batareya-nuska']).toMatchObject({ kind: 'term', faction: 'protectorate' });
    expect(byslug['t5-garpun']!.related?.units).toBeUndefined();
    expect(byslug['bpr']!.related?.campaigns).toContain('liberator-zheleznyy-veter');
    expect(byslug['katafrakty']!.related?.campaigns).toContain('liberator-zheleznyy-veter');
  });

  it('волна 4g-2 (сборники фракций VK): Пояс Мрака, Вайсман, Пириэль и словарь', () => {
    const byslug = Object.fromEntries(entries.map((e) => [e.slug, e]));
    // Пояс Мрака — локация без фракции держав (сектор на окраине Империи),
    // колыбель найтсталкеров.
    expect(byslug['poyas-mraka']).toMatchObject({ kind: 'location' });
    expect(byslug['poyas-mraka']!.faction).toBeUndefined();
    expect(byslug['poyas-mraka']!.related?.units).toEqual(['mercenaries_naytstalkery']);
    // Персоны волны: учёный Империи и советница Протектората.
    expect(byslug['benedikt-vaysman']).toMatchObject({ kind: 'person', faction: 'polaris' });
    expect(byslug['benedikt-vaysman']!.related?.units).toContain('polaris_lineynaya_klon_pehota');
    expect(byslug['elena-piriel']).toMatchObject({ kind: 'person', faction: 'protectorate' });
    expect(byslug['elena-piriel']!.related?.units).toEqual(['protectorate_piriel']);
    expect(byslug['elena-piriel']!.related?.campaigns).toContain('shturm-velyana');
    // Термины сборников: трибунаторы (Империя), ОАП (Протекторат),
    // торговый рейдер — орудие обеих держав Рейдовых войн.
    expect(byslug['tribunatory']).toMatchObject({ kind: 'term', faction: 'polaris' });
    expect(byslug['tribunatory']!.related?.campaigns).toContain('operatsii-tso');
    expect(byslug['oap']).toMatchObject({ kind: 'term', faction: 'protectorate' });
    expect(byslug['torgovyy-reyder']).toMatchObject({ kind: 'term' });
    expect(byslug['torgovyy-reyder']!.faction).toBeUndefined();
    expect(byslug['torgovyy-reyder']!.related?.factions).toEqual(['polaris', 'protectorate']);
    expect(byslug['torgovyy-reyder']!.related?.campaigns).toContain('teklius');
  });

  it('related.units ссылаются на реальные юниты энциклопедии', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      for (const id of e.related?.units ?? []) {
        if (!getEncyclopediaUnit(id)) invalid.push(`${e.slug} → unit ${id}`);
      }
    }
    expect(invalid).toEqual([]);
    // Кросс-чек ключевых связей первой партии.
    const kross = entries.find((e) => e.slug === 'lord-kross')!;
    expect(kross.related?.units).toContain('polaris_kross');
    const markus = entries.find((e) => e.slug === 'markus-trehglazyy')!;
    expect(markus.related?.units).toEqual(
      expect.arrayContaining([
        'polaris_markus_trehglazyy',
        'mercenaries_piraty_markusa_novye',
        'mercenaries_piraty_markusa_starye',
        'mercenaries_naytstalkery',
      ]),
    );
  });

  it('related.factions ссылаются на реальные фракции', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      for (const id of e.related?.factions ?? []) {
        if (!getEncyclopediaFaction(id)) invalid.push(`${e.slug} → faction ${id}`);
      }
    }
    expect(invalid).toEqual([]);
    expect(
      entries.find((e) => e.slug === 'impireya-polyaris')!.related?.factions,
    ).toContain('polaris');
  });

  it('related.chapters ссылаются на реальные главы истории', () => {
    const slugs = new Set(getAllHistoryChapters().map((c) => c.slug));
    const invalid: string[] = [];
    for (const e of entries) {
      for (const slug of e.related?.chapters ?? []) {
        if (!slugs.has(slug)) invalid.push(`${e.slug} → chapter ${slug}`);
      }
    }
    expect(invalid).toEqual([]);
  });

  it('related.campaigns ссылаются на реальные кампании', () => {
    const slugs = new Set(getAllCampaigns().map((c) => c.slug));
    const invalid: string[] = [];
    for (const e of entries) {
      for (const slug of e.related?.campaigns ?? []) {
        if (!slugs.has(slug)) invalid.push(`${e.slug} → campaign ${slug}`);
      }
    }
    expect(invalid).toEqual([]);
    // Кросс не приписан «Первой волне» (там армгруппой «Запад» командует Харм),
    // но присутствует в «Имперских войнах» («Центр» лорда Кросса).
    const kross = entries.find((e) => e.slug === 'lord-kross')!;
    expect(kross.related?.campaigns).toContain('imperatorskie-voyny');
    expect(kross.related?.campaigns).not.toContain('pervaya-volna-gront-i-rum');
    // Гронт, наоборот, — герой «Первой волны».
    expect(
      entries.find((e) => e.slug === 'gront')!.related?.campaigns,
    ).toContain('pervaya-volna-gront-i-rum');
    // Пыльная Зона — буфер, через который шла альдебаранская диверсионная
    // война; фон Ханнеман связан с тремя хрониками одного рейда (4472/4478 —
    // расхождение дат между «Роботехом» и романами).
    expect(
      entries.find((e) => e.slug === 'pylnaya-zona')!.related?.campaigns,
    ).toContain('voyny-pylnoy-zony');
    expect(
      entries.find((e) => e.slug === 'fon-hanneman')!.related?.campaigns,
    ).toEqual(['voyny-pylnoy-zony', 'imperatorskie-voyny', 'vtoraya-volna']);
  });

  it('frontmatter faction (если задан) существует в реестре фракций', () => {
    const invalid: string[] = [];
    for (const e of entries) {
      if (e.faction && !getEncyclopediaFaction(e.faction)) invalid.push(`${e.slug}: ${e.faction}`);
    }
    expect(invalid).toEqual([]);
  });

  it('корабли флотов: 19 записей kind=ship, гриф КОРАБЛЬ, флот в related.factions, юнитов нет', () => {
    const ships = entries.filter((e) => e.kind === 'ship');
    expect(ships).toHaveLength(19);
    expect(ships.map((e) => e.slug)).toEqual([
      // Флот Империи Полярис (справочник «Основные корабли Империи»)
      'ezarh',
      'asgard',
      'direvolf',
      'suvorov',
      'varyag',
      'tayfun',
      'molnienosnyy',
      'mamba',
      // Космический флот Протектората (справочник «Основные корабли Протектората»)
      'york',
      'altair',
      'kovcheg',
      'ares',
      'temza',
      'mstitel',
      'archer',
      'yarost',
      'svobodnyy',
      'proekt-22',
      // Волна 4g: «Тортурадор» — корабль ЧВК «Красный Корпус», не флот державы
      // (related.factions пуст — привязки к polaris/protectorate нет).
      'torturador',
    ]);
    // Маппинг флотов: «Империя» → polaris (8), «Протекторат» → protectorate (10).
    // Сами страницы фракциям не принадлежат (frontmatter faction не задаётся) —
    // привязка только через related.factions.
    const fleetOf = Object.fromEntries(ships.map((e) => [e.slug, e.related?.factions ?? []]));
    for (const slug of [
      'ezarh', 'asgard', 'direvolf', 'suvorov', 'varyag', 'tayfun', 'molnienosnyy', 'mamba',
    ]) {
      expect(fleetOf[slug]).toContain('polaris');
      expect(fleetOf[slug]).not.toContain('protectorate');
    }
    for (const slug of [
      'york', 'altair', 'kovcheg', 'ares', 'temza', 'mstitel', 'archer', 'yarost', 'svobodnyy', 'proekt-22',
    ]) {
      expect(fleetOf[slug]).toContain('protectorate');
      expect(fleetOf[slug]).not.toContain('polaris');
    }
    // Корабли — НЕ юниты (решение владельца: играть нельзя) — related.units пуст.
    // Главы/кампании корабли поимённо не упоминают (проверено грепом) — chapters/campaigns не заданы.
    const invalid: string[] = [];
    for (const e of ships) {
      if (e.related?.units && e.related.units.length > 0) invalid.push(`${e.slug}: units`);
      if (e.related?.chapters && e.related.chapters.length > 0) invalid.push(`${e.slug}: chapters`);
      if (e.related?.campaigns && e.related.campaigns.length > 0) invalid.push(`${e.slug}: campaigns`);
      if (e.faction) invalid.push(`${e.slug}: frontmatter faction`);
      if (!e.subtitle || !e.subtitle.includes('·')) invalid.push(`${e.slug}: subtitle «класс · флот»`);
      if (!WORLD_KIND_LABELS[e.kind] || WORLD_KIND_LABELS[e.kind] !== 'КОРАБЛЬ') invalid.push(`${e.slug}: label`);
    }
    expect(invalid).toEqual([]);
  });

  it('сортировка: order, затем алфавит по title (ru locale)', () => {
    // Все партии пронумерованы уникальными order — порядок стабилен:
    // 1–6 первая партия, 7 Пояс Мрака (4g-2), 10–16 и 18 персоны волны
    // (18 — фон Ханнеман, фаза 4f), 17 Вайсман и 19 Пириэль (4g-2),
    // 20–29 локации/битвы/термины-места (29 — Кейта, фаза 4g),
    // 30–32 термины волны, 33–39 военный словарь 4g,
    // 40–57 корабли флотов (Империя 40–47, Протекторат 48–57),
    // 58–61 волна 4g: «Тортурадор» (58) + хвост словаря (59–61, после кораблей),
    // 62–64 термины сборников фракций (4g-2).
    expect(entries.map((e) => e.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
      40, 41, 42, 43, 44, 45, 46, 47,
      48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
      58, 59, 60, 61,
      62, 63, 64,
    ]);
  });

  it('каждая запись несёт sources (прозрачность происхождения сводки)', () => {
    const missing = entries.filter((e) => !e.sources || e.sources.length === 0).map((e) => e.slug);
    expect(missing).toEqual([]);
  });
});
