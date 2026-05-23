# Squad Calculator Integration into Editor

## Summary

Integrate the Excel-based squad cost calculator ("Калькулятор армлистов пехоты Альфа v1.03") into the desktop editor as a second tab in SquadEditor. The calculator auto-computes soldier stats (rank, speed, range, power, melee, armor) and squad cost based on parameter selection (race, squad type, armor, weapon, melee weapon, properties) with static price tables.

## Motivation

Currently, editor users must manually enter all soldier stats and squad cost with no validation or guidance. The Excel calculator already exists as a community tool with proven pricing formulas. Bringing it into the editor eliminates the manual spreadsheet workflow and ensures correct cost calculations.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Integration mode | Additional tab (not replacement) | Preserves manual input for advanced users |
| Cost calculation | Auto + manual override | Shows recommended price, allows adjustment |
| Reference data | Static JSON/TS in code | Simple first iteration; changes need a release |
| Properties (Рм, Пр3-5) | Integrated into modifier system | Reuses existing soldier.modifiers infrastructure |
| Calculator scope | Squads only (not machines) | Calculator formulas only cover infantry |

## Architecture

### New Files

1. **`src/data/calculator/calculator-catalogs.ts`** — Static reference tables
2. **`src/lib/calculator-engine.ts`** — Pure calculation logic
3. **`src/components/editor/SoldiersCalculator.tsx`** — Calculator UI component

### Modified Files

1. **`src/components/editor/SquadEditor.tsx`** — Add tab switcher (Manual / Calculator)
2. **`src/hooks/useEditorState.ts`** — Add calculatorParams to editor state
3. **`src/lib/editor/types.ts`** — Add CalculatorSoldierParams type

### Data: `calculator-catalogs.ts`

```typescript
interface RaceDef {
  id: string;           // 'human' | 'clone' | 'cyborg' | 'mutant'
  name: string;         // 'Человек' | 'Клон' | 'Киборг' | 'Мутант'
  rankBonus: number;    // -1 for clone, 0 for others
  armorBonus: number;   // +1 for cyborg, +2 for mutant
  meleeBonus: number;   // +1 for clone, +2 for mutant
  price: number;        // 20, 10, 30, 40
}

interface SquadTypeDef {
  id: string;           // 'elite_heavy' | 'specnaz' | 'shock' | 'main' | 'militia'
  name: string;
  rank: number;         // 5, 4, 3, 2, 1
  price: number;        // 50, 30, 20, 15, 5
}

interface ArmorDef {
  id: string;
  name: string;         // e.g. 'Тяжёлый пехотный доспех'
  armor: number;        // 1-6
  speed: number;        // 3-6
  price: number;        // 0-140
}

interface WeaponDef {
  id: string;
  name: string;
  range: string;        // dice notation: 'D6', 'D12+2', '2D12'
  power: string;        // dice notation: 'D6', '2D6', 'D12'
  macedonianRange?: string;  // range when two-weapon mode
  macedonianPower?: string;  // power when two-weapon mode
  price: number;        // weapon cost (range_price + power_price)
  isHeavy: boolean;     // heavy weapon flag
}

interface MeleeWeaponDef {
  id: string;
  name: string;         // 'Без оружия' | 'Нож' | etc.
  baseValue: number;    // base melee value
  price: number;        // 0, 10, 15, 20, 25, 0
}

interface PropertyDef {
  id: string;           // maps to modifier catalogId
  name: string;         // 'Рм' | 'Пр3' | 'Пр4' | 'Пр5'
  price: number;        // 10, 20, 30, 40
}
```

Reference table sizes: 4 races, 5 squad types, 11 armor types, 19 weapons, 6 melee weapons, 4 properties.

### Logic: `calculator-engine.ts`

```typescript
interface CalculatorSoldierParams {
  race: string;
  squadType: string;
  armor: string;
  weapon: string;
  twoWeapons: boolean;    // "македонец" mode
  meleeWeapon: string;
  property: string | null; // property id or null
}

interface CalculatedSoldier {
  rank: number;
  speed: number;
  range: string;          // dice notation
  power: string;          // dice notation
  melee: number;
  armor: number;
  costBreakdown: {
    rankPrice: number;
    weaponPrice: number;
    meleePrice: number;
    propertyPrice: number;
    armorPrice: number;
    racePrice: number;
    total: number;
  };
}

function calculateSoldier(params: CalculatorSoldierParams): CalculatedSoldier;
function calculateSquadCost(soldierCosts: number[]): number;
// Returns CEILING(sum / 10, 5)
```

Calculation rules (from Excel):

- **Rank**: From squad type. +1 for clones.
- **Speed**: From armor. Some armor types reduce speed if unit has 2+ heavy weapons (Y8 count).
- **Range/Power**: From weapon. If twoWeapons=true, use macedonian variant.
- **Melee**: From melee weapon base + bonuses (race, armor=exoskeleton, squad type). Heavy ranged weapon → melee = 0 (or 3 for exoskeleton).
- **Armor**: From armor type + race bonus (mutant +2, cyborg +1).
- **Cost**: rankPrice + weaponPrice + meleePrice + propertyPrice + armorPrice + racePrice.
- **Squad cost**: `Math.ceil(sum(soldierCosts) / 10 / 5) * 5`

### UI: `SoldiersCalculator.tsx`

Table with one row per soldier (1-6), columns are dropdown selects:
1. Раса (4 options)
2. Тип отряда (5 options)
3. Броня (11 options)
4. Оружие (19 options)
5. Македонец (checkbox: Да/Нет)
6. Оружие ББ (6 options)
7. Свойство (Рм/Пр3/Пр4/Пр5/нет)

Each change triggers instant recalculation. Row shows computed stats and price inline.

Below table:
- Recommended squad cost (auto-calculated)
- Editable cost field with override
- «Применить» button — writes to squad.soldiers and squad.cost
- Attribution: "Калькулятор: [БНП](https://vk.com/bp_bnp)" — small text link below the table

### Integration: `SquadEditor.tsx`

Two tabs above the soldiers area:
- Tab «Ручной ввод» → existing SoldiersTable (unchanged)
- Tab «Калькулятор» → new SoldiersCalculator

Tab state stored locally in component state (not persisted — resets on page load).

### State: `useEditorState.ts`

Add `calculatorParams: Map<string, CalculatorSoldierParams[]>` keyed by squad ID. Persisted alongside squad data in localStorage and export envelope.

When switching to calculator tab:
- If calculatorParams exist for current squad → load them
- If not → initialize with defaults (Человек, Ударное, Одежда, Пистолет, Нет, Без оружия, null)

When "Применить" is clicked:
1. For each soldier: calculate stats, write to squad.soldiers[i]
2. Map property to modifier: add/remove modifier in soldier.modifiers
3. Set squad.cost to calculated value
4. Save calculatorParams for future use

### Macedonian (Two-Weapon) Rules

When twoWeapons=true, certain weapons change range/power:
- Pistols (Пистолет, ПлазПистолет, Глюонный пистолет): range → Д6-1, double shots
- Пистолет-пулемёт: range → Д6-1
- ЛазПистолет: range → 2Д6-1

These are encoded per-weapon in `macedonianRange` / `macedonianPower` fields.

### Heavy Weapon Count

Some weapons set `isHeavy=true` (Пулемёт, Гранатомёт, Противотанковое ружьё, Огнемёт, ЛазПушка, ПлазПушка, Глюонная пушка). If squad has 2+ heavy weapons, speed is reduced for certain armor types (from Excel: if Y8<=2, use base speed; otherwise speed=4 for most armor types).

## Testing

- Unit tests for `calculator-engine.ts`: verify calculations match Excel examples
- Unit tests for `calculator-catalogs.ts`: verify all lookup tables are complete
- E2E test: create squad via calculator, verify stats and cost
- E2E test: switch between manual and calculator modes

## Out of Scope

- Machine calculator (no formulas in the Excel for vehicles)
- User-editable price tables
- Exporting calculator params to separate format (already in export envelope)
