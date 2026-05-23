import { calculateSoldier, calculateSquadCost, calculateSquadSoldiers } from '@/lib/calculator-engine';
import type { CalculatorSoldierParams } from '@/lib/calculator-engine';

const baseParams: CalculatorSoldierParams = {
  race: 'human',
  squadType: 'shock',
  armor: 'heavy_infantry',
  weapon: 'pistol',
  twoWeapons: false,
  meleeWeapon: 'unarmed',
  property: 'jump_boost_5',
};

describe('calculateSoldier', () => {
  test('soldier 1: sniper + unarmed', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'sniper' });
    expect(result.rank).toBe(3);
    expect(result.speed).toBe(4);
    expect(result.range).toBe('Д12+2');
    expect(result.power).toBe('Д12');
    expect(result.melee).toBe(2);
    expect(result.armor).toBe(4);
    expect(result.costBreakdown.total).toBe(240);
  });

  test('soldier 2: plasma pistol + saw/electro', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'plasma_pistol', meleeWeapon: 'saw_electro' });
    expect(result.rank).toBe(3);
    expect(result.speed).toBe(4);
    expect(result.range).toBe('Д6');
    expect(result.power).toBe('Д6+3');
    expect(result.melee).toBe(5);
    expect(result.armor).toBe(4);
    expect(result.costBreakdown.total).toBe(225);
  });

  test('soldier 3: ATR + heavy ranged (zero melee)', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'atr', meleeWeapon: 'heavy_ranged' });
    expect(result.rank).toBe(3);
    expect(result.range).toBe('Д20');
    expect(result.power).toBe('Д12');
    expect(result.melee).toBe(0);
    expect(result.costBreakdown.total).toBe(240);
  });

  test('soldier 4: LMG + heavy ranged', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'lmg', meleeWeapon: 'heavy_ranged' });
    expect(result.range).toBe('Д12');
    expect(result.power).toBe('2Д12');
    expect(result.melee).toBe(0);
    expect(result.costBreakdown.total).toBe(260);
  });

  test('soldier 5: assault rifle + unarmed', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'assault_rifle' });
    expect(result.range).toBe('Д12');
    expect(result.power).toBe('2Д6');
    expect(result.melee).toBe(2);
    expect(result.costBreakdown.total).toBe(200);
  });

  test('soldier 6: SMG + unarmed', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'smg' });
    expect(result.range).toBe('Д6');
    expect(result.power).toBe('2Д6');
    expect(result.melee).toBe(2);
    expect(result.costBreakdown.total).toBe(185);
  });

  test('clone gets rank -1', () => {
    const result = calculateSoldier({ ...baseParams, race: 'clone', weapon: 'assault_rifle' });
    expect(result.rank).toBe(2);
    expect(result.costBreakdown.racePrice).toBe(10);
  });

  test('mutant gets mutantArmor when available', () => {
    const result = calculateSoldier({ ...baseParams, race: 'mutant', weapon: 'assault_rifle' });
    expect(result.armor).toBe(6);
    expect(result.costBreakdown.racePrice).toBe(40);
  });

  test('pistol with macedonian mode changes range/power', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'pistol', twoWeapons: true });
    expect(result.range).toBe('Д6-1');
    expect(result.power).toBe('2Д6');
  });

  test('SMG with macedonian mode changes range/power', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'smg', twoWeapons: true });
    expect(result.range).toBe('2Д6-1');
    expect(result.power).toBe('3Д6');
  });

  test('no property gives 0 property price', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'assault_rifle', property: null });
    expect(result.costBreakdown.propertyPrice).toBe(0);
  });
});

describe('calculateSquadCost', () => {
  test('calculates correct squad cost from Excel example', () => {
    const costs = [240, 225, 240, 260, 200, 185];
    expect(calculateSquadCost(costs)).toBe(135);
  });

  test('rounds up to nearest 5', () => {
    expect(calculateSquadCost([100])).toBe(10);
    expect(calculateSquadCost([103])).toBe(15);
    expect(calculateSquadCost([200, 200])).toBe(40);
  });
});

describe('calculateSquadSoldiers', () => {
  test('applies speed reduction when >2 heavy weapons in squad', () => {
    const params: CalculatorSoldierParams[] = [
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
    ];

    const results = calculateSquadSoldiers(params);
    results.forEach(r => {
      expect(r.speed).toBe(3);
    });
  });

  test('no speed reduction when <=2 heavy weapons', () => {
    const params: CalculatorSoldierParams[] = [
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'atr', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'assault_rifle', twoWeapons: false, meleeWeapon: 'unarmed', property: null },
    ];

    const results = calculateSquadSoldiers(params);
    results.forEach(r => {
      expect(r.speed).toBe(4);
    });
  });
});
