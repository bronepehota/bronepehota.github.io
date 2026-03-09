import { Target, Sword, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRange } from '@/lib/distance-utils';
import { Weapon } from '@/lib/types';

interface MachineWeaponsListProps {
  weapons: Weapon[];
  weaponShots: Record<number, number>;
  onWeaponAttack: (weaponIndex: number) => void;
  onWeaponInfo: (weaponIndex: number) => void;
  stepToCmFactor: number;
}

interface WeaponWithIndex {
  weapon: Weapon;
  originalIndex: number;
}

export function MachineWeaponsList({
  weapons,
  weaponShots,
  onWeaponAttack,
  onWeaponInfo,
  stepToCmFactor
}: MachineWeaponsListProps) {
  // Helper to check if weapon is non-ranged (melee/special)
  const isNonRangedWeapon = (weapon: Weapon) => {
    // Melee range (ББ)
    if (weapon.range === 'ББ') return true;
    // Power is a simple number (not dice notation like "2D6")
    const powerStr = String(weapon.power);
    if (/^\d+$/.test(powerStr)) return true;
    return false;
  };

  const allWeapons: WeaponWithIndex[] = weapons.map((weapon, idx) => ({
    weapon,
    originalIndex: idx
  }));

  const rangedWeapons = allWeapons.filter(({ weapon }) => !isNonRangedWeapon(weapon));
  const meleeWeapons = allWeapons.filter(({ weapon }) => isNonRangedWeapon(weapon));

  return (
    <>
      {/* Ranged Weapons - Full cards */}
      {rangedWeapons.map(({ weapon, originalIndex: weaponIdx }) => {
        const shots = weaponShots[weaponIdx] || 0;

        return (
          <div
            key={weaponIdx}
            className={cn(
              "relative p-1.5 md:p-2.5 rounded-sm flex gap-1.5 md:gap-3 transition-all overflow-hidden",
              shots > 0 ? "bg-amber-950/20" : "bg-slate-800/30"
            )}
          >
            {/* Tech corners for active weapon */}
            {shots === 0 && (
              <>
                <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-600/30" />
                <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-amber-600/30" />
              </>
            )}

            <div className="flex-1 flex flex-col min-w-0 gap-1.5">
              {/* Weapon Name Label - Small at top */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> {weapon.name}
                </span>
              </div>

              {/* Weapon Actions Row - Following soldier card pattern */}
              <div className="flex gap-0.5 md:gap-1">
                {/* Weapon Icon - Clickable for info */}
                <button
                  onClick={() => onWeaponInfo(weaponIdx)}
                  className="shrink-0 w-10 h-10 rounded-full bg-slate-900/60 flex items-center justify-center min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 hover:bg-slate-800/60 transition-all"
                  title="Информация об оружии"
                >
                  <Target className="w-5 h-5 text-slate-600" />
                </button>

                {/* Fire Button - Full width (flex-1) */}
                <button
                  onClick={() => onWeaponAttack(weaponIdx)}
                  className={cn(
                    "relative p-1.5 md:p-2 rounded-sm transition-all flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1 overflow-hidden",
                    "border-2 text-xs font-mono font-bold uppercase tracking-wider",
                    shots > 0
                      ? "bg-amber-950/40 border-amber-800/50 text-amber-700"
                      : "bg-amber-950/20 hover:bg-amber-950/40 border-amber-700/50 text-amber-400 active:scale-95"
                  )}
                  title="Выстрел"
                >
                  {shots === 0 && (
                    <>
                      <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-600/40" />
                      <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-amber-600/40" />
                    </>
                  )}
                  <Target className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">ВЫСТРЕЛ</span>
                </button>

                {/* Range Stat Display */}
                <div className="relative flex flex-col items-center justify-center p-1.5 md:p-2 rounded-lg md:rounded-full bg-slate-900/40 shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400 mb-0.5 shrink-0" />
                  <span className="text-[10px] md:text-xs font-mono font-bold text-amber-300 leading-tight flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px]">{weapon.range}</span>
                    <span className="text-[8px] md:text-[9px] opacity-80">{formatRange(weapon.range, 'cm', stepToCmFactor)}</span>
                  </span>
                </div>

                {/* Power Stat Display */}
                <div className="relative flex flex-col items-center justify-center p-1.5 md:p-2 rounded-lg md:rounded-full bg-slate-900/40 shrink-0 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0">
                  <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400 mb-0.5 shrink-0" />
                  <span className="text-[10px] md:text-xs font-mono font-bold text-red-300 leading-tight truncate w-full text-center" title={weapon.power}>
                    {weapon.power}
                  </span>
                </div>
              </div>

              {/* Weapon Special Badge - Only show special property badge */}
              {weapon.special && (
                <div className="flex items-center gap-2">
                  <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-sm bg-purple-950/30 text-purple-400 font-mono font-bold uppercase border border-purple-700/50 truncate">
                    {typeof weapon.special === 'string' ? weapon.special : 'Особый'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Melee Weapons - Compact section at bottom */}
      {meleeWeapons.length > 0 && (
        <div className="relative p-2 rounded-sm transition-all bg-red-950/10">
          {/* Section Header */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sword className="w-3 h-3 text-red-400" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-red-400">Ближний бой</span>
          </div>

          {/* Melee weapons list - compact format */}
          <div className="space-y-1">
            {meleeWeapons.map(({ weapon, originalIndex: weaponIdx }) => (
              <div
                key={weaponIdx}
                className="flex items-center gap-2 text-[8px] md:text-[9px]"
              >
                {/* Weapon name */}
                <span className="font-mono text-slate-300 truncate flex-1">{weapon.name}</span>

                {/* Power stat */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-950/60 px-1.5 py-0.5 rounded-full">
                  <span className="text-[7px] opacity-30 font-mono uppercase hidden sm:inline">МОЩН</span>
                  <span className="font-mono font-bold text-red-400">{weapon.power}</span>
                </div>

                {/* Info button */}
                <button
                  onClick={() => onWeaponInfo(weaponIdx)}
                  className="shrink-0 w-6 h-6 rounded border border-slate-700/50 bg-slate-900/60 flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-slate-800/60 transition-all"
                  title="Информация об оружии"
                >
                  <Target className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
