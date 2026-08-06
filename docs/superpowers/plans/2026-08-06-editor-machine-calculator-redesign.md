# Editor Machine Cost Calculator + Verifier-style Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a machine cost calculator (техника + орудия + гравилёты) to the `/editor`, faithful to `Kalkulyatora_tekhniki_na_monoblokakh_Beta_v-01.xlsx`, and restyle the entire editor in the `import-cards` verifier aesthetic.

**Architecture:** Pure-TS cost engine + data catalogs (unit-tested against the xlsx) → a `MachineCalculator` component that becomes the primary mode of `MachineEditor` (моноблок+шасси derive stats, mirroring `SoldiersCalculator`) → an editor-scoped design system (CSS variables + `next/font`) applied to all editor components. Main app unchanged.

**Tech Stack:** TypeScript 5.x, Next.js 14.2.35 (App Router), React 18, Tailwind CSS, Jest (unit), Playwright (E2E).

## Global Constraints

- Editor is **desktop-only**: keep the `md:` layout and the mobile notice in `EditorLayout.tsx`; do not make editor components mobile-first.
- All UI text in **Russian**; identifiers/comments in English. Dice notation in machine data uses **Latin `D`** (`D12`, `2D20`, `D6+2`) to match existing `machines.json`; `ББ` stays Cyrillic. The engine must also accept Cyrillic `Д` (normalize).
- Use the `@/*` path alias (maps to `src/*`).
- Aesthetic is **scoped to `/editor` only**: all verifier CSS variables live under an editor wrapper class; do not alter `globals.css` or main-app components.
- Fonts via `next/font/google`: add **Black Ops One** and **JetBrains Mono** in `src/app/editor/layout.tsx`; reuse the already-global `--font-oswald`.
- Tests: unit tests in `src/__tests__/` (Jest); E2E in `e2e/` (Playwright). `npm run type-check` and `npm run test` MUST pass before any commit. **E2E is CI-only** (do not run locally — `next dev` non-terminating is killed by the harness).
- Prefer native `<select>` styling (no `appearance-none`).
- Reference spec: `docs/superpowers/specs/2026-08-06-editor-machine-calculator-redesign-design.md`.
- Reference design source: `tools/card_matcher_gen.py` (the verifier whose aesthetic we mirror).

---

## File Structure

**Create:**
- `src/data/calculator/machine-catalogs.ts` — MONOBLOCKS, CHASSIS, ARSENAL_PRESETS, WEIGHT_SPEED_SECTORS + types.
- `src/lib/machine-calculator-engine.ts` — `parseDice`, `weaponCost`, `machineCost`, `deriveSpeedSectors`.
- `src/__tests__/machine-calculator-engine.test.ts` — engine unit tests (xlsx cross-check).
- `src/components/editor/MachineCalculator.tsx` — the calculator UI (primary mode of MachineEditor).
- `src/components/editor/ui/editor-primitives.tsx` — shared verifier-styled primitives (HazardBar, Panel, StatCell, etc.).
- `src/app/editor/editor-theme.css` — editor-scoped CSS variables + base classes.

**Modify:**
- `src/lib/editor/types.ts` — add `MachineCalculatorParams`, `WeaponSlotConfig`, `calculatorParams?` on `CustomMachine`.
- `src/app/editor/layout.tsx` — load Black Ops One + JetBrains Mono, apply editor-theme wrapper.
- `src/components/editor/MachineEditor.tsx` — integrate `MachineCalculator` as primary mode (keep manual tab).
- `src/components/editor/EditorLayout.tsx`, `SourcesList.tsx`, `FactionsList.tsx`, `UnitsList.tsx` — apply editor primitives.
- `src/components/editor/SquadEditor.tsx`, `SoldiersCalculator.tsx` — apply editor primitives (no logic change).
- `src/components/editor/ModifiersEditor.tsx` — apply editor primitives.
- `src/__tests__/calculator-engine.test.ts` — add the verified 6-soldier squad regression test.
- `e2e/editor.spec.ts` — add machine-calculator creation test.
- `e2e/calculator-tab.spec.ts` — update selectors for restyled UI.

---

### Task 1: Add machine-calculator types to editor types

**Files:**
- Modify: `src/lib/editor/types.ts` (append to the `CustomMachine` interface and add new types after it)

**Interfaces:**
- Produces: `MonoblockId`, `ChassisId`, `WeaponSlotConfig`, `MachineCalculatorParams`; and `CustomMachine.calculatorParams?: MachineCalculatorParams`. Later tasks (engine, calculator UI) import these from `@/lib/editor/types`.

- [ ] **Step 1: Add the types**

In `src/lib/editor/types.ts`, first add `calculatorParams?` to `CustomMachine` (inside the interface, after `buffs?: BuffDefinition[];`):

```ts
  /** Параметры калькулятора стоимости (когда цена считалась формулой) */
  calculatorParams?: MachineCalculatorParams;
```

Then append the new types after the `CustomMachine` interface (after its closing `}`):

```ts
/** Идентификатор моноблока (шасси-основа техники) */
export type MonoblockId = 'РМ-1П' | 'РМ-1' | 'РМ-2' | 'УМ-1' | 'УМ-2';

/** Тип шасси; 'Стационарное' = орудие (неподвижная артиллерия) */
export type ChassisId = 'Шагатель' | 'Траккер' | 'Гравилёт' | 'Стационарное';

/** Свойство орудия (доп. цена) */
export type WeaponProperty = 'burst3' | 'blast1' | 'blast2';

/** Один слот вооружения техники (5 слотов: Верх×2, Манипулятор×2, Нижнее) */
export interface WeaponSlotConfig {
  /** id пресета из ARSENAL_PRESETS | 'custom' | 'empty' */
  preset: string;
  /** 'D12' | '2D20' | 'D6+2' | 'ББ' (дальность); 'ББ' = рукопашное орудие */
  range: string;
  /** '3D12' | 'D20+3' | '1'|'2'|'3' (ББ ранг); мощность */
  power: string;
  /** боезапас (кол-во выстрелов) */
  ammo: number;
  /** свойство орудия или null */
  property: WeaponProperty | null;
}

/** Параметры калькулятора стоимости техники (round-trip на CustomMachine) */
export interface MachineCalculatorParams {
  monoblock: MonoblockId;
  chassis: ChassisId;
  /** ровно 5 слотов: [Верх, Верх, Манипулятор, Манипулятор, Нижнее] */
  slots: WeaponSlotConfig[];
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS (no errors). The new types are self-contained.

- [ ] **Step 3: Commit**

```bash
git add src/lib/editor/types.ts
git commit -m "feat(editor): add MachineCalculatorParams types for machine cost calculator"
```

---

### Task 2: Machine catalogs (data)

**Files:**
- Create: `src/data/calculator/machine-catalogs.ts`
- Test: `src/__tests__/machine-catalogs.test.ts`

**Interfaces:**
- Produces: `MONOBLOCKS`, `CHASSIS`, `ARSENAL_PRESETS`, `WEIGHT_SPEED_SECTORS`, and types `Monoblock`, `Chassis`, `ArsenalPreset`. Task 3 (engine) imports `MONOBLOCKS`, `CHASSIS`; Task 4 (UI) imports all.

- [ ] **Step 1: Write the failing test**

`src/__tests__/machine-catalogs.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- machine-catalogs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the catalogs**

`src/data/calculator/machine-catalogs.ts`:

```ts
import type { MonoblockId, ChassisId, WeaponProperty } from '@/lib/editor/types';

export interface Monoblock {
  id: MonoblockId;
  name: string;
  baseArmor: number;
  baseSpeed: number;
  ammoTonnage: number;
  fireRate: number;
  rank: number;
  weightClass: 'Лёгкий' | 'Средний' | 'Тяжёлый' | 'Сверхтяж';
}

export interface Chassis {
  id: ChassisId;
  name: string;
  armorMod: number;
  speedMod: number;
  flyer: boolean;
  stationary: boolean;
}

export interface ArsenalPreset {
  id: string;
  name: string;
  range: string;        // 'D12' | '2D20' | 'D6+2' | 'ББ'
  power: string;        // '3D12' | 'D20+3' | '1'|'2'|'3'
  ammo: number;
  property: WeaponProperty | null;
  category: 'Огнестрельное' | 'Ракетное' | 'Энергетическое' | 'ББ';
  /** Цена из xlsx «Арсенал» — контрольное значение для тестов */
  expectedCost: number;
}

export const MONOBLOCKS: Monoblock[] = [
  { id: 'РМ-1П', name: 'РМ-1П (лёгкий)',  baseArmor: 11, baseSpeed: 6, ammoTonnage: 18, fireRate: 2, rank: 3, weightClass: 'Лёгкий' },
  { id: 'РМ-1',  name: 'РМ-1 (средний)',  baseArmor: 14, baseSpeed: 5, ammoTonnage: 18, fireRate: 2, rank: 3, weightClass: 'Средний' },
  { id: 'РМ-2',  name: 'РМ-2 (тяжёлый)',  baseArmor: 15, baseSpeed: 4, ammoTonnage: 16, fireRate: 2, rank: 3, weightClass: 'Тяжёлый' },
  { id: 'УМ-1',  name: 'УМ-1 (св.тяж.)',  baseArmor: 15, baseSpeed: 3, ammoTonnage: 20, fireRate: 2, rank: 3, weightClass: 'Сверхтяж' },
  { id: 'УМ-2',  name: 'УМ-2 (универс.)', baseArmor: 12, baseSpeed: 5, ammoTonnage: 16, fireRate: 2, rank: 3, weightClass: 'Средний' },
];

export const CHASSIS: Chassis[] = [
  { id: 'Шагатель',    name: 'Шагатель',          armorMod:  0, speedMod:  0, flyer: false, stationary: false },
  { id: 'Траккер',     name: 'Траккер (+1 бр/−1 ск)', armorMod:  1, speedMod: -1, flyer: false, stationary: false },
  { id: 'Гравилёт',    name: 'Гравилёт (−4 бр/+2 ск, полёт)', armorMod: -4, speedMod:  2, flyer: true,  stationary: false },
  { id: 'Стационарное', name: 'Стационарное (орудие)', armorMod: 0, speedMod: 0, flyer: false, stationary: true },
];

/** Сектора скорости по классу тонажа (3 сектора: полная → средняя → низкая прочность). Из xlsx «Моноблоки и шасси». */
export const WEIGHT_SPEED_SECTORS: Record<Monoblock['weightClass'], number[]> = {
  'Лёгкий':   [6, 5, 4],
  'Средний':  [5, 4, 3],
  'Тяжёлый':  [4, 3, 2],
  'Сверхтяж': [3, 2, 1],
};

/** Пресеты орудий из xlsx «Арсенал» (строки 59–85). expectedCost — контрольная цена. */
export const ARSENAL_PRESETS: ArsenalPreset[] = [
  { id: 'triplet_mk56',    name: 'Лёгкий 3-ствольный пулемёт Триплет Mk56', range: 'D12', power: '2D6',  ammo: 6, property: 'burst3', category: 'Огнестрельное', expectedCost: 20 },
  { id: 'mg_546x2',        name: 'Двуствольный лёгкий пулемёт MG-546X2',    range: 'D12', power: '2D6',  ammo: 6, property: null,     category: 'Огнестрельное', expectedCost: 18 },
  { id: 'vulkan_mk29',     name: 'Шестиствольный пулемёт Вулкан Мк29',      range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'mg_442x4',        name: '4-ствольный пулемёт MG-442X4',            range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'sw_mk95',         name: 'Двуствольный пулемёт S&W Mk95',           range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'arc_20s',         name: 'Лёгкая бронебойная пушка AрC-20S',        range: 'D20', power: 'D20',  ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 29 },
  { id: 'gatling_mk20',    name: 'Шестиствольная авт. пушка Гатлинг Мк20', range: 'D12', power: '3D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 57 },
  { id: 'ats_35x2',        name: 'Двуствольная бронебойная пушка АТС-35Х2', range: 'D20', power: '2D20', ammo: 4, property: null,     category: 'Огнестрельное', expectedCost: 76 },
  { id: 'bambuk_atc40',    name: 'Скорострельная пушка Бамбук ATC-40',      range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'taifun_mk40',     name: 'Сверхтяжёлый пулемёт Тайфун S&W Mk40',    range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'ats_56x2',        name: 'Авт. бронебойная пушка АТС-56X2',         range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'atsm_56d',        name: 'Скорострельная авт. пушка АТСМ-56д',      range: 'D12', power: 'D20',  ammo: 4, property: null,     category: 'Ракетное',      expectedCost: 24 },
  { id: 'ats_76',          name: 'Тяжёлая бронебойная пушка АТС-76',        range: 'D12', power: '2D12', ammo: 5, property: null,     category: 'Огнестрельное', expectedCost: 41 },
  { id: 'molot',           name: 'Пусковая установка Молот',                range: 'D12', power: 'D20',  ammo: 3, property: null,     category: 'Ракетное',      expectedCost: 23 },
  { id: 'dlinny_luk_mk25', name: 'Спаренная ракетная Длинный лук Mk25',     range: 'D12', power: 'D20',  ammo: 2, property: 'blast1', category: 'Ракетное',      expectedCost: 27 },
  { id: 'shtorm',          name: 'Спаренная пусковая Шторм',                range: 'D12', power: '2D20', ammo: 1, property: 'blast2', category: 'Ракетное',      expectedCost: 79 },
  { id: 'svet_mech_lg25',  name: 'Лазерная пушка Световой меч LG-25',       range: '2D12', power: 'D20', ammo: 4, property: null,     category: 'Энергетическое', expectedCost: 36 },
  { id: 'drakone_plamya',  name: 'Плазменная пушка Драконье пламя',         range: 'D12', power: 'D20+3', ammo: 4, property: null,    category: 'Энергетическое', expectedCost: 30 },
  { id: 'power_dart_img1m', name: 'Импульсная пушка Power Dart IMG-1M',     range: '2D12', power: 'D20', ammo: 4, property: null,     category: 'Энергетическое', expectedCost: 36 },
  { id: 'garpun_pb1m',     name: 'Энергетический гарпун Power Bolt PB-1M',  range: 'D6+2', power: '2D20', ammo: 4, property: null,    category: 'Энергетическое', expectedCost: 73 },
  // ББ-оружие (манипуляторы): price == rank
  { id: 'mekh_pila',        name: 'Механическая пила',          range: 'ББ', power: '2', ammo: 0, property: null, category: 'ББ', expectedCost: 2 },
  { id: 'buldozernyi_otval', name: 'Бульдозерный отвал',        range: 'ББ', power: '3', ammo: 0, property: null, category: 'ББ', expectedCost: 3 },
  { id: 'kulak_manipulator', name: 'Кулак-манипулятор / Мех. пила', range: 'ББ', power: '2', ammo: 0, property: null, category: 'ББ', expectedCost: 2 },
  { id: 'kleshnya',         name: 'Клешня',                     range: 'ББ', power: '1', ammo: 0, property: null, category: 'ББ', expectedCost: 1 },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- machine-catalogs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/calculator/machine-catalogs.ts src/__tests__/machine-catalogs.test.ts
git commit -m "feat(editor): add machine cost catalogs (monoblocks, chassis, arsenal presets)"
```

---

### Task 3: Machine cost engine (TDD, xlsx cross-check)

**Files:**
- Create: `src/lib/machine-calculator-engine.ts`
- Test: `src/__tests__/machine-calculator-engine.test.ts`

**Interfaces:**
- Consumes: `WeaponSlotConfig`, `MachineCalculatorParams` from `@/lib/editor/types`; `MONOBLOCKS`, `CHASSIS`, `ARSENAL_PRESETS`, `WEIGHT_SPEED_SECTORS` from Task 2.
- Produces: `parseDice`, `weaponCost(slot) => number`, `machineCost(params) => MachineCostBreakdown`, `deriveSpeedSectors(monoblockId, chassisId) => CustomSpeedSector[]`. Task 4 imports `machineCost` + `deriveSpeedSectors`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/machine-calculator-engine.test.ts`:

```ts
import { weaponCost, machineCost, parseDice } from '@/lib/machine-calculator-engine';
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- machine-calculator-engine`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the engine**

`src/lib/machine-calculator-engine.ts`:

```ts
import type {
  MachineCalculatorParams, WeaponSlotConfig, MonoblockId, ChassisId,
} from '@/lib/editor/types';
import type { CustomSpeedSector } from '@/lib/editor/types';
import { MONOBLOCKS, CHASSIS, WEIGHT_SPEED_SECTORS } from '@/data/calculator/machine-catalogs';

const RANGE_BASE: Record<number, number> = { 6: 10, 12: 40, 20: 80 };
const POWER_BASE: Record<number, number> = { 6: 20, 12: 80, 20: 160 };
const BONUS = 20;          // per "+1"
const AMMO = 10;           // per shot
const RANGE_TO5 = 5;       // final machine-cost rounding
const PROP_PRICE: Record<string, number> = { burst3: 20, blast1: 50, blast2: 100 };

export type Dice = { count: number; sides: number; bonus: number } | { kind: 'melee' } | null;

/** '2D20+3' -> {count,sides,bonus}; 'ББ' -> {kind:'melee'}; '' -> null. Accepts Д/D. */
export function parseDice(s: string | undefined | null): Dice {
  if (!s) return null;
  const str = String(s).trim().replace(/Д/g, 'D').replace(/д/g, 'D');
  if (str === 'ББ' || str === 'BB') return { kind: 'melee' };
  const m = str.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (m) return { count: m[1] ? parseInt(m[1], 10) : 1, sides: parseInt(m[2], 10), bonus: m[3] ? parseInt(m[3], 10) : 0 };
  return null;
}

function mult(count: number): number {
  return count === 1 ? 1 : 2 * count;   // 1->1, 2->4, 3->6
}

function dicePrice(spec: string, base: Record<number, number>): number {
  const d = parseDice(spec);
  if (!d || 'kind' in d) return 0;
  return (base[d.sides] ?? 0) * mult(d.count) + BONUS * d.bonus;
}

/** Стоимость одного слота орудия (ББ == ранг; пусто == 0). */
export function weaponCost(w: WeaponSlotConfig): number {
  const rp = parseDice(w.range);
  const pp = parseDice(w.power);
  const isMelee = (rp && 'kind' in rp) || (pp && 'kind' in pp);
  if (isMelee) {
    // ББ-оружие: цена == ранг (ceil(rank×10/10))
    const rank = parseInt(w.power, 10);
    return Number.isFinite(rank) ? rank : 0;
  }
  if (!w.range && !w.power) return 0;
  const raw = dicePrice(w.range, RANGE_BASE) + dicePrice(w.power, POWER_BASE)
    + (w.property ? PROP_PRICE[w.property] ?? 0 : 0) + AMMO * (w.ammo || 0);
  return Math.ceil(raw / 10);
}

export interface MachineCostBreakdown {
  weapons: number;       // Σ weaponCost
  armor: number;         // итоговая броня (=durability)
  speed: number;         // итоговая скорость
  armorCost: number;     // броня×10
  speedCost: number;     // скорость×10
  flyerPremium: boolean;
  total: number;         // итог с округлением ceil5
  derived: {
    durability_max: number;
    ammo_max: number;
    rank: number;
    fire_rate: number;
  };
}

function ceil5(n: number): number {
  return Math.ceil(n / RANGE_TO5) * RANGE_TO5;
}

/** Полная стоимость техники по параметрам калькулятора. */
export function machineCost(p: MachineCalculatorParams): MachineCostBreakdown {
  const mono = MONOBLOCKS.find(m => m.id === p.monoblock)!;
  const chassis = CHASSIS.find(c => c.id === p.chassis)!;
  const armor = mono.baseArmor + chassis.armorMod;
  const speed = chassis.stationary ? 0 : mono.baseSpeed + chassis.speedMod;

  const weapons = p.slots.reduce((s, w) => s + weaponCost(w), 0);
  const armorCost = armor * 10;
  const speedCost = speed * 10;

  let total = weapons + armorCost + speedCost;
  if (chassis.flyer) {
    total += speedCost;        // второй ход (move-shoot-move)
    total *= 1.4;              // полёт +40%
  }
  total = ceil5(total);

  return {
    weapons, armor, speed, armorCost, speedCost,
    flyerPremium: chassis.flyer,
    total,
    derived: { durability_max: armor, ammo_max: mono.ammoTonnage, rank: mono.rank, fire_rate: mono.fireRate },
  };
}

/** Сектора скорости из класса тонажа (3 сектора). Для Стационарное — один неподвижный. */
export function deriveSpeedSectors(monoblock: MonoblockId, chassis: ChassisId, durabilityMax: number): CustomSpeedSector[] {
  if (chassis === 'Стационарное') {
    return [{ min_durability: 1, max_durability: Math.max(1, durabilityMax), speed: 0 }];
  }
  const mono = MONOBLOCKS.find(m => m.id === monoblock)!;
  const speeds = WEIGHT_SPEED_SECTORS[mono.weightClass];
  const third = Math.max(1, Math.floor(durabilityMax / 3));
  return [
    { min_durability: durabilityMax - third + 1, max_durability: durabilityMax, speed: speeds[0] },
    { min_durability: third + 1, max_durability: durabilityMax - third, speed: speeds[1] },
    { min_durability: 1, max_durability: third, speed: speeds[2] },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- machine-calculator-engine`
Expected: PASS (all tests, including the master preset cross-check and the 4 machineCost cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/machine-calculator-engine.ts src/__tests__/machine-calculator-engine.test.ts
git commit -m "feat(editor): machine cost engine (port of machine_cost_model.py, xlsx-verified)"
```

---

### Task 4: MachineCalculator component

**Files:**
- Create: `src/components/editor/MachineCalculator.tsx`

**Interfaces:**
- Consumes: `machineCost`, `deriveSpeedSectors` from Task 3; `MONOBLOCKS`, `CHASSIS`, `ARSENAL_PRESETS` from Task 2; `MachineCalculatorParams`, `WeaponSlotConfig` from Task 1.
- Produces: `MachineCalculator` React component with props `{ params, onParamsChange, onApply, unitKind }` and `data-testid` hooks for E2E. Task 5 imports it.

This is a presentational component (no logic of its own — all math is in the engine). It renders моноблок/шасси selectors, 5 weapon-slot rows, and a live cost breakdown. Visual polish (verifier aesthetic) is applied in Task 7 via `editor-primitives`; this task delivers the working structure with neutral Tailwind classes that Task 7 swaps.

- [ ] **Step 1: Write the component**

`src/components/editor/MachineCalculator.tsx`:

```tsx
'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { machineCost } from '@/lib/machine-calculator-engine';
import { MONOBLOCKS, CHASSIS, ARSENAL_PRESETS } from '@/data/calculator/machine-catalogs';
import type { MachineCalculatorParams, WeaponSlotConfig, ChassisId } from '@/lib/editor/types';

const SLOT_NAMES = ['Верх', 'Верх', 'Манипулятор', 'Манипулятор', 'Нижнее'];

interface Props {
  params: MachineCalculatorParams;
  onParamsChange: (p: MachineCalculatorParams) => void;
  onApply: (cost: number) => void;
}

const empty = (): WeaponSlotConfig => ({ preset: 'empty', range: '', power: '', ammo: 0, property: null });

export function MachineCalculator({ params, onParamsChange, onApply }: Props) {
  const breakdown = useMemo(() => machineCost(params), [params]);

  const setMonoblock = (monoblock: MachineCalculatorParams['monoblock']) => onParamsChange({ ...params, monoblock });
  const setChassis = (chassis: ChassisId) => onParamsChange({ ...params, chassis });
  const setSlot = (i: number, over: Partial<WeaponSlotConfig>) => {
    const slots = params.slots.map((s, idx) => (idx === i ? { ...s, ...over } : s));
    onParamsChange({ ...params, slots });
  };
  const applyPreset = (i: number, presetId: string) => {
    if (presetId === 'empty') return setSlot(i, { preset: 'empty', range: '', power: '', ammo: 0, property: null });
    if (presetId === 'custom') return setSlot(i, { preset: 'custom' });
    const p = ARSENAL_PRESETS.find(a => a.id === presetId)!;
    setSlot(i, { preset: presetId, range: p.range, power: p.power, ammo: p.ammo, property: p.property });
  };

  const isOrudie = params.chassis === 'Стационарное';
  const selectCls = 'w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-sm cursor-pointer';

  return (
    <div className="space-y-4" data-testid="machine-calculator">
      {/* Моноблок + Шасси */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Моноблок</span>
          <select className={selectCls} data-testid="mc-monoblock"
            value={params.monoblock} onChange={e => setMonoblock(e.target.value as MachineCalculatorParams['monoblock'])}>
            {MONOBLOCKS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-slate-400 mb-1">Шасси</span>
          <select className={selectCls} data-testid="mc-chassis"
            value={params.chassis} onChange={e => setChassis(e.target.value as ChassisId)}>
            {CHASSIS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {/* Derived readout */}
      <div className="flex gap-2 text-xs flex-wrap" data-testid="mc-readout">
        <span className="px-2 py-1 bg-slate-800 rounded">Броня <b className="text-emerald-400">{breakdown.armor}</b></span>
        {!isOrudie && <span className="px-2 py-1 bg-slate-800 rounded">Скорость <b className="text-emerald-400">{breakdown.speed}</b></span>}
        <span className="px-2 py-1 bg-slate-800 rounded">БК <b className="text-emerald-400">{breakdown.derived.ammo_max}</b></span>
        {isOrudie && <span className="px-2 py-1 bg-orange-900/40 text-orange-300 rounded">⊕ орудие · неподвижно</span>}
        {breakdown.flyerPremium && <span className="px-2 py-1 bg-orange-900/40 text-orange-300 rounded">✈ полёт +40%</span>}
      </div>

      {/* 5 weapon slots */}
      <div className="space-y-2" data-testid="mc-slots">
        {params.slots.map((s, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center p-2 bg-slate-900/60 border border-slate-800 rounded" data-testid={`mc-slot-${i}`}>
            <span className="text-xs text-slate-500 w-24">Слот {i + 1} · {SLOT_NAMES[i]}</span>
            <div className="flex flex-wrap gap-2 items-center">
              <select className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                value={s.preset} onChange={e => applyPreset(i, e.target.value)} data-testid={`mc-slot-${i}-preset`}>
                <option value="empty">(ничего)</option>
                <option value="custom">— своё —</option>
                {ARSENAL_PRESETS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {s.range === 'ББ' || /^[-+]?\d+$/.test(s.power) ? (
                <label className="text-xs text-slate-400 flex items-center gap-1">ББ ранг
                  <input type="number" min={1} max={3} className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                    value={s.power} onChange={e => setSlot(i, { range: 'ББ', power: e.target.value })} />
                </label>
              ) : (
                <>
                  <input placeholder="Дальн (D12)" className="w-20 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.range} onChange={e => setSlot(i, { range: e.target.value, preset: 'custom' })} />
                  <input placeholder="Мощн (2D20)" className="w-20 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.power} onChange={e => setSlot(i, { power: e.target.value, preset: 'custom' })} />
                  <input type="number" placeholder="БК" className="w-12 px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs font-mono"
                    value={s.ammo || ''} onChange={e => setSlot(i, { ammo: parseInt(e.target.value, 10) || 0, preset: 'custom' })} />
                  <select className="px-1 py-1 bg-slate-900 border border-slate-700 rounded text-xs"
                    value={s.property ?? ''} onChange={e => setSlot(i, { property: (e.target.value || null) as WeaponSlotConfig['property'], preset: 'custom' })}>
                    <option value="">—</option>
                    <option value="burst3">3 выстрела</option>
                    <option value="blast1">Взрыв 1шг</option>
                    <option value="blast2">Взрыв 2шг</option>
                  </select>
                </>
              )}
            </div>
            <span className="text-sm font-mono text-emerald-400 w-10 text-right" data-testid={`mc-slot-${i}-cost`}>
              {require_weaponCost_display(s)}
            </span>
          </div>
        ))}
      </div>

      {/* Cost breakdown */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-4 space-y-1.5" data-testid="mc-breakdown">
        <Row label={`Σ орудий`} value={breakdown.weapons} />
        <Row label={`броня ${breakdown.armor}×10`} value={breakdown.armorCost} />
        {!isOrudie && <Row label={`скорость ${breakdown.speed}×10`} value={breakdown.speedCost} />}
        {breakdown.flyerPremium && <Row label={`полёт (+второй ход, ×1.4)`} value={undefined} muted />}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
          <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Итого</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono" data-testid="mc-total">{breakdown.total}</span>
        </div>
        <button onClick={() => onApply(breakdown.total)}
          className="mt-2 w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white"
          data-testid="mc-apply">
          Применить стоимость
        </button>
      </div>
    </div>
  );
}

// local helper to show per-slot cost without re-importing weaponCost name clashes in JSX
import { weaponCost } from '@/lib/machine-calculator-engine';
function require_weaponCost_display(s: WeaponSlotConfig): number {
  return weaponCost(s);
}

function Row({ label, value, muted }: { label: string; value: number | undefined; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-xs ${muted ? 'text-orange-300/80' : 'text-slate-400'}`}>
      <span>{label}</span>
      {value !== undefined && <span className="font-mono text-slate-300">{value}</span>}
    </div>
  );
}
```

> Note: the helper `require_weaponCost_display` is inline only to keep the import visible; in review you may move the `import { weaponCost }` to the top of the file and call it directly. Functionally identical.

- [ ] **Step 2: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/MachineCalculator.tsx
git commit -m "feat(editor): MachineCalculator component (моноблок+шасси, 5 slots, live cost)"
```

---

### Task 5: Integrate MachineCalculator into MachineEditor

**Files:**
- Modify: `src/components/editor/MachineEditor.tsx`

**Interfaces:**
- Consumes: `MachineCalculator` from Task 4; `machineCost`/`deriveSpeedSectors` from Task 3; `MachineCalculatorParams` from Task 1.

Goal: the calculator becomes the primary editing mode (approach A). The editor holds a `calculatorParams` state (seeded from `machine?.calculatorParams` or a default), renders `<MachineCalculator>` in a "Калькулятор" tab, and a "Вручную" tab keeps the existing manual stat editors (weapons/speed sectors/durability). "Сохранить" persists both the derived stats and `calculatorParams`. Existing machines without `calculatorParams` open in manual mode with a «ручная стоимость» badge.

- [ ] **Step 1: Add calculator state + tab**

In `MachineEditor.tsx`:

1. Add imports at top:
```tsx
import { MachineCalculator } from './MachineCalculator';
import { machineCost, deriveSpeedSectors } from '@/lib/machine-calculator-engine';
import type { MachineCalculatorParams, WeaponSlotConfig } from '@/lib/editor/types';
```

2. Inside `MachineEditor(...)`, after the existing `useState` block (around line 74), add:
```tsx
const [mode, setMode] = useState<'calculator' | 'manual'>(
  machine?.calculatorParams ? 'calculator' : 'manual'
);
const [calcParams, setCalcParams] = useState<MachineCalculatorParams>(
  machine?.calculatorParams ?? {
    monoblock: 'УМ-1',
    chassis: 'Шагатель',
    slots: Array.from({ length: 5 }, () => ({ preset: 'empty', range: '', power: '', ammo: 0, property: null })) as WeaponSlotConfig[],
  }
);
```

- [ ] **Step 2: Apply calculator cost to the editor state**

Add an apply handler (next to the other handlers, before `handleSave`):
```tsx
const handleApplyCost = (cost: number) => {
  setCost(cost);
  const bd = machineCost(calcParams);
  setDurabilityMax(bd.derived.durability_max);
  setAmmoMax(bd.derived.ammo_max);
  setRank(bd.derived.rank);
  setFireRate(bd.derived.fire_rate);
  setSpeedSectors(deriveSpeedSectors(calcParams.monoblock, calcParams.chassis, bd.derived.durability_max));
};
```

- [ ] **Step 3: Persist calculatorParams on save**

In `handleSave`, add `calculatorParams` to the `machineData` object (only when in calculator mode):
```tsx
const machineData: CustomMachine = {
  // …existing fields…
  ...(mode === 'calculator' ? { calculatorParams: calcParams } : {}),
};
```

- [ ] **Step 4: Render the tabs**

Replace the start of the right-column content (the `<div className="flex-1 overflow-y-auto p-4 space-y-6">` block, ~line 345) with a tab switcher that shows `<MachineCalculator>` in calculator mode and the existing weapons/speed-sector editors in manual mode:

```tsx
<div className="flex-1 overflow-y-auto p-4 space-y-6">
  {/* Mode tabs */}
  <div className="flex gap-2 border-b border-slate-800">
    <button onClick={() => setMode('calculator')}
      className={`px-4 py-2 text-sm font-semibold border-b-2 ${mode === 'calculator' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent'}`}
      data-testid="machine-calculator-tab">Калькулятор</button>
    <button onClick={() => setMode('manual')}
      className={`px-4 py-2 text-sm font-semibold border-b-2 ${mode === 'manual' ? 'text-white border-emerald-500' : 'text-slate-500 border-transparent'}`}
      data-testid="machine-manual-tab">Вручную</button>
    {mode === 'manual' && !machine?.calculatorParams && (
      <span className="ml-auto self-center text-[10px] text-amber-400">ручная стоимость</span>
    )}
  </div>

  {mode === 'calculator' ? (
    <MachineCalculator params={calcParams} onParamsChange={setCalcParams} onApply={handleApplyCost} />
  ) : (
    <>{/* === paste the existing Weapons + Speed Sectors sections here verbatim === */}</>
  )}
</div>
```

Move the existing "Weapons Section" and "Speed Sectors Section" JSX blocks (currently directly under the right-column div) into the `manual` branch (`{/* ... */}` placeholder). Leave them unchanged.

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/MachineEditor.tsx
git commit -m "feat(editor): integrate MachineCalculator as primary mode of MachineEditor"
```

---

### Task 6: Editor-scoped theme (fonts + CSS variables)

**Files:**
- Create: `src/app/editor/editor-theme.css`
- Modify: `src/app/editor/layout.tsx`

**Interfaces:**
- Produces: an `.editor-scope` wrapper class with the verifier CSS variables and font families. Tasks 7–9 consume these variables (`var(--ru)`, `var(--panel)`, etc.) and the font variable classes.

- [ ] **Step 1: Write the theme CSS**

`src/app/editor/editor-theme.css`:

```css
/* Editor-only verifier aesthetic. Scoped to .editor-scope — does NOT affect the main app. */

.editor-scope {
  /* palette (from tools/card_matcher_gen.py :root) */
  --bg: #0f1216;
  --panel: #161a20;
  --panel2: #1d222a;
  --panel3: #252b34;
  --border: #2a313a;
  --border2: #3b434e;
  --bone: #e8e3d6;
  --muted: #8c949f;
  --dim: #5b636f;
  --ru: #ea580c;
  --ru2: #fb923c;
  --ru-dim: #7c2d12;
  --green: #4ade80;
  --red: #f43f5e;

  background: var(--bg);
  color: var(--bone);
  font-family: var(--font-oswald), 'Oswald', sans-serif;
  min-height: 100vh;
  background-image:
    radial-gradient(900px circle at 12% -5%, rgba(234, 88, 12, .06), transparent 45%),
    radial-gradient(700px circle at 95% 110%, rgba(56, 189, 248, .03), transparent 45%);
}

/* signature hazard stripe */
.editor-hazard {
  height: 5px;
  background: repeating-linear-gradient(135deg, var(--ru) 0 13px, #0b0d10 13px 26px);
  border-radius: 2px;
  opacity: .85;
}

/* font helper classes (variables come from next/font in layout.tsx) */
.font-display { font-family: var(--font-blackops), 'Black Ops One', cursive; }
.font-ui { font-family: var(--font-oswald), 'Oswald', sans-serif; }
.font-stat { font-family: var(--font-jbmono), 'JetBrains Mono', monospace; }

/* panels */
.ed-panel { background: var(--panel); border: 1px solid var(--border); border-radius: 5px; }
.ed-panel2 { background: var(--panel2); border: 1px solid var(--border2); border-radius: 4px; }

/* status pills */
.ed-ok { color: var(--green); background: rgba(74,222,128,.07); border: 1px solid rgba(74,222,128,.4); }
.ed-bad { color: var(--red); background: rgba(244,63,94,.08); border: 1px solid rgba(244,63,94,.4); }
```

- [ ] **Step 2: Load fonts + scope the editor layout**

Replace `src/app/editor/layout.tsx` entirely with:

```tsx
/**
 * Editor layout — desktop only. Loads the verifier fonts and scopes the editor theme.
 */
import type { Metadata } from 'next';
import { Black_Ops_One, JetBrains_Mono } from 'next/font/google';
import './editor-theme.css';

export const metadata: Metadata = {
  title: 'Редактор армлистов | Бронепехота',
  description: 'Создание и редактирование пользовательских армейских листов',
};

const blackOps = Black_Ops_One({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-blackops',
  display: 'swap',
});

const jbMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-jbmono',
  display: 'swap',
});

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`editor-scope ${blackOps.variable} ${jbMono.variable}`}>
      {children}
    </div>
  );
}
```

> `--font-oswald` is already provided globally by `src/app/layout.tsx`. If type-check complains it's unset within the scope, it still resolves at runtime via the `<html>` class; no action needed.

- [ ] **Step 3: Type-check + build fonts**

Run: `npm run type-check`
Expected: PASS. (The first dev/build fetches the two new Google fonts.)

- [ ] **Step 4: Commit**

```bash
git add src/app/editor/editor-theme.css src/app/editor/layout.tsx
git commit -m "feat(editor): scoped verifier theme (Black Ops One + JetBrains Mono, CSS vars)"
```

---

### Task 7: Shared editor primitives + restyle editor chrome

**Files:**
- Create: `src/components/editor/ui/editor-primitives.tsx`
- Modify: `src/components/editor/EditorLayout.tsx`, `SourcesList.tsx`, `FactionsList.tsx`, `UnitsList.tsx`

**Interfaces:**
- Produces: `HazardTopbar`, `EdPanel`, `StatCell`, `Brand` primitives used by all restyle tasks.

This task delivers the shared verifier-styled primitives (complete code) and applies them to the editor's 3-column chrome. Use the `frontend-design` skill during this task for the actual visual polish — the primitives below are the structural baseline.

- [ ] **Step 1: Write the primitives**

`src/components/editor/ui/editor-primitives.tsx`:

```tsx
'use client';
import type { ReactNode } from 'react';

/** Hazard topbar with brand + nav. */
export function HazardTopbar({ brand, children }: { brand: ReactNode; children?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 bg-[var(--panel)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="editor-hazard" />
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="font-display text-lg tracking-wider text-[var(--bone)]">{brand}</span>
        <span className="flex-1" />
        {children}
      </div>
    </div>
  );
}

export function EdPanel({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="ed-panel p-3">
      {title && (
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--border)]">
          <span className="font-ui text-xs uppercase tracking-widest text-[var(--muted)]">{title}</span>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

/** Monospace stat cell; `empty` pulses red (unfilled). */
export function StatCell({ value, empty }: { value: ReactNode; empty?: boolean }) {
  return (
    <span className={`font-stat text-center px-2 py-1 rounded border ${empty ? 'border-[var(--red)] bg-[rgba(244,63,94,.14)] animate-pulse' : 'border-[var(--border2)] bg-[var(--bg)]'}`}>
      {value}
    </span>
  );
}

export function StatusPill({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <span className={`font-stat text-[11px] px-2 py-0.5 rounded ${ok ? 'ed-ok' : 'ed-bad'}`}>{children}</span>;
}
```

- [ ] **Step 2: Apply to EditorLayout chrome**

In `src/components/editor/EditorLayout.tsx`, import `{ HazardTopbar }` and replace the desktop top tab bar (`{view === 'list' && (...)}` block around line 505) so the bar uses `<HazardTopbar brand={<>★ BRONEPEHOTA <span className="text-[var(--muted)] text-xs">/ editor</span></>}>` and the existing Юниты/Модификаторы tabs + `UnifiedSaveArea` go inside as `children`. Swap Tailwind color classes on the tabs: active `text-[var(--bone)] border-[var(--ru)]`, inactive `text-[var(--muted)] border-transparent`. Change the outer container `bg-slate-950` → keep, but the `.editor-scope` from the layout provides the background.

In the breadcrumb bar (~line 609), swap the "Назад" button colors to `text-[var(--muted)] hover:text-[var(--bone)]`.

- [ ] **Step 3: Apply to the 3 lists**

For `SourcesList.tsx`, `FactionsList.tsx`, `UnitsList.tsx`: wrap each list's container in `EdPanel`, render row items with a leading `font-display` orange index/letter, and use `StatusPill` for any selected/active state. Replace `bg-slate-*`/`text-slate-*` on these surfaces with `var(--panel)`/`var(--bone)`/`var(--muted)` equivalents. Keep all existing props/handlers/`data-testid`s unchanged — this is a visual pass only.

> Concretely: in each file, the pattern is `className="... bg-slate-800 ..."` → `className="... ed-panel2 ..."` and section headers `<h3 className="text-sm font-semibold text-slate-300 ...">` → add `font-ui text-[var(--muted)]`. The "Create" buttons (source/faction/squad/machine) get `bg-[var(--ru)] text-white` on hover.

- [ ] **Step 4: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/ui/editor-primitives.tsx src/components/editor/EditorLayout.tsx src/components/editor/SourcesList.tsx src/components/editor/FactionsList.tsx src/components/editor/UnitsList.tsx
git commit -m "style(editor): verifier-style chrome (hazard topbar, panels, lists)"
```

---

### Task 8: Restyle SquadEditor + SoldiersCalculator

**Files:**
- Modify: `src/components/editor/SoldiersCalculator.tsx`, `SquadEditor.tsx`

**Interfaces:** none new — visual pass only. **No logic changes** (the squad calculator is verified correct in the spec).

- [ ] **Step 1: Restyle SoldiersCalculator**

In `src/components/editor/SoldiersCalculator.tsx`:
- Replace the `STAT_LABELS` computed-stat cells (the `<span className="text-xs text-emerald-300/90 font-mono">` blocks, ~lines 212–229) with the `StatCell` primitive (import from `./ui/editor-primitives`). Empty/zero stats get `empty` pulsing.
- Replace the cost-summary card background `bg-slate-900/60 border border-slate-700/40` → `ed-panel`, the per-soldier cost chips → `ed-panel2`, and the final cost `text-emerald-400` → `text-[var(--ru2)] font-stat`.
- Replace the "★ тяжёлое оружие" legend and the Star System attribution link colors to `var(--muted)` / `var(--ru)]`.
- Swap the table header `labelClass` `text-slate-500` → `text-[var(--muted)]` and the column-group labels to `font-ui`.

- [ ] **Step 2: Restyle SquadEditor**

In `src/components/editor/SquadEditor.tsx`: swap the manual/calculator tab styling (~lines 320–340) to the same active/inactive pattern as Task 7 (`var(--ru)` active). Replace container `bg-slate-*` with `ed-panel`/`ed-panel2` on the form sections. Keep the `data-testid="manual-tab"` / `data-testid="calculator-tab"` hooks.

- [ ] **Step 3: Type-check + unit tests**

Run: `npm run type-check && npm test -- calculator-engine`
Expected: PASS (tests unaffected — logic unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/SoldiersCalculator.tsx src/components/editor/SquadEditor.tsx
git commit -m "style(editor): verifier-style squad calculator (no logic change)"
```

---

### Task 9: Restyle MachineEditor + ModifiersEditor

**Files:**
- Modify: `src/components/editor/MachineEditor.tsx`, `MachineCalculator.tsx`, `ModifiersEditor.tsx`

- [ ] **Step 1: Restyle MachineEditor + MachineCalculator**

Apply the same token swaps as Task 8 to `MachineEditor.tsx` (left-column stat cards, weapon/speed-sector cards, preview modal) and `MachineCalculator.tsx` (the `selectCls`, slot row `bg-slate-900/60`, breakdown card): `bg-slate-*` → `ed-panel`/`ed-panel2`, `text-emerald-400` cost → `text-[var(--ru2)] font-stat`, headers → `font-ui text-[var(--muted)]`. Keep all `data-testid="mc-*"` hooks from Task 4.

- [ ] **Step 2: Restyle ModifiersEditor**

In `src/components/editor/ModifiersEditor.tsx`: swap surface/background classes to `ed-panel`/`ed-panel2`, section headers to `font-ui text-[var(--muted)]`, and the buff/debuff accent colors to `var(--green)`/`var(--red)`. No logic change.

- [ ] **Step 3: Type-check**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/MachineEditor.tsx src/components/editor/MachineCalculator.tsx src/components/editor/ModifiersEditor.tsx
git commit -m "style(editor): verifier-style machine editor + modifiers"
```

---

### Task 10: Squad regression test + E2E

**Files:**
- Modify: `src/__tests__/calculator-engine.test.ts`
- Modify: `e2e/editor.spec.ts`, `e2e/calculator-tab.spec.ts`

- [ ] **Step 1: Add the verified squad regression test**

Append to `src/__tests__/calculator-engine.test.ts`:

```ts
describe('squad cost — verified 6-soldier squad (xlsx «Ударное подразделение»)', () => {
  const s = (weapon: string, meleeWeapon: string) => ({
    ...baseParams, squadType: 'shock', armor: 'heavy_infantry', weapon, meleeWeapon,
  });
  test('whole squad sums to 1350 -> squad cost 135', () => {
    const soldiers = calculateSquadSoldiers([
      s('sniper', 'unarmed'), s('plasma_pistol', 'saw_electro'),
      s('atr', 'heavy_ranged'), s('lmg', 'heavy_ranged'),
      s('assault_rifle', 'unarmed'), s('smg', 'unarmed'),
    ]);
    const sum = soldiers.reduce((a, c) => a + c.costBreakdown.total, 0);
    expect(sum).toBe(1350);
    expect(calculateSquadCost(soldiers.map(c => c.costBreakdown.total))).toBe(135);
  });
});
```

- [ ] **Step 2: Run unit tests**

Run: `npm test`
Expected: PASS (all unit tests, including new machine + squad tests).

- [ ] **Step 3: Add E2E for the machine calculator**

In `e2e/editor.spec.ts`, add (inside the `test.describe('Editor', ...)` block). Use the existing `clearStorage(page)` helper and the documented nav flow (`source-confirm-button`, etc.) to reach a custom source with a faction, then:

```ts
test('should compute machine cost via calculator', async ({ page }) => {
  // prerequisite: a custom source + faction created earlier in the suite (mirror existing tests)
  // navigate to the faction's unit list, click "Создать технику"
  await page.getByTestId('create-machine-button').click();
  await page.getByTestId('machine-calculator-tab').click();
  await page.getByTestId('mc-monoblock').selectOption('УМ-1');
  await page.getByTestId('mc-chassis').selectOption('Траккер');
  // slot 0 -> Гарпун preset
  await page.getByTestId('mc-slot-0-preset').selectOption('garpun_pb1m');
  await page.getByTestId('mc-apply').click();
  // cost applied to the editor's cost field; total shown in breakdown
  const total = await page.getByTestId('mc-total').textContent();
  expect(parseInt(total!, 10)).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Сохранить/ }).click();
});
```

> If `create-machine-button` testid does not exist, first add `data-testid="create-machine-button"` to the "Создать технику" button in `UnitsList.tsx` (Task 7 touched this file). Mirror the existing squad-creation E2E setup to create the source/faction first.

- [ ] **Step 4: Update calculator-tab.spec.ts selectors**

In `e2e/calculator-tab.spec.ts`: the manual/calculator tabs still use `data-testid="manual-tab"` / `"calculator-tab"` (unchanged in Task 8). Re-run the spec mentally against the restyled DOM — only fix selectors that referenced Tailwind classes or text that changed. If any assertion checked an `emerald` class, swap to the new `var(--ru2)`-based class or assert via `getByTestId` instead.

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/calculator-engine.test.ts e2e/editor.spec.ts e2e/calculator-tab.spec.ts src/components/editor/UnitsList.tsx
git commit -m "test(editor): squad regression + machine-calculator E2E"
```

> E2E is CI-only (CLAUDE.md). Do not run `npm run test:e2e` locally. Unit tests (`npm test`) and type-check MUST pass.

---

## Self-Review (completed)

**1. Spec coverage:** every spec section maps to a task — data model (T1), catalogs (T2), engine (T3), MachineCalculator (T4), MachineEditor integration (T5), visual design system (T6), chrome restyle (T7), squad calc restyle (T8), machine+modifiers restyle (T9), орудия stationary case (T3 test + T4 readout + T5), flyer (T3 test + T4 badge), existing-machine handling (T5 manual mode + badge), testing (T10). ✓
**2. Placeholder scan:** no TBD/TODO; restyle tasks (7–9) use concrete token mappings (`bg-slate-* → ed-panel`, exact classes) rather than "restyle appropriately". ✓
**3. Type consistency:** `WeaponSlotConfig`/`MachineCalculatorParams` defined in T1, used identically in T2/T3/T4/T5. `machineCost`/`weaponCost`/`deriveSpeedSectors` signatures match across T3 (def) and T4/T5 (use). Preset ids (`gatling_mk20`, `shtorm`, `garpun_pb1m`, …) identical in T2 catalog and T3 tests. ✓
