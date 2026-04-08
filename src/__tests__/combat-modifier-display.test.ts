/**
 * Tests for combat modifier bonus display:
 * - ModifierSummary values are correctly extracted for display
 * - Positive bonuses show as green +N
 * - Negative bonuses show as red -N
 * - Zero bonuses are hidden
 */
import { resolveModifierSummary } from '@/lib/modifier-utils';
import type { BuffDefinition, ActiveDebuff, SoldierModifier } from '@/lib/modifier-types';

// ── Helpers ──

function makeUnit(overrides: Record<string, any> = {}) {
  const { data: dataOverride, ...restOverrides } = overrides;
  const soldiers = [
    { rank: 3, speed: 4, range: 'D6', power: '1D6', melee: 2, props: [], armor: 2 },
    { rank: 2, speed: 4, range: 'D6', power: '1D6', melee: 1, props: [], armor: 2 },
  ];
  return {
    instanceId: 'test-unit-1',
    type: 'squad' as const,
    data: {
      id: 'test-squad', name: 'Test', faction: 'polaris', cost: 100,
      soldiers, buffs: [],
      ...dataOverride,
    },
    deadSoldiers: [],
    ...restOverrides,
  };
}

function makeArmy(units: any[]) {
  return { name: 'Test Army', totalCost: 0, units, currentTurn: 1 };
}

// ── Tests ──

describe('Combat modifier summary for display', () => {
  test('should return zero bonuses with no modifiers', () => {
    const unit = makeUnit();
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(0);
    expect(summary.powerBonus).toBe(0);
    expect(summary.meleeBonus).toBe(0);
  });

  test('should show positive range bonus from army buff', () => {
    const buff: BuffDefinition = {
      id: 'aim_up', name: 'Aim Up', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(2);
  });

  test('should show negative range bonus from debuff', () => {
    const debuff: ActiveDebuff = {
      id: 'blind', name: 'Blind', description: '-1 range',
      target: 'range_bonus', value: -1, phase: 'shot',
      appliedAtTurn: 1, duration: 2, expiresAtTurn: 3,
    };
    const unit = makeUnit({ activeDebuffs: [debuff] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(-1);
  });

  test('should combine positive buff and negative debuff', () => {
    const buff: BuffDefinition = {
      id: 'aim_up', name: 'Aim Up', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    const debuff: ActiveDebuff = {
      id: 'smoke', name: 'Smoke', description: '-3 range',
      target: 'range_bonus', value: -3, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2,
    };
    const unit = makeUnit({ data: { buffs: [buff] }, activeDebuffs: [debuff] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(-1); // +2 -3 = -1
  });

  test('should include soldier modifier in power bonus', () => {
    const mod: SoldierModifier = {
      id: 'sm1', catalogId: 'power_up', name: 'Power Up', description: '+3 power',
      target: 'power_bonus', value: 3, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [mod] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.powerBonus).toBe(3);
    // Different soldier should not get it
    const summary1 = resolveModifierSummary(unit, army, 'shot', 1);
    expect(summary1.powerBonus).toBe(0);
  });

  test('should include melee bonus from soldier modifier', () => {
    const mod: SoldierModifier = {
      id: 'sm1', catalogId: 'rage', name: 'Rage', description: '+4 melee',
      target: 'melee_bonus', value: 4, phase: 'melee',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [mod] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(summary.meleeBonus).toBe(4);
  });

  test('shot phase should not include melee-only bonuses', () => {
    const mod: SoldierModifier = {
      id: 'sm1', catalogId: 'rage', name: 'Rage', description: '+4 melee',
      target: 'melee_bonus', value: 4, phase: 'melee',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [mod] });
    const army = makeArmy([unit]);
    const shotSummary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(shotSummary.meleeBonus).toBe(0);
  });

  test('descriptions array should list all active modifiers', () => {
    const buff: BuffDefinition = {
      id: 'aim_up', name: 'Aim Up', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    const debuff: ActiveDebuff = {
      id: 'blind', name: 'Blind', description: '-1 range',
      target: 'range_bonus', value: -1, phase: 'shot',
      appliedAtTurn: 1, duration: 2, expiresAtTurn: 3,
    };
    const unit = makeUnit({ data: { buffs: [buff] }, activeDebuffs: [debuff] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.descriptions.length).toBeGreaterThanOrEqual(2);
    expect(summary.descriptions.some(d => d.includes('Aim Up'))).toBe(true);
    expect(summary.descriptions.some(d => d.includes('Blind'))).toBe(true);
  });

  test('should aggregate multiple buffs and debuffs correctly', () => {
    const buff1: BuffDefinition = {
      id: 'b1', name: 'B1', description: '+1 range',
      applyTo: ['army'], target: 'range_bonus', value: 1, phase: 'shot',
    };
    const buff2: BuffDefinition = {
      id: 'b2', name: 'B2', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    const debuff1: ActiveDebuff = {
      id: 'd1', name: 'D1', description: '-2 range',
      target: 'range_bonus', value: -2, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2,
    };
    const unit = makeUnit({ data: { buffs: [buff1, buff2] }, activeDebuffs: [debuff1] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(1); // +1 +2 -2 = +1
  });

  test('net zero should return 0 (no badge shown)', () => {
    const buff: BuffDefinition = {
      id: 'b1', name: 'B1', description: '+1 range',
      applyTo: ['army'], target: 'range_bonus', value: 1, phase: 'shot',
    };
    const debuff: ActiveDebuff = {
      id: 'd1', name: 'D1', description: '-1 range',
      target: 'range_bonus', value: -1, phase: 'shot',
      appliedAtTurn: 1, duration: 1, expiresAtTurn: 2,
    };
    const unit = makeUnit({ data: { buffs: [buff] }, activeDebuffs: [debuff] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(0);
  });
});
