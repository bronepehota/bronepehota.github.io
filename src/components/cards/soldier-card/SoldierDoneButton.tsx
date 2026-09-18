'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierDoneButtonProps {
  isDone: boolean;
  isDead: boolean;
  soldierIndex: number;
  onToggleDone: () => void;
  onStartLongPress: (callback: () => void) => void;
  onEndLongPress: () => void;
  isLongPressing: boolean;
  /** Overlay positioning/size overrides (rendered on the soldier image) */
  className?: string;
}

/**
 * «Готов» (завершить ход бойца) — живёт поверх фото бойца, угол снизу-слева.
 * Short click marks done; long press (600ms) cancels when already done —
 * the wasLongPressTriggered guard travels with the button so the trailing
 * click after a completed long-press never double-fires.
 */
export function SoldierDoneButton({
  isDone,
  isDead,
  soldierIndex,
  onToggleDone,
  onStartLongPress,
  onEndLongPress,
  isLongPressing,
  className,
}: SoldierDoneButtonProps) {
  const [wasLongPressTriggered, setWasLongPressTriggered] = useState(false);

  const handleMouseDown = () => {
    setWasLongPressTriggered(false);
    if (isDone) {
      onStartLongPress(() => {
        setWasLongPressTriggered(true);
        onToggleDone();
      });
    }
  };

  const handleClick = () => {
    if (wasLongPressTriggered) return;
    if (!isDead) {
      onToggleDone();
    }
  };

  return (
    <button
      disabled={isDead}
      onMouseDown={handleMouseDown}
      onMouseUp={onEndLongPress}
      onMouseLeave={onEndLongPress}
      onTouchStart={handleMouseDown}
      onTouchEnd={onEndLongPress}
      onClick={handleClick}
      className={cn(
        "relative w-11 h-11 min-w-[44px] min-h-[44px] p-1.5 rounded-sm transition-all flex items-center justify-center border-2 overflow-hidden",
        isDone
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 shadow-[0_0_12px_rgba(16,185,129,0.5)] border-emerald-500 text-emerald-100"
          // Not done: translucent so the card art shows through the overlay
          : "bg-slate-900/70 backdrop-blur-md hover:bg-slate-800/80 border-slate-600/50 text-slate-300",
        isLongPressing && "scale-95 opacity-80",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
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
  );
}
