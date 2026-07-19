'use client';

import { Shield, Footprints, Target, Flame, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';
import type { SoldierModifier } from '@/lib/modifier-types';
import { ModifierIndicator } from './ModifierIndicator';
import { ExpandedEffectsPanel } from './ExpandedEffectsPanel';

interface StatBonuses {
  rangeBonus?: number;
  powerBonus?: number;
  meleeBonus?: number;
  armorBonus?: number;
  speedMultiplier?: number;
}

interface SoldierStatsProps {
  soldier: Soldier;
  className?: string;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
  disabled?: boolean;
  onClick?: () => void;
  buffCount?: number;
  debuffCount?: number;
  soldierModifiers?: SoldierModifier[];
  availableBuffCount?: number;
  onModifierClick?: () => void;
  statBonuses?: StatBonuses;
  hideArmor?: boolean;
  hideSpeed?: boolean;
}

function StatBadge({ icon: Icon, value, color, bonus, disabled, statKey }: {
  icon: React.ElementType;
  value: string | React.ReactNode;
  color: string;
  bonus?: string;
  disabled?: boolean;
  statKey?: string;
}) {
  const isDebuff = bonus?.startsWith('-');
  const isActive = !!bonus;

  return (
    <div
      data-testid={statKey ? `stat-badge-${statKey}` : undefined}
      className={cn(
      'relative flex flex-row items-center justify-center gap-0.5 rounded-lg bg-slate-800/60 min-h-[40px] min-w-[44px] flex-1 px-1 transition-colors',
      isActive
        ? isDebuff
          ? 'border border-red-500/40 shadow-[inset_0_0_8px_rgba(239,68,68,0.06)]'
          : 'border border-emerald-500/40 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]'
        : 'border border-slate-700/40',
      disabled && 'opacity-30'
    )}>
      <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
      {typeof value === 'string' ? (
        <span className={cn('text-sm font-mono font-black leading-none', color.replace('400', '300'))}>{value}</span>
      ) : value}
      {bonus && (
        <span className={cn(
          'text-[9px] font-mono font-extrabold leading-none translate-y-[-1px]',
          isDebuff ? 'text-red-400/90' : 'text-emerald-400/90'
        )}>{bonus}</span>
      )}
    </div>
  );
}

export function SoldierStats({
  soldier,
  className,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  disabled = false,
  onClick,
  buffCount,
  debuffCount,
  soldierModifiers = [],
  availableBuffCount,
  onModifierClick,
  statBonuses,
  hideArmor = false,
  hideSpeed = false,
}: SoldierStatsProps) {
  const noRange = !soldier.range || soldier.range === '0';
  const noPower = !soldier.power || soldier.power === '0';

  const formatBonus = (val?: number) => {
    if (val === undefined || val === 0) return undefined;
    return val > 0 ? `+${val}` : `${val}`;
  };

  const formatMultiplier = (val?: number) => {
    if (val === undefined || val === 1) return undefined;
    return `x${val}`;
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      onKeyDown={disabled ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      className={cn(
        'grid grid-cols-3 gap-1 p-1 rounded-lg transition-all active:scale-[0.97] active:bg-slate-700/40 select-none',
        !disabled && 'cursor-pointer hover:bg-slate-700/30',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={disabled ? 'Действие недоступно' : 'Выберите действие бойца'}
    >
      {/* Combat stats: always first row, shifted up when armor/speed hidden */}
      {!hideArmor || !hideSpeed ? (
        <>
          <StatBadge
            icon={Shield}
            value={soldier.armor.toString()}
            color="text-yellow-400"
            bonus={formatBonus(statBonuses?.armorBonus)}
            statKey="armor"
          />
          <StatBadge
            icon={Footprints}
            value={distanceInputUnit === 'cm' ? `${soldier.speed * stepToCmFactor}см` : soldier.speed.toString()}
            color="text-cyan-400"
            bonus={formatMultiplier(statBonuses?.speedMultiplier)}
            statKey="speed"
          />
          <ModifierIndicator
            buffCount={buffCount ?? 0}
            debuffCount={debuffCount ?? 0}
            soldierModifiers={soldierModifiers}
            availableCount={availableBuffCount}
            onClick={onModifierClick}
            disabled={disabled}
          />
        </>
      ) : null}

      {/* Combat stats row */}
      <StatBadge
        icon={Target}
        value={noRange ? '—' : soldier.range}
        color="text-amber-400"
        disabled={noRange}
        bonus={noRange ? undefined : formatBonus(statBonuses?.rangeBonus)}
        statKey="range"
      />
      <StatBadge
        icon={Flame}
        value={noPower ? '—' : soldier.power}
        color="text-red-400"
        disabled={noPower}
        bonus={noPower ? undefined : formatBonus(statBonuses?.powerBonus)}
        statKey="power"
      />
      <StatBadge
        icon={Sword}
        value={soldier.melee.toString()}
        color="text-red-400"
        bonus={formatBonus(statBonuses?.meleeBonus)}
        statKey="melee"
      />

      {/* Effects panel below stats — only when armor/speed are hidden */}
      {hideArmor && hideSpeed && (
        <ExpandedEffectsPanel
          buffCount={buffCount ?? 0}
          debuffCount={debuffCount ?? 0}
          soldierModifiers={soldierModifiers}
          availableCount={availableBuffCount}
          onClick={onModifierClick}
          disabled={disabled}
        />
      )}
    </div>
  );
}
