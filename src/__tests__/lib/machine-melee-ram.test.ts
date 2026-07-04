import {
  machineMeleeAttackerStrength,
  resolveMachineMeleeOutcome,
  ramInfantryKilled,
  calculateRam,
} from '@/lib/game-logic';

describe('machine melee strength', () => {
  it('currentDurability + ΣББ', () => {
    expect(machineMeleeAttackerStrength(8, 4)).toBe(12);
    expect(machineMeleeAttackerStrength(0, 0)).toBe(0);
  });
});

describe('resolveMachineMeleeOutcome (Таблица 7)', () => {
  it('attacker > defender → infantry destroyed', () => {
    const r = resolveMachineMeleeOutcome(15, 10, 'infantry');
    expect(r.outcome).toBe('destroyed');
    expect(r.winner).toBe('attacker');
    expect(r.damage).toBe(0);
  });
  it('attacker > defender → machine/artillery take damage = difference', () => {
    expect(resolveMachineMeleeOutcome(15, 10, 'machine')).toEqual({ winner: 'attacker', outcome: 'damage', damage: 5 });
    expect(resolveMachineMeleeOutcome(12, 10, 'artillery')).toEqual({ winner: 'attacker', outcome: 'damage', damage: 2 });
  });
  it('attacker ≤ defender → repelled (draw or defender wins)', () => {
    expect(resolveMachineMeleeOutcome(10, 15, 'infantry').outcome).toBe('repelled');
    expect(resolveMachineMeleeOutcome(10, 10, 'machine').outcome).toBe('repelled');
    expect(resolveMachineMeleeOutcome(10, 10, 'machine').winner).toBe('draw');
    expect(resolveMachineMeleeOutcome(5, 10, 'infantry').winner).toBe('defender');
  });
});

describe('ram table (Таран)', () => {
  it('1-4 killed, 5-6 survived', () => {
    expect(ramInfantryKilled(1)).toBe(true);
    expect(ramInfantryKilled(4)).toBe(true);
    expect(ramInfantryKilled(5)).toBe(false);
    expect(ramInfantryKilled(6)).toBe(false);
  });
  it('calculateRam returns one result per infantry, correct count, valid rolls', () => {
    const r = calculateRam(3);
    expect(r).toHaveLength(3);
    expect(r.map(x => x.index)).toEqual([0, 1, 2]);
    r.forEach(x => {
      expect(x.roll).toBeGreaterThanOrEqual(1);
      expect(x.roll).toBeLessThanOrEqual(6);
      expect(x.killed).toBe(ramInfantryKilled(x.roll));
    });
  });
  it('calculateRam(0) → empty', () => {
    expect(calculateRam(0)).toEqual([]);
  });
});
