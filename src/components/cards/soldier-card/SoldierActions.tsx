'use client';

import { useState } from 'react';
import { Skull, Footprints, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SoldierActionState {
  moved: boolean;
  shot: boolean;
  melee: boolean;
  done: boolean;
}

interface SoldierActionsProps {
  isDead: boolean;
  isDone: boolean;
  isInPanic: boolean;
  actions: SoldierActionState;
  onActionClick: () => void;
  onToggleDead: () => void;
  soldierIndex: number;
  onStartLongPress: (callback: () => void) => void;
  onEndLongPress: () => void;
  isLongPressing: boolean;
  isPilot?: boolean;
  onNavigateToMachine?: () => void;
}

/**
 * Right-edge action column. The «Готов» (done) button no longer lives here —
 * it moved onto the soldier image (SoldierDoneButton); this column holds the
 * kill button (and, in special states, the pilot nav / panic indicator).
 */
export function SoldierActions({
  isDead,
  isInPanic,
  onToggleDead,
  onStartLongPress,
  onEndLongPress,
  isLongPressing,
  soldierIndex,
  isPilot = false,
  onNavigateToMachine,
}: SoldierActionsProps) {
  const [wasLongPressTriggered, setWasLongPressTriggered] = useState(false);

  const handleDeadMouseDown = () => {
    setWasLongPressTriggered(false);
    if (isDead) {
      onStartLongPress(() => {
        setWasLongPressTriggered(true);
        onToggleDead();
      });
    }
  };

  const handleDeadClick = () => {
    if (wasLongPressTriggered) return;
    if (!isDead) {
      onToggleDead();
    }
  };

  // Shared kill button (rendered both in the normal stack and in the panic state)
  const renderKillButton = () => (
    <button
      onMouseDown={handleDeadMouseDown}
      onMouseUp={onEndLongPress}
      onMouseLeave={onEndLongPress}
      onTouchStart={handleDeadMouseDown}
      onTouchEnd={onEndLongPress}
      onClick={handleDeadClick}
      className={cn(
        "relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm font-mono font-black uppercase tracking-wider flex items-center justify-center border overflow-hidden transition-all",
        isDead
          ? "bg-red-900/40 hover:bg-red-900/60 border-red-700/50 text-red-400"
          : "bg-slate-800/30 hover:bg-slate-700/40 border-slate-700/40 text-slate-500",
        isLongPressing && "scale-95 opacity-80"
      )}
      type="button"
      title={isDead ? "Долгое нажатие для воскрешения" : "Пометить как убитый"}
      aria-label={isDead ? "Боец убит. Долгое нажатие для отмены." : "Пометить бойца как убитого"}
      aria-pressed={isDead}
      data-testid="soldier-kill-button"
      data-soldier-index={soldierIndex}
    >
      {isDead && (
        <>
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-500/30" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-500/30" aria-hidden="true" />
        </>
      )}
      <Skull className="w-5 h-5 flex-shrink-0" />
    </button>
  );

  // Pilot navigation replaces the kill button
  if (isPilot && onNavigateToMachine) {
    return (
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={onNavigateToMachine}
          className={cn(
            "relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm transition-all flex items-center justify-center",
            "border-2 text-xs font-mono font-bold uppercase tracking-wider",
            "bg-purple-950/20 hover:bg-purple-950/40 border-purple-700/50 text-purple-400 active:scale-95"
          )}
          type="button"
          aria-label="Перейти к машине"
        >
          <ArrowRightCircle className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Panic state — can be destroyed (rules §10), but cannot act (no DONE)
  if (isInPanic) {
    return (
      <div className="flex flex-col gap-1 shrink-0">
        {!isDead && (
          <div className="relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm flex items-center justify-center border-2 bg-orange-950/30 border-orange-700/50 text-orange-400">
            <Footprints className="w-5 h-5" />
          </div>
        )}
        {renderKillButton()}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 shrink-0">
      {/* УБИТЬ button — «Готов» переехал на фото бойца (SoldierDoneButton) */}
      {renderKillButton()}
    </div>
  );
}
