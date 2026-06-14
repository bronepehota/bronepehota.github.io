import { addBonusToRoll, parseRoll } from '@/lib/game-logic';

describe('addBonusToRoll', () => {
  it('should add positive bonus to simple dice', () => {
    expect(addBonusToRoll('D6', 1)).toBe('D6+1');
  });

  it('should add negative bonus', () => {
    expect(addBonusToRoll('D6', -1)).toBe('D6-1');
  });

  it('should stack with existing bonus', () => {
    expect(addBonusToRoll('D6+2', 1)).toBe('D6+3');
  });

  it('should handle zero bonus (remove bonus)', () => {
    expect(addBonusToRoll('D6+2', -2)).toBe('D6');
  });

  it('should handle multi-dice notation', () => {
    expect(addBonusToRoll('2D12', 1)).toBe('2D12+1');
  });

  it('should handle D12 range', () => {
    expect(addBonusToRoll('D12', 2)).toBe('D12+2');
  });

  it('should stack with existing negative bonus', () => {
    expect(addBonusToRoll('D6-1', 2)).toBe('D6+1');
  });

  it('should cancel out negative bonus to zero (drop bonus)', () => {
    expect(addBonusToRoll('2D6-1', 1)).toBe('2D6');
  });

  it('should return ББ as-is', () => {
    expect(addBonusToRoll('ББ', 1)).toBe('ББ');
  });

  it('should handle empty/invalid string', () => {
    expect(addBonusToRoll('', 1)).toBe('');
  });
});

describe('addBonusToRoll integration with parseRoll', () => {
  it('bonus should be parseable back', () => {
    const result = addBonusToRoll('D6', 2);
    const parsed = parseRoll(result);
    expect(parsed.bonus).toBe(2);
    expect(parsed.sides).toBe(6);
  });

  it('negative bonus should round-trip through parseRoll', () => {
    const result = addBonusToRoll('D6', -1);
    const parsed = parseRoll(result);
    expect(result).toBe('D6-1');
    expect(parsed.bonus).toBe(-1);
    expect(parsed.sides).toBe(6);
  });
});
