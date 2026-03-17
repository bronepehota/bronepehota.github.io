import { MachineAmmoPanel } from './machine-view/MachineAmmoPanel';
import { MachineWeaponsList } from './machine-view/MachineWeaponsList';
import { TacticalDashboard } from './machine-view/TacticalDashboard';
import { ArmyUnit, Machine, DurabilityZone, PilotInfo } from '@/lib/types';
import { Sword } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  usePerWeaponAmmo: boolean;
  distanceInputUnit: 'steps' | 'cm';
  stepToCmFactor: number;
  imageUrl?: string;
  machineName?: string;
  isDestroyed?: boolean;
  onShowImage?: () => void;
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
  usePerWeaponAmmo,
  distanceInputUnit,
  stepToCmFactor,
  imageUrl,
  machineName,
  isDestroyed,
  onShowImage
}: MachineViewProps) {
  const machine = unit.data as Machine;

  // Get pilot info from unit
  const pilotInfo: PilotInfo | null = (unit as any).pilotInfo || null;

  // Get weapon shots tracking from unit state
  const weaponShots: Record<number, number> = unit.machineWeaponShots || {};

  // Calculate total melee bonus from ББ weapons
  const meleeBonus = machine.weapons
    .filter(w => w.range === 'ББ')
    .map(w => parseInt(w.power, 10) || 0)
    .reduce((sum, bonus) => sum + bonus, 0);

  return (
    <div className="space-y-1.5">
      {/* Tactical Dashboard - Unified panel with machine image, stats, and pilot */}
      {imageUrl ? (
        <TacticalDashboard
          faction={machine.faction}
          imageUrl={imageUrl}
          machineName={machineName || machine.name}
          isDestroyed={isDestroyed || false}
          currentDurability={unit.currentDurability || 0}
          maxDurability={machine.durability_max}
          speed={speed}
          zone={zone}
          onUpdateDurability={updateDurability}
          pilotInfo={pilotInfo}
          pilotImage={pilotImage}
          survivalTest={pilotSurvivalTest}
          onAssignPilot={onPilotAssign}
          onSurvivalTest={onPilotSurvivalTest}
          isPilotTestRunning={isPilotTestRunning}
          onImageClick={onShowImage || (() => {})}
          distanceInputUnit={distanceInputUnit}
          stepToCmFactor={stepToCmFactor}
        />
      ) : (
        /* Fallback: Original layout if no image */
        <div className="relative bg-slate-900/60 p-2 rounded-sm border border-slate-700/50">
          <div className="text-center text-xs font-mono opacity-50">Нет изображения</div>
        </div>
      )}

      {/* Ammo Panel - full width */}
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

      {/* Weapons List - always show for all rules versions */}
      <MachineWeaponsList
        weapons={machine.weapons}
        weaponShots={weaponShots}
        fireRate={machine.fire_rate}
        totalShotsUsed={unit.machineShotsUsed || 0}
        currentAmmo={unit.currentAmmo || 0}
        weaponAmmo={unit.weaponAmmo}
        usePerWeaponAmmo={usePerWeaponAmmo}
        onWeaponAttack={onWeaponAttack}
        onWeaponInfo={onWeaponInfo}
        stepToCmFactor={stepToCmFactor}
      />

      {/* Ram attack button - disabled, not implemented */}
      <div
        className={cn(
          "relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-sm border-2",
          "bg-slate-900/30 border-slate-700/50 opacity-50 min-h-[48px]"
        )}
        title="Таран пехоты - в разработке"
      >
        <Sword className="w-5 h-5 text-slate-600" />
        <span className="text-sm font-mono font-bold uppercase tracking-wider text-slate-600">
          ТАРАН {meleeBonus > 0 && `+${meleeBonus}`}
        </span>
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[8px] font-mono font-bold bg-amber-600 text-white rounded-sm">
          СКОРО
        </span>
      </div>
    </div>
  );
}
