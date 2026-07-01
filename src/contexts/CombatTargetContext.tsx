'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export interface TargetMemory {
  distance: number | null;
  targetArmor: number | null;
  targetMelee: number | null;
  targetIsVehicle: boolean | null;  // Remembered vehicle-target toggle (#162)
  lastUpdateTimestamp: number;
  isDirty: boolean;  // True if values were set this turn
}

interface CombatTargetContextType {
  // Get memory for a specific unit
  getTargetMemory: (unitId: string) => TargetMemory;
  // Update memory for a specific unit
  updateTargetMemory: (unitId: string, params: Partial<TargetMemory>) => void;
  // Check if memory is dirty for a specific unit
  isMemoryDirty: (unitId: string) => boolean;
  // Clear all memory (for reset scenarios)
  clearAllMemory: () => void;
}

const CombatTargetContext = createContext<CombatTargetContextType | undefined>(undefined);

export function useCombatTargetContext(): CombatTargetContextType {
  const context = useContext(CombatTargetContext);
  if (!context) {
    throw new Error('useCombatTargetContext must be used within CombatTargetProvider');
  }
  return context;
}

interface CombatTargetProviderProps {
  children: ReactNode;
}

// Default empty memory state
const createEmptyMemory = (): TargetMemory => ({
  distance: null,
  targetArmor: null,
  targetMelee: null,
  targetIsVehicle: null,
  lastUpdateTimestamp: 0,
  isDirty: false,
});

export function CombatTargetProvider({ children }: CombatTargetProviderProps) {
  // Store memory for each unit separately
  const [memoryMap, setMemoryMap] = useState<Map<string, TargetMemory>>(new Map());

  const getTargetMemory = useCallback((unitId: string): TargetMemory => {
    return memoryMap.get(unitId) || createEmptyMemory();
  }, [memoryMap]);

  const updateTargetMemory = useCallback((unitId: string, params: Partial<TargetMemory>) => {
    setMemoryMap((prevMap) => {
      const current = prevMap.get(unitId) || createEmptyMemory();
      const updated: TargetMemory = {
        ...current,
        ...params,
        lastUpdateTimestamp: Date.now(),
        isDirty: true,
      };

      const newMap = new Map(prevMap);
      newMap.set(unitId, updated);
      return newMap;
    });
  }, []);

  const isMemoryDirty = useCallback((unitId: string): boolean => {
    const memory = memoryMap.get(unitId);
    return memory?.isDirty || false;
  }, [memoryMap]);

  const clearAllMemory = useCallback(() => {
    setMemoryMap(new Map());
  }, []);

  const contextValue: CombatTargetContextType = useMemo(() => ({
    getTargetMemory,
    updateTargetMemory,
    isMemoryDirty,
    clearAllMemory,
  }), [getTargetMemory, updateTargetMemory, isMemoryDirty, clearAllMemory]);

  return (
    <CombatTargetContext.Provider value={contextValue}>
      {children}
    </CombatTargetContext.Provider>
  );
}
