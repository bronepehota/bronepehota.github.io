// src/__tests__/lib/combatant-data.test.ts
import { soldierToCombatantData } from '@/lib/combatant-data';
import type { Soldier } from '@/lib/types';

const soldier: Soldier = {
  num: 1, rank: 3, speed: 5, range: 'D12', power: '2D6+1',
  melee: 4, armor: 2, props: [], image: '',
} as Soldier;

describe('soldierToCombatantData', () => {
  it('prefill из статов солдата', () => {
    expect(soldierToCombatantData(soldier)).toEqual({
      type: 'squad', range: 'D12', power: '2D6+1', melee: 4, armor: 2,
      rank: 3, grenadesAvailable: true,
    });
  });
  it('недостающие range/power остаются undefined (пусть DicePopup спросит)', () => {
    const s = { ...soldier, range: undefined as unknown as string, power: '' };
    const d = soldierToCombatantData(s);
    expect(d.range).toBeUndefined();
    expect(d.power).toBe('');
  });
});
