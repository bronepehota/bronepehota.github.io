'use client';

import { Shield, Footprints, Target, Flame, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';

interface SoldierStatsProps {
  soldier: Soldier;
  className?: string;
}

/**
 * SoldierStats - Displays soldier stat badges with highlighted armor.
 *
 * Armor badge is highlighted with yellow tech styling to draw attention.
 * Other stats (Speed, Range, Power, Melee) use standard styling.
 */
export function SoldierStats({ soldier, className }: SoldierStatsProps) {
  return (
    <div className={cn('flex flex-wrap gap-0.5 md:gap-1', className)}>
      {/* Armor - HIGHLIGHTED with tech styling */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px] bg-yellow-950/30 border-2 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.25)] overflow-hidden">
        {/* Tech corners at top-left and bottom-right */}
        <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l-2 border-t-2 border-yellow-400/60 -ml-px -mt-px pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r-2 border-b-2 border-yellow-400/60 -mr-px -mb-px pointer-events-none" />

        <Shield className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-yellow-200 mb-1 md:mb-0 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-yellow-200 leading-none truncate w-full text-center" title={soldier.armor.toString()}>
          {soldier.armor}
        </span>
      </div>

      {/* Speed */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
        <Footprints className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-cyan-400 mb-1 md:mb-0 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-cyan-300 leading-none truncate w-full text-center" title={soldier.speed.toString()}>
          {soldier.speed}
        </span>
      </div>

      {/* Range - disabled if no ranged attack */}
      <div className={cn(
        'relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]',
        (!soldier.range || soldier.range === '0') && 'opacity-40'
      )}>
        <Target className={cn('w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0', (!soldier.range || soldier.range === '0') ? 'text-slate-600' : 'text-amber-400')} />
        <span className={cn(
          'text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center',
          (!soldier.range || soldier.range === '0') ? 'text-slate-600' : 'text-amber-300'
        )} title={soldier.range}>
          {soldier.range && soldier.range !== '0' ? (soldier.range.length > 4 ? soldier.range.replace('D', '') : soldier.range) : '—'}
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
          {soldier.power && soldier.power !== '0' ? (soldier.power.length > 4 ? soldier.power.replace('D', '') : soldier.power) : '—'}
        </span>
      </div>

      {/* Melee - disabled if no melee attack */}
      <div className={cn(
        'relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]',
        soldier.melee <= 0 && 'opacity-40'
      )}>
        <Sword className={cn('w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0', soldier.melee <= 0 ? 'text-slate-600' : 'text-red-400')} />
        <span className={cn(
          'text-xs md:text-sm font-mono font-black leading-none truncate w-full text-center',
          soldier.melee <= 0 ? 'text-slate-600' : 'text-red-300'
        )} title={soldier.melee.toString()}>
          {soldier.melee > 0 ? soldier.melee : '—'}
        </span>
      </div>
    </div>
  );
}
