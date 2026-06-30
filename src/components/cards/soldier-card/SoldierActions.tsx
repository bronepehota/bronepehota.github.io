'use client';

import { useState } from 'react';
import { CheckCircle2, Skull, Footprints, ArrowRightCircle } from 'lucide-react';
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
  onToggleDone: () => void;
  onToggleDead: () => void;
  soldierIndex: number;
  onStartLongPress: (callback: () => void) => void;
  onEndLongPress: () => void;
  isLongPressing: boolean;
  isPilot?: boolean;
  onNavigateToMachine?: () => void;
}

export function SoldierActions({
  isDead,
  isDone,
  isInPanic,
  onToggleDone,
  onToggleDead,
  onStartLongPress,
  onEndLongPress,
  isLongPressing,
  soldierIndex,
  isPilot = false,
  onNavigateToMachine,
}: SoldierActionsProps) {
  const [wasLongPressTriggered, setWasLongPressTriggered] = useState(false);

  const handleDoneMouseDown = () => {
    setWasLongPressTriggered(false);
    if (isDone) {
      onStartLongPress(() => {
        setWasLongPressTriggered(true);
        onToggleDone();
      });
    }
  };

  const handleDoneClick = () => {
    if (wasLongPressTriggered) return;
    if (!isDead) {
      onToggleDone();
    }
  };

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

  // Pilot navigation replaces done/kill
  if (isPilot && onNavigateToMachine) {
    return (
      <div className="flex flex-col gap-1">
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
      <div className="flex flex-col gap-1">
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
    <div className="flex flex-col gap-1">
      {/* ГОТОВ button */}
      <button
        disabled={isDead}
        onMouseDown={handleDoneMouseDown}
        onMouseUp={onEndLongPress}
        onMouseLeave={onEndLongPress}
        onTouchStart={handleDoneMouseDown}
        onTouchEnd={onEndLongPress}
        onClick={handleDoneClick}
        className={cn(
          "relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm transition-all flex items-center justify-center border-2 overflow-hidden",
          isDone
            ? "bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.5)] border-emerald-500 text-emerald-100"
            : "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 border-slate-600 text-slate-300",
          isLongPressing && "scale-95 opacity-80",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        type="button"
        title={isDone ? "Долгое нажатие для отмены" : "Завершить ход бойца"}
        aria-label={isDone ? "Боевых действий завершён. Долгое нажатие для отмены." : "Завершить ход бойца"}
        aria-pressed={isDone}
        data-testid="soldier-done-button"
        data-soldier-index={soldierIndex}
      >
        {isDone && (
          <>
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-emerald-400/60" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-emerald-400/60" aria-hidden="true" />
          </>
        )}
        <CheckCircle2 className="w-5 h-5" />
      </button>

      {/* УБИТЬ button */}
      {renderKillButton()}
    </div>
  );
}
