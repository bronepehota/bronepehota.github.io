// src/components/GameSession/ExpandedUnitRow.tsx
'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, Machine, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { BASE_PATH } from '@/lib/constants';
import { getAliveSoldiersCount, checkSquadUniformStats, getMachineSpeed } from '@/lib/unit-utils';
import type { UnitStatus } from '@/lib/unit-status';

interface ExpandedUnitRowProps {
  unit: ArmyUnit;
  /** focusedUnitIdx === idx (row tint) */
  isActive: boolean;
  section: UnitStatus;
  onClick: () => void;
  faction: FactionID;
  /**
   * row — полноширинная строка (крупное фото слева); tile — вертикальная
   * мини-плитка для 2-колоночной сетки больших армий (плейтест: «мало
   * помещается — давай в два ряда, можно поменьше изображение»).
   */
  layout?: 'row' | 'tile';
}

/**
 * Полноширинная строка юнита в развёрнутом навигаторе — главный способ
 * навигации в бою. Без групп и рамок (плейтест: секции не нужны, двойные
 * рамки мешали): статус — цветная полоса слева + метка-глиф справа,
 * распознавание — крупное фото (плейтест: «кто есть кто» на мобиле).
 */
const statusMark: Record<UnitStatus, {
  stripe: string;
  glyph: string;
  glyphClass: string;
  dim: string;
  nameClass: string;
  statusWord: string;
}> = {
  // Активный — нейтральная полоса (цвет фракции не используем: красный
  // должен означать только «убит», плейтест: «почему красный — активный?»)
  active: {
    stripe: 'bg-slate-800',
    glyph: '',
    glyphClass: '',
    dim: '',
    nameClass: 'text-slate-100',
    statusWord: 'активный',
  },
  done: {
    stripe: 'bg-emerald-500',
    glyph: '✓',
    glyphClass: 'text-emerald-400',
    dim: 'opacity-75',
    nameClass: 'text-slate-300',
    statusWord: 'походил',
  },
  dead: {
    stripe: 'bg-red-600',
    glyph: '✕',
    glyphClass: 'text-red-500',
    dim: 'opacity-50',
    nameClass: 'text-slate-400 line-through',
    statusWord: 'убит',
  },
  captured: {
    stripe: 'bg-orange-500',
    glyph: '⚑',
    glyphClass: 'text-orange-400',
    dim: 'opacity-55',
    nameClass: 'text-slate-400',
    statusWord: 'захвачен',
  },
};

/** Однострочная сводка статов: отряд — живые/броня/скорость, машина — HP/скорость. */
function getRowStatsLine(unit: ArmyUnit): string {
  if (unit.type === 'machine') {
    const machine = unit.data as Machine;
    const hp = `${unit.currentDurability ?? 0}/${machine.durability_max}`;
    return `HP ${hp} · 👣 ${getMachineSpeed(unit)}`;
  }
  const squad = unit.data as Squad;
  const parts = [`♥ ${getAliveSoldiersCount(unit)}/${squad.soldiers.length}`];
  const uniform = checkSquadUniformStats(unit);
  if (uniform.isUniformArmor && uniform.commonArmor !== undefined) {
    parts.push(`🛡 ${uniform.commonArmor}`);
  }
  if (uniform.isUniformSpeed && uniform.commonSpeed !== undefined) {
    parts.push(`👣 ${uniform.commonSpeed}`);
  }
  return parts.join(' · ');
}

export const ExpandedUnitRow = memo(function ExpandedUnitRow({
  unit,
  isActive,
  section,
  onClick,
  faction,
  layout = 'row',
}: ExpandedUnitRowProps) {
  const factionColors = getFactionColors(faction);
  const mark = statusMark[section];
  const isMachine = unit.type === 'machine';
  // Убитые — компактная строка (плейтест: «по сути не сильно нужны»)
  const compact = section === 'dead';

  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;
  const finalSrc = imageUrl?.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  const statsLine = getRowStatsLine(unit);

  if (layout === 'tile') {
    const deadTile = section === 'dead';
    return (
      <button
        onClick={onClick}
        aria-label={`${unit.data.name}, ${mark.statusWord}`}
        className={cn(
          'relative overflow-hidden rounded-sm text-left transition-colors',
          'active:bg-slate-800/60',
          isActive ? cn('bg-slate-800/40 hover:bg-slate-800/60', factionColors.bg) : 'hover:bg-slate-800/40',
          mark.dim
        )}
        data-testid={`expanded-unit-${unit.instanceId}`}
      >
        <div aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', mark.stripe)} />
        {/* Фото — портретный бокс по аспекту миниатюры (3:4), по центру:
            полноширинный ландшафтный кроп показывал «кусок юнита» (плейтест) */}
        <div className={cn('relative mx-auto aspect-[3/4] rounded-sm overflow-hidden bg-slate-900/80 flex items-center justify-center', deadTile ? 'h-14' : 'h-24')}>
          {finalSrc ? (
            <img
              src={finalSrc}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 15%' }}
            />
          ) : (
            <span className="text-slate-500 text-xs">IMG</span>
          )}
          <span className="absolute bottom-[2px] left-[4px] px-1 rounded-sm bg-black/70">
            <span className={cn('font-bold font-mono text-slate-300', deadTile ? 'text-[9px]' : 'text-[10px]')}>
              #{unit.instanceNumber || ''}
            </span>
          </span>
          {mark.glyph && (
            <span className={cn('absolute top-[2px] right-[2px] w-5 text-center font-black', deadTile ? 'text-sm' : 'text-base', mark.glyphClass)} aria-hidden="true">
              {mark.glyph}
            </span>
          )}
        </div>
        <div className="px-1.5 py-1 min-w-0">
          <div className={cn('font-bold font-mono uppercase tracking-wide truncate', deadTile ? 'text-[10px]' : 'text-[11px]', mark.nameClass)}>
            {unit.data.name}
          </div>
          <div className={cn('font-mono font-semibold truncate', deadTile ? 'mt-0.5 text-[9px] text-slate-600' : 'mt-0.5 text-[10px] text-slate-400')}>
            {statsLine}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-label={`${unit.data.name}, ${mark.statusWord}`}
      className={cn(
        'w-full flex items-center text-left transition-colors',
        compact ? 'gap-2 px-2 py-1' : 'gap-3 px-2 py-2',
        'active:bg-slate-800/60',
        // Focused row: единственный маркер — фракционный тинт фона
        // (никаких border+ring пар — плейтест: «двойные рамки»)
        isActive ? cn('bg-slate-800/40 hover:bg-slate-800/60', factionColors.bg) : 'hover:bg-slate-800/40',
        mark.dim
      )}
      data-testid={`expanded-unit-${unit.instanceId}`}
    >
      {/* Статусная полоса слева — цвет вместо группировки */}
      <div aria-hidden="true" className={cn('self-stretch w-1 shrink-0 rounded-full', mark.stripe)} />

      {/* Фото: крупное у живых (распознавание миниатюры), скромное у убитых */}
      <div className={cn(
        'relative shrink-0 aspect-[3/4] rounded-sm overflow-hidden bg-slate-900/80',
        compact ? 'w-14' : 'w-24'
      )}>
        {finalSrc ? (
          <img
            src={finalSrc}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 15%' }}
          />
        ) : (
          <span className="text-slate-500 text-xs">IMG</span>
        )}
        <span className="absolute bottom-[2px] left-[2px] px-1 rounded-sm bg-black/70">
          <span className={cn('font-bold font-mono text-slate-300', compact ? 'text-[9px]' : 'text-[10px]')}>
            #{unit.instanceNumber || ''}
          </span>
        </span>
      </div>

      {/* Полное имя + строка статов */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-bold font-mono uppercase tracking-wide truncate', compact ? 'text-xs' : 'text-sm', mark.nameClass)}>
          {unit.data.name}
        </div>
        <div className={cn(
          'font-mono font-semibold truncate',
          compact ? 'mt-0.5 text-[11px] text-slate-500' : 'mt-1.5 text-[13px] text-slate-300'
        )}>
          {statsLine}
        </div>
      </div>

      {/* Статусная метка справа */}
      {mark.glyph && (
        <span className={cn('shrink-0 w-6 font-black text-center', compact ? 'text-sm' : 'text-lg', mark.glyphClass)} aria-hidden="true">
          {mark.glyph}
        </span>
      )}
    </button>
  );
}, (prev, next) => {
  return (
    prev.unit.instanceId === next.unit.instanceId &&
    prev.isActive === next.isActive &&
    prev.section === next.section &&
    prev.faction === next.faction &&
    prev.unit.type === next.unit.type &&
    prev.unit.currentDurability === next.unit.currentDurability &&
    prev.unit.deadSoldiers?.length === next.unit.deadSoldiers?.length &&
    prev.layout === next.layout
  );
});
