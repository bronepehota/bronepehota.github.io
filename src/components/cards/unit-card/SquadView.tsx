import { ArmyUnit, Squad } from '@/lib/types';
import SoldierCard from '../SoldierCard';

interface SquadViewProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
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
    <div className="grid grid-cols-1 gap-1 md:gap-1.5 snap-y snap-mandatory">
      {data.soldiers.map((s, idx) => (
        <div key={`soldier-snap-${unit.instanceId}-${idx}`} className="snap-start snap-always">
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
      ))}
    </div>
  );
}
