'use client';

import { useState, useEffect } from 'react';
import { Army, ArmyUnit, RulesVersionID } from '@/lib/types';
import { FactionSelector } from './controls/FactionSelector';
import { PointBudgetInput } from './controls/PointBudgetInput';
import { UnitSelector } from './UnitSelector';
import { RulesSelector } from './rules/RulesSelector';
import { StepProgressIndicator } from './rules/StepProgressIndicator';
import { getAllRulesVersions } from '@/lib/rules-registry';
import { getAllSources, getSource, isValidSource, getDefaultSource } from '@/lib/sources-registry';
import { SourceSelector } from './rules/SourceSelector';
import { BattlePreparationScreen } from './preparation';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { SourceID } from '@/lib/types';

interface ArmyBuilderProps {
  army: Army;
  setArmy: (army: Army) => void;
  rulesVersion: RulesVersionID;
  onRulesVersionChange: (version: RulesVersionID) => void;
  displayMode: 'detailed' | 'compact';
  onDisplayModeChange: (mode: 'detailed' | 'compact') => void;
  onStartBattle: () => void;
  strictPilotRankEnabled?: boolean;
  onStrictPilotRankEnabledChange?: (enabled: boolean) => void;
  distanceInputUnit?: 'steps' | 'cm';
  onDistanceInputUnitChange?: (value: 'steps' | 'cm') => void;
  stepToCmFactor?: '4' | '5';
  onStepToCmFactorChange?: (value: '4' | '5') => void;
  autoCompleteEnabled?: boolean;
  onAutoCompleteEnabledChange?: (enabled: boolean) => void;
}

export default function ArmyBuilder({
  army,
  setArmy,
  rulesVersion,
  onRulesVersionChange,
  displayMode,
  onDisplayModeChange,
  onStartBattle: _onStartBattle,
  strictPilotRankEnabled = true,
  onStrictPilotRankEnabledChange,
  distanceInputUnit = 'steps',
  onDistanceInputUnitChange,
  stepToCmFactor = '5',
  onStepToCmFactorChange,
  autoCompleteEnabled = true,
  onAutoCompleteEnabledChange,
}: ArmyBuilderProps) {

  // Panic enabled state - persisted in localStorage
  const [panicEnabled, setPanicEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_panic_enabled');
      return saved !== null ? saved === 'true' : true; // Default to enabled
    }
    return true;
  });

  // Aimed shot enabled state - persisted in localStorage
  const [aimedShotEnabled, setAimedShotEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_aimed_shot_enabled');
      return saved !== null ? saved === 'true' : false; // Default to disabled
    }
    return false;
  });

  // Surprise attack enabled state - persisted in localStorage
  const [surpriseAttackEnabled, setSurpriseAttackEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bronepehota_surprise_attack_enabled');
      return saved !== null ? saved === 'true' : false; // Default to disabled
    }
    return false;
  });

  // Source selection state - persisted in localStorage
  const [selectedSource, setSelectedSource] = useState<SourceID>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ARMY_LIST_SOURCE);
      return saved && isValidSource(saved) ? saved : getDefaultSource();
    }
    return getDefaultSource();
  });

  // Setup step state for guided flow - sync with army.currentStep
  const [setupStep, setSetupStep] = useState<'rules' | 'source' | 'faction' | 'budget' | 'units' | 'preparation'>(() => {
    if (army.currentStep === 'unit-select') return 'units';
    if (army.currentStep === 'preparation') return 'preparation';
    return 'rules';
  });

  // Load source data and handle source changes
  const sourceData = getSource(selectedSource);
  const availableFactions = sourceData?.factions || [];
  const typedSquads = sourceData?.squads || [];
  const typedMachines = sourceData?.machines || [];

  // Warn if source data is not found (shouldn't happen with fallback)
  useEffect(() => {
    if (!sourceData && selectedSource) {
      console.warn(`Source data not found for ${selectedSource}, using fallback`);
    }
  }, [selectedSource, sourceData]);

  const handleSourceChange = (sourceId: SourceID) => {
    setSelectedSource(sourceId);
    // Clear army when switching sources to prevent invalid state
    setArmy({
      ...army,
      faction: undefined,
      units: [],
      totalCost: 0,
      pointBudget: undefined,
    });
  };

  // Sync setupStep when army.currentStep changes (e.g., after returning to faction select)
  useEffect(() => {
    if (army.currentStep === 'faction-select' && (setupStep === 'units' || setupStep === 'budget' || setupStep === 'faction' || setupStep === 'source')) {
      setSetupStep('rules');
    } else if (army.currentStep === 'unit-select' && setupStep !== 'units') {
      setSetupStep('units');
    } else if (army.currentStep === 'preparation' && setupStep !== 'preparation') {
      setSetupStep('preparation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [army.currentStep]);

  // Handle step navigation from StepProgressIndicator
  const handleStepClick = (step: 'rules' | 'source' | 'faction' | 'budget' | 'units' | 'preparation') => {
    // Allow navigating back to previous steps or to current step
    const stepOrder = ['rules', 'source', 'faction', 'budget', 'units', 'preparation'];
    const currentIndex = stepOrder.indexOf(setupStep);
    const targetIndex = stepOrder.indexOf(step);

    // Only allow navigation to current step or previous steps
    if (targetIndex <= currentIndex) {
      // Only reset when going back to SOURCE (different source = different data)
      // Going back to RULES/FACTION/BUDGET: keep everything, user can change if needed
      if (targetIndex === 1 && currentIndex > 1) {
        // Going back to SOURCE selection: clear faction and units
        // (different source may have different factions)
        setArmy({
          ...army,
          faction: undefined,
          units: [],
          totalCost: 0,
          pointBudget: undefined,
          currentStep: 'faction-select',
        });
      }
      // All other navigation: preserve current state

      setSetupStep(step);
    }
  };

  // Validate currentStep - allow 'faction-select', 'unit-select', or 'preparation'
  const validStep = (army.currentStep === 'faction-select' || army.currentStep === 'unit-select' || army.currentStep === 'preparation')
    ? army.currentStep
    : 'faction-select';

  // Always render new UI - old fallback removed
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {validStep === 'faction-select' && (
          <>
            <StepProgressIndicator
              currentStep={setupStep}
              selectedFaction={army.faction}
              selectedBudget={army.pointBudget}
              selectedRules={rulesVersion}
              onStepClick={handleStepClick}
            />

            {/* Step 1: Rules Selection */}
            {setupStep === 'rules' && (
              <RulesSelector
                versions={getAllRulesVersions()}
                selectedVersion={rulesVersion}
                onVersionChange={onRulesVersionChange}
                panicEnabled={panicEnabled}
                onPanicEnabledChange={setPanicEnabled}
                aimedShotEnabled={aimedShotEnabled}
                onAimedShotEnabledChange={setAimedShotEnabled}
                surpriseAttackEnabled={surpriseAttackEnabled}
                onSurpriseAttackEnabledChange={setSurpriseAttackEnabled}
                strictPilotRankEnabled={strictPilotRankEnabled}
                onStrictPilotRankEnabledChange={onStrictPilotRankEnabledChange}
                distanceInputUnit={distanceInputUnit}
                onDistanceInputUnitChange={onDistanceInputUnitChange}
                stepToCmFactor={stepToCmFactor}
                onStepToCmFactorChange={onStepToCmFactorChange}
                autoCompleteEnabled={autoCompleteEnabled}
                onAutoCompleteEnabledChange={onAutoCompleteEnabledChange}
                onConfirm={() => setSetupStep('source')}
              />
            )}

            {/* Step 2: Source Selection */}
            {setupStep === 'source' && (
              <SourceSelector
                sources={getAllSources()}
                selectedSource={selectedSource}
                onSourceChange={handleSourceChange}
                onConfirm={() => setSetupStep('faction')}
              />
            )}

            {/* Step 3: Faction Selection */}
            {setupStep === 'faction' && (
              <FactionSelector
                factions={availableFactions}
                selectedFaction={army.faction}
                onFactionSelect={(factionId) => setArmy({ ...army, faction: factionId })}
                onNext={() => setSetupStep('budget')}
                _nextDisabled={!army.faction}
              />
            )}

            {/* Step 3: Budget Selection */}
            {setupStep === 'budget' && army.faction && (
              <PointBudgetInput
                presets={[250, 350, 500, 1000]}
                value={army.pointBudget}
                onChange={(budget) => setArmy({ ...army, pointBudget: budget })}
                onNext={() => {
                  setArmy({ ...army, currentStep: 'unit-select' });
                  setSetupStep('units');
                }}
                disabled={false}
              />
            )}
          </>
        )}

        {validStep === 'unit-select' && army.pointBudget && (
          <>
            <StepProgressIndicator
              currentStep={setupStep}
              selectedFaction={army.faction}
              selectedBudget={army.pointBudget}
              selectedRules={rulesVersion}
              onStepClick={handleStepClick}
            />

            <UnitSelector
            factions={availableFactions}
            squads={typedSquads}
            machines={typedMachines}
            selectedFaction={army.faction}
            pointBudget={army.pointBudget}
            army={army.units}
            onAddUnit={(squad) => {
              // Calculate instance number for this unit type
              const existingUnitsOfType = army.units.filter(u => u.data.id === squad.id);
              const instanceNumber = existingUnitsOfType.length + 1;

              const newUnit: ArmyUnit = {
                instanceId: `${squad.id}_${Date.now()}`,
                type: 'squad',
                data: squad,
                instanceNumber,
                currentDurability: undefined,
                currentAmmo: undefined,
                deadSoldiers: [],
                actionsUsed: Array(squad.soldiers.length).fill({
                  moved: false,
                  shot: false,
                  melee: false,
                  done: false,
                }),
              };
              setArmy({
                ...army,
                units: [...army.units, newUnit],
                totalCost: army.totalCost + squad.cost,
              });
            }}
            onAddMachine={(machine, selectedWeaponIndices) => {
              // Calculate instance number for this unit type
              const existingUnitsOfType = army.units.filter(u => u.data.id === machine.id);
              const instanceNumber = existingUnitsOfType.length + 1;

              // Store selected weapon indices (default to all if not provided)
              const weaponIndices = selectedWeaponIndices ?? machine.weapons.map((_, i) => i);

              // Initialize per-weapon ammo from weapon definitions
              const weaponAmmo = machine.weapons.map(w => w.ammo ?? machine.ammo_max);

              const newUnit: ArmyUnit = {
                instanceId: `${machine.id}_${Date.now()}`,
                type: 'machine',
                data: machine,
                instanceNumber,
                currentDurability: machine.durability_max,
                currentAmmo: machine.ammo_max,
                weaponAmmo,
                deadSoldiers: undefined,
                actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
                machineShotsUsed: 0,
                machineWeaponShots: {},
                selectedWeaponIndices: weaponIndices,
              };
              setArmy({
                ...army,
                units: [...army.units, newUnit],
                totalCost: army.totalCost + machine.cost,
              });
            }}
            onRemoveUnit={(instanceId) => {
              const unitToRemove = army.units.find(u => u.instanceId === instanceId);
              if (!unitToRemove) return;
              setArmy({
                ...army,
                units: army.units.filter(u => u.instanceId !== instanceId),
                totalCost: army.totalCost - unitToRemove.data.cost,
              });
            }}
            onToBattle={() => {
              setArmy({
                ...army,
                isInBattle: true,
                currentStep: 'preparation',
              });
            }}
            displayMode={displayMode}
            onDisplayModeChange={onDisplayModeChange}
          />
          </>
        )}

        {setupStep === 'preparation' && (
          <>
            <StepProgressIndicator
              currentStep={setupStep}
              selectedFaction={army.faction}
              selectedBudget={army.pointBudget || 0}
              selectedRules={rulesVersion}
            />
            <BattlePreparationScreen
              army={army}
              setArmy={setArmy}
              onStartBattle={() => {
                setArmy({
                  ...army,
                  isInBattle: true,
                  currentStep: 'battle',
                  lastBattleDate: army.lastBattleDate || new Date().toISOString()
                });
                _onStartBattle();
              }}
              onBackToBuilder={() => {
                setSetupStep('units');
                setArmy({ ...army, currentStep: 'unit-select' });
              }}
            />
          </>
        )}
      </div>
    );
}
