import { useState } from 'react';
import { MachineAmmoPanel } from './machine-view/MachineAmmoPanel';
import { MachineWeaponsList } from './machine-view/MachineWeaponsList';
import { MachineStatusHeader } from './machine-view/MachineStatusHeader';
import { PilotSheet } from './machine-view/PilotSheet';
import { ArmyUnit, Machine, DurabilityZone, PilotInfo } from '@/lib/types';
import { Flame, Wrench } from 'lucide-react';

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
  pilotLabel?: string;
  isPilotTestRunning: boolean;
  pilotTestUrgent: boolean;
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
  pilotLabel,
  isPilotTestRunning,
  pilotTestUrgent,
  usePerWeaponAmmo,
  distanceInputUnit,
  stepToCmFactor,
  imageUrl,
  machineName,
  isDestroyed,
  onShowImage
}: MachineViewProps) {
  const machine = unit.data as Machine;
  const [pilotSheetOpen, setPilotSheetOpen] = useState(false);

  // Get pilot info from unit
  const pilotInfo: PilotInfo | null = unit.pilotInfo || null;

  const currentDurability = unit.currentDurability || 0;
  const maxDurability = machine.durability_max;

  // Get weapon shots tracking from unit state
  const weaponShots: Record<number, number> = unit.machineWeaponShots || {};

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-3">
      {/* Machine Status Header — clean badges + PilotChip + durability bar */}
      {imageUrl ? (
        <MachineStatusHeader
          faction={machine.faction}
          imageUrl={imageUrl}
          machineName={machineName || machine.name}
          isDestroyed={isDestroyed || false}
          currentDurability={currentDurability}
          maxDurability={maxDurability}
          speed={speed}
          zone={zone}
          pilotInfo={pilotInfo}
          pilotLabel={pilotLabel}
          survivalTest={pilotSurvivalTest}
          onSurvivalTest={onPilotSurvivalTest}
          isPilotTestRunning={isPilotTestRunning}
          pilotTestUrgent={pilotTestUrgent}
          onOpenPilot={() => {
            if (!pilotInfo) onPilotAssign();
            else setPilotSheetOpen(true);
          }}
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

      {/* Damage / repair row — secondary controls */}
      {imageUrl && (
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => updateDurability(-1)}
            disabled={currentDurability === 0}
            className="flex-1 min-h-[44px] rounded-lg py-2 text-xs font-bold border bg-red-950/30 border-red-800/40 text-red-300 flex items-center justify-center gap-1.5 disabled:opacity-30"
          >
            <Flame className="w-4 h-4" /> <span>−1 Урон</span>
          </button>
          <button
            type="button"
            onClick={() => updateDurability(1)}
            disabled={currentDurability === maxDurability}
            className="flex-1 min-h-[44px] rounded-lg py-2 text-xs font-bold border bg-emerald-950/30 border-emerald-800/40 text-emerald-300 flex items-center justify-center gap-1.5 disabled:opacity-30"
          >
            <Wrench className="w-4 h-4" /> <span>+1 Ремонт</span>
          </button>
        </div>
      )}

      {/* Weapons List - always show for all rules versions */}
      <MachineWeaponsList
        weapons={machine.weapons}
        weaponShots={weaponShots}
        fireRate={machine.fire_rate}
        totalShotsUsed={unit.machineShotsUsed || 0}
        currentAmmo={unit.currentAmmo || 0}
        maxAmmo={machine.ammo_max}
        weaponAmmo={unit.weaponAmmo}
        usePerWeaponAmmo={usePerWeaponAmmo}
        onWeaponAttack={onWeaponAttack}
        onWeaponInfo={onWeaponInfo}
        stepToCmFactor={stepToCmFactor}
      />

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

      {/* Pilot sheet — opened from PilotChip when a pilot is assigned */}
      {pilotInfo && (
        <PilotSheet
          isOpen={pilotSheetOpen}
          onClose={() => setPilotSheetOpen(false)}
          pilotInfo={pilotInfo}
          pilotLabel={pilotLabel}
          pilotImage={pilotImage}
          survivalTest={pilotSurvivalTest}
          isTestRunning={isPilotTestRunning}
          onSurvivalTest={onPilotSurvivalTest}
          onAssignPilot={() => { setPilotSheetOpen(false); onPilotAssign(); }}
        />
      )}
    </div>
  );
}
