'use client';

import { useState, useEffect, useCallback } from 'react';
import { Army, ArmyUnit, Squad, PilotInfo } from '@/lib/types';
import UnitCard from './UnitCard';
import { RotateCcw, ChevronRight, Heart, UserX, History, User, Bot } from 'lucide-react';
import { rollDie } from '@/lib/game-logic';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CombatLogEntry } from '@/lib/combat-types';
import TechGridBackground from './machine/TechGridBackground';

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
}

export default function GameSession({ army, setArmy }: GameSessionProps) {
  const [showInitiative, setShowInitiative] = useState(false);
  const [initRoll, setInitRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [focusedUnitIdx, setFocusedUnitIdx] = useState(0);
  const [showCombatLog, setShowCombatLog] = useState(false);

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

  const calculateInitiative = () => {
    setIsRolling(true);
    setShowInitiative(true);

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
  };

  const startNewTurn = () => {
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
    setFocusedUnitIdx(0);
  };

  const activeUnitsCount = army.units.filter(unit => {
    if (unit.type === 'squad') {
      return (unit.deadSoldiers?.length || 0) < (unit.data as Squad).soldiers.length;
    }
    return (unit.currentDurability || 0) > 0;
  }).length;

  const nextUnit = useCallback(() => setFocusedUnitIdx((prev) => (prev + 1) % army.units.length), [army.units.length]);
  const prevUnit = useCallback(() => setFocusedUnitIdx((prev) => (prev - 1 + army.units.length) % army.units.length), [army.units.length]);

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
      {/* Tech grid background */}
      <TechGridBackground />

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

            {/* Header with gradient divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <h3 className={cn("text-lg md:text-xl font-mono font-bold tracking-wider", factionColors.primary)}>
                ИНИЦИАТИВА
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
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

            {/* Start turn button */}
            <button
              onClick={startNewTurn}
              data-testid="start-turn-button"
              disabled={isRolling}
              className={cn(
                "w-full py-3 md:py-4 font-mono text-sm md:text-lg font-bold uppercase tracking-wider border transition-all min-h-[52px] md:min-h-[56px]",
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
      )}

      {/* Military Tech Unit Dock - Unified Navigation */}
      <div className="bg-slate-900/95 border-b border-slate-700/50 shrink-0">
        <div className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide">
          {/* Turn Counter - New Turn Button */}
          <button
            onClick={calculateInitiative}
            data-testid="new-turn-button"
            className={cn(
              "relative shrink-0 snap-start rounded-sm border-2 transition-all overflow-hidden",
              "hover:scale-105 active:scale-95 flex flex-col items-center justify-center",
              "h-12 w-[60px] md:h-[52px] md:w-[70px]",
              "bg-slate-800/50 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50"
            )}
            title="Новый тур"
          >
            <div className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-wider">ТУР</div>
            <div className={cn("text-lg md:text-xl font-mono font-black", factionColors.primary)}>{army.currentTurn || 1}</div>
            <RotateCcw className={cn("absolute top-1 right-1 w-3 h-3 opacity-20", factionColors.primary)} />
          </button>
          {army.units.map((unit, idx) => {
            const dockStyles = getUnitDockStyles(army.faction);
            const isActive = focusedUnitIdx === idx;
            const statusBarClasses = getUnitStatusBarClasses(unit, dockStyles);
            const isMachine = unit.type === 'machine';
            const shortName = getShortUnitName(unit);

            return (
              <button
                key={unit.instanceId}
                data-testid={`unit-nav-${unit.instanceId}`}
                onClick={() => setFocusedUnitIdx(idx)}
                className={cn(
                  "relative shrink-0 snap-start rounded-sm border-2 transition-all overflow-hidden",
                  "hover:bg-slate-700/40 active:scale-95",
                  // Responsive sizing: mobile 48px/52px, desktop 52px/60px
                  "h-12 w-[52px] md:h-[52px] md:w-[60px]",
                  isActive
                    ? cn("bg-slate-700/50 scale-105 shadow-lg", dockStyles.activeGlow, dockStyles.primary)
                    : "bg-slate-800/30 border-slate-700/50 opacity-70 hover:opacity-100"
                )}
              >
                {/* Background pattern: tech grid for machines, solid for squads */}
                {isMachine ? (
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id={`grid-${unit.instanceId}`} width="8" height="8" patternUnits="userSpaceOnUse">
                          <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill={`url(#grid-${unit.instanceId})`} />
                    </svg>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700/5 to-transparent pointer-events-none" />
                )}

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

                {/* Status bar at bottom */}
                <div className={cn("absolute bottom-0 left-0 right-0 h-1.5 border-t-2 z-20", statusBarClasses)} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-24 custom-scrollbar">
        {army.units.length > 0 && (
          <div className={cn(
            "w-full bg-slate-900/50 rounded-2xl border border-slate-800/50 shadow-xl p-2 md:p-3 mx-auto",
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

      {/* Status Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800/50 shadow-xl z-40">
        {!showCombatLog ? (
          <div className="flex items-center justify-center gap-2 md:gap-4 px-2 md:px-3 py-2 text-[10px] md:text-xs uppercase font-bold tracking-wider">
            <span className="text-blue-400 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              <span className="hidden sm:inline">Активен</span>
              <span>{army.units.filter(u => !getUnitStatus(u).isDead && !getUnitStatus(u).isDone).length}</span>
            </span>
            <span className="text-red-400 flex items-center gap-1">
              <UserX className="w-3 h-3" />
              <span className="hidden sm:inline">Потерян</span>
              <span>{army.units.filter(u => getUnitStatus(u).isDead).length}</span>
            </span>
            <div className="w-px h-4 bg-slate-700 hidden sm:block" />
            <button
              onClick={() => setShowCombatLog(true)}
              data-testid="combat-log-toggle-button"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <History className="w-3 h-3" />
              <span className="hidden sm:inline">История</span>
              <span>({combatLog.length})</span>
            </button>
          </div>
        ) : (
          <div className="max-h-[40vh] flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  История боя ({combatLog.length})
                </span>
              </div>
              <button
                onClick={() => setShowCombatLog(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {combatLog.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">
                  История пуста
                </div>
              ) : (
                <div className="space-y-1">
                  {combatLog.slice().reverse().map((entry) => (
                    <div key={entry.id} className="bg-slate-800/50 rounded-lg p-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-300">{entry.result.unitName}</span>
                        <span className="text-slate-500">
                          {new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-1">
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
    </div>
  );
}
