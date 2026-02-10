import { useState } from 'react';
import { ArmyUnit, PanicTestResult, RulesVersionID } from '@/lib/types';

export interface PanicTestFlowState {
  isModalOpen: boolean;
  isRolling: boolean;
  results: PanicTestResult[];
  unit: ArmyUnit | null;
  rulesVersion: RulesVersionID;
}

export function usePanicTestFlow() {
  const [state, setState] = useState<PanicTestFlowState>({
    isModalOpen: false,
    isRolling: false,
    results: [],
    unit: null,
    rulesVersion: 'fan',
  });

  const startPanicTest = (unit: ArmyUnit) => {
    setState({
      isModalOpen: true,
      isRolling: false,
      results: [],
      unit,
      rulesVersion: 'fan', // Default, can be overridden
    });
  };

  const closeModal = () => {
    setState(prev => ({
      ...prev,
      isModalOpen: false,
      results: [],
      unit: null,
    }));
  };

  return {
    isModalOpen: state.isModalOpen,
    isRolling: state.isRolling,
    results: state.results,
    unit: state.unit,
    rulesVersion: state.rulesVersion,
    startPanicTest,
    closeModal,
  };
}
