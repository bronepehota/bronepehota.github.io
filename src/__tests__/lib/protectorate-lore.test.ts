import { getEncyclopediaUnit, getEncyclopediaFaction } from '@/lib/encyclopedia-registry';

const CREDIT = { author: 'В. Чернецов', work: 'Штурмовики Протектората' };

const SHTURM_SQUADS = [
  'protectorate_shturmovaya_kiber_pehota',
  'protectorate_shturmovoy_otryad_stervyatniki',
  'protectorate_shturmovoy_spetsnaz_novye',
  'protectorate_shturmovoy_spetsnaz_starye',
  'protectorate_tyazhyolaya_shturmovaya_pehota_veliana',
];

describe('лор штурмовых отрядов Протектората', () => {
  it('все затронутые отряды несут кредит В. Чернецова', () => {
    for (const id of SHTURM_SQUADS) {
      const credit = getEncyclopediaUnit(id)?.provenance?.credit;
      expect({ id, credit }).toEqual({ id, credit: CREDIT });
    }
  });

  it('киберпехота сохраняет АВБ-происхождение поверх добавленного кредита', () => {
    const p = getEncyclopediaUnit('protectorate_shturmovaya_kiber_pehota')?.provenance;
    expect(p?.origin).toBe('avb');
    expect(p?.loreAuthor).toBe('avb');
  });

  it('фракция дополнена структурой ВКС (флот / гвардия / киберпехота / наёмники)', () => {
    const d = getEncyclopediaFaction('protectorate')?.description ?? '';
    for (const fragment of ['флот', 'планетарная гвардия', 'киберпехот', 'наёмные отряды']) {
      expect(d).toContain(fragment);
    }
  });

  it('новый лор отрядов проходит latin-bleed guard', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    for (const id of SHTURM_SQUADS) {
      const u = getEncyclopediaUnit(id);
      const texts = [u?.encyclopedia?.lore, u?.encyclopedia?.history].filter(Boolean) as string[];
      expect(texts.length).toBeGreaterThan(0);
      for (const v of texts) {
        expect(v).not.toMatch(LATIN_WORD);
      }
    }
  });
});
