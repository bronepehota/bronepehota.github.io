import { renderHook, act } from '@testing-library/react';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string => store[key] ?? ''),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useStandaloneCombatFlow', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('initializes with default combatant data', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.combatantData.type).toBe('squad');
    expect(result.current.combatantData.melee).toBe(0);
    expect(result.current.combatantData.armor).toBe(0);
    expect(result.current.combatantData.rank).toBe(0);
  });

  it('initializes with default rules version tehnolog', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.rulesVersion).toBe('tehnolog');
  });

  it('loads rules version from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'bronepehota_calculator_rules') return 'community_star_system';
      return '';
    });
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.rulesVersion).toBe('community_star_system');
  });

  it('ignores invalid rules version from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'bronepehota_calculator_rules') return 'invalid_version';
      return '';
    });
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.rulesVersion).toBe('tehnolog');
  });

  it('auto-starts combat on mount', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.combatState.phase).toBe('ACTION_SELECT');
  });

  it('provides all required methods', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(typeof result.current.selectAction).toBe('function');
    expect(typeof result.current.setParameters).toBe('function');
    expect(typeof result.current.executeAction).toBe('function');
    expect(typeof result.current.applyResult).toBe('function');
    expect(typeof result.current.closeCombat).toBe('function');
    expect(typeof result.current.goBack).toBe('function');
    expect(typeof result.current.switchAction).toBe('function');
    expect(typeof result.current.newCalculation).toBe('function');
    expect(typeof result.current.updateCombatantField).toBe('function');
    expect(typeof result.current.updateRulesVersion).toBe('function');
  });

  it('updateCombatantField updates combatant data', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    act(() => {
      result.current.updateCombatantField('armor', 5);
    });
    expect(result.current.combatantData.armor).toBe(5);
  });

  it('updateCombatantField updates melee', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    act(() => {
      result.current.updateCombatantField('melee', 3);
    });
    expect(result.current.combatantData.melee).toBe(3);
  });

  it('updateRulesVersion persists to localStorage', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    act(() => {
      result.current.updateRulesVersion('community_star_system');
    });
    expect(result.current.rulesVersion).toBe('community_star_system');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bronepehota_calculator_rules',
      'community_star_system'
    );
  });

  it('setCombatantData replaces entire combatant', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    const newCombatant = {
      type: 'squad' as const,
      melee: 4,
      armor: 3,
      rank: 2,
      grenadesAvailable: false,
    };
    act(() => {
      result.current.setCombatantData(newCombatant);
    });
    expect(result.current.combatantData).toEqual(newCombatant);
  });

  it('modifierSummary initializes empty', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    expect(result.current.modifierSummary).toEqual({
      rangeBonus: 0,
      rangeMultiplier: 1,
      powerBonus: 0,
      meleeBonus: 0,
      speedMultiplier: 1,
      armorBonus: 0,
      distancePenalty: 0,
      descriptions: [],
    });
  });

  it('setModifierSummary updates modifier state', () => {
    const { result } = renderHook(() => useStandaloneCombatFlow());
    const newSummary = {
      rangeBonus: 2,
      rangeMultiplier: 1,
      powerBonus: 1,
      meleeBonus: 0,
      speedMultiplier: 1,
      armorBonus: 0,
      distancePenalty: 0,
      descriptions: ['Test buff'],
    };
    act(() => {
      result.current.setModifierSummary(newSummary);
    });
    expect(result.current.modifierSummary).toEqual(newSummary);
  });
});
