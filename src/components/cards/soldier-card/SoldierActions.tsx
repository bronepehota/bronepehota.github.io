'use client';

import { useState } from 'react';
import { CheckCircle2, Skull, Crosshair, Footprints } from 'lucide-react';
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
}

export function SoldierActions({
  isDead,
  isDone,
  isInPanic,
  onActionClick,
  onToggleDone,
  onToggleDead,
  onStartLongPress,
  onEndLongPress,
  isLongPressing,
  soldierIndex,
}: SoldierActionsProps) {
  const [wasLongPressTriggered, setWasLongPressTriggered] = useState(false);

  const handleDoneMouseDown = () => {
    setWasLongPressTriggered(false); // Reset at start of each interaction

    // Only start long-press if already DONE (for cancellation)
    if (isDone) {
      onStartLongPress(() => {
        setWasLongPressTriggered(true);
        onToggleDone(); // Cancel: reset done state
      });
    }
  };

  const handleDoneClick = () => {
    // If long-press was triggered, ignore onClick (cancel already happened)
    if (wasLongPressTriggered) {
      return;
    }

    // If NOT done → activate (mark done)
    if (!isDead && !isDone) {
      onToggleDone(); // Activate: mark as done
    }
  };

  const handleDeadMouseDown = () => {
    setWasLongPressTriggered(false); // Reset at start of each interaction

    // Only start long-press if already DEAD (for resurrection)
    if (isDead) {
      onStartLongPress(() => {
        setWasLongPressTriggered(true);
        onToggleDead(); // Cancel: resurrect
      });
    }
  };

  const handleDeadClick = () => {
    // If long-press was triggered, ignore onClick (cancel already happened)
    if (wasLongPressTriggered) {
      return;
    }

    // If NOT dead → activate (kill)
    if (!isDead) {
      onToggleDead(); // Activate: kill
    }
  };

  return (
    <div className="flex gap-2 md:gap-3 items-center">
      {/* ДЕЙСТВИЕ button - disabled for dead/done/panic soldiers */}
      {isInPanic ? (
        <div className="relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden border-2 text-xs font-mono font-bold uppercase tracking-wider bg-orange-950/30 border-orange-700/50 text-orange-400">
          {/* Tech corners */}
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-orange-600/40" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-orange-600/40" aria-hidden="true" />
          <Footprints className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">В ПАНИКЕ</span>
        </div>
      ) : (
        <button
          disabled={isDone || isDead}
          onClick={onActionClick}
          className={cn(
            "relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden",
            "border-2 text-xs font-mono font-bold uppercase tracking-wider",
            "bg-purple-950/20 hover:bg-purple-950/40 border-purple-700/50 text-purple-400 active:scale-95",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-950/20"
          )}
          type="button"
          aria-label="Выберите действие"
        >
          {/* Tech corners */}
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-purple-600/40" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-purple-600/40" aria-hidden="true" />
          <Crosshair className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">ДЕЙСТВИЕ</span>
        </button>
      )}

      {/* Visual separator - desktop only */}
      <div className="hidden md:block w-px h-8 bg-slate-700/50 mx-1" aria-hidden="true" />

      {/* ГОТОВ button - gradient with long-press */}
      {isInPanic ? (
        <div className="relative p-1.5 md:p-2 rounded-sm min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden bg-orange-950/20 border-orange-700/30 text-orange-400/50" aria-hidden="true">
          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 opacity-50" />
        </div>
      ) : (
        <button
          disabled={isDead}
          onMouseDown={handleDoneMouseDown}
          onMouseUp={onEndLongPress}
          onMouseLeave={onEndLongPress}
          onTouchStart={handleDoneMouseDown}
          onTouchEnd={onEndLongPress}
          onClick={handleDoneClick}
          className={cn(
            "relative p-1.5 md:p-2 rounded-sm transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden",
            "font-mono font-black uppercase",
            isDone
              ? "bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] border-emerald-500 text-emerald-100"
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
          {/* Tech corners when done */}
          {isDone && (
            <>
              <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-emerald-400/60" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-emerald-400/60" aria-hidden="true" />
            </>
          )}
          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      {/* УБИТЬ button - gradient with long-press */}
      <button
        onMouseDown={handleDeadMouseDown}
        onMouseUp={onEndLongPress}
        onMouseLeave={onEndLongPress}
        onTouchStart={handleDeadMouseDown}
        onTouchEnd={onEndLongPress}
        onClick={handleDeadClick}
        className={cn(
          "relative p-1.5 md:p-2 rounded-sm font-mono font-black uppercase tracking-wider min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1 md:gap-1.5 border-2 overflow-hidden transition-all",
          isDead
            ? "bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_20px_rgba(220,38,38,0.7)] border-red-600 text-red-100"
            : "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 border-slate-600 text-slate-300",
          isLongPressing && "scale-95 opacity-80"
        )}
        type="button"
        title={isDead ? "Долгое нажатие для воскрешения" : "Пометить как убитый"}
        aria-label={isDead ? "Боец убит. Долгое нажатие для отмены." : "Пометить бойца как убитого"}
        aria-pressed={isDead}
        data-testid="soldier-kill-button"
        data-soldier-index={soldierIndex}
      >
        {/* Tech corners when dead */}
        {isDead && (
          <>
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-500/60" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-500/60" aria-hidden="true" />
          </>
        )}
        <Skull className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
        <span className="hidden md:inline text-[10px] font-mono font-black uppercase ml-0.5">
          {isDead ? 'УБИТ' : 'ЖИВ'}
        </span>
      </button>
    </div>
  );
}
