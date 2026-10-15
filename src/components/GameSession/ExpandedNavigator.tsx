'use client';

import { useMemo } from 'react';
import { Army, FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getFactionColors } from '@/lib/faction-colors';
import { deriveUnitStatus } from '@/lib/unit-status';
import { getArmyTurnProgress } from '@/lib/unit-utils';
import { ExpandedUnitRow } from './ExpandedUnitRow';

interface ExpandedNavigatorProps {
  army: Army;
  focusedUnitIdx: number;
  onSelectUnit: (idx: number) => void;
  /** Фактор шаг/см для строки статов (👣 5 (25см)) */
  stepToCmFactor?: number;
  /** Переключить «весь юнит походил» по instanceId */
  onToggleUnitDone?: (instanceId: string) => void;
}

/**
 * Развёрнутый навигатор — плоский список юнитов.
 * Без секций-групп (плейтест 2026-09-18: «группы не нужны, места
 * достаточно») — статус несёт сама строка: цветная полоса + метка.
 * Порядок армии стабилен, кроме убитых: их список уводит вниз и делает
 * компактными (плейтест: «по сути не сильно нужны»).
 *
 * Адаптив по размеру армии (плейтест 2026-09-19: «мало помещается — давай
 * в два ряда, можно поменьше изображение»): до 4 живых юнитов — крупные
 * полноширинные строки; от 5 — сетка в 2 колонки с мини-плитками (фото
 * сверху ~96px, имя+статы снизу; убитые — ещё компактнее в той же сетке).
 */
const GRID_ALIVE_THRESHOLD = 5;

export function ExpandedNavigator({ army, focusedUnitIdx, onSelectUnit, stepToCmFactor = 5, onToggleUnitDone }: ExpandedNavigatorProps) {
  const faction = (army.faction || 'polaris') as FactionID;
  const factionColors = getFactionColors(faction);

  const activeCount = useMemo(
    () => army.units.filter(u => deriveUnitStatus(u) === 'active').length,
    [army.units]
  );

  // Прогресс хода армии (плейтест 2026-10-15: «есть ли не походившие» —
  // видно в шапке списка): бойцы отрядов + машины (за единицу)
  const turnProgress = useMemo(() => getArmyTurnProgress(army.units), [army.units]);

  // Разом: порядок (живые, затем убитые) и число живых — один проход,
  // чтобы порог сетки и разбивка не могли разъехаться
  const { ordered, aliveCount } = useMemo(() => {
    const alive: Array<{ unit: Army['units'][number]; idx: number }> = [];
    const dead: Array<{ unit: Army['units'][number]; idx: number }> = [];
    army.units.forEach((unit, idx) =>
      (deriveUnitStatus(unit) === 'dead' ? dead : alive).push({ unit, idx })
    );
    return { ordered: [...alive, ...dead], aliveCount: alive.length };
  }, [army.units]);

  // Живых (вкл. походивших/захваченных) ≥5 — двухколоночная сетка плиток
  const gridMode = aliveCount >= GRID_ALIVE_THRESHOLD;

  // Строки строятся один раз; отличается только обёртка (сетка/колонка)
  const rows = ordered.map(({ unit, idx }) => (
    <ExpandedUnitRow
      key={unit.instanceId}
      unit={unit}
      isActive={focusedUnitIdx === idx}
      section={deriveUnitStatus(unit)}
      onClick={() => onSelectUnit(idx)}
      faction={faction}
      layout={gridMode ? 'tile' : 'row'}
      stepToCmFactor={stepToCmFactor}
      onToggleDone={onToggleUnitDone ? () => onToggleUnitDone(unit.instanceId) : undefined}
    />
  ));

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" data-testid="expanded-navigator">
      <div className="flex items-center px-3.5 py-2.5 bg-gradient-to-b from-[#0f1623] to-[#0a0e17] border-b border-slate-800 sticky top-0 z-10">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-mono">
          Полевой обзор
        </span>
        <span
          className={cn(
            'ml-2 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-slate-500/15',
            factionColors.text
          )}
          aria-label={`Активных юнитов: ${activeCount}`}
        >
          активн. {activeCount}
        </span>
        {turnProgress.total > 0 && (
          <span
            data-testid="nav-turn-progress"
            className={cn(
              'ml-1.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm',
              turnProgress.acted === turnProgress.total
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-500/15 text-slate-300'
            )}
            aria-label={`Походили: ${turnProgress.acted} из ${turnProgress.total}`}
          >
            ✓ {turnProgress.acted}/{turnProgress.total}
          </span>
        )}
        <span className="ml-auto text-slate-600 text-[11px]">
          ⟷ свайп вниз
        </span>
      </div>

      {gridMode ? (
        <div className="grid grid-cols-2 gap-1.5 items-start p-2 pt-1.5">
          {rows}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-slate-800/60 pb-2">
          {rows}
        </div>
      )}
    </div>
  );
}
