/**
 * Unit Utilities
 *
 * Utility functions for unit count aggregation, numbering, and validation
 * for the Bronepehota tabletop wargame army builder.
 *
 * @module unit-utils
 */

import type { Army, ArmyUnit } from './types';

/**
 * Counts units by their template ID (Squad/Machine ID)
 *
 * @param units - Array of army units
 * @returns Record mapping unit ID to count
 *
 * @example
 * // Input: 3 "Light Assault Clones", 2 "Heavy Mechs"
 * countByUnitType(army.units);
 * // Output: { "polaris_light_assault_clone": 3, "polaris_heavy_mech": 2 }
 */
export function countByUnitType(units: ArmyUnit[]): Record<string, number> {
  return units.reduce((acc, unit) => {
    const key = unit.data.id;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Gets the next sequential instance number for a unit type
 *
 * @param army - Current army state
 * @param unitId - Template ID of unit type
 * @returns Next number to assign (1-indexed)
 *
 * @example
 * // Army has 2 "Light Assault Clones" (numbered 1 and 2)
 * getNextInstanceNumber(army, "polaris_light_assault_clone");
 * // Returns: 3
 */
export function getNextInstanceNumber(army: Army, unitId: string): number {
  const existing = army.units.filter(u => u.data.id === unitId);
  return existing.length + 1;
}

/**
 * Assigns an instance number to a unit
 *
 * @param unit - Unit to modify
 * @param number - Instance number to assign
 * @returns New unit with instanceNumber set
 */
export function assignInstanceNumber(unit: ArmyUnit, number: number): ArmyUnit {
  return {
    ...unit,
    instanceNumber: number,
  };
}

/**
 * Checks if a unit can be added (under 99 limit)
 *
 * @param army - Current army state
 * @param unitId - Template ID of unit type
 * @returns true if under 99 units of this type
 */
export function canAddUnit(army: Army, unitId: string): boolean {
  const count = army.units.filter(u => u.data.id === unitId).length;
  return count < 99;
}

/**
 * Validates adding a unit with detailed error
 *
 * @param army - Current army state
 * @param unitId - Template ID of unit type
 * @returns Validation result with optional Russian error message
 *
 * @example
 * // Army has 99 "Light Assault Clones"
 * validateAddUnit(army, "polaris_light_assault_clone");
 * // Returns: { valid: false, error: "Максимум 99 юнитов этого типа" }
 */
export function validateAddUnit(
  army: Army,
  unitId: string
): { valid: true } | { valid: false; error: string } {
  if (canAddUnit(army, unitId)) {
    return { valid: true };
  }
  return {
    valid: false,
    error: 'Максимум 99 юнитов этого типа',
  };
}

/**
 * Formats unit number for display
 *
 * @param unit - Unit with optional instanceNumber
 * @param fallbackIndex - Fallback array index if no instanceNumber
 * @returns Formatted string like "#1", "#2"
 *
 * @example
 * formatUnitNumber({ instanceNumber: 3 }); // "#3"
 * formatUnitNumber({ instanceNumber: undefined }, 2); // "#3" (fallback)
 */
export function formatUnitNumber(unit: ArmyUnit, fallbackIndex?: number): string {
  if (unit.instanceNumber) {
    return `#${unit.instanceNumber}`;
  }
  if (fallbackIndex !== undefined) {
    return `#${fallbackIndex + 1}`;
  }
  return '';
}

/**
 * Gets count badge text (null if count is 0)
 *
 * @param count - Current count of unit type
 * @returns String to display or null to hide badge
 *
 * @example
 * formatCountBadge(0); // null (don't show badge)
 * formatCountBadge(3); // "3"
 */
export function formatCountBadge(count: number): string | null {
  if (count === 0) {
    return null;
  }
  return String(count);
}

/**
 * Shortens weapon names for mobile display by replacing long Russian words with abbreviations
 *
 * @param name - Full weapon name in Russian
 * @returns Shortened weapon name
 *
 * @example
 * shortenWeaponName("шестиствольная скорострельная пусковые установки");
 * // Returns: "6-ств. скор. ПУ"
 * shortenWeaponName("автоматическая бронебойная");
 * // Returns: "авт. бронеб."
 */
export function shortenWeaponName(name: string): string {
  return name
    .replace(/шестиствольная/gi, '6-ств.')
    .replace(/четырехствольная/gi, '4-ств.')
    .replace(/трехствольная/gi, '3-ств.')
    .replace(/двуствольная/gi, '2-ств.')
    .replace(/двуствольный/gi, '2-ств.')
    .replace(/скорострельные/gi, 'скор.')
    .replace(/автоматическая/gi, 'авт.')
    .replace(/автоматический/gi, 'авт.')
    .replace(/бронебойная/gi, 'бронеб.')
    .replace(/бронебойный/gi, 'бронеб.')
    .replace(/пусковые установки/gi, 'ПУ')
    .replace(/управляемые ракеты/gi, 'УР')
    .replace(/стандартный/gi, 'станд.')
    // Clean up extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}
