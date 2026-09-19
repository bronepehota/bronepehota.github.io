'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
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
 * «Готов» (завершить ход бойца) — подписанный мини-чип поверх фото бойца,
 * правый нижний угол. Построен той же конструкцией, что и бейдж № бойца
 * (те же отступы/фон/шрифт) — иконка-квадрат в прошлой итерации не читалась
 * как кнопка. Тап-зона расширена невидимым полем (::after) влево-вверх.
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
        // No overflow-hidden: it would clip the ::after tap zone.
        // h-5 fixes the chip height — inline mono metrics otherwise inflate
        // the line box (28px) beyond the visible text.
        "relative h-5 px-1 rounded-tl-sm transition-all flex items-center gap-0.5 border font-mono text-[10px] font-bold",
        // Убит — красный «УБИТ» полной яркости (плейтест: затемнённый
        // «ГОТОВ» на трупе не читался как статус)
        isDead
          ? "bg-red-950/80 border-red-700/60 text-red-300"
          : isDone
            ? "bg-emerald-700/90 border-emerald-500/70 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            : "bg-slate-950/40 border-transparent text-white/75 hover:bg-slate-950/60 hover:text-white active:bg-slate-900/70 disabled:opacity-40 disabled:cursor-not-allowed",
        isLongPressing && "scale-90 opacity-80",
        "after:absolute after:content-[''] after:-left-4 after:-top-6 after:right-0 after:bottom-0",
        className
      )}
      type="button"
      title={isDead ? "Боец убит" : isDone ? "Долгое нажатие для отмены" : "Завершить ход бойца"}
      aria-label={isDead ? "Боец убит" : isDone ? "Боевых действий завершён. Долгое нажатие для отмены." : "Завершить ход бойца"}
      aria-pressed={isDone}
      data-testid="soldier-done-button"
      data-soldier-index={soldierIndex}
    >
      {isDead ? (
        <>
          <X className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />
          УБИТ
        </>
      ) : (
        <>
          {isDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />}
          ГОТОВ
        </>
      )}
    </button>
  );
}
