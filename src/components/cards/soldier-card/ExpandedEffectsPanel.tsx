'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoldierModifier } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { getEffectStyles } from '@/lib/effect-colors';

interface ExpandedEffectsPanelProps {
  buffCount: number;
  debuffCount: number;
  soldierModifiers?: SoldierModifier[];
  availableCount?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function ExpandedEffectsPanel({
  buffCount,
  debuffCount,
  soldierModifiers = [],
  availableCount,
  onClick,
  disabled,
}: ExpandedEffectsPanelProps) {
  const totalCount = buffCount + debuffCount;

  // If there are soldier-specific modifiers, show them as a row of icons with labels
  if (soldierModifiers.length > 0) {
    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(); }}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick?.();
                }
              }
        }
        className={cn(
          'col-span-3 flex flex-row items-center gap-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 min-h-[40px] px-2 py-1 transition-all select-none overflow-x-auto',
          !disabled && 'cursor-pointer hover:bg-slate-700/30 active:scale-[0.97]',
          disabled && 'opacity-30'
        )}
        aria-label={`${soldierModifiers.length} модификаторов на бойца`}
      >
        {soldierModifiers.map(mod => {
          const colorStyles = getEffectStyles(mod.id);
          return (
            <div
              key={mod.id}
              title={`${mod.name}: ${mod.description}${mod.duration ? ` (Ход ${mod.expiresAtTurn! - mod.appliedAtTurn}/${mod.duration})` : ' (постоянная)'}`}
              className={cn(
                'flex items-center gap-0.5 shrink-0 px-1 py-0.5 rounded border',
                colorStyles.border, colorStyles.bg
              )}
            >
              <ModifierIcon
                name={mod.icon}
                size={12}
                className={colorStyles.icon}
              />
              <span className={cn('text-[9px] font-mono font-bold leading-none', colorStyles.label)}>
                {mod.name.length > 8 ? mod.name.slice(0, 7) + '.' : mod.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // No active modifiers: show available count or subtle placeholder
  if (totalCount === 0) {
    if (availableCount && availableCount > 0) {
      return (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(); }}
          onKeyDown={
            disabled
              ? undefined
              : (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick?.();
                  }
                }
          }
          className={cn(
            'col-span-3 flex flex-row items-center justify-center gap-1.5 rounded-lg bg-amber-950/20 border border-amber-700/50 min-h-[40px] px-2 transition-all select-none',
            !disabled && 'cursor-pointer hover:bg-amber-950/30 hover:border-amber-600/60 active:scale-[0.97]',
            disabled && 'opacity-30'
          )}
          aria-label={`${availableCount} эффектов доступно`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-mono font-black text-amber-400 leading-none">{availableCount} эффектов</span>
        </div>
      );
    }

    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(); }}
        onKeyDown={
          disabled
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick?.();
                }
              }
        }
        className={cn(
          'col-span-3 flex flex-row items-center justify-center gap-0.5 rounded-lg bg-slate-800/60 border border-dashed border-slate-700/40 min-h-[40px] px-2 transition-all select-none',
          !disabled && 'cursor-pointer hover:bg-slate-700/30 hover:border-slate-600/60 active:scale-[0.97]',
          disabled && 'opacity-30'
        )}
        aria-label="Добавить эффект"
      >
        <Sparkles className="w-3.5 h-3.5 text-slate-600" />
      </div>
    );
  }

  // Has buffs/debuffs: show summary bar
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
      onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(); }}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onClick?.();
              }
            }
      }
      className={cn(
        'col-span-3 flex flex-row items-center justify-center gap-1.5 rounded-lg bg-slate-800/60 border min-h-[40px] px-2 transition-all select-none',
        colorClasses,
        !disabled && 'cursor-pointer hover:bg-slate-700/30 active:scale-[0.97]',
        disabled && 'opacity-30'
      )}
      aria-label={`${buffCount} баффов, ${debuffCount} дебаффов`}
    >
      <Sparkles className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
      <span className="text-xs font-mono font-bold leading-none text-inherit">
        {totalCount} {hasBuffs && hasDebuffs ? 'эффектов' : hasDebuffs ? 'дебаффов' : 'баффов'}
      </span>
    </div>
  );
}
