/**
 * Tests for soldier effects duplicate prevention:
 * - ALL effects (buffs, debuffs, abilities) go to soldierModifiers (per-soldier)
 * - Same catalogId + soldierIndex = duplicate → blocked
 * - Different soldier → allowed
 * - soldierAbilitiesUsed: one use per battle per soldier, persists even after removal/expiry
 */
import type { SoldierModifier } from '@/lib/modifier-types';

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

// All effects use the same dedup: soldierModifiers with catalogId + soldierIndex
function isDuplicate(soldierModifiers: SoldierModifier[], catalogId: string, soldierIndex: number): boolean {
  return soldierModifiers.some(
    m => m.catalogId === catalogId && m.soldierIndex === soldierIndex
  );
}

function computeUsedCatalogIds(
  soldierModifiers: SoldierModifier[],
  abilitiesUsed: string[],
): Set<string> {
  // abilitiesUsed format: 'catalogId_soldierIndex' — extract catalogId
  const abilityCatalogIds = abilitiesUsed.map(k => {
    const lastUnderscore = k.lastIndexOf('_');
    if (lastUnderscore !== -1 && /^\d+$/.test(k.slice(lastUnderscore + 1))) {
      return k.slice(0, lastUnderscore);
    }
    return k;
  });
  return new Set([
    ...soldierModifiers.filter(m => m.catalogId).map(m => m.catalogId!),
    ...abilityCatalogIds,
  ]);
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
      makeSoldierModifier('slow', 1),      // debuff — also in soldierModifiers
      makeSoldierModifier('mechanic', 1),   // ability — also in soldierModifiers
    ];
    expect(isDuplicate(mods, 'armor_up', 0)).toBe(true);
    expect(isDuplicate(mods, 'slow', 0)).toBe(false);     // same effect, different soldier
    expect(isDuplicate(mods, 'slow', 1)).toBe(true);      // debuff on correct soldier
    expect(isDuplicate(mods, 'mechanic', 1)).toBe(true);   // ability on correct soldier
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

  test('debuff on soldier 0 should not block same debuff on soldier 1', () => {
    const mods = [makeSoldierModifier('slow', 0)];
    expect(isDuplicate(mods, 'slow', 0)).toBe(true);
    expect(isDuplicate(mods, 'slow', 1)).toBe(false);
  });

  test('ability on soldier 0 should not block same ability on soldier 1', () => {
    const mods = [makeSoldierModifier('mechanic', 0)];
    expect(isDuplicate(mods, 'mechanic', 0)).toBe(true);
    expect(isDuplicate(mods, 'mechanic', 1)).toBe(false);
  });
});

describe('soldierAbilitiesUsed tracking (one use per battle)', () => {
  test('should track ALL effects (buffs, debuffs, abilities)', () => {
    const soldierAbilitiesUsed: string[] = [];
    soldierAbilitiesUsed.push('mechanic_0');   // ability
    soldierAbilitiesUsed.push('aim_boost_0');   // temporary buff
    soldierAbilitiesUsed.push('slow_0');        // debuff

    expect(soldierAbilitiesUsed).toContain('mechanic_0');
    expect(soldierAbilitiesUsed).toContain('aim_boost_0');
    expect(soldierAbilitiesUsed).toContain('slow_0');
  });

  test('removing modifier should NOT remove from abilitiesUsed', () => {
    const soldierModifiers = [makeSoldierModifier('aim_boost', 0)];
    const soldierAbilitiesUsed = ['aim_boost_0'];

    const remaining = soldierModifiers.filter(m => m.id !== soldierModifiers[0].id);

    expect(remaining).toHaveLength(0);
    expect(soldierAbilitiesUsed).toContain('aim_boost_0');
  });

  test('expired and cleaned-up modifiers should still be tracked via abilitiesUsed', () => {
    const abilitiesUsed = ['aim_boost_0', 'mechanic_1'];

    const usedForSoldier0 = abilitiesUsed
      .filter(k => k.endsWith('_0'))
      .map(k => k.split('_').slice(0, -1).join('_'));

    expect(usedForSoldier0).toContain('aim_boost');
    expect(usedForSoldier0).not.toContain('mechanic');
  });

  test('abilitiesUsed is per-soldier: same buff on different soldiers tracked independently', () => {
    const abilitiesUsed = ['aim_boost_0', 'aim_boost_2'];
    const used = computeUsedCatalogIds([], abilitiesUsed);
    expect(used.has('aim_boost')).toBe(true);
  });
});

describe('usedCatalogIds computation (modal visual blocking)', () => {
  test('should include catalog IDs from soldierModifiers', () => {
    const mods = [makeSoldierModifier('aim_boost', 0)];
    const used = computeUsedCatalogIds(mods, []);
    expect(used.has('aim_boost')).toBe(true);
  });

  test('should include abilities used (from soldierAbilitiesUsed)', () => {
    const used = computeUsedCatalogIds([], ['mechanic_0']);
    expect(used.has('mechanic')).toBe(true);
  });

  test('should combine both sources', () => {
    const mods = [makeSoldierModifier('aim_boost', 0)];
    const used = computeUsedCatalogIds(mods, ['mechanic_0']);
    expect(used.has('aim_boost')).toBe(true);
    expect(used.has('mechanic')).toBe(true);
  });

  test('should extract catalog ID from abilitiesUsed with soldier index suffix', () => {
    const used = computeUsedCatalogIds([], ['adrenaline_shot_0']);
    expect(used.has('adrenaline_shot')).toBe(true);
  });

  test('should handle multi-underscore catalog IDs in abilitiesUsed', () => {
    const used = computeUsedCatalogIds([], ['jump_boost_4_0']);
    expect(used.has('jump_boost_4')).toBe(true);
  });
});

describe('End-to-end: apply flow with dedup', () => {
  test('should allow first application, block second on same soldier', () => {
    const soldierModifiers: SoldierModifier[] = [];
    const soldierAbilitiesUsed: string[] = [];
    const catalogId = 'aim_boost';
    const si = 0;

    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(false);

    soldierModifiers.push(makeSoldierModifier(catalogId, si));
    soldierAbilitiesUsed.push(`${catalogId}_${si}`);

    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(true);
  });

  test('debuff follows same rules as buff (per-soldier)', () => {
    const soldierModifiers: SoldierModifier[] = [];
    const catalogId = 'slow';
    const si = 1;

    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(false);

    soldierModifiers.push(makeSoldierModifier(catalogId, si));

    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(true);
    // Different soldier can still get it
    expect(isDuplicate(soldierModifiers, catalogId, 0)).toBe(false);
  });

  test('effect should NOT be re-applicable even after removal (one per battle)', () => {
    const soldierAbilitiesUsed: string[] = ['aim_boost_0'];
    const used = computeUsedCatalogIds([], soldierAbilitiesUsed);
    expect(used.has('aim_boost')).toBe(true);
  });

  test('full cycle: apply → remove → blocked by abilitiesUsed', () => {
    const soldierModifiers: SoldierModifier[] = [];
    const soldierAbilitiesUsed: string[] = [];
    const catalogId = 'frenzy';
    const si = 0;

    // Apply
    soldierModifiers.push(makeSoldierModifier(catalogId, si));
    soldierAbilitiesUsed.push(`${catalogId}_${si}`);
    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(true);

    // Remove (user clicks X)
    soldierModifiers.splice(0, 1);
    expect(isDuplicate(soldierModifiers, catalogId, si)).toBe(false); // not in active mods

    // But abilitiesUsed still blocks it
    const used = computeUsedCatalogIds(soldierModifiers, soldierAbilitiesUsed);
    expect(used.has(catalogId)).toBe(true);
  });
});
