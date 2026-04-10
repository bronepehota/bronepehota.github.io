'use client';

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { SoldierActions } from './soldier-card/SoldierActions';
import { SoldierStats } from './soldier-card/SoldierStats';
import { SoldierImage } from './soldier-card/SoldierImage';
import StatusStripe, { type SoldierState } from './soldier-card/StatusStripe';
import { cn } from '@/lib/utils';
import type { Squad, ArmyUnit, RulesVersionID } from '@/lib/types';
import { checkPanicTrigger } from '@/lib/panic-logic';
import { collectBuffsForUnit, getSoldierModifiers, resolveModifierSummary, isModifierActive } from '@/lib/modifier-utils';
import { getSourceWithCustom } from '@/lib/sources-registry';

interface SoldierCardProps {
  squad: Squad;
  unit: ArmyUnit;
  soldierIndex: number;
  allUnits: ArmyUnit[];
  rulesVersion: RulesVersionID;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  setShowPanicModal: (show: boolean) => void;
  getSoldierImage: (idx: number) => string;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  onNavigateToUnit?: (instanceId: string) => void;
  onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void;
  sourceId?: string;
  currentTurn?: number;
}

function SoldierCard({
  squad,
  unit,
  soldierIndex,
  allUnits: _allUnits,
  rulesVersion,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  setShowPanicModal,
  getSoldierImage,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  onNavigateToUnit,
  onSoldierModifierClick,
  sourceId,
  currentTurn,
}: SoldierCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressProgressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const soldier = squad.soldiers[soldierIndex];
  const isDead = unit.deadSoldiers?.includes(soldierIndex) || false;
  const actions = unit.actionsUsed?.[soldierIndex] || { moved: false, shot: false, melee: false, done: false };
  const isDone = actions.done;
  const isInPanic = unit.panicState?.some(p => p.soldierIndex === soldierIndex) || false;

  // Determine stripe state
  const getStripeState = (): SoldierState => {
    if (isDead) return 'dead';
    if (isInPanic) return 'panic';
    if (isDone) return 'done';
    return 'active';
  };

  const startLongPress = (callback: () => void) => {
    // Don't show progress bar immediately - wait 100ms first
    const progressDelay = 100;

    // Start the long-press timer (600ms for cancel)
    longPressTimerRef.current = setTimeout(() => {
      callback();
      setIsLongPressing(false);
      setLongPressProgress(1);
      if (longPressProgressRef.current) {
        clearInterval(longPressProgressRef.current);
      }
    }, 600);

    // Show progress bar only after 100ms of holding
    longPressProgressRef.current = setTimeout(() => {
      setIsLongPressing(true);
      setLongPressProgress(0);

      // Start progress animation
      let progress = progressDelay / 600; // Start at 100/600 = ~17%
      const progressInterval = setInterval(() => {
        progress += 0.05;
        if (progress >= 1) {
          progress = 1;
          clearInterval(progressInterval);
        }
        setLongPressProgress(progress);
      }, 30);

      // Store interval ID for cleanup
      (longPressProgressRef as any).interval = progressInterval;
    }, progressDelay);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressProgressRef.current) {
      clearTimeout(longPressProgressRef.current);
      if ((longPressProgressRef as any).interval) {
        clearInterval((longPressProgressRef as any).interval);
      }
      longPressProgressRef.current = null;
    }
    setIsLongPressing(false);
    setLongPressProgress(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (longPressProgressRef.current) clearInterval(longPressProgressRef.current);
    };
  }, []);

  const handleToggleAction = () => {
    // Use explicit instanceId to avoid updating all units
    updateUnit(unit.instanceId, (currentUnit: ArmyUnit) => {
      const newActions = [...(currentUnit.actionsUsed || [])];
      const currentDone = newActions[soldierIndex]?.done || false;

      if (currentDone) {
        // Untoggling "done" - reset all actions
        newActions[soldierIndex] = {
          moved: false,
          shot: false,
          melee: false,
          done: false
        };
      } else {
        newActions[soldierIndex] = {
          ...newActions[soldierIndex],
          done: true
        };
      }
      return { ...currentUnit, actionsUsed: newActions };
    });
  };

  const handleToggleDead = () => {
    // Store whether this is adding or removing a kill (before state changes)
    const dead = unit.deadSoldiers || [];
    const isAddingKill = !dead.includes(soldierIndex);

    // Use explicit instanceId to avoid updating all units
    updateUnit(unit.instanceId, (currentUnit: ArmyUnit) => {
      const currentDead = currentUnit.deadSoldiers || [];
      const newDead = currentDead.includes(soldierIndex)
        ? currentDead.filter(i => i !== soldierIndex)
        : [...currentDead, soldierIndex];

      const updatedUnit = { ...currentUnit, deadSoldiers: newDead };

      // Check panic trigger for community rules when adding a kill
      if (isAddingKill && rulesVersion === 'community_star_system') {
        const shouldTestPanic = checkPanicTrigger(updatedUnit, 'community_star_system', currentTurn);
        if (shouldTestPanic) {
          setShowPanicModal(true);
        }
      }

      return updatedUnit;
    });
  };

  // Check if this soldier is a pilot
  const isPilot = soldier.isPilot || false;

  // Compute modifier counts for the modifier indicator
  const { buffCount, debuffCount, soldierModifiers, availableBuffCount, statBonuses } = useMemo(() => {
    // Build a minimal army-like structure from allUnits for buff collection
    const armyLike = { name: '', totalCost: 0, units: _allUnits, currentTurn };
    // Count buffs across ALL phases (not just shot)
    const shotBuffs = collectBuffsForUnit(unit, armyLike as any, 'shot');
    const meleeBuffs = collectBuffsForUnit(unit, armyLike as any, 'melee');
    const alwaysBuffs = collectBuffsForUnit(unit, armyLike as any, 'always');
    const allBuffIds = new Set([...shotBuffs, ...meleeBuffs, ...alwaysBuffs].map(b => b.id));
    // Filter debuffs by expiry (includes unit-level debuffs + per-soldier debuffs from modal)
    const unitDebuffs = (unit.activeDebuffs || []).filter(d =>
      isModifierActive(d.appliedAtTurn, d.duration, currentTurn)
    );
    const soldierMods = getSoldierModifiers(unit, soldierIndex, armyLike as any);
    const soldierDebuffs = soldierMods.filter(m => m.value < 0);
    const debuffs = [...unitDebuffs, ...soldierDebuffs];
    // Resolve buffs: only squad-level (set via editor), no catalog fallback
    const sourceData = sourceId ? getSourceWithCustom(sourceId) : null;
    const liveSquad = sourceData?.squads.find(s => s.id === squad.id);
    const available = (liveSquad?.buffs || squad.buffs || [])
      .filter((b: any) => b.applyTo?.includes('soldier')).length;

    // Compute stat bonuses for display (merge shot + melee + always phases)
    const shotSummary = resolveModifierSummary(unit, armyLike as any, 'shot', soldierIndex);
    const meleeSummary = resolveModifierSummary(unit, armyLike as any, 'melee', soldierIndex);
    const alwaysSummary = resolveModifierSummary(unit, armyLike as any, 'always', soldierIndex);

    const statBonuses = {
      rangeBonus: shotSummary.rangeBonus,
      powerBonus: shotSummary.powerBonus,
      meleeBonus: meleeSummary.meleeBonus,
      armorBonus: alwaysSummary.armorBonus,
      speedMultiplier: alwaysSummary.speedMultiplier !== 1 ? alwaysSummary.speedMultiplier : undefined,
    };

    return { buffCount: allBuffIds.size, debuffCount: debuffs.length, soldierModifiers: soldierMods, availableBuffCount: available, statBonuses };
  }, [unit, _allUnits, soldierIndex, squad.buffs, squad.id, sourceId, currentTurn]);

  return (
    <div
      className={cn(
        "relative p-1 md:p-1.5 rounded-sm border flex items-center gap-1.5 md:gap-2 transition-all overflow-hidden",
        isDead ? "bg-slate-950/80 border-slate-800 opacity-40 grayscale" :
        isDone ? "bg-slate-900/40 border-slate-700/50 opacity-90" : "bg-slate-800/30 border-slate-700/50",
        isPilot && !isDead ? "border-cyan-700/40" : ""
      )}
    >
      {/* Status stripe */}
      <StatusStripe state={getStripeState()} />

      {/* Progress bar during long-press */}
      {isLongPressing && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800 z-20">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-75"
            style={{ width: `${longPressProgress * 100}%` }}
          />
        </div>
      )}

      {/* Tech corners for pilot */}
      {isPilot && !isDead && (
        <>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/40" aria-hidden="true" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/40" aria-hidden="true" />
        </>
      )}

      {/* Soldier image (left side) */}
      <SoldierImage
        imageUrl={getSoldierImage(soldierIndex)}
        soldierIndex={soldierIndex}
        isDead={isDead}
        isDone={isDone}
        isInPanic={isInPanic}
        isMounted={isMounted}
        isPilot={isPilot}
        onImageClick={() => setShowSoldierImage(soldierIndex)}
      />

      {/* Stats (center - clickable for action) */}
      <SoldierStats
        soldier={soldier}
        distanceInputUnit={distanceInputUnit}
        stepToCmFactor={stepToCmFactor}
        disabled={isDone || isDead || isInPanic}
        onClick={() => onSoldierAction(soldierIndex)}
        className="flex-1"
        buffCount={buffCount}
        debuffCount={debuffCount}
        soldierModifiers={soldierModifiers}
        availableBuffCount={availableBuffCount}
        onModifierClick={onSoldierModifierClick ? () => onSoldierModifierClick(unit.instanceId, soldierIndex, `#${soldier.num || soldierIndex + 1}`) : undefined}
        statBonuses={statBonuses}
      />

      {/* Action buttons (right - stacked vertically) */}
      <SoldierActions
        isDead={isDead}
        isDone={isDone}
        isInPanic={isInPanic}
        actions={actions}
        onActionClick={() => onSoldierAction(soldierIndex)}
        onToggleDone={handleToggleAction}
        onToggleDead={handleToggleDead}
        soldierIndex={soldierIndex}
        onStartLongPress={startLongPress}
        onEndLongPress={cancelLongPress}
        isLongPressing={isLongPressing}
        isPilot={soldier.isPilot || false}
        onNavigateToMachine={soldier.pilotOfInstanceId ? () => onNavigateToUnit?.(soldier.pilotOfInstanceId!) : undefined}
      />
    </div>
  );
}

// Memoize SoldierCard to prevent unnecessary re-renders
// Custom comparison checks soldier-specific state to avoid re-rendering all cards when any soldier updates
export default memo(SoldierCard, (prevProps, nextProps) => {
  const prevIsDead = prevProps.unit.deadSoldiers?.includes(prevProps.soldierIndex) || false;
  const nextIsDead = nextProps.unit.deadSoldiers?.includes(nextProps.soldierIndex) || false;
  const prevIsDone = prevProps.unit.actionsUsed?.[prevProps.soldierIndex]?.done || false;
  const nextIsDone = nextProps.unit.actionsUsed?.[nextProps.soldierIndex]?.done || false;
  const prevIsInPanic = prevProps.unit.panicState?.some(p => p.soldierIndex === prevProps.soldierIndex) || false;
  const nextIsInPanic = nextProps.unit.panicState?.some(p => p.soldierIndex === nextProps.soldierIndex) || false;

  return (
    prevProps.soldierIndex === nextProps.soldierIndex &&
    prevProps.squad === nextProps.squad &&
    prevProps.allUnits === nextProps.allUnits &&
    prevIsDead === nextIsDead &&
    prevIsDone === nextIsDone &&
    prevIsInPanic === nextIsInPanic &&
    prevProps.unit.activeDebuffs === nextProps.unit.activeDebuffs &&
    prevProps.unit.activeBuffs === nextProps.unit.activeBuffs &&
    prevProps.unit.soldierModifiers === nextProps.unit.soldierModifiers &&
    prevProps.onNavigateToUnit === nextProps.onNavigateToUnit &&
    prevProps.onSoldierModifierClick === nextProps.onSoldierModifierClick &&
    prevProps.currentTurn === nextProps.currentTurn
  );
});
