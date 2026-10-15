import { getAliveSoldiersCount, countUnitsByStatus, getMachineSpeed, formatUnitStatsParts, toggleUnitDone, getUnitTurnProgress, getArmyTurnProgress } from '@/lib/unit-utils';
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

describe('formatUnitStatsParts', () => {
  it('отряд: жизни (♥) — на фото-чип, броня+движение — строкой', () => {
    const parts = formatUnitStatsParts(makeSquadUnit(6, []), 5);
    expect(parts.lives).toBe('♥ 6/6');
    expect(parts.stats).toBe('🛡 2 · 👣 5 (25см)');
  });

  it('отряд: фактор 4 — сантиметры считаются по 4', () => {
    const parts = formatUnitStatsParts(makeSquadUnit(6, []), 4);
    expect(parts.stats).toBe('🛡 2 · 👣 5 (20см)');
  });

  it('отряд: живые с учётом убитых', () => {
    const parts = formatUnitStatsParts(makeSquadUnit(6, [1, 3]), 5);
    expect(parts.lives).toBe('♥ 4/6');
  });

  it('отряд: непостоянная скорость — без 👣 в строке', () => {
    const unit = makeSquadUnit(3, []);
    (unit.data as Squad).soldiers[1].speed = 3;
    expect(formatUnitStatsParts(unit, 5).stats).toBe('🛡 2');
  });

  it('отряд: непостоянная броня — без 🛡 в строке', () => {
    const unit = makeSquadUnit(3, []);
    (unit.data as Squad).soldiers[1].armor = 5;
    expect(formatUnitStatsParts(unit, 5).stats).toBe('👣 5 (25см)');
  });

  it('машина: HP — чипом, скорость сектора — строкой', () => {
    const parts = formatUnitStatsParts(makeMachineUnit({ currentDurability: 16 }), 5);
    expect(parts.lives).toBe('HP 16/16');
    expect(parts.stats).toBe('👣 2 (10см)');
  });
});

describe('toggleUnitDone', () => {
  it('активный отряд: все живые бойцы становятся «походил»', () => {
    const unit = {
      ...makeSquadUnit(3, [2]),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
      ],
    } as ArmyUnit;

    const next = toggleUnitDone(unit);
    expect(next.actionsUsed![0].done).toBe(true);
    expect(next.actionsUsed![1].done).toBe(true);
    // мёртвого не трогаем
    expect(next.actionsUsed![2].done).toBe(false);
  });

  it('отряд «походил»: повторный тап снимает отметку у всех', () => {
    const unit = {
      ...makeSquadUnit(3, []),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: true },
      ],
    } as ArmyUnit;

    const next = toggleUnitDone(unit);
    expect(next.actionsUsed!.every((a) => !a.done)).toBe(true);
  });

  it('машина: переключает isMachineDone', () => {
    const machine = makeMachineUnit();
    expect(toggleUnitDone(machine).isMachineDone).toBe(true);
    expect(toggleUnitDone({ ...machine, isMachineDone: true }).isMachineDone).toBe(false);
  });

  it('паникующий боец не отмечается (§10 — не действует)', () => {
    const unit = {
      ...makeSquadUnit(2, []),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
      ],
      panicState: [{ soldierIndex: 1 }],
    } as ArmyUnit;

    const next = toggleUnitDone(unit);
    expect(next.actionsUsed![0].done).toBe(true);
    expect(next.actionsUsed![1].done).toBe(false);
  });

  it('не мутирует исходный юнит', () => {
    const unit = {
      ...makeSquadUnit(2, []),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
      ],
    } as ArmyUnit;
    const snapshot = JSON.stringify(unit.actionsUsed);

    toggleUnitDone(unit);
    expect(JSON.stringify(unit.actionsUsed)).toBe(snapshot);
  });
});

describe('getUnitTurnProgress', () => {
  it('считает живых и походивших (мёртвые не в счёт)', () => {
    const unit = {
      ...makeSquadUnit(4, [3]),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: false },
      ],
    } as ArmyUnit;

    // живых 3, походили 2 (мёртвый №4 с done-флагом не считается)
    expect(getUnitTurnProgress(unit)).toEqual({ alive: 3, acted: 2, all: false });
  });

  it('все живые походили — all: true', () => {
    const unit = {
      ...makeSquadUnit(2, [1]),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: true },
      ],
    } as ArmyUnit;

    expect(getUnitTurnProgress(unit)).toEqual({ alive: 1, acted: 1, all: true });
  });

  it('без actionsUsed — acted: 0', () => {
    expect(getUnitTurnProgress(makeSquadUnit(3, []))).toEqual({ alive: 3, acted: 0, all: false });
  });

  it('машина — null (у неё нет бойцов)', () => {
    expect(getUnitTurnProgress(makeMachineUnit())).toBeNull();
  });
});

// Прогресс хода АРМИИ целиком — для кнопки «Завершить тур» (плейтест
// 2026-10-15: прогресс виден у кнопки, не в строках навигатора).
describe('getArmyTurnProgress', () => {
  it('складывает бойцов отрядов', () => {
    const a = {
      ...makeSquadUnit(3, []),
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: true },
        { moved: false, shot: false, melee: false, done: false },
      ],
    } as ArmyUnit;
    const b = makeSquadUnit(2, [0]); // 1 живой, не походил

    expect(getArmyTurnProgress([a, b])).toEqual({ acted: 2, total: 4 });
  });

  it('машина считается за единицу (isMachineDone)', () => {
    const done = makeMachineUnit({ isMachineDone: true });
    const notDone = makeMachineUnit();

    expect(getArmyTurnProgress([done, notDone])).toEqual({ acted: 1, total: 2 });
  });

  it('пустая армия — нули (кнопка без счётчика)', () => {
    expect(getArmyTurnProgress([])).toEqual({ acted: 0, total: 0 });
  });
});
