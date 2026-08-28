import { saveArmy, loadArmy, migrateArmy, rehydrateFromSource, ARMY_SCHEMA_VERSION } from '@/lib/army-storage';
import { Army, ArmyUnit } from '@/lib/types';
import { getSourceWithCustom } from '@/lib/sources-registry';

const baseArmy: Army = {
  name: 'Test',
  faction: 'polaris',
  sourceId: 'star_system',
  units: [],
  totalCost: 0,
};

const machineFixture = (overrides: Partial<ArmyUnit> = {}): ArmyUnit =>
  ({
    instanceId: 'm1',
    type: 'machine',
    data: { id: 'm', name: 'M' },
    machineShotsUsed: 2,
    isMachineShot: true,
    ...overrides,
  } as unknown as ArmyUnit);

describe('army-storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips an army through save/load', () => {
    saveArmy({ ...baseArmy, name: 'Round Trip' });
    expect(loadArmy()?.name).toBe('Round Trip');
  });

  it('persists with a schemaVersion envelope', () => {
    saveArmy(baseArmy);
    const raw = JSON.parse(localStorage.getItem('bronepehota_army')!);
    expect(raw.schemaVersion).toBe(ARMY_SCHEMA_VERSION);
    expect(raw.army.name).toBe('Test');
  });

  it('returns null when absent', () => {
    expect(loadArmy()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    localStorage.setItem('bronepehota_army', '{not json');
    expect(loadArmy()).toBeNull();
  });

  it('migrates a legacy bare-army (no envelope) and applies defaults', () => {
    const legacy = { name: 'Old', units: [], totalCost: 0 }; // missing currentStep/isInBattle/currentTurn
    localStorage.setItem('bronepehota_army', JSON.stringify(legacy));
    const loaded = loadArmy();
    expect(loaded?.name).toBe('Old');
    expect(loaded?.currentStep).toBe('faction-select');
    expect(loaded?.isInBattle).toBe(false);
    expect(loaded?.currentTurn).toBe(1);
  });

  it('resets machine shot counters for a stale battle (>1h)', () => {
    const army: Army = {
      ...baseArmy,
      isInBattle: true,
      lastBattleDate: '2020-01-01T00:00:00Z',
      units: [machineFixture()],
    };
    const migrated = migrateArmy(army, new Date('2020-01-02T00:00:00Z').getTime());
    expect(migrated.units[0].machineShotsUsed).toBe(0);
    expect(migrated.units[0].isMachineShot).toBe(false);
  });

  it('does NOT reset for a fresh battle (<1h)', () => {
    const army: Army = {
      ...baseArmy,
      isInBattle: true,
      lastBattleDate: '2020-01-01T12:00:00Z',
      units: [machineFixture()],
    };
    const migrated = migrateArmy(army, new Date('2020-01-01T12:30:00Z').getTime());
    expect(migrated.units[0].machineShotsUsed).toBe(2);
    expect(migrated.units[0].isMachineShot).toBe(true);
  });

  it('sanitizes broken unit entries at the storage boundary: keeps ONLY valid instances', () => {
    const validSquad = {
      instanceId: 's1', type: 'squad', data: { id: 's', name: 'S' },
    } as unknown as ArmyUnit;
    const brokenUnits = [
      {},                                              // совсем пустой объект
      { instanceId: 'x', type: 'squad' },              // без data
      { instanceId: 'y', type: 'weird', data: {} },    // чужой type
    ] as unknown as ArmyUnit[];
    localStorage.setItem('bronepehota_army', JSON.stringify({
      schemaVersion: ARMY_SCHEMA_VERSION,
      army: { ...baseArmy, units: [...brokenUnits, validSquad] },
    }));

    const loaded = loadArmy();
    expect(loaded?.units).toHaveLength(1);
    expect(loaded?.units[0].instanceId).toBe('s1');
    expect(loaded?.units[0].type).toBe('squad');
  });
});

describe('army-storage — rehydrate from source', () => {
  const realSquad = getSourceWithCustom('star_system')!.squads.find(
    (s) => s.id === 'polaris_lineynaya_klon_pehota'
  )!;

  it('refreshes a stale squad when structurally compatible (same soldier count)', () => {
    const army: Army = {
      ...baseArmy,
      sourceId: 'star_system',
      units: [{ instanceId: 'u1', type: 'squad', data: { ...realSquad, name: 'STALE' } } as ArmyUnit],
    };
    expect(rehydrateFromSource(army).units[0].data.name).toBe(realSquad.name);
  });

  it('keeps stored data when the source no longer has the unit', () => {
    const army: Army = {
      ...baseArmy,
      sourceId: 'star_system',
      units: [{
        instanceId: 'u1', type: 'squad',
        data: { id: 'ghost', name: 'STALE', faction: 'polaris', cost: 999, soldiers: [] },
      } as ArmyUnit],
    };
    expect(rehydrateFromSource(army).units[0].data.name).toBe('STALE');
  });

  it('keeps stored data when the soldier count changed (incompatible)', () => {
    const army: Army = {
      ...baseArmy,
      sourceId: 'star_system',
      units: [{
        instanceId: 'u1', type: 'squad',
        data: { ...realSquad, name: 'STALE', soldiers: [...realSquad.soldiers, ...realSquad.soldiers] },
      } as ArmyUnit],
    };
    expect(rehydrateFromSource(army).units[0].data.name).toBe('STALE');
  });
});
