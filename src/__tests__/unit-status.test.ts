import { deriveUnitStatus } from '@/lib/unit-status';
import { ArmyUnit, Squad, Machine } from '@/lib/types';

describe('deriveUnitStatus', () => {
  const makeSquadUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => ({
    instanceId: 'test-squad',
    type: 'squad',
    data: {
      id: 'test',
      name: 'Test Squad',
      faction: 'polaris',
      cost: 50,
      soldiers: [
        { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
        { rank: 5, speed: 4, range: 'D6', power: '1D6', melee: 0, armor: 2 },
      ],
    } as Squad,
    ...overrides,
  });

  const makeMachineUnit = (overrides: Partial<ArmyUnit> = {}): ArmyUnit => ({
    instanceId: 'test-machine',
    type: 'machine',
    data: {
      id: 'test-m',
      name: 'Test Machine',
      faction: 'polaris',
      cost: 100,
      rank: 2,
      fire_rate: 2,
      ammo_max: 20,
      durability_max: 16,
      speed_sectors: [],
      weapons: [{ name: 'Gun', range: 'D12', power: '2D20' }],
    } as Machine,
    ...overrides,
  });

  describe('squad', () => {
    it('returns active when soldiers have no actions', () => {
      const unit = makeSquadUnit();
      expect(deriveUnitStatus(unit)).toBe('active');
    });

    it('returns done when all soldiers are done or dead', () => {
      const unit = makeSquadUnit({
        actionsUsed: [
          { moved: false, shot: false, melee: false, done: true },
          { moved: false, shot: false, melee: false, done: true },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns done when one soldier done and one dead', () => {
      const unit = makeSquadUnit({
        deadSoldiers: [0],
        actionsUsed: [
          undefined as any,
          { moved: false, shot: false, melee: false, done: true },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns dead when all soldiers are dead', () => {
      const unit = makeSquadUnit({
        deadSoldiers: [0, 1],
      });
      expect(deriveUnitStatus(unit)).toBe('dead');
    });

    it('returns active when some soldiers still have actions', () => {
      const unit = makeSquadUnit({
        actionsUsed: [
          { moved: false, shot: false, melee: false, done: true },
          { moved: false, shot: false, melee: false, done: false },
        ],
      });
      expect(deriveUnitStatus(unit)).toBe('active');
    });
  });

  describe('machine', () => {
    it('returns active when machine has durability and is not done', () => {
      const unit = makeMachineUnit({ currentDurability: 10 });
      expect(deriveUnitStatus(unit)).toBe('active');
    });

    it('returns done when machine is marked done', () => {
      const unit = makeMachineUnit({ currentDurability: 10, isMachineDone: true });
      expect(deriveUnitStatus(unit)).toBe('done');
    });

    it('returns dead when durability is 0', () => {
      const unit = makeMachineUnit({ currentDurability: 0 });
      expect(deriveUnitStatus(unit)).toBe('dead');
    });
  });
});