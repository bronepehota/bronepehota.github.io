import {
  RACES, SQUAD_TYPES, ARMOR_TYPES, WEAPONS, MELEE_WEAPONS, PROPERTIES,
  type RaceDef, type SquadTypeDef, type ArmorDef, type WeaponDef,
  type MeleeWeaponDef, type PropertyDef,
} from '@/data/calculator/calculator-catalogs';

export interface CalculatorSoldierParams {
  race: string;
  squadType: string;
  armor: string;
  weapon: string;
  twoWeapons: boolean;
  meleeWeapon: string;
  property: string | null;
}

export interface CostBreakdown {
  rankPrice: number;
  weaponPrice: number;
  meleePrice: number;
  propertyPrice: number;
  armorPrice: number;
  racePrice: number;
  total: number;
}

export interface CalculatedSoldier {
  rank: number;
  speed: number;
  range: string;
  power: string;
  melee: number;
  armor: number;
  costBreakdown: CostBreakdown;
}

function lookupRace(id: string): RaceDef {
  return RACES.find(r => r.id === id)!;
}
function lookupSquadType(id: string): SquadTypeDef {
  return SQUAD_TYPES.find(s => s.id === id)!;
}
function lookupArmor(id: string): ArmorDef {
  return ARMOR_TYPES.find(a => a.id === id)!;
}
function lookupWeapon(id: string): WeaponDef {
  return WEAPONS.find(w => w.id === id)!;
}
function lookupMeleeWeapon(id: string): MeleeWeaponDef {
  return MELEE_WEAPONS.find(m => m.id === id)!;
}
function lookupProperty(id: string | null): PropertyDef | undefined {
  if (!id) return undefined;
  return PROPERTIES.find(p => p.id === id);
}

function calculateMelee(
  meleeWeaponId: string,
  race: RaceDef,
  armor: ArmorDef,
  squadType: SquadTypeDef,
): number {
  if (meleeWeaponId === 'heavy_ranged') {
    return armor.id === 'exoskeleton' ? 3 : 0;
  }

  const baseValues: Record<string, number> = {
    unarmed: 2, knife: 3, cold_weapon: 4, saw_electro: 5, two_handed: 6,
  };
  const base = baseValues[meleeWeaponId] ?? 0;

  if (race.id === 'mutant') {
    const mutantValues: Record<string, number> = {
      unarmed: 4, knife: 4, cold_weapon: 6, saw_electro: 7, two_handed: 7,
    };
    return mutantValues[meleeWeaponId] ?? base;
  }
  if (armor.id === 'exoskeleton') {
    const exoValues: Record<string, number> = {
      unarmed: 3, knife: 4, cold_weapon: 5, saw_electro: 6, two_handed: 7,
    };
    return exoValues[meleeWeaponId] ?? base;
  }
  if (squadType.id === 'elite_heavy' || squadType.id === 'specnaz') {
    const eliteValues: Record<string, number> = {
      unarmed: 3, knife: 4, cold_weapon: 5, saw_electro: squadType.id === 'specnaz' ? 7 : 6, two_handed: 7,
    };
    return eliteValues[meleeWeaponId] ?? base;
  }
  if (race.id === 'clone') {
    const cloneValues: Record<string, number> = {
      unarmed: 3, knife: 3, cold_weapon: 5, saw_electro: 6, two_handed: 7,
    };
    return cloneValues[meleeWeaponId] ?? base;
  }
  return base;
}

export function calculateSoldier(params: CalculatorSoldierParams): CalculatedSoldier {
  const race = lookupRace(params.race);
  const squadType = lookupSquadType(params.squadType);
  const armorDef = lookupArmor(params.armor);
  const weapon = lookupWeapon(params.weapon);
  const meleeWeapon = lookupMeleeWeapon(params.meleeWeapon);
  const property = lookupProperty(params.property);

  const rank = Math.max(1, squadType.rank + race.rankBonus);
  const speed = armorDef.speed;

  const range = params.twoWeapons && weapon.macedonianRange
    ? weapon.macedonianRange
    : weapon.range;
  const power = params.twoWeapons && weapon.macedonianPower
    ? weapon.macedonianPower
    : weapon.power;

  const melee = calculateMelee(params.meleeWeapon, race, armorDef, squadType);

  const armorValue = race.id === 'mutant' && armorDef.mutantArmor
    ? armorDef.mutantArmor
    : armorDef.armor;

  const rankPrice = squadType.price;
  const weaponPrice = weapon.price;
  const meleePrice = meleeWeapon.price;
  const propertyPrice = property?.price ?? 0;
  const armorPrice = armorDef.price;
  const racePrice = race.price;
  const total = rankPrice + weaponPrice + meleePrice + propertyPrice + armorPrice + racePrice;

  return {
    rank,
    speed,
    range,
    power,
    melee,
    armor: armorValue,
    costBreakdown: {
      rankPrice,
      weaponPrice,
      meleePrice,
      propertyPrice,
      armorPrice,
      racePrice,
      total,
    },
  };
}

export function calculateSquadCost(soldierCosts: number[]): number {
  const sum = soldierCosts.reduce((a, b) => a + b, 0);
  const divided = sum / 10;
  return Math.ceil(divided / 5) * 5;
}

export function calculateSquadSoldiers(params: CalculatorSoldierParams[]): CalculatedSoldier[] {
  const heavyCount = params.filter(p => {
    const weapon = lookupWeapon(p.weapon);
    return weapon.isHeavy;
  }).length;

  return params.map(p => {
    const result = calculateSoldier(p);
    if (heavyCount > 2) {
      const armorDef = lookupArmor(p.armor);
      result.speed = armorDef.speedReduced;
    }
    return result;
  });
}
