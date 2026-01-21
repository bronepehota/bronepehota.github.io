'use client';

import { useState, useEffect, useCallback } from 'react';
import { Army, ArmyUnit, Squad, Machine } from '@/lib/types';
import UnitCard from './UnitCard';
import { RotateCcw, ChevronLeft, ChevronRight, Heart, UserX, History } from 'lucide-react';
import { rollDie } from '@/lib/game-logic';
import { formatUnitNumber } from '@/lib/unit-utils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CombatLogEntry } from '@/lib/combat-types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Initiative Modal */}
      {showInitiative && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-2 md:p-4 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="glass-strong border-2 border-blue-500/20 rounded-2xl md:rounded-3xl p-4 md:p-6 lg:p-8 max-w-sm w-full shadow-2xl text-center space-y-4 md:space-y-6 animate-in zoom-in duration-300 mx-auto max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tighter text-blue-400 leading-tight">Бросок Инициативы</h3>
            <div className="flex justify-center">
              <div className={cn(
                "w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl md:rounded-3xl border-4 border-blue-500/50 flex items-center justify-center text-4xl md:text-6xl font-black shadow-2xl transition-all",
                isRolling ? "scale-110 rotate-12 shadow-blue-500/30" : "scale-100 rotate-0"
              )}>
                {initRoll}
              </div>
            </div>
            <div className="bg-slate-900/50 p-3 md:p-4 rounded-xl border border-slate-700/50 space-y-2">
              <div className="flex justify-between items-center text-xs md:text-sm">
                <span className="opacity-50 uppercase font-bold tracking-wider text-left">Боеспособных:</span>
                <span className="text-blue-400 font-black text-base md:text-lg">{activeUnitsCount}</span>
              </div>
            </div>
            <button onClick={startNewTurn} disabled={isRolling} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 py-3 md:py-4 rounded-xl font-bold text-sm md:text-lg shadow-lg shadow-blue-900/50 transition-all active:scale-95">
              НАЧАТЬ ТУР
            </button>
          </div>
        </div>
      )}

      {/* Unit Navigation Header */}
      <div className="bg-slate-900/90 border-b border-slate-800/50 shrink-0">
        {/* Desktop Navigation with Arrows */}
        <div className="hidden md:flex items-center gap-3 px-4 py-3">
          <button
            onClick={prevUnit}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
            title="Предыдущий (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex gap-2 overflow-x-auto overflow-y-hidden min-h-[52px] items-center justify-center">
            {army.units.map((unit, idx) => {
              const { isDead, isDone } = getUnitStatus(unit);
              const isActive = focusedUnitIdx === idx;

              // Calculate health for display
              let currentHealth = 0;
              let maxHealth = 0;
              if (unit.type === 'squad') {
                maxHealth = (unit.data as Squad).soldiers.length;
                currentHealth = maxHealth - (unit.deadSoldiers?.length || 0);
              } else {
                maxHealth = (unit.data as Machine).durability_max;
                currentHealth = unit.currentDurability || 0;
              }

              // Short name (first 2-3 letters)
              const shortName = (unit.data.name || '').substring(0, 3).toUpperCase();

              return (
                <button
                  key={unit.instanceId}
                  onClick={() => setFocusedUnitIdx(idx)}
                  className={cn(
                    "shrink-0 rounded-xl border transition-all relative overflow-hidden",
                    "min-w-[80px] w-20 h-14",
                    isActive
                      ? "border-blue-500 bg-blue-900/40 scale-105 shadow-lg shadow-blue-900/30"
                      : "border-slate-700/50 bg-slate-800/50 opacity-70 hover:opacity-100",
                    isDead ? "border-red-900/50 bg-red-950/30" : "",
                    isDone && !isDead ? "border-green-900/50 bg-green-950/40" : ""
                  )}
                >
                  {/* Background health bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-900/50">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(5, (currentHealth / maxHealth) * 100)}%`,
                        backgroundColor: isDead ? '#ef4444' : isDone ? '#22c55e' : '#3b82f6'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-1 gap-0.5">
                    {/* Unit number - hidden on mobile */}
                    <div className="text-sm font-black leading-none text-slate-200 hidden md:block">
                      {formatUnitNumber(unit, idx)}
                    </div>

                    {/* Name or icon */}
                    <div className="text-[10px] font-bold text-slate-400 leading-tight truncate max-w-full">
                      {shortName || (unit.type === 'squad' ? 'ОТР' : 'МАШ')}
                    </div>

                    {/* Health badge */}
                    <div className={cn(
                      "text-[9px] font-black px-1 rounded",
                      isDead ? "bg-red-900/50 text-red-300" :
                      isDone ? "bg-green-900/50 text-green-300" :
                      "bg-blue-900/50 text-blue-300"
                    )}>
                      {currentHealth}/{maxHealth}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full border-2 border-slate-900",
                    isDead ? "bg-red-500" : isDone ? "bg-green-500" : "bg-blue-500"
                  )} />
                </button>
              );
            })}
          </div>

          <button
            onClick={nextUnit}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-300 active:scale-90 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center border border-slate-700/50"
            title="Следующий (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden px-2 pb-3">
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden min-h-[56px] items-center snap-x">
            {army.units.map((unit, idx) => {
              const { isDead, isDone } = getUnitStatus(unit);
              const isActive = focusedUnitIdx === idx;

              let currentHealth = 0;
              let maxHealth = 0;
              if (unit.type === 'squad') {
                maxHealth = (unit.data as Squad).soldiers.length;
                currentHealth = maxHealth - (unit.deadSoldiers?.length || 0);
              } else {
                maxHealth = (unit.data as Machine).durability_max;
                currentHealth = unit.currentDurability || 0;
              }

              const shortName = (unit.data.name || '').substring(0, 2).toUpperCase();

              return (
                <button
                  key={unit.instanceId}
                  onClick={() => setFocusedUnitIdx(idx)}
                  className={cn(
                    "shrink-0 snap-start rounded-xl border transition-all relative overflow-hidden",
                    "w-16 h-14 min-w-[64px]",
                    isActive
                      ? "border-blue-500 bg-blue-900/40 scale-105 shadow-lg shadow-blue-900/30"
                      : "border-slate-700/50 bg-slate-800/50 opacity-70 hover:opacity-100",
                    isDead ? "border-red-900/50 bg-red-950/30" : "",
                    isDone && !isDead ? "border-green-900/50 bg-green-950/40" : ""
                  )}
                >
                  {/* Background health bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900/50">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${Math.max(5, (currentHealth / maxHealth) * 100)}%`,
                        backgroundColor: isDead ? '#ef4444' : isDone ? '#22c55e' : '#3b82f6'
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-1 gap-0.5">
                    {/* Unit number - hidden on mobile */}
                    <div className="text-sm font-black leading-none text-slate-200 hidden md:block">
                      {formatUnitNumber(unit, idx)}
                    </div>

                    <div className="text-[9px] font-bold text-slate-400 leading-tight">
                      {shortName || (unit.type === 'squad' ? 'ОТР' : 'М')}
                    </div>

                    <div className={cn(
                      "text-[8px] font-black px-1 rounded min-w-[20px] text-center",
                      isDead ? "bg-red-900/50 text-red-300" :
                      isDone ? "bg-green-900/50 text-green-300" :
                      "bg-blue-900/50 text-blue-300"
                    )}>
                      {currentHealth}/{maxHealth}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className={cn(
                    "absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-slate-900",
                    isDead ? "bg-red-500" : isDone ? "bg-green-500" : "bg-blue-500"
                  )} />
                </button>
              );
            })}
          </div>
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

      {/* New Turn FAB - Floating Action Button */}
      <button
        onClick={calculateInitiative}
        className="fixed bottom-20 right-3 z-50 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-900/50 rounded-2xl px-4 py-3 flex items-center gap-2 transition-all active:scale-95 min-h-[52px]"
      >
        <RotateCcw className="w-5 h-5" />
        <span className="text-sm font-black uppercase">Новый Тур</span>
      </button>
    </div>
  );
}
