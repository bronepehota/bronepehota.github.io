import { getEncyclopediaUnit } from '@/lib/encyclopedia-registry';

const names = (id: string) =>
  (getEncyclopediaUnit(id)?.encyclopedia?.armament ?? []).map((w) => w.name).join('|');

const WITH_ARMAMENT = [
  // protectorate
  'bronekhod', 'carnivore', 'condor', 'griffin', 'hurricane', 'octopus',
  'predator', 'puma', 'salamander', 'tornado', 'trex', 'varan', 'viper',
  'werewolf',
  // polaris
  'demolisher', 'devastator', 'eraser', 'helix', 'hornet', 'hunter',
  'locust', 'madbull', 'raptor', 'ravingbeast', 'spider', 'superlocust',
  'thunder', 'wildbear',
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

  it('machines outside the sources have no armament (секции нет — данных нет)', () => {
    // t_600 — нет ни в «Справочнике техники», ни в статье клуба «Бронетехника»
    // (волна 4j закрыла armament-дыры у condor/puma/viper/hornet/hunter —
    // эти машины переехали в WITH_ARMAMENT выше).
    for (const id of ['t_600']) {
      expect(getEncyclopediaUnit(id)?.encyclopedia?.armament).toBeUndefined();
    }
  });

  it('every designation follows the БМР/УМ index system', () => {
    const ids = [
      ...WITH_ARMAMENT,
      // моноблок без индекса в спек-блоке — designation обязана отсутствовать
      't_600',
    ];
    for (const id of ids) {
      const d = getEncyclopediaUnit(id)?.encyclopedia?.designation;
      // id в объекте — идентифицирует машину в сообщении об ошибке
      if (d) expect({ id, d }).toEqual({ id, d: expect.stringMatching(/^(БМР|УМ)/) });
    }
  });

  it('Локуст/Супер Локуст несут свои пушки (баг-фикс волны 4j: свап против статьи «Бронетехника»)', () => {
    // Первоисточник (статья клуба + геймплейные данные star_system): Локуст —
    // скорострельные «Бамбук» ATC-40 40 мм; Супер Локуст — тяжёлые АТС-76 76 мм.
    // Ранее энциклопедический JSON нёс их наоборот.
    expect(names('locust')).toContain('«Бамбук» (ATC-40)');
    expect(names('locust')).not.toContain('АТС-76');
    expect(names('superlocust')).toContain('(АТС-76)');
    expect(names('superlocust')).not.toContain('ATC-40');
    // Энергетический гарпун — индекс PB-1M («Power Bolt»), не PG-1M.
    for (const id of ['madbull', 'eraser', 'ravingbeast']) {
      expect(names(id)).toContain('Энергетический гарпун (PB-1M)');
      expect(names(id)).not.toContain('PG-1M');
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
