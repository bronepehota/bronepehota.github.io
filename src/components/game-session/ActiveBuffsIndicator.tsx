/**
 * ActiveBuffsIndicator - displays active temporary buffs on unit cards.
 * Shows icon, name, and remaining turns (Ход X/Y format).
 */

'use client';

import { cn } from '@/lib/utils';
import type { ActiveBuff } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

interface ActiveBuffsIndicatorProps {
  activeBuffs: ActiveBuff[];
  currentTurn?: number;
  compact?: boolean;  // If true, show smaller version
}

export function ActiveBuffsIndicator({
  activeBuffs,
  currentTurn,
  compact = false,
}: ActiveBuffsIndicatorProps) {
  if (activeBuffs.length === 0) return null;

  return (
    <div className={cn(
      "flex gap-1",
      compact ? "flex-wrap" : ""
    )}>
      {activeBuffs.map(buff => {
        const turnInEffect = currentTurn
          ? currentTurn - buff.appliedAtTurn + 1
          : 1;
        const isLastTurn = currentTurn && currentTurn >= buff.expiresAtTurn - 1;

        return (
          <div
            key={buff.id}
            className={cn(
              "flex items-center gap-1.5 rounded-md border",
              compact
                ? "px-1.5 py-0.5 bg-amber-900/20 border-amber-600/30"
                : "px-2 py-1 bg-amber-900/30 border-amber-600/40"
            )}
            title={`${buff.name}: ${buff.description}`}
          >
            <ModifierIcon name={buff.icon} size={compact ? 12 : 14} className="text-amber-400" />
            {!compact && (
              <span className="text-xs font-medium text-amber-300 truncate max-w-[80px]">
                {buff.name}
              </span>
            )}
            <span className={cn(
              "text-[9px] font-medium",
              isLastTurn ? "text-amber-400" : "text-amber-500/80"
            )}>
              {turnInEffect}/{buff.duration}
            </span>
          </div>
        );
      })}
    </div>
  );
}
