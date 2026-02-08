'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Army, ArmyUnit, Squad, PilotInfo } from '@/lib/types';
import UnitCard from './UnitCard';
import { Heart, UserX, History, User, Bot, X, Check } from 'lucide-react';
import { rollDie } from '@/lib/game-logic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CombatLogEntry } from '@/lib/combat-types';
import { useCombatTargetContext } from '@/contexts/CombatTargetContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Faction color system for battle interface
const getFactionColors = (factionId: string) => {
  const colorMap = {
    polaris: {
      primary: 'text-red-400',
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      glow: 'shadow-red-500/20',
      accent: 'border-red-500',
      progress: 'bg-red-500'
    },
    protectorate: {
      primary: 'text-cyan-400',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
      glow: 'shadow-cyan-500/20',
      accent: 'border-cyan-500',
      progress: 'bg-cyan-500'
    },
    mercenaries: {
      primary: 'text-yellow-400',
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      glow: 'shadow-yellow-500/20',
      accent: 'border-yellow-500',
      progress: 'bg-yellow-500'
    }
  };
  return colorMap[factionId as keyof typeof colorMap] || colorMap.polaris;
};

// Faction styles for unit dock navigation
const getUnitDockStyles = (factionId: string) => {
  const styleMap = {
    polaris: {
      primary: 'border-red-400',
      primaryBg: 'bg-red-400',
      muted: 'border-red-700/60',
      mutedBg: 'bg-red-700/60',
      text: 'text-red-400',
      activeGlow: 'shadow-red-500/30',
      accent: 'border-red-400'
    },
    protectorate: {
      primary: 'border-cyan-400',
      primaryBg: 'bg-cyan-400',
      muted: 'border-cyan-700/60',
      mutedBg: 'bg-cyan-700/60',
      text: 'text-cyan-400',
      activeGlow: 'shadow-cyan-500/30',
      accent: 'border-cyan-400'
    },
    mercenaries: {
      primary: 'border-yellow-400',
      primaryBg: 'bg-yellow-400',
      muted: 'border-yellow-700/60',
      mutedBg: 'bg-yellow-700/60',
      text: 'text-yellow-400',
      activeGlow: 'shadow-yellow-500/30',
      accent: 'border-yellow-400'
    }
  };
  return styleMap[factionId as keyof typeof styleMap] || styleMap.polaris;
};

// Get unit status bar classes based on state and faction
const getUnitStatusBarClasses = (unit: ArmyUnit, dockStyles: ReturnType<typeof getUnitDockStyles>) => {
  const { isDead, isDone } = (() => {
    const isSquad = unit.type === 'squad';
    const isDead = isSquad
      ? (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length
      : (unit.currentDurability || 0) === 0;
    const isDone = isSquad
      ? (unit.data as Squad).soldiers.every((_, idx) => unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done)
      : unit.isMachineDone;
    return { isDead, isDone };
  })();

  if (isDead) return 'bg-red-600 border-red-600';
  if (isDone) return `${dockStyles.mutedBg} ${dockStyles.muted}`;
  return `${dockStyles.primaryBg} ${dockStyles.primary}`;
};

// Get shortened unit name (2-3 letters)
const getShortUnitName = (unit: ArmyUnit): string => {
  const name = unit.data.name || '';
  const fallback = unit.type === 'squad' ? 'ОТР' : 'МАШ';
  return name.substring(0, 3).toUpperCase() || fallback;
};

interface GameSessionProps {
  army: Army;
  setArmy: (army: Army) => void;
  isInBattle?: boolean;
  onEndBattle?: () => void;
  onInitiativeTriggerRef?: (trigger: () => void) => void;
  showCombatLog?: boolean;
  setShowCombatLog?: (show: boolean) => void;
}

export default function GameSession({ army, setArmy, onInitiativeTriggerRef, showCombatLog, setShowCombatLog }: GameSessionProps) {
  const [showInitiative, setShowInitiative] = useState(false);
  const [showTurnConfirmation, setShowTurnConfirmation] = useState(false);
  const [initRoll, setInitRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [focusedUnitIdx, setFocusedUnitIdx] = useState(0);
  const { resetTargetMemory } = useCombatTargetContext();

  const calculateInitiative = useCallback(() => {
    setShowInitiative(true);
    setIsRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setInitRoll(rollDie(6));
      count++;
      if (count > 10) {
        clearInterval(interval);
        const final = rollDie(6);
        setInitRoll(final);
        setIsRolling(false);
      }
    }, 50);
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

  const updateUnit = (updatedUnit: ArmyUnit) => {
    setArmy({
      ...army,
      units: army.units.map(u => u.instanceId === updatedUnit.instanceId ? updatedUnit : u)
    });
  };

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
    resetTargetMemory();

    setArmy({
      ...army,
      currentTurn: (army.currentTurn || 1) + 1,
      units: army.units.map(u => {
        if (u.type === 'squad') {
          return {
            ...u,
            actionsUsed: (u.data as Squad).soldiers.map(() => ({ moved: false, shot: false, melee: false, done: false }))
          };
        } else {
          return {
            ...u,
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
    setShowInitiative(false);
    setShowTurnConfirmation(false);
    setFocusedUnitIdx(0);
  };

  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as Squad).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  // Helper to get unit status for summary
  const getUnitStatus = (unit: ArmyUnit) => {
    const isSquad = unit.type === 'squad';
    const isDead = isSquad
      ? (unit.deadSoldiers?.length || 0) === (unit.data as Squad).soldiers.length
      : (unit.currentDurability || 0) === 0;
    const isDone = isSquad
      ? (unit.data as Squad).soldiers.every((_, idx) => unit.deadSoldiers?.includes(idx) || unit.actionsUsed?.[idx]?.done)
      : unit.isMachineDone;

    return { isDead, isDone };
  };

  // Helper to check if unit is active (not done and not dead)
  const isUnitActive = useCallback((unit: ArmyUnit) => {
    const status = getUnitStatus(unit);
    return !status.isDead && !status.isDone;
  }, [getUnitStatus]);

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

  const factionColors = getFactionColors(army.faction);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden" data-testid="game-session">

      {/* Initiative Modal */}
      {showInitiative && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300" data-testid="initiative-modal">
          <div className={cn(
            "relative border-2 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto max-h-[90vh] overflow-hidden",
            factionColors.border,
            factionColors.bg,
            factionColors.glow
          )}>
            {/* Corner accents */}
            <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2", factionColors.accent)} />
            <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2", factionColors.accent)} />

            {/* Header with close button */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.primary)}>
                ИНИЦИАТИВА
              </h3>
              <button
                onClick={() => setShowInitiative(false)}
                className="p-1 hover:bg-slate-800/50 rounded-sm transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Закрыть"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Dice display */}
            <div className="flex justify-center">
              <div className={cn(
                "relative w-20 h-20 md:w-28 md:h-28 bg-slate-900/80 rounded-2xl md:rounded-3xl border-4 flex items-center justify-center text-4xl md:text-6xl font-mono font-black shadow-2xl transition-all",
                factionColors.border,
                isRolling ? "scale-110 rotate-12" : "scale-100 rotate-0",
                factionColors.primary
              )}>
                {initRoll}
                {/* Corner accents on dice */}
                <div className={cn("absolute top-1 left-1 w-2 h-2 border-l border-t opacity-50", factionColors.accent)} />
                <div className={cn("absolute bottom-1 right-1 w-2 h-2 border-r border-b opacity-50", factionColors.accent)} />
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center text-xs md:text-sm font-mono">
                <span className="uppercase tracking-wider text-slate-500">БОЕСПОСОБНЫХ:</span>
                <span className={cn("font-black text-base md:text-lg", factionColors.primary)}>{activeUnitsCount}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Reroll button */}
              <button
                onClick={calculateInitiative}
                disabled={isRolling}
                className={cn(
                  "flex-1 py-3 md:py-4 font-mono text-sm md:text-base font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300",
                  "disabled:opacity-50"
                )}
              >
                ПЕРЕБРОС
              </button>

              {/* Start turn button */}
              <button
                onClick={startNewTurn}
                data-testid="start-turn-button"
                disabled={isRolling}
                className={cn(
                  "flex-[2] py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
                  factionColors.border,
                  factionColors.bg,
                  factionColors.primary,
                  "hover:scale-102 active:scale-95 disabled:opacity-50"
                )}
              >
                НАЧАТЬ ТУР
              </button>
            </div>
          </div>
        </div>
      )}

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
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-32 custom-scrollbar">
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
            />
          </div>
        )}
      </div>

      {/* Military Tech Unit Dock - Unified Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 shrink-0">
        <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide items-center">
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

            sortedUnits.forEach(({ unit, idx: originalIndex }, arrayIndex) => {
              const dockStyles = getUnitDockStyles(army.faction);
              const isActive = focusedUnitIdx === originalIndex;
              const statusBarClasses = getUnitStatusBarClasses(unit, dockStyles);
              const isMachine = unit.type === 'machine';
              const shortName = getShortUnitName(unit);

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
                <button
                  key={unit.instanceId}
                  data-testid={`unit-nav-${unit.instanceId}`}
                  onClick={() => setFocusedUnitIdx(originalIndex)}
                  className={cn(
                    "relative shrink-0 snap-start rounded-sm border-2 transition-all overflow-hidden",
                    "hover:bg-slate-700/40 active:scale-95",
                    // Responsive sizing: mobile 40px/48px, desktop 52px/60px
                    "h-10 w-[48px] md:h-[52px] md:w-[60px]",
                    isActive
                      ? cn("bg-slate-700/50 scale-105 shadow-lg", dockStyles.activeGlow, dockStyles.primary)
                      : "bg-slate-800/30 border-slate-700/50 opacity-70 hover:opacity-100"
                  )}
                >
                  {/* Background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 to-transparent pointer-events-none" />

                  {/* Type-specific corner accent */}
                  <div className={cn(
                    "absolute w-3 h-3 transition-all",
                    isMachine ? "top-0 right-0" : "top-0 left-0",
                    isMachine
                      ? cn("border-r-2 border-b-2 opacity-40", dockStyles.accent || dockStyles.primary)
                      : cn("border-l-2 border-b-2 opacity-30", dockStyles.muted)
                  )} />

                  {/* Tech corner brackets for active unit */}
                  {isActive && (
                    <>
                      <div className={cn("absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 z-10", dockStyles.primary)} />
                      <div className={cn("absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 z-10", dockStyles.primary)} />
                      <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 z-10", dockStyles.primary)} />
                      <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 z-10", dockStyles.primary)} />
                    </>
                  )}

                  {/* Content - monospace typography for military feel */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-1">
                    {/* Type icon indicator */}
                    <div className={cn(
                      "opacity-70",
                      isMachine ? "text-cyan-300/80" : "text-emerald-300/70"
                    )}>
                      {isMachine ? (
                        <Bot className="w-4 h-4" strokeWidth={2} />
                      ) : (
                        <User className="w-4 h-4" strokeWidth={2} />
                      )}
                    </div>

                    {/* Shortened name */}
                    <span className="font-mono text-[10px] font-bold text-slate-300 tracking-wide">{shortName}</span>
                  </div>

                  {/* Done status badge - checkmark in corner */}
                  {isDone && !isDead && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5
                                 bg-emerald-500 rounded-full
                                 border-2 border-slate-900
                                 flex items-center justify-center z-30
                                 shadow-lg shadow-emerald-500/50">
                      <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3.5} />
                    </div>
                  )}

                  {/* Dead status badge - X icon in corner */}
                  {isDead && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5
                                 bg-red-600 rounded-full
                                 border-2 border-slate-900
                                 flex items-center justify-center z-30
                                 shadow-lg shadow-red-600/50">
                      <X className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3.5} />
                    </div>
                  )}

                  {/* Status bar at bottom - enhanced with h-2 and emerald for done units */}
                  <div className={cn("absolute bottom-0 left-0 right-0 h-2 border-t-2 z-20",
                    isDone && "bg-emerald-500",
                    statusBarClasses)} />
                </button>
              );
            });

            return elements;
          })()}
        </div>
      </div>

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
