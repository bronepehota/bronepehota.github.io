import { buildCalculatorModifierSummary } from '../lib/modifier-utils';
import { EMPTY_MODIFIER_SUMMARY } from '../lib/modifier-types';
import type { BuffDefinition, DebuffTemplate } from '../lib/modifier-types';

describe('buildCalculatorModifierSummary', () => {
  it('should return empty summary for no modifiers', () => {
    const result = buildCalculatorModifierSummary([], [], 'shot');
    expect(result).toEqual(EMPTY_MODIFIER_SUMMARY);
  });

  it('should aggregate buff values into summary', () => {
    const buffs: BuffDefinition[] = [
      { id: 'b1', name: 'Знамёносец', description: '+1 дальность', applyTo: ['army'], target: 'range_bonus', value: 1, phase: 'shot' },
    ];
    const result = buildCalculatorModifierSummary(buffs, [], 'shot');
    expect(result.rangeBonus).toBe(1);
    expect(result.descriptions).toContain('Знамёносец: +1 дальность');
  });

  it('should aggregate debuff values (negatives) into summary', () => {
    const debuffs: DebuffTemplate[] = [
      { id: 'd1', name: 'Подавление', description: '+1 дистанция', applyTo: ['army'], target: 'distance_penalty', value: 1, phase: 'shot', duration: 1 },
    ];
    const result = buildCalculatorModifierSummary([], debuffs, 'shot');
    expect(result.distancePenalty).toBe(1);
    expect(result.descriptions).toContain('Подавление: +1 дистанция');
  });

  it('should filter by phase (shot vs melee)', () => {
    const buffs: BuffDefinition[] = [
      { id: 'b1', name: 'Дальнобойность', description: '+2 дальность', applyTo: ['army'], target: 'range_bonus', value: 2, phase: 'shot' },
      { id: 'b2', name: 'Боевой клич', description: '+1 ББ', applyTo: ['soldier'], target: 'melee_bonus', value: 1, phase: 'melee' },
    ];
    const shotResult = buildCalculatorModifierSummary(buffs, [], 'shot');
    expect(shotResult.rangeBonus).toBe(2);
    expect(shotResult.meleeBonus).toBe(0);

    const meleeResult = buildCalculatorModifierSummary(buffs, [], 'melee');
    expect(meleeResult.rangeBonus).toBe(0);
    expect(meleeResult.meleeBonus).toBe(1);
  });

  it('should include both standard and custom modifiers', () => {
    const buffs: BuffDefinition[] = [
      { id: 'b1', name: 'Стандарт', description: '+1', applyTo: ['army'], target: 'range_bonus', value: 1, phase: 'shot' },
      { id: 'b2', name: 'Кастом', description: '+2', applyTo: ['army'], target: 'power_bonus', value: 2, phase: 'shot', isCustom: true },
    ];
    const result = buildCalculatorModifierSummary(buffs, [], 'shot');
    expect(result.rangeBonus).toBe(1);
    expect(result.powerBonus).toBe(2);
    expect(result.descriptions.length).toBe(2);
  });
});
