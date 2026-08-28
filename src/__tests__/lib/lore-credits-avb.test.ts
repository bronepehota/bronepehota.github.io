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
import { resolveUnitProvenance, resolveFactionProvenance, creditList } from '@/lib/provenance';
import type { LoreSource } from '@/lib/provenance';

const NON_TEHNOLOG_WORKS = ['Битва за Велиан', 'Имперские войны', 'Косары', 'Штурмовики Протектората'];

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
});

describe('главы Истории: мини-АВБ ровно на не-Технолог текстах', () => {
  it('рассказы игроков — avb, главы «Летописи» и Империи — tehnolog', () => {
    const chapters = getAllHistoryChapters();
    for (const c of chapters) {
      if ((c.order ?? 99) >= 100) {
        expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: avb`);
      } else {
        // главы 1–8 и 9–15: tehnolog, кроме главы 8 («Косары», avb)
        if (c.slug !== 'ekipirovka-pehoty-dominiona') {
          expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
        }
      }
    }
  });
});
