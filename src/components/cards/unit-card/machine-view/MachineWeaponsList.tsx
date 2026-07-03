import { Target, Sword, Flame, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Weapon } from '@/lib/types';

interface MachineWeaponsListProps {
  weapons: Weapon[];
  weaponShots: Record<number, number>;
  fireRate: number;
  totalShotsUsed: number;
  currentAmmo: number;
  maxAmmo: number;
  weaponAmmo?: number[];
  usePerWeaponAmmo: boolean;
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
  fireRate,
  totalShotsUsed,
  currentAmmo,
  maxAmmo,
  weaponAmmo,
  usePerWeaponAmmo,
  onWeaponAttack,
  onWeaponInfo,
  stepToCmFactor: _stepToCmFactor
}: MachineWeaponsListProps) {
  const isNonRangedWeapon = (weapon: Weapon) => {
    if (weapon.range === 'ББ') return true;
    const powerStr = String(weapon.power);
    if (/^\d+$/.test(powerStr)) return true;
    return false;
  };

  const weaponHasAmmo = (weaponIdx: number, weapon: Weapon): boolean => {
    if (isNonRangedWeapon(weapon)) return true;
    if (currentAmmo <= 0) return false;
    if (usePerWeaponAmmo) {
      return (weaponAmmo?.[weaponIdx] ?? weapon.ammo ?? 0) > 0;
    }
    return true;
  };

  const allWeapons: WeaponWithIndex[] = weapons.map((weapon, idx) => ({
    weapon,
    originalIndex: idx
  }));

  const rangedWeapons = allWeapons.filter(({ weapon }) => !isNonRangedWeapon(weapon));
  const meleeWeapons = allWeapons.filter(({ weapon }) => isNonRangedWeapon(weapon));

  return (
    <>
      {/* Ranged Weapons — clean tappable rows */}
      {rangedWeapons.map(({ weapon, originalIndex: weaponIdx }) => {
        const shots = weaponShots[weaponIdx] || 0;
        const isDisabled = totalShotsUsed >= fireRate || !weaponHasAmmo(weaponIdx, weapon);

        return (
          <div key={weaponIdx}>
            <div
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              onClick={() => !isDisabled && onWeaponAttack(weaponIdx)}
              onKeyDown={isDisabled ? undefined : (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onWeaponAttack(weaponIdx); } }}
              className={cn(
                "relative rounded-lg border flex items-center gap-1.5 p-1.5 transition-all overflow-hidden select-none",
                isDisabled
                  ? "bg-slate-900/30 border-slate-800/40 opacity-50 cursor-not-allowed"
                  : shots > 0
                    ? "bg-amber-950/15 border-amber-800/30 cursor-pointer hover:bg-amber-950/25 active:scale-[0.97]"
                    : "bg-slate-900/40 border-slate-700/40 cursor-pointer hover:bg-slate-800/50 active:scale-[0.97]"
              )}
              aria-label={isDisabled ? 'Оружие недоступно' : `Выстрел: ${weapon.name}`}
            >
              {/* Weapon name */}
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider truncate min-w-0 flex-1">
                {weapon.name}
              </span>

              {/* Special badge */}
              {weapon.special && (
                <span className="text-[8px] px-1 py-0.5 rounded-sm bg-purple-950/30 text-purple-400 font-mono font-bold uppercase border border-purple-700/50 truncate shrink-0">
                  {typeof weapon.special === 'string' ? weapon.special : 'Особый'}
                </span>
              )}

              {/* Range badge */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 border border-slate-700/40 px-1.5 min-h-[36px] min-w-[48px] flex-shrink-0">
                <Target className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="text-sm font-mono font-black leading-none text-amber-300">
                  {weapon.range}
                </span>
              </div>

              {/* Power badge */}
              <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 border border-slate-700/40 px-1.5 min-h-[36px] min-w-[48px] flex-shrink-0">
                <Flame className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span className="text-sm font-mono font-black leading-none text-red-300">
                  {weapon.power}
                </span>
              </div>

              {/* Info button */}
              <button
                onClick={(e) => { e.stopPropagation(); onWeaponInfo(weaponIdx); }}
                className="shrink-0 w-8 h-8 rounded-sm bg-slate-900/40 flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-slate-800/60 transition-all"
                title="Информация об оружии"
              >
                <Target className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Inline per-weapon ammo mini-bar (community rules only) */}
            {usePerWeaponAmmo && (
              (() => {
                const weaponAmmoCount = weaponAmmo?.[weaponIdx] ?? weapon.ammo ?? maxAmmo;
                const weaponMaxAmmo = weapon.ammo ?? maxAmmo;
                return (
                  <div className="flex items-center gap-1 px-1 mt-1" title="Боезапас орудия">
                    <Bomb className="w-2.5 h-2.5 text-blue-400/70 shrink-0" aria-hidden="true" />
                    <div className="flex-1 flex gap-px">
                      {Array.from({ length: weaponMaxAmmo }).map((_, i) => (
                        <div key={i} className={cn('h-1 flex-1 rounded-sm', i < weaponAmmoCount ? 'bg-blue-500' : 'bg-slate-800')} />
                      ))}
                    </div>
                    <span className="text-[9px] text-blue-400 font-mono">{weaponAmmoCount}/{weaponMaxAmmo}</span>
                  </div>
                );
              })()
            )}
          </div>
        );
      })}

      {/* Melee Weapons */}
      {meleeWeapons.length > 0 && (
        <div className="relative rounded-lg border border-red-900/20 bg-red-950/10 p-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Sword className="w-3 h-3 text-red-400" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-red-400">Ближний бой</span>
          </div>

          <div className="space-y-1">
            {meleeWeapons.map(({ weapon, originalIndex: weaponIdx }) => (
              <div
                key={weaponIdx}
                className="flex items-center gap-1.5"
              >
                <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider truncate flex-1">
                  {weapon.name}
                </span>

                {/* Power badge */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-800/60 border border-slate-700/40 rounded-lg px-1.5 min-h-[36px]">
                  <Flame className="w-3 h-3 text-red-400" />
                  <span className="font-mono font-black text-sm text-red-300">{weapon.power}</span>
                </div>

                {/* Attack button */}
                <button
                  onClick={() => onWeaponAttack(weaponIdx)}
                  className="shrink-0 w-8 h-8 rounded-sm border-2 border-red-700/50 bg-red-950/30 flex items-center justify-center min-w-[36px] min-h-[36px] hover:bg-red-950/50 hover:border-red-600/60 transition-all"
                  title="Атака"
                >
                  <Sword className="w-3 h-3 text-red-400" />
                </button>

                {/* Info button */}
                <button
                  onClick={() => onWeaponInfo(weaponIdx)}
                  className="shrink-0 w-7 h-7 rounded-sm border border-slate-700/40 bg-slate-900/40 flex items-center justify-center min-w-[32px] min-h-[32px] hover:bg-slate-800/60 transition-all"
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
