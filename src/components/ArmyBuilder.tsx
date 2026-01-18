'use client';

import { useState, useMemo, useEffect } from 'react';
import { Army, ArmyUnit, FactionID, Faction, Squad, Machine, RulesVersionID } from '@/lib/types';
import { countByUnitType, validateAddUnit } from '@/lib/unit-utils';
import squadsData from '@/data/squads.json';
import machinesData from '@/data/machines.json';
import factionsData from '@/data/factions.json';
import { Plus, Trash2, Shield, Sword, Cpu, Box, Search, Download, Upload, Info, Globe, Quote, Users, Zap, Skull, ArrowLeft, LucideIcon } from 'lucide-react';
import { FactionSelector } from './FactionSelector';
import { PointBudgetInput } from './PointBudgetInput';
import { UnitSelector } from './UnitSelector';
import { UnitDetailsModal } from './UnitDetailsModal';
import { RulesSelector } from './RulesSelector';
import { StepProgressIndicator } from './StepProgressIndicator';
import { getAllRulesVersions } from '@/lib/rules-registry';

// Type assertions for JSON imports
const typedFactions = factionsData as Faction[];
const typedSquads = squadsData as Squad[];
const typedMachines = machinesData as Machine[];

interface ArmyBuilderProps {
  army: Army;
  setArmy: (army: Army) => void;
  onEnterBattle?: () => void;
  rulesVersion: RulesVersionID;
  onRulesVersionChange: (version: RulesVersionID) => void;
}

const factionIcons: Record<string, LucideIcon> = {
  Shield,
  Zap,
  Skull
};

export default function ArmyBuilder({ army, setArmy, onEnterBattle, rulesVersion, onRulesVersionChange }: ArmyBuilderProps) {
  const [filterFaction, setFilterFaction] = useState<FactionID | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Setup step state for guided flow
  const [setupStep, setSetupStep] = useState<'faction' | 'budget' | 'rules' | 'units'>('faction');

  // Validate and migrate currentStep from old versions
  const validStep = (army.currentStep === 'faction-select' || army.currentStep === 'unit-select')
    ? army.currentStep
    : 'faction-select';

  // Modal state management (selectedUnit, isModalOpen)
  const [selectedUnit, setSelectedUnit] = useState<Squad | Machine | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<'squad' | 'machine'>('squad');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Unit count badges and error state
  const [addError, setAddError] = useState<string | null>(null);
  const unitCounts = useMemo(() => {
    return countByUnitType(army.units);
  }, [army.units]);

  const selectedFactionData = typedFactions.find(f => f.id === army.faction) as Faction & { symbol: string } | undefined;

  const exportArmy = () => {
    const data = JSON.stringify(army, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `army-${army.faction}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importArmy = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        setArmy(imported);
      } catch (err) {
        alert('Ошибка при импорте файла');
      }
    };
    reader.readAsText(file);
  };

  const addUnit = (unit: Squad | Machine, type: 'squad' | 'machine') => {
    // Validate 99-unit limit
    const validation = validateAddUnit(army, unit.id);
    if (!validation.valid) {
      setAddError(validation.error);
      setTimeout(() => setAddError(null), 3000);
      return;
    }
    setAddError(null);

    // Calculate instance number for this unit type
    const existingUnitsOfType = army.units.filter(u => u.data.id === unit.id);
    const instanceNumber = existingUnitsOfType.length + 1;

    const newUnit: ArmyUnit = {
      instanceId: `${unit.id}-${Date.now()}`,
      type,
      data: unit,
      instanceNumber,
      currentDurability: type === 'machine' ? (unit as Machine).durability_max : undefined,
      currentAmmo: type === 'machine' ? (unit as Machine).ammo_max : undefined,
      deadSoldiers: [],
      actionsUsed: type === 'squad'
        ? Array((unit as Squad).soldiers.length).fill({ moved: false, shot: false, melee: false, done: false })
        : [{ moved: false, shot: false, melee: false, done: false }],
      machineShotsUsed: type === 'machine' ? 0 : undefined,
      machineWeaponShots: type === 'machine' ? {} : undefined
    };

    setArmy({
      ...army,
      units: [...army.units, newUnit],
      totalCost: army.totalCost + unit.cost
    });
  };

  const removeUnit = (instanceId: string) => {
    const unitToRemove = army.units.find(u => u.instanceId === instanceId);
    if (!unitToRemove) return;

    setArmy({
      ...army,
      units: army.units.filter(u => u.instanceId !== instanceId),
      totalCost: army.totalCost - unitToRemove.data.cost
    });
  };

  // T022: Add click handler to squad/machine cards to open modal with unit data
  const handleUnitClick = (unit: Squad | Machine, type: 'squad' | 'machine') => {
    setSelectedUnit(unit);
    setSelectedUnitType(type);
    setIsModalOpen(true);
  };

  const filteredSquads = typedSquads.filter(s =>
    (filterFaction === 'all' || s.faction === filterFaction) &&
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMachines = typedMachines.filter(m =>
    (filterFaction === 'all' || m.faction === filterFaction) &&
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Persist corrected step to localStorage if needed (migration from old versions)
  useEffect(() => {
    if (validStep !== army.currentStep) {
      setArmy({
        ...army,
        currentStep: validStep,
        pointBudget: validStep === 'faction-select' ? undefined : army.pointBudget,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            />

            {/* Step 1: Faction Selection */}
            {setupStep === 'faction' && (
              <FactionSelector
                factions={typedFactions}
                selectedFaction={army.faction}
                onFactionSelect={(factionId) => setArmy({ ...army, faction: factionId })}
                onNext={() => setSetupStep('budget')}
                nextDisabled={!army.faction}
              />
            )}

            {/* Step 2: Budget Selection */}
            {setupStep === 'budget' && army.faction && (
              <div className="relative">
                <button
                  onClick={() => setSetupStep('faction')}
                  className="absolute -top-4 left-0 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </button>
                <div className="pt-6">
                  <PointBudgetInput
                    presets={[250, 350, 500, 1000]}
                    value={army.pointBudget}
                    onChange={(budget) => setArmy({ ...army, pointBudget: budget })}
                    onNext={() => setSetupStep('rules')}
                    disabled={false}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Rules Confirmation */}
            {setupStep === 'rules' && (
              <div className="relative">
                <button
                  onClick={() => setSetupStep('budget')}
                  className="absolute -top-4 left-0 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </button>
                <div className="pt-6">
                  <RulesSelector
                    versions={getAllRulesVersions()}
                    selectedVersion={rulesVersion}
                    onVersionChange={onRulesVersionChange}
                    onConfirm={() => {
                      setArmy({ ...army, currentStep: 'unit-select' });
                      setSetupStep('units');
                    }}
                  />
                </div>
              </div>
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
            />
            <UnitSelector
            factions={typedFactions}
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
            onAddMachine={(machine) => {
              // Calculate instance number for this unit type
              const existingUnitsOfType = army.units.filter(u => u.data.id === machine.id);
              const instanceNumber = existingUnitsOfType.length + 1;

              const newUnit: ArmyUnit = {
                instanceId: `${machine.id}_${Date.now()}`,
                type: 'machine',
                data: machine,
                instanceNumber,
                currentDurability: machine.durability_max,
                currentAmmo: machine.ammo_max,
                deadSoldiers: undefined,
                actionsUsed: [{ moved: false, shot: false, melee: false, done: false }],
                machineShotsUsed: 0,
                machineWeaponShots: {},
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
            onToBattle={onEnterBattle || (() => {
              setArmy({
                ...army,
                isInBattle: true,
                currentStep: 'battle',
              });
            })}
            onBackToFactionSelect={() => {
              setArmy({
                ...army,
                units: [],
                totalCost: 0,
                pointBudget: undefined,
                currentStep: 'faction-select',
              });
            }}
            onResetFully={() => {
              // Complete reset - also reset setup step
              setSetupStep('faction');
              setArmy({
                name: 'Моя Армия',
                faction: 'polaris',
                units: [],
                totalCost: 0,
                pointBudget: undefined,
                currentStep: 'faction-select',
                isInBattle: false,
              });
            }}
          />
          </>
        )}
      </div>
    );
}
