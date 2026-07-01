import { RulesVersion, HitResult, DamageResult, MeleeResult, WeaponSpecial, AoEEffect, RepairEffect, BurstEffect, FortificationType, FORTIFICATION_MODIFIERS, Machine } from '../types';
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

export const communityStarSystemRules: RulesVersion = {
  id: 'community_star_system',
  name: 'Правила от Сообщества Star System',
  source: 'docs/star_system/fan_rules.md',
  description: 'Альтернативные правила с расширенными механиками. Используют зонную систему повреждений для техники и поддерживают спецэффекты оружия. Более сложные, но тактически глубокие правила для опытных игроков.',
  features: [
    'Зонные повреждения техники',
    'Паника при потере 50% отряда',
    'Укрытия: +к дистанции',
    'Боезапас по орудиям'
  ],
  color: '#3b82f6',
  link: 'https://vk.com/bp_bnp',
  supportsSpecialEffects: true, // Правила сообщества поддерживают расширенные special-эффекты

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
    _currentDurability?: number,
    _durabilityMax?: number,
    _vehicleData?: Machine
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

      // Обработка special-эффектов (Правила сообщества)
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

    // Vehicle target (community rules §6): armor = entered zone-max threshold (targetArmor);
    // each penetrating die deals damage scaled by die type (D6→1, D12→2, D20→3).
    if (isVehicle) {
      const zoneMax = targetArmor;
      let damage = 0;
      for (let i = 0; i < dice; i++) {
        const r = rollDie(sides) + bonus;
        rolls.push(r);
        if (r > zoneMax) {
          if (sides === 6) damage += 1;
          else if (sides === 12) damage += 2;
          else if (sides === 20) damage += 3;
          else damage += 1; // fallback for other die types
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

  calculateMelee: (attackerMelee: number, defenderArmor: number): MeleeResult => {
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderArmor;

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
