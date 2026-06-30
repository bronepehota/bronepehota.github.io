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
});
