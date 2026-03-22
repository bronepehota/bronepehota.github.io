'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoldierModifier } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';

interface ModifierIndicatorProps {
  buffCount: number;
  debuffCount: number;
  soldierModifiers?: SoldierModifier[];
  onClick?: () => void;
  disabled?: boolean;
}

export function ModifierIndicator({
  buffCount,
  debuffCount,
  soldierModifiers = [],
  onClick,
  disabled,
}: ModifierIndicatorProps) {
  const totalCount = buffCount + debuffCount;

  // If there are soldier-specific modifiers, show them as icons
  if (soldierModifiers.length > 0) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : onClick}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
        }
        className={cn(
          'flex flex-row items-center justify-center gap-0.5 rounded-lg bg-slate-800/60 border border-amber-700/50 min-h-[40px] min-w-[44px] flex-1 px-0.5 transition-all select-none',
          !disabled && 'cursor-pointer hover:bg-slate-700/30 active:scale-[0.97]',
          disabled && 'opacity-30'
        )}
        aria-label={`${soldierModifiers.length} модификаторов на солдата`}
      >
        {soldierModifiers.map(mod => (
          <div
            key={mod.id}
            title={`${mod.name}: ${mod.description} (Ход ${mod.expiresAtTurn - mod.appliedAtTurn}/${mod.duration})`}
            className="shrink-0"
          >
            <ModifierIcon
              name={mod.icon}
              size={14}
              className="text-amber-400"
            />
          </div>
        ))}
      </div>
    );
  }

  // Original behavior: show count for unit-level modifiers
  if (totalCount === 0) {
    return <div className="min-h-[40px] min-w-[44px]" />;
  }

  const hasBuffs = buffCount > 0;
  const hasDebuffs = debuffCount > 0;

  const colorClasses =
    hasBuffs && hasDebuffs
      ? 'border-amber-700/50 bg-amber-950/20 text-amber-400'
      : hasDebuffs
        ? 'border-red-700/50 bg-red-950/20 text-red-400'
        : 'border-emerald-700/50 bg-emerald-950/20 text-emerald-400';

  const iconColor =
    hasBuffs && hasDebuffs
      ? 'text-amber-400'
      : hasDebuffs
        ? 'text-red-400'
        : 'text-emerald-400';

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
        }
      className={cn(
        'flex flex-row items-center justify-center gap-1 rounded-lg bg-slate-800/60 border min-h-[40px] min-w-[44px] flex-1 px-1 transition-all select-none',
        colorClasses,
        !disabled && 'cursor-pointer hover:bg-slate-700/30 active:scale-[0.97]',
        disabled && 'opacity-30'
      )}
      aria-label={`${buffCount} баффов, ${debuffCount} дебаффов`}
    >
      <Sparkles className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
      <span className="text-sm font-mono font-black leading-none text-inherit">
        {totalCount}
      </span>
    </div>
  );
}
