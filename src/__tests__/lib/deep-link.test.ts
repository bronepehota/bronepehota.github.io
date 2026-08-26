// src/__tests__/lib/deep-link.test.ts
import { parseFactionParam, factionParamToApply } from '@/lib/deep-link';
import { Army, ArmyUnit } from '@/lib/types';

const VALID = ['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet'];

describe('parseFactionParam', () => {
  it('возвращает валидную фракцию из ?faction=', () => {
    expect(parseFactionParam('?faction=polaris', VALID)).toBe('polaris');
  });

  it('валидирует по списку: неизвестная фракция → null', () => {
    expect(parseFactionParam('?faction=unknown', VALID)).toBeNull();
  });

  it('нет параметра → null (пустая строка и другие параметры)', () => {
    expect(parseFactionParam('', VALID)).toBeNull();
    expect(parseFactionParam('?utm_source=vk', VALID)).toBeNull();
  });

  it('соседние параметры не мешают', () => {
    expect(parseFactionParam('?utm=1&faction=dead_fleet', VALID)).toBe('dead_fleet');
  });

  it('пустое значение → null', () => {
    expect(parseFactionParam('?faction=', VALID)).toBeNull();
  });

  it('пустой список валидных → null', () => {
    expect(parseFactionParam('?faction=polaris', [])).toBeNull();
  });
});

describe('factionParamToApply', () => {
  const freshArmy = { units: [], isInBattle: false } as Pick<Army, 'units' | 'isInBattle'>;

  it('применяет к свежей армии (без юнитов, не в бою)', () => {
    expect(factionParamToApply('?faction=rutenia', freshArmy, VALID)).toBe('rutenia');
  });

  it('НЕ применяет к армии с юнитами', () => {
    const army = { units: [{} as ArmyUnit], isInBattle: false };
    expect(factionParamToApply('?faction=rutenia', army, VALID)).toBeNull();
  });

  it('НЕ применяет к армии в бою', () => {
    const army = { units: [], isInBattle: true };
    expect(factionParamToApply('?faction=rutenia', army, VALID)).toBeNull();
  });

  it('невалидная фракция → null даже для свежей армии', () => {
    expect(factionParamToApply('?faction=xxx', freshArmy, VALID)).toBeNull();
  });
});
