// src/components/GameSession/ExpandedUnitRow.tsx
'use client';

import { memo } from 'react';
import { ArmyUnit, Squad, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { BASE_PATH } from '@/lib/constants';
import { formatUnitStatsParts, getUnitTurnProgress } from '@/lib/unit-utils';
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
  /** Фактор шаг/см для строки статов (👣 5 (25см)) */
  stepToCmFactor?: number;
  /** Тап по ✓ — весь юнит походил / снять отметку (активные и походившие) */
  onToggleDone?: () => void;
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

/** Однострочная сводка статов — формат в unit-utils.formatUnitStatsLine
 *  (скорость дублируется в сантиметрах: 👣 5 (25см)). */

/**
 * Общий блок фото строки и плитки навигатора: портретный бокс 3:4 по аспекту
 * миниатюры, «жизни» чипом в левом нижнем углу (в стиле номера — плейтест
 * 2026-10-15), номер взвода в левом верхнем, опциональная метка статуса
 * поверх фото (плитки; в строке метка справа от статов). boxClass задаёт
 * размеры и позиционирование бокса (h-* у плитки / w-* у строки).
 */
function UnitPhoto({ src, instanceNumber, boxClass, small, lives, glyph, glyphClass }: {
  src?: string;
  instanceNumber?: number;
  boxClass: string;
  /** компактный вариант (убитые строки): мельче номер и метка */
  small: boolean;
  /** «Жизни» — чип в левом нижнем углу фото (♥ отряда / HP машины) */
  lives?: string;
  glyph?: string;
  glyphClass?: string;
}) {
  return (
    <div className={cn('relative aspect-[3/4] rounded-sm overflow-hidden bg-slate-900/80', boxClass)}>
      {src ? (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          // Нативный drag картинки рвёт mouse-поток жеста закрытия листа
          // (mouseup не приходит, жест не завершается) — ревью #246
          draggable={false}
          className="w-full h-full object-cover"
          style={{ objectPosition: '50% 15%' }}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">IMG</span>
      )}
      <span className="absolute top-[2px] left-[2px] px-1 rounded-sm bg-black/70">
        <span className={cn('font-bold font-mono text-slate-300', small ? 'text-[9px]' : 'text-[10px]')}>
          #{instanceNumber || ''}
        </span>
      </span>
      {lives && (
        <span className="absolute bottom-[2px] left-[2px] px-1 rounded-sm bg-black/70">
          <span className={cn('font-bold font-mono text-slate-100', small ? 'text-[9px]' : 'text-[10px]')}>
            {lives}
          </span>
        </span>
      )}
      {glyph && (
        <span
          className={cn('absolute top-[2px] right-[2px] w-5 text-center font-black', small ? 'text-sm' : 'text-base', glyphClass)}
          aria-hidden="true"
        >
          {glyph}
        </span>
      )}
    </div>
  );
}

export const ExpandedUnitRow = memo(function ExpandedUnitRow({
  unit,
  isActive,
  section,
  onClick,
  faction,
  layout = 'row',
  stepToCmFactor = 5,
  onToggleDone,
}: ExpandedUnitRowProps) {
  const factionColors = getFactionColors(faction);
  const mark = statusMark[section];
  const isMachine = unit.type === 'machine';
  // Убитые — компактная строка (плейтест: «по сути не сильно нужны»)
  const compact = section === 'dead';
  // ✓-переключатель «весь юнит походил» — на живых (активных) и походивших;
  // у походивших кнопка залита и повторный тап снимает отметку
  const showDoneToggle = !!onToggleDone && (section === 'active' || section === 'done');

  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;
  const finalSrc = imageUrl?.startsWith('/images/')
    ? `${BASE_PATH}${imageUrl}`
    : imageUrl;

  // Жизни — чип на фото (левый нижний угол, стиль номера), броня/движение —
  // короткой строкой у имени (мобильный: каждая строка целиком на 320px)
  const { lives, stats } = formatUnitStatsParts(unit, stepToCmFactor);

  // Строка хода — только на частичном прогрессе: 0/N — отряд просто активный,
  // N/N — статус несёт полоса и ✓-кнопка (плейтест: видно, есть ли не
  // походившие бойцы)
  const progress = getUnitTurnProgress(unit);
  const showTurnLine = !!progress && progress.acted > 0 && !progress.all;

  // Маркер гранаты (раз на бой): яркая 💣 — доступна, приглушённая с
  // перечёркиванием — потрачена (плейтест: в списке отрядов должно быть
  // видно). У мёртвых и машин смысла нет. Живёт в конце строки статов —
  // правый столбец отдан кнопке хода, имя — во всю ширину.
  const grenadeMarker = unit.type === 'squad' && !compact ? (
    <span
      data-testid={`nav-grenade-${unit.instanceId}`}
      aria-label={unit.grenadesUsed ? 'Граната потрачена' : 'Граната доступна'}
      title={unit.grenadesUsed ? 'Граната потрачена' : 'Граната доступна'}
      className={cn('shrink-0 text-[12px] leading-none', unit.grenadesUsed && 'opacity-35 line-through')}
    >
      💣
    </span>
  ) : null;

  // Корень — div[role=button], а не <button>: внутри живая кнопка ✓
  // (вложенные <button> невалидны). ✓ гасит всплытие — тап по нему
  // не открывает карточку юнита.
  const doneToggleButton = showDoneToggle ? (
    <button
      type="button"
      data-testid={`unit-done-toggle-${unit.instanceId}`}
      aria-pressed={section === 'done'}
      aria-label={section === 'done' ? `Снять «походил»: ${unit.data.name}` : `Весь юнит походил: ${unit.data.name}`}
      onClick={(e) => { e.stopPropagation(); onToggleDone!(); }}
      className={cn(
        'shrink-0 min-w-[44px] min-h-[44px] rounded-lg border-2 flex items-center justify-center font-black text-xl leading-none transition-colors',
        section === 'done'
          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
          : 'border-slate-600/50 text-slate-500 hover:border-emerald-600/60 hover:text-emerald-400 active:bg-slate-800/60'
      )}
    >
      ✓
    </button>
  ) : null;

  const keyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
  };

  if (layout === 'tile') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={keyDown}
        aria-label={`${unit.data.name}, ${mark.statusWord}`}
        className={cn(
          'relative overflow-hidden rounded-sm text-left cursor-pointer transition-colors',
          'active:bg-slate-800/60',
          isActive ? cn('bg-slate-800/40 hover:bg-slate-800/60', factionColors.bg) : 'hover:bg-slate-800/40',
          mark.dim
        )}
        data-testid={`expanded-unit-${unit.instanceId}`}
      >
        <div aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', mark.stripe)} />
        {/* Фото — портретный бокс по аспекту миниатюры (3:4), по центру:
            полноширинный ландшафтный кроп показывал «кусок юнита» (плейтест).
            Убитая плитка того же размера — статус несёт полоса, ✕ и притенение
            (плейтест 2026-10-15: уменьшение в сетке смысла не имеет).
            Метку статуса на фото прячем, когда правый угол занимает кнопка ✓. */}
        <UnitPhoto
          src={finalSrc}
          instanceNumber={unit.instanceNumber}
          boxClass="mx-auto h-24"
          small={false}
          lives={lives}
          glyph={showDoneToggle ? undefined : mark.glyph}
          glyphClass={mark.glyphClass}
        />
        <div className="px-1.5 py-1 min-w-0 flex items-center gap-1">
          <div className="min-w-0 flex-1">
            <div className={cn('font-bold font-mono uppercase tracking-wide truncate text-[11px]', mark.nameClass)}>
              {unit.data.name}
            </div>
            {stats && (
              <div className="mt-0.5 text-[10px] font-mono font-semibold text-slate-400 truncate">
                {stats}
              </div>
            )}
            {showTurnLine && progress && (
              <div data-testid={`nav-turn-${unit.instanceId}`} className="mt-0.5 text-[10px] font-mono font-semibold text-slate-500 truncate">
                <span className="text-emerald-400">✓</span> {progress.acted}/{progress.alive}
              </div>
            )}
          </div>
          {grenadeMarker}
        </div>
        {/* ✓ поверх правого верхнего угла фото (кнопке 44px — плитка переносит) */}
        {doneToggleButton && (
          <div className="absolute top-0 right-0">
            {doneToggleButton}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={keyDown}
      aria-label={`${unit.data.name}, ${mark.statusWord}`}
      className={cn(
        'relative w-full flex items-center text-left cursor-pointer transition-colors',
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

      {/* Фото: крупное у живых (распознавание миниатюры), скромное у убитых.
          72px на узких экранах (320) — освобождает место статам, с 375px — 96px.
          Жизни — чипом в левом нижнем углу (стиль номера). */}
      <UnitPhoto
        src={finalSrc}
        instanceNumber={unit.instanceNumber}
        boxClass={cn('shrink-0', compact ? 'w-14' : 'w-[72px] min-[375px]:w-24')}
        small={compact}
        lives={lives}
      />

      {/* Полное имя — во всю ширину строки до двух строк (плейтест 2026-10-15:
          «больше места для названия, можно выше кнопки хода полное название»).
          Кнопка хода по центру справа, статам — её столбец (pr). */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-bold font-mono uppercase tracking-wide leading-tight',
          compact ? 'text-xs truncate' : 'text-sm line-clamp-2',
          mark.nameClass
        )}>
          {unit.data.name}
        </div>
        {!compact && (stats || grenadeMarker) && (
          <div className="mt-1 pr-[52px] flex items-center gap-1.5 text-[11px] min-[375px]:text-[12px] font-mono font-semibold text-slate-300">
            {stats && <span className="truncate">{stats}</span>}
            {grenadeMarker}
          </div>
        )}
        {showTurnLine && progress && (
          <div data-testid={`nav-turn-${unit.instanceId}`} className="mt-0.5 pr-[52px] text-[12px] font-mono font-semibold text-slate-500 truncate">
            <span className="text-emerald-400">✓</span> {progress.acted}/{progress.alive}
          </div>
        )}
      </div>

      {/* Правый столбец, по центру строки: ✓-переключатель всего юнита
          либо статусная метка (✕ убит, ⚑ захвачен) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center">
        {doneToggleButton ?? (
          mark.glyph ? (
            <span className={cn('w-6 font-black text-center', compact ? 'text-sm' : 'text-lg', mark.glyphClass)} aria-hidden="true">
              {mark.glyph}
            </span>
          ) : null
        )}
      </div>
    </div>
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
    prev.layout === next.layout &&
    prev.stepToCmFactor === next.stepToCmFactor &&
    prev.onToggleDone === next.onToggleDone &&
    // «походил» держится на actionsUsed (done-флаги) — длина не меняется
    prev.unit.actionsUsed === next.unit.actionsUsed &&
    prev.unit.isMachineDone === next.unit.isMachineDone &&
    prev.unit.grenadesUsed === next.unit.grenadesUsed
  );
});
