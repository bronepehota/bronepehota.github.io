'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ArmyUnit, Squad, Machine, RulesVersionID } from '@/lib/types';
import factionsData from '@/data/factions.json';
import { Shield, Sword, Target, Heart, Zap, RotateCcw, ExternalLink, CheckCircle2, Bomb, ChevronDown, ChevronUp, UserX, Dices, Plane, Skull, Wrench } from 'lucide-react';
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

export default function UnitCard({ unit, updateUnit, combatLog: _combatLog = [], onCombatLogEntry, allUnits = [], onPilotAssign, onPilotRemove, onNavigateToUnit }: UnitCardProps) {
  const [showImage, setShowImage] = useState(false);
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);
  const [rulesVersion, setRulesVersion] = useState<RulesVersionID>(getDefaultRulesVersion());
  const [showPilotModal, setShowPilotModal] = useState(false);
  const [pilotSurvivalTest, setPilotSurvivalTest] = useState<{ roll: number; survived: boolean; testedAt: number } | null>(null);

  const combatController = useCombatFlowController();
  const pilotTestFlow = usePilotTestFlow();
  // Track last processed result to prevent duplicate processing
  const lastProcessedResultRef = useRef<number | null>(null);

  // Load rules version from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bronepehota_rules_version');
    if (saved) {
      setRulesVersion(saved as any);
    }
  }, []);

  const isSquad = unit.type === 'squad';
  const data = unit.data;
  const faction = factionsData.find(f => f.id === data.faction);

  const isSquadDone = isSquad && (data as Squad).soldiers.every((_, idx) => {
    const isDead = unit.deadSoldiers?.includes(idx);
    const isDone = unit.actionsUsed?.[idx]?.done;
    return isDead || isDone;
  });

  const isAllDead = isSquad && unit.deadSoldiers?.length === (data as Squad).soldiers.length;
  const isMachineDestroyed = !isSquad && (unit.currentDurability === 0);
  const isMachineDone = !isSquad && (unit.isMachineDone || isMachineDestroyed);
  const isCollapsed = isManualCollapsed || isSquadDone || isMachineDone || isAllDead;

  const toggleAction = (soldierIdx: number, action: 'moved' | 'shot' | 'melee' | 'done') => {
    const newActions = [...(unit.actionsUsed || [])];
    newActions[soldierIdx] = {
      ...newActions[soldierIdx],
      [action]: !newActions[soldierIdx][action]
    };
    updateUnit({ ...unit, actionsUsed: newActions });
  };

  const toggleDead = (idx: number) => {
    const dead = unit.deadSoldiers || [];
    const newDead = dead.includes(idx)
      ? dead.filter(i => i !== idx)
      : [...dead, idx];
    updateUnit({ ...unit, deadSoldiers: newDead });
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
    if (data.originalUrl) {
      window.open(data.originalUrl, '_blank');
    } else {
      setShowImage(true);
    }
  };

  // Handle combat actions
  const _handleSoldierAction = (soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex);
  };

  const handleSoldierShotAction = (soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex, undefined, 'shot');
  };

  const handleSoldierMeleeAction = (soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex, undefined, 'melee');
  };

  const handleSoldierGrenadeAction = (soldierIndex: number) => {
    combatController.startCombat(unit, soldierIndex, undefined, 'grenade');
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

    const pilotArmor = unit.pilotInfo.pilotArmor || 0;

    pilotTestFlow.startTest(pilotArmor, (armorRoll, survivalRoll, survived) => {
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

  const handleApplyResult = () => {
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

  const machineImage = !isSquad && !!(unit.data as Machine).image;

  return (
    <div
      onDoubleClick={handleOpenOriginal}
      className={cn(
        "bg-slate-800 rounded-xl border-t-2 transition-all shadow-lg overflow-hidden relative cursor-default select-none",
        (isSquadDone || (isMachineDone && !isMachineDestroyed)) ? "opacity-70 grayscale-[0.3]" : "",
        isAllDead || isMachineDestroyed ? "opacity-40 grayscale" : "",
        data.faction === 'polaris' ? "border-t-red-900/50" : data.faction === 'protectorate' ? "border-t-blue-900/50" : "border-t-green-900/50",
        !isSquad && machineImage ? "min-h-[600px]" : ""
      )}
      style={machineImage ? {
        backgroundImage: `url(${machineImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {/* Background overlay for machine cards */}
      {machineImage && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900/95 pointer-events-none z-0" />
      )}

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

      {/* Image Overlay */}
      {showImage && data.image && (
        <div
          className="absolute inset-0 z-50 bg-slate-950 flex flex-col p-2 animate-in fade-in duration-200"
          onClick={() => setShowImage(false)}
        >
          <div className="flex justify-between items-center mb-1 px-2">
            <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest truncate">{data.name}</span>
            <button className="text-[10px] bg-slate-800 px-2 py-1 rounded font-mono">X</button>
          </div>
          <div className="flex-1 overflow-auto rounded border border-slate-700 custom-scrollbar">
            <Image src={data.image} alt={data.name} width={800} height={600} className="max-w-none w-[400%]" unoptimized />
          </div>
          <p className="text-[9px] text-center opacity-40 mt-1">Прокрутите, чтобы увидеть характеристики</p>
        </div>
      )}

      {/* Unit Header */}
      <div
        onClick={() => setIsManualCollapsed(!isManualCollapsed)}
        className={cn(
          "p-2 md:p-3 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors relative z-10",
          data.faction === 'polaris' ? "bg-red-900/20" : data.faction === 'protectorate' ? "bg-blue-900/20" : "bg-green-900/20"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-2">
            {isCollapsed ? (isManualCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />) : <ChevronUp className="w-4 h-4" />}
            {unit.instanceNumber && (
              <span className="text-lg font-bold text-slate-400">{formatUnitNumber(unit)}</span>
            )}
            <h3 className="font-bold text-xs md:text-sm uppercase tracking-wide truncate">{data.name}</h3>
            {isSquad && (
              <div className={cn(
                "flex items-center gap-0.5 md:gap-1 px-1 md:px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase tracking-tighter",
                unit.grenadesUsed ? "bg-red-900/40 text-red-400 border border-red-900/50" : "bg-green-900/40 text-green-400 border border-green-900/50"
              )}>
                <Bomb className="w-2 h-2 md:w-2.5 md:h-2.5" />
                <span className="hidden sm:inline">{unit.grenadesUsed ? 'Пусто' : '1'}</span>
              </div>
            )}
            {isAllDead && <div className="bg-red-600 text-white text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded font-black uppercase"><UserX className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5 md:mr-1" />УНИЧТОЖЕН</div>}
          </div>
          <div className="text-[9px] md:text-[10px] opacity-50 flex gap-1.5 md:gap-2 items-center">
            <span className="hidden sm:inline" style={{ color: faction?.color }}>{faction?.name || data.faction.toUpperCase()}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">{data.cost} ОЧК.</span>
            {isSquadDone && !isAllDead && <span className="text-green-400 font-bold ml-auto flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">ГОТОВ</span></span>}
            {isMachineDone && !isMachineDestroyed && <span className="text-green-400 font-bold ml-auto flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" /> <span className="hidden sm:inline">ГОТОВ</span></span>}
            {isMachineDestroyed && <div className="bg-red-600 text-white text-[7px] md:text-[8px] px-1 md:px-1.5 py-0.5 rounded font-black uppercase ml-auto"><UserX className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-0.5 md:mr-1" />УНИЧТОЖЕН</div>}
          </div>
        </div>
        <div className="flex gap-0.5 md:gap-1" onClick={e => e.stopPropagation()}>
          {(data.image || data.originalUrl) && (
            <button
              onClick={() => handleOpenOriginal()}
              className="p-1.5 md:p-1 hover:bg-white/10 rounded transition-colors text-blue-400 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
              title={data.originalUrl ? "Открыть оригинал в VK (двойной клик)" : "Показать оригинал армлиста"}
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (isSquad) {
                updateUnit({ ...unit, grenadesUsed: false, actionsUsed: Array((data as Squad).soldiers.length).fill({ moved: false, shot: false, melee: false, done: false }) });
              } else {
                updateUnit({
                  ...unit,
                  isMachineMoved: false,
                  isMachineShot: false,
                  isMachineMelee: false,
                  isMachineDone: false,
                  machineShotsUsed: 0,
                  machineWeaponShots: undefined
                });
              }
            }}
            className="p-1.5 md:p-1 hover:bg-white/10 rounded transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
            title="Сбросить ходы"
          >
            <RotateCcw className="w-4 h-4 opacity-50" />
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

                // Check if this soldier is a pilot
                const soldier = (data as Squad).soldiers[idx];
                const isPilot = soldier.isPilot;
                const pilotedMachine = isPilot
                  ? allUnits.find((u) => u.instanceId === soldier.pilotOfInstanceId)
                  : null;

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-1.5 md:p-2 rounded-lg border flex gap-2 md:gap-3 transition-all relative overflow-hidden",
                      isDead ? "bg-slate-950 border-slate-800 opacity-40 grayscale" :
                      isDone ? "bg-slate-900/50 border-slate-700 opacity-80" : "bg-slate-700/30 border-slate-600",
                      isPilot && !isDead ? "border-blue-700/50" : ""
                    )}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-md border border-slate-600 overflow-hidden flex-shrink-0 bg-slate-900 relative">
                      <Image
                        src={getSoldierImage(idx)}
                        alt={`Солдат ${idx + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover object-center"
                        unoptimized
                      />
                      {/* Pilot Badge Overlay */}
                      {isPilot && !isDead && (
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-900/90 text-[6px] md:text-[7px] font-bold text-center text-blue-200 py-0.5">
                          ПИЛОТ
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        {/* Action Buttons - Left Side */}
                        <div className="flex gap-0.5 md:gap-1 flex-1 min-w-0">
                          {/* Shot Button - Orange */}
                          <button
                            disabled={isDone || isDead || actions.shot}
                            onClick={() => handleSoldierShotAction(idx)}
                            className={cn(
                              "p-1.5 md:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1",
                              "text-white border-2 text-xs font-bold",
                              !unit.grenadesUsed ? "flex-1" : "flex-1 sm:flex-1",
                              actions.shot
                                ? "bg-orange-900/40 border-orange-700/50 text-orange-700"
                                : "bg-orange-600 hover:bg-orange-500 border-orange-500 active:scale-95"
                            )}
                            title="Выстрел"
                            aria-label="Атаковать"
                          >
                            <Target className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">ВЫСТРЕЛ</span>
                          </button>

                          {/* Melee Button - Red */}
                          <button
                            disabled={isDone || isDead || actions.melee}
                            onClick={() => handleSoldierMeleeAction(idx)}
                            className={cn(
                              "p-1.5 md:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1",
                              "text-white border-2 text-xs font-bold",
                              !unit.grenadesUsed ? "flex-1" : "flex-1 sm:flex-1",
                              actions.melee
                                ? "bg-red-900/40 border-red-700/50 text-red-700"
                                : "bg-red-600 hover:bg-red-500 border-red-500 active:scale-95"
                            )}
                            title="Ближний бой"
                          >
                            <Sword className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">БЛИЖНИЙ БОЙ</span>
                          </button>

                          {/* Action Button - For Grenade */}
                          {!unit.grenadesUsed && (
                            <button
                              disabled={isDone || isDead}
                              onClick={() => handleSoldierGrenadeAction(idx)}
                              className={cn(
                                "p-1.5 md:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1",
                                "text-slate-800 border-2 border-slate-700 text-white hover:bg-slate-700 active:scale-95",
                                "flex-1"
                              )}
                              style={{
                                backgroundColor: `${faction?.color}20`,
                                borderColor: `${faction?.color}40`
                              }}
                              title="Граната"
                            >
                              <Bomb className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="hidden sm:inline text-xs font-bold">ГРАНАТА</span>
                            </button>
                          )}
                        </div>

                        <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                          <button
                            onClick={() => !isDead && toggleAction(idx, 'done')}
                            className={cn(
                              "p-1.5 md:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                              isDone ? "bg-green-600 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
                            )}
                            title="Завершить ход бойца"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleDead(idx)}
                            className={cn("text-[8px] md:text-[9px] px-1.5 md:px-2 py-1 md:py-0.5 rounded font-black uppercase tracking-tiller min-h-[44px] md:min-h-0 flex items-center justify-center", isDead ? "bg-red-900 text-red-100" : "bg-slate-800 text-slate-400 border border-slate-700")}
                          >
                            {isDead ? 'УБИТ' : 'ЖИВ'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-4 mt-1.5 md:mt-2 flex-wrap">
                        <div className="flex gap-2 md:gap-4 flex-1">
                          <span className="flex items-center gap-0.5 md:gap-1 text-xs md:text-sm font-black text-yellow-500 bg-slate-900/50 px-1.5 md:px-2 py-0.5 rounded border border-yellow-900/30" title="Броня">
                            <Shield className="w-3 h-3 md:w-4 md:h-4" /> {s.armor}
                          </span>
                          <span className="flex items-center gap-0.5 md:gap-1 text-xs md:text-sm font-black text-blue-400 bg-slate-900/50 px-1.5 md:px-2 py-0.5 rounded border border-blue-900/30" title="Скорость">
                            <Zap className="w-3 h-3 md:w-4 md:h-4" /> {s.speed}
                          </span>
                        </div>
                        <div className="flex gap-1.5 md:gap-2 ml-auto">
                          <div className="bg-slate-900/80 px-1.5 md:px-2 py-0.5 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-[6px] md:text-[7px] opacity-40 leading-none hidden sm:inline">ДАЛЬН</span>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-orange-400">{s.range}</span>
                          </div>
                          <div className="bg-slate-900/80 px-1.5 md:px-2 py-0.5 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-[6px] md:text-[7px] opacity-40 leading-none hidden sm:inline">МОЩН</span>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-red-400">{s.power}</span>
                          </div>
                          <div className="bg-slate-900/80 px-1.5 md:px-2 py-0.5 rounded border border-slate-700 flex flex-col items-center">
                            <span className="text-[6px] md:text-[7px] opacity-40 leading-none hidden sm:inline">БББ</span>
                            <span className="text-[9px] md:text-[10px] font-mono font-bold text-red-400">{s.melee}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pilot Badge - clickable to navigate to machine */}
                      {isPilot && !isDead && pilotedMachine && (
                        <button
                          onClick={() => onNavigateToUnit?.(pilotedMachine.instanceId)}
                          className="mt-1.5 md:mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-900/30 border border-blue-700/50 hover:bg-blue-900/50 transition-colors group"
                        >
                          <Plane className="w-3 h-3 text-blue-400 group-hover:text-blue-300" />
                          <span className="text-[9px] md:text-[10px] font-bold text-blue-300">
                            МАШИНА #{pilotedMachine.instanceNumber}
                          </span>
                          <span className="text-[7px] md:text-[8px] text-blue-400/70 group-hover:text-blue-300/70 ml-auto">
                            →
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Machine Stats Header - Redesigned */}
              {/* Mobile: Two rows (Durability+Speed + Pilot | Ammo+Shots) */}
              {/* Desktop: Single row (Durability+Speed | Ammo+Shots | Pilot) */}
              <div className="flex flex-col md:flex-row gap-2">
                {/* Durability + Speed Combined */}
                <div className="flex-1 bg-slate-900/80 p-2 rounded-lg border border-slate-700 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] md:text-[9px] opacity-50 uppercase font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 md:w-3 md:h-3" /> Прочность
                    </span>
                    <span className="text-[8px] md:text-[9px] opacity-50 uppercase font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" /> Скорость
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Durability controls */}
                    <div className="flex-1 flex items-center gap-1">
                      {/* Damage Button */}
                      <button
                        onClick={() => updateMachineStat('durability', -1)}
                        disabled={unit.currentDurability === 0}
                        className={cn(
                          "w-9 h-9 md:w-10 md:h-10 rounded bg-red-900/40 hover:bg-red-900/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border border-red-800/50 shrink-0",
                          getZoneColor(getDurabilityZone().color).text
                        )}
                        title="Нанести урон"
                      >
                        <Skull className="w-4 h-4" />
                      </button>
                      <span className={cn("text-sm md:text-base font-black min-w-[20px] text-center shrink-0", getZoneColor(getDurabilityZone().color).text)}>
                        {unit.currentDurability}
                      </span>
                      {/* Repair Button */}
                      <button
                        onClick={() => updateMachineStat('durability', 1)}
                        disabled={unit.currentDurability === (data as Machine).durability_max}
                        className={cn(
                          "w-9 h-9 md:w-10 md:h-10 rounded bg-green-900/40 hover:bg-green-900/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors min-w-[40px] min-h-[40px] border border-green-800/50 shrink-0",
                          getZoneColor(getDurabilityZone().color).text
                        )}
                        title="Ремонт"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                      {/* Progress bar */}
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex-1 min-w-[20px]">
                        <div
                          className={cn("h-full transition-all", getZoneColor(getDurabilityZone().color).bar)}
                          style={{ width: `${(unit.currentDurability! / (data as Machine).durability_max) * 100}%` }}
                        />
                      </div>
                    </div>
                    {/* Speed display */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-400 opacity-60" />
                      <span className="text-sm md:text-base font-black text-yellow-400">
                        {getMachineSpeed()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ammo + Shots Combined */}
                <div className="flex-1 bg-slate-900/80 p-2 rounded-lg border border-slate-700 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] md:text-[9px] opacity-50 uppercase font-bold flex items-center gap-1">
                      <Bomb className="w-2.5 h-2.5 md:w-3 md:h-3" /> Боезапас
                    </span>
                    <span className="text-[8px] md:text-[9px] opacity-50 uppercase font-bold flex items-center gap-1">
                      <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> Выстрелы
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Ammo progress bar */}
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex-1">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(unit.currentAmmo! / (data as Machine).ammo_max) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] md:text-xs font-black text-blue-400 min-w-[38px] text-right shrink-0">
                        {unit.currentAmmo}/{(data as Machine).ammo_max}
                      </span>
                    </div>
                    {/* Shots count */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden w-10">
                        <div
                          className="h-full bg-orange-500 transition-all"
                          style={{ width: `${Math.min(100, ((unit.machineShotsUsed || 0) / (data as Machine).fire_rate) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] md:text-xs font-black text-orange-400 min-w-[35px] text-right">
                        {unit.machineShotsUsed || 0}/{(data as Machine).fire_rate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pilot Button - Compact, on the right with survival test integrated */}
                <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 relative">
                  <button
                    onClick={() => setShowPilotModal(true)}
                    className="w-full h-full rounded-lg border border-slate-700 overflow-hidden bg-slate-900/80 relative"
                  >
                    {unit.pilotInfo ? (
                      <>
                        <Image
                          src={getPilotImage() || '/images/soldiers/empty.png'}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                          alt="Пилот"
                        />
                        {/* Status overlay */}
                        <div className={cn(
                          "absolute bottom-0 left-0 right-0 text-[7px] md:text-[8px] font-bold text-center py-0.5",
                          unit.pilotInfo.alive
                            ? "bg-green-900/90 text-green-300"
                            : "bg-red-900/90 text-red-300"
                        )}>
                          {unit.pilotInfo.alive ? 'ЖИВ' : 'ПОГИБ'}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-0.5">
                        <Plane className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-[8px] md:text-[9px] font-bold uppercase">Пилот</span>
                      </div>
                    )}
                  </button>
                  {/* Survival Test Button - Small overlay at bottom */}
                  {unit.pilotInfo && unit.pilotInfo.alive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePilotSurvivalTest();
                      }}
                      disabled={pilotTestFlow.isOpen}
                      className={cn(
                        "absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-transform border-2 min-w-[36px] min-h-[36px]",
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
                      <Skull className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Weapons List - like soldier cards */}
              <div className="space-y-1.5 md:space-y-2">
                {(data as Machine).weapons.map((weapon, weaponIdx) => {
                  const weaponShots = unit.machineWeaponShots?.[weaponIdx] || 0;
                  const totalShotsUsed = unit.machineShotsUsed || 0;
                  const fireRate = (data as Machine).fire_rate;
                  const isMeleeWeapon = weapon.range === 'ББ';
                  const canShoot = !isMachineDone && !isMachineDestroyed &&
                                  (unit.currentAmmo || 0) > 0 &&
                                  totalShotsUsed < fireRate &&
                                  weaponShots === 0 &&
                                  !isMeleeWeapon;

                  return (
                    <div
                      key={weaponIdx}
                      className={cn(
                        "p-2 md:p-2.5 rounded-lg border flex gap-2 md:gap-3 transition-all relative overflow-hidden",
                        isMachineDestroyed ? "bg-slate-950 border-slate-800 opacity-40 grayscale" :
                        isMachineDone ? "bg-slate-900/50 border-slate-700 opacity-80" :
                        weaponShots > 0 ? "bg-orange-900/20 border-orange-700/50" : "bg-slate-700/30 border-slate-600"
                      )}
                    >
                      {/* Weapon Icon */}
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-md border border-slate-600 overflow-hidden flex-shrink-0 bg-slate-900 flex items-center justify-center">
                        <Target className={cn(
                          "w-6 h-6 md:w-8 md:h-8",
                          canShoot ? "text-orange-400" : weaponShots > 0 ? "text-orange-700" : "text-slate-600"
                        )} />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        {/* Top row: Action button + controls */}
                        <div className="flex justify-between items-start gap-2">
                          {/* Combat Action Button - only show for non-melee weapons */}
                          {!isMeleeWeapon && (
                            <button
                              disabled={!canShoot}
                              onClick={() => handleVehicleAttack(weaponIdx)}
                              className={cn(
                                "px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1.5",
                                "text-white font-bold text-xs md:text-sm border-2",
                                canShoot
                                  ? "bg-orange-600 hover:bg-orange-500 border-orange-500 shadow-lg shadow-orange-900/50 active:scale-95"
                                  : "bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed opacity-50"
                              )}
                              title="Атака с этим оружием"
                            >
                              <Dices className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="hidden sm:inline">ВЫСТРЕЛ</span>
                            </button>
                          )}

                          <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
                            {/* Done button */}
                            <button
                              onClick={() => {
                                const newWeaponShots = {
                                  ...(unit.machineWeaponShots || {}),
                                  [weaponIdx]: 1
                                };
                                updateUnit({
                                  ...unit,
                                  machineWeaponShots: newWeaponShots,
                                  machineShotsUsed: (unit.machineShotsUsed || 0) + 1
                                });
                              }}
                              disabled={weaponShots > 0 || isMachineDone || isMachineDestroyed}
                              className={cn(
                                "p-1.5 md:p-2 rounded-lg transition-all min-w-[40px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                                weaponShots > 0 ? "bg-orange-600 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
                              )}
                              title="Ометить как выстреливший"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            {/* Reset button */}
                            <button
                              onClick={() => {
                                const newWeaponShots = { ...(unit.machineWeaponShots || {}) };
                                delete newWeaponShots[weaponIdx];
                                updateUnit({
                                  ...unit,
                                  machineWeaponShots: newWeaponShots,
                                  machineShotsUsed: Math.max(0, (unit.machineShotsUsed || 0) - 1)
                                });
                              }}
                              disabled={weaponShots === 0}
                              className={cn(
                                "p-1.5 md:p-2 rounded-lg transition-all min-w-[40px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
                                weaponShots === 0 ? "bg-slate-800 text-slate-600 border border-slate-700 opacity-50" : "bg-slate-700 text-slate-300 border border-slate-600"
                              )}
                              title="Сбросить выстрел"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Weapon Stats */}
                        <div className="flex items-center gap-2 md:gap-3 mt-2 md:mt-1.5 flex-wrap">
                          <span className="font-bold text-sm md:text-sm truncate">{weapon.name}</span>
                          <div className="flex gap-1.5 md:gap-2 ml-auto">
                            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                              <span className="text-[9px] md:text-[10px] font-mono font-bold text-orange-400">{weapon.range}</span>
                            </div>
                            <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                              <span className="text-[9px] md:text-[10px] font-mono font-bold text-red-400">{weapon.power}</span>
                            </div>
                          </div>
                        </div>

                        {/* Weapon Status Badge */}
                        <div className="flex items-center gap-2 mt-1">
                          {weaponShots > 0 && (
                            <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-400 font-bold uppercase">
                              ВЫСТРЕЛИЛ
                            </span>
                          )}
                          {weapon.special && (
                            <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-400 font-bold uppercase truncate">
                              {typeof weapon.special === 'string' ? weapon.special : 'Особый'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pilot Management Actions */}
              {unit.pilotInfo && (
                <div className="flex gap-1 md:gap-1.5 mt-2 pt-2 border-t border-slate-700">
                  {unit.pilotInfo.alive && (
                    <button
                      onClick={() => {
                        if (onPilotRemove) {
                          onPilotRemove(unit.instanceId);
                        }
                      }}
                      className={cn(
                        "flex-1 p-2 md:p-2.5 rounded-lg transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-bold",
                        "bg-blue-900/30 text-blue-400 border border-blue-700/50 hover:bg-blue-900/50"
                      )}
                      title="Выбросить пилота из машины"
                    >
                      <UserX className="w-4 h-4" />
                      <span className="hidden sm:inline">ВЫБРОСИТЬСЯ</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPilotModal(true)}
                    className={cn(
                      "flex-1 p-2 md:p-2.5 rounded-lg transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-bold",
                      "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
                    )}
                    title="Сменить пилота"
                  >
                    <Plane className="w-4 h-4" />
                    <span className="hidden sm:inline">СМЕНИТЬ ПИЛОТА</span>
                  </button>
                </div>
              )}

              {/* Machine Actions Footer */}
              <div className="flex gap-1 md:gap-1.5 mt-2 pt-2 border-t border-slate-700">
                <button
                  disabled={isMachineDone || isMachineDestroyed}
                  onClick={() => {
                    combatController.startCombat(unit);
                    combatController.selectAction('melee');
                  }}
                  className={cn(
                    "flex-1 p-2 md:p-2.5 rounded-lg transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-bold",
                    unit.isMachineMelee ? "bg-red-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}
                >
                  <Sword className="w-4 h-4" />
                  <span className="hidden sm:inline">ТАРАН</span>
                </button>
                <button
                  onClick={() => !isMachineDestroyed && updateUnit({ ...unit, isMachineDone: !unit.isMachineDone })}
                  disabled={isMachineDestroyed}
                  className={cn(
                    "flex-1 p-2 md:p-2.5 rounded-lg transition-colors min-h-[44px] md:min-h-0 flex items-center justify-center gap-1.5 text-xs font-bold",
                    isMachineDone ? "bg-green-600 text-white" : "bg-slate-800 text-slate-400 border border-slate-700"
                  )}
                >
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
                  </div>
                ))}
                {(data as Squad).soldiers.length > 3 && (
                  <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-[8px] font-bold ring-2 ring-slate-800">
                    +{(data as Squad).soldiers.length - 3}
                  </div>
                )}
              </div>
              <div className="text-[10px] font-bold opacity-60">
                ЖИВЫХ: <span className="text-white">{(data as Squad).soldiers.length - (unit.deadSoldiers?.length || 0)}/{(data as Squad).soldiers.length}</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 items-center flex-1">
              <div className="flex items-center gap-2">
                <Heart className={cn("w-3 h-3", isMachineDestroyed ? "text-red-500" : "text-green-500")} />
                <span className={cn("text-[10px] font-bold", isMachineDestroyed ? "text-red-400" : "text-white")}>
                  {unit.currentDurability} HP
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Bomb className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-bold text-white">{unit.currentAmmo} AMMO</span>
              </div>
              {isMachineDestroyed && (
                <div className="ml-auto text-[8px] font-black uppercase text-red-400">
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
