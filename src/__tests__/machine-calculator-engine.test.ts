import { weaponCost, machineCost, parseDice, deriveWeapons } from '@/lib/machine-calculator-engine';
import { ARSENAL_PRESETS } from '@/data/calculator/machine-catalogs';
import type { WeaponSlotConfig, MachineCalculatorParams } from '@/lib/editor/types';

const slot = (over: Partial<WeaponSlotConfig>): WeaponSlotConfig => ({
  preset: 'custom', range: '', power: '', ammo: 0, property: null, ...over,
});

describe('parseDice', () => {
  test('parses Latin and Cyrillic dice', () => {
    expect(parseDice('D12')).toEqual({ count: 1, sides: 12, bonus: 0 });
    expect(parseDice('Д20')).toEqual({ count: 1, sides: 20, bonus: 0 });
    expect(parseDice('2D20')).toEqual({ count: 2, sides: 20, bonus: 0 });
    expect(parseDice('D6+2')).toEqual({ count: 1, sides: 6, bonus: 2 });
    expect(parseDice('3D12-1')).toEqual({ count: 3, sides: 12, bonus: -1 });
    expect(parseDice('ББ')!).toHaveProperty('kind', 'melee');
  });
});

describe('weaponCost', () => {
  test('ББ slot cost == rank', () => {
    expect(weaponCost(slot({ range: 'ББ', power: '2' }))).toBe(2);
    expect(weaponCost(slot({ range: 'ББ', power: '3' }))).toBe(3);
  });
  test('empty slot == 0', () => {
    expect(weaponCost(slot({ range: '', power: '' }))).toBe(0);
  });
  test('ranged: Гатлинг D12/3D12/БК5 -> 57', () => {
    expect(weaponCost(slot({ range: 'D12', power: '3D12', ammo: 5 }))).toBe(57);
  });
  test('ranged +bonus +property: Шторм D12/2D20/БК1/blast2 -> 79', () => {
    expect(weaponCost(slot({ range: 'D12', power: '2D20', ammo: 1, property: 'blast2' }))).toBe(79);
  });
  test('ranged +bonus: Гарпун D6+2/2D20/БК4 -> 73', () => {
    expect(weaponCost(slot({ range: 'D6+2', power: '2D20', ammo: 4 }))).toBe(73);
  });
  test('EVERY arsenal preset reproduces its xlsx expectedCost', () => {
    for (const p of ARSENAL_PRESETS) {
      expect(weaponCost(slot({ range: p.range, power: p.power, ammo: p.ammo, property: p.property }))).toBe(p.expectedCost);
    }
  });
});

const params = (over: Partial<MachineCalculatorParams>): MachineCalculatorParams => ({
  monoblock: 'УМ-1', chassis: 'Шагатель',
  slots: [slot({}), slot({}), slot({}), slot({}), slot({})],
  ...over,
});

describe('machineCost', () => {
  test('Грифон (УМ-1/Траккер) -> 305', () => {
    // D=гарпун(73) E=драк.пламя(30) F=кулак ББ2(2) G=кулак ББ2(2) H=MG-546X2(18)
    const p = params({
      monoblock: 'УМ-1', chassis: 'Траккер',
      slots: [
        slot({ range: 'D6+2', power: '2D20', ammo: 4 }),                 // гарпун 73
        slot({ range: 'D12', power: 'D20+3', ammo: 4 }),                  // драк.пламя 30
        slot({ range: 'ББ', power: '2' }),                                // кулак 2
        slot({ range: 'ББ', power: '2' }),                                // кулак 2
        slot({ range: 'D12', power: '2D6', ammo: 6 }),                    // MG-546X2 18
      ],
    });
    const r = machineCost(p);
    expect(r.armor).toBe(16);   // УМ-1 15 + Траккер 1
    expect(r.speed).toBe(2);    // УМ-1 3 + Траккер -1
    expect(r.total).toBe(305);
  });

  test('Локуст (УМ-2/Шагатель) -> 255 (ceil5 roundup)', () => {
    const p = params({
      monoblock: 'УМ-2', chassis: 'Шагатель',
      slots: [
        slot({}), slot({}),
        slot({ range: 'D12', power: '2D12', ammo: 5 }),                   // АТС-76 41
        slot({ range: 'D12', power: '2D12', ammo: 5 }),                   // АТС-76 41
        slot({}),
      ],
    });
    const r = machineCost(p);
    expect(r.armor).toBe(12);
    expect(r.speed).toBe(5);
    expect(r.total).toBe(255);  // 82 + 120 + 50 = 252 -> ceil5 -> 255
  });

  test('орудие (Стационарное) has NO speed term', () => {
    const p = params({
      monoblock: 'РМ-1', chassis: 'Стационарное',
      slots: [
        slot({ range: 'D12', power: 'D20', ammo: 3 }),                    // Молот 23
        slot({ range: 'D12', power: 'D20', ammo: 3 }),                    // Молот 23
        slot({}), slot({}), slot({}),
      ],
    });
    const r = machineCost(p);
    expect(r.speed).toBe(0);
    expect(r.total).toBe(190);  // 46 + 14×10(140) + 0 -> ceil5(186)=190
  });

  test('Гравилёт applies +second-move then ×1.40', () => {
    const p = params({
      monoblock: 'РМ-1', chassis: 'Гравилёт',
      slots: [
        slot({ range: 'D12', power: '2D6', ammo: 6 }),                    // MG-546X2 18
        slot({}), slot({}), slot({}), slot({}),
      ],
    });
    const r = machineCost(p);
    // броня 14-4=10, скорость 5+2=7; base 18+100+70=188; +70 second move=258; ×1.4=361.2; ceil5=365
    expect(r.armor).toBe(10);
    expect(r.speed).toBe(7);
    expect(r.flyerPremium).toBe(true);
    expect(r.total).toBe(365);
  });
});

describe('deriveWeapons', () => {
  test('Грифон-like params -> 5 weapons with correct name/range/power', () => {
    // D=гарпун(73) E=драк.пламя(30) F=кулак ББ2(2) G=кулак ББ2(2) H=MG-546X2(18)
    const p = params({
      monoblock: 'УМ-1', chassis: 'Траккер',
      slots: [
        slot({ preset: 'garpun_pb1m',      range: 'D6+2', power: '2D20',  ammo: 4 }), // Гарпун
        slot({ preset: 'drakone_plamya',   range: 'D12',  power: 'D20+3', ammo: 4 }), // Драк.пламя
        slot({ preset: 'kulak_manipulator', range: 'ББ',  power: '2' }),              // Кулак ББ2
        slot({ preset: 'kulak_manipulator', range: 'ББ',  power: '2' }),              // Кулак ББ2
        slot({ preset: 'mg_546x2',         range: 'D12',  power: '2D6',  ammo: 6 }),  // MG-546X2
      ],
    });
    const w = deriveWeapons(p);
    expect(w).toHaveLength(5);
    // Гарпун — preset name + full specs
    expect(w[0]).toMatchObject({
      name: 'Энергетический гарпун Power Bolt PB-1M',
      range: 'D6+2', power: '2D20', ammo: 4,
    });
    expect(w[0].special).toBeUndefined();
    // Драконье пламя
    expect(w[1]).toMatchObject({
      name: 'Плазменная пушка Драконье пламя',
      range: 'D12', power: 'D20+3', ammo: 4,
    });
    // ББ slots: range 'ББ', power '2'; ammo/special omitted (0 / null)
    expect(w[2]).toMatchObject({ range: 'ББ', power: '2' });
    expect(w[2].ammo).toBeUndefined();
    expect(w[2].special).toBeUndefined();
    expect(w[3]).toMatchObject({ range: 'ББ', power: '2' });
    // MG-546X2
    expect(w[4]).toMatchObject({
      name: 'Двуствольный лёгкий пулемёт MG-546X2',
      range: 'D12', power: '2D6', ammo: 6,
    });
  });

  test('all-empty slots -> []', () => {
    const p = params({ slots: [slot({}), slot({}), slot({}), slot({}), slot({})] });
    expect(deriveWeapons(p)).toEqual([]);
  });

  test('slot with property:blast2 -> weapon.special === "Взрыв: 2 шг −1Д20"', () => {
    const p = params({
      slots: [
        slot({ preset: 'shtorm', range: 'D12', power: '2D20', ammo: 1, property: 'blast2' }),
        slot({}), slot({}), slot({}), slot({}),
      ],
    });
    const w = deriveWeapons(p);
    expect(w).toHaveLength(1);
    expect(w[0].name).toBe('Спаренная пусковая Шторм');
    expect(w[0].special).toBe('Взрыв: 2 шг −1Д20');
  });

  test('slot with property:burst3 -> weapon.special === "3 выстрела в 3 направления"', () => {
    const p = params({
      slots: [
        slot({ preset: 'triplet_mk56', range: 'D12', power: '2D6', ammo: 6, property: 'burst3' }),
        slot({}), slot({}), slot({}), slot({}),
      ],
    });
    const w = deriveWeapons(p);
    expect(w).toHaveLength(1);
    expect(w[0].special).toBe('3 выстрела в 3 направления');
  });

  test('custom preset (no arsenal match) -> name "Своё орудие"', () => {
    const p = params({
      slots: [
        slot({ preset: 'custom', range: 'D20', power: 'D20', ammo: 3 }),
        slot({}), slot({}), slot({}), slot({}),
      ],
    });
    const w = deriveWeapons(p);
    expect(w).toHaveLength(1);
    expect(w[0].name).toBe('Своё орудие');
  });

  test('ammo:0 -> ammo field omitted', () => {
    const p = params({
      slots: [
        slot({ preset: 'custom', range: 'D20', power: 'D20', ammo: 0 }),
        slot({}), slot({}), slot({}), slot({}),
      ],
    });
    const w = deriveWeapons(p);
    expect(w).toHaveLength(1);
    expect(w[0].ammo).toBeUndefined();
  });
});
