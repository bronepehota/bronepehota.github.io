import { useState } from 'react';
import { MachineAmmoPanel } from './machine-view/MachineAmmoPanel';
import { MachineWeaponsList } from './machine-view/MachineWeaponsList';
import { MachineStatusHeader } from './machine-view/MachineStatusHeader';
import { PilotModal } from './machine-view/PilotModal';
import { ArmyUnit, Machine, DurabilityZone, PilotInfo } from '@/lib/types';
import { Flame, Sword, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MachineViewProps {
  unit: ArmyUnit;
  zone: DurabilityZone;
  speed: number;
  maxSpeed?: number;
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
  onNavigateToUnit?: (unitInstanceId: string) => void;
  rulesVersion?: string;
  onMelee?: () => void;
  onRam?: () => void;
}

export function MachineView({
  unit,
  zone,
  speed,
  maxSpeed,
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
  onShowImage,
  onNavigateToUnit,
  rulesVersion,
  onMelee,
  onRam
}: MachineViewProps) {
  const machine = unit.data as Machine;
  const [pilotModalOpen, setPilotModalOpen] = useState(false);

  // Get pilot info from unit
  const pilotInfo: PilotInfo | null = unit.pilotInfo || null;

  const currentDurability = unit.currentDurability || 0;
  const maxDurability = machine.durability_max;

  // Melee capability = sum of all ББ (close-combat) weapon bonuses. Labels the
  // «Ближний бой» button. Melee is allowed even with ΣББ = 0 (#125).
  const meleeBonus = machine.weapons
    .filter(w => w.range === 'ББ')
    .map(w => parseInt(String(w.power), 10) || 0)
    .reduce((sum, bonus) => sum + bonus, 0);

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
          maxSpeed={maxSpeed}
          zone={zone}
          pilotInfo={pilotInfo}
          pilotLabel={pilotLabel}
          survivalTest={pilotSurvivalTest}
          onSurvivalTest={onPilotSurvivalTest}
          isPilotTestRunning={isPilotTestRunning}
          pilotTestUrgent={pilotTestUrgent}
          onOpenPilot={() => {
            if (!pilotInfo) onPilotAssign();
            else setPilotModalOpen(true);
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

      {/* Close-combat actions (#125). Melee always available; Ram = community only. */}
      <div className={cn("grid gap-1.5", rulesVersion === 'community_star_system' ? 'grid-cols-2' : 'grid-cols-1')}>
        <button
          type="button"
          disabled={isDestroyed}
          onClick={onMelee}
          className="min-h-[44px] rounded-lg px-2 py-2 text-xs font-bold border border-red-700/50 bg-red-950/30 text-red-300 hover:bg-red-950/50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
        >
          <Sword className="w-4 h-4" />
          Ближний бой{meleeBonus > 0 ? ` +${meleeBonus}` : ''}
        </button>
        {rulesVersion === 'community_star_system' && (
          <button
            type="button"
            disabled={isDestroyed}
            onClick={onRam}
            className="min-h-[44px] rounded-lg px-2 py-2 text-xs font-bold border border-amber-700/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4" />
            Таран
          </button>
        )}
      </div>

      {/* Pilot sheet — opened from PilotChip when a pilot is assigned */}
      {pilotInfo && (
        <PilotModal
          isOpen={pilotModalOpen}
          onClose={() => setPilotModalOpen(false)}
          pilotInfo={pilotInfo}
          pilotLabel={pilotLabel}
          pilotImage={pilotImage}
          survivalTest={pilotSurvivalTest}
          isTestRunning={isPilotTestRunning}
          onSurvivalTest={() => { setPilotModalOpen(false); onPilotSurvivalTest(); }}
          onAssignPilot={() => { setPilotModalOpen(false); onPilotAssign(); }}
          onNavigateToUnit={onNavigateToUnit}
        />
      )}
    </div>
  );
}
