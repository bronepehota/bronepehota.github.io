'use client';

import { useState, useEffect, useRef } from 'react';
import { GitHubPagesImage as Image } from './GitHubPagesImage';
import { ArmyUnit, Squad, Machine, RulesVersionID, Weapon, PanicTestResult } from '@/lib/types';
import { Shield, Sword, Target, Heart, CheckCircle2, Bomb, ChevronDown, ChevronUp, UserX, Plane, Skull, Wrench, Flame, Crosshair, X, Image as ImageIcon, Footprints } from 'lucide-react';
import { formatUnitNumber } from '@/lib/unit-utils';
import { getDefaultRulesVersion } from '@/lib/rules-registry';
import { cn } from '@/lib/utils';
import { BottomSheetCombatModal } from './combat/BottomSheetCombatModal';
import { useCombatFlowController } from './combat/CombatFlowController';
import { CombatLogEntry } from '@/lib/combat-types';
import { PilotAssignmentModal } from './PilotAssignmentModal';
import { PilotInfo } from '@/lib/types';
import { PilotTestModal } from './combat/PilotTestModal';
import { usePilotTestFlow } from '@/hooks/usePilotTestFlow';
import MachineBlueprintModal from './machine/MachineBlueprintModal';
import { PanicTestModal } from './PanicTestModal';
import { checkPanicTrigger } from '@/lib/panic-logic';

// Helper function to shorten weapon names for mobile
const _shortenWeaponName = (name: string): string => {
  return name
    .replace(/шестиствольная/gi, '6-ств.')
    .replace(/четырехствольная/gi, '4-ств.')
    .replace(/трехствольная/gi, '3-ств.')
    .replace(/двуствольная/gi, '2-ств.')
    .replace(/двуствольный/gi, '2-ств.')
    .replace(/скорострельные/gi, 'скор.')
    .replace(/автоматическая/gi, 'авт.')
    .replace(/автоматический/gi, 'авт.')
    .replace(/бронебойная/gi, 'бронеб.')
    .replace(/бронебойный/gi, 'бронеб.')
    .replace(/пусковые установки/gi, 'ПУ')
    .replace(/управляемые ракеты/gi, 'УР')
    .replace(/стандартный/gi, 'станд.')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
};

interface UnitCardProps {
  unit: ArmyUnit;
  updateUnit: (unit: ArmyUnit) => void;
  combatLog?: CombatLogEntry[];
  onCombatLogEntry?: (entry: CombatLogEntry) => void;
  allUnits?: ArmyUnit[]; // All units in the army for pilot assignment
  onPilotAssign?: (machineInstanceId: string, pilotInfo: PilotInfo) => void;
  onPilotRemove?: (machineInstanceId: string) => void;
  onNavigateToUnit?: (unitInstanceId: string) => void; // Navigate to unit card
}

export default function UnitCard({ unit, updateUnit, combatLog: _combatLog = [], onCombatLogEntry, allUnits = [], onPilotAssign, onPilotRemove, onNavigateToUnit: _onNavigateToUnit }: UnitCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [showSoldierImage, setShowSoldierImage] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(getDefaultRulesVersion());
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [pilotSurvivalTest, setPilotSurvivalTest] = useState<{ roll: number; survived: boolean; testedAt: number } | null>(null);
  const [selectedWeaponInfo, setSelectedWeaponInfo] = useState<{ weapon: Weapon; weaponIdx: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);

  const combatController = useCombatFlowController();
  const pilotTestFlow = usePilotTestFlow();
  // Track last processed result to prevent duplicate processing
  const lastProcessedResultRef = useRef<number | null>(null);

  // Prevent hydration mismatch by only rendering client-dependent UI after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load rules version from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved) {
      setRulesVersion(saved as any);
    }
  }, []);

  const isSquad = unit.type === 'squad';
  const data = unit.data;

  const isSquadDone = isSquad && (data as Squad).soldiers.every((_, idx) => {
    const isDead = unit.deadSoldiers?.includes(idx);
    const isDone = unit.actionsUsed?.[idx]?.done;
    return isDead || isDone;
  });

  const isAllDead = isSquad && unit.deadSoldiers?.length === (data as Squad).soldiers.length;
  const isMachineDestroyed = !isSquad && (unit.currentDurability === 0);
  const isMachineDone = !isSquad && (unit.isMachineDone || isMachineDestroyed);
  const isCollapsed = isManualCollapsed;

  const toggleAction = (soldierIdx: number, action: 'moved' | 'shot' | 'melee' | 'done') => {
    const newActions = [...(unit.actionsUsed || [])];
    const currentDone = newActions[soldierIdx]?.done || false;

    if (action === 'done' && currentDone) {
      // Untoggling "done" - reset all actions to return to active state
      newActions[soldierIdx] = {
        moved: false,
        shot: false,
        melee: false,
        done: false
      };
    } else {
      newActions[soldierIdx] = {
        ...newActions[soldierIdx],
        [action]: !newActions[soldierIdx][action]
      };
    }
    updateUnit({ ...unit, actionsUsed: newActions });
  };

  const toggleDead = (idx: number) => {
    const dead = unit.deadSoldiers || [];
    const newDead = dead.includes(idx)
      ? dead.filter(i => i !== idx)
      : [...dead, idx];

    const updatedUnit = { ...unit, deadSoldiers: newDead };

    // Check panic trigger for fan rules
    if (rulesVersion === 'fan' && newDead.length > 0) {
      // Use turn 1 as default (will be updated when turn tracking is implemented)
      const currentTurn = 1;
      const shouldTestPanic = checkPanicTrigger(updatedUnit, 'fan', currentTurn);
      if (shouldTestPanic) {
        setShowPanicModal(true);
      }
    }

    updateUnit(updatedUnit);
  };

  const handlePanicTestComplete = (results: PanicTestResult[]) => {
    const currentTurn = 1; // Default turn (will be updated when turn tracking is implemented)
    const panicStates = results
      .filter(r => r.isPanic)
      .map(r => ({
        soldierIndex: r.soldierIndex,
        testRoll: r.roll,
        rank: r.rank,
        triggeredAtTurn: currentTurn,
      }));

    if (panicStates.length > 0) {
      updateUnit({ ...unit, panicState: panicStates });
    }
  };

  const isSoldierInPanic = (soldierIndex: number): boolean => {
    if (!unit.panicState || unit.panicState.length === 0) return false;
    return unit.panicState.some(p => p.soldierIndex === soldierIndex);
  };

  const updateMachineStat = (stat: 'durability' | 'ammo', delta: number) => {
    const max = stat === 'durability' ? (data as Machine).durability_max : (data as Machine).ammo_max;
    const current = stat === 'durability' ? unit.currentDurability! : unit.currentAmmo!;
    const newVal = Math.max(0, Math.min(max, current + delta));

    if (stat === 'durability' && newVal === 0) {
      updateUnit({ ...unit, currentDurability: 0, isMachineDone: true });
    } else {
      updateUnit({ ...unit, [stat === 'durability' ? 'currentDurability' : 'currentAmmo']: newVal });
    }
  };

  const _toggleMachineDestroyed = () => {
    if (unit.currentDurability === 0) {
      updateUnit({ ...unit, currentDurability: 1, isMachineDone: false });
    } else {
      updateUnit({ ...unit, currentDurability: 0, isMachineDone: true });
    }
  };

  const getMachineSpeed = () => {
    if (!unit.currentDurability) return 0;
    const m = data as Machine;
    const sector = m.speed_sectors.find(s => unit.currentDurability! >= s.min_durability && unit.currentDurability! <= s.max_durability);
    return sector ? sector.speed : 0;
  };

  const getDurabilityZone = () => {
    const m = data as Machine;
    const current = unit.currentDurability || 0;
    const max = m.durability_max;

    // Check if custom zones are defined
    if (m.durabilityZones && m.durabilityZones.length > 0) {
      const zone = m.durabilityZones.find(zone => current > zone.max) || m.durabilityZones[m.durabilityZones.length - 1];
      // For green zone, use durability_max as the displayed value
      if (zone.color === 'green') {
        return { ...zone, max };
      }
      return zone;
    }

    // Default zones calculation (2/3 and 1/3)
    const greenThreshold = Math.ceil(max * 2 / 3);
    const yellowThreshold = Math.ceil(max / 3);

    if (current > greenThreshold) return { max, color: 'green' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    if (current > yellowThreshold) return { max: greenThreshold, color: 'yellow' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
    return { max: yellowThreshold, color: 'red' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
  };

  const getZoneColor = (color: 'green' | 'yellow' | 'red') => {
    const colors = {
      green: { bar: 'bg-green-500', text: 'text-green-400' },
      yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400' },
      red: { bar: 'bg-red-500', text: 'text-red-400' }
    };
    return colors[color];
  };

  const handleOpenOriginal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // For machines, show details modal
    // For squads, open external URL or show image
    if (!isSquad) {
      setShowDetailsModal(true);
    } else if (data.originalUrl) {
      window.open(data.originalUrl, '_blank');
    } else {
      setShowImage(true);
    }
  };

  // Handle combat actions
  const _handleSoldierAction = (soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex);
  };

  const handleVehicleAttack = (weaponIndex: number) => {
    combatController.startCombat(unit, undefined, weaponIndex, 'shot');
  };

  // Handle pilot assignment
  const handlePilotAssign = (pilotInfo: PilotInfo) => {
    if (onPilotAssign) {
      onPilotAssign(unit.instanceId, pilotInfo);
    }
  };

  const handlePilotRemove = () => {
    if (onPilotRemove) {
      onPilotRemove(unit.instanceId);
    }
  };

  // Handle pilot survival test - start the modal flow
  const handlePilotSurvivalTest = () => {
    if (!unit.pilotInfo || !unit.pilotInfo.alive) return;

    const machineArmor = unit.currentDurability || (unit.data as Machine).durability_max;
    const pilotArmor = unit.pilotInfo.pilotArmor || 0;

    pilotTestFlow.startTest(machineArmor, pilotArmor, (armorRoll, survivalRoll, survived) => {
      // Store the result
      setPilotSurvivalTest({
        roll: survivalRoll ?? armorRoll,
        survived,
        testedAt: Date.now()
      });

      // Update pilot state if died
      if (!survived && unit.pilotInfo) {
        const updatedPilotInfo: PilotInfo = {
          squadInstanceId: unit.pilotInfo.squadInstanceId || '',
          soldierIndex: unit.pilotInfo.soldierIndex || 0,
          pilotArmor: unit.pilotInfo.pilotArmor || 0,
          alive: false
        };
        updateUnit({ ...unit, pilotInfo: updatedPilotInfo });
      }
    });
  };

  // Reset survival test when pilot changes or durability increases
  useEffect(() => {
    setPilotSurvivalTest(null);
  }, [unit.pilotInfo, unit.currentDurability]);

  // Handle combat completion
  useEffect(() => {
    if (combatController.state.phase === 'RESULTS' && combatController.state.result) {
      const result = combatController.state.result;

      // Skip if we've already processed this result
      if (lastProcessedResultRef.current === result.timestamp) {
        return;
      }

      // Update unit state based on combat result
      if (result.actionType === 'shot' || result.actionType === 'grenade') {
        if (result.unitType === 'squad' && result.soldierIndex !== undefined) {
          const newActions = [...(unit.actionsUsed || [])];
          newActions[result.soldierIndex] = {
            ...newActions[result.soldierIndex],
            shot: true
          };
          updateUnit({ ...unit, actionsUsed: newActions });

          if (result.actionType === 'grenade') {
            updateUnit({ ...unit, grenadesUsed: true });
          }
        } else if (result.unitType === 'machine') {
          const weaponIndex = result.parameters.weaponIndex || 0;
          const weapon = (unit.data as Machine).weapons[weaponIndex];
          const isMeleeWeapon = weapon?.range === 'ББ';

          const newAmmo = isMeleeWeapon
            ? (unit.currentAmmo || 0)  // Не списываем для ББ
            : Math.max(0, (unit.currentAmmo || 0) - 1);
          const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
          const newWeaponShots = {
            ...(unit.machineWeaponShots || {}),
            [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
          };
          updateUnit({
            ...unit,
            currentAmmo: newAmmo,
            machineShotsUsed: newShotsUsed,
            machineWeaponShots: newWeaponShots,
            isMachineShot: true
          });
        }
      } else if (result.actionType === 'melee') {
        if (result.unitType === 'squad' && result.soldierIndex !== undefined) {
          const newActions = [...(unit.actionsUsed || [])];
          newActions[result.soldierIndex] = {
            ...newActions[result.soldierIndex],
            melee: true
          };
          updateUnit({ ...unit, actionsUsed: newActions });
        } else if (result.unitType === 'machine') {
          updateUnit({ ...unit, isMachineMelee: true });
        }
      }

      // Mark this result as processed
      lastProcessedResultRef.current = result.timestamp;
    }
  }, [combatController.state.phase, combatController.state.result, unit, updateUnit]);

  const handleApplyResult = (markAsDone?: boolean) => {
    // Mark soldier as done if requested and this is a squad action
    if (markAsDone && isSquad && combatController.state.result?.soldierIndex !== undefined) {
      const soldierIdx = combatController.state.result.soldierIndex;
      const newActions = [...(unit.actionsUsed || [])];
      newActions[soldierIdx] = {
        ...newActions[soldierIdx],
        done: true
      };
      updateUnit({ ...unit, actionsUsed: newActions });
    }

    if (combatController.state.result && onCombatLogEntry) {
      const entry: CombatLogEntry = {
        id: `${combatController.state.result.unitId}-${combatController.state.result.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: combatController.state.result.timestamp,
        result: combatController.state.result,
        applied: true,
      };
      onCombatLogEntry(entry);
    }
    combatController.closeCombat();
  };

  const getSoldierImage = (idx: number) => {
    if (!isSquad) return '/images/soldiers/empty.png';
    const soldier = (data as Squad).soldiers[idx];
    if (soldier.image) {
      return soldier.image;
    }
    return '/images/soldiers/empty.png';
  };

  const getPilotImage = (): string | null => {
    if (!unit.pilotInfo) return null;
    const squad = allUnits.find(u => u.instanceId === unit.pilotInfo?.squadInstanceId);
    if (!squad || squad.type !== 'squad') return null;
    const soldier = (squad.data as Squad).soldiers[unit.pilotInfo.soldierIndex];
    return soldier.image || null;
  };

  // Helper to get selected weapons for a machine
  // Returns all weapons if selectedWeaponIndices is undefined (backward compatibility)
  // Returns filtered weapons based on indices if provided
  const getSelectedWeapons = (): Array<{ weapon: Weapon; originalIndex: number }> => {
    if (isSquad) return [];
    const machine = unit.data as Machine;
    if (!unit.selectedWeaponIndices) {
      // All weapons for backward compat
      return machine.weapons.map((weapon, i) => ({ weapon, originalIndex: i }));
    }
    // Return only selected weapons with their original indices
    return unit.selectedWeaponIndices.map(i => ({
      weapon: machine.weapons[i],
      originalIndex: i
    }));
  };

  const machineImage = !isSquad ? (unit.data as Machine).image : null;

  // Faction border color for tech corners
  const factionBorderColor = data.faction === 'polaris'
    ? 'rgba(220, 38, 38, 0.6)'
    : data.faction === 'protectorate'
    ? 'rgba(8, 145, 178, 0.6)'
    : 'rgba(202, 138, 4, 0.6)';

  return (
    <div
      onDoubleClick={handleOpenOriginal}
      className={cn(
        "bg-slate-900/80 rounded-sm border-2 border-slate-800 transition-all shadow-lg overflow-hidden relative cursor-default select-none",
        (isSquadDone || (isMachineDone && !isMachineDestroyed)) ? "opacity-70 grayscale-[0.3]" : "",
        isAllDead || isMachineDestroyed ? "opacity-40 grayscale" : "",
        data.faction === 'polaris' ? "border-red-600/30" : data.faction === 'protectorate' ? "border-cyan-600/30" : "border-yellow-600/30"
      )}
    >
      {/* Tech corners - faction colored */}
      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 -ml-px -mt-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 -mr-px -mt-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 -ml-px -mb-px pointer-events-none" style={{ borderColor: factionBorderColor }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 -mr-px -mb-px pointer-events-none" style={{ borderColor: factionBorderColor }} />

      {/* Combat Modal */}
      {combatController.isOpen && (
        <BottomSheetCombatModal
          state={combatController.state}
          rulesVersion={rulesVersion}
          onGoBack={combatController.goBack}
          onClose={combatController.cancelCombat}
          onSelectAction={combatController.selectAction}
          onSetParameters={combatController.setParameters}
          onExecuteAction={combatController.executeAction}
          onApplyResult={handleApplyResult}
          onGrenadeCheckTarget={combatController.checkGrenadeTarget}
          grenadesAvailable={isSquad && !unit.grenadesUsed}
          unitDisplayName={`${formatUnitNumber(unit)} - ${data.name}`}
        />
      )}

      {/* Pilot Assignment Modal */}
      {!isSquad && showPilotModal && (
        <PilotAssignmentModal
          isOpen={showPilotModal}
          onClose={() => setShowPilotModal(false)}
          machine={unit as ArmyUnit & { data: Machine }}
          allUnits={allUnits}
          onAssignPilot={handlePilotAssign}
          onRemovePilot={handlePilotRemove}
        />
      )}

      {/* Pilot Test Modal */}
      {pilotTestFlow.isOpen && (
        <PilotTestModal
          isOpen={pilotTestFlow.isOpen}
          state={pilotTestFlow.state}
          onClose={pilotTestFlow.closeTest}
          onApply={pilotTestFlow.onApply}
        />
      )}

      {/* Machine Blueprint Modal */}
      {showDetailsModal && !isSquad && (
        <MachineBlueprintModal
          machine={data as Machine}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Panic Test Modal */}
      {showPanicModal && (
        <PanicTestModal
          isOpen={showPanicModal}
          unit={unit}
          rulesVersion={rulesVersion}
          onTestComplete={handlePanicTestComplete}
          onClose={() => setShowPanicModal(false)}
        />
      )}

      {/* Weapon Info Modal */}
      {selectedWeaponInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedWeaponInfo(null)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedWeaponInfo(null)} aria-hidden="true" />

          {/* Modal */}
          <div
            className="relative bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Информация об оружии</h2>
              </div>
              <button
                onClick={() => setSelectedWeaponInfo(null)}
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Weapon Name */}
              <div>
                <h3 className="font-mono font-bold text-lg text-white">{selectedWeaponInfo.weapon.name}</h3>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Range */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Дальность</div>
                  <div className="text-lg font-mono font-bold text-amber-400">{selectedWeaponInfo.weapon.range}</div>
                </div>

                {/* Power */}
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Мощность</div>
                  <div className="text-lg font-mono font-bold text-red-400">{selectedWeaponInfo.weapon.power}</div>
                </div>
              </div>

              {/* Special Rules */}
              {selectedWeaponInfo.weapon.special && (
                <div className="bg-purple-950/20 rounded-lg p-3 border border-purple-700/30">
                  <div className="text-[10px] font-mono opacity-50 uppercase mb-1">Особые правила</div>
                  <div className="text-sm font-mono text-purple-300">
                    {typeof selectedWeaponInfo.weapon.special === 'string'
                      ? selectedWeaponInfo.weapon.special
                      : 'Особый'}
                  </div>
                </div>
              )}

              {/* Weapon Type */}
              <div className="text-xs font-mono opacity-40 uppercase">
                {selectedWeaponInfo.weapon.range === 'ББ' ? 'Ближний бой' : 'Дальнобойное оружие'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Overlay - Fixed to viewport */}
      {showImage && data.image && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-2 animate-in fade-in duration-200"
          onClick={() => setShowImage(false)}
        >
          <div className="flex justify-between items-center mb-1 px-2 shrink-0">
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate max-w-[70%]">{data.name}</span>
            <button className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono shrink-0">X</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded border border-slate-700 flex items-center justify-center bg-slate-900">
            <Image src={data.image} alt={data.name} width={400} height={300} className="max-w-full max-h-full object-contain" unoptimized />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1 shrink-0">Нажмите, чтобы закрыть</p>
        </div>
      )}

      {/* Soldier Image Overlay - Fixed to viewport */}
      {showSoldierImage !== null && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-2 animate-in fade-in duration-200"
          onClick={() => setShowSoldierImage(null)}
        >
          <div className="flex justify-between items-center mb-1 px-2 shrink-0">
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate max-w-[70%]">
              {data.name} - СОЛДАТ {showSoldierImage + 1}
            </span>
            <button className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono shrink-0">X</button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden rounded border border-slate-700 flex items-center justify-center bg-slate-900">
            <Image
              src={getSoldierImage(showSoldierImage)}
              alt={`Солдат ${showSoldierImage + 1}`}
              width={400}
              height={533}
              className="max-w-full max-h-full object-contain"
              unoptimized
            />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1 shrink-0">Нажмите, чтобы закрыть</p>
        </div>
      )}

      {/* Unit Header - Tactical Style */}
      <div
        onClick={() => setIsManualCollapsed(!isManualCollapsed)}
        className={cn(
          "p-2 md:p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors relative z-10 border-b border-slate-800/50",
          data.faction === 'polaris' ? "bg-red-950/20" : data.faction === 'protectorate' ? "bg-cyan-950/20" : "bg-yellow-950/20"
        )}
      >
        {/* Tech decoration - top line */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-px",
          data.faction === 'polaris' ? "bg-red-600/20" : data.faction === 'protectorate' ? "bg-cyan-600/20" : "bg-yellow-600/20"
        )} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            {isCollapsed ? (isManualCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronUp className="w-4 h-4" />}
            {unit.instanceNumber && (
              <span className="text-base md:text-lg font-mono font-bold text-slate-400">{formatUnitNumber(unit)}</span>
            )}
            <h3 className="font-mono font-bold text-xs md:text-sm uppercase tracking-wide truncate">{data.name}</h3>
            <span className="text-[9px] md:text-[10px] opacity-50 font-mono">{data.cost} ОЧК.</span>
            {isSquad && (
              <div className={cn(
                "flex items-center gap-0.5 md:gap-1 px-1 md:px-1.5 py-0.5 rounded-sm text-[7px] md:text-[8px] font-mono font-black uppercase tracking-tighter border",
                unit.grenadesUsed ? "bg-red-950/30 text-red-400 border-red-700/50" : "bg-emerald-950/30 text-emerald-400 border-emerald-700/50"
              )}>
                <Bomb className="w-2 h-2 md:w-2.5 md:h-2.5" />
                <span className="hidden sm:inline">{unit.grenadesUsed ? 'Пусто' : '1'}</span>
              </div>
            )}
            {isAllDead && <div className="bg-red-950/50 text-red-400 border border-red-700 text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded-sm font-mono font-black uppercase"><UserX className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5 md:mr-1" />УНИЧТОЖЕН</div>}
          </div>
          <div className="text-[9px] md:text-[10px] opacity-50 flex gap-1.5 md:gap-2 items-center font-mono">
            {isSquadDone && !isAllDead && <span className="text-emerald-400 font-bold ml-auto flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">ГОТОВ</span></span>}
            {isMachineDone && !isMachineDestroyed && <span className="text-emerald-400 font-bold ml-auto flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">ГОТОВ</span></span>}
            {isMachineDestroyed && <div className="bg-red-950/50 text-red-400 border border-red-700 text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded-sm font-mono font-black uppercase ml-auto"><UserX className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5 md:mr-1" />УНИЧТОЖЕН</div>}
          </div>
        </div>
        <div className="flex gap-0.5 md:gap-1" onClick={e => e.stopPropagation()}>
          {/* Machine Photo Button - Mobile only */}
          {!isSquad && (
            <button
              onClick={() => setShowImage(true)}
              className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50 md:hidden"
              title="Показать фото"
              aria-label="Показать фото машины"
            >
              <ImageIcon className="w-4 h-4 opacity-50" />
            </button>
          )}
          <button
            onClick={() => {
              if (isSquad) {
                // Mark all alive soldiers as done
                const newActions = (unit.actionsUsed || Array((data as Squad).soldiers.length).fill({ moved: false, shot: false, melee: false, done: false }))
                  .map((action, idx) => {
                    const isDead = unit.deadSoldiers?.includes(idx);
                    if (isDead) return action;
                    return { ...action, done: true };
                  });
                updateUnit({ ...unit, actionsUsed: newActions });
              } else {
                // Mark machine as done
                updateUnit({ ...unit, isMachineDone: true });
              }
            }}
            className="p-1.5 md:p-1 hover:bg-white/10 rounded-sm transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border border-slate-700/50"
            title={isSquad ? "Завершить ход всех бойцов" : "Завершить ход машины"}
          >
            <CheckCircle2 className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-2 md:p-3 animate-in slide-in-from-top-2 duration-200 relative z-10">
          {isSquad ? (
            <div className="grid grid-cols-1 gap-1.5 md:gap-2">
              {(data as Squad).soldiers.map((s, idx) => {
                const isDead = unit.deadSoldiers?.includes(idx);
                const actions = unit.actionsUsed?.[idx] || { moved: false, shot: false, melee: false, done: false };
                const isDone = actions.done;
                const isInPanic = isSoldierInPanic(idx);

                // Check if this soldier is a pilot
                const soldier = (data as Squad).soldiers[idx];
                const isPilot = soldier.isPilot;
                const _pilotedMachine = isPilot
                  ? allUnits.find((u) => u.instanceId === soldier.pilotOfInstanceId)
                  : null;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "relative p-1 md:p-1.5 rounded-sm border flex gap-1.5 md:gap-2 transition-all overflow-hidden",
                      isDead ? "bg-slate-950/80 border-slate-800 opacity-40 grayscale" :
                      isDone ? "bg-slate-900/40 border-slate-700/50 opacity-70" : "bg-slate-800/30 border-slate-700/50",
                      isPilot && !isDead ? "border-cyan-700/40" : ""
                    )}
                  >
                    {/* Tech corners for pilot */}
                    {isPilot && !isDead && (
                      <>
                        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/40" />
                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/40" />
                      </>
                    )}

                    {/* Soldier image with tactical frame - moved to top-right */}
                    <div className="relative w-16 md:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 bg-slate-900 cursor-pointer shadow-md absolute top-0 right-0">
                      <div onClick={() => setShowSoldierImage(idx)} className="w-full h-full overflow-hidden">
                        <Image
                          src={getSoldierImage(idx)}
                          alt={`Солдат ${idx + 1}`}
                          width={96}
                          height={128}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: '50% 40%', transform: 'scale(2) translateY(10%)' }}
                          unoptimized
                        />
                      </div>

                      {/* Death overlay - only render after mount to prevent hydration mismatch */}
                      {isMounted && isDead && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Skull
                            className="w-8 h-8 md:w-10 md:h-10 text-red-500"
                            strokeWidth={2.5}
                            style={{
                              filter: 'drop-shadow(0 0 12px rgba(239,68,68,1))'
                            }}
                          />
                        </div>
                      )}

                      {/* Done overlay - green checkmark in center - only render after mount to prevent hydration mismatch */}
                      {isMounted && isDone && !isDead && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-emerald-500 rounded-full p-1 md:p-1.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      {/* Panic overlay - footprints icon */}
                      {isMounted && isInPanic && !isDead && !isDone && (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/30">
                          <Footprints
                            className="w-8 h-8 md:w-10 md:h-10 text-orange-400"
                            strokeWidth={2}
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(251,146,60,0.8))'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0 gap-1.5 md:gap-2">
                      {/* Soldier number label */}
                      <div className="text-[10px] font-mono font-bold text-slate-500 opacity-60">
                        #{idx + 1}
                      </div>

                      {/* Row 1: Action buttons */}
                      <div className="flex gap-2 md:gap-3 items-center">
                        {/* ДЕЙСТВИЕ button - fills available space, replaced with panic label when panicking */}
                        {isInPanic ? (
                          <div className="relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden border-2 text-xs font-mono font-bold uppercase tracking-wider bg-orange-950/30 border-orange-700/50 text-orange-400">
                            {/* Tech decoration */}
                            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-orange-600/40" />
                            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-orange-600/40" />
                            <Footprints className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">В ПАНИКЕ</span>
                          </div>
                        ) : (
                          <button
                            disabled={isDone || isDead}
                            onClick={() => combatController.startCombat(unit, idx)}
                            className={cn(
                              "relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden",
                              "border-2 text-xs font-mono font-bold uppercase tracking-wider",
                              "bg-purple-950/20 hover:bg-purple-950/40 border-purple-700/50 text-purple-400 active:scale-95"
                            )}
                            title="Выберите действие"
                            aria-label="Выберите действие"
                          >
                            {/* Tech decoration */}
                            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-purple-600/40" />
                            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-purple-600/40" />
                            <Crosshair className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">ДЕЙСТВИЕ</span>
                          </button>
                        )}

                        {/* Visual separator - desktop only */}
                        <div className="hidden md:block w-px h-8 bg-slate-700/50 mx-1" />

                        {/* Done button - disabled for panicking soldiers */}
                        {isInPanic ? (
                          <div className="relative p-1.5 md:p-2 rounded-sm min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden bg-orange-950/20 border-orange-700/30 text-orange-400/50">
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 opacity-50" />
                          </div>
                        ) : (
                          <button
                            onClick={() => !isDead && toggleAction(idx, 'done')}
                            disabled={isDone || isDead}
                            className={cn(
                              "relative p-1.5 md:p-2 rounded-sm transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden",
                              isDone ? "bg-emerald-950/30 border-emerald-700/50 text-emerald-400" : "bg-slate-900/60 border-slate-700 text-slate-500 hover:bg-slate-800/60"
                            )}
                            title="Завершить ход бойца"
                          >
                            {isDone && (
                              <>
                                <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-emerald-600/40" />
                                <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-emerald-600/40" />
                              </>
                            )}
                            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        )}

                        {/* KIA button - with Skull icon */}
                        <button
                          onClick={() => toggleDead(idx)}
                          className={cn("relative p-1.5 md:p-2 rounded-sm font-mono font-black uppercase tracking-wider min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1 md:gap-1.5 border-2 overflow-hidden transition-all",
                            isDead ? "bg-red-950/40 border-red-700 text-red-300" : "bg-slate-900/60 border-slate-700 text-slate-500 hover:bg-slate-800/60"
                          )}
                        >
                          {isDead ? (
                            <>
                              <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-600/40" />
                              <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-600/40" />
                            </>
                          ) : null}
                          <Skull className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                          <span className="hidden md:inline text-[10px] font-mono font-black uppercase ml-0.5">
                            {isDead ? 'УБИТ' : 'ЖИВ'}
                          </span>
                        </button>
                      </div>

                      {/* Row 2: Stats - Left-aligned flex layout */}
                      <div className="flex flex-wrap gap-0.5 md:gap-1">
                        {/* Armor */}
                        <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
                          <Shield className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-yellow-400 mb-1 md:mb-0 shrink-0" />
                          <span className="text-xs md:text-sm font-mono font-black text-yellow-300 leading-none truncate w-full text-center" title={s.armor.toString()}>
                            {s.armor}
                          </span>
                        </div>

                        {/* Speed */}
                        <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
                          <Footprints className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-cyan-400 mb-1 md:mb-0 shrink-0" />
                          <span className="text-xs md:text-sm font-mono font-black text-cyan-300 leading-none truncate w-full text-center" title={s.speed.toString()}>
                            {s.speed}
                          </span>
                        </div>

                        {/* Range - disabled if no ranged attack */}
                        <div className={cn(
                          "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
                          (!s.range || s.range === '0') && "opacity-40"
                        )}>
                          <Target className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", (!s.range || s.range === '0') ? "text-slate-600" : "text-amber-400")} />
                          <span className={cn(
                            "text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center",
                            (!s.range || s.range === '0') ? "text-slate-600" : "text-amber-300"
                          )} title={s.range}>
                            {s.range && s.range !== '0' ? (s.range.length > 4 ? s.range.replace('D', '') : s.range) : '—'}
                          </span>
                        </div>

                        {/* Power - disabled if no ranged attack */}
                        <div className={cn(
                          "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
                          (!s.power || s.power === '0') && "opacity-40"
                        )}>
                          <Flame className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", (!s.power || s.power === '0') ? "text-slate-600" : "text-red-400")} />
                          <span className={cn(
                            "text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center",
                            (!s.power || s.power === '0') ? "text-slate-600" : "text-red-300"
                          )} title={s.power}>
                            {s.power && s.power !== '0' ? (s.power.length > 4 ? s.power.replace('D', '') : s.power) : '—'}
                          </span>
                        </div>

                        {/* Melee - disabled if no melee attack */}
                        <div className={cn(
                          "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
                          s.melee <= 0 && "opacity-40"
                        )}>
                          <Sword className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", s.melee <= 0 ? "text-slate-600" : "text-red-400")} />
                          <span className={cn(
                            "text-xs md:text-sm font-mono font-black leading-none truncate w-full text-center",
                            s.melee <= 0 ? "text-slate-600" : "text-red-300"
                          )} title={s.melee.toString()}>
                            {s.melee > 0 ? s.melee : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Machine Stats Header - Tech Layout */}
              <div className="grid grid-cols-[1fr_auto] gap-2">
                {/* === ROW 1: Durability+Speed | PILOT (spans 2 rows) === */}
                {/* Durability + Speed Combined - Tactical Display */}
                <div className="relative bg-slate-900/60 p-2 rounded-sm">
                  {/* Tech corners */}
                  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" /> Прочность
                    </span>
                    <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                      <Footprints className="w-2.5 h-2.5 md:w-3 md:h-3" /> Скорость
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Durability controls - Tech Style */}
                    <div className="flex-1 flex items-center gap-1">
                      {/* Damage Button */}
                      <button
                        onClick={() => updateMachineStat('durability', -1)}
                        disabled={unit.currentDurability === 0}
                        className={cn(
                          "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-red-950/30 hover:bg-red-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-red-800/50 shrink-0 overflow-hidden",
                          getZoneColor(getDurabilityZone().color).text
                        )}
                        title="Нанести урон"
                      >
                        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-600/40" />
                        <Flame className="w-4 h-4" />
                      </button>

                      {/* Durability Value */}
                      <span className={cn("text-sm md:text-base font-mono font-black min-w-[20px] text-center shrink-0", getZoneColor(getDurabilityZone().color).text)}>
                        {unit.currentDurability}
                      </span>

                      {/* Repair Button */}
                      <button
                        onClick={() => updateMachineStat('durability', 1)}
                        disabled={unit.currentDurability === (data as Machine).durability_max}
                        className={cn(
                          "relative w-9 h-9 md:w-10 md:h-10 rounded-sm bg-emerald-950/30 hover:bg-emerald-950/50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border-2 border-emerald-800/50 shrink-0 overflow-hidden",
                          getZoneColor(getDurabilityZone().color).text
                        )}
                        title="Ремонт"
                      >
                        <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-emerald-600/40" />
                        <Wrench className="w-4 h-4" />
                      </button>

                      {/* Segmented Progress Bar - Military Style */}
                      <div className="flex-1 flex items-center gap-px">
                        {Array.from({ length: (data as Machine).durability_max }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 rounded-sm transition-all flex-1",
                              i < (unit.currentDurability || 0)
                                ? getZoneColor(getDurabilityZone().color).bar
                                : "bg-slate-800"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Speed display - Tech Style */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <span className="text-sm md:text-base font-mono font-black text-yellow-400">
                        {getMachineSpeed()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pilot Button - Tech Frame with survival test overlay */}
                <div className="row-span-2 w-12 h-28 md:w-14 md:h-28 shrink-0 relative">
                  <button
                    onClick={() => setShowPilotModal(true)}
                    className="w-full h-full rounded-sm border-2 border-slate-700/50 overflow-hidden bg-slate-900/60 relative"
                  >
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/40" />
                    <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/40" />
                    <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/40" />
                    <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/40" />

                    {unit.pilotInfo ? (
                      <>
                        <Image
                          src={getPilotImage() || '/images/soldiers/empty.png'}
                          width={64}
                          height={128}
                          className="w-full h-full object-cover scale-150"
                          unoptimized
                          alt="Пилот"
                        />
                        {/* Status overlay - Tech Style */}
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 text-[7px] md:text-[8px] font-mono font-bold text-center py-0.5 border-t",
                          unit.pilotInfo.alive
                            ? "bg-emerald-950/90 text-emerald-300 border-emerald-700/50"
                            : "bg-red-950/90 text-red-300 border-red-700/50"
                        )}>
                          {unit.pilotInfo.alive ? 'ЖИВ' : 'ПОГИБ'}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-0.5">
                        <Plane className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-[8px] md:text-[9px] font-mono font-bold uppercase">Пилот</span>
                      </div>
                    )}
                  </button>
                  {/* Survival Test Button - Overlay at bottom-right corner */}
                  {unit.pilotInfo && unit.pilotInfo.alive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePilotSurvivalTest();
                      }}
                      disabled={pilotTestFlow.isOpen}
                      className={cn(
                        "absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-transform border-2 min-w-[36px] min-h-[36px]",
                        pilotTestFlow.isOpen && "animate-pulse",
                        pilotSurvivalTest
                          ? pilotSurvivalTest.survived
                            ? "bg-green-600 border-green-900 text-white"
                            : "bg-red-600 border-red-900 text-white"
                          : pilotTestFlow.isOpen
                          ? "bg-purple-600 border-purple-900 text-white animate-spin"
                          : "bg-purple-900 border-purple-950 text-purple-300 hover:bg-purple-800 hover:scale-110"
                      )}
                      title={pilotSurvivalTest ? `Повторить тест (последний: ${pilotSurvivalTest.survived ? 'ВЫЖИЛ' : 'ПОГИБ'})` : "Тест выживаемости пилота (D12 + D6)"}
                    >
                      <Skull className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  )}
                </div>

                {/* === ROW 2: Ammo+Shots | (pilot continues) === */}
                {/* Ammo + Shots Combined - Tactical Display */}
                <div className="relative bg-slate-900/60 p-2 rounded-sm">
                  {/* Tech corners */}
                  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
                  <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/50" />
                  <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/50" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                      <Bomb className="w-2.5 h-2.5 md:w-3 md:h-3" /> Боезапас
                    </span>
                    <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                      <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> Выстрелы
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Ammo progress bar - Segmented */}
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 flex items-center gap-px">
                        {Array.from({ length: (data as Machine).ammo_max }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 rounded-sm transition-all flex-1",
                              i < (unit.currentAmmo || 0)
                                ? "bg-blue-500"
                                : "bg-slate-800"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] md:text-xs font-mono font-black text-blue-400 min-w-[38px] text-right shrink-0">
                        {unit.currentAmmo}/{(data as Machine).ammo_max}
                      </span>
                    </div>

                    {/* Shots count - Segmented */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex gap-px">
                        {Array.from({ length: (data as Machine).fire_rate }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-2 rounded-sm transition-all flex-1",
                              i < ((unit.machineShotsUsed || 0))
                                ? "bg-amber-500"
                                : "bg-slate-800"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] md:text-xs font-mono font-black text-amber-400 min-w-[35px] text-right">
                        {unit.machineShotsUsed || 0}/{(data as Machine).fire_rate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weapons List - Tactical Weapon Cards */}
              <div className="flex gap-2">
                {/* Machine Photo - Hidden on mobile, 1/4 width on desktop */}
                <div className="relative w-1/4 h-auto shrink-0 hidden md:block">
                  <div
                    onClick={handleOpenOriginal}
                    className="w-full h-full rounded-sm overflow-hidden bg-slate-900/60 relative cursor-pointer shadow-md"
                  >
                    {/* Tech corners */}
                    <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-slate-600/40" />
                    <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-slate-600/40" />
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-slate-600/40" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-slate-600/40" />

                    {machineImage ? (
                      <Image
                        src={machineImage}
                        alt={data.name}
                        width={64}
                        height={200}
                        className="w-full h-auto object-cover object-center"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full aspect-[3/10] flex items-center justify-center text-slate-700">
                        <Plane className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Weapons - Right side */}
                <div className="flex-1 space-y-2">
                  {(() => {
                    const allWeapons = getSelectedWeapons();

                    // Helper to check if weapon is non-ranged (melee/special)
                    const isNonRangedWeapon = (weapon: Weapon) => {
                      // Melee range (ББ)
                      if (weapon.range === 'ББ') return true;
                      // Power is a simple number (not dice notation like "2D6")
                      const powerStr = String(weapon.power);
                      if (/^\d+$/.test(powerStr)) return true;
                      return false;
                    };

                    const rangedWeapons = allWeapons.filter(({ weapon }) => !isNonRangedWeapon(weapon));
                    const meleeWeapons = allWeapons.filter(({ weapon }) => isNonRangedWeapon(weapon));

                    return (
                      <>
                        {/* Ranged Weapons - Full cards */}
                        {rangedWeapons.map(({ weapon, originalIndex: weaponIdx }) => {
                          const weaponShots = unit.machineWeaponShots?.[weaponIdx] || 0;
                          const totalShotsUsed = unit.machineShotsUsed || 0;
                          const fireRate = (data as Machine).fire_rate;
                          const canShoot = !isMachineDone && !isMachineDestroyed &&
                                          (unit.currentAmmo || 0) > 0 &&
                                          totalShotsUsed < fireRate;

                          return (
                            <div
                              key={weaponIdx}
                              className={cn(
                                "relative p-1.5 md:p-2.5 rounded-sm flex gap-1.5 md:gap-3 transition-all overflow-hidden",
                                isMachineDestroyed ? "bg-slate-950/80 opacity-40 grayscale" :
                                isMachineDone ? "bg-slate-900/40 opacity-70" :
                                weaponShots > 0 ? "bg-amber-950/20" : "bg-slate-800/30"
                              )}
                            >
                              {/* Tech corners for active weapon */}
                              {canShoot && (
                                <>
                                  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-600/30" />
                                  <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-amber-600/30" />
                                </>
                              )}

                              <div className="flex-1 flex flex-col min-w-0 gap-1.5">
                                {/* Weapon Name Label - Small at top */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                                    <Crosshair className="w-2.5 h-2.5 md:w-3 md:h-3" /> {weapon.name}
                                  </span>
                                </div>

                                {/* Weapon Actions Row - Following soldier card pattern */}
                                <div className="flex gap-0.5 md:gap-1">
                                  {/* Weapon Icon - Clickable for info */}
                                  <button
                                    onClick={() => setSelectedWeaponInfo({ weapon, weaponIdx })}
                                    className="shrink-0 w-10 h-10 rounded-full bg-slate-900/60 flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-slate-800/60 transition-all"
                                    title="Информация об оружии"
                                  >
                                    <Crosshair className="w-5 h-5 text-slate-600" />
                                  </button>

                                  {/* Fire Button - Full width (flex-1) */}
                                  <button
                                    disabled={!canShoot}
                                    onClick={() => handleVehicleAttack(weaponIdx)}
                                    className={cn(
                                      "relative p-1.5 md:p-2 rounded-sm transition-all flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1 overflow-hidden",
                                      "border-2 text-xs font-mono font-bold uppercase tracking-wider",
                                      weaponShots > 0
                                        ? "bg-amber-950/40 border-amber-800/50 text-amber-700"
                                        : canShoot
                                        ? "bg-amber-950/20 hover:bg-amber-950/40 border-amber-700/50 text-amber-400 active:scale-95"
                                        : "bg-slate-900/40 border-slate-700/30 text-slate-600 cursor-not-allowed"
                                    )}
                                    title="Выстрел"
                                  >
                                    {!weaponShots && !isMachineDone && !isMachineDestroyed && canShoot && (
                                      <>
                                        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-600/40" />
                                        <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-amber-600/40" />
                                      </>
                                    )}
                                    <Target className="w-4 h-4 md:w-5 md:h-5" />
                                    <span className="hidden sm:inline">ВЫСТРЕЛ</span>
                                  </button>

                                  {/* Range Stat Display */}
                                  <div className="relative flex flex-col items-center justify-center p-1.5 md:p-2 rounded-lg md:rounded-full bg-slate-900/40 shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
                                    <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 mb-0.5 shrink-0" />
                                    <span className="text-[10px] md:text-xs font-mono font-bold text-amber-300 leading-tight truncate w-full text-center" title={weapon.range}>
                                      {weapon.range.length > 4 ? weapon.range.replace('D', '') : weapon.range}
                                    </span>
                                  </div>

                                  {/* Power Stat Display */}
                                  <div className="relative flex flex-col items-center justify-center p-1.5 md:p-2 rounded-lg md:rounded-full bg-slate-900/40 shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
                                    <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400 mb-0.5 shrink-0" />
                                    <span className="text-[10px] md:text-xs font-mono font-bold text-red-300 leading-tight truncate w-full text-center" title={weapon.power}>
                                      {weapon.power.length > 4 ? weapon.power.replace('D', '') : weapon.power}
                                    </span>
                                  </div>
                                </div>

                                {/* Weapon Special Badge - Only show special property badge */}
                                {weapon.special && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-sm bg-purple-950/30 text-purple-400 font-mono font-bold uppercase border border-purple-700/50 truncate">
                                      {typeof weapon.special === 'string' ? weapon.special : 'Особый'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Melee Weapons - Compact section at bottom */}
                        {meleeWeapons.length > 0 && (
                          <div className={cn(
                            "relative p-2 rounded-sm transition-all",
                            isMachineDestroyed ? "bg-slate-950/80 opacity-40 grayscale" :
                            isMachineDone ? "bg-slate-900/40 opacity-70" : "bg-red-950/10"
                          )}>
                            {/* Section Header */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sword className="w-3 h-3 text-red-400" />
                              <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-red-400">Ближний бой</span>
                            </div>

                            {/* Melee weapons list - compact format */}
                            <div className="space-y-1">
                              {meleeWeapons.map(({ weapon, originalIndex: weaponIdx }) => (
                                <div
                                  key={weaponIdx}
                                  className="flex items-center gap-2 text-[8px] md:text-[9px]"
                                >
                                  {/* Weapon name */}
                                  <span className="font-mono text-slate-300 truncate flex-1">{weapon.name}</span>

                                  {/* Power stat */}
                                  <div className="flex items-center gap-1 shrink-0 bg-slate-950/60 px-1.5 py-0.5 rounded-full">
                                    <span className="text-[7px] opacity-30 font-mono uppercase hidden sm:inline">МОЩН</span>
                                    <span className="font-mono font-bold text-red-400">{weapon.power}</span>
                                  </div>

                                  {/* Info button */}
                                  <button
                                    onClick={() => setSelectedWeaponInfo({ weapon, weaponIdx })}
                                    className="shrink-0 w-6 h-6 rounded border border-slate-700/50 bg-slate-900/60 flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-slate-800/60 transition-all"
                                    title="Информация об оружии"
                                  >
                                    <Crosshair className="w-3 h-3 text-slate-500" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Machine Actions Footer - Tactical Controls */}
              <div className="flex gap-1 md:gap-1.5 mt-2 pt-2 border-t border-slate-700">
                <button
                  disabled={isMachineDone || isMachineDestroyed}
                  onClick={() => {
                    combatController.startCombat(unit);
                    combatController.selectAction('melee');
                  }}
                  className={cn(
                    "relative flex-1 p-2 md:p-2.5 rounded-sm transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 overflow-hidden",
                    unit.isMachineMelee ? "bg-red-950/30 border-red-700 text-red-400" : "bg-slate-900/60 border-slate-700 text-slate-500 hover:bg-slate-800/60"
                  )}
                >
                  {unit.isMachineMelee && (
                    <>
                      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-600/40" />
                      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-600/40" />
                    </>
                  )}
                  <Sword className="w-4 h-4" />
                  <span className="hidden sm:inline">ТАРАН</span>
                </button>

                <button
                  onClick={() => {
                    if (isMachineDestroyed) return;
                    if (unit.isMachineDone) {
                      // Untoggling done - reset all actions to return to active state
                      updateUnit({
                        ...unit,
                        isMachineMoved: false,
                        isMachineShot: false,
                        isMachineMelee: false,
                        isMachineDone: false
                      });
                    } else {
                      updateUnit({ ...unit, isMachineDone: true });
                    }
                  }}
                  disabled={isMachineDestroyed || isMachineDone}
                  className={cn(
                    "relative flex-1 p-2 md:p-2.5 rounded-sm transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 overflow-hidden",
                    isMachineDone ? "bg-emerald-950/30 border-emerald-700 text-emerald-400" : "bg-slate-900/60 border-slate-700 text-slate-500 hover:bg-slate-800/60"
                  )}
                >
                  {isMachineDone && (
                    <>
                      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-emerald-600/40" />
                      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-emerald-600/40" />
                    </>
                  )}
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isMachineDone ? 'ГОТОВО' : 'ЗАВЕРШИТЬ'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isCollapsed && (
        <div
          onClick={() => setIsManualCollapsed(false)}
          className="px-3 pb-3 pt-1 flex gap-4 items-center animate-in fade-in duration-300 relative z-10"
        >
          {isSquad ? (
            <div className="flex gap-2 items-center flex-1">
              <div className="flex -space-x-2">
                {(data as Squad).soldiers.slice(0, 3).map((_, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full border border-slate-700 overflow-hidden bg-slate-900 ring-2 ring-slate-800 relative">
                    <Image
                      src={getSoldierImage(idx)}
                      alt={`Солдат ${idx + 1}`}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover object-center scale-150"
                      unoptimized
                    />
                    {/* Tech decoration */}
                    <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/40" />
                  </div>
                ))}
                {(data as Squad).soldiers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-[8px] font-mono font-bold ring-2 ring-slate-800">
                    +{(data as Squad).soldiers.length - 3}
                  </div>
                )}
              </div>
              <div className="text-[10px] font-mono font-bold opacity-60">
                ЖИВЫХ: <span className="text-white">{(data as Squad).soldiers.length - (unit.deadSoldiers?.length || 0)}/{(data as Squad).soldiers.length}</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 items-center flex-1">
              {/* Durability - Tech Display */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border border-slate-600/20" />
                  <Heart className={cn("w-3 h-3", isMachineDestroyed ? "text-red-500" : "text-emerald-500")} />
                  <span className={cn("text-[10px] font-mono font-bold", isMachineDestroyed ? "text-red-400" : "text-emerald-400")}>
                    {unit.currentDurability} HP
                  </span>
                </div>
              </div>

              {/* Ammo - Tech Display */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border border-slate-600/20" />
                  <Bomb className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] font-mono font-bold text-blue-400">{unit.currentAmmo} AMMO</span>
                </div>
              </div>

              {isMachineDestroyed && (
                <div className="ml-auto text-[8px] font-mono font-black uppercase text-red-400 bg-red-950/50 border border-red-700 px-1 py-0.5 rounded-sm">
                  УНИЧТОЖЕН
                </div>
              )}
            </div>
          )}
          <div className="text-[10px] opacity-40 italic">Нажмите, чтобы развернуть...</div>
        </div>
      )}
    </div>
  );
}
