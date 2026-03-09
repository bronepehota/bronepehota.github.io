'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GitHubPagesImage as Image } from '../GitHubPagesImage';
import { ArmyUnit, Squad, Machine, Weapon, PanicTestResult, PilotInfo } from '@/lib/types';
import { Crosshair, X } from 'lucide-react';
import { formatUnitNumber } from '@/lib/unit-utils';
import { cn } from '@/lib/utils';
import { formatRange } from '@/lib/distance-utils';
import { BottomSheetCombatModal } from '../combat/BottomSheetCombatModal';
import { useCombatFlowController } from '../combat/CombatFlowController';
import { CombatLogEntry } from '@/lib/combat-types';
import { PilotAssignmentModal } from '../modals/PilotAssignmentModal';
import { PilotTestModal } from '../combat/PilotTestModal';
import { usePilotTestFlow } from '@/hooks/usePilotTestFlow';
import { EncyclopediaModal } from '../modals/EncyclopediaModal';
import { PanicTestModal } from '../modals/PanicTestModal';
import { UnitWithType } from '@/lib/encyclopedia-utils';
import { UnitCardHeader } from './unit-card/UnitCardHeader';
import { SquadView } from './unit-card/SquadView';
import { MachineView } from './unit-card/MachineView';
import { useUnitCardState } from './unit-card/hooks/useUnitCardState';

interface UnitCardProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  combatLog?: CombatLogEntry[];
  onCombatLogEntry?: (entry: CombatLogEntry) => void;
  allUnits?: ArmyUnit[]; // All units in the army for pilot assignment
  onPilotAssign?: (machineInstanceId: string, pilotInfo: PilotInfo) => void;
  onPilotRemove?: (machineInstanceId: string) => void;
  onNavigateToUnit?: (unitInstanceId: string) => void; // Navigate to unit card
  strictPilotRankEnabled?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  autoCompleteEnabled?: boolean;
}

export default function UnitCard({
  unit,
  updateUnit,
  combatLog: _combatLog = [],
  onCombatLogEntry,
  allUnits = [],
  onPilotAssign,
  onPilotRemove,
  onNavigateToUnit: _onNavigateToUnit,
  strictPilotRankEnabled = true,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  autoCompleteEnabled = true,
}: UnitCardProps) {
  // Custom hooks for state management
  const {
    showImage,
    showDetailsModal,
    showPilotModal,
    rulesVersion,
    pilotSurvivalTest,
    setShowImage,
    setShowDetailsModal,
    setShowPilotModal,
    setPilotSurvivalTest,
  } = useUnitCardState(unit);

  const [showSoldierImage, setShowSoldierImage] = useState<number | null>(null);
  const [selectedWeaponInfo, setSelectedWeaponInfo] = useState<{ weapon: Weapon; weaponIdx: number } | null>(null);
  const [showPanicModal, setShowPanicModal] = useState(false);

  const combatController = useCombatFlowController();
  const pilotTestFlow = usePilotTestFlow();
  const lastProcessedResultRef = useRef<number | null>(null);

  // Machine stats hook (only for machines)
  // Machine stats hook (only for machines) - called unconditionally but only used for machines
  // Note: useMachineStats will throw if called on a squad, so we need to conditionally call it
  // inside the render, not at the hook level
  const getMachineStats = () => {
    if (unit.type !== 'machine') return null;
    // We'll compute stats inline for machines
    const machine = unit.data as Machine;
    const currentDurability = unit.currentDurability || 0;

    // Calculate speed based on durability sector
    const speed = !currentDurability ? 0 : (() => {
      const sector = machine.speed_sectors.find(
        s => currentDurability >= s.min_durability && currentDurability <= s.max_durability
      );
      return sector ? sector.speed : 0;
    })();

    // Calculate durability zone
    const max = machine.durability_max;
    let zone;
    if (machine.durabilityZones && machine.durabilityZones.length > 0) {
      zone = machine.durabilityZones.find(z => currentDurability > z.max) || machine.durabilityZones[machine.durabilityZones.length - 1];
      if (zone.color === 'green') {
        zone = { ...zone, max };
      }
    } else {
      const greenThreshold = Math.ceil(max * 2 / 3);
      const yellowThreshold = Math.ceil(max / 3);

      if (currentDurability > greenThreshold) {
        zone = { max, color: 'green' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
      } else if (currentDurability > yellowThreshold) {
        zone = { max: greenThreshold, color: 'yellow' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
      } else {
        zone = { max: yellowThreshold, color: 'red' as const, damagePerDie: { D6: 1, D12: 2, D20: 3 } };
      }
    }

    // Update durability function
    const updateDurability = (delta: number) => {
      updateUnit(unit.instanceId, (u) => {
        if (u.type !== 'machine') return u;
        const newVal = Math.max(0, Math.min(max, currentDurability + delta));
        if (newVal === 0) {
          return { ...u, currentDurability: 0, isMachineDone: true };
        }
        return { ...u, currentDurability: newVal };
      });
    };

    return { currentDurability, maxDurability: max, speed, zone, updateDurability };
  };

  const machineStats = getMachineStats();

  // Check if per-weapon ammo system should be used (only for community_star_system rules)
  const usePerWeaponAmmo = rulesVersion === 'community_star_system';

  const isSquad = unit.type === 'squad';
  const data = unit.data;

  // Helper to wrap the new updateUnit API for backward-compatible calls within UnitCard
  const updateThisUnit = (updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => {
    updateUnit(unit.instanceId, updateFn);
  };

  const isSquadDone = isSquad && (data as Squad).soldiers.every((_, idx) => {
    const isDead = unit.deadSoldiers?.includes(idx);
    const isDone = unit.actionsUsed?.[idx]?.done;
    return isDead || isDone;
  });

  const isAllDead = isSquad && unit.deadSoldiers?.length === (data as Squad).soldiers.length;
  const isMachineDestroyed = !isSquad && (unit.currentDurability === 0);
  const isMachineDone = !isSquad && (unit.isMachineDone || isMachineDestroyed);

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
      updateThisUnit((u) => ({ ...u, panicState: panicStates }));
    }
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
  const _handleSoldierAction = useCallback((soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex);
  }, [unit, combatController]);

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
        updateThisUnit((u) => ({ ...u, pilotInfo: updatedPilotInfo }));
      }
    });
  };

  // Reset survival test when pilot changes or durability increases
  useEffect(() => {
    setPilotSurvivalTest(null);
  }, [unit.pilotInfo, unit.currentDurability, setPilotSurvivalTest]);

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
        // For grenades, mark as used immediately (no choice needed)
        if (result.actionType === 'grenade' && result.unitType === 'squad') {
          updateThisUnit((u) => ({ ...u, grenadesUsed: true }));
        }
        // For squads: don't auto-mark shot, let user choose via UI
        // For machines: handle ammo/shot counting
        if (result.unitType === 'machine') {
          const weaponIndex = result.parameters.weaponIndex || 0;
          const weapon = (unit.data as Machine).weapons[weaponIndex];
          const isMeleeWeapon = weapon?.range === 'ББ';

          const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
          const newWeaponShots = {
            ...(unit.machineWeaponShots || {}),
            [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
          };

          if (usePerWeaponAmmo && !isMeleeWeapon) {
            // Per-weapon ammo system (community_star_system): decrease weapon-specific ammo
            const newWeaponAmmo = [...(unit.weaponAmmo || [])];
            newWeaponAmmo[weaponIndex] = Math.max(0, (newWeaponAmmo[weaponIndex] || 0) - 1);

            updateThisUnit((u) => ({
              ...u,
              weaponAmmo: newWeaponAmmo,
              // Also update global ammo for display compatibility
              currentAmmo: Math.max(0, (u.currentAmmo || 0) - 1),
              machineShotsUsed: newShotsUsed,
              machineWeaponShots: newWeaponShots,
              isMachineShot: true
            }));
          } else {
            // Original behavior for tehnolog or melee weapons
            const newAmmo = isMeleeWeapon
              ? (unit.currentAmmo || 0)  // Не списываем для ББ
              : Math.max(0, (unit.currentAmmo || 0) - 1);

            updateThisUnit((u) => ({
              ...u,
              currentAmmo: newAmmo,
              machineShotsUsed: newShotsUsed,
              machineWeaponShots: newWeaponShots,
              isMachineShot: true
            }));
          }
        }
      } else if (result.actionType === 'melee') {
        if (result.unitType === 'squad' && result.soldierIndex !== undefined) {
          const newActions = [...(unit.actionsUsed || [])];
          newActions[result.soldierIndex] = {
            ...newActions[result.soldierIndex],
            melee: true
          };
          updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
        } else if (result.unitType === 'machine') {
          updateThisUnit((u) => ({ ...u, isMachineMelee: true }));
        }
      }

      // Mark this result as processed
      lastProcessedResultRef.current = result.timestamp;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatController.state.phase, combatController.state.result, unit]);

  const handleApplyResult = (markAsDone?: boolean) => {
    const result = combatController.state.result;

    // For squads: mark shot as used and optionally mark as done
    if (isSquad && result?.soldierIndex !== undefined) {
      const soldierIdx = result.soldierIndex;
      const newActions = [...(unit.actionsUsed || [])];

      // Mark shot as used
      if (result.actionType === 'shot') {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          shot: true
        };
      } else if (result.actionType === 'melee') {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          melee: true
        };
      }

      // Mark as done if checkbox was checked
      if (markAsDone) {
        newActions[soldierIdx] = {
          ...newActions[soldierIdx],
          done: true
        };
      }

      updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
    }

    if (combatController.state.result && onCombatLogEntry) {
      const entry: CombatLogEntry = {
        id: `${combatController.state.result.unitId}-${combatController.state.result.timestamp}-${Math.random().toString(36).substring(2, 11)}`,
        timestamp: combatController.state.result.timestamp,
        result: combatController.state.result,
        applied: true,
      };
      onCombatLogEntry(entry);
    }
    combatController.closeCombat();
  };

  const getSoldierImage = useCallback((idx: number) => {
    if (!isSquad) return '/images/soldiers/empty.png';
    const soldier = (data as Squad).soldiers[idx];
    if (soldier.image) {
      return soldier.image;
    }
    return '/images/soldiers/empty.png';
  }, [isSquad, data]);

  const getPilotImage = (): string | null => {
    if (!unit.pilotInfo) return null;
    const squad = allUnits.find(u => u.instanceId === unit.pilotInfo?.squadInstanceId);
    if (!squad || squad.type !== 'squad') return null;
    const soldier = (squad.data as Squad).soldiers[unit.pilotInfo.soldierIndex];
    return soldier.image || null;
  };

  const handleToggleDone = () => {
    if (isSquad) {
      // Toggle: mark all alive soldiers as done or undo
      const targetState = !isSquadDone;
      const newActions = (unit.actionsUsed || Array((data as Squad).soldiers.length).fill({ moved: false, shot: false, melee: false, done: false }))
        .map((action, idx) => {
          const isDead = unit.deadSoldiers?.includes(idx);
          if (isDead) return action;
          return { ...action, done: targetState };
        });
      updateThisUnit((u) => ({ ...u, actionsUsed: newActions }));
    } else {
      // Toggle: mark machine as done or undo
      updateThisUnit((u) => ({ ...u, isMachineDone: !isMachineDone }));
    }
  };

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
      {/* Unit number badge - top left corner */}
      {unit.instanceNumber && (
        <div className={cn(
          "absolute top-0 left-0 z-20 px-1.5 py-0.5 rounded-br-sm font-mono font-bold text-xs md:text-sm border border-r-2 border-b-2 pointer-events-none",
          data.faction === 'polaris'
            ? "bg-red-950/90 text-red-400 border-red-600/40"
            : data.faction === 'protectorate'
            ? "bg-cyan-950/90 text-cyan-400 border-cyan-600/40"
            : "bg-yellow-950/90 text-yellow-400 border-yellow-600/40"
        )}>
          {formatUnitNumber(unit)}
        </div>
      )}

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
          autoCompleteEnabled={autoCompleteEnabled}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
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
          strictPilotRankEnabled={strictPilotRankEnabled}
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
        <EncyclopediaModal
          unit={{ ...data, type: 'machine' } as UnitWithType}
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          scrollTarget="machine-images"
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
                  <div className="font-mono font-bold text-amber-400">
                    <div className="text-lg">{selectedWeaponInfo.weapon.range}</div>
                    <div className="text-sm opacity-80">{formatRange(selectedWeaponInfo.weapon.range, 'cm', stepToCmFactor)}</div>
                  </div>
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
              width={300}
              height={400}
              className="max-w-full max-h-full object-contain"
              unoptimized
            />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1 shrink-0">Нажмите, чтобы закрыть</p>
        </div>
      )}

      {/* Unit Header */}
      <UnitCardHeader
        unit={unit}
        isDone={isSquadDone || isMachineDone}
        isAllDead={isAllDead}
        grenadesAvailable={isSquad && (data as Squad).soldiers.some(s => s.props?.includes('Г'))}
        grenadesUsed={unit.grenadesUsed}
        onToggleDone={handleToggleDone}
        onOpenDetails={handleOpenOriginal}
        showPhotoButton={!isSquad}
        onShowPhoto={() => setShowImage(true)}
      />

      {/* Unit Content */}
      <div className="p-2 md:p-3 relative z-10">
        {isSquad ? (
          <SquadView
            unit={unit}
            updateUnit={updateUnit}
            onSoldierAction={_handleSoldierAction}
            setShowSoldierImage={setShowSoldierImage}
            setShowPanicModal={setShowPanicModal}
            rulesVersion={rulesVersion}
            distanceInputUnit={distanceInputUnit}
            stepToCmFactor={stepToCmFactor}
            allUnits={allUnits}
            getSoldierImage={getSoldierImage}
          />
        ) : (
          <MachineView
            unit={unit}
            zone={machineStats!.zone}
            speed={machineStats!.speed}
            updateDurability={machineStats!.updateDurability}
            updateAmmo={(delta) => {
              const max = (data as Machine).ammo_max;
              const current = unit.currentAmmo || 0;
              const newVal = Math.max(0, Math.min(max, current + delta));
              updateThisUnit((u) => ({ ...u, currentAmmo: newVal }));
            }}
            onWeaponAttack={handleVehicleAttack}
            onWeaponInfo={(weaponIndex) => {
              const weapon = (data as Machine).weapons[weaponIndex];
              setSelectedWeaponInfo({ weapon, weaponIdx: weaponIndex });
            }}
            onPilotAssign={() => setShowPilotModal(true)}
            onPilotSurvivalTest={handlePilotSurvivalTest}
            pilotSurvivalTest={pilotSurvivalTest}
            pilotImage={getPilotImage()}
            isPilotTestRunning={pilotTestFlow.isOpen}
            rulesVersion={rulesVersion}
            usePerWeaponAmmo={usePerWeaponAmmo}
            distanceInputUnit={distanceInputUnit}
            stepToCmFactor={stepToCmFactor}
          />
        )}
      </div>
    </div>
  );
}
