import { RulesVersion, HitResult, DamageResult, MeleeResult, WeaponSpecial, AoEEffect, RepairEffect, BurstEffect, FortificationType, FORTIFICATION_MODIFIERS, Machine, DurabilityZone } from '../types';
import { rollDie, parseRoll, executeRoll } from '../game-logic';

// Вспомогательные функции для парсинга special-эффектов
function parseAoEEffect(special: string): AoEEffect | null {
  // Парсинг формата "Взрыв 2ш - 1D20" или "Взрыв 3ш - 2D12"
  const aoeMatch = special.match(/Взрыв\s+(\d+)ш\s*[-–]\s*(\d+D\d+)/i);
  if (aoeMatch) {
    return {
      type: 'aoe',
      radius: parseInt(aoeMatch[1]),
      damage: aoeMatch[2]
    };
  }
  return null;
}

function parseRepairEffect(special: string): RepairEffect | null {
  // Парсинг формата "Ремонт 2 повреждения" или "Ремонт 2"
  const repairMatch = special.match(/Ремонт\s+(\d+)/i);
  if (repairMatch) {
    return {
      type: 'repair',
      amount: parseInt(repairMatch[1])
    };
  }
  return null;
}

function parseBurstEffect(special: string): BurstEffect | null {
  // Парсинг формата "3 выстрела в 3х направлениях"
  const burstMatch = special.match(/(\d+)\s+выстрел.*?(\d+)[xх]\s+направл/i);
  if (burstMatch) {
    const count = parseInt(burstMatch[1]);
    return {
      type: 'burst',
      count: count,
      directions: ['вперёд', 'влево-вперёд', 'вправо-вперёд'].slice(0, count)
    };
  }
  return null;
}

/**
 * Get durability zone for fan rules vehicle damage calculation
 * Uses explicit zones if provided, otherwise derives from speed_sectors
 */
function getDurabilityZone(
  machine: Machine | undefined,
  currentDurability: number
): DurabilityZone {
  if (machine?.durabilityZones && machine.durabilityZones.length > 0) {
    return machine.durabilityZones.find(
      zone => currentDurability <= zone.max
    ) || machine.durabilityZones[machine.durabilityZones.length - 1];
  }

  // Default: derive from speed_sectors (3 zones)
  // If machine data is not available, use generic zone calculation
  const max = machine?.durability_max || 9;

  // Create default zones based on durability max
  const zones: DurabilityZone[] = [
    {
      max: Math.ceil(max * 2 / 3),
      color: 'green',
      damagePerDie: { D6: 1, D12: 2, D20: 3 }
    },
    {
      max: Math.ceil(max / 3),
      color: 'yellow',
      damagePerDie: { D6: 1, D12: 2, D20: 3 }
    },
    {
      max: 0,
      color: 'red',
      damagePerDie: { D6: 1, D12: 2, D20: 3 }
    }
  ];

  return zones.find(zone => currentDurability > zone.max) || zones[2];
}

export const fanRules: RulesVersion = {
  id: 'fan',
  name: 'Фанатская Редакция',
  source: 'docs/panov/fan_rules.txt',
  description: 'Альтернативные правила от Панова с расширенными механиками. Используют зонную систему повреждений для техники и поддерживают спецэффекты оружия. Более сложные, но тактически глубокие правила для опытных игроков.',
  features: [
    'Зонные повреждения техники: зелёный/жёлтый/красный сектор',
    'Спецэффекты: Взрыв, Ремонт, Burst',
    'Укрытия увеличивают дистанцию'
  ],
  color: '#3b82f6',
  supportsSpecialEffects: true, // Фанатская редакция поддерживает расширенные special-эффекты

  calculateHit: (rangeStr: string, distanceSteps: number, fortification: FortificationType = 'none'): HitResult => {
    // Apply fortification modifier to distance (fan rules)
    const effectiveDistance = distanceSteps + FORTIFICATION_MODIFIERS[fortification].distance;

    const { total, rolls, bonus } = executeRoll(rangeStr);
    return {
      success: total >= effectiveDistance,
      roll: rolls[0] || 0,
      total,
      rolls,
      bonus
    };
  },

  calculateDamage: (
    powerStr: string,
    targetArmor: number,
    _fortification: FortificationType = 'none',
    special?: WeaponSpecial,
    isVehicle?: boolean,
    currentDurability?: number,
    durabilityMax?: number,
    vehicleData?: Machine
  ): DamageResult => {
    const { dice, sides, bonus } = parseRoll(powerStr);
    const rolls = [];

    // Handle special effects first (they override normal damage calculation)
    if (special) {
      let specialDamage = 0;
      for (let i = 0; i < dice; i++) {
        const r = rollDie(sides) + bonus;
        rolls.push(r);
        if (r > targetArmor) {
          specialDamage += 1;
        }
      }

      const result: DamageResult = { damage: specialDamage, rolls };

      // Обработка special-эффектов (Фанатская Редакция)
      if (typeof special === 'string') {
        const aoe = parseAoEEffect(special);
        if (aoe) {
          result.special = {
            type: 'aoe',
            description: `Взрыв в радиусе ${aoe.radius}ш`,
            additionalDamage: 0
          };
          return result;
        }

        const repair = parseRepairEffect(special);
        if (repair) {
          result.special = {
            type: 'repair',
            description: `Ремонт ${repair.amount} повреждений`,
            additionalDamage: -repair.amount
          };
          return result;
        }

        const burst = parseBurstEffect(special);
        if (burst) {
          result.special = {
            type: 'burst',
            description: `${burst.count} выстрела в ${burst.count} направлениях`,
            targets: burst.directions
          };
          return result;
        }
      } else if (special.type === 'aoe') {
        result.special = {
          type: 'aoe',
          description: `Взрыв в радиусе ${special.radius}ш`,
          additionalDamage: 0
        };
        return result;
      } else if (special.type === 'repair') {
        result.special = {
          type: 'repair',
          description: `Ремонт ${special.amount} повреждений` + (special.range ? ` (радиус ${special.range})` : ''),
          additionalDamage: -special.amount
        };
        return result;
      } else if (special.type === 'burst') {
        result.special = {
          type: 'burst',
          description: `${special.count} выстрела в ${special.count} направлениях`,
          targets: special.directions
        };
        return result;
      }

      return result;
    }

    // Vehicle attack uses zone-based damage (fan rules) - each die can add damage
    if (isVehicle && vehicleData && currentDurability !== undefined) {
      const zone = getDurabilityZone(vehicleData, currentDurability);
      const zoneMax = zone.max;
      const damagePerDie = zone.damagePerDie;
      let damage = 0;

      for (let i = 0; i < dice; i++) {
        const r = rollDie(sides) + bonus;
        rolls.push(r);

        // Check if die penetrates zone
        if (r > zoneMax) {
          // Add damage based on die type
          if (sides === 6) damage += damagePerDie.D6;
          else if (sides === 12) damage += damagePerDie.D12;
          else if (sides === 20) damage += damagePerDie.D20;
          else damage += 1; // Fallback for other die types
        }
      }

      return { damage, rolls };
    }

    // Infantry attack uses virtual fire - each die is an independent shot
    let damage = 0;
    for (let i = 0; i < dice; i++) {
      const r = rollDie(sides) + bonus;
      rolls.push(r);
      if (r > targetArmor) {
        damage += 1;
      }
    }

    return { damage, rolls };
  },

  calculateMelee: (attackerMelee: number, defenderMelee: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderMelee;

    let winner: 'attacker' | 'defender' | 'draw' = 'draw';
    if (aTotal > dTotal) winner = 'attacker';
    else if (dTotal > aTotal) winner = 'defender';

    return {
      attackerRoll: aRoll,
      attackerTotal: aTotal,
      defenderRoll: dRoll,
      defenderTotal: dTotal,
      winner
    };
  }
};
