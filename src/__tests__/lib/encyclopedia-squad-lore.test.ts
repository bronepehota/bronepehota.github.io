import { getAllUnits } from '@/lib/encyclopedia-registry';

const allUnits = getAllUnits();
const squads = allUnits.filter((u) => u.type === 'squad');

const CJK = /[一-鿿]/;
const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
const FORBIDDEN_SQUAD_KEYS = ['traditions', 'keyBattles', 'locations', 'manufacturer'];

describe('encyclopedia squad lore', () => {
  it('every squad has exactly the target encyclopedia shape', () => {
    expect(squads.length).toBe(32);
    for (const u of squads) {
      const keys = Object.keys(u.encyclopedia ?? {}).sort();
      expect(keys).toEqual(['class', 'history', 'lore', 'shortDescription', 'tactics'].sort());
      for (const k of FORBIDDEN_SQUAD_KEYS) {
        expect(keys).not.toContain(k);
      }
      expect((u.encyclopedia?.shortDescription ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('no encyclopedia text field contains CJK or latin-bleed', () => {
    for (const u of allUnits) {
      const enc = u.encyclopedia ?? {};
      for (const [k, v] of Object.entries(enc)) {
        if (k === 'sourceUrl' || typeof v !== 'string') continue;
        expect({ id: u.id, k, cjk: CJK.test(v) }).toEqual({ id: u.id, k, cjk: false });
        expect({ id: u.id, k, latin: LATIN_WORD.test(v) }).toEqual({ id: u.id, k, latin: false });
      }
    }
  });
});
