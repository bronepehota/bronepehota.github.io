import { MachineStatsPanel } from './machine-view/MachineStatsPanel';
import { MachineAmmoPanel } from './machine-view/MachineAmmoPanel';
import { MachinePilotPanel } from './machine-view/MachinePilotPanel';
import { MachineWeaponsList } from './machine-view/MachineWeaponsList';
import { ArmyUnit, Machine, DurabilityZone, RulesVersionID, PilotInfo } from '@/lib/types';

export interface MachineViewProps {
  unit: ArmyUnit;
  zone: DurabilityZone;
  speed: number;
  updateDurability: (delta: number) => void;
  updateAmmo?: (delta: number) => void;
  onWeaponAttack: (weaponIndex: number) => void;
  onWeaponInfo: (weaponIndex: number) => void;
  onPilotAssign: () => void;
  onPilotSurvivalTest: () => void;
  pilotSurvivalTest: { roll: number; survived: boolean; testedAt: number } | null;
  pilotImage: string | null;
  isPilotTestRunning: boolean;
  rulesVersion: RulesVersionID;
  usePerWeaponAmmo: boolean;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
}

export function MachineView({
  unit,
  zone,
  speed,
  updateDurability,
  updateAmmo,
  onWeaponAttack,
  onWeaponInfo,
  onPilotAssign,
  onPilotSurvivalTest,
  pilotSurvivalTest,
  pilotImage,
  isPilotTestRunning,
  rulesVersion,
  usePerWeaponAmmo,
  distanceInputUnit,
  stepToCmFactor
}: MachineViewProps) {
  const machine = unit.data as Machine;

  // Get pilot info from unit
  const pilotInfo: PilotInfo | null = (unit as any).pilotInfo || null;

  // Get weapon shots tracking from unit state
  const weaponShots: Record<number, number> = unit.machineWeaponShots || {};

  return (
    <div className="space-y-2">
      {/* Grid layout: Stats | Pilot, Ammo | Pilot (pilot spans 2 rows) */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        {/* Row 1: Stats Panel */}
        <MachineStatsPanel
          currentDurability={unit.currentDurability || 0}
          maxDurability={machine.durability_max}
          speed={speed}
          zone={zone}
          onUpdateDurability={updateDurability}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />

        {/* Pilot Panel - spans 2 rows */}
        <MachinePilotPanel
          pilotInfo={pilotInfo}
          pilotImage={pilotImage}
          survivalTest={pilotSurvivalTest}
          onAssignPilot={onPilotAssign}
          onSurvivalTest={onPilotSurvivalTest}
          isTestRunning={isPilotTestRunning}
        />

        {/* Row 2: Ammo Panel */}
        <MachineAmmoPanel
          currentAmmo={unit.currentAmmo || 0}
          maxAmmo={machine.ammo_max}
          shotsUsed={unit.machineShotsUsed || 0}
          fireRate={machine.fire_rate}
          weapons={machine.weapons}
          weaponAmmo={unit.weaponAmmo}
          onUpdateAmmo={updateAmmo}
          usePerWeaponAmmo={usePerWeaponAmmo}
        />
      </div>

      {/* Weapons List - only for Tehnolog rules */}
      {rulesVersion === 'tehnolog' && (
        <MachineWeaponsList
          weapons={machine.weapons}
          weaponShots={weaponShots}
          fireRate={machine.fire_rate}
          onWeaponAttack={onWeaponAttack}
          onWeaponInfo={onWeaponInfo}
          stepToCmFactor={stepToCmFactor}
        />
      )}
    </div>
  );
}
