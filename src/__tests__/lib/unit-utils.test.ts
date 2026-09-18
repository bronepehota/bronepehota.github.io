import { getAliveSoldiersCount, countUnitsByStatus, getMachineSpeed } from '@/lib/unit-utils';
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

const makeMachineUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => {
  const machine = {
    id: 'test_machine',
    name: 'Хантер',
    faction: 'polaris',
    cost: 100,
    durability_max: 16,
    speed_sectors: [
      { min_durability: 9, max_durability: 16, speed: 2 },
      { min_durability: 1, max_durability: 8, speed: 1 },
    ],
  } as Machine;
  return {
    instanceId: 'machine-1',
    type: 'machine',
    data: machine,
    currentDurability: 16,
    ...overrides,
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

describe('countUnitsByStatus', () => {
  it('смешанная армия — по одному юниту на статус', () => {
    const activeSquad = makeSquadUnit(3, []);
    const doneSquad = {
      ...makeSquadUnit(3, []),
      instanceId: 'unit-done',
      actionsUsed: [0, 1, 2].map(() => ({ moved: false, shot: false, melee: false, done: true })),
    } as ArmyUnit;
    const deadMachine = makeMachineUnit({ instanceId: 'machine-dead', currentDurability: 0 });
    const capturedMachine = makeMachineUnit({ instanceId: 'machine-captured', isCaptured: true });

    expect(countUnitsByStatus([activeSquad, doneSquad, deadMachine, capturedMachine]))
      .toEqual({ active: 1, done: 1, dead: 1, captured: 1 });
  });

  it('пустая армия — нули', () => {
    expect(countUnitsByStatus([])).toEqual({ active: 0, done: 0, dead: 0, captured: 0 });
  });

  it('частично завершённый отряд — active', () => {
    const partial = {
      ...makeSquadUnit(3, []),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
      ],
    } as ArmyUnit;
    expect(countUnitsByStatus([partial])).toEqual({ active: 1, done: 0, dead: 0, captured: 0 });
  });
});

describe('getMachineSpeed', () => {
  it('верхний сектор прочности — его скорость', () => {
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 16 }))).toBe(2);
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 9 }))).toBe(2);
  });

  it('нижний сектор прочности — его скорость', () => {
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 8 }))).toBe(1);
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 1 }))).toBe(1);
  });

  it('разрушенная машина (0) — 0', () => {
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 0 }))).toBe(0);
  });

  it('без currentDurability — 0', () => {
    const unit = makeMachineUnit();
    delete (unit as Partial<ArmyUnit>).currentDurability;
    expect(getMachineSpeed(unit)).toBe(0);
  });

  it('отряд — 0 (не машина)', () => {
    expect(getMachineSpeed(makeSquadUnit(3, []))).toBe(0);
  });

  it('сектор не найден — 0', () => {
    expect(getMachineSpeed(makeMachineUnit({ currentDurability: 20 }))).toBe(0);
  });
});
