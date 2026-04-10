/**
 * Конвертеры для преобразования CustomSource в SourceData
 * и мержа с базовыми источниками
 */

import { CustomSource, CustomSquad, CustomMachine, CustomFaction, CustomSoldier, CustomWeapon, CustomSpeedSector } from './types';
import { SourceData, Faction, Squad, Machine, Soldier, Weapon, SpeedSector, ArmyListSource } from '@/lib/types';

/**
 * Конвертирует CustomFaction в Faction
 */
export function convertFaction(custom: CustomFaction): Faction {
  return {
    id: custom.id,
    name: custom.name,
    color: custom.color,
    description: custom.description || '',
    homeWorld: '',
    motto: '',
  };
}

/**
 * Конвертирует CustomSoldier в Soldier
 */
export function convertSoldier(custom: CustomSoldier): Soldier {
  return {
    num: custom.num,
    rank: custom.rank,
    speed: custom.speed,
    range: custom.range,
    power: custom.power,
    melee: custom.melee,
    props: custom.props,
    armor: custom.armor,
    image: custom.image,
    modifiers: custom.modifiers,
  };
}

/**
 * Конвертирует CustomSquad в Squad
 */
export function convertSquad(custom: CustomSquad): Squad {
  return {
    id: custom.id,
    name: custom.name,
    shortName: custom.shortName,
    faction: custom.faction,
    cost: custom.cost,
    image: custom.image,
    soldiers: custom.soldiers.map(convertSoldier),
    buffs: custom.buffs,
  };
}

/**
 * Конвертирует CustomWeapon в Weapon
 */
export function convertWeapon(custom: CustomWeapon): Weapon {
  return {
    name: custom.name,
    range: custom.range,
    power: custom.power,
    ammo: custom.ammo,
    special: custom.special as Weapon['special'],
  };
}

/**
 * Конвертирует CustomSpeedSector в SpeedSector
 */
export function convertSpeedSector(custom: CustomSpeedSector): SpeedSector {
  return {
    min_durability: custom.min_durability,
    max_durability: custom.max_durability,
    speed: custom.speed,
  };
}

/**
 * Конвертирует CustomMachine в Machine
 */
export function convertMachine(custom: CustomMachine): Machine {
  return {
    id: custom.id,
    name: custom.name,
    shortName: custom.shortName,
    faction: custom.faction,
    cost: custom.cost,
    rank: custom.rank,
    fire_rate: custom.fire_rate,
    ammo_max: custom.ammo_max,
    durability_max: custom.durability_max,
    image: custom.image,
    weapons: custom.weapons.map(convertWeapon),
    speed_sectors: custom.speed_sectors.map(convertSpeedSector),
  };
}

/**
 * Конвертирует CustomSource в SourceData
 */
export function convertToSourceData(custom: CustomSource): SourceData {
  const source: ArmyListSource = {
    id: custom.id,
    name: custom.name,
    description: custom.description,
    version: custom.version,
  };

  return {
    source,
    factions: custom.factions.map(convertFaction),
    squads: custom.squads.map(convertSquad),
    machines: custom.machines.map(convertMachine),
  };
}

/**
 * Мержит кастомный источник с базовым
 * - Фракции: объединяются, кастомные переопределяют по ID
 * - Отряды: объединяются, кастомные переопределяют по ID
 * - Техника: объединяется, кастомная переопределяет по ID
 */
export function mergeWithBaseSource(
  custom: CustomSource,
  base: SourceData
): SourceData {
  // Базовая информация из кастомного источника
  const source: ArmyListSource = {
    id: custom.id,
    name: custom.name,
    description: custom.description,
    version: custom.version,
  };

  // Мерж фракций
  const baseFactionsMap = new Map(base.factions.map(f => [f.id, f]));
  for (const customFaction of custom.factions) {
    baseFactionsMap.set(customFaction.id, convertFaction(customFaction));
  }
  const mergedFactions = Array.from(baseFactionsMap.values());

  // Мерж отрядов
  const baseSquadsMap = new Map(base.squads.map(s => [s.id, s]));
  for (const customSquad of custom.squads) {
    baseSquadsMap.set(customSquad.id, convertSquad(customSquad));
  }
  const mergedSquads = Array.from(baseSquadsMap.values())
    .filter(s => !custom.hiddenUnits?.includes(s.id));

  // Мерж техники
  const baseMachinesMap = new Map(base.machines.map(m => [m.id, m]));
  for (const customMachine of custom.machines) {
    baseMachinesMap.set(customMachine.id, convertMachine(customMachine));
  }
  const mergedMachines = Array.from(baseMachinesMap.values())
    .filter(m => !custom.hiddenUnits?.includes(m.id));

  return {
    source,
    factions: mergedFactions,
    squads: mergedSquads,
    machines: mergedMachines,
  };
}

/**
 * Получает SourceData для кастомного источника
 * Если есть baseSource, мержит с ним
 */
export function getCustomSourceData(
  custom: CustomSource,
  getBaseSource: (id: string) => SourceData | null
): SourceData {
  if (custom.baseSource) {
    const base = getBaseSource(custom.baseSource);
    if (base) {
      return mergeWithBaseSource(custom, base);
    }
    // Если базовый источник не найден, работаем как новый источник
    console.warn(`Base source ${custom.baseSource} not found for ${custom.id}`);
  }

  return convertToSourceData(custom);
}
