# Squad Calculator Editor Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Excel squad cost calculator into the desktop editor as a second tab in SquadEditor, with auto-calculated soldier stats and squad cost.

**Architecture:** Static catalog data file feeds a pure calculation engine. A new `SoldiersCalculator` component renders dropdown selects per soldier, computes stats instantly, and writes results to squad data on "Apply". SquadEditor gains a tab switcher between manual and calculator modes.

**Tech Stack:** TypeScript, React, Tailwind CSS, Next.js 14, Jest (unit tests), Playwright (E2E tests)

**Spec:** `docs/superpowers/specs/2026-05-23-squad-calculator-editor-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/data/calculator/calculator-catalogs.ts` | Static lookup tables (races, armor, weapons, melee, squad types, properties) |
| Create | `src/lib/calculator-engine.ts` | Pure calculation functions |
| Create | `src/__tests__/calculator-engine.test.ts` | Unit tests for calculation engine |
| Create | `src/components/editor/SoldiersCalculator.tsx` | Calculator UI component |
| Modify | `src/components/editor/SquadEditor.tsx` | Add tab switcher |
| Create | `e2e/calculator.spec.ts` | E2E test for calculator flow |

---

### Task 1: Calculator Catalog Data

**Files:**
- Create: `src/data/calculator/calculator-catalogs.ts`

- [ ] **Step 1: Create directory and catalog file**

```bash
mkdir -p src/data/calculator
```

Create `src/data/calculator/calculator-catalogs.ts` with all static lookup tables extracted from the Excel. Each table is a `const` array exported for use by the engine.

Key types to define inline:

```typescript
export interface RaceDef {
  id: string;
  name: string;
  rankBonus: number;    // -1 for clone, 0 for others
  speedBonus: number;   // unused in current formulas
  armorBonus: number;   // +1 cyborg, +2 mutant, 0 others
  meleeBonus: number;   // +1 clone, +2 mutant, 0 others
  price: number;
}

export interface SquadTypeDef {
  id: string;
  name: string;
  rank: number;
  price: number;
}

export interface ArmorDef {
  id: string;
  name: string;
  armor: number;
  speed: number;
  speedReduced: number; // speed when squad has >2 heavy weapons
  price: number;
  mutantArmor?: number; // armor value for mutant race (null = use armor field)
}

export interface WeaponDef {
  id: string;
  name: string;
  range: string;
  power: string;
  price: number;
  isHeavy: boolean;
  macedonianRange?: string;
  macedonianPower?: string;
}

export interface MeleeWeaponDef {
  id: string;
  name: string;
  price: number;
}

export interface PropertyDef {
  id: string;           // maps to modifier catalogId
  name: string;
  price: number;
}
```

Data values (all from Excel):

```typescript
export const RACES: RaceDef[] = [
  { id: 'human',    name: 'Человек', rankBonus: 0,  speedBonus: 0, armorBonus: 0, meleeBonus: 0, price: 20 },
  { id: 'clone',    name: 'Клон',    rankBonus: -1, speedBonus: 0, armorBonus: 0, meleeBonus: 0, price: 10 },
  { id: 'cyborg',   name: 'Киборг',  rankBonus: 0,  speedBonus: 0, armorBonus: 1, meleeBonus: 0, price: 30 },
  { id: 'mutant',   name: 'Мутант',  rankBonus: 0,  speedBonus: 0, armorBonus: 2, meleeBonus: 2, price: 40 },
];

export const SQUAD_TYPES: SquadTypeDef[] = [
  { id: 'elite_heavy', name: 'Элитный тяжёлый отряд', rank: 5, price: 50 },
  { id: 'specnaz',     name: 'Спецназ',               rank: 4, price: 30 },
  { id: 'shock',       name: 'Ударное подразделение',  rank: 3, price: 20 },
  { id: 'main',        name: 'Основное подразделение', rank: 2, price: 15 },
  { id: 'militia',     name: 'Ополчение/Полиция',      rank: 1, price: 5  },
];

export const ARMOR_TYPES: ArmorDef[] = [
  { id: 'clothing',           name: 'Одежда',                            armor: 1, speed: 5, speedReduced: 4, price: 0,   mutantArmor: 3 },
  { id: 'light_helmet',       name: 'Шлем, лёгкая кирасса',             armor: 2, speed: 5, speedReduced: 4, price: 20,  mutantArmor: 4 },
  { id: 'heavy_kirass',       name: 'Тяжёлая кирасса, напленики',      armor: 3, speed: 5, speedReduced: 4, price: 60,  mutantArmor: 5 },
  { id: 'cyborg_base',        name: 'Киборг',                           armor: 4, speed: 4, speedReduced: 4, price: 90  },
  { id: 'shield_light',       name: 'Шлем, лёгкая кирасса, щит',       armor: 4, speed: 4, speedReduced: 3, price: 40,  mutantArmor: 6 },
  { id: 'heavy_infantry',     name: 'Тяжёлый пехотный доспех',          armor: 4, speed: 4, speedReduced: 3, price: 80,  mutantArmor: 6 },
  { id: 'felician_light',     name: 'Фелицианский лёгкий бронекостюм',  armor: 3, speed: 6, speedReduced: 5, price: 100 },
  { id: 'cyborg_light',       name: 'Киборг в лёгкой броне',           armor: 3, speed: 5, speedReduced: 3, price: 30  },
  { id: 'power_armor',        name: 'Бронекостюм',                      armor: 5, speed: 4, speedReduced: 3, price: 100, mutantArmor: 6 },
  { id: 'cyborg_heavy',       name: 'Киборг в тяжёлой броне',          armor: 5, speed: 4, speedReduced: 3, price: 120 },
  { id: 'exoskeleton',        name: 'Экзоскилет',                       armor: 6, speed: 3, speedReduced: 3, price: 140 },
];

export const WEAPONS: WeaponDef[] = [
  { id: 'pistol',          name: 'Пистолет',               range: 'Д6',   power: 'Д6',   price: 15,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: '2Д6'   },
  { id: 'smg',             name: 'Пистолет-пулемёт',       range: 'Д6',   power: '2Д6',  price: 25,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: '3Д6'   },
  { id: 'shotgun',         name: 'Дробовик',               range: 'Д6',   power: '3Д6',  price: 35,  isHeavy: false },
  { id: 'assault_rifle',   name: 'Автомат',                range: 'Д12',  power: '2Д6',  price: 40,  isHeavy: false },
  { id: 'carbine',         name: 'Штурмовой карабин',      range: 'Д6',   power: 'Д12',  price: 45,  isHeavy: false },
  { id: 'sniper',          name: 'Снайперская Винтовка',   range: 'Д12+2',power: 'Д12',  price: 80,  isHeavy: false },
  { id: 'lmg',             name: 'Пулемёт',                range: 'Д12',  power: '2Д12', price: 100, isHeavy: true  },
  { id: 'rocket_launcher', name: 'Гранатомёт/ракетница',   range: 'Д12',  power: 'Д20',  price: 100, isHeavy: true  },
  { id: 'atr',             name: 'Противотанокое ружьё',   range: 'Д20',  power: 'Д12',  price: 80,  isHeavy: true  },
  { id: 'flamethrower',    name: 'Огнемёт',                range: 'Д6',   power: 'Д20',  price: 85,  isHeavy: true  },
  { id: 'laser_pistol',    name: 'ЛазПистолет',            range: '2Д6',  power: 'Д6+1', price: 30,  isHeavy: false, macedonianRange: '2Д6-1', macedonianPower: 'Д6+1'  },
  { id: 'laser_rifle',     name: 'ЛазГан',                 range: '2Д12', power: 'Д6+1', price: 60,  isHeavy: false },
  { id: 'laser_cannon',    name: 'ЛазПушка',               range: '2Д12', power: 'Д20',  price: 120, isHeavy: true  },
  { id: 'plasma_pistol',   name: 'ПлазПистолет',           range: 'Д6',   power: 'Д6+3', price: 45,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: 'Д6+3'  },
  { id: 'plasma_rifle',    name: 'ПлазГан',                range: 'Д12',  power: 'Д6+3', price: 60,  isHeavy: false },
  { id: 'plasma_cannon',   name: 'ПлазПушка',              range: 'Д12',  power: 'Д20+2',price: 120, isHeavy: true  },
  { id: 'gluon_pistol',    name: 'Глюонный пистолет',      range: 'Д6',   power: '2Д6+3',price: 55,  isHeavy: false, macedonianRange: 'Д6-1',  macedonianPower: '2Д6+3' },
  { id: 'gluon_rifle',     name: 'Глюонная винтовка',      range: 'Д12',  power: '3Д6+3',price: 80,  isHeavy: false },
  { id: 'gluon_cannon',    name: 'Глюонная пушка',         range: 'Д12',  power: 'Д12+2',price: 80,  isHeavy: true  },
];

export const MELEE_WEAPONS: MeleeWeaponDef[] = [
  { id: 'unarmed',       name: 'Без оружия',           price: 0  },
  { id: 'knife',         name: 'Нож',                  price: 10 },
  { id: 'cold_weapon',   name: 'Холодное оружие',      price: 15 },
  { id: 'saw_electro',   name: 'Пило/Электро',         price: 20 },
  { id: 'two_handed',    name: 'Двуручное оружие ББ',  price: 25 },
  { id: 'heavy_ranged',  name: 'Тяжёлое стрелковое',   price: 0  },
];

export const PROPERTIES: PropertyDef[] = [
  { id: 'mechanic',      name: 'Рм',  price: 10 },
  { id: 'jump_boost_3',  name: 'Пр3', price: 20 },
  { id: 'jump_boost_4',  name: 'Пр4', price: 30 },
  { id: 'jump_boost_5',  name: 'Пр5', price: 40 },
];
```

Note: Property IDs (`mechanic`, `jump_boost_3`, `jump_boost_4`, `jump_boost_5`) match existing modifier IDs in `src/data/modifiers/standard-modifiers.json`.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit src/data/calculator/calculator-catalogs.ts`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/calculator/calculator-catalogs.ts
git commit -m "feat(calculator): add static catalog data for squad cost calculator"
```

---

### Task 2: Calculator Engine + Unit Tests

**Files:**
- Create: `src/lib/calculator-engine.ts`
- Create: `src/__tests__/calculator-engine.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `src/__tests__/calculator-engine.test.ts`. Test cases use the 6 soldiers from the Excel example (all Человек, Ударное, Тяжёлый пехотный доспех, Пр5, various weapons):

```typescript
import { calculateSoldier, calculateSquadCost } from '@/lib/calculator-engine';
import type { CalculatorSoldierParams } from '@/lib/calculator-engine';

// All 6 soldiers from Excel example share these params:
const baseParams = {
  race: 'human',
  squadType: 'shock',
  armor: 'heavy_infantry',
  twoWeapons: false,
  meleeWeapon: 'unarmed',
  property: 'jump_boost_5' as string | null,
};

describe('calculateSoldier', () => {
  // Soldier 1: Снайперская Винтовка, Без оружия
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

  // Soldier 2: ПлазПистолет, Пило/Электро
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

  // Soldier 3: Противотанокое ружьё, Тяжёлое стрелковое
  test('soldier 3: ATR + heavy ranged (zero melee)', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'atr', meleeWeapon: 'heavy_ranged' });
    expect(result.rank).toBe(3);
    expect(result.range).toBe('Д20');
    expect(result.power).toBe('Д12');
    expect(result.melee).toBe(0);
    expect(result.costBreakdown.total).toBe(240);
  });

  // Soldier 4: Пулемёт, Тяжёлое стрелковое
  test('soldier 4: LMG + heavy ranged', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'lmg', meleeWeapon: 'heavy_ranged' });
    expect(result.range).toBe('Д12');
    expect(result.power).toBe('2Д12');
    expect(result.melee).toBe(0);
    expect(result.costBreakdown.total).toBe(260);
  });

  // Soldier 5: Автомат, Без оружия
  test('soldier 5: assault rifle + unarmed', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'assault_rifle' });
    expect(result.range).toBe('Д12');
    expect(result.power).toBe('2Д6');
    expect(result.melee).toBe(2);
    expect(result.costBreakdown.total).toBe(200);
  });

  // Soldier 6: Пистолет-пулемёт, Без оружия
  test('soldier 6: SMG + unarmed', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'smg' });
    expect(result.range).toBe('Д6');
    expect(result.power).toBe('2Д6');
    expect(result.melee).toBe(2);
    expect(result.costBreakdown.total).toBe(185);
  });

  // Clone rank reduction
  test('clone gets rank -1', () => {
    const result = calculateSoldier({ ...baseParams, race: 'clone', weapon: 'assault_rifle' });
    expect(result.rank).toBe(2); // shock=3, clone -1
    expect(result.costBreakdown.racePrice).toBe(10);
  });

  // Mutant armor bonus
  test('mutant gets +2 armor', () => {
    const result = calculateSoldier({ ...baseParams, race: 'mutant', weapon: 'assault_rifle' });
    expect(result.armor).toBe(6); // heavy_infantry base=4, mutant uses mutantArmor=6
    expect(result.costBreakdown.racePrice).toBe(40);
  });

  // Macedonian mode (two weapons)
  test('pistol with macedonian mode changes range/power', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'pistol', twoWeapons: true });
    expect(result.range).toBe('Д6-1');
    expect(result.power).toBe('2Д6');
  });

  // Heavy weapon count affects speed
  test('speed reduced when squad has >2 heavy weapons', () => {
    // This tests the squad-level speed reduction; tested via calculateSquadSoldiers
  });

  // No property
  test('no property gives 0 property price', () => {
    const result = calculateSoldier({ ...baseParams, weapon: 'assault_rifle', property: null });
    expect(result.costBreakdown.propertyPrice).toBe(0);
  });
});

describe('calculateSquadCost', () => {
  test('calculates correct squad cost from Excel example', () => {
    // Costs: 240 + 225 + 240 + 260 + 200 + 185 = 1350
    // CEILING(1350 / 10, 5) = CEILING(135, 5) = 135
    const costs = [240, 225, 240, 260, 200, 185];
    expect(calculateSquadCost(costs)).toBe(135);
  });

  test('rounds up to nearest 5', () => {
    expect(calculateSquadCost([100])).toBe(10);   // 100/10=10, already multiple of 5
    expect(calculateSquadCost([103])).toBe(15);   // 103/10=10.3, ceil to 15
    expect(calculateSquadCost([200, 200])).toBe(40); // 400/10=40
  });
});

describe('calculateSquadSoldiers', () => {
  test('applies speed reduction when >2 heavy weapons in squad', () => {
    // Need to test that calculateSquadSoldiers reduces speed for soldiers
    // when total heavy weapon count > 2
    const { calculateSquadSoldiers } = require('@/lib/calculator-engine');

    const params: CalculatorSoldierParams[] = [
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
    ];

    const results = calculateSquadSoldiers(params);
    // 3 heavy weapons > 2, so speed should be reduced (heavy_infantry: 4 → 3)
    results.forEach(r => {
      expect(r.speed).toBe(3); // reduced from 4
    });
  });

  test('no speed reduction when <=2 heavy weapons', () => {
    const { calculateSquadSoldiers } = require('@/lib/calculator-engine');

    const params: CalculatorSoldierParams[] = [
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'lmg', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'atr', twoWeapons: false, meleeWeapon: 'heavy_ranged', property: null },
      { race: 'human', squadType: 'shock', armor: 'heavy_infantry', weapon: 'assault_rifle', twoWeapons: false, meleeWeapon: 'unarmed', property: null },
    ];

    const results = calculateSquadSoldiers(params);
    // 2 heavy weapons (lmg, atr) <= 2, no reduction
    results.forEach(r => {
      expect(r.speed).toBe(4); // normal speed for heavy_infantry
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- --testPathPattern calculator-engine`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement the calculator engine**

Create `src/lib/calculator-engine.ts`:

```typescript
import {
  RACES, SQUAD_TYPES, ARMOR_TYPES, WEAPONS, MELEE_WEAPONS, PROPERTIES,
  type RaceDef, type SquadTypeDef, type ArmorDef, type WeaponDef,
  type MeleeWeaponDef, type PropertyDef,
} from '@/data/calculator/calculator-catalogs';

export interface CalculatorSoldierParams {
  race: string;
  squadType: string;
  armor: string;
  weapon: string;
  twoWeapons: boolean;
  meleeWeapon: string;
  property: string | null;
}

export interface CostBreakdown {
  rankPrice: number;
  weaponPrice: number;
  meleePrice: number;
  propertyPrice: number;
  armorPrice: number;
  racePrice: number;
  total: number;
}

export interface CalculatedSoldier {
  rank: number;
  speed: number;
  range: string;
  power: string;
  melee: number;
  armor: number;
  costBreakdown: CostBreakdown;
}

// Lookup helpers
function lookupRace(id: string): RaceDef {
  return RACES.find(r => r.id === id)!;
}
function lookupSquadType(id: string): SquadTypeDef {
  return SQUAD_TYPES.find(s => s.id === id)!;
}
function lookupArmor(id: string): ArmorDef {
  return ARMOR_TYPES.find(a => a.id === id)!;
}
function lookupWeapon(id: string): WeaponDef {
  return WEAPONS.find(w => w.id === id)!;
}
function lookupMeleeWeapon(id: string): MeleeWeaponDef {
  return MELEE_WEAPONS.find(m => m.id === id)!;
}
function lookupProperty(id: string | null): PropertyDef | undefined {
  if (!id) return undefined;
  return PROPERTIES.find(p => p.id === id);
}

/**
 * Calculate melee value based on melee weapon, race, armor, and squad type.
 * Priority order from Excel: Мутант → Экзоскилет → Элитный/Спецназ → Клон → base.
 */
function calculateMelee(
  meleeWeaponId: string,
  race: RaceDef,
  armor: ArmorDef,
  squadType: SquadTypeDef,
): number {
  // Heavy ranged weapon overrides all melee
  if (meleeWeaponId === 'heavy_ranged') {
    return armor.id === 'exoskeleton' ? 3 : 0;
  }

  const meleeWeapon = lookupMeleeWeapon(meleeWeaponId);
  const baseValues: Record<string, number> = {
    unarmed: 2, knife: 3, cold_weapon: 4, saw_electro: 5, two_handed: 6,
  };
  const base = baseValues[meleeWeaponId] ?? 0;

  // Priority-based overrides (matching Excel IF chain)
  if (race.id === 'mutant') {
    const mutantValues: Record<string, number> = {
      unarmed: 4, knife: 4, cold_weapon: 6, saw_electro: 7, two_handed: 7,
    };
    return mutantValues[meleeWeaponId] ?? base;
  }
  if (armor.id === 'exoskeleton') {
    const exoValues: Record<string, number> = {
      unarmed: 3, knife: 4, cold_weapon: 5, saw_electro: 6, two_handed: 7,
    };
    return exoValues[meleeWeaponId] ?? base;
  }
  if (squadType.id === 'elite_heavy' || squadType.id === 'specnaz') {
    const eliteValues: Record<string, number> = {
      unarmed: 3, knife: 4, cold_weapon: 5, saw_electro: squadType.id === 'specnaz' ? 7 : 6, two_handed: 7,
    };
    return eliteValues[meleeWeaponId] ?? base;
  }
  if (race.id === 'clone') {
    const cloneValues: Record<string, number> = {
      unarmed: 3, knife: 3, cold_weapon: 5, saw_electro: 6, two_handed: 7,
    };
    return cloneValues[meleeWeaponId] ?? base;
  }
  return base;
}

/**
 * Calculate a single soldier's stats and cost.
 * Speed is NOT reduced here — use calculateSquadSoldiers for squad-level speed.
 */
export function calculateSoldier(params: CalculatorSoldierParams): CalculatedSoldier {
  const race = lookupRace(params.race);
  const squadType = lookupSquadType(params.squadType);
  const armorDef = lookupArmor(params.armor);
  const weapon = lookupWeapon(params.weapon);
  const meleeWeapon = lookupMeleeWeapon(params.meleeWeapon);
  const property = lookupProperty(params.property);

  // Rank: squad type rank + race bonus (clone gets -1)
  const rank = Math.max(1, squadType.rank + race.rankBonus);

  // Speed: from armor (squad-level reduction applied separately)
  const speed = armorDef.speed;

  // Range & Power: from weapon, with macedonian variant if twoWeapons
  const range = params.twoWeapons && weapon.macedonianRange
    ? weapon.macedonianRange
    : weapon.range;
  const power = params.twoWeapons && weapon.macedonianPower
    ? weapon.macedonianPower
    : weapon.power;

  // Melee: complex lookup
  const melee = calculateMelee(params.meleeWeapon, race, armorDef, squadType);

  // Armor: from armor def, with mutant override
  const armorValue = race.id === 'mutant' && armorDef.mutantArmor
    ? armorDef.mutantArmor
    : armorDef.armor;

  // Prices
  const rankPrice = squadType.price;
  const weaponPrice = weapon.price;
  const meleePrice = meleeWeapon.price;
  const propertyPrice = property?.price ?? 0;
  const armorPrice = armorDef.price;
  const racePrice = race.price;
  const total = rankPrice + weaponPrice + meleePrice + propertyPrice + armorPrice + racePrice;

  return {
    rank,
    speed,
    range,
    power,
    melee,
    armor: armorValue,
    costBreakdown: {
      rankPrice,
      weaponPrice,
      meleePrice,
      propertyPrice,
      armorPrice,
      racePrice,
      total,
    },
  };
}

/**
 * Calculate squad cost: CEILING(sum / 10, 5)
 */
export function calculateSquadCost(soldierCosts: number[]): number {
  const sum = soldierCosts.reduce((a, b) => a + b, 0);
  const divided = sum / 10;
  return Math.ceil(divided / 5) * 5;
}

/**
 * Calculate all soldiers in a squad with squad-level speed reduction.
 * Speed is reduced for certain armor types when total heavy weapons > 2.
 */
export function calculateSquadSoldiers(params: CalculatorSoldierParams[]): CalculatedSoldier[] {
  const heavyCount = params.filter(p => {
    const weapon = lookupWeapon(p.weapon);
    return weapon.isHeavy;
  }).length;

  return params.map(p => {
    const result = calculateSoldier(p);
    if (heavyCount > 2) {
      const armorDef = lookupArmor(p.armor);
      result.speed = armorDef.speedReduced;
    }
    return result;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- --testPathPattern calculator-engine`
Expected: All tests PASS.

- [ ] **Step 5: Run type check**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/calculator-engine.ts src/__tests__/calculator-engine.test.ts
git commit -m "feat(calculator): add calculation engine with unit tests"
```

---

### Task 3: SoldiersCalculator UI Component

**Files:**
- Create: `src/components/editor/SoldiersCalculator.tsx`

Uses `frontend-design` skill for polished UI.

- [ ] **Step 1: Create the SoldiersCalculator component**

Create `src/components/editor/SoldiersCalculator.tsx`. This is a table with dropdown selects for each soldier's parameters. On every change, it recalculates stats and cost instantly.

The component receives and manages an array of `CalculatorSoldierParams`. It shows computed results per soldier (rank, speed, range, power, melee, armor, price) and a recommended squad cost below.

Props interface:

```typescript
import type { CalculatorSoldierParams, CalculatedSoldier } from '@/lib/calculator-engine';

interface SoldiersCalculatorProps {
  params: CalculatorSoldierParams[];
  onParamsChange: (params: CalculatorSoldierParams[]) => void;
  onApply: (soldiers: CalculatedSoldier[], squadCost: number) => void;
  onAddSoldier: () => void;
  onRemoveSoldier: (index: number) => void;
  soldierCount: number; // current count, max 6
}
```

Key UI sections:
1. **Table header**: column labels (Раса, Тип, Броня, Оружие, 2 руки, ББ, Свойство | Ранг, Скор, Дальн, Мощн, ББ, Броня, Цена)
2. **Per-soldier row**: left side = dropdown selects, right side = computed stats (read-only, styled differently)
3. **Below table**: squad cost display with auto-calculated value + editable override + "Применить" button
4. **Attribution**: `Калькулятор: БНП` as small text linking to `https://vk.com/bp_bnp`

Design notes:
- Dropdown selects use native `<select>` with Tailwind styling matching existing editor (`bg-slate-800 border border-slate-700 rounded text-sm`)
- Computed stats shown in a distinct color (emerald tones) to differentiate from inputs
- "Применить" button is prominent (emerald-600) like existing save button
- Add/remove soldier buttons match existing SoldiersTable pattern
- Use `calculateSquadSoldiers()` for instant recalculation on any param change
- Default params for new soldier: `{ race: 'human', squadType: 'shock', armor: 'clothing', weapon: 'pistol', twoWeapons: false, meleeWeapon: 'unarmed', property: null }`

- [ ] **Step 2: Verify it compiles**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/SoldiersCalculator.tsx
git commit -m "feat(calculator): add SoldiersCalculator UI component"
```

---

### Task 4: SquadEditor Tab Integration

**Files:**
- Modify: `src/components/editor/SquadEditor.tsx`

- [ ] **Step 1: Add tab state and imports to SquadEditor**

In `SquadEditor.tsx`:
1. Import `SoldiersCalculator` component
2. Import `calculateSoldier`, `calculateSquadSoldiers`, `calculateSquadCost` from calculator engine
3. Import catalog types
4. Add state: `const [mode, setMode] = useState<'manual' | 'calculator'>('manual')`
5. Add state: `const [calcParams, setCalcParams] = useState<CalculatorSoldierParams[]>([defaultParams])`
6. Initialize `calcParams` from existing soldiers if they were previously calculated (check if squad has `calculatorParams` metadata — for now, just use defaults)

- [ ] **Step 2: Add tab switcher UI**

Replace the existing soldiers area with a tabbed layout. Add two tab buttons above the SoldiersTable/SoldiersCalculator:

```tsx
{/* Tab switcher */}
<div className="flex gap-1 mb-3">
  <button
    onClick={() => setMode('manual')}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      mode === 'manual'
        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
        : "text-slate-500 hover:text-slate-400 border border-transparent"
    )}
  >
    Ручной ввод
  </button>
  <button
    onClick={() => setMode('calculator')}
    className={cn(
      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
      mode === 'calculator'
        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30"
        : "text-slate-500 hover:text-slate-400 border border-transparent"
    )}
  >
    Калькулятор
  </button>
</div>
```

Then conditionally render:
```tsx
{mode === 'manual' ? (
  <SoldiersTable ... />
) : (
  <SoldiersCalculator
    params={calcParams}
    onParamsChange={setCalcParams}
    onApply={(calculatedSoldiers, squadCost) => {
      // Map calculated soldiers to CustomSoldier format
      setSoldiers(calculatedSoldiers.map(cs => ({
        rank: cs.rank,
        speed: cs.speed,
        range: cs.range,
        power: cs.power,
        melee: cs.melee,
        armor: cs.armor,
      })));
      setCost(squadCost);
    }}
    onAddSoldier={() => setCalcParams([...calcParams, defaultParams])}
    onRemoveSoldier={(idx) => setCalcParams(calcParams.filter((_, i) => i !== idx))}
    soldierCount={calcParams.length}
  />
)}
```

- [ ] **Step 3: Handle property → modifier mapping in onApply**

When applying calculator results, map `property` to `soldier.modifiers`:

```typescript
onApply={(calculatedSoldiers, squadCost) => {
  const newSoldiers = calcParams.map((params, i) => {
    const cs = calculatedSoldiers[i];
    const modifiers: string[] = [];
    if (params.property) {
      modifiers.push(params.property);
    }
    return {
      rank: cs.rank,
      speed: cs.speed,
      range: cs.range,
      power: cs.power,
      melee: cs.melee,
      armor: cs.armor,
      modifiers,
    };
  });
  setSoldiers(newSoldiers);
  setCost(squadCost);
}}
```

- [ ] **Step 4: Verify it compiles and renders**

Run: `npm run type-check`
Expected: No errors.

Start dev server: `npm run dev`, navigate to editor, create a squad, verify both tabs render.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/SquadEditor.tsx
git commit -m "feat(calculator): integrate calculator tab into SquadEditor"
```

---

### Task 5: E2E Tests

**Files:**
- Create: `e2e/calculator.spec.ts`

- [ ] **Step 1: Write E2E test**

Create `e2e/calculator.spec.ts` with test cases:

1. **Open calculator tab**: Navigate to editor, create a source + faction + squad, verify calculator tab is visible and clickable
2. **Change params and verify stats**: Select different race/armor/weapon, verify stats update instantly
3. **Apply calculator results**: Click "Применить", switch to manual tab, verify soldier fields match calculated values
4. **Squad cost updates**: Verify cost field updates to calculated value
5. **Switch between modes**: Verify switching between manual and calculator preserves state

Use `data-testid` attributes on calculator elements:
- `calculator-tab` — calculator tab button
- `manual-tab` — manual tab button
- `calculator-row-{n}` — calculator row for soldier N
- `calculator-apply` — apply button
- `calculator-cost` — displayed squad cost

- [ ] **Step 2: Add data-testid attributes to components**

Add test IDs to `SoldiersCalculator.tsx` and `SquadEditor.tsx` for E2E selectors.

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e -- --grep calculator`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e/calculator.spec.ts src/components/editor/SoldiersCalculator.tsx src/components/editor/SquadEditor.tsx
git commit -m "test(calculator): add E2E tests for calculator tab"
```

---

### Task 6: Final Validation

- [ ] **Step 1: Run full validation**

```bash
npm run type-check
npm test
npm run test:e2e
```

All must pass.

- [ ] **Step 2: Manual visual check**

Start dev server, navigate to editor, verify:
- Calculator tab shows all dropdowns correctly
- Changing params updates stats instantly
- "Применить" button works and fills soldier fields
- Squad cost updates correctly
- Attribution link visible
- Manual tab still works as before
