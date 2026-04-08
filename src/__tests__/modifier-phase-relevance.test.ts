/**
 * Tests for modifier phase relevance filtering:
 * - Shot phase: only shows range/power/armor/distance targets
 * - Melee phase: only shows melee targets
 * - speed_multiply never shown in combat panel
 * - 'always' phase modifiers filtered by target relevance
 */
import { resolveModifierSummary } from '@/lib/modifier-utils';
import type { BuffDefinition, SoldierModifier } from '@/lib/modifier-types';

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

describe('Modifier phase relevance filtering', () => {
  test('speed_multiply should NOT appear in shot phase descriptions', () => {
    const buff: BuffDefinition = {
      id: 'adrenaline', name: 'Адреналин', description: 'speed x1.5',
      applyTo: ['army'], target: 'speed_multiply', value: 1.5, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.descriptions).toHaveLength(0);
    expect(summary.speedMultiplier).toBe(1); // not applied
  });

  test('speed_multiply should NOT appear in melee phase descriptions', () => {
    const buff: BuffDefinition = {
      id: 'adrenaline', name: 'Адреналин', description: 'speed x1.5',
      applyTo: ['army'], target: 'speed_multiply', value: 1.5, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(summary.descriptions).toHaveLength(0);
    expect(summary.speedMultiplier).toBe(1);
  });

  test('range_bonus should appear in shot phase', () => {
    const buff: BuffDefinition = {
      id: 'aim', name: 'Aim', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.rangeBonus).toBe(2);
    expect(summary.descriptions.length).toBeGreaterThan(0);
  });

  test('range_bonus should NOT appear in melee phase', () => {
    const buff: BuffDefinition = {
      id: 'aim', name: 'Aim', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(summary.rangeBonus).toBe(0);
    expect(summary.descriptions).toHaveLength(0);
  });

  test('melee_bonus should appear in melee phase', () => {
    const mod: SoldierModifier = {
      id: 'sm1', catalogId: 'rage', name: 'Rage', description: '+3 melee',
      target: 'melee_bonus', value: 3, phase: 'melee',
      appliedAtTurn: 1, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [mod] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(summary.meleeBonus).toBe(3);
    expect(summary.descriptions.length).toBeGreaterThan(0);
  });

  test('melee_bonus should NOT appear in shot phase', () => {
    const mod: SoldierModifier = {
      id: 'sm1', catalogId: 'rage', name: 'Rage', description: '+3 melee',
      target: 'melee_bonus', value: 3, phase: 'always',
      appliedAtTurn: 1, soldierIndex: 0,
    };
    const unit = makeUnit({ soldierModifiers: [mod] });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.meleeBonus).toBe(0);
    expect(summary.descriptions).toHaveLength(0);
  });

  test('power_bonus should appear in shot phase', () => {
    const buff: BuffDefinition = {
      id: 'pow', name: 'Power Up', description: '+2 power',
      applyTo: ['army'], target: 'power_bonus', value: 2, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.powerBonus).toBe(2);
    expect(summary.descriptions.some(d => d.includes('мощность'))).toBe(true);
  });

  test('power_bonus should NOT appear in melee phase', () => {
    const buff: BuffDefinition = {
      id: 'pow', name: 'Power Up', description: '+2 power',
      applyTo: ['army'], target: 'power_bonus', value: 2, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(summary.powerBonus).toBe(0);
    expect(summary.descriptions).toHaveLength(0);
  });

  test('armor_bonus should appear in shot phase', () => {
    const buff: BuffDefinition = {
      id: 'armor', name: 'Armor Up', description: '+1 armor',
      applyTo: ['army'], target: 'armor_bonus', value: 1, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);
    expect(summary.armorBonus).toBe(1);
    expect(summary.descriptions.some(d => d.includes('броня'))).toBe(true);
  });

  test('custom target should appear in all phases', () => {
    const buff: BuffDefinition = {
      id: 'spec', name: 'Special Rule', description: 'Some rule',
      applyTo: ['army'], target: 'custom', value: 0, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [buff] } });
    const army = makeArmy([unit]);
    const shotSummary = resolveModifierSummary(unit, army, 'shot', 0);
    const meleeSummary = resolveModifierSummary(unit, army, 'melee', 0);
    expect(shotSummary.descriptions).toContain('Special Rule');
    expect(meleeSummary.descriptions).toContain('Special Rule');
  });

  test('mixed modifiers: only relevant ones shown per phase', () => {
    const speedBuff: BuffDefinition = {
      id: 'adrenaline', name: 'Адреналин', description: 'speed x1.5',
      applyTo: ['army'], target: 'speed_multiply', value: 1.5, phase: 'always',
    };
    const rangeBuff: BuffDefinition = {
      id: 'aim', name: 'Aim Up', description: '+2 range',
      applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'always',
    };
    const unit = makeUnit({ data: { buffs: [speedBuff, rangeBuff] } });
    const army = makeArmy([unit]);
    const summary = resolveModifierSummary(unit, army, 'shot', 0);

    // Only range buff should appear, speed should be filtered out
    expect(summary.rangeBonus).toBe(2);
    expect(summary.speedMultiplier).toBe(1); // not applied
    expect(summary.descriptions).toHaveLength(1);
    expect(summary.descriptions[0]).toContain('Aim Up');
  });
});
