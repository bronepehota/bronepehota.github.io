'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface TargetMemory {
  distance: number | null;
  targetArmor: number | null;
  targetMelee: number | null;
  lastUpdateTimestamp: number;
  isDirty: boolean;  // True if values were set this turn
}

interface CombatTargetContextType {
  targetMemory: TargetMemory;
  updateTargetMemory: (params: Partial<TargetMemory>) => void;
  resetTargetMemory: () => void;
  isMemoryDirty: boolean;
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

export function CombatTargetProvider({ children }: CombatTargetProviderProps) {
  const [targetMemory, setTargetMemory] = useState<TargetMemory>({
    distance: null,
    targetArmor: null,
    targetMelee: null,
    lastUpdateTimestamp: 0,
    isDirty: false,
  });

  const updateTargetMemory = (params: Partial<TargetMemory>) => {
    setTargetMemory((prev) => ({
      ...prev,
      ...params,
      lastUpdateTimestamp: Date.now(),
      isDirty: true,
    }));
  };

  const resetTargetMemory = () => {
    setTargetMemory({
      distance: null,
      targetArmor: null,
      targetMelee: null,
      lastUpdateTimestamp: 0,
      isDirty: false,
    });
  };

  const isMemoryDirty = targetMemory.isDirty;

  const contextValue: CombatTargetContextType = {
    targetMemory,
    updateTargetMemory,
    resetTargetMemory,
    isMemoryDirty,
  };

  return (
    <CombatTargetContext.Provider value={contextValue}>
      {children}
    </CombatTargetContext.Provider>
  );
}
