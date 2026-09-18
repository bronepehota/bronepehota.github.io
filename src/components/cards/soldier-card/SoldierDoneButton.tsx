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
        // Ghost chip the size of the #N badge, flush in the image's bottom-right
        // corner (playtest iteration 2). The visible 28px is backed by a ~48px
        // finger-friendly tap zone: ::after extends up and to the LEFT only (the
        // corner sides touch the card edges) — no overflow-hidden, it would clip
        // that zone.
        "relative w-7 h-7 p-0.5 rounded-tl-sm transition-all flex items-center justify-center border",
        isDone
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-emerald-500 text-emerald-100"
          // Rest: almost transparent — the photo shows through, only a faint
          // check floats in the corner
          : "bg-slate-950/30 border-transparent text-slate-400/70 hover:text-slate-200 hover:bg-slate-950/50",
        isLongPressing && "scale-90 opacity-80",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "after:absolute after:content-[''] after:-left-5 after:-top-5 after:right-0 after:bottom-0",
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
      <CheckCircle2 className="w-4 h-4" />
    </button>
  );
}
