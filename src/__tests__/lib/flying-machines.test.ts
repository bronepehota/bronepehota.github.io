import { describe, it, expect } from '@jest/globals';
import type { Machine, ArmyUnit } from '@/lib/types';
import { canSoldierMelee } from '@/components/combat/ActionSelector';
import polarisMachines from '@/data/sources/star_system/polaris/machines.json';
import protectorateMachines from '@/data/sources/star_system/protectorate/machines.json';

/**
 * The 4 flying gravlets (Тандер, Хорнет, Спрут, Кондор) are the only machines
 * with `flying: true`. Their Star System costs are derived from the community
 * "Калькулятор техники" (tools/machine_cost_model.py): weapons + armor(durability)×10
 * + speed×10, double-move (ходы) and +40% flight premium; Hornet/Condor weapons
 * count double (mounted in pairs). This test pins the resulting data so a silent
 * regression (lost flag, reverted cost, wrong durability) breaks the build.
 */
const machines = [
  ...(polarisMachines as unknown as Machine[]),
  ...(protectorateMachines as unknown as Machine[]),
];

const EXPECTED: Record<string, { cost: number; durability_max: number }> = {
  thunder: { cost: 620, durability_max: 10 },
  hornet: { cost: 555, durability_max: 14 },
  octopus: { cost: 575, durability_max: 10 },
  condor: { cost: 665, durability_max: 14 },
};

describe('flying machines (Star System gravlets)', () => {
  it('exactly these 4 machines are flagged flying', () => {
    const flagged = machines.filter(m => m.flying).map(m => m.id).sort();
    expect(flagged).toEqual(['condor', 'hornet', 'octopus', 'thunder']);
  });

  for (const id of Object.keys(EXPECTED)) {
    describe(`${id}`, () => {
      const m = machines.find(x => x.id === id)!;

      it('is flagged flying', () => {
        expect(m.flying).toBe(true);
      });

      it(`cost = ${EXPECTED[id].cost} (calculator-derived)`, () => {
        expect(m.cost).toBe(EXPECTED[id].cost);
      });

      it(`durability_max (броня) = ${EXPECTED[id].durability_max}`, () => {
        expect(m.durability_max).toBe(EXPECTED[id].durability_max);
      });

      it('speed_sectors cover 1..durability_max with top speed 6', () => {
        const sectors = [...m.speed_sectors].sort((a, b) => a.min_durability - b.min_durability);
        expect(sectors[0].min_durability).toBe(1);
        expect(sectors[sectors.length - 1].max_durability).toBe(m.durability_max);
        expect(Math.max(...sectors.map(s => s.speed))).toBe(6);
      });
    });
  }
});

describe('canSoldierMelee — flying machines cannot melee (Star System)', () => {
  const mk = (flying: boolean): ArmyUnit =>
    ({ type: 'machine', data: { flying } } as unknown as ArmyUnit);

  it('hides melee for a flying machine', () => {
    expect(canSoldierMelee(mk(true), null)).toBe(false);
  });
  it('allows melee for a ground machine', () => {
    expect(canSoldierMelee(mk(false), null)).toBe(true);
  });
  it('allows melee in calculator mode (no unit)', () => {
    expect(canSoldierMelee(undefined, null)).toBe(true);
  });
});
