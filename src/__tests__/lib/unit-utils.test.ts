import { getAliveSoldiersCount } from '@/lib/unit-utils';
import type { ArmyUnit, Squad, Machine } from '@/lib/types';

const makeSquadUnit = (soldierCount: number, dead: number[]): ArmyUnit => {
  const squad = {
    id: 'test_squad',
    name: 'Тестовый отряд',
    faction: 'polaris',
    cost: 50,
    soldiers: Array.from({ length: soldierCount }, () => ({
      rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, armor: 2, props: [],
    })),
  } as Squad;
  return {
    instanceId: 'unit-1',
    type: 'squad',
    data: squad,
    deadSoldiers: dead,
  } as ArmyUnit;
};

describe('getAliveSoldiersCount', () => {
  it('вычитает убитых из численности отряда', () => {
    expect(getAliveSoldiersCount(makeSquadUnit(6, [1, 3]))).toBe(4);
  });

  it('без deadSoldiers — весь отряд жив', () => {
    const unit = { ...makeSquadUnit(4, []) } as ArmyUnit;
    delete (unit as Partial<ArmyUnit>).deadSoldiers;
    expect(getAliveSoldiersCount(unit)).toBe(4);
  });

  it('пустой список убитых — весь отряд жив', () => {
    expect(getAliveSoldiersCount(makeSquadUnit(3, []))).toBe(3);
  });

  it('все убиты — 0', () => {
    expect(getAliveSoldiersCount(makeSquadUnit(5, [0, 1, 2, 3, 4]))).toBe(0);
  });

  it('машина — 0 (не отряд)', () => {
    const machineUnit = {
      instanceId: 'machine-1',
      type: 'machine',
      data: { id: 'm', name: 'Хантер', faction: 'polaris', cost: 100 } as Machine,
    } as ArmyUnit;
    expect(getAliveSoldiersCount(machineUnit)).toBe(0);
  });
});
