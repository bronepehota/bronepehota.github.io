'use client';

import { useState, useRef } from 'react';
import { PilotTestState } from '@/components/combat/PilotTestModal';

export function usePilotTestFlow() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<PilotTestState>({
    phase: 'ARMOR_ROLL',
    pilotArmor: 0,
    armorRoll: null,
    survivalRoll: null,
    armorBreached: null,
    survived: null,
    isRolling: false,
  });

  const onCompleteRef = useRef<((armorRoll: number, survivalRoll: number | null, survived: boolean) => void) | null>(null);

  const startTest = (pilotArmor: number, onComplete: (armorRoll: number, survivalRoll: number | null, survived: boolean) => void) => {
    onCompleteRef.current = onComplete;
    setIsOpen(true);
    setState({
      phase: 'ARMOR_ROLL',
      pilotArmor,
      armorRoll: null,
      survivalRoll: null,
      armorBreached: null,
      survived: null,
      isRolling: true,
    });

    // Start the dice rolling sequence
    runArmorTest(pilotArmor);
  };

  const runArmorTest = async (pilotArmor: number) => {
    // Animate dice rolling
    const iterations = 12;
    const delay = 80;

    for (let i = 0; i < iterations; i++) {
      const tempRoll = Math.floor(Math.random() * 12) + 1;
      setState(prev => ({ ...prev, armorRoll: tempRoll }));
      await new Promise(r => setTimeout(r, delay));
    }

    // Final roll
    const armorRoll = Math.floor(Math.random() * 12) + 1;
    const armorBreached = armorRoll > pilotArmor;

    setState(prev => ({
      ...prev,
      armorRoll,
      armorBreached,
      isRolling: false,
    }));

    await new Promise(r => setTimeout(r, 1000));

    if (armorBreached) {
      // Proceed to survival test
      runSurvivalTest();
    } else {
      // Armor held - pilot survives!
      setState(prev => ({
        ...prev,
        phase: 'RESULTS',
        survived: true,
      }));
    }
  };

  const runSurvivalTest = async () => {
    setState(prev => ({
      ...prev,
      phase: 'SURVIVAL_ROLL',
      isRolling: true,
    }));

    // Animate dice rolling
    const iterations = 12;
    const delay = 80;

    for (let i = 0; i < iterations; i++) {
      const tempRoll = Math.floor(Math.random() * 6) + 1;
      setState(prev => ({ ...prev, survivalRoll: tempRoll }));
      await new Promise(r => setTimeout(r, delay));
    }

    // Final roll - survives on ≤4
    const survivalRoll = Math.floor(Math.random() * 6) + 1;
    const survived = survivalRoll <= 4;

    setState(prev => ({
      ...prev,
      survivalRoll,
      survived,
      phase: 'RESULTS',
      isRolling: false,
    }));
  };

  const handleRollComplete = (armorRoll: number, survivalRoll: number | null, survived: boolean) => {
    if (onCompleteRef.current) {
      onCompleteRef.current(armorRoll, survivalRoll, survived);
    }
    closeTest();
  };

  const closeTest = () => {
    setIsOpen(false);
    setState({
      phase: 'ARMOR_ROLL',
      pilotArmor: 0,
      armorRoll: null,
      survivalRoll: null,
      armorBreached: null,
      survived: null,
      isRolling: false,
    });
    onCompleteRef.current = null;
  };

  return {
    isOpen,
    state,
    startTest,
    onApply: handleRollComplete,
    closeTest,
  };
}
