/**
 * Именные кредиты книг vs АВБ-марка — классификация источников (решение
 * пользователя 2026-08-19):
 *
 *   Технолог           = «Справочник техники» + «Летопись: Звёздные герои»
 *   НЕ Технолог (АВБ)  = 4 романа Chertischev — «Битва за Велиан»,
 *                        «Имперские войны», «Косары», «Штурмовики Протектората»
 *
 * The mini АВБ mark on a credit chip is driven by the RESOLVED `loreAuthor` axis
 * (see <AttributionLabel>). So: every credit of a non-Технолог book must resolve
 * with loreAuthor ≠ tehnolog (→ the mark shows), and every future credit of a
 * Технолог edition (Справочник/Летопись, if one is ever added) must stay tehnolog
 * (→ no mark). Checked across ALL encyclopedia units AND factions.
 */
import { getAllUnits, getFactions } from '@/lib/encyclopedia-registry';
import { resolveUnitProvenance, resolveFactionProvenance } from '@/lib/provenance';
import type { LoreSource } from '@/lib/provenance';

const NON_TEHNOLOG_WORKS = ['Битва за Велиан', 'Имперские войны', 'Косары', 'Штурмовики Протектората'];

/** Works expected to carry JSON credits (units + factions). «Имперские войны» lore
 *  lives on the campaign page (frontmatter, loader-tested) — no entity carries it. */
const JSON_BACKED_WORKS = ['Битва за Велиан', 'Косары', 'Штурмовики Протектората'];

interface Credited {
  id: string;
  work: string;
  loreAuthor: LoreSource;
}

const credited: Credited[] = [
  ...getAllUnits().map((u) => ({
    id: u.id,
    work: u.provenance?.credit?.work,
    loreAuthor: resolveUnitProvenance(u).loreAuthor,
  })),
  ...getFactions().map((f) => ({
    id: f.id,
    work: f.provenance?.credit?.work,
    loreAuthor: resolveFactionProvenance(f).loreAuthor,
  })),
].filter((c): c is Credited => Boolean(c.work));

describe('именные кредиты книг: мини-АВБ ровно на не-Технолог произведениях', () => {
  it('в базе есть кредиты всех JSON-несомых романов Chertischev', () => {
    const works = credited.map((c) => c.work);
    for (const work of JSON_BACKED_WORKS) {
      expect(works).toContain(work);
    }
  });

  it('каждый кредит не-Технолог романа разрешается с loreAuthor ≠ tehnolog (→ АВБ-марка)', () => {
    for (const c of credited) {
      if (NON_TEHNOLOG_WORKS.includes(c.work)) {
        expect(`${c.id}: loreAuthor=${c.loreAuthor}`).toMatch(/: loreAuthor=(star_system|universestarsys|avb|ai)$/);
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
