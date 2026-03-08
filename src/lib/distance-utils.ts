/**
 * Distance utility functions for converting between dice notation and centimeters
 */

/**
 * Parse a dice notation string to extract the maximum range value
 * Handles formats: "D6", "D12", "D6+2", "2D6" (though range is typically single die)
 * @param rangeStr - Dice notation string (e.g., "D6", "D12+2")
 * @returns Maximum range in steps
 */
export function parseMaxRange(rangeStr: string): number {
  if (!rangeStr || rangeStr === '0' || rangeStr === '—') return 0;

  // Special case for "ББ" (melee) or other non-dice notations
  if (rangeStr.includes('ББ')) return 0;

  // Match formats like "D6", "D12", "D6+2", "2D12"
  const regex = /(?:(\d+))?D(\d+)(?:\+(\d+))?/;
  const match = rangeStr.match(regex);
  if (!match) return 0;

  const sides = parseInt(match[2]);
  const bonus = parseInt(match[3] || '0');

  // For range, we use the maximum possible roll
  return sides + bonus;
}

/**
 * Convert a dice range notation to centimeters
 * @param rangeStr - Dice notation string (e.g., "D6", "D12+2")
 * @param factor - Conversion factor (4 or 5 cm per step)
 * @returns Range in centimeters
 */
export function convertRangeToCm(rangeStr: string, factor: number): number {
  const maxRange = parseMaxRange(rangeStr);
  return maxRange * factor;
}

/**
 * Format a range value based on the preferred display unit
 * @param rangeStr - Dice notation string (e.g., "D6", "D12+2")
 * @param unit - Preferred display unit ('steps' or 'cm')
 * @param factor - Conversion factor (4 or 5 cm per step)
 * @returns Formatted range string for display
 */
export function formatRange(rangeStr: string, unit: 'steps' | 'cm', factor: number): string {
  if (!rangeStr || rangeStr === '0' || rangeStr === '—') return '—';

  // Special case for "ББ" (melee) or other non-dice notations
  if (rangeStr.includes('ББ')) return rangeStr;

  if (unit === 'cm') {
    const cm = convertRangeToCm(rangeStr, factor);
    return `${cm}см`;
  }

  // Default to dice notation for steps
  return rangeStr;
}

/**
 * Convert steps to centimeters
 * @param steps - Distance in steps
 * @param factor - Conversion factor (4 or 5 cm per step)
 * @returns Distance in centimeters
 */
export function stepsToCm(steps: number, factor: number): number {
  return steps * factor;
}

/**
 * Convert centimeters to steps (rounded)
 * @param cm - Distance in centimeters
 * @param factor - Conversion factor (4 or 5 cm per step)
 * @returns Distance in steps (rounded)
 */
export function cmToSteps(cm: number, factor: number): number {
  return Math.round(cm / factor);
}
