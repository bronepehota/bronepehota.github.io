import { useState, useEffect } from 'react';
import { ArmyUnit, RulesVersionID } from '@/lib/types';
import { getDefaultRulesVersion, isValidRulesVersion } from '@/lib/rules-registry';

/**
 * Pilot survival test result
 */
export interface PilotSurvivalTest {
  roll: number;
  survived: boolean;
  testedAt: number;
}

/**
 * UnitCard modal and view state
 */
export interface UnitCardState {
  showImage: boolean;
  showDetailsModal: boolean;
  showPilotModal: boolean;
  rulesVersion: RulesVersionID;
  pilotSurvivalTest: PilotSurvivalTest | null;
  setShowImage: (value: boolean) => void;
  setShowDetailsModal: (value: boolean) => void;
  setShowPilotModal: (value: boolean) => void;
  setRulesVersion: (version: RulesVersionID) => void;
  setPilotSurvivalTest: (test: PilotSurvivalTest | null) => void;
}

/**
 * Custom hook for managing UnitCard state (modals, view modes, etc.)
 *
 * @param _unit - The army unit (currently unused but kept for future extensions)
 * @returns UnitCardState object with all state values and setters
 */
export function useUnitCardState(_unit: ArmyUnit): UnitCardState {
  const [showImage, setShowImage] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(getDefaultRulesVersion());
  const [pilotSurvivalTest, setPilotSurvivalTest] = useState<PilotSurvivalTest | null>(null);

  // Load rules version from localStorage (validate — a stale value would break rules lookups)
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved && isValidRulesVersion(saved)) {
      setRulesVersion(saved);
    }
  }, []);

  return {
    showImage,
    showDetailsModal,
    showPilotModal,
    rulesVersion,
    pilotSurvivalTest,
    setShowImage,
    setShowDetailsModal,
    setShowPilotModal,
    setRulesVersion,
    setPilotSurvivalTest,
  };
}
