'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Army, ArmyUnit, Squad, PilotInfo, FactionID } from '@/lib/types';
import { resolvePanic } from '@/lib/panic-logic';
import { getFactionColors } from '@/lib/faction-colors';
import UnitCard from './cards/UnitCard';
import { History, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CombatLogEntry } from '@/lib/combat-types';
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';
import InitiativeModal from './modals/InitiativeModal';
import { UnitNavigationCard } from './GameSession/index';

// Faction styles for unit dock navigation
const getUnitDockStyles = (factionId: string) => {
  const colors = getFactionColors(factionId as FactionID);
  return {
    primary: colors.borderSolid,
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  };
};

interface GameSessionProps {
  army: Army;
  setArmy: (army: Army) => void;
  isInBattle?: boolean;
  onEndBattle?: () => void;
  onInitiativeTriggerRef?: (trigger: () => void) => void;
  showCombatLog?: boolean;
  setShowCombatLog?: (show: boolean) => void;
  strictPilotRankEnabled?: boolean;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
}

export default function GameSession({
  army,
  setArmy,
  onInitiativeTriggerRef,
  showCombatLog,
  setShowCombatLog,
  strictPilotRankEnabled = true,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5
}: GameSessionProps) {
  const [showInitiativeModal, setShowInitiativeModal] = useState(false);
  const [showTurnConfirmation, setShowTurnConfirmation] = useState(false);
  const [focusedUnitIdx, setFocusedUnitIdx] = useState(0);
  const [isDockExpanded, setIsDockExpanded] = useState(false);
  const [dockDragProgress, setDockDragProgress] = useState(0);
  const { clearAllMemory } = useCombatTargetContext();

  // Keep ref to current army for immediate access in updateUnit
  const armyRef = useRef(army);
  useEffect(() => {
    armyRef.current = army;
  }, [army]);

  const updateUnit = (
    arg1: string | ArmyUnit | ((currentUnit: ArmyUnit) => ArmyUnit),
    arg2?: (currentUnit: ArmyUnit) => ArmyUnit
  ) => {
    // Three API styles supported:
    // 1. updateUnit(instanceId, updateFn) - functional update with explicit instanceId
    // 2. updateUnit(armyUnit) - direct update with unit object (backward compatibility)
    // 3. updateUnit(updateFn) - NOT SUPPORTED (causes bug where all units get updated)

    let targetInstanceId: string;
    let updatedUnit: ArmyUnit | undefined;

    if (typeof arg1 === 'string') {
      // Style 1: updateUnit(instanceId, updateFn)
      targetInstanceId = arg1;
      // Apply update function only to matching unit
      const newArmy = {
        ...armyRef.current,
        units: armyRef.current.units.map(u =>
          u.instanceId === targetInstanceId ? arg2!(u) : u
        )
      };
      armyRef.current = newArmy;
      setArmy(newArmy);
      return;
    } else if (typeof arg1 === 'function') {
      // Style 3: updateUnit(updateFn) - find the unit by trying the function
      // This is called from SoldierCard with closure-captured soldierIndex
      // We need to find which unit actually changed
      const newArmy = {
        ...armyRef.current,
        units: armyRef.current.units.map(u => {
          const result = arg1(u);
          // The function adds/removes the captured soldierIndex from deadSoldiers
          // Only the matching unit will have a different deadSoldiers array
          const deadChanged = JSON.stringify(u.deadSoldiers) !== JSON.stringify(result.deadSoldiers);
          const actionsChanged = JSON.stringify(u.actionsUsed) !== JSON.stringify(result.actionsUsed);
          return (deadChanged || actionsChanged) ? result : u;
        })
      };
      armyRef.current = newArmy;
      setArmy(newArmy);
      return;
    } else {
      // Style 2: updateUnit(armyUnit) - direct update
      targetInstanceId = arg1.instanceId;
      updatedUnit = arg1;
    }

    // Direct update path
    const newArmy = {
      ...armyRef.current,
      units: armyRef.current.units.map(u => u.instanceId === targetInstanceId ? updatedUnit! : u)
    };
    armyRef.current = newArmy;
    setArmy(newArmy);
  };

  // Calculate initiative - opens the initiative modal
  const calculateInitiative = useCallback(() => {
    setShowInitiativeModal(true);
  }, []);

  // Expose trigger function to parent via callback ref
  useEffect(() => {
    if (onInitiativeTriggerRef) {
      onInitiativeTriggerRef(calculateInitiative);
    }
  }, [calculateInitiative, onInitiativeTriggerRef]);

  // Combat log visibility - controlled by parent with stable fallback
  const noOp = useMemo(() => () => {}, []);
  const combatLogVisible = showCombatLog ?? false;
  const setCombatLogVisible = setShowCombatLog ?? noOp;

  // Combat log state
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);

  // Handle pilot assignment - updates both machine and squad
  const handlePilotAssign = useCallback((machineInstanceId: string, pilotInfo: PilotInfo) => {
    const updatedUnits = army.units.map((unit: ArmyUnit) => {
      // Update the machine with pilot info
      if (unit.instanceId === machineInstanceId) {
        return { ...unit, pilotInfo };
      }
      // Update the squad soldier as pilot
      if (unit.instanceId === pilotInfo.squadInstanceId && unit.type === 'squad') {
        const updatedSoldiers = [...(unit.data as Squad).soldiers];
        updatedSoldiers[pilotInfo.soldierIndex] = {
          ...updatedSoldiers[pilotInfo.soldierIndex],
          isPilot: true,
          pilotOfInstanceId: machineInstanceId,
        };
        return { ...unit, data: { ...unit.data, soldiers: updatedSoldiers } };
      }
      return unit;
    });
    setArmy({ ...army, units: updatedUnits });
  }, [army, setArmy]);

  // Handle pilot removal - clears pilot from both machine and squad
  const handlePilotRemove = useCallback((machineInstanceId: string) => {
    // Find the machine to get pilot info before clearing
    const machine = army.units.find((u: ArmyUnit) => u.instanceId === machineInstanceId);
    if (!machine?.pilotInfo) return;

    const updatedUnits = army.units.map((unit: ArmyUnit) => {
      // Clear pilot info from machine
      if (unit.instanceId === machineInstanceId) {
        const { pilotInfo: _pilotInfo, ...unitWithoutPilot } = unit;
        return unitWithoutPilot;
      }
      // Clear pilot status from squad soldier
      if (unit.instanceId === machine.pilotInfo!.squadInstanceId && unit.type === 'squad') {
        const updatedSoldiers = [...(unit.data as Squad).soldiers];
        updatedSoldiers[machine.pilotInfo!.soldierIndex] = {
          ...updatedSoldiers[machine.pilotInfo!.soldierIndex],
          isPilot: false,
          pilotOfInstanceId: undefined,
        };
        return { ...unit, data: { ...unit.data, soldiers: updatedSoldiers } };
      }
      return unit;
    });
    setArmy({ ...army, units: updatedUnits });
  }, [army, setArmy]);

  // Handle navigation to a specific unit
  const handleNavigateToUnit = useCallback((unitInstanceId: string) => {
    const targetIdx = army.units.findIndex((u: ArmyUnit) => u.instanceId === unitInstanceId);
    if (targetIdx !== -1) {
      setFocusedUnitIdx(targetIdx);
    }
  }, [army.units]);

  const handleCombatLogEntry = (entry: CombatLogEntry) => {
    setCombatLog(prev => [entry, ...prev]);
  };

  // Helper to count incomplete (active) units
  const getIncompleteUnits = () => {
    return army.units.filter(unit => {
      if (unit.type === 'squad') {
        const squad = unit.data as Squad;
        // Check if any alive soldier is not done
        return squad.soldiers.some((_, idx) => {
          const isDead = unit.deadSoldiers?.includes(idx);
          const isDone = unit.actionsUsed?.[idx]?.done;
          return !isDead && !isDone;
        });
      } else {
        // Machine is incomplete if not done
        return !unit.isMachineDone && (unit.currentDurability || 0) > 0;
      }
    });
  };

  const startNewTurn = () => {
    const incompleteUnits = getIncompleteUnits();
    if (incompleteUnits.length > 0) {
      setShowTurnConfirmation(true);
    } else {
      confirmStartNewTurn();
    }
  };

  const confirmStartNewTurn = () => {
    // Сброс памяти параметров цели при начале нового тура
    clearAllMemory();

    const newTurn = (army.currentTurn || 1) + 1;

    setArmy({
      ...army,
      currentTurn: newTurn,
      units: army.units.map(u => {
        // Resolve panic at the start of new turn
        const unitWithoutPanic = resolvePanic(u, newTurn);

        if (u.type === 'squad') {
          return {
            ...unitWithoutPanic,
            actionsUsed: (u.data as Squad).soldiers.map(() => ({ moved: false, shot: false, melee: false, done: false }))
          };
        } else {
          return {
            ...unitWithoutPanic,
            isMachineMoved: false,
            isMachineShot: false,
            isMachineMelee: false,
            isMachineDone: false,
            machineShotsUsed: 0,
            machineWeaponShots: {}
          };
        }
      })
    });
    setShowInitiativeModal(false);
    setShowTurnConfirmation(false);
    setFocusedUnitIdx(0);
  };

  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as Squad).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  // Helper to check if unit is active (not done and not dead)
  const isUnitActive = useCallback((unit: ArmyUnit) => {
    const isSquad = unit.type === 'squad';
    const isDead = isSquad
      ? (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length
      : (unit.currentDurability || 0) === 0;
    const isDone = isSquad
      ? (unit.data as Squad).soldiers.every((_, idx) => unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done)
      : unit.isMachineDone;

    return !isDead && !isDone;
  }, []);

  // Get indices of active units only
  const activeUnitIndices = useCallback(() => {
    return army.units.map((u, idx) => isUnitActive(u) ? idx : -1).filter(idx => idx !== -1);
  }, [army.units, isUnitActive]);

  const nextUnit = useCallback(() => {
    const activeIndices = activeUnitIndices();
    if (activeIndices.length === 0) return;
    const currentIdx = activeIndices.indexOf(focusedUnitIdx);
    const nextIdx = currentIdx === -1 ? activeIndices[0] : activeIndices[(currentIdx + 1) % activeIndices.length];
    setFocusedUnitIdx(nextIdx);
  }, [focusedUnitIdx, activeUnitIndices]);

  const prevUnit = useCallback(() => {
    const activeIndices = activeUnitIndices();
    if (activeIndices.length === 0) return;
    const currentIdx = activeIndices.indexOf(focusedUnitIdx);
    const prevIdx = currentIdx === -1 ? activeIndices[0] : activeIndices[(currentIdx - 1 + activeIndices.length) % activeIndices.length];
    setFocusedUnitIdx(prevIdx);
  }, [focusedUnitIdx, activeUnitIndices]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevUnit();
      if (e.key === 'ArrowRight') nextUnit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextUnit, prevUnit]);

  // Dock expand/collapse gesture handlers
  const handleDockMouseDown = useCallback((e: React.MouseEvent) => {
    const startY = e.clientY;
    const handleMove = (moveEvent: MouseEvent) => {
      const currentY = moveEvent.clientY;
      const diff = startY - currentY; // Positive when swiping up
      const progress = Math.max(0, Math.min(1, diff / 200));
      setDockDragProgress(progress);
    };

    const handleEnd = () => {
      if (dockDragProgress > 0.5) {
        setIsDockExpanded(true);
      } else {
        setIsDockExpanded(false);
      }
      setDockDragProgress(0);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  }, [dockDragProgress]);

  const handleDockTouchStart = useCallback((e: React.TouchEvent) => {
    const startY = e.touches[0].clientY;
    const handleMove = (moveEvent: TouchEvent) => {
      const currentY = moveEvent.touches[0].clientY;
      const diff = startY - currentY; // Positive when swiping up
      const progress = Math.max(0, Math.min(1, diff / 200));
      setDockDragProgress(progress);
    };

    const handleEnd = () => {
      if (dockDragProgress > 0.5) {
        setIsDockExpanded(true);
      } else {
        setIsDockExpanded(false);
      }
      setDockDragProgress(0);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [dockDragProgress]);

  const toggleDockExpanded = useCallback(() => {
    setIsDockExpanded(prev => !prev);
  }, []);

  const factionColors = getFactionColors(army.faction);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" data-testid="game-session">
      {/* Initiative Modal */}
      <InitiativeModal
        isOpen={showInitiativeModal}
        onClose={() => setShowInitiativeModal(false)}
        onConfirm={startNewTurn}
        factionId={army.faction}
        activeUnitsCount={activeUnitsCount}
        context="turn"
      />

      {/* Turn Confirmation Modal */}
      {showTurnConfirmation && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className={cn(
            "relative border-2 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto",
            factionColors.border,
            factionColors.bg,
            factionColors.glow
          )}>
            {/* Corner accents */}
            <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionColors.accent)} />

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.primary)}>
                ЗАВЕРШИТЬ ТУР?
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
            </div>

            {/* Warning message */}
            <div className="bg-amber-950/30 border border-amber-700/50 rounded-lg p-3 md:p-4">
              <p className="text-sm md:text-base font-mono text-amber-300">
                Активных отрядов: <span className="font-black">{getIncompleteUnits().length}</span>
              </p>
            </div>

            {/* Incomplete units list */}
            <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 max-h-40 overflow-y-auto space-y-2">
              {getIncompleteUnits().map(unit => {
                const incompleteCount = unit.type === 'squad'
                  ? (unit.data as Squad).soldiers.filter((_, idx) => {
                      const isDead = unit.deadSoldiers?.includes(idx);
                      const isDone = unit.actionsUsed?.[idx]?.done;
                      return !isDead && !isDone;
                    }).length
                  : 1;

                return (
                  <div key={unit.instanceId} className="flex items-center justify-between text-xs md:text-sm font-mono">
                    <span className="text-slate-300 truncate flex-1 text-left">
                      {unit.instanceNumber ? `${unit.instanceNumber} — ` : ''}{unit.data.name}
                    </span>
                    <span className="text-amber-400 font-black ml-2">
                      {incompleteCount} {unit.type === 'squad' ? 'бойцов' : 'машина'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTurnConfirmation(false)}
                className={cn(
                  "flex-1 py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300"
                )}
              >
                ОТМЕНИТЬ
              </button>
              <button
                onClick={confirmStartNewTurn}
                className={cn(
                  "flex-[2] py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  factionColors.border,
                  factionColors.bg,
                  factionColors.primary,
                  "hover:scale-102 active:scale-95"
                )}
              >
                ЗАВЕРШИТЬ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-20 md:pb-24 min-h-0 custom-scrollbar">
        {army.units.length > 0 && (
          <div className={cn(
            "w-full bg-transparent p-0.5 md:p-1 mx-auto",
            army.units[focusedUnitIdx]?.type === 'machine' ? "max-w-5xl" : "max-w-2xl"
          )}>
            <UnitCard
              unit={army.units[focusedUnitIdx]}
              updateUnit={updateUnit}
              combatLog={combatLog}
              onCombatLogEntry={handleCombatLogEntry}
              allUnits={army.units}
              onPilotAssign={handlePilotAssign}
              onPilotRemove={handlePilotRemove}
              onNavigateToUnit={handleNavigateToUnit}
              strictPilotRankEnabled={strictPilotRankEnabled}
              distanceInputUnit={distanceInputUnit}
              stepToCmFactor={stepToCmFactor}
            />
          </div>
        )}
      </div>

      {/* Military Tech Unit Dock - Fixed at bottom with Tactical HUD styling */}
      {army.units.length > 0 && (
        <div
          className={cn(
            "fixed left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-700/50 transition-all duration-300 ease-out",
            isDockExpanded ? "top-20 bottom-0" : "bottom-0 h-auto"
          )}
          onMouseDown={handleDockMouseDown}
          onTouchStart={handleDockTouchStart}
        >
          {/* Expand/collapse handle indicator */}
          <div
            className="flex justify-center py-0 active:bg-slate-800/30 transition-colors"
            onClick={toggleDockExpanded}
          >
            {/* Minimal touch target */}
            <div className="w-5 h-3 flex items-center justify-center">
              <div className={cn(
                "w-5 h-px rounded-full transition-all duration-200",
                isDockExpanded ? "bg-slate-400" : factionColors.bgSolid.replace('bg-', 'bg-').replace('500', '400')
              )} />
            </div>
          </div>

          {/* Dock top decorative line with faction color */}
          <div className={cn(
            "h-0.5 w-full transition-all duration-300",
            !isDockExpanded && factionColors.bgSolid.replace('bg-', 'bg-').replace('500', '600/40')
          )} />

          {/* Dock tactical decorations */}
          <div className="absolute top-4 left-4 w-2 h-2 bg-slate-600/30 rounded-full animate-pulse" />
          <div className="absolute top-4 right-4 w-2 h-2 bg-slate-600/30 rounded-full animate-pulse" />

          {/* Content based on expanded state */}
          {isDockExpanded ? (
            /* Expanded view - grid of all units */
            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {army.units.map((unit, idx) => {
                  const dockStyles = getUnitDockStyles(army.faction);
                  const isActive = focusedUnitIdx === idx;
                  const isMachine = unit.type === 'machine';

                  // Calculate status
                  const isDone = (() => {
                    if (unit.type === 'squad') {
                      const data = unit.data as Squad;
                      return data.soldiers.every((_, soldierIdx) => {
                        const isDead = unit.deadSoldiers?.includes(soldierIdx);
                        const isActionDone = unit.actionsUsed?.[soldierIdx]?.done;
                        return isDead || isActionDone;
                      });
                    } else {
                      return unit.isMachineDone || unit.currentDurability === 0;
                    }
                  })();

                  const isDead = (() => {
                    if (unit.type === 'squad') {
                      return (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
                    } else {
                      return (unit.currentDurability || 0) === 0;
                    }
                  })();

                  return (
                    <UnitNavigationCard
                      key={unit.instanceId}
                      unit={unit}
                      isActive={isActive}
                      isDone={isDone}
                      isDead={isDead}
                      isMachine={isMachine}
                      onClick={() => { setFocusedUnitIdx(idx); setIsDockExpanded(false); }}
                      dockStyles={dockStyles}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            /* Compact view - horizontal scroll */
            <div className="relative">
              {/* Left fade indicator */}
              <div
                className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgb(2 6 23 / 0.95), transparent)' }}
              />

              {/* Right fade indicator */}
              <div
                className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgb(2 6 23 / 0.95), transparent)' }}
              />

              <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide items-center px-1.5 py-0.5">
            {(() => {
              // Sort and group units: active first, then done/dead
              const sortedUnits = army.units
              .map((unit, idx) => ({ unit, idx, originalIndex: idx }))
              .sort((a, b) => {
                const getStatus = (u: ArmyUnit) => {
                  if (u.type === 'squad') {
                    const isDead = (u.deadSoldiers?.length || 0) === (u.data as Squad).soldiers.length;
                    const isDone = (u.data as Squad).soldiers.every((_, idx) => {
                      return u.deadSoldiers?.includes(idx) || u.actionsUsed?.[idx]?.done;
                    });
                    if (isDead) return 2; // Dead - last
                    if (isDone) return 1;  // Done - middle
                    return 0;              // Active - first
                  } else {
                    if (u.currentDurability === 0) return 2; // Dead - last
                    if (u.isMachineDone) return 1;           // Done - middle
                    return 0;                                // Active - first
                  }
                };
                return getStatus(a.unit) - getStatus(b.unit) || a.originalIndex - b.originalIndex;
              });

            const elements: React.ReactNode[] = [];
            let lastStatus = -1;

            sortedUnits.forEach(({ unit, idx: originalIndex }, _arrayIndex) => {
              const dockStyles = getUnitDockStyles(army.faction);
              const isActive = focusedUnitIdx === originalIndex;
              const isMachine = unit.type === 'machine';

              // Calculate current unit status
              const currentStatus = (() => {
                if (unit.type === 'squad') {
                  const isDead = (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
                  const isDone = (unit.data as Squad).soldiers.every((_, idx) => {
                    return unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done;
                  });
                  if (isDead) return 2;
                  if (isDone) return 1;
                  return 0;
                } else {
                  if (unit.currentDurability === 0) return 2;
                  if (unit.isMachineDone) return 1;
                  return 0;
                }
              })();

              // Add spacer between active (0) and non-active (1, 2) units
              if (lastStatus === 0 && currentStatus > 0) {
                elements.push(
                  <div key="spacer" className="w-2 md:w-3 flex-shrink-0" />
                );
              }
              lastStatus = currentStatus;

              // Calculate if unit is done
              const isDone = (() => {
                if (unit.type === 'squad') {
                  const data = unit.data as Squad;
                  return data.soldiers.every((_, soldierIdx) => {
                    const isDead = unit.deadSoldiers?.includes(soldierIdx);
                    const isActionDone = unit.actionsUsed?.[soldierIdx]?.done;
                    return isDead || isActionDone;
                  });
                } else {
                  return unit.isMachineDone || unit.currentDurability === 0;
                }
              })();

              const isDead = (() => {
                if (unit.type === 'squad') {
                  return (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length;
                } else {
                  return (unit.currentDurability || 0) === 0;
                }
              })();

              elements.push(
                <UnitNavigationCard
                  key={unit.instanceId}
                  unit={unit}
                  isActive={isActive}
                  isDone={isDone}
                  isDead={isDead}
                  isMachine={isMachine}
                  onClick={() => setFocusedUnitIdx(originalIndex)}
                  dockStyles={dockStyles}
                />
              );
            });

            return elements;
          })()}
          </div>
        </div>
          )}
        </div>
      )}

      {/* Combat Log Modal - Full screen overlay */}
      {combatLogVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                История боя ({combatLog.length})
              </span>
            </div>
            <button
              onClick={() => setCombatLogVisible(false)}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            {combatLog.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                История пуста
              </div>
            ) : (
              <div className="space-y-2 max-w-2xl mx-auto">
                {combatLog.slice().reverse().map((entry) => (
                  <div key={entry.id} className="bg-slate-800/50 rounded-lg p-3 text-sm border border-slate-700/50">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-bold text-slate-200">{entry.result.unitName}</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs">
                      {entry.result.actionType === 'shot' && 'Выстрел'}
                      {entry.result.actionType === 'melee' && 'Ближний бой'}
                      {entry.result.actionType === 'grenade' && 'Граната'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
