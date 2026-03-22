import {
  getUnitBuffs,
  isUnitAlive,
  collectBuffsForUnit,
  collectDebuffsForUnit,
  resolveModifierSummary,
  hasActiveModifiers,
  EMPTY_MODIFIER_SUMMARY,
} from '@/lib/modifier-utils';
import type { BuffDefinition, ActiveDebuff } from '@/lib/modifier-types';

// Helper to create a minimal ArmyUnit
function makeUnit(overrides: Record<string, any> = {}) {
  const { data: dataOverride, type: typeOverride, ...restOverrides } = overrides;
  const soldiers = dataOverride?.soldiers || [
    { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 2, props: [], armor: 2 },
    { rank: 2, speed: 4, range: 'D6', power: '1D6', melee: 1, props: [], armor: 2 },
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

function makeArmy(units: any[]) {
  return { name: 'Test Army', totalCost: 0, units };
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
      scope: 'team',
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
      scope: 'personal',
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
      scope: 'personal',
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
      scope: 'personal',
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
      scope: 'personal',
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
      scope: 'team',
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
      scope: 'team',
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
      scope: 'team',
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
      id: 'b1', name: 'B1', description: '', scope: 'team',
      target: 'range_bonus', value: 1, phase: 'shot',
    };
    const buff2: BuffDefinition = {
      id: 'b2', name: 'B2', description: '', scope: 'team',
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
      id: 'buff', name: 'Buff', description: '', scope: 'team',
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
      id: 'melee-buff', name: 'Melee Buff', description: '', scope: 'team',
      target: 'melee_bonus', value: 1, phase: 'melee',
    };
    const unit = makeUnit({ data: { buffs: [meleeBuff] } });
    const army = makeArmy([unit]);

    const shotSummary = resolveModifierSummary(unit, army, 'shot');
    expect(shotSummary.meleeBonus).toBe(0);

    const meleeSummary = resolveModifierSummary(unit, army, 'melee');
    expect(meleeSummary.meleeBonus).toBe(1);
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
