import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';

const names = (id: string) =>
  (getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []).map((w) => w.name).join('|');

const WITH_ARMAMENT = [
  // protectorate
  'bronekhod', 'carnivore', 'griffin', 'hurricane', 'octopus', 'predator',
  'salamander', 'tornado', 'trex', 'varan', 'werewolf',
  // polaris
  'demolisher', 'devastator', 'eraser', 'helix', 'locust', 'madbull',
  'raptor', 'ravingbeast', 'spider', 'superlocust', 'thunder', 'wildbear',
] as const;

describe('encyclopedia machine armament (Справочник техники)', () => {
  it('griffin carries the four handbook weapons', () => {
    const all = names('griffin');
    expect(all).toContain('Световой меч');
    expect(all).toContain('Драконье пламя');
    expect(all).toContain('Триплет');
    expect(all).toContain('Алебарда');
  });

  it('every machine from the handbook has an armament block', () => {
    for (const id of WITH_ARMAMENT) {
      const len = getEncyclopediaUnit(id)?.encyclopedia?.armament?.length ?? 0;
      // id в массиве — идентифицирует машину в сообщении об ошибке
      expect([id, len]).toEqual([id, expect.any(Number)]);
      expect(len).toBeGreaterThan(0);
    }
  });

  it('machines outside the handbook have no armament (секции нет — данных нет)', () => {
    // hornet/hunter/t_600 — 0 упоминаний в «Справочнике техники» (проверено
    // grep'ом по декодированному тексту и по извлечённым секциям «Вооружение»)
    for (const id of ['hornet', 'hunter', 't_600']) {
      expect(getEncyclopediaUnit(id)?.encyclopedia?.armament).toBeUndefined();
    }
  });

  it('every designation follows the БМР/УМ index system', () => {
    const ids = [
      ...WITH_ARMAMENT,
      // моноблок без индекса в спек-блоке — designation обязана отсутствовать
      'hornet', 'hunter', 't_600',
    ];
    for (const id of ids) {
      const d = getEncyclopediaUnit(id)?.encyclopedia?.designation;
      // id в объекте — идентифицирует машину в сообщении об ошибке
      if (d) expect({ id, d }).toEqual({ id, d: expect.stringMatching(/^(БМР|УМ)/) });
    }
  });

  it('armament entries pass the latin-bleed guard (only short model codes)', () => {
    const LATIN_WORD = /\b[A-Za-z]{4,}\b/;
    for (const id of WITH_ARMAMENT) {
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
