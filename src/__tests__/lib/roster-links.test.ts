import {
  buildUnitIndex,
  factionLink,
  linkComposition,
  matchUnitName,
  normalizeUnitName,
  splitComposition,
} from '@/lib/roster-links';

const INDEX = buildUnitIndex([
  { id: 'polaris_hunter', name: 'Хантер' },
  { id: 'polaris_lineynaya_kp', name: 'Линейная клон-пехота' },
  { id: 'merc_piraty_markusa', name: 'Пираты Маркуса' },
  { id: 'prot_reydery', name: 'Рейдеры' },
  { id: 'polaris_reydery_starsys', name: 'Рейдеры Пыльной Зоны' },
  { id: 'prot_karnivor', name: 'Карнивор' },
]);

describe('factionLink', () => {
  it('маппит строки протокола на id фракций (регистр и ё не важны)', () => {
    expect(factionLink('ИМПЕРИЯ')).toBe('polaris');
    expect(factionLink('Протекторат')).toBe('protectorate');
    expect(factionLink('Наёмники')).toBe('mercenaries');
    expect(factionLink('Волки')).toBe('snow_wolves');
    expect(factionLink('Рутения')).toBe('rutenia');
    expect(factionLink('МФ')).toBe('dead_fleet');
  });

  it('неизвестная фракция — undefined (остаётся текстом)', () => {
    expect(factionLink('Косари')).toBeUndefined();
    expect(factionLink('')).toBeUndefined();
  });
});

describe('normalizeUnitName', () => {
  it('регистр, ё, дефисы и пробелы не влияют', () => {
    expect(normalizeUnitName('Линейная клон-пехота')).toBe(
      normalizeUnitName('линейная клон пехота'),
    );
    expect(normalizeUnitName('Ёж')).toBe(normalizeUnitName('еж'));
  });
});

describe('splitComposition', () => {
  it('режет по запятой и точке с запятой, сохраняя разделители', () => {
    const parts = splitComposition('Хантер, Линейная КП(Т)*2; МСТ');
    expect(parts).toEqual([
      { text: 'Хантер', sep: ', ' },
      { text: 'Линейная КП(Т)*2', sep: '; ' },
      { text: 'МСТ', sep: ' ' },
    ]);
  });
});

describe('matchUnitName', () => {
  it('точное совпадение после снятия пометок (Т), (нов), *N', () => {
    expect(matchUnitName('Хантер', INDEX)).toBe('polaris_hunter');
    expect(matchUnitName('Пираты Маркуса(стар.)(Т)*4', INDEX)).toBe('merc_piraty_markusa');
    expect(matchUnitName('Карнивор', INDEX)).toBe('prot_karnivor');
  });

  it('нормализация пробелов/дефисов: «клон пехота» = «клон-пехота»', () => {
    expect(matchUnitName('Линейная клон пехота', INDEX)).toBe('polaris_lineynaya_kp');
    expect(matchUnitName('Линейная клон-пехота', INDEX)).toBe('polaris_lineynaya_kp');
  });

  it('точное имя одного юнита линкуется, даже если есть более длинное имя другого', () => {
    expect(matchUnitName('Рейдеры', INDEX)).toBe('prot_reydery');
    expect(matchUnitName('Рейдеры Пыльной Зоны', INDEX)).toBe('polaris_reydery_starsys');
  });

  it('полный дубль имени у двух юнитов — undefined', () => {
    const dup = buildUnitIndex([
      { id: 'a_mutanty', name: 'Мутанты' },
      { id: 'b_mutanty', name: 'Мутанты' },
    ]);
    expect(matchUnitName('Мутанты', dup)).toBeUndefined();
  });

  it('мусор и аббревиатуры остаются текстом', () => {
    expect(matchUnitName('Линейная КП(Т)', INDEX)).toBeUndefined();
    expect(matchUnitName('МСТ 230 очков', INDEX)).toBeUndefined();
    expect(matchUnitName('2 отряда', INDEX)).toBeUndefined();
    expect(matchUnitName('', INDEX)).toBeUndefined();
  });
});

describe('linkComposition', () => {
  it('проставляет unitId только там, где совпадение уникально', () => {
    const parts = linkComposition('Хантер, Линейная КП(Т), Пираты Маркуса(стар.)(Т)*4', INDEX);
    expect(parts.map((p) => p.unitId)).toEqual([
      'polaris_hunter',
      undefined,
      'merc_piraty_markusa',
    ]);
    expect(parts[0].sep).toBe(', ');
  });
});
