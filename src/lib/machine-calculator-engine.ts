import type {
  MachineCalculatorParams, WeaponSlotConfig, MonoblockId, ChassisId,
} from '@/lib/editor/types';
import type { CustomSpeedSector, CustomWeapon } from '@/lib/editor/types';
import { MONOBLOCKS, CHASSIS, WEIGHT_SPEED_SECTORS, ARSENAL_PRESETS } from '@/data/calculator/machine-catalogs';

const RANGE_BASE: Record<number, number> = { 6: 10, 12: 40, 20: 80 };
const POWER_BASE: Record<number, number> = { 6: 20, 12: 80, 20: 160 };
const BONUS = 20;          // per "+1"
const AMMO = 10;           // per shot
const RANGE_TO5 = 5;       // final machine-cost rounding
const PROP_PRICE: Record<string, number> = { burst3: 20, blast1: 50, blast2: 100 };

export type Dice = { count: number; sides: number; bonus: number } | { kind: 'melee' } | null;

/** '2D20+3' -> {count,sides,bonus}; 'ББ' -> {kind:'melee'}; '' -> null. Accepts Д/D. */
export function parseDice(s: string | undefined | null): Dice {
  if (!s) return null;
  const str = String(s).trim().replace(/Д/g, 'D').replace(/д/g, 'D');
  if (str === 'ББ' || str === 'BB') return { kind: 'melee' };
  const m = str.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (m) return { count: m[1] ? parseInt(m[1], 10) : 1, sides: parseInt(m[2], 10), bonus: m[3] ? parseInt(m[3], 10) : 0 };
  return null;
}

function mult(count: number): number {
  return count === 1 ? 1 : 2 * count;   // 1->1, 2->4, 3->6
}

function dicePrice(spec: string, base: Record<number, number>): number {
  const d = parseDice(spec);
  if (!d || 'kind' in d) return 0;
  return (base[d.sides] ?? 0) * mult(d.count) + BONUS * d.bonus;
}

/** Стоимость одного слота орудия (ББ == ранг; пусто == 0). */
export function weaponCost(w: WeaponSlotConfig): number {
  const rp = parseDice(w.range);
  const pp = parseDice(w.power);
  const isMelee = (rp && 'kind' in rp) || (pp && 'kind' in pp);
  if (isMelee) {
    // ББ-оружие: цена == ранг (ceil(rank×10/10))
    const rank = parseInt(w.power, 10);
    return Number.isFinite(rank) ? rank : 0;
  }
  if (!w.range && !w.power) return 0;
  const raw = dicePrice(w.range, RANGE_BASE) + dicePrice(w.power, POWER_BASE)
    + (w.property ? PROP_PRICE[w.property] ?? 0 : 0) + AMMO * (w.ammo || 0);
  return Math.ceil(raw / 10);
}

export interface MachineCostBreakdown {
  weapons: number;       // Σ weaponCost
  armor: number;         // итоговая броня (=durability)
  speed: number;         // итоговая скорость
  armorCost: number;     // броня×10
  speedCost: number;     // скорость×10
  flyerPremium: boolean;
  total: number;         // итог с округлением ceil5
  derived: {
    durability_max: number;
    ammo_max: number;
    rank: number;
    fire_rate: number;
  };
}

function ceil5(n: number): number {
  return Math.ceil(n / RANGE_TO5) * RANGE_TO5;
}

/** Полная стоимость техники по параметрам калькулятора. */
export function machineCost(p: MachineCalculatorParams): MachineCostBreakdown {
  const mono = MONOBLOCKS.find(m => m.id === p.monoblock)!;
  const chassis = CHASSIS.find(c => c.id === p.chassis)!;
  const armor = mono.baseArmor + chassis.armorMod;
  const speed = chassis.stationary ? 0 : mono.baseSpeed + chassis.speedMod;

  const weapons = p.slots.reduce((s, w) => s + weaponCost(w), 0);
  const armorCost = armor * 10;
  const speedCost = speed * 10;

  let total = weapons + armorCost + speedCost;
  if (chassis.flyer) {
    total += speedCost;        // второй ход (move-shoot-move)
    total *= 1.4;              // полёт +40%
  }
  total = ceil5(total);

  return {
    weapons, armor, speed, armorCost, speedCost,
    flyerPremium: chassis.flyer,
    total,
    derived: { durability_max: armor, ammo_max: mono.ammoTonnage, rank: mono.rank, fire_rate: mono.fireRate },
  };
}

/** Сектора скорости из класса тонажа (3 сектора). Для Стационарное — один неподвижный. */
export function deriveSpeedSectors(monoblock: MonoblockId, chassis: ChassisId, durabilityMax: number): CustomSpeedSector[] {
  if (chassis === 'Стационарное') {
    return [{ min_durability: 1, max_durability: Math.max(1, durabilityMax), speed: 0 }];
  }
  const mono = MONOBLOCKS.find(m => m.id === monoblock)!;
  const speeds = WEIGHT_SPEED_SECTORS[mono.weightClass];
  const third = Math.max(1, Math.floor(durabilityMax / 3));
  return [
    { min_durability: durabilityMax - third + 1, max_durability: durabilityMax, speed: speeds[0] },
    { min_durability: third + 1, max_durability: durabilityMax - third, speed: speeds[1] },
    { min_durability: 1, max_durability: third, speed: speeds[2] },
  ];
}

/**
 * Оружие `special` для свойств орудия (дескрипторы строкой — конвенция данных кодбазы).
 * null → special опускается.
 */
function describeProperty(prop: WeaponSlotConfig['property']): string | undefined {
  switch (prop) {
    case 'burst3': return '3 выстрела в 3 направления';
    case 'blast1': return 'Взрыв: 1 шг −1Д12';
    case 'blast2': return 'Взрыв: 2 шг −1Д20';
    default:       return undefined;
  }
}

/**
 * Derive the `weapons[]` array for CustomMachine from calculator params.
 * Slots with empty range AND power are skipped. Returns [] when all slots empty.
 * ББ slots (range/power 'ББ' or power like '2') pass through with range:'ББ', power:'2'.
 */
export function deriveWeapons(params: MachineCalculatorParams): CustomWeapon[] {
  const weapons: CustomWeapon[] = [];
  for (const s of params.slots) {
    if (!s.range && !s.power) continue;            // empty slot
    const preset = ARSENAL_PRESETS.find(p => p.id === s.preset);
    const name = preset?.name ?? (s.preset === 'custom' ? 'Своё орудие' : 'Орудие');
    const weapon: CustomWeapon = { name, range: s.range, power: s.power };
    if (s.ammo) weapon.ammo = s.ammo;              // omit when 0
    const special = describeProperty(s.property);
    if (special) weapon.special = special;
    weapons.push(weapon);
  }
  return weapons;
}
