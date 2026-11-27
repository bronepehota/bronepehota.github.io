import { ArmyUnit, Squad } from '@/lib/types';
import { cn } from '@/lib/utils';
import SoldierCard from '../SoldierCard';

interface SquadViewProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number, action: 'shot' | 'melee') => void;
  /** Тап по фото бойца: живой → лист действий, мёртвый/паникующий → зум.
   *  null в цепочку не приходит (закрытие оверлея — в UnitCard напрямую). */
  setShowSoldierImage: (idx: number) => void;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
  allUnits?: ArmyUnit[];
  getSoldierImage: (idx: number) => string;
  onNavigateToUnit?: (instanceId: string) => void;
  onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void;
  sourceId?: string;
  currentTurn?: number;
  hideArmor?: boolean;
  hideSpeed?: boolean;
}

export function SquadView({
  unit,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  distanceInputUnit,
  stepToCmFactor,
  allUnits = [],
  getSoldierImage,
  onNavigateToUnit,
  onSoldierModifierClick,
  sourceId,
  currentTurn,
  hideArmor = false,
  hideSpeed = false,
}: SquadViewProps) {
  const data = unit.data as Squad;

  return (
    <div data-testid="squad-list" className="flex flex-col min-h-full gap-1 md:gap-1.5 snap-y snap-mandatory">
      {data.soldiers.map((s, idx) => {
        // Мёртвый ряд — фиксированные 48px («строка потерь»): место отдаётся
        // живым рядам (fill-фича растягивает их фото). Оживление — свайп
        // вправо или лист по фото; 48px ≥ 44 тач-минимума.
        const isDead = unit.deadSoldiers?.includes(idx) || false;
        return (
          // overflow-x-clip: сдвинутая свайпом карточка (translateX до 96px)
          // раздувает scrollable-область скролл-предка → горизонтальный
          // скролл-бар внизу + дёргание раскладки на его появлении (плейтест
          // 2026-10-15). Клип на ближайшей границе — сдвиг никогда не выходит
          // за строку.
          <div
            key={`soldier-snap-${unit.instanceId}-${idx}`}
            data-testid={`squad-row-${idx}`}
            className={cn(
              'snap-start snap-always flex overflow-x-clip',
              // Потолок живого ряда = потолок фото (min(224px,40vw)) + паддинг
              // карточки: при гибели бойцов место распределяется КОНТРОЛИРУЕМО —
              // фото и бейджи растут вместе до общей планки, излишек уходит
              // тихим зазором вниз списка (репорт: «расширение остальных —
              // не контролируемое»)
              isDead ? 'flex-none h-12' : 'flex-1 max-h-[calc(min(224px,40vw)+10px)]'
            )}
          >
            <SoldierCard
              key={`soldier-${unit.instanceId}-${idx}-${s.num}`}
              squad={data}
              unit={unit}
              soldierIndex={idx}
            allUnits={allUnits}
            updateUnit={updateUnit}
            onSoldierAction={onSoldierAction}
            setShowSoldierImage={setShowSoldierImage}
            getSoldierImage={getSoldierImage}
            distanceInputUnit={distanceInputUnit}
            stepToCmFactor={stepToCmFactor}
            onNavigateToUnit={onNavigateToUnit}
            onSoldierModifierClick={onSoldierModifierClick}
            sourceId={sourceId}
            currentTurn={currentTurn}
            hideArmor={hideArmor}
            hideSpeed={hideSpeed}
          />
          </div>
        );
      })}
    </div>
  );
}
