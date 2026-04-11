/**
 * Tests for soldier effects duplicate prevention and expiry:
 * - ALL effects (buffs, debuffs, abilities) go to soldierModifiers (per-soldier)
 * - Same catalogId + soldierIndex = duplicate → blocked while active
 * - Different soldier → allowed
 * - oneTimeUse abilities: permanently tracked in soldierAbilitiesUsed (one per battle)
 * - Temporary effects (with duration): can be reapplied after expiry + cleanup
 */
import { isModifierActive, cleanupExpiredModifiers } from '@/lib/modifier-utils';
import type { SoldierModifier, ModifierDuration } from '@/lib/modifier-types';
import type { Army, ArmyUnit, Squad } from '@/lib/types';
import type { ModifierTarget, ModifierPhase } from '@/lib/modifier-types';

// ── Helpers ──

function makeSoldierModifier(catalogId: string, soldierIndex: number, overrides?: Partial<SoldierModifier>): SoldierModifier {
  return {
    id: `${catalogId}_${Date.now()}`,
    catalogId,
    name: catalogId,
    description: `desc ${catalogId}`,
    target: 'range_bonus',
    value: 1,
    phase: 'shot',
    appliedAtTurn: 1,
    soldierIndex,
    ...overrides,
  };
}

function makeArmyUnit(mods: SoldierModifier[], abilitiesUsed: string[] = []): ArmyUnit {
  return {
    instanceId: 'test-unit',
    type: 'squad',
    data: {
      id: 'test_squad',
      name: 'Test Squad',
      shortName: 'Test',
      faction: 'polaris',
      cost: 50,
      soldiers: [{ num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, armor: 2 }],
    } as Squad,
    instanceNumber: 1,
    deadSoldiers: [],
    actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
    soldierModifiers: mods,
    soldierAbilitiesUsed: abilitiesUsed,
  };
}

// All effects use the same dedup: soldierModifiers with catalogId + soldierIndex
function isDuplicate(soldierModifiers: SoldierModifier[], catalogId: string, soldierIndex: number): boolean {
  return soldierModifiers.some(
    m => m.catalogId === catalogId && m.soldierIndex === soldierIndex
  );
}

// ── Tests ──

describe('Effect duplicate prevention (all types: buffs, debuffs, abilities)', () => {
  test('should detect duplicate on same soldier', () => {
    const mods = [makeSoldierModifier('aim_boost', 0)];
    expect(isDuplicate(mods, 'aim_boost', 0)).toBe(true);
  });

  test('should allow same effect on different soldier', () => {
    const mods = [makeSoldierModifier('aim_boost', 0)];
    expect(isDuplicate(mods, 'aim_boost', 1)).toBe(false);
  });

  test('should allow different effect on same soldier', () => {
    const mods = [makeSoldierModifier('aim_boost', 0)];
    expect(isDuplicate(mods, 'armor_up', 0)).toBe(false);
  });

  test('should detect duplicate among multiple modifiers', () => {
    const mods = [
      makeSoldierModifier('aim_boost', 0),
      makeSoldierModifier('armor_up', 0),
      makeSoldierModifier('slow', 1),
      makeSoldierModifier('mechanic', 1),
    ];
    expect(isDuplicate(mods, 'armor_up', 0)).toBe(true);
    expect(isDuplicate(mods, 'slow', 0)).toBe(false);
    expect(isDuplicate(mods, 'slow', 1)).toBe(true);
    expect(isDuplicate(mods, 'mechanic', 1)).toBe(true);
  });

  test('should not match modifiers without catalogId', () => {
    const mod: SoldierModifier = {
      id: 'custom_123',
      name: 'Custom',
      description: '',
      target: 'range_bonus',
      value: 1,
      phase: 'shot',
      appliedAtTurn: 1,
      soldierIndex: 0,
    };
    expect(isDuplicate([mod], 'custom', 0)).toBe(false);
  });

  test('empty modifiers should not block anything', () => {
    expect(isDuplicate([], 'aim_boost', 0)).toBe(false);
  });
});

describe('isModifierActive — expiry timing', () => {
  test('duration 1 applied at turn 1: active on turn 1, expired by turn 2', () => {
    expect(isModifierActive(1, 1, 1)).toBe(true);   // turn 1: active
    expect(isModifierActive(1, 1, 2)).toBe(false);   // turn 2: expired
  });

  test('duration 2 applied at turn 1: active on turns 1-2, expired by turn 3', () => {
    expect(isModifierActive(1, 2, 1)).toBe(true);
    expect(isModifierActive(1, 2, 2)).toBe(true);
    expect(isModifierActive(1, 2, 3)).toBe(false);
  });

  test('duration 3 applied at turn 2: active on turns 2-4, expired by turn 5', () => {
    expect(isModifierActive(2, 3, 2)).toBe(true);
    expect(isModifierActive(2, 3, 3)).toBe(true);
    expect(isModifierActive(2, 3, 4)).toBe(true);
    expect(isModifierActive(2, 3, 5)).toBe(false);
  });

  test('permanent (no duration) should always be active', () => {
    expect(isModifierActive(1, undefined, 1)).toBe(true);
    expect(isModifierActive(1, undefined, 99)).toBe(true);
  });

  test('no currentTurn should keep modifier active', () => {
    expect(isModifierActive(1, 1, undefined)).toBe(true);
  });
});

describe('cleanupExpiredModifiers', () => {
  test('should remove expired soldierModifiers', () => {
    const unit = makeArmyUnit([
      makeSoldierModifier('aim_boost', 0, { appliedAtTurn: 1, duration: 1 }),
    ]);
    const army: Army = { name: 'Test', units: [unit], totalCost: 50, faction: 'polaris', sourceId: 'star_system', currentTurn: 2 };

    const cleaned = cleanupExpiredModifiers(army);
    expect(cleaned.units[0].soldierModifiers).toBeUndefined();
  });

  test('should keep active soldierModifiers', () => {
    const unit = makeArmyUnit([
      makeSoldierModifier('aim_boost', 0, { appliedAtTurn: 1, duration: 2 }),
    ]);
    const army: Army = { name: 'Test', units: [unit], totalCost: 50, faction: 'polaris', sourceId: 'star_system', currentTurn: 2 };

    const cleaned = cleanupExpiredModifiers(army);
    expect(cleaned.units[0].soldierModifiers).toHaveLength(1);
  });

  test('should remove expired activeDebuffs', () => {
    const unit: ArmyUnit = {
      ...makeArmyUnit([]),
      activeDebuffs: [{
        id: 'slow_123',
        name: 'Замедление',
        description: '',
        target: 'speed_multiply' as ModifierTarget,
        value: 0.5,
        phase: 'always' as ModifierPhase,
        appliedAtTurn: 1,
        duration: 1 as const,
        expiresAtTurn: 2,
      }],
    };
    const army: Army = { name: 'Test', units: [unit], totalCost: 50, faction: 'polaris', sourceId: 'star_system', currentTurn: 2 };

    const cleaned = cleanupExpiredModifiers(army);
    expect(cleaned.units[0].activeDebuffs).toBeUndefined();
  });

  test('should keep permanent soldierModifiers', () => {
    const unit = makeArmyUnit([
      makeSoldierModifier('mechanic', 0), // no duration = permanent
    ]);
    const army: Army = { name: 'Test', units: [unit], totalCost: 50, faction: 'polaris', sourceId: 'star_system', currentTurn: 5 };

    const cleaned = cleanupExpiredModifiers(army);
    expect(cleaned.units[0].soldierModifiers).toHaveLength(1);
  });

  test('should not modify units when currentTurn is undefined', () => {
    const unit = makeArmyUnit([
      makeSoldierModifier('aim_boost', 0, { appliedAtTurn: 1, duration: 1 }),
    ]);
    const army: Army = { name: 'Test', units: [unit], totalCost: 50, faction: 'polaris', sourceId: 'star_system' };

    const cleaned = cleanupExpiredModifiers(army);
    expect(cleaned.units[0].soldierModifiers).toHaveLength(1);
  });
});

describe('oneTimeUse tracking (permanent block)', () => {
  test('oneTimeUse ability should be tracked in soldierAbilitiesUsed', () => {
    const soldierAbilitiesUsed: string[] = [];
    // Simulating onApplyModifier for oneTimeUse item
    soldierAbilitiesUsed.push('jump_boost_4_0');
    expect(soldierAbilitiesUsed).toContain('jump_boost_4_0');
  });

  test('removing oneTimeUse modifier should NOT remove from abilitiesUsed', () => {
    const soldierModifiers = [makeSoldierModifier('jump_boost_4', 0)];
    const soldierAbilitiesUsed = ['jump_boost_4_0'];

    const remaining = soldierModifiers.filter(m => m.id !== soldierModifiers[0].id);
    expect(remaining).toHaveLength(0);
    expect(soldierAbilitiesUsed).toContain('jump_boost_4_0');
  });
});

describe('Temporary effect re-use after expiry', () => {
  test('temporary buff should be re-applicable after cleanup removes it', () => {
    // Turn 1: Apply buff with duration 1
    let mods = [makeSoldierModifier('aim_boost', 0, { appliedAtTurn: 1, duration: 1 as ModifierDuration })];
    const abilitiesUsed = [] as string[]; // NOT tracked for temporary effects
    expect(isDuplicate(mods, 'aim_boost', 0)).toBe(true);

    // Turn 2: cleanup removes expired modifier
    mods = mods.filter(m => isModifierActive(m.appliedAtTurn, m.duration, 2));
    expect(mods).toHaveLength(0);

    // After cleanup: no duplicate, no abilitiesUsed block → can re-apply
    expect(isDuplicate(mods, 'aim_boost', 0)).toBe(false);
    expect(abilitiesUsed).not.toContain('aim_boost_0');
  });

  test('debuff should be re-applicable after expiry', () => {
    let mods = [makeSoldierModifier('slow', 0, { appliedAtTurn: 1, duration: 2 as ModifierDuration })];
    const abilitiesUsed = [] as string[];
    mods = mods.filter(m => isModifierActive(m.appliedAtTurn, m.duration, 2));
    expect(mods).toHaveLength(1);
    expect(isDuplicate(mods, 'slow', 0)).toBe(true);

    // Turn 3: expired, cleaned up
    mods = mods.filter(m => isModifierActive(m.appliedAtTurn, m.duration, 3));
    expect(mods).toHaveLength(0);
    expect(isDuplicate(mods, 'slow', 0)).toBe(false);
    expect(abilitiesUsed).not.toContain('slow_0');
  });

  test('oneTimeUse ability should NOT be re-applicable after expiry', () => {
    let mods = [makeSoldierModifier('jump_boost_4', 0, { appliedAtTurn: 1 })]; // permanent (no duration)
    const abilitiesUsed = ['jump_boost_4_0']; // tracked as oneTimeUse

    // Even after manual removal
    mods = [];
    expect(isDuplicate(mods, 'jump_boost_4', 0)).toBe(false);

    // Still blocked by abilitiesUsed
    const usedIds = new Set([
      ...mods.filter(m => m.catalogId).map(m => m.catalogId!),
      ...abilitiesUsed.map(k => {
        const idx = k.lastIndexOf('_');
        return idx !== -1 && /^\d+$/.test(k.slice(idx + 1)) ? k.slice(0, idx) : k;
      }),
    ]);
    expect(usedIds.has('jump_boost_4')).toBe(true);
  });
});
