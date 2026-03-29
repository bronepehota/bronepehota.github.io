'use client';

import { Shield, Footprints, Target, Flame, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';
import type { SoldierModifier } from '@/lib/modifier-types';
import { ModifierIndicator } from './ModifierIndicator';

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
}

function StatBadge({ icon: Icon, value, color, subValue, disabled }: {
  icon: React.ElementType;
  value: string | React.ReactNode;
  color: string;
  subValue?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(
      'flex flex-row items-center justify-center gap-1 rounded-lg bg-slate-800/60 border border-slate-700/40 min-h-[40px] min-w-[44px] flex-1 px-1',
      disabled && 'opacity-30'
    )}>
      <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
      {typeof value === 'string' ? (
        <span className={cn('text-sm font-mono font-black leading-none', color.replace('400', '300'))}>{value}</span>
      ) : value}
      {subValue && (
        <span className={cn('text-[9px] font-mono leading-none', color.replace('400', '300'), 'opacity-70')}>{subValue}</span>
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
}: SoldierStatsProps) {
  const noRange = !soldier.range || soldier.range === '0';
  const noPower = !soldier.power || soldier.power === '0';

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
      {/* Row 1: Armor, Speed, (empty) */}
      <StatBadge icon={Shield} value={soldier.armor.toString()} color="text-yellow-400" />
      <StatBadge
        icon={Footprints}
        value={distanceInputUnit === 'cm' ? `${soldier.speed * stepToCmFactor}см` : soldier.speed.toString()}
        color="text-cyan-400"
      />
      <ModifierIndicator
        buffCount={buffCount ?? 0}
        debuffCount={debuffCount ?? 0}
        soldierModifiers={soldierModifiers}
        availableCount={availableBuffCount}
        onClick={onModifierClick}
        disabled={disabled}
      />

      {/* Row 2: Range, Power, Melee */}
      <StatBadge
        icon={Target}
        value={noRange ? '—' : soldier.range}
        color="text-amber-400"
        disabled={noRange}
      />
      <StatBadge
        icon={Flame}
        value={noPower ? '—' : soldier.power}
        color="text-red-400"
        disabled={noPower}
      />
      <StatBadge icon={Sword} value={soldier.melee.toString()} color="text-red-400" />
    </div>
  );
}
