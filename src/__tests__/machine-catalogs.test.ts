import { MONOBLOCKS, CHASSIS, ARSENAL_PRESETS, WEIGHT_SPEED_SECTORS } from '@/data/calculator/machine-catalogs';

describe('machine-catalogs', () => {
  test('monoblocks have the 5 known base stat sets', () => {
    const rm1 = MONOBLOCKS.find(m => m.id === 'РМ-1')!;
    expect(rm1.baseArmor).toBe(14);
    expect(rm1.baseSpeed).toBe(5);
    expect(rm1.ammoTonnage).toBe(18);
    expect(rm1.fireRate).toBe(2);
    expect(rm1.rank).toBe(3);
    expect(MONOBLOCKS).toHaveLength(5);
  });

  test('chassis modifiers match xlsx', () => {
    expect(CHASSIS.find(c => c.id === 'Шагатель')!.armorMod).toBe(0);
    expect(CHASSIS.find(c => c.id === 'Траккер')!.speedMod).toBe(-1);
    expect(CHASSIS.find(c => c.id === 'Гравилёт')!.armorMod).toBe(-4);
    expect(CHASSIS.find(c => c.id === 'Гравилёт')!.flyer).toBe(true);
    expect(CHASSIS.find(c => c.id === 'Стационарное')!.stationary).toBe(true);
  });

  test('arsenal presets carry verified xlsx costs', () => {
    expect(ARSENAL_PRESETS.find(p => p.id === 'gatling_mk20')!.expectedCost).toBe(57);
    expect(ARSENAL_PRESETS.find(p => p.id === 'shtorm')!.expectedCost).toBe(79);
    expect(ARSENAL_PRESETS.find(p => p.id === 'drakone_plamya')!.expectedCost).toBe(30);
    expect(ARSENAL_PRESETS.find(p => p.id === 'garpun_pb1m')!.expectedCost).toBe(73);
    // ББ weapons: cost == rank
    expect(ARSENAL_PRESETS.find(p => p.id === 'kleshnya')!.expectedCost).toBe(1);
  });

  test('weight speed sectors have 3 speeds each', () => {
    expect(WEIGHT_SPEED_SECTORS['Тяжёлый']).toEqual([4, 3, 2]);
  });
});
