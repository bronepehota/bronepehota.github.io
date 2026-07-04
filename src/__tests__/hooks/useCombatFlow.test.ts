import { renderHook, act } from '@testing-library/react';
import { useCombatFlow } from '@/hooks/useCombatFlow';
import { ArmyUnit } from '@/lib/types';
import { CombatResult } from '@/lib/combat-types';

describe('useCombatFlow', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(result.current.state.phase).toBe('IDLE');
    expect(result.current.state.actionType).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('should provide all required methods', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(typeof result.current.startCombat).toBe('function');
    expect(typeof result.current.selectAction).toBe('function');
    expect(typeof result.current.setParameters).toBe('function');
    expect(typeof result.current.executeAction).toBe('function');
    expect(typeof result.current.closeCombat).toBe('function');
    expect(typeof result.current.cancelCombat).toBe('function');
    expect(typeof result.current.goBack).toBe('function');
    expect(typeof result.current.checkGrenadeTarget).toBe('function');
  });

  it('should provide derived state', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(result.current.currentPhase).toBe('IDLE');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.canGoBack).toBe(false);
  });

  it('should accept startCombat call with unit', () => {
    const { result } = renderHook(() => useCombatFlow());

    // Just verify the method can be called without error
    expect(() => {
      result.current.startCombat({
        instanceId: 'test',
        type: 'squad',
        data: {
          id: 'test',
          name: 'Test',
          faction: 'polaris',
          cost: 100,
          soldiers: []
        }
      });
    }).not.toThrow();
  });

  it('should accept setParameters call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.setParameters({ distance: 3 });
    }).not.toThrow();
  });

  it('should accept closeCombat call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.closeCombat();
    }).not.toThrow();
  });

  it('should accept cancelCombat call', () => {
    const { result } = renderHook(() => useCombatFlow());

    expect(() => {
      result.current.cancelCombat();
    }).not.toThrow();
  });
});

// Outcome tests: drive the full flow (start → select → params → execute) and assert
// the produced CombatResult. Dice are random, so assertions are structural + ranged.
describe('useCombatFlow — combat outcomes', () => {
  const makeSquadUnit = (): ArmyUnit => ({
    instanceId: 'u1',
    type: 'squad',
    data: {
      id: 'test-squad',
      name: 'Test Squad',
      faction: 'polaris',
      cost: 50,
      soldiers: [
        { rank: 3, speed: 5, range: 'D6', power: 'D6', melee: 2, armor: 1 },
      ],
    },
  });

  const runAction = async (
    action: 'shot' | 'melee' | 'grenade',
    params: Record<string, number>
  ): Promise<CombatResult> => {
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => {
      result.current.startCombat(makeSquadUnit(), 0, undefined, action);
    });
    await act(async () => {
      result.current.setParameters(params);
    });
    let res!: CombatResult;
    await act(async () => {
      res = await result.current.executeAction();
    });
    return res;
  };

  it('shot: produces a hit result with a D6 roll (1–6)', async () => {
    const res = await runAction('shot', { distance: 3, targetArmor: 2 });
    expect(res.actionType).toBe('shot');
    expect(res.hitResult).toBeDefined();
    expect(res.hitResult!.rolls!.length).toBeGreaterThan(0);
    expect(res.hitResult!.total).toBeGreaterThanOrEqual(1);
    expect(res.hitResult!.total).toBeLessThanOrEqual(6);
    expect(typeof res.hitResult!.success).toBe('boolean');
    // Reducer also stores the result on state
    // (re-render not asserted here — outcome is what matters)
  });

  it('shot: stores the result on state', async () => {
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'shot'); });
    await act(async () => { result.current.setParameters({ distance: 3, targetArmor: 2 }); });
    await act(async () => { await result.current.executeAction(); });
    expect(result.current.state.result?.actionType).toBe('shot');
    expect(result.current.state.phase).toBe('RESULTS');
  });

  it('melee: defender uses armor (Бр), not ББ', async () => {
    // targetArmor(5) differs from default targetMelee(2) to prove the fix
    const res = await runAction('melee', { targetArmor: 5 });
    expect(res.actionType).toBe('melee');
    expect(res.meleeResult).toBeDefined();
    expect(['attacker', 'defender', 'draw']).toContain(res.meleeResult!.winner);
    // attackerTotal = attackerRoll(1–6) + soldier.melee(2) — attacker still ББ
    expect(res.meleeResult!.attackerTotal).toBe(res.meleeResult!.attackerRoll + 2);
    // defenderTotal = defenderRoll(1–6) + targetArmor(5) — defender uses Бр
    expect(res.meleeResult!.defenderTotal).toBe(res.meleeResult!.defenderRoll + 5);
  });

  it('melee surprise-attack: defender uses armor', async () => {
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'melee'); });
    await act(async () => {
      result.current.setParameters({ targetArmor: 5, isSurpriseAttack: true });
    });
    await act(async () => { await result.current.executeAction(); });
    const mr = result.current.state.result?.meleeResult;
    expect(mr).toBeDefined();
    expect(mr!.isSurpriseAttack).toBe(true);
    // defenderTotal = defenderRoll + targetArmor (5) — surprise-attack inline path uses armor
    expect(mr!.defenderTotal).toBe(mr!.defenderRoll + 5);
  });

  it('shot: height bonus adds +1 to the hit roll (range bonus)', async () => {
    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'shot'); });
    await act(async () => {
      result.current.setParameters({ distance: 3, targetArmor: 2, isHeightBonus: true });
    });
    await act(async () => { await result.current.executeAction(); });
    const hr = result.current.state.result?.hitResult;
    expect(hr).toBeDefined();
    // soldier.range = 'D6' (bonus 0) → height adds +1 → 'D6+1' → parsed bonus = 1
    expect(hr!.bonus).toBe(1);
  });

  it('shot: without height bonus the range has no added bonus', async () => {
    const res = await runAction('shot', { distance: 3, targetArmor: 2 });
    // soldier.range = 'D6' (bonus 0), no height
    expect(res.hitResult!.bonus).toBe(0);
  });

  it('grenade: produces a blast distance (1–6) and ±1 zone', async () => {
    const res = await runAction('grenade', { distance: 3, targetArmor: 2 });
    expect(res.actionType).toBe('grenade');
    expect(res.grenadeDistance).toBeGreaterThanOrEqual(1);
    expect(res.grenadeDistance).toBeLessThanOrEqual(6);
    expect(res.grenadeBlastZone).toBeDefined();
    expect(res.grenadeBlastZone!.maxSteps).toBe(res.grenadeDistance! + 1);
    expect(res.grenadeBlastZone!.minSteps).toBe(Math.max(1, res.grenadeDistance! - 1));
  });

  it('throws when executing with no action set', async () => {
    const { result } = renderHook(() => useCombatFlow());
    await expect(result.current.executeAction()).rejects.toThrow(/Unknown action type/);
  });

  it('shot: vehicle target (targetIsVehicle) deals damagePerDie, not infantry +1', async () => {
    // Community rules use zone-based damage for vehicles: each penetrating die deals
    // damage scaled by die type (D6→1, D12→2, D20→3). Infantry rules just deal +1.
    // Mock squad soldier has power 'D6' (1 die, sides=6 → damagePerDie=1).
    // With targetArmor=0 every roll penetrates, so damage = 1 (deterministic).
    const localStorageMock = (function () {
      const store: Record<string, string> = {
        bronepehota_rules_version: 'community_star_system',
      };
      return {
        getItem: jest.fn((k: string) => store[k] ?? null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        get length() { return Object.keys(store).length; },
        key: jest.fn(),
      };
    })();
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(localStorageMock.getItem);

    const { result } = renderHook(() => useCombatFlow());
    await act(async () => { result.current.startCombat(makeSquadUnit(), 0, undefined, 'shot'); });
    await act(async () => {
      result.current.setParameters({ distance: 0, targetArmor: 0, targetIsVehicle: true });
    });
    await act(async () => { await result.current.executeAction(); });
    const dr = result.current.state.result?.damageResult;
    expect(dr).toBeDefined();
    // power D6 → 1 die × damagePerDie=1 (sides=6) → damage = 1
    expect(dr!.damage).toBe(1);
    // Verify the vehicle zone branch was used (damage is scaled, not infantry +1)
    expect(dr!.rolls!.length).toBe(1);

    jest.restoreAllMocks();
  });
});

// #125: machine melee + ram wiring (shallow — deep execution is covered by Task 1
// pure-logic tests + Task 6 E2E, matching the existing file's style).
describe('useCombatFlow — machine melee + ram wiring (#125)', () => {
  const makeMachineUnit = (): ArmyUnit => ({
    instanceId: 'm1',
    type: 'machine',
    instanceNumber: 1,
    data: {
      id: 'demolisher',
      name: 'Demolisher',
      faction: 'polaris',
      cost: 100,
      rank: 2,
      fire_rate: 2,
      ammo_max: 5,
      durability_max: 16,
      image: '',
      speed_sectors: [],
      weapons: [{ name: 'Claw', range: 'ББ', power: '2' }],
    },
    currentDurability: 10,
  } as any);

  it('starts ram combat with actionType=ram and phase=PARAMETERS (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    act(() => {
      result.current.startCombat(makeMachineUnit(), undefined, undefined, 'ram');
    });
    expect(result.current.state.actionType).toBe('ram');
    expect(result.current.state.phase).toBe('PARAMETERS');
    expect(result.current.isOpen).toBe(true);
  });

  it('starts machine melee combat with actionType=melee (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    act(() => {
      result.current.startCombat(makeMachineUnit(), undefined, undefined, 'melee');
    });
    expect(result.current.state.actionType).toBe('melee');
    expect(result.current.state.phase).toBe('PARAMETERS');
  });

  it('accepts ramInfantryCount / targetType parameters (#125)', () => {
    const { result } = renderHook(() => useCombatFlow());
    act(() => {
      result.current.setParameters({ ramInfantryCount: 4, targetType: 'machine', defenderMeleeBonus: 3 });
    });
    expect(result.current.state.parameters.ramInfantryCount).toBe(4);
    expect(result.current.state.parameters.targetType).toBe('machine');
    expect(result.current.state.parameters.defenderMeleeBonus).toBe(3);
  });
});
