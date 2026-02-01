import { RulesVersion, HitResult, DamageResult, MeleeResult, WeaponSpecial, FortificationType, FORTIFICATION_MODIFIERS } from '../types';
import { rollDie, parseRoll, executeRoll } from '../game-logic';

export const tehnologRules: RulesVersion = {
  id: 'tehnolog',
  name: 'Технолог',
  source: 'docs/original/official_rules.txt',
  description: 'Официальные правила игры от Технолог. Используют прямое сравнение для попадания и "виртуальную стрельбу" для урона — каждый кубик больше брони наносит 1 ранение. Простейшие и наиболее понятные правила для начинающих.',
  features: [
    'Виртуальная стрельба: кубик > брони = 1 ранение',
    'Укрытия добавляются к броне цели',
    'Простые расчёты без спецэффектов'
  ],
  color: '#ef4444',
  supportsSpecialEffects: false, // Технолог не поддерживает расширенные special-эффекты

  calculateHit: (rangeStr: string, distanceSteps: number, _fortification?: FortificationType): HitResult => {
    const { total, rolls, bonus } = executeRoll(rangeStr);
    return {
      success: total >= distanceSteps,
      roll: rolls[0] || 0,
      total,
      rolls,
      bonus
    };
  },

  calculateDamage: (powerStr: string, targetArmor: number, fortification: FortificationType = 'none', _special?: WeaponSpecial, _isVehicle?: boolean, _currentDurability?: number, _durabilityMax?: number): DamageResult => {
    const { dice, sides, bonus } = parseRoll(powerStr);

    // Apply fortification modifier to armor (official rules)
    const effectiveArmor = targetArmor + FORTIFICATION_MODIFIERS[fortification].armor;

    let damage = 0;
    const rolls = [];
    for (let i = 0; i < dice; i++) {
      const r = rollDie(sides) + bonus;
      rolls.push(r);
      if (r > effectiveArmor) {
        damage += 1;
      }
    }

    // Технолог игнорирует special-эффекты (базовая реализация)
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
