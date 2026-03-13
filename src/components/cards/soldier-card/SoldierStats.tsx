'use client';

import { Shield, Footprints, Target, Flame, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';
import { formatRange } from '@/lib/distance-utils';

interface SoldierStatsProps {
  soldier: Soldier;
  className?: string;
  distanceInputUnit?: 'steps' | 'cm';
  stepToCmFactor?: number;
}

/**
 * SoldierStats - Displays soldier stat badges with highlighted armor.
 *
 * Armor badge is highlighted with yellow tech styling to draw attention.
 * Other stats (Speed, Range, Power, Melee) use standard styling.
 */
export function SoldierStats({
  soldier,
  className,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5
}: SoldierStatsProps) {
  return (
    <div className={cn('flex flex-wrap gap-0.5 md:gap-1', className)}>
      {/* Armor - subtle highlight */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
        <Shield className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-yellow-400 mb-1 md:mb-0 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-yellow-300 leading-none truncate w-full text-center" title={soldier.armor.toString()}>
          {soldier.armor}
        </span>
      </div>

      {/* Speed */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
        <Footprints className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-cyan-400 mb-1 md:mb-0.5 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-cyan-300 leading-none">
          {distanceInputUnit === 'cm' ? `${soldier.speed * stepToCmFactor}см` : `${soldier.speed}шаг`}
        </span>
      </div>

      {/* Range - disabled if no ranged attack */}
      <div className={cn(
        'relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]',
        (!soldier.range || soldier.range === '0') && 'opacity-40'
      )}>
        <Target className={cn(
          'w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0.5 shrink-0',
          (!soldier.range || soldier.range === '0') ? 'text-slate-600' : 'text-amber-400'
        )} />
        <span className={cn(
          'text-[10px] md:text-xs font-mono font-black leading-none',
          (!soldier.range || soldier.range === '0') ? 'text-slate-600' : 'text-amber-300'
        )}>
          {soldier.range && soldier.range !== '0' ? (
            <span className="flex flex-col items-center leading-tight">
              <span className="text-[9px] md:text-[10px]">{soldier.range}</span>
              <span className="text-[8px] md:text-[9px] opacity-80">{formatRange(soldier.range, 'cm', stepToCmFactor)}</span>
            </span>
          ) : '—'}
        </span>
      </div>

      {/* Power - disabled if no ranged attack */}
      <div className={cn(
        'relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]',
        (!soldier.power || soldier.power === '0') && 'opacity-40'
      )}>
        <Flame className={cn('w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0', (!soldier.power || soldier.power === '0') ? 'text-slate-600' : 'text-red-400')} />
        <span className={cn(
          'text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center',
          (!soldier.power || soldier.power === '0') ? 'text-slate-600' : 'text-red-300'
        )} title={soldier.power}>
          {soldier.power && soldier.power !== '0' ? soldier.power : '—'}
        </span>
      </div>

      {/* Melee - always available, melee stat is just a bonus */}
      <div className={cn(
        'relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]'
      )}>
        <Sword className={cn('w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0 text-red-400')} />
        <span className={cn(
          'text-xs md:text-sm font-mono font-black leading-none truncate w-full text-center text-red-300'
        )} title={soldier.melee.toString()}>
          {soldier.melee}
        </span>
      </div>
    </div>
  );
}
