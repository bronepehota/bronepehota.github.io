/**
 * Валидация данных редактора армлистов
 */

import { CustomSquad, CustomMachine, CustomSource, ValidationWarning, ValidationResult } from './types';

/**
 * Результат валидации dice notation
 */
interface DiceValidationResult {
  valid: boolean;
  warning?: string;
}

/**
 * Валидация dice notation
 * Поддерживаемые форматы:
 * - D6, D12, D20 - одиночные кубы
 * - D6+2, D12+1 - кубы с бонусом
 * - 2D12, 3D6 - несколько кубов
 * - 3D6+2 - несколько кубов с бонусом
 * - ББ - ближний бой
 * - "" - пусто (нет атаки)
 * - 5 - фиксированное число
 */
export function validateDiceNotation(input: string): DiceValidationResult {
  const trimmed = input.trim();

  // Пустая строка допустима (нет атаки)
  if (trimmed === '') {
    return { valid: true };
  }

  // ББ - ближний бой
  if (trimmed === 'ББ') {
    return { valid: true };
  }

  // Фиксированное число
  if (/^\d+$/.test(trimmed)) {
    return { valid: true };
  }

  // Проверка формата dice notation
  // Формат: [count]D<sides>[+bonus]
  const dicePattern = /^(\d+)?D(6|12|20)(\+\d+)?$/;

  if (!dicePattern.test(trimmed)) {
    return {
      valid: false,
      warning: `Неверный формат. Используйте: D6, D12, D20, 2D12, D6+2 или ББ`,
    };
  }

  return { valid: true };
}

/**
 * Валидация отряда
 */
export function validateSquad(squad: CustomSquad): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Проверка имени
  if (!squad.name || squad.name.trim() === '') {
    warnings.push({
      field: 'name',
      message: 'Название отряда не указано',
      severity: 'warning',
    });
  }

  // Проверка стоимости
  if (squad.cost <= 0) {
    warnings.push({
      field: 'cost',
      message: 'Стоимость должна быть больше 0',
      severity: 'warning',
    });
  }

  // Проверка солдат
  if (squad.soldiers.length === 0) {
    warnings.push({
      field: 'soldiers',
      message: 'Отряд должен содержать хотя бы одного солдата',
      severity: 'warning',
    });
  } else if (squad.soldiers.length > 6) {
    warnings.push({
      field: 'soldiers',
      message: `Отряд не может содержать более 6 солдат (сейчас: ${squad.soldiers.length})`,
      severity: 'warning',
    });
  }

  // Проверка каждого солдата
  squad.soldiers.forEach((soldier, index) => {
    // Проверка range
    const rangeResult = validateDiceNotation(soldier.range);
    if (!rangeResult.valid) {
      warnings.push({
        field: `soldiers[${index}].range`,
        message: `Дальность солдата ${index + 1}: ${rangeResult.warning}`,
        severity: 'warning',
      });
    }

    // Проверка power
    const powerResult = validateDiceNotation(soldier.power);
    if (!powerResult.valid) {
      warnings.push({
        field: `soldiers[${index}].power`,
        message: `Мощность солдата ${index + 1}: ${powerResult.warning}`,
        severity: 'warning',
      });
    }

    // Проверка брони
    if (soldier.armor < 0) {
      warnings.push({
        field: `soldiers[${index}].armor`,
        message: `Броня солдата ${index + 1} не может быть отрицательной`,
        severity: 'warning',
      });
    }

    // Проверка ранга
    if (soldier.rank < 0 || soldier.rank > 7) {
      warnings.push({
        field: `soldiers[${index}].rank`,
        message: `Ранг солдата ${index + 1} должен быть от 0 до 7`,
        severity: 'warning',
      });
    }
  });

  return {
    valid: true, // Всегда true - только предупреждения, не блокируем сохранение
    warnings,
  };
}

/**
 * Валидация техники
 */
export function validateMachine(machine: CustomMachine): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Проверка имени
  if (!machine.name || machine.name.trim() === '') {
    warnings.push({
      field: 'name',
      message: 'Название техники не указано',
      severity: 'warning',
    });
  }

  // Проверка стоимости
  if (machine.cost <= 0) {
    warnings.push({
      field: 'cost',
      message: 'Стоимость должна быть больше 0',
      severity: 'warning',
    });
  }

  // Проверка прочности
  if (machine.durability_max <= 0) {
    warnings.push({
      field: 'durability_max',
      message: 'Максимальная прочность должна быть больше 0',
      severity: 'warning',
    });
  }

  // Проверка боезапаса
  if (machine.ammo_max <= 0) {
    warnings.push({
      field: 'ammo_max',
      message: 'Максимальный боезапас должен быть больше 0',
      severity: 'warning',
    });
  }

  // Проверка оружия
  if (machine.weapons.length === 0) {
    warnings.push({
      field: 'weapons',
      message: 'Техника должна иметь хотя бы одно оружие',
      severity: 'warning',
    });
  } else if (machine.weapons.length > 4) {
    warnings.push({
      field: 'weapons',
      message: `Техника не может иметь более 4 орудий (сейчас: ${machine.weapons.length})`,
      severity: 'warning',
    });
  }

  // Проверка каждого оружия
  machine.weapons.forEach((weapon, index) => {
    // Проверка range
    const rangeResult = validateDiceNotation(weapon.range);
    if (!rangeResult.valid) {
      warnings.push({
        field: `weapons[${index}].range`,
        message: `Дальность оружия "${weapon.name}": ${rangeResult.warning}`,
        severity: 'warning',
      });
    }

    // Проверка power
    const powerResult = validateDiceNotation(weapon.power);
    if (!powerResult.valid) {
      warnings.push({
        field: `weapons[${index}].power`,
        message: `Мощность оружия "${weapon.name}": ${powerResult.warning}`,
        severity: 'warning',
      });
    }
  });

  // Проверка секторов скорости
  if (machine.speed_sectors.length === 0) {
    warnings.push({
      field: 'speed_sectors',
      message: 'Должен быть указан хотя бы один сектор скорости',
      severity: 'warning',
    });
  } else {
    // Проверка покрытия всего диапазона прочности
    const coverage = checkSpeedSectorsCoverage(machine.speed_sectors, machine.durability_max);
    if (!coverage.complete) {
      warnings.push({
        field: 'speed_sectors',
        message: `Секторы скорости не покрывают весь диапазон прочности. ${coverage.gaps.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  return {
    valid: true, // Всегда true - только предупреждения
    warnings,
  };
}

/**
 * Проверка покрытия секторов скорости
 */
function checkSpeedSectorsCoverage(
  sectors: { min_durability: number; max_durability: number; speed: number }[],
  maxDurability: number
): { complete: boolean; gaps: string[] } {
  const gaps: string[] = [];

  // Создаем массив всех значений прочности
  const covered = new Set<number>();

  sectors.forEach(sector => {
    for (let i = sector.min_durability; i <= sector.max_durability; i++) {
      covered.add(i);
    }
  });

  // Проверяем покрытие от 1 до maxDurability
  for (let i = 1; i <= maxDurability; i++) {
    if (!covered.has(i)) {
      gaps.push(`${i}`);
    }
  }

  // Группируем пропуски в диапазоны
  const gapRanges: string[] = [];
  let gapStart: number | null = null;

  for (let i = 1; i <= maxDurability + 1; i++) {
    if (!covered.has(i) && gapStart === null) {
      gapStart = i;
    } else if (covered.has(i) && gapStart !== null) {
      if (gapStart === i - 1) {
        gapRanges.push(`${gapStart}`);
      } else {
        gapRanges.push(`${gapStart}-${i - 1}`);
      }
      gapStart = null;
    }
  }

  return {
    complete: gapRanges.length === 0,
    gaps: gapRanges,
  };
}

/**
 * Валидация источника
 */
export function validateSource(source: CustomSource): ValidationResult {
  const warnings: ValidationWarning[] = [];

  // Проверка имени
  if (!source.name || source.name.trim() === '') {
    warnings.push({
      field: 'name',
      message: 'Название источника не указано',
      severity: 'warning',
    });
  }

  // Проверка фракций
  if (source.factions.length === 0) {
    warnings.push({
      field: 'factions',
      message: 'Источник должен содержать хотя бы одну фракцию',
      severity: 'warning',
    });
  }

  // Валидация отрядов
  source.squads.forEach((squad, index) => {
    const squadResult = validateSquad(squad);
    squadResult.warnings.forEach(w => {
      warnings.push({
        ...w,
        field: `squads[${index}].${w.field}`,
      });
    });
  });

  // Валидация техники
  source.machines.forEach((machine, index) => {
    const machineResult = validateMachine(machine);
    machineResult.warnings.forEach(w => {
      warnings.push({
        ...w,
        field: `machines[${index}].${w.field}`,
      });
    });
  });

  return {
    valid: true, // Всегда true - только предупреждения
    warnings,
  };
}
