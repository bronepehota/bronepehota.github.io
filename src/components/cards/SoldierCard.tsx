'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { SoldierActions } from './soldier-card/SoldierActions';
import { SoldierStats } from './soldier-card/SoldierStats';
import { SoldierImage } from './soldier-card/SoldierImage';
import StatusStripe, { type SoldierState } from './soldier-card/StatusStripe';
import { cn } from '@/lib/utils';
import type { Squad, ArmyUnit, RulesVersionID } from '@/lib/types';
import { checkPanicTrigger } from '@/lib/panic-logic';

interface SoldierCardProps {
  squad: Squad;
  unit: ArmyUnit;
  soldierIndex: number;
  allUnits: ArmyUnit[];
  rulesVersion: RulesVersionID;
  updateUnit: (unit: ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  setShowPanicModal: (show: boolean) => void;
  getSoldierImage: (idx: number) => string;
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
    const newActions = [...(unit.actionsUsed || [])];
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
    updateUnit({ ...unit, actionsUsed: newActions });
  };

  const handleToggleDead = () => {
    const dead = unit.deadSoldiers || [];
    const newDead = dead.includes(soldierIndex)
      ? dead.filter(i => i !== soldierIndex)
      : [...dead, soldierIndex];

    const updatedUnit = { ...unit, deadSoldiers: newDead };

    // Check panic trigger for community rules
    if (rulesVersion === 'community_star_system' && newDead.length > 0 && !dead.includes(soldierIndex)) {
      const currentTurn = 1;
      const shouldTestPanic = checkPanicTrigger(updatedUnit, 'community_star_system', currentTurn);
      if (shouldTestPanic) {
        setShowPanicModal(true);
      }
    }

    updateUnit(updatedUnit);
  };

  // Check if this soldier is a pilot
  const isPilot = soldier.isPilot || false;

  return (
    <div
      className={cn(
        "relative p-1 md:p-1.5 rounded-sm border flex gap-1.5 md:gap-2 transition-all overflow-hidden",
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

      {/* Soldier image (right side) */}
      <SoldierImage
        imageUrl={getSoldierImage(soldierIndex)}
        soldierIndex={soldierIndex}
        isDead={isDead}
        isDone={isDone}
        isInPanic={isInPanic}
        isMounted={isMounted}
        onImageClick={() => setShowSoldierImage(soldierIndex)}
      />

      {/* Left side: actions and stats */}
      <div className="flex-1 flex flex-col justify-between min-w-0 gap-1.5 md:gap-2">
        {/* Row 1: Action buttons */}
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
        />

        {/* Row 2: Stats */}
        <SoldierStats soldier={soldier} />
      </div>
    </div>
  );
}

// Memoize SoldierCard to prevent unnecessary re-renders
// Custom comparison checks: soldierIndex, unit (for isDead/isDone), squad (for soldier data)
export default memo(SoldierCard, (prevProps, nextProps) => {
  return (
    prevProps.soldierIndex === nextProps.soldierIndex &&
    prevProps.unit === nextProps.unit &&
    prevProps.squad === nextProps.squad
  );
});
