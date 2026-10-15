'use client';

import { Shield, Footprints, Target, Flame, Sword, Sparkles, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';
import type { SoldierModifier, BuffDefinition } from '@/lib/modifier-types';
import { ModifierIcon } from '@/components/editor/ModifierIcons';
import { getEffectStyles } from '@/lib/effect-colors';

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
  /** Тап по дальности/мощности = сразу ВЫСТРЕЛ, по ББ = сразу БЛИЖНИЙ БОЙ
   *  (мимо экрана выбора действия). Без пропа статы — просто отображение
   *  (превью редактора). */
  onStatAction?: (action: 'shot' | 'melee') => void;
  /** ⋯ в углу — меню всех действий (граната, захват) */
  onOpenActionMenu?: () => void;
  buffCount?: number;
  debuffCount?: number;
  soldierModifiers?: SoldierModifier[];
  /** Статические спец-свойства взвода (Пр4, Рм) — на кнопке модификаторов */
  staticAbilities?: BuffDefinition[];
  availableBuffCount?: number;
  onModifierClick?: () => void;
  statBonuses?: StatBonuses;
  hideArmor?: boolean;
  hideSpeed?: boolean;
}

/**
 * Кегль значения по длине (ревью PR #242: длинные кубы вылезают из бейджа).
 * Редизайн 2026-10-15: клетки выше (плейтест: «статы должны быть видны»),
 * но на 320px угловая колонка ✓/⋯ отняла ~44px ширины — базовые кегли
 * считаны на 320px, крупные включаются с 400px (min-[400px]).
 * icon 'wide' — иконка только на широких экранах (на 320px не влезает).
 */
function statValueFit(v: string): { cls: string; icon: boolean | 'wide'; pad?: string } {
  const len = v.length;
  if (len <= 2) return { cls: 'text-[22px] min-[400px]:text-[24px]', icon: true };
  if (len <= 3) return { cls: 'text-[16px] min-[400px]:text-[19px]', icon: 'wide' };
  if (len <= 4) return { cls: 'text-[13px] min-[400px]:text-[16px]', icon: false, pad: 'px-0.5' };
  if (len === 5) return { cls: 'text-[12px] min-[400px]:text-[15px]', icon: false, pad: 'px-0' };
  // 6+ символов (1D20+2)
  return { cls: 'text-[12px] min-[400px]:text-[14px]', icon: false, pad: 'px-0' };
}

function StatBadge({ icon: Icon, value, color, bonus, disabled, statKey, onClick, ariaLabel, tall }: {
  icon: React.ElementType;
  value: string | React.ReactNode;
  color: string;
  bonus?: string;
  disabled?: boolean;
  statKey?: string;
  /** Кнопка действия (выстрел/ББ). Без onClick бейдж — отображение. */
  onClick?: () => void;
  ariaLabel?: string;
  /** Крупная клетка (типовой отряд — единственный ряд статов) */
  tall?: boolean;
}) {
  const isDebuff = bonus?.startsWith('-');
  const isActive = !!bonus;
  const fit = typeof value === 'string' ? statValueFit(value) : undefined;

  const shell = cn(
    // min-w-0: сетка сжимает бейджи на 320px, а не выталкивает колонку ✓/⋯
    'relative flex flex-row items-center justify-center gap-0.5 rounded-lg bg-slate-800/60 min-w-0 flex-1 transition-colors',
    tall ? 'min-h-[64px]' : 'min-h-[44px]',
    fit?.pad ?? 'px-1',
    isActive
      ? isDebuff
        ? 'border border-red-500/40 shadow-[inset_0_0_8px_rgba(239,68,68,0.06)]'
        : 'border border-emerald-500/40 shadow-[inset_0_0_8px_rgba(16,185,129,0.06)]'
      : 'border border-slate-700/40',
    disabled && 'opacity-30'
  );

  const content = (
    <>
      {fit?.icon === 'wide' ? (
        <Icon className={cn('w-3.5 h-3.5 shrink-0 hidden min-[400px]:block', color)} />
      ) : (
        (!fit || fit.icon) && <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
      )}
      {/* Значения крупные: карточку смотрят с расстояния (телефон лежит
          на столе/полу). Длинные кубы (D12+2, 1D20+2) — компактнее и без
          иконки, чтобы не вылезать из бейджа. */}
      {typeof value === 'string' ? (
        <span className={cn('font-mono font-black leading-none', fit!.cls, color.replace('400', '300'))}>{value}</span>
      ) : value}
      {bonus && (
        <span className={cn(
          'text-[9px] font-mono font-extrabold leading-none translate-y-[-1px]',
          isDebuff ? 'text-red-400/90' : 'text-emerald-400/90'
        )}>{bonus}</span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        data-testid={statKey ? `stat-badge-${statKey}` : undefined}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          shell,
          !disabled && 'cursor-pointer hover:bg-slate-700/40 active:scale-[0.97] active:bg-slate-700/40 select-none',
          disabled && 'cursor-not-allowed'
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      data-testid={statKey ? `stat-badge-${statKey}` : undefined}
      aria-label={ariaLabel}
      className={cn(shell, disabled && 'cursor-not-allowed')}
    >
      {content}
    </div>
  );
}

/**
 * Угловая стопка (правый верхний угол сетки статов): ✦ модификаторы/
 * спец-свойства сверху, ⋯ меню действий снизу. Компактный аналог прежней
 * широкой кнопки модификаторов (плейтест: «занимает слишком много места»).
 * aria-метки сохранены от ModifierIndicator — e2e баффов на них опираются.
 */
function RailModifierButton({
  buffCount, debuffCount, soldierModifiers, staticAbilities, availableCount, onClick, disabled,
}: {
  buffCount: number;
  debuffCount: number;
  soldierModifiers: SoldierModifier[];
  staticAbilities: BuffDefinition[];
  availableCount?: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const totalCount = buffCount + debuffCount;

  const abilityNames = staticAbilities.map(b => (
    <span key={`static-${b.id}`} title={`${b.name}: ${b.description}${b.oneTimeUse ? ' (раз за бой)' : ' (постоянная)'}`}
      className="text-[9px] font-mono font-medium leading-none text-emerald-500/80">
      {b.name}
    </span>
  ));

  const modIcons = soldierModifiers.map(mod => (
    <ModifierIcon key={mod.id} name={mod.icon} size={12} className={getEffectStyles(mod.id).icon} />
  ));

  let ariaLabel = 'Добавить эффект';
  let shellCls = 'border border-dashed border-slate-700/40 text-slate-600 hover:border-slate-600/60';
  let body: React.ReactNode = <Sparkles className="w-3.5 h-3.5" />;

  if (soldierModifiers.length > 0) {
    ariaLabel = `${soldierModifiers.length} модификаторов на солдата`;
    shellCls = 'border border-slate-700/50 text-slate-300 hover:border-slate-600/60';
    body = <span className="flex flex-col items-center gap-0.5">{abilityNames}{modIcons}</span>;
  } else if (totalCount > 0) {
    const hasBuffs = buffCount > 0;
    const hasDebuffs = debuffCount > 0;
    ariaLabel = `${buffCount} баффов, ${debuffCount} дебаффов${staticAbilities.length > 0 ? `, спец-свойства: ${staticAbilities.map(b => b.name).join(', ')}` : ''}`;
    shellCls = hasBuffs && hasDebuffs
      ? 'border-amber-700/50 bg-amber-950/20 text-amber-400'
      : hasDebuffs
        ? 'border-red-700/50 bg-red-950/20 text-red-400'
        : 'border-emerald-700/50 bg-emerald-950/20 text-emerald-400';
    body = (
      <span className="flex flex-col items-center gap-0.5">
        <span className="flex items-center gap-0.5">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="text-[13px] font-mono font-black leading-none">{totalCount}</span>
        </span>
        {abilityNames}
      </span>
    );
  } else if (staticAbilities.length > 0) {
    ariaLabel = `Спец-свойства: ${staticAbilities.map(b => b.name).join(', ')}`;
    shellCls = 'border border-emerald-900/50 text-slate-300 hover:border-slate-600/60';
    body = <span className="flex flex-col items-center gap-0.5">{abilityNames}</span>;
  } else if (availableCount && availableCount > 0) {
    // «Доступно N» — возможность, не событие: тихий пунктир, янтарь в иконке
    ariaLabel = `${availableCount} эффектов доступно`;
    shellCls = 'border border-dashed border-slate-700/40 text-slate-400 hover:border-amber-600/50';
    body = (
      <span className="flex items-center gap-0.5">
        <Sparkles className="w-3 h-3 text-amber-400/70 shrink-0" />
        <span className="text-[10px] font-mono font-bold leading-none">{availableCount}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      // role явный: e2e баффов ищет [role="button"][aria-label=…] CSS-атрибутом
      role="button"
      data-testid="modifier-indicator"
      onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(); }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'min-w-[44px] min-h-[44px] rounded-lg bg-slate-800/60 flex items-center justify-center px-1 py-1 transition-all select-none',
        shellCls,
        !disabled && 'cursor-pointer hover:bg-slate-700/30 active:scale-[0.97]',
        disabled && 'opacity-30 cursor-not-allowed'
      )}
    >
      {body}
    </button>
  );
}

export function SoldierStats({
  soldier,
  className,
  distanceInputUnit = 'steps',
  stepToCmFactor = 5,
  disabled = false,
  onStatAction,
  onOpenActionMenu,
  buffCount,
  debuffCount,
  soldierModifiers = [],
  staticAbilities = [],
  availableBuffCount,
  onModifierClick,
  statBonuses,
  hideArmor = false,
  hideSpeed = false,
}: SoldierStatsProps) {
  const noRange = !soldier.range || soldier.range === '0' || soldier.range === 'ББ';
  const noPower = !soldier.power || soldier.power === '0';

  const formatBonus = (val?: number) => {
    if (val === undefined || val === 0) return undefined;
    return val > 0 ? `+${val}` : `${val}`;
  };

  const formatMultiplier = (val?: number) => {
    if (val === undefined || val === 1) return undefined;
    return `x${val}`;
  };

  const showArmorSpeed = !hideArmor || !hideSpeed;
  const hasRail = !!(onStatAction || onOpenActionMenu || onModifierClick);

  return (
    <div
      className={cn(
        // Клетки + узкая угловая колонка (44px): статы занимают всю ширину
        // карточки, спец-кнопки живут в углу (плейтест 2026-10-15)
        'grid gap-1 p-1 rounded-lg select-none',
        hasRail ? 'grid-cols-[1fr_1fr_1fr_auto]' : 'grid-cols-3',
        className
      )}
    >
      {/* Ряд брони/скорости — только когда у бойца свои значения (редкий
          случай; у типового отряда они на уровне отряда) */}
      {showArmorSpeed && (
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
          {hasRail ? <div aria-hidden="true" /> : null}
        </>
      )}

      {/* Боевые статы: тап = прямое действие (дальность/мощность → выстрел,
          ББ → ближний бой). «—»/«ББ» в дальности — отображение, не кнопка. */}
      <StatBadge
        icon={Target}
        value={noRange ? '—' : soldier.range}
        color="text-amber-400"
        disabled={disabled || noRange}
        bonus={noRange ? undefined : formatBonus(statBonuses?.rangeBonus)}
        statKey="range"
        onClick={onStatAction ? () => onStatAction('shot') : undefined}
        ariaLabel={noRange ? undefined : `Выстрел: дальность ${soldier.range}`}
        tall={!showArmorSpeed}
      />
      <StatBadge
        icon={Flame}
        value={noPower ? '—' : soldier.power}
        color="text-red-400"
        disabled={disabled || noPower}
        bonus={noPower ? undefined : formatBonus(statBonuses?.powerBonus)}
        statKey="power"
        onClick={onStatAction ? () => onStatAction('shot') : undefined}
        ariaLabel={noPower ? undefined : `Выстрел: мощность ${soldier.power}`}
        tall={!showArmorSpeed}
      />
      <StatBadge
        icon={Sword}
        value={soldier.melee.toString()}
        color="text-red-400"
        disabled={disabled}
        bonus={formatBonus(statBonuses?.meleeBonus)}
        statKey="melee"
        onClick={onStatAction ? () => onStatAction('melee') : undefined}
        ariaLabel={`Ближний бой: ${soldier.melee}`}
        tall={!showArmorSpeed}
      />

      {/* Угловая стопка: ✦ модификаторы (вся прежняя семантика кнопки
          эффектов) + ⋯ меню действий (граната, захват) */}
      {hasRail && (
        <div className="flex flex-col gap-1 row-span-2">
          <RailModifierButton
            buffCount={buffCount ?? 0}
            debuffCount={debuffCount ?? 0}
            soldierModifiers={soldierModifiers}
            staticAbilities={staticAbilities}
            availableCount={availableBuffCount}
            onClick={onModifierClick}
            disabled={disabled}
          />
          {onOpenActionMenu && (
            <button
              type="button"
              data-testid="action-menu-button"
              onClick={disabled ? undefined : (e) => { e.stopPropagation(); onOpenActionMenu(); }}
              disabled={disabled}
              aria-label="Все действия: граната, захват"
              className={cn(
                'min-w-[44px] min-h-[44px] rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 flex items-center justify-center transition-all select-none',
                !disabled && 'cursor-pointer hover:bg-slate-700/30 hover:border-slate-600/60 active:scale-[0.97]',
                disabled && 'opacity-30 cursor-not-allowed'
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
