import {
  buildSearchHaystack,
  matchesSearch,
  matchLoreTitles,
  toSearchBody,
} from '@/lib/unit-search';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = {
  id: 'test_hunter',
  name: 'Охотник',
  shortName: 'Хантер',
  faction: 'protectorate',
  type: 'machine',
  sources: [],
  encyclopedia: {
    manufacturer: 'Робогир Индастриз',
    lore: 'Машина времён Битвы за Блауд.',
  },
} as unknown as EncyclopediaUnit;

const machine = {
  id: 'test_bmr',
  name: 'БМР-1Г',
  shortName: 'Бээмэр',
  faction: 'polaris',
  type: 'machine',
  sources: [],
  encyclopedia: {
    shortDescription: 'Бронемашина разведки',
    designation: 'БМР-1Г',
    class: 'Разведывательная машина',
    armament: [
      { name: 'Лазерная пушка «Световой меч» (LG-25)' },
      { name: 'Пулемёт' },
    ],
  },
} as unknown as EncyclopediaUnit;

describe('unit-search', () => {
  it('haystack включает название, фракцию, производителя и лор', () => {
    const h = buildSearchHaystack(unit);
    expect(h).toContain('охотник');
    expect(h).toContain('протекторат');
    expect(h).toContain('робогир');
    expect(h).toContain('блауд');
  });

  it('haystack включает shortDescription, designation, class и вооружение', () => {
    const h = buildSearchHaystack(machine);
    expect(h).toContain('бронемашина разведки');
    expect(h).toContain('бмр-1г');
    expect(h).toContain('разведывательная машина');
    expect(h).toContain('лазерная пушка');
    expect(h).toContain('световой меч');
    expect(h).toContain('пулемёт');
  });

  it('matchesSearch: регистронезависимо, пустой запрос пропускает всех', () => {
    expect(matchesSearch(unit, 'РОБОГИР')).toBe(true);
    expect(matchesSearch(unit, 'Блауд')).toBe(true);
    expect(matchesSearch(unit, 'нет такого слова')).toBe(false);
    expect(matchesSearch(unit, '')).toBe(true);
  });

  it('matchesSearch: токен-AND — каждый токен запроса должен быть в haystack', () => {
    // Оба слова по отдельности есть в haystack юнита
    expect(matchesSearch(unit, 'робогир блауд')).toBe(true);
    // Порядок токенов не важен
    expect(matchesSearch(unit, 'блауд робогир')).toBe(true);
    // Один токен есть, второго нет → нет
    expect(matchesSearch(unit, 'робогир тунгус')).toBe(false);
    // Фраза подряд, но не все токены → нет («полярис герой» ищет пересечение, не фразу)
    expect(matchesSearch(machine, 'полярис лазерная')).toBe(true);
    expect(matchesSearch(machine, 'полярис герой')).toBe(false);
    // Токены нормализуются по пробелам (двойные пробелы не рождают пустых токенов)
    expect(matchesSearch(unit, '  робогир   блауд  ')).toBe(true);
  });

  it('matchLoreTitles: подстрока в заголовке, минимум 3 символа', () => {
    const pages = [
      { title: 'Легендарные Имперские Лорды', href: '/encyclopedia/history#legendarnye-imperskie-lordy', kind: 'chapter' as const },
      { title: 'Имперские войны', href: '/encyclopedia/history#wars', kind: 'campaign' as const },
      { title: 'Звёздные герои', href: '/encyclopedia/history#zvyozdnye-geroi', kind: 'chapter' as const },
    ];
    expect(matchLoreTitles('Лорд', pages)).toHaveLength(1);
    expect(matchLoreTitles('Имперск', pages)).toHaveLength(2);
    expect(matchLoreTitles('гер', pages)).toHaveLength(1);
    expect(matchLoreTitles('звё', pages)).toHaveLength(0);   // < 3 символов
    expect(matchLoreTitles('', pages)).toHaveLength(0);
  });

  it('matchLoreTitles: матч по телу документа (body) находит страницу', () => {
    const pages = [
      { title: 'Космография Доминиона', href: '/a', kind: 'chapter' as const, body: '…планета блауд на окраине…' },
      { title: 'Императорские войны', href: '/b', kind: 'campaign' as const, body: 'без совпадений' },
    ];
    // «Блауд» есть только в теле первой страницы
    expect(matchLoreTitles('Блауд', pages)).toHaveLength(1);
    expect(matchLoreTitles('Блауд', pages)[0].title).toBe('Космография Доминиона');
    // body тоже под порогом ≥3 символов
    expect(matchLoreTitles('бл', pages)).toHaveLength(0);
    // Страницы без body ведут себя как раньше (только титул)
    const noBody = [{ title: 'Штурм Велиана', href: '/c', kind: 'campaign' as const }];
    expect(matchLoreTitles('блауд', noBody)).toHaveLength(0);
    // (контроль: слово из титула находится и без body)
    expect(matchLoreTitles('велиан', noBody)).toHaveLength(1);
  });

  it('matchLoreTitles: совпавшие по титулу выше совпавших по телу; дублей нет', () => {
    const pages = [
      { title: 'Космография', href: '/body-match', kind: 'chapter' as const, body: 'слово блауд в теле' },
      { title: 'Войны за Блауд', href: '/title-match', kind: 'chapter' as const, body: 'тоже упоминает блауд в теле' },
      { title: 'Тихая страница', href: '/none', kind: 'chapter' as const, body: 'тишина' },
    ];
    const matched = matchLoreTitles('блауд', pages);
    // Титульный матч — первым, body-матч — за ним, нерелевантная страница выпала;
    // «Войны за Блауд» совпали и титулом, и телом — но входят ОДИН раз (титульная группа)
    expect(matched.map((p) => p.href)).toEqual(['/title-match', '/body-match']);
    expect(matched).toHaveLength(2);
  });

  it('matchLoreTitles: kinds миссий и юнит-лора ищутся наравне с главами', () => {
    const pages = [
      { title: 'Капкан', href: '/encyclopedia/mission/kapkan', kind: 'mission' as const, body: 'засада на колонну' },
      { title: 'Хантер', href: '/encyclopedia/unit/test_hunter', kind: 'unit-lore' as const, body: 'реактор и таран' },
    ];
    expect(matchLoreTitles('капкан', pages)).toHaveLength(1);
    expect(matchLoreTitles('реактор', pages)).toHaveLength(1);
    expect(matchLoreTitles('реактор', pages)[0].kind).toBe('unit-lore');
  });

  it('toSearchBody: markdown/frontmatter/HTML → нижний регистр, голова + имена собственных', () => {
    const raw = `---
title: Космография
---
# Заголовок

Планета **Блауд** — [ссылка](https://example.com) на <b>карту</b>.

- пункт один
`;
    const body = toSearchBody(raw);
    expect(body).toBe(body.toLowerCase());
    expect(body).toContain('блауд');
    expect(body).toContain('карту');          // HTML-теги сняты, текст остался
    expect(body).toContain('ссылка');         // markdown-ссылка → её подпись
    expect(body).not.toContain('https://');   // URL-мусор выкинут
    expect(body).not.toContain('title:');     // frontmatter снят
    expect(body).not.toContain('#');          // md-пунктуация снята
    expect(body).not.toContain('\n');         // одна строка
    expect(body).not.toMatch(/\s$/);          // без хвостового пробела
    // Голова обрезается по headLen (хвост имён может добавить ещё)
    expect(toSearchBody('а'.repeat(5000), 1000).startsWith('а'.repeat(1000))).toBe(true);
    // Пустое/без frontmatter — не падает
    expect(toSearchBody('просто текст')).toBe('просто текст');
  });

  it('toSearchBody: имена из глубины документа попадают в хвост (кейс «Блауд»)', () => {
    // Слово за пределами головы — глава «Космография…» упоминает Блауд на ~2300-м знаке
    const head = 'Обычный текст начала главы про системы и планеты. '.repeat(40); // ~2400 зн.
    const raw = `---\ntitle: Тест\n---\n${head}Отряд высадился на Блауд и закрепился.`;
    const body = toSearchBody(raw, 1000);
    expect(body.startsWith(head.slice(0, 1000).toLowerCase())).toBe(true);
    // Хвост имён собственных вытянул «блауд» из-за пределов головы
    expect(body).toContain('блауд');
    // Заглавные слова, встречающиеся и строчными (начала предложений), в хвост не идут
    const noisy = 'Если отряд отступил, он теряет опору. А если нет — держится. Планета Вега рядом.';
    const noisyBody = toSearchBody(noisy, 0);
    expect(noisyBody).not.toContain('если');
    expect(noisyBody).toContain('вега');
  });
});
