import { Bomb, Target, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Weapon } from '@/lib/types';

// Helper to check if weapon is non-ranged (melee/special) - same logic as MachineWeaponsList
const isNonRangedWeapon = (weapon: Weapon) => {
  // Melee range (ББ)
  if (weapon.range === 'ББ') return true;
  // Power is a simple number (not dice notation like "2D6")
  const powerStr = String(weapon.power);
  if (/^\d+$/.test(powerStr)) return true;
  return false;
};

interface MachineAmmoPanelProps {
  currentAmmo: number;
  maxAmmo: number;
  shotsUsed: number;
  fireRate: number;
  weapons: Weapon[];
  weaponAmmo?: number[];
  onUpdateAmmo?: (delta: number) => void;
  usePerWeaponAmmo: boolean;
}

export function MachineAmmoPanel({
  currentAmmo,
  maxAmmo,
  shotsUsed,
  fireRate,
  weapons,
  weaponAmmo,
  onUpdateAmmo,
  usePerWeaponAmmo
}: MachineAmmoPanelProps) {
  return (
    <div className="space-y-1.5">
      {/* Ammo + Shots Combined - Tactical Display */}
      <div className="relative bg-slate-900/60 p-1.5 rounded-sm">
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-slate-600/50" />
        <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-slate-600/50" />
        <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-slate-600/50" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-slate-600/50" />

        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
            <Bomb className="w-2.5 h-2.5 md:w-3 md:h-3" /> Боезапас
          </span>
          <span className="text-[8px] md:text-[9px] font-mono opacity-40 uppercase flex items-center gap-1">
            <Target className="w-2.5 h-2.5 md:w-3 md:h-3" /> Выстрелы
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Ammo progress bar - Segmented (only for tehnolog rules) */}
          {!usePerWeaponAmmo ? (
            <div className="flex-1 flex items-center gap-1">
              <div className="flex-1 flex items-center gap-px">
                {Array.from({ length: maxAmmo }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 rounded-sm transition-all flex-1",
                      i < currentAmmo
                        ? "bg-blue-500"
                        : "bg-slate-800"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs md:text-sm font-mono font-black text-blue-400 min-w-[42px] text-right shrink-0">
                {currentAmmo}/{maxAmmo}
              </span>
              {/* Ammo increment/decrement buttons */}
              {onUpdateAmmo && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateAmmo(-1)}
                    disabled={currentAmmo <= 0}
                    className="w-6 h-6 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Уменьшить боезапас"
                  >
                    <Minus className="w-3 h-3 text-blue-400" />
                  </button>
                  <button
                    onClick={() => onUpdateAmmo(1)}
                    disabled={currentAmmo >= maxAmmo}
                    className="w-6 h-6 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center rounded-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Увеличить боезапас"
                  >
                    <Plus className="w-3 h-3 text-blue-400" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            (() => {
              // Calculate total ammo from all weapons for community_star_system
              const totalWeaponAmmo = weapons.reduce((sum, weapon, idx) => {
                return sum + (weaponAmmo?.[idx] ?? weapon.ammo ?? maxAmmo);
              }, 0);
              const maxWeaponAmmo = weapons.reduce((sum, weapon) => {
                return sum + (weapon.ammo ?? maxAmmo);
              }, 0);
              return (
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 flex items-center gap-px">
                    {Array.from({ length: Math.min(maxWeaponAmmo, 30) }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-2 rounded-sm transition-all flex-1",
                          i < totalWeaponAmmo
                            ? "bg-blue-500"
                            : "bg-slate-800"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs md:text-sm font-mono font-black text-blue-400 min-w-[42px] text-right shrink-0">
                    {totalWeaponAmmo}/{maxWeaponAmmo}
                  </span>
                </div>
              );
            })()
          )}

          {/* Shots count - Segmented */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="flex gap-px">
              {Array.from({ length: fireRate }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 rounded-sm transition-all flex-1",
                    i < shotsUsed
                      ? "bg-amber-500"
                      : "bg-slate-800"
                  )}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm font-mono font-black text-amber-400 min-w-[38px] text-right">
              {shotsUsed}/{fireRate}
            </span>
          </div>
        </div>
      </div>

      {/* Per-weapon ammo bars for community_star_system */}
      {usePerWeaponAmmo && weapons
        .map((weapon, idx) => ({ weapon, idx }))
        .filter(({ weapon }) => !isNonRangedWeapon(weapon))
        .map(({ weapon, idx }) => {
        const weaponAmmoCount = weaponAmmo?.[idx] ?? weapon.ammo ?? maxAmmo;
        const weaponMaxAmmo = weapon.ammo ?? maxAmmo;

        return (
          <div key={idx} className="bg-slate-900/40 p-2 rounded-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] md:text-[9px] font-mono opacity-60 uppercase">
                {weapon.name}
              </span>
              <span className="text-xs md:text-sm font-mono font-bold text-blue-400">
                {weaponAmmoCount}/{weaponMaxAmmo}
              </span>
            </div>
            <div className="flex items-center gap-px">
              {Array.from({ length: weaponMaxAmmo }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-sm transition-all flex-1",
                    i < weaponAmmoCount
                      ? "bg-blue-500"
                      : "bg-slate-800"
                  )}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
