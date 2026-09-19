'use client';

import { Footprints, ArrowRightCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierActionsProps {
  isDead: boolean;
  isInPanic: boolean;
  isPilot?: boolean;
  onNavigateToMachine?: () => void;
}

/**
 * Правая колонка карточки бойца — только особые состояния. Кнопка «череп»
 * убрана (решение владельца 2026-09-19 «Убрать череп»): убить/оживить бойца
 * теперь можно ТОЛЬКО свайпом вправо по карточке (useCardSwipe; влево —
 * «готов»). Обычный боец колонку не рендерит вовсе — освободившиеся ~44px
 * достаются статам. Пилот → кнопка навигации к машине; паника → индикатор
 * «Отступает» (правила §10 — нельзя действовать; уничтожить можно свайпом
 * вправо, статус убитого — череп поверх фото).
 */
export function SoldierActions({
  isDead,
  isInPanic,
  isPilot = false,
  onNavigateToMachine,
}: SoldierActionsProps) {
  // Pilot navigation takes the column
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

  // Panic state — rules §10: cannot act (no ГОТОВ); to destroy — right swipe.
  // Only the indicator remains in the column; killed-in-panic shows nothing
  // here (the skull overlay on the photo carries the dead status).
  if (isInPanic) {
    if (isDead) return null;
    return (
      <div className="flex flex-col gap-1 shrink-0">
        <div
          data-testid="panic-indicator"
          className="relative min-w-[44px] min-h-[44px] p-1.5 rounded-sm flex items-center justify-center border-2 bg-orange-950/30 border-orange-700/50 text-orange-400"
        >
          <Footprints className="w-5 h-5" />
        </div>
      </div>
    );
  }

  // Regular soldier: no action column — kill/resurrect is the right swipe.
  return null;
}
