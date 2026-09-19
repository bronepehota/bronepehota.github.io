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

/**
 * Кегль значения по длине (ревью PR #242: 19px не лезут длинным кубам —
 * D12+2/1D20+2 вылезали из бейджа, на 320px даже 2D6). Короткие значения
 * (цифры брони/ближнего боя, D6) остаются дистанционно крупными; длинные
 * компактнее и без иконки — чтобы влезть, не обрезаясь.
 */
function statValueFit(v: string): { cls: string; icon: boolean; pad?: string } {
  const len = v.length;
  if (len <= 2) return { cls: 'text-[19px] md:text-[22px]', icon: true };
  if (len <= 4) return { cls: 'text-[16px] md:text-[19px]', icon: true };
  if (len === 5) return { cls: 'text-[15px] md:text-[18px]', icon: false };
  // 6+ символов (1D20+2): на 320px без урезанного паддинга не влезает
  return { cls: 'text-[13px] md:text-[15px]', icon: false, pad: 'px-0.5' };
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
  const fit = typeof value === 'string' ? statValueFit(value) : undefined;

  return (
    <div
      data-testid={statKey ? `stat-badge-${statKey}` : undefined}
      className={cn(
      // min-w-0 (not min-w-[44px]): display badge, not a control — the whole
      // grid is the tap target. Lets the 3 columns compress on 320px screens
      // instead of pushing the action buttons out of the card.
      'relative flex flex-row items-center justify-center gap-0.5 rounded-lg bg-slate-800/60 min-h-[40px] min-w-0 flex-1 transition-colors',
      // px единственным источником: каскадный конфликт px-1/px-0.5 не переопределяется надёжно
      fit?.pad ?? 'px-1',
      isActive
        ? isDebuff
          ? 'border border-red-500/40 shadow-[inset_0_0_8px_rgba(239,68,68,0.06)]'
          : 'border border-emerald-500/40 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]'
        : 'border border-slate-700/40',
      disabled && 'opacity-30'
    )}>
      {(!fit || fit.icon) && <Icon className={cn('w-3 h-3 shrink-0', color)} />}
      {/* Значения крупные: карточку смотрят с расстояния (телефон лежит
          на столе/полу) — 14px там не читались. Длинные кубы (D12+2,
          1D20+2) — компактнее и без иконки, чтобы не вылезать из бейджа. */}
      {typeof value === 'string' ? (
        <span className={cn('font-mono font-black leading-none', fit!.cls, color.replace('400', '300'))}>{value}</span>
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
            value={distanceInputUnit === 'cm' ? `${soldier.speed * stepToCmFactor}см` : (
              // Шаги крупно + сантиметры в скобках мелко
              <span className="flex items-baseline gap-1">
                <span className="text-[19px] md:text-[22px] font-mono font-black leading-none text-cyan-300">{soldier.speed}</span>
                <span className="text-[11px] font-mono font-bold leading-none text-slate-300">({soldier.speed * stepToCmFactor}см)</span>
              </span>
            )}
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
