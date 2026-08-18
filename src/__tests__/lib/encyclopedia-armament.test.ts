import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';

const names = (id: string) =>
  (getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []).map((w) => w.name).join('|');

describe('encyclopedia machine armament (Справочник техники)', () => {
  it('griffin carries the four handbook weapons', () => {
    const all = names('griffin');
    expect(all).toContain('Световой меч');
    expect(all).toContain('Драконье пламя');
    expect(all).toContain('Триплет');
    expect(all).toContain('Алебарда');
  });

  it('machines outside the handbook have no armament (секции нет — данных нет)', () => {
    // hornet отсутствует в справочнике (реестр источников №2)
    expect(getEncyclopediaUnit('hornet')?.encyclopedia?.armament).toBeUndefined();
  });

  it('every designation follows the БМР/УМ index system', () => {
    for (const id of ['griffin', 'hurricane', 'tornado', 'trex', 'raptor', 'spider', 'locust', 'helix']) {
      const d = getEncyclopediaUnit(id)?.encyclopedia?.designation;
      if (d) expect(d).toMatch(/^(БМР|УМ)/);
    }
  });

  it('armament entries pass the latin-bleed guard (only short model codes)', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    for (const id of ['griffin', 'hurricane', 'tornado', 'trex', 'raptor', 'spider', 'locust', 'helix', 'thunder', 'devastator']) {
      for (const w of getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []) {
        for (const v of [w.name, w.caliber, w.range, w.notes].filter(Boolean) as string[]) {
          // id в объекте, не в проверяемой строке — латинский ID машины не должен
          // сам становиться ложным срабатыванием guard'а
          expect({ id, v }).toEqual({ id, v: expect.not.stringMatching(LATIN_WORD) });
        }
      }
    }
  });
});
