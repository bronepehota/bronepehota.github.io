import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';
import { creditList } from '@/lib/provenance';

describe('лор наёмников из «Косарей»', () => {
  it('фракция описывает Зал Наёмников', () => {
    expect(getEncyclopediaFaction('mercenaries')?.description).toContain('Зал Наёмников');
  });

  it('kosari несут кредит V.Chertischev (независимый автор — АВБ)', () => {
    const [credit] = creditList(getEncyclopediaUnit('mercenaries_kosari')?.provenance?.credit);
    expect(credit?.author).toBe('V.Chertischev');
    expect(credit?.work).toBe('Косары');
  });

  it('пираты Тортуги и найтсталкеры тоже пересказывают «Косарей» — несут кредит книги', () => {
    // Лор обоих отрядов опирается на сюжетные факты «Косарей» (Маркус Трёхглазый,
    // вожаки Тортуги) — решение пользователя 2026-08-19: ставить кредит, а не
    // считать текст открыто-каноническим.
    for (const id of ['mercenaries_piraty_tortugi', 'mercenaries_naytstalkery']) {
      const p = getEncyclopediaUnit(id)?.provenance;
      const [credit] = creditList(p?.credit);
      expect(`${id}: author=${credit?.author}`).toBe(`${id}: author=V.Chertischev`);
      expect(`${id}: work=${credit?.work}`).toBe(`${id}: work=Косары`);
      expect(`${id}: loreAuthor=${p?.loreAuthor}`).toBe(`${id}: loreAuthor=avb`);
    }
  });

  it('новый лор отрядов проходит latin-bleed guard', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    const u = getEncyclopediaUnit('mercenaries_kosari');
    for (const v of [u?.encyclopedia?.lore, u?.encyclopedia?.history].filter(Boolean) as string[]) {
      expect(v).not.toMatch(LATIN_WORD);
    }
  });
});
