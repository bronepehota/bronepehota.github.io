/**
 * Tests for combat effect classification logic:
 * 1. Debuff classification — soldierModifiers with catalogId from debuff catalog → isDebuff
 * 2. isLastTurn formula — exact equality (===), not >=
 * 3. turnInEffect calculation
 *
 * These are pure function tests extracted from the SoldierEffectsModal component logic.
 */

import type { DebuffTemplate } from '@/lib/modifier-types';

// ─── Debuff classification ───

function classifyAsDebuff(
  catalogId: string | undefined,
  debuffCatalogIds: Set<string>,
): boolean {
  return !!(catalogId && debuffCatalogIds.has(catalogId));
}

// ─── isLastTurn formula (from SoldierEffectsModal) ───

function computeIsLastTurn(
  currentTurn: number | undefined,
  expiresAtTurn: number | undefined,
): boolean {
  return currentTurn !== undefined && expiresAtTurn !== undefined
    ? currentTurn === expiresAtTurn - 1
    : false;
}

// ─── turnInEffect calculation ───

function computeTurnInEffect(
  currentTurn: number | undefined,
  appliedAtTurn: number,
): number {
  return currentTurn ? currentTurn - appliedAtTurn + 1 : 1;
}

// ─── Helpers ───

function makeDebuffTemplates(ids: string[]): DebuffTemplate[] {
  return ids.map(id => ({
    id,
    name: `Debuff ${id}`,
    description: `desc ${id}`,
    applyTo: ['soldier'] as const,
    target: 'speed_multiply' as const,
    value: 0.5,
    phase: 'always' as const,
    duration: 2 as const,
  }));
}

// ─── Tests ───

describe('Debuff classification', () => {
  const debuffCatalogIds = new Set(['slow', 'stun', 'aim_damage', 'panic']);

  test('modifier with debuff catalogId is classified as debuff', () => {
    expect(classifyAsDebuff('slow', debuffCatalogIds)).toBe(true);
    expect(classifyAsDebuff('stun', debuffCatalogIds)).toBe(true);
    expect(classifyAsDebuff('aim_damage', debuffCatalogIds)).toBe(true);
  });

  test('modifier with buff catalogId is NOT classified as debuff', () => {
    expect(classifyAsDebuff('aim_boost', debuffCatalogIds)).toBe(false);
    expect(classifyAsDebuff('armor_up', debuffCatalogIds)).toBe(false);
  });

  test('modifier without catalogId is NOT classified as debuff', () => {
    expect(classifyAsDebuff(undefined, debuffCatalogIds)).toBe(false);
  });

  test('modifier with unknown catalogId is NOT classified as debuff', () => {
    expect(classifyAsDebuff('unknown_effect', debuffCatalogIds)).toBe(false);
  });

  test('empty debuff catalog classifies nothing as debuff', () => {
    const emptyCatalog = new Set<string>();
    expect(classifyAsDebuff('slow', emptyCatalog)).toBe(false);
  });

  test('debuff catalog built from template IDs', () => {
    const templates = makeDebuffTemplates(['slow', 'stun', 'aim_damage']);
    const catalogIds = new Set(templates.map(d => d.id));

    expect(catalogIds.size).toBe(3);
    expect(classifyAsDebuff('slow', catalogIds)).toBe(true);
    expect(classifyAsDebuff('aim_damage', catalogIds)).toBe(true);
    expect(classifyAsDebuff('nonexistent', catalogIds)).toBe(false);
  });
});

describe('isLastTurn formula', () => {
  // Duration-1 effect: appliedAtTurn=1, duration=1, expiresAtTurn=2
  // Active on turn 1 only. isLastTurn on turn 1 (1 === 2-1).
  test('duration-1: isLastTurn on the only active turn', () => {
    expect(computeIsLastTurn(1, 2)).toBe(true);  // turn 1, expires at 2 → last turn
  });

  test('duration-1: NOT isLastTurn after expiry', () => {
    expect(computeIsLastTurn(2, 2)).toBe(false);  // already expired
    expect(computeIsLastTurn(3, 2)).toBe(false);
  });

  // Duration-2 effect: appliedAtTurn=1, duration=2, expiresAtTurn=3
  // Active on turns 1-2. isLastTurn on turn 2 (2 === 3-1).
  test('duration-2: isLastTurn on turn 2 of 2', () => {
    expect(computeIsLastTurn(1, 3)).toBe(false);  // turn 1 of 2 — not last
    expect(computeIsLastTurn(2, 3)).toBe(true);   // turn 2 of 2 — last
  });

  test('duration-2: NOT isLastTurn after expiry', () => {
    expect(computeIsLastTurn(3, 3)).toBe(false);  // expired
  });

  // Duration-3 effect: appliedAtTurn=2, duration=3, expiresAtTurn=5
  // Active on turns 2-4. isLastTurn on turn 4 (4 === 5-1).
  test('duration-3: isLastTurn on turn 4 of 4 (appliedAtTurn=2)', () => {
    expect(computeIsLastTurn(2, 5)).toBe(false);
    expect(computeIsLastTurn(3, 5)).toBe(false);
    expect(computeIsLastTurn(4, 5)).toBe(true);   // last turn
  });

  test('undefined currentTurn → false', () => {
    expect(computeIsLastTurn(undefined, 3)).toBe(false);
  });

  test('undefined expiresAtTurn → false', () => {
    expect(computeIsLastTurn(2, undefined)).toBe(false);
  });

  test('both undefined → false', () => {
    expect(computeIsLastTurn(undefined, undefined)).toBe(false);
  });

  // Regression: >= would cause isLastTurn=true for all turns after last
  test('REGRESSION: does NOT use >= (which would mark turn 3+ as last for expiresAtTurn=2)', () => {
    // If formula were currentTurn >= expiresAtTurn - 1:
    //   turn 1: 1 >= 1 → true  (correct, but coincidentally)
    //   turn 2: 2 >= 1 → true  (WRONG — expired, should not be "last turn")
    //   turn 3: 3 >= 1 → true  (WRONG — long expired)
    // With ===:
    //   turn 1: 1 === 1 → true  (correct)
    //   turn 2: 2 === 1 → false (correct — expired, not displayed)
    //   turn 3: 3 === 1 → false (correct)
    expect(computeIsLastTurn(2, 2)).toBe(false);
    expect(computeIsLastTurn(3, 2)).toBe(false);
    expect(computeIsLastTurn(100, 2)).toBe(false);
  });
});

describe('turnInEffect calculation', () => {
  test('turn 1 after apply at turn 1', () => {
    expect(computeTurnInEffect(1, 1)).toBe(1);
  });

  test('turn 2 after apply at turn 1', () => {
    expect(computeTurnInEffect(2, 1)).toBe(2);
  });

  test('turn 3 after apply at turn 1', () => {
    expect(computeTurnInEffect(3, 1)).toBe(3);
  });

  test('turn 5 after apply at turn 3', () => {
    expect(computeTurnInEffect(5, 3)).toBe(3);  // turns 3,4,5
  });

  test('undefined currentTurn defaults to 1', () => {
    expect(computeTurnInEffect(undefined, 5)).toBe(1);
  });
});
