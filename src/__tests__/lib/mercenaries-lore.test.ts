import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

describe('лор наёмников из «Косарей»', () => {
  it('фракция описывает Зал Наёмников', () => {
    expect(getEncyclopediaFaction('mercenaries')?.description).toContain('Зал Наёмников');
  });

  it('kosari несут кредит Chertischev', () => {
    const credit = getEncyclopediaUnit('mercenaries_kosari')?.provenance?.credit;
    expect(credit?.author).toBe('Chertischev');
    expect(credit?.work).toBe('Косары');
  });

  it('новый лор отрядов проходит latin-bleed guard', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    const u = getEncyclopediaUnit('mercenaries_kosari');
    for (const v of [u?.encyclopedia?.lore, u?.encyclopedia?.history].filter(Boolean) as string[]) {
      expect(v).not.toMatch(LATIN_WORD);
    }
  });
});
