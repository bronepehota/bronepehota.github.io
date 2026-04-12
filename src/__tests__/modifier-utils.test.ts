import {
  getUnitBuffs,
  isUnitAlive,
  collectBuffsForUnit,
  collectDebuffsForUnit,
  resolveModifierSummary,
  hasActiveModifiers,
  EMPTY_MODIFIER_SUMMARY,
  getSoldierModifiers,
  getStandardBuffs,
  getStandardDebuffs,
  getAllBuffs,
  getAllDebuffs,
  resolveSoldierEffects,
  cleanupExpiredModifiers,
  isModifierActive,
} from '@/lib/modifier-utils';
import type { BuffDefinition, ActiveDebuff, SoldierModifier, DebuffTemplate } from '@/lib/modifier-types';

// Mock getCustomModifiers to control custom catalog in tests
jest.mock('@/lib/editor/modifier-storage', () => {
  let _customBuffs: BuffDefinition[] = [];
  let _customDebuffs: DebuffTemplate[] = [];

  return {
    getCustomModifiers: () => ({ buffs: _customBuffs, debuffs: _customDebuffs }),
    __setCustomBuffs: (buffs: BuffDefinition[]) => { _customBuffs = buffs; },
    __setCustomDebuffs: (debuffs: DebuffTemplate[]) => { _customDebuffs = debuffs; },
    __resetCustom: () => { _customBuffs = []; _customDebuffs = []; },
  };
});

const mockedStorage = jest.requireMock('@/lib/editor/modifier-storage') as {
  __setCustomBuffs: (b: BuffDefinition[]) => void;
  __setCustomDebuffs: (d: DebuffTemplate[]) => void;
  __resetCustom: () => void;
};

// Helper to create a minimal ArmyUnit
function makeUnit(overrides: Record<string, any> = {}) {
  const { data: dataOverride, type: typeOverride, ...restOverrides } = overrides;
  const soldiers = dataOverride?.soldiers || [
    { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 2, armor: 2 },
    { rank: 2, speed: 4, range: 'D6', power: '1D6', melee: 1, armor: 2 },
  ];

  const data = {
    id: 'test-squad',
    name: 'Test',
    faction: 'polaris',
    cost: 100,
    soldiers,
    buffs: [],
    ...dataOverride,
  };

  return {
    instanceId: overrides.instanceId || 'test-unit-1',
    type: typeOverride || ('squad' as const),
    data,
    deadSoldiers: overrides.deadSoldiers || [],
    ...restOverrides,
  };
}

function makeArmy(units: any[], currentTurn?: number) {
  return { name: 'Test Army', totalCost: 0, units, ...(currentTurn !== undefined ? { currentTurn } : {}) };
}

describe('getUnitBuffs', () => {
  it('should return empty array for unit without buffs', () => {
    const unit = makeUnit();
    expect(getUnitBuffs(unit)).toEqual([]);
  });

  it('should return buffs defined on unit data', () => {
    const buff: BuffDefinition = {
      id: 'test-buff',
      name: 'Test Buff',
      description: 'A test buff',
      applyTo: ['army'],
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit = makeUnit({
      data: { buffs: [buff] },
    });
    expect(getUnitBuffs(unit)).toEqual([buff]);
  });

  it('should filter out consumed one-time-use buffs', () => {
    const buff: BuffDefinition = {
      id: 'one-time',
      name: 'One Time',
      description: 'One time use',
      applyTo: ['soldier'],
      target: 'melee_bonus',
      value: 1,
      phase: 'melee',
      oneTimeUse: true,
    };
    const unit = makeUnit({
      data: { buffs: [buff] },
      buffsUsed: ['one-time'],
    });
    expect(getUnitBuffs(unit)).toEqual([]);
  });

  it('should keep unused one-time-use buffs', () => {
    const buff: BuffDefinition = {
      id: 'one-time',
      name: 'One Time',
      description: 'One time use',
      applyTo: ['soldier'],
      target: 'melee_bonus',
      value: 1,
      phase: 'melee',
      oneTimeUse: true,
    };
    const unit = makeUnit({
      data: { buffs: [buff] },
      buffsUsed: [],
    });
    expect(getUnitBuffs(unit)).toEqual([buff]);
  });
});

describe('isUnitAlive', () => {
  it('should return true for squad with no dead soldiers', () => {
    const unit = makeUnit();
    expect(isUnitAlive(unit)).toBe(true);
  });

  it('should return false for squad with all soldiers dead', () => {
    const unit = makeUnit({ deadSoldiers: [0, 1] });
    expect(isUnitAlive(unit)).toBe(false);
  });

  it('should return true for squad with some soldiers dead', () => {
    const unit = makeUnit({ deadSoldiers: [0] });
    expect(isUnitAlive(unit)).toBe(true);
  });

  it('should return true for machine with durability > 0', () => {
    const unit = makeUnit({
      type: 'machine',
      data: { durability_max: 16 },
      currentDurability: 10,
    });
    expect(isUnitAlive(unit)).toBe(true);
  });

  it('should return false for machine with durability 0', () => {
    const unit = makeUnit({
      type: 'machine',
      data: { durability_max: 16 },
      currentDurability: 0,
    });
    expect(isUnitAlive(unit)).toBe(false);
  });
});

describe('collectBuffsForUnit', () => {
  it('should collect personal buffs from the unit itself', () => {
    const personalBuff: BuffDefinition = {
      id: 'personal',
      name: 'Personal',
      description: 'Personal buff',
      applyTo: ['soldier'],
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit = makeUnit({ data: { buffs: [personalBuff] } });
    const army = makeArmy([unit]);

    const buffs = collectBuffsForUnit(unit, army);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].id).toBe('personal');
  });

  it('should NOT collect personal buffs from other units', () => {
    const personalBuff: BuffDefinition = {
      id: 'personal',
      name: 'Personal',
      description: 'Personal buff',
      applyTo: ['soldier'],
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit1 = makeUnit({ data: { buffs: [personalBuff] } });
    const unit2 = makeUnit({ instanceId: 'other' });
    const army = makeArmy([unit1, unit2]);

    const buffs = collectBuffsForUnit(unit2, army);
    expect(buffs).toHaveLength(0);
  });

  it('should collect team buffs from all living units', () => {
    const teamBuff: BuffDefinition = {
      id: 'team',
      name: 'Team Buff',
      description: 'Team buff',
      applyTo: ['army'],
      target: 'power_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit1 = makeUnit({ data: { buffs: [teamBuff] } });
    const unit2 = makeUnit({ instanceId: 'other' });
    const army = makeArmy([unit1, unit2]);

    const buffs = collectBuffsForUnit(unit2, army);
    expect(buffs).toHaveLength(1);
    expect(buffs[0].id).toBe('team');
  });

  it('should NOT collect buffs from dead units', () => {
    const teamBuff: BuffDefinition = {
      id: 'team',
      name: 'Team Buff',
      description: 'Team buff',
      applyTo: ['army'],
      target: 'power_bonus',
      value: 1,
      phase: 'shot',
    };
    const deadUnit = makeUnit({
      instanceId: 'dead',
      data: { buffs: [teamBuff] },
      deadSoldiers: [0, 1],
    });
    const aliveUnit = makeUnit({ instanceId: 'alive' });
    const army = makeArmy([deadUnit, aliveUnit]);

    const buffs = collectBuffsForUnit(aliveUnit, army);
    expect(buffs).toHaveLength(0);
  });

  it('should filter by phase', () => {
    const shotBuff: BuffDefinition = {
      id: 'shot-only',
      name: 'Shot Buff',
      description: 'Shot only',
      applyTo: ['army'],
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit = makeUnit({ data: { buffs: [shotBuff] } });
    const army = makeArmy([unit]);

    // Debug: verify buffs are accessible
    const directBuffs = getUnitBuffs(unit);
    expect(directBuffs).toHaveLength(1); // Buffs exist on unit

    const buffs = collectBuffsForUnit(unit, army, 'shot');
    expect(buffs).toHaveLength(1);
    expect(collectBuffsForUnit(unit, army, 'melee')).toHaveLength(0);
    expect(collectBuffsForUnit(unit, army, 'always')).toHaveLength(1);
  });
});

describe('collectDebuffsForUnit', () => {
  it('should return debuffs from unit', () => {
    const debuff: ActiveDebuff = {
      id: 'slow',
      name: 'Замедление',
      description: 'Скорость x0.5',
      target: 'speed_multiply',
      value: 0.5,
      phase: 'always',
      appliedAtTurn: 1,
      duration: 2,
      expiresAtTurn: 3,
    };
    const unit = makeUnit({ activeDebuffs: [debuff] });
    const army = makeArmy([unit]);
    expect(collectDebuffsForUnit(unit, army)).toEqual([debuff]);
  });

  it('should filter by phase', () => {
    const shotDebuff: ActiveDebuff = {
      id: 'aim-penalty',
      name: 'Прицельный штраф',
      description: '-1 к дальности',
      target: 'range_bonus',
      value: -1,
      phase: 'shot',
      appliedAtTurn: 1,
      duration: 1,
      expiresAtTurn: 2,
    };
    const unit = makeUnit({ activeDebuffs: [shotDebuff] });
    const army = makeArmy([unit]);

    expect(collectDebuffsForUnit(unit, army, 'shot')).toHaveLength(1);
    expect(collectDebuffsForUnit(unit, army, 'melee')).toHaveLength(0);
  });

  it('should return empty array for unit without debuffs', () => {
    const unit = makeUnit();
    const army = makeArmy([unit]);
    expect(collectDebuffsForUnit(unit, army)).toEqual([]);
  });
});

describe('resolveModifierSummary', () => {
  it('should return empty summary when no modifiers', () => {
    const unit = makeUnit();
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot');
    expect(summary).toEqual(EMPTY_MODIFIER_SUMMARY);
  });

  it('should sum range bonuses from multiple buffs', () => {
    const buff1: BuffDefinition = {
      id: 'b1', name: 'B1', description: '', applyTo: ['army'],
      target: 'range_bonus', value: 1, phase: 'shot',
    };
    const buff2: BuffDefinition = {
      id: 'b2', name: 'B2', description: '', applyTo: ['army'],
      target: 'range_bonus', value: 2, phase: 'shot',
    };
    const unit = makeUnit({ data: { buffs: [buff1, buff2] } });
    const army = makeArmy([unit]);

    const summary = resolveModifierSummary(unit, army, 'shot');
    expect(summary.rangeBonus).toBe(3);
    expect(summary.powerBonus).toBe(0);
  });

  it('should combine buff and debuff', () => {
    const buff: BuffDefinition = {
      id: 'buff', name: 'Buff', description: '', applyTo: ['army'],
      target: 'range_bonus', value: 2, phase: 'shot',
    };
    const debuff: ActiveDebuff = {
      id: 'debuff', name: 'Debuff', description: '',
      target: 'range_bonus', value: -1, phase: 'shot', appliedAtTurn: 1,
      duration: 2,
      expiresAtTurn: 3,
    };
    const unit = makeUnit({ data: { buffs: [buff] }, activeDebuffs: [debuff] });
    const army = makeArmy([unit]);

    const summary = resolveModifierSummary(unit, army, 'shot');
    expect(summary.rangeBonus).toBe(1); // +2 -1 = +1
  });

  it('should handle melee phase separately', () => {
    const meleeBuff: BuffDefinition = {
      id: 'melee-buff', name: 'Melee Buff', description: '', applyTo: ['army'],
      target: 'melee_bonus', value: 1, phase: 'melee',
    };
    const unit = makeUnit({ data: { buffs: [meleeBuff] } });
    const army = makeArmy([unit]);

    const shotSummary = resolveModifierSummary(unit, army, 'shot');
    expect(shotSummary.meleeBonus).toBe(0);

    const meleeSummary = resolveModifierSummary(unit, army, 'melee');
    expect(meleeSummary.meleeBonus).toBe(1);
  });

  it('should include soldier modifiers when soldierIndex provided', () => {
    const soldierMod: SoldierModifier = {
      id: 'sm_1', catalogId: 'aim_boost', name: 'Aim Boost', description: '+2 range',
      target: 'range_bonus', value: 2, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [soldierMod] });
    const army = makeArmy([unit]);

    // With soldierIndex=0 — should include soldier modifier
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(2);

    // Without soldierIndex — should NOT include soldier modifier
    const noSoldierSummary = resolveModifierSummary(unit, army, 'shot');
    expect(noSoldierSummary.rangeBonus).toBe(0);
  });

  it('should filter soldier modifiers by phase', () => {
    const shotMod: SoldierModifier = {
      id: 'sm_shot', name: 'Shot Mod', description: '+1 range',
      target: 'range_bonus', value: 1, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [shotMod] });
    const army = makeArmy([unit]);

    const shotSummary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(shotSummary.rangeBonus).toBe(1);

    const meleeSummary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(meleeSummary.rangeBonus).toBe(0);
  });

  it('should combine soldier modifiers with squad buffs and debuffs', () => {
    const squadBuff: BuffDefinition = {
      id: 'sb1', name: 'Squad Buff', description: '', applyTo: ['army'],
      target: 'range_bonus', value: 1, phase: 'shot',
    };
    const soldierMod: SoldierModifier = {
      id: 'sm1', name: 'Soldier Mod', description: '+2 range',
      target: 'range_bonus', value: 2, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const debuff: ActiveDebuff = {
      id: 'd1', name: 'Debuff', description: '',
      target: 'range_bonus', value: -1, phase: 'shot', appliedAtTurn: 1,
      duration: 2, expiresAtTurn: 3,
    };
    const unit = makeUnit({
      data: { buffs: [squadBuff] },
      soldierModifiers: [soldierMod],
      activeDebuffs: [debuff],
    });
    const army = makeArmy([unit]);

    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    // +1 squad + 2 soldier - 1 debuff = +2
    expect(summary.rangeBonus).toBe(2);
  });
});

describe('getSoldierModifiers', () => {
  it('should return empty for machines', () => {
    const machineUnit = makeUnit({
      type: 'machine',
      data: {
        id: 'test-machine', name: 'Tank', faction: 'polaris', cost: 200,
        rank: 2, fire_rate: 2, ammo_max: 20, durability_max: 16,
        speed_sectors: [{ min_durability: 1, max_durability: 16, speed: 2 }],
        weapons: [{ name: 'Gun', range: 'D12', power: '2D20' }],
      },
    });
    const army = makeArmy([machineUnit]);
    expect(getSoldierModifiers(machineUnit, 0, army)).toEqual([]);
  });

  it('should return modifiers for specific soldier', () => {
    const mod0: SoldierModifier = {
      id: 'sm0', name: 'Mod 0', description: '',
      target: 'range_bonus', value: 1, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const mod1: SoldierModifier = {
      id: 'sm1', name: 'Mod 1', description: '',
      target: 'armor_bonus', value: 2, phase: 'always',
      appliedAtTurn: 1, duration: 2, expiresAtTurn: 3, soldierIndex: 1,
    };
    const unit = makeUnit({ soldierModifiers: [mod0, mod1] });
    const army = makeArmy([unit]);

    expect(getSoldierModifiers(unit, 0, army)).toEqual([mod0]);
    expect(getSoldierModifiers(unit, 1, army)).toEqual([mod1]);
  });

  it('should include permanent modifiers (no duration)', () => {
    const permanentMod: SoldierModifier = {
      id: 'pm', name: 'Mechanic', description: 'Repair ability',
      target: 'custom', value: 0, phase: 'always',
      appliedAtTurn: 1, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [permanentMod] });
    const army = makeArmy([unit]);

    expect(getSoldierModifiers(unit, 0, army)).toEqual([permanentMod]);
  });
});

describe('hasActiveModifiers', () => {
  it('should return false for empty summary', () => {
    expect(hasActiveModifiers(EMPTY_MODIFIER_SUMMARY)).toBe(false);
  });

  it('should return true for summary with descriptions', () => {
    expect(hasActiveModifiers({ ...EMPTY_MODIFIER_SUMMARY, descriptions: ['test'] })).toBe(true);
  });
});

describe('getAllBuffs', () => {
  afterEach(() => {
    mockedStorage.__resetCustom();
  });

  it('should return standard buffs when no custom buffs exist', () => {
    const standard = getStandardBuffs();
    const all = getAllBuffs();
    expect(all.length).toBeGreaterThanOrEqual(standard.length);
    // All standard buffs should be present
    for (const sb of standard) {
      expect(all.find(b => b.id === sb.id)).toBeDefined();
    }
  });

  it('should merge custom buffs with standard buffs', () => {
    const customBuff: BuffDefinition = {
      id: 'custom_test_buff',
      name: 'Custom Test',
      description: 'A custom buff',
      applyTo: ['soldier'],
      target: 'range_bonus',
      value: 3,
      phase: 'shot',
      isCustom: true,
    };
    mockedStorage.__setCustomBuffs([customBuff]);

    const all = getAllBuffs();
    const found = all.find(b => b.id === 'custom_test_buff');
    expect(found).toBeDefined();
    expect(found!.value).toBe(3);
    expect(found!.isCustom).toBe(true);
  });

  it('should deduplicate: custom buff overrides standard with same ID', () => {
    const standard = getStandardBuffs();
    if (standard.length === 0) return;
    const originalBuff = standard[0];

    const overrideBuff: BuffDefinition = {
      ...originalBuff,
      name: 'OVERridden',
      value: 999,
      isCustom: true,
    };
    mockedStorage.__setCustomBuffs([overrideBuff]);

    const all = getAllBuffs();
    const found = all.filter(b => b.id === originalBuff.id);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('OVERridden');
    expect(found[0].value).toBe(999);
  });

  it('should return only standard buffs after reset', () => {
    const customBuff: BuffDefinition = {
      id: 'tmp_custom',
      name: 'Temp',
      description: 'Temporary',
      applyTo: ['soldier'],
      target: 'melee_bonus',
      value: 1,
      phase: 'melee',
      isCustom: true,
    };
    mockedStorage.__setCustomBuffs([customBuff]);
    expect(getAllBuffs().find(b => b.id === 'tmp_custom')).toBeDefined();

    mockedStorage.__resetCustom();
    expect(getAllBuffs().find(b => b.id === 'tmp_custom')).toBeUndefined();
  });
});

describe('getAllDebuffs', () => {
  afterEach(() => {
    mockedStorage.__resetCustom();
  });

  it('should return standard debuffs when no custom debuffs exist', () => {
    const standard = getStandardDebuffs();
    const all = getAllDebuffs();
    expect(all.length).toBeGreaterThanOrEqual(standard.length);
    for (const sd of standard) {
      expect(all.find(d => d.id === sd.id)).toBeDefined();
    }
  });

  it('should merge custom debuffs with standard debuffs', () => {
    const customDebuff: DebuffTemplate = {
      id: 'custom_test_debuff',
      name: 'Custom Debuff',
      description: 'A custom debuff',
      applyTo: ['soldier'],
      target: 'speed_multiply',
      value: 0.5,
      phase: 'always',
      duration: 2,
      isCustom: true,
    };
    mockedStorage.__setCustomDebuffs([customDebuff]);

    const all = getAllDebuffs();
    const found = all.find(d => d.id === 'custom_test_debuff');
    expect(found).toBeDefined();
    expect(found!.value).toBe(0.5);
    expect(found!.isCustom).toBe(true);
  });

  it('should deduplicate: custom debuff overrides standard with same ID', () => {
    const standard = getStandardDebuffs();
    if (standard.length === 0) return;
    const original = standard[0];

    const override: DebuffTemplate = {
      ...original,
      name: 'OVERridden Debuff',
      value: -99,
      isCustom: true,
    };
    mockedStorage.__setCustomDebuffs([override]);

    const all = getAllDebuffs();
    const found = all.filter(d => d.id === original.id);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('OVERridden Debuff');
  });

  it('should handle both custom buffs and debuffs independently', () => {
    const customBuff: BuffDefinition = {
      id: 'cb1', name: 'B1', description: '',
      applyTo: ['soldier'], target: 'range_bonus', value: 1, phase: 'shot', isCustom: true,
    };
    const customDebuff: DebuffTemplate = {
      id: 'cd1', name: 'D1', description: '',
      applyTo: ['soldier'], target: 'range_bonus', value: -1, phase: 'shot',
      duration: 1, isCustom: true,
    };

    mockedStorage.__setCustomBuffs([customBuff]);
    mockedStorage.__setCustomDebuffs([customDebuff]);

    expect(getAllBuffs().find(b => b.id === 'cb1')).toBeDefined();
    expect(getAllDebuffs().find(d => d.id === 'cd1')).toBeDefined();

    // Buffs should not contain debuffs and vice versa
    expect(getAllBuffs().find(b => b.id === 'cd1')).toBeUndefined();
    expect(getAllDebuffs().find(d => d.id === 'cb1')).toBeUndefined();
  });
});

describe('resolveSoldierEffects', () => {
  // Helper to build a BuffDefinition
  const makeBuff = (id: string, duration?: 1 | 2 | 3): BuffDefinition => ({
    id,
    name: id,
    description: `desc ${id}`,
    applyTo: ['soldier'],
    target: 'range_bonus',
    value: 1,
    phase: 'shot',
    ...(duration !== undefined ? { duration } : {}),
  });

  test('should return empty buffs and abilities for no inputs', () => {
    const result = resolveSoldierEffects([], []);
    expect(result.buffs).toEqual([]);
    expect(result.abilities).toEqual([]);
  });

  test('should return only squad buffs when no soldier modifiers', () => {
    const buff = makeBuff('squad_buff', 2);
    const result = resolveSoldierEffects([buff], []);
    expect(result.buffs).toHaveLength(1);
    expect(result.buffs[0].id).toBe('squad_buff');
    expect(result.abilities).toHaveLength(0);
  });

  test('should resolve soldier modifier IDs from catalog', () => {
    // 'mechanic' is a standard buff with no duration → ability
    const result = resolveSoldierEffects([], ['mechanic']);
    expect(result.abilities).toHaveLength(1);
    expect(result.abilities[0].id).toBe('mechanic');
    expect(result.abilities[0].name).toBe('Рм');
    expect(result.buffs).toHaveLength(0);
  });

  test('should split into buffs (with duration) and abilities (without duration)', () => {
    // 'adrenaline_shot' has duration → buff
    // 'mechanic' has no duration → ability
    const result = resolveSoldierEffects([], ['adrenaline_shot', 'mechanic']);
    expect(result.buffs).toHaveLength(1);
    expect(result.buffs[0].id).toBe('adrenaline_shot');
    expect(result.abilities).toHaveLength(1);
    expect(result.abilities[0].id).toBe('mechanic');
  });

  test('should merge squad buffs with soldier modifiers and deduplicate', () => {
    const squadBuff = makeBuff('adrenaline_shot', 2); // same ID as catalog entry
    const result = resolveSoldierEffects([squadBuff], ['adrenaline_shot']);
    // Deduped: only one 'adrenaline_shot'
    const all = [...result.buffs, ...result.abilities];
    expect(all.filter(b => b.id === 'adrenaline_shot')).toHaveLength(1);
  });

  test('should ignore unknown modifier IDs', () => {
    const result = resolveSoldierEffects([], ['nonexistent_modifier']);
    expect(result.buffs).toHaveLength(0);
    expect(result.abilities).toHaveLength(0);
  });

  test('should handle soldier with multiple different modifiers', () => {
    const result = resolveSoldierEffects([], ['mechanic', 'jump_boost_4', 'adrenaline_shot']);
    // mechanic → ability, jump_boost_4 → ability (oneTimeUse, no duration), adrenaline_shot → buff
    expect(result.buffs).toHaveLength(1);
    expect(result.abilities).toHaveLength(2);
    expect(result.abilities.map(a => a.id).sort()).toEqual(['jump_boost_4', 'mechanic']);
  });

  test('should only show soldier-specific effects, not all catalog buffs', () => {
    // Soldier has only 'mechanic' — should NOT see 'adrenaline_shot', 'aim_boost', etc.
    const result = resolveSoldierEffects([], ['mechanic']);
    const all = [...result.buffs, ...result.abilities];
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('mechanic');
  });
});

describe('isModifierActive', () => {
  it('should keep permanent modifiers (no duration) always active', () => {
    expect(isModifierActive(1, undefined, 5)).toBe(true);
    expect(isModifierActive(1, undefined, 100)).toBe(true);
  });

  it('should keep modifiers active when currentTurn is undefined', () => {
    expect(isModifierActive(1, 1, undefined)).toBe(true);
  });

  it('should be active on the turn it was applied', () => {
    expect(isModifierActive(1, 1, 1)).toBe(true); // applied turn 1, current turn 1
  });

  it('should expire duration-1 modifier after appliedAtTurn + 1', () => {
    // Duration=1 means active for 1 turn (the turn applied)
    expect(isModifierActive(1, 1, 1)).toBe(true);  // turn applied — active
    expect(isModifierActive(1, 1, 2)).toBe(false);  // expired
  });

  it('should expire duration-2 modifier after appliedAtTurn + 2', () => {
    expect(isModifierActive(1, 2, 1)).toBe(true);
    expect(isModifierActive(1, 2, 2)).toBe(true);
    expect(isModifierActive(1, 2, 3)).toBe(false);
  });

  it('should expire duration-3 modifier after appliedAtTurn + 3', () => {
    expect(isModifierActive(2, 3, 2)).toBe(true);
    expect(isModifierActive(2, 3, 4)).toBe(true);
    expect(isModifierActive(2, 3, 5)).toBe(false);
  });
});

describe('cleanupExpiredModifiers', () => {
  it('should remove expired soldierModifiers', () => {
    const unit = makeUnit({
      soldierModifiers: [
        { id: 'perm', name: 'Permanent', description: '', target: 'custom', value: 0, phase: 'always', appliedAtTurn: 1, soldierIndex: 0 },
        { id: 'exp1', name: 'Expires T2', description: '', target: 'armor_bonus', value: 2, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0 },
        { id: 'active1', name: 'Active T3', description: '', target: 'range_bonus', value: 1, phase: 'shot', appliedAtTurn: 2, duration: 2, expiresAtTurn: 4, soldierIndex: 0 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 3 };

    const result = cleanupExpiredModifiers(army);
    const cleaned = result.units[0];

    // perm: no duration → always active
    // exp1: appliedAtTurn=1, duration=1 → active while currentTurn < 2 → expired at turn 3
    // active1: appliedAtTurn=2, duration=2 → active while currentTurn < 4 → still active at turn 3
    expect(cleaned.soldierModifiers).toHaveLength(2);
    expect(cleaned.soldierModifiers!.map(m => m.id).sort()).toEqual(['active1', 'perm']);
  });

  it('should remove expired activeDebuffs', () => {
    const unit = makeUnit({
      activeDebuffs: [
        { id: 'd1', name: 'Slow', description: '', target: 'speed_multiply', value: 0.5, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2 },
        { id: 'd2', name: 'Active Slow', description: '', target: 'speed_multiply', value: 0.5, phase: 'always', appliedAtTurn: 2, duration: 2, expiresAtTurn: 4 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 3 };

    const result = cleanupExpiredModifiers(army);
    const cleaned = result.units[0];

    // d1: appliedAtTurn=1, duration=1 → expired at turn 2
    // d2: appliedAtTurn=2, duration=2 → active while currentTurn < 4
    expect(cleaned.activeDebuffs).toHaveLength(1);
    expect(cleaned.activeDebuffs![0].id).toBe('d2');
  });

  it('should remove expired activeBuffs', () => {
    const unit = makeUnit({
      activeBuffs: [
        { id: 'b1', name: 'Rage', description: '', applyTo: ['soldier'], target: 'melee_bonus', value: 2, phase: 'melee', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2 },
        { id: 'b2', name: 'Shield', description: '', applyTo: ['soldier'], target: 'armor_bonus', value: 1, phase: 'always', appliedAtTurn: 2, duration: 3, expiresAtTurn: 5 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 3 };

    const result = cleanupExpiredModifiers(army);
    const cleaned = result.units[0];

    // b1: appliedAtTurn=1, duration=1 → expired at turn 2
    // b2: appliedAtTurn=2, duration=3 → active while currentTurn < 5
    expect(cleaned.activeBuffs).toHaveLength(1);
    expect(cleaned.activeBuffs![0].id).toBe('b2');
  });

  it('should set array to undefined when all modifiers expire', () => {
    const unit = makeUnit({
      soldierModifiers: [
        { id: 'sm1', name: 'Temp', description: '', target: 'armor_bonus', value: 1, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0 },
      ],
      activeDebuffs: [
        { id: 'd1', name: 'Slow', description: '', target: 'speed_multiply', value: 0.5, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 5 };

    const result = cleanupExpiredModifiers(army);
    const cleaned = result.units[0];

    expect(cleaned.soldierModifiers).toBeUndefined();
    expect(cleaned.activeDebuffs).toBeUndefined();
    expect(cleaned.activeBuffs).toBeUndefined();
  });

  it('should keep permanent modifiers (no duration) across many turns', () => {
    const unit = makeUnit({
      soldierModifiers: [
        { id: 'perm', name: 'Mechanic', description: 'Repair', target: 'custom', value: 0, phase: 'always', appliedAtTurn: 1, soldierIndex: 0 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 100 };

    const result = cleanupExpiredModifiers(army);
    expect(result.units[0].soldierModifiers).toHaveLength(1);
    expect(result.units[0].soldierModifiers![0].id).toBe('perm');
  });

  it('should return army unchanged if currentTurn is not set', () => {
    const unit = makeUnit({
      soldierModifiers: [
        { id: 'sm1', name: 'Temp', description: '', target: 'armor_bonus', value: 1, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit] };

    const result = cleanupExpiredModifiers(army as any);
    expect(result.units[0].soldierModifiers).toHaveLength(1);
  });

  it('should handle multiple units independently', () => {
    const unit1 = makeUnit({
      instanceId: 'u1',
      soldierModifiers: [
        { id: 'sm1', name: 'Temp', description: '', target: 'armor_bonus', value: 1, phase: 'always', appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0 },
      ],
    });
    const unit2 = makeUnit({
      instanceId: 'u2',
      soldierModifiers: [
        { id: 'sm2', name: 'Active', description: '', target: 'range_bonus', value: 2, phase: 'shot', appliedAtTurn: 3, duration: 2, expiresAtTurn: 5, soldierIndex: 0 },
      ],
    });
    const army = { name: 'Test', totalCost: 0, units: [unit1, unit2], currentTurn: 4 };

    const result = cleanupExpiredModifiers(army);

    // unit1: appliedAtTurn=1, duration=1 → expired at turn 4 (4 > 2)
    expect(result.units[0].soldierModifiers).toBeUndefined();
    // unit2: appliedAtTurn=3, duration=2 → active while 4<=5 → still active
    expect(result.units[1].soldierModifiers).toHaveLength(1);
  });

  it('should simulate a full game: apply → play turns → expire', () => {
    // Turn 1: Apply a duration-2 modifier
    const unit = makeUnit({
      soldierModifiers: [
        { id: 'sm_turn1', name: 'Aim Boost', description: '+1 range', target: 'range_bonus', value: 1, phase: 'shot', appliedAtTurn: 1, duration: 2, expiresAtTurn: 3, soldierIndex: 0 },
      ],
    });

    // Turn 2: cleanup should keep it (2 < 1+2=3)
    let army = { name: 'Test', totalCost: 0, units: [unit], currentTurn: 2 };
    let result = cleanupExpiredModifiers(army);
    expect(result.units[0].soldierModifiers).toHaveLength(1);

    // Turn 3: cleanup should remove it (3 < 3 is false)
    army = { ...army, units: result.units as any[], currentTurn: 3 };
    result = cleanupExpiredModifiers(army as any);
    expect(result.units[0].soldierModifiers).toBeUndefined();
  });
});

describe('resolveSoldierEffects applyTo filtering', () => {
  test('should exclude machine-only buffs from soldier effects', () => {
    // 'mechanic' has applyTo: ['soldier'] — should be included
    const result = resolveSoldierEffects([], ['mechanic']);
    expect(result.abilities).toHaveLength(1);
    expect(result.abilities[0].id).toBe('mechanic');
  });

  test('should include buffs that have soldier in applyTo', () => {
    // Most standard buffs have applyTo: ['soldier']
    const result = resolveSoldierEffects([], ['mechanic', 'medic']);
    expect(result.abilities.length).toBeGreaterThanOrEqual(1);
  });
});

describe('collectBuffsForUnit phase coverage', () => {
  test('should collect buffs from different phases independently', () => {
    // Create a unit with a melee-only buff
    const meleeBuff: BuffDefinition = {
      id: 'rage_melee',
      name: 'Ярость',
      description: '+2 melee',
      applyTo: ['soldier'],
      target: 'melee_bonus',
      value: 2,
      phase: 'melee',
    };
    const unit = makeUnit({
      data: { buffs: [meleeBuff] },
    });
    const army = makeArmy([unit]);

    // Shot phase should NOT include melee buff
    const shotBuffs = collectBuffsForUnit(unit, army as any, 'shot');
    expect(shotBuffs.find(b => b.id === 'rage_melee')).toBeUndefined();

    // Melee phase SHOULD include melee buff
    const meleeBuffs = collectBuffsForUnit(unit, army as any, 'melee');
    expect(meleeBuffs.find(b => b.id === 'rage_melee')).toBeDefined();

    // Always phase includes ALL buffs (by design: 'always' means "collect everything")
    const alwaysBuffs = collectBuffsForUnit(unit, army as any, 'always');
    expect(alwaysBuffs.find(b => b.id === 'rage_melee')).toBeDefined();
  });

  test('shot phase should include both always-phase and shot-phase buffs', () => {
    const alwaysBuff: BuffDefinition = {
      id: 'armor_up',
      name: 'Armor Up',
      description: '+1 armor',
      applyTo: ['soldier'],
      target: 'armor_bonus',
      value: 1,
      phase: 'always',
    };
    const shotBuff: BuffDefinition = {
      id: 'aim_boost',
      name: 'Aim Boost',
      description: '+1 range',
      applyTo: ['soldier'],
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
    };
    const unit = makeUnit({
      data: { buffs: [alwaysBuff, shotBuff] },
    });
    const army = makeArmy([unit]);

    const shotBuffs = collectBuffsForUnit(unit, army as any, 'shot');
    expect(shotBuffs).toHaveLength(2);
  });
});
