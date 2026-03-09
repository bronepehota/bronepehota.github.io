import { ArmyUnit, Squad, RulesVersionID } from '@/lib/types';
import SoldierCard from '../SoldierCard';

interface SquadViewProps {
  unit: ArmyUnit;
  updateUnit: (instanceId: string, updateFn: (currentUnit: ArmyUnit) => ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  setShowPanicModal: (show: boolean) => void;
  rulesVersion: RulesVersionID;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
  allUnits?: ArmyUnit[];
  getSoldierImage: (idx: number) => string;
}

export function SquadView({
  unit,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  setShowPanicModal,
  rulesVersion,
  distanceInputUnit,
  stepToCmFactor,
  allUnits = [],
  getSoldierImage,
}: SquadViewProps) {
  const data = unit.data as Squad;

  return (
    <div className="grid grid-cols-1 gap-1.5 md:gap-2">
      {data.soldiers.map((s, idx) => (
        <SoldierCard
          key={`soldier-${unit.instanceId}-${idx}-${s.num}`}
          squad={data}
          unit={unit}
          soldierIndex={idx}
          allUnits={allUnits}
          rulesVersion={rulesVersion}
          updateUnit={updateUnit}
          onSoldierAction={onSoldierAction}
          setShowSoldierImage={setShowSoldierImage}
          setShowPanicModal={setShowPanicModal}
          getSoldierImage={getSoldierImage}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      ))}
    </div>
  );
}
