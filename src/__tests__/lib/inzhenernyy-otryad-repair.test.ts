import { describe, it, expect } from '@jest/globals';
import type { Squad } from '@/lib/types';
import squadsData from '@/data/sources/star_system/polaris/squads.json';

/**
 * «Инженерный отряд Долгорукого» — весь отряд инженеры, спец-свойство
 * «Рм» (механик, каталог standard-modifiers) должно быть у КАЖДОГО бойца,
 * а не только у №3 (решение владельца 2026-10-15: «ремонт для всех»).
 */
const squads = squadsData as Squad[];
const squad = squads.find((s) => s.id === 'polaris_inzhenernyy_otryad_dolgorukogo');

describe('Инженерный отряд Долгорукого — Рм у всех бойцов', () => {
  it('отряд существует в star_system/polaris', () => {
    expect(squad).toBeDefined();
  });

  it('каждый боец имеет спец-свойство mechanic (Рм)', () => {
    expect(squad!.soldiers).toHaveLength(6);
    const without = squad!.soldiers.filter((s) => !(s.modifiers ?? []).includes('mechanic'));
    expect(without.map((s) => `№${s.num}`)).toEqual([]);
  });
});
