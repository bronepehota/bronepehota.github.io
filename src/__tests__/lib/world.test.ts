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

  it('возвращает 44 записи (6 первой партии + 20 контент-волны + 18 кораблей флотов)', () => {
    expect(entries).toHaveLength(44);
    expect(entries.map((e) => e.slug)).toEqual([
      // Первая партия
      'lord-kross',
      'lord-erkhart',
      'markus-trehglazyy',
      'impireya-polyaris',
      'dominion',
      'gront',
      // Контент-волна: персоны
      'lord-dolgorukiy',
      'ledi-agata',
      'lord-shindzhi',
      'elvit',
      'breyg-ulufson',
      'prizrak',
      'mark-ballard',
      'fon-hanneman',
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
      // Контент-волна: термины
      'klon-pehota',
      'protectorat-torgovyy',
      'bditelnyy-mir',
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

  it('корабли флотов: 18 записей kind=ship, гриф КОРАБЛЬ, флот в related.factions, юнитов нет', () => {
    const ships = entries.filter((e) => e.kind === 'ship');
    expect(ships).toHaveLength(18);
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
    // 1–6 первая партия, 10–16 и 18 персоны волны (18 — фон Ханнеман, фаза 4f),
    // 20–28 локации/битвы/термины-места,
    // 30–32 термины волны, 40–57 корабли флотов (Империя 40–47, Протекторат 48–57).
    expect(entries.map((e) => e.order)).toEqual([
      1, 2, 3, 4, 5, 6,
      10, 11, 12, 13, 14, 15, 16, 18,
      20, 21, 22, 23, 24, 25, 26, 27, 28,
      30, 31, 32,
      40, 41, 42, 43, 44, 45, 46, 47,
      48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
    ]);
  });

  it('каждая запись несёт sources (прозрачность происхождения сводки)', () => {
    const missing = entries.filter((e) => !e.sources || e.sources.length === 0).map((e) => e.slug);
    expect(missing).toEqual([]);
  });
});
