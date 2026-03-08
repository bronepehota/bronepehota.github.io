import {
  parseMaxRange,
  convertRangeToCm,
  formatRange,
  stepsToCm,
  cmToSteps,
} from '@/lib/distance-utils';

describe('distance-utils', () => {
  describe('parseMaxRange', () => {
    it('should parse D6 as 6', () => {
      expect(parseMaxRange('D6')).toBe(6);
    });

    it('should parse D12 as 12', () => {
      expect(parseMaxRange('D12')).toBe(12);
    });

    it('should parse D20 as 20', () => {
      expect(parseMaxRange('D20')).toBe(20);
    });

    it('should parse D6+2 as 8 (6 + 2)', () => {
      expect(parseMaxRange('D6+2')).toBe(8);
    });

    it('should parse D12+1 as 13 (12 + 1)', () => {
      expect(parseMaxRange('D12+1')).toBe(13);
    });

    it('should return 0 for empty string', () => {
      expect(parseMaxRange('')).toBe(0);
    });

    it('should return 0 for "0"', () => {
      expect(parseMaxRange('0')).toBe(0);
    });

    it('should return 0 for "—" (dash)', () => {
      expect(parseMaxRange('—')).toBe(0);
    });

    it('should return 0 for "ББ" (melee)', () => {
      expect(parseMaxRange('ББ')).toBe(0);
    });

    it('should return 0 for invalid notation', () => {
      expect(parseMaxRange('INVALID')).toBe(0);
    });
  });

  describe('convertRangeToCm', () => {
    it('should convert D6 to 30cm with factor 5', () => {
      expect(convertRangeToCm('D6', 5)).toBe(30);
    });

    it('should convert D6 to 24cm with factor 4', () => {
      expect(convertRangeToCm('D6', 4)).toBe(24);
    });

    it('should convert D12 to 60cm with factor 5', () => {
      expect(convertRangeToCm('D12', 5)).toBe(60);
    });

    it('should convert D12 to 48cm with factor 4', () => {
      expect(convertRangeToCm('D12', 4)).toBe(48);
    });

    it('should convert D6+2 to 40cm with factor 5 (8 steps)', () => {
      expect(convertRangeToCm('D6+2', 5)).toBe(40);
    });

    it('should convert D6+2 to 32cm with factor 4 (8 steps)', () => {
      expect(convertRangeToCm('D6+2', 4)).toBe(32);
    });

    it('should return 0 for empty string', () => {
      expect(convertRangeToCm('', 5)).toBe(0);
    });

    it('should return 0 for "0"', () => {
      expect(convertRangeToCm('0', 5)).toBe(0);
    });

    it('should return 0 for "—" (dash)', () => {
      expect(convertRangeToCm('—', 5)).toBe(0);
    });

    it('should return 0 for "ББ" (melee)', () => {
      expect(convertRangeToCm('ББ', 5)).toBe(0);
    });
  });

  describe('formatRange', () => {
    it('should return dice notation for "steps" unit', () => {
      expect(formatRange('D6', 'steps', 5)).toBe('D6');
    });

    it('should return dice notation for "D12" with "steps" unit', () => {
      expect(formatRange('D12', 'steps', 5)).toBe('D12');
    });

    it('should return "30см" for D6 with "cm" unit and factor 5', () => {
      expect(formatRange('D6', 'cm', 5)).toBe('30см');
    });

    it('should return "24см" for D6 with "cm" unit and factor 4', () => {
      expect(formatRange('D6', 'cm', 4)).toBe('24см');
    });

    it('should return "60см" for D12 with "cm" unit and factor 5', () => {
      expect(formatRange('D12', 'cm', 5)).toBe('60см');
    });

    it('should return "40см" for D6+2 with "cm" unit and factor 5 (8 steps)', () => {
      expect(formatRange('D6+2', 'cm', 5)).toBe('40см');
    });

    it('should return "32см" for D6+2 with "cm" unit and factor 4 (8 steps)', () => {
      expect(formatRange('D6+2', 'cm', 4)).toBe('32см');
    });

    it('should return "—" for "0" input', () => {
      expect(formatRange('0', 'steps', 5)).toBe('—');
      expect(formatRange('0', 'cm', 5)).toBe('—');
    });

    it('should return "—" for "—" input', () => {
      expect(formatRange('—', 'steps', 5)).toBe('—');
      expect(formatRange('—', 'cm', 5)).toBe('—');
    });

    it('should return "—" for empty string', () => {
      expect(formatRange('', 'steps', 5)).toBe('—');
      expect(formatRange('', 'cm', 5)).toBe('—');
    });

    it('should return "ББ" as-is (melee notation)', () => {
      expect(formatRange('ББ', 'steps', 5)).toBe('ББ');
      expect(formatRange('ББ', 'cm', 5)).toBe('ББ');
    });
  });

  describe('stepsToCm', () => {
    it('should convert 5 steps to 25cm with factor 5', () => {
      expect(stepsToCm(5, 5)).toBe(25);
    });

    it('should convert 5 steps to 20cm with factor 4', () => {
      expect(stepsToCm(5, 4)).toBe(20);
    });

    it('should convert 1 step to 5cm with factor 5', () => {
      expect(stepsToCm(1, 5)).toBe(5);
    });

    it('should convert 10 steps to 50cm with factor 5', () => {
      expect(stepsToCm(10, 5)).toBe(50);
    });

    it('should convert 0 steps to 0cm', () => {
      expect(stepsToCm(0, 5)).toBe(0);
    });
  });

  describe('cmToSteps', () => {
    it('should convert 25cm to 5 steps with factor 5', () => {
      expect(cmToSteps(25, 5)).toBe(5);
    });

    it('should convert 20cm to 5 steps with factor 4', () => {
      expect(cmToSteps(20, 4)).toBe(5);
    });

    it('should convert 5cm to 1 step with factor 5', () => {
      expect(cmToSteps(5, 5)).toBe(1);
    });

    it('should convert 50cm to 10 steps with factor 5', () => {
      expect(cmToSteps(50, 5)).toBe(10);
    });

    it('should round 23cm to 5 steps with factor 5 (4.6 → 5)', () => {
      expect(cmToSteps(23, 5)).toBe(5);
    });

    it('should round 22cm to 4 steps with factor 5 (4.4 → 4)', () => {
      expect(cmToSteps(22, 5)).toBe(4);
    });

    it('should convert 0cm to 0 steps', () => {
      expect(cmToSteps(0, 5)).toBe(0);
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain consistency for steps → cm → steps with factor 5', () => {
      const original = 7;
      const cm = stepsToCm(original, 5);
      const back = cmToSteps(cm, 5);
      expect(back).toBe(original);
    });

    it('should maintain consistency for steps → cm → steps with factor 4', () => {
      const original = 6;
      const cm = stepsToCm(original, 4);
      const back = cmToSteps(cm, 4);
      expect(back).toBe(original);
    });
  });
});
