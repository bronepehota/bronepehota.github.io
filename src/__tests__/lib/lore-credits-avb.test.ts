/**
 * Именные кредиты книг vs АВБ-марка — классификация источников (решение
 * пользователя 2026-08-19):
 *
 *   Технолог           = «Справочник техники» + «Летопись: Звёздные герои»
 *   НЕ Технолог (АВБ)  = 4 романа V.Chertischev (независимый автор) — «Битва за
 *                        Велиан», «Имперские войны», «Косары», «Штурмовики Протектората»
 *
 * The mini АВБ mark on a credit chip is driven by the RESOLVED `loreAuthor` axis
 * (see <AttributionLabel>). So: every credit of a non-Технолог book must resolve
 * with loreAuthor ≠ tehnolog (→ the mark shows), and every future credit of a
 * Технолог edition (Справочник/Летопись, if one is ever added) must stay tehnolog
 * (→ no mark). Checked across ALL encyclopedia units AND factions.
 */
import { getAllUnits, getFactions } from '@/lib/encyclopedia-registry';
import { getAllHistoryChapters } from '@/lib/history';
import { getSourcesCatalog } from '@/lib/sources-catalog';
import { resolveUnitProvenance, resolveFactionProvenance, creditList } from '@/lib/provenance';
import type { LoreSource } from '@/lib/provenance';

const NON_TEHNOLOG_WORKS = [
  'Битва за Велиан',
  'Имперские войны',
  'Косары',
  'Штурмовики Протектората',
  // Волна 4j: справочник «Бронетехника» подписан Сержем Коржиком (клуб
  // «ЭПОХА РОБОГИР») — именной автор ⇒ кредиты несут мини-АВБ (решение
  // владельца 2026-08-30). АВБ-бейдж самих юнитов не меняется: origin не тронут.
  'Бронетехника (справочник клуба «ЭПОХА РОБОГИР»)',
  // Волна 4k: статья «Найтсталкеры» (Коржик) вторым кредитом у отряда
  // найтсталкеров (первый — роман «Косары»); именной автор ⇒ мини-АВБ.
  'Найтсталкеры (статья клуба «ЭПОХА РОБОГИР»)',
];

/** Works expected to carry JSON credits (units + factions). */
const JSON_BACKED_WORKS = ['Битва за Велиан', 'Косары', 'Штурмовики Протектората'];

interface Credited {
  id: string;
  work: string;
  loreAuthor: LoreSource;
}

// `credit` may be a single object OR an array (faction lore assembled from several
// novels) — `creditList` flattens both into one (entity, work) pair per cited book.
const credited: Credited[] = [
  ...getAllUnits().flatMap((u) =>
    creditList(u.provenance?.credit).map((cr) => ({
      id: u.id,
      work: cr.work,
      loreAuthor: resolveUnitProvenance(u).loreAuthor,
    })),
  ),
  ...getFactions().flatMap((f) =>
    creditList(f.provenance?.credit).map((cr) => ({
      id: f.id,
      work: cr.work,
      loreAuthor: resolveFactionProvenance(f).loreAuthor,
    })),
  ),
].filter((c): c is Credited => Boolean(c.work));

describe('именные кредиты книг: мини-АВБ ровно на не-Технолог произведениях', () => {
  it('в базе есть кредиты всех JSON-несомых романов V.Chertischev', () => {
    const works = credited.map((c) => c.work);
    for (const work of JSON_BACKED_WORKS) {
      expect(works).toContain(work);
    }
  });

  it('каждый кредит романа V.Chertischev разрешается с loreAuthor = avb (независимый автор)', () => {
    for (const c of credited) {
      if (NON_TEHNOLOG_WORKS.includes(c.work)) {
        expect(`${c.id}: loreAuthor=${c.loreAuthor}`).toBe(`${c.id}: loreAuthor=avb`);
      }
    }
  });

  it('кредиты Технолог изданий (Справочник/Летопись) остаются tehnolog — без АВБ', () => {
    for (const c of credited) {
      if (!NON_TEHNOLOG_WORKS.includes(c.work)) {
        expect(`${c.id}: loreAuthor=${c.loreAuthor}`).toBe(`${c.id}: loreAuthor=tehnolog`);
      }
    }
  });

  it('справочник «Бронетехника» клуба несёт кредит Коржика и разрешается loreAuthor=avb (волна 4j)', () => {
    const korzhik = credited.filter((c) => c.work === 'Бронетехника (справочник клуба «ЭПОХА РОБОГИР»)');
    // Все 20 юнитов, чей лор опирается на статью, получили именной кредит с URL.
    expect(korzhik.length).toBe(20);
    for (const c of korzhik) {
      expect(`${c.id}: loreAuthor=${c.loreAuthor}`).toBe(`${c.id}: loreAuthor=avb`);
    }
    // У всех — автор Коржик и ссылка на статью клуба.
    for (const u of getAllUnits()) {
      for (const cr of creditList(u.provenance?.credit)) {
        if (cr.work === 'Бронетехника (справочник клуба «ЭПОХА РОБОГИР»)') {
          expect(cr.author).toBe('Серж Коржик');
          expect(cr.url).toBe('https://vk.ru/@age_of_robogear-bronetehnika');
        }
      }
    }
    // Predator/Salamander несут ДВА кредита: роман «Битва за Велиан» + справочник клуба.
    for (const id of ['predator', 'salamander']) {
      const u = getAllUnits().find((x) => x.id === id)!;
      expect(creditList(u.provenance?.credit).map((c) => c.work)).toEqual([
        'Битва за Велиан',
        'Бронетехника (справочник клуба «ЭПОХА РОБОГИР»)',
      ]);
    }
  });
});

describe('фракции с массивом кредитов (лор собран из нескольких книг — M1)', () => {
  const factionCredits = (fid: string) => {
    const f = getFactions().find((x) => x.id === fid);
    return f ? creditList(f.provenance?.credit) : [];
  };

  it('protectorate несёт 3 кредита: Велиан + Имперские войны + Штурмовики Протектората', () => {
    expect(factionCredits('protectorate').map((c) => c.work)).toEqual([
      'Битва за Велиан',
      'Имперские войны',
      'Штурмовики Протектората',
    ]);
  });

  it('polaris несёт 2 кредита: Велиан + Имперские войны', () => {
    expect(factionCredits('polaris').map((c) => c.work)).toEqual(['Битва за Велиан', 'Имперские войны']);
  });

  it('все кредиты фракций — V.Chertischev, год только у «Битвы за Велиан», loreAuthor всюду avb', () => {
    for (const fid of ['polaris', 'protectorate']) {
      const f = getFactions().find((x) => x.id === fid)!;
      const resolved = resolveFactionProvenance(f);
      expect(`${fid}: loreAuthor=${resolved.loreAuthor}`).toBe(`${fid}: loreAuthor=avb`);
      for (const cr of factionCredits(fid)) {
        expect(cr.author).toBe('V.Chertischev');
        expect(cr.year).toBe(cr.work === 'Битва за Велиан' ? 2022 : undefined);
      }
    }
  });

  it('mercenaries остаётся с единичным кредитом «Косары» (одна книга — не массив)', () => {
    const f = getFactions().find((x) => x.id === 'mercenaries')!;
    expect(Array.isArray(f.provenance?.credit)).toBe(false);
    expect(creditList(f.provenance?.credit).map((c) => c.work)).toEqual(['Косары']);
  });

  it('snow_wolves несёт кредит наборов «СтарСис» 2001 — tehnolog, без АВБ (концепт остаётся Звёздных Систем)', () => {
    const f = getFactions().find((x) => x.id === 'snow_wolves')!;
    const resolved = resolveFactionProvenance(f);
    // Официальное издание «Технолога»: кредит-чип без мини-АВБ (loreAuthor=tehnolog),
    // но полный АВБ-бейдж фракции сохраняется — концепт/minis от Звёздных Систем.
    expect(`${f.id}: loreAuthor=${resolved.loreAuthor}`).toBe(`${f.id}: loreAuthor=tehnolog`);
    expect(resolved.origin).toBe('universestarsys');
    const works = creditList(f.provenance?.credit).map((c) => c.work);
    expect(works).toContain(
      'Наборы «СтарСис»: «Схватка на Гронте» и «Вторжение на Рун» (2001)'
    );
    for (const cr of creditList(f.provenance?.credit)) {
      expect(cr.author).toBeUndefined(); // авторы повестей не установлены — паттерн «Летописи»
    }
  });
});

describe('главы Истории и каталог источников: мини-АВБ ровно на не-Технолог текстах', () => {
  it('все главы — tehnolog, кроме главы 8 («Косары», avb); рассказов в Истории больше нет', () => {
    // Лор-записи рассказов убраны из Истории 2026-08-30 — сводки живут каталогом
    // /encyclopedia/sources; факты уже в досье юнитов (решение владельца).
    const chapters = getAllHistoryChapters();
    expect(chapters.some((c) => (c.order ?? 99) >= 100)).toBe(false);
    for (const c of chapters) {
      if (c.slug === 'ekipirovka-pehoty-dominiona') {
        expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: avb`);
      } else {
        expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      }
    }
  });

  it('каталог источников: рассказы игроков (robogear.ru) — loreAuthor avb; «Мяу» клуба — tehnolog, «Выбор» — avb', () => {
    // Волна 4j добавила в каталог два рассказа клуба «ЭПОХА РОБОГИР»: «Мяу»
    // опубликовано без подписи → tehnolog (паттерн «Летописи», без АВБ);
    // «Выбор» подписан Юрыком Данцем-Вашэцькаў → avb. Рассказы «Клуба
    // Robogear» (section players) остаются avb.
    const stories = getSourcesCatalog().filter((e) => e.kind === 'story');
    expect(stories.length).toBeGreaterThanOrEqual(9);
    for (const e of stories) {
      if (e.section === 'players') {
        expect(`${e.id}: ${e.loreAuthor}`).toBe(`${e.id}: avb`);
      }
    }
    expect(getSourcesCatalog().find((e) => e.id === 'myau')?.loreAuthor).toBe('tehnolog');
    expect(getSourcesCatalog().find((e) => e.id === 'vybor')?.loreAuthor).toBe('avb');
    expect(getSourcesCatalog().find((e) => e.id === 'vybor')?.author).toBe('Юрык Данец-Вашэцькаў');
  });
});

describe('отряд «Х»: спонсор и автор лора — Егорик Елеусизов (решение 2026-08-29)', () => {
  it('кредит на человека + sponsor; loreAuthor avb → мини-АВБ на чипе', () => {
    const unit = getAllUnits().find((u) => u.id === 'protectorate_otryad_x')!;
    expect(unit.provenance?.loreAuthor).toBe('avb');
    expect(unit.provenance?.credit).toEqual({
      author: 'Егорик Елеусизов',
      url: 'https://vk.ru/id140723645',
    });
    expect(unit.sponsor).toEqual({
      name: 'Егорик Елеусизов',
      url: 'https://vk.ru/id140723645',
    });
    expect(resolveUnitProvenance(unit).loreAuthor).not.toBe('tehnolog');
  });
});
