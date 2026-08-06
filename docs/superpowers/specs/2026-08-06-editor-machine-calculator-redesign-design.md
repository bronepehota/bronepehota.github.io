# Editor: Machine Cost Calculator + Verifier-style Redesign

**Date:** 2026-08-06
**Branch:** `feat/encyclopedia-novel-lore` → new branch `feat/editor-machine-calculator`
**Status:** Design approved (brainstorming) — pending spec review

## Context

The `/editor` (desktop-only) lets users build custom army lists. Today:

- **Squads** have a full cost calculator (`SoldiersCalculator.tsx` + `src/lib/calculator-engine.ts` + `src/data/calculator/calculator-catalogs.ts`) that mirrors the infantry Excel `Kalkulyator_armlistov_pekhoty_Alfa_v-1_03.xlsx` (sheet «АвтоРасчёт»).
- **Machines (техника)** have an editor (`MachineEditor.tsx`) but the cost is a **manual number input** (default 200). There is no cost calculator, even though the community has a second Excel — `Kalkulyatora_tekhniki_na_monoblokakh_Beta_v-01.xlsx` — whose formulas are already reproduced offline in `tools/machine_cost_model.py`.
- The editor's visual style is generic slate/emerald Tailwind. The user wants it restyled to match the distinctive "verifier" aesthetic from the `import-cards` skill (`tools/card_matcher_gen.py`).

User requests (this session):
1. "Добавь поддержку орудий и техники, перепроверь" — add vehicle/artillery cost calculation; verify against the xlsx.
2. "пересмотри дизайн редактора, мне понравился дизайн верификатора который в /import-cards" — full editor redesign in the verifier aesthetic.
3. "не так давно мы делали для летающей техники расчёты, надо перенести в редактор" — bring the flyer (гравилёт) cost calc into the editor.
4. "перепроверь солдатский — можно редизайн тоже применить чтобы в одном стиле" — re-verify the squad calculator and restyle it in the same system.

## Goals

- A working **machine cost calculator** in the editor (техника + орудия + гравилёты), faithful to the technique xlsx, mirroring how `SoldiersCalculator` already works for squads.
- A **coherent visual redesign** of the whole editor (chrome + both editors + both calculators + modifiers) in the verifier's military-tool aesthetic.
- All cost logic **unit-tested** against the xlsx's own example vehicles/squads.

## Non-Goals

- Changing the **main app** (army builder, game session, encyclopedia). The verifier aesthetic is scoped to the editor only.
- Changing the underlying `Machine`/`Squad` runtime types or game logic. Only the **editor** (`CustomMachine`/`CustomSquad`) and editor-only data gain optional fields.
- Mobile editor (remains desktop-only).

## Verified cost models (cross-checked against the xlsx)

### Squad calculator — VERIFIED CORRECT
Cross-checked the whole 6-soldier «Ударное подразделение» squad (xlsx «АвтоРасчёт» rows 2–7) against `calculator-engine.ts`:

| # | Оружие (price) | ББ (price) | Σ catalog | xlsx V | engine |
|---|---|---|---|---|---|
| 1 | Снайперская (80) | без (0) | 20+80+0+40+80+20 | 240 | 240 ✓ |
| 2 | ПлазПистолет (45) | Пило/Электро (20) | 20+45+20+40+80+20 | 225 | 225 ✓ |
| 3 | Противотанк (80) | тяж.стрелк (0) | … | 240 | 240 ✓ |
| 4 | Пулемёт (100) | тяж.стрелк (0) | … | 260 | 260 ✓ |
| 5 | Автомат (40) | без (0) | … | 200 | 200 ✓ |
| 6 | Пистолет-пулемёт (25) | без (0) | … | 185 | 185 ✓ |

Σ soldiers = 1350 → /10 = 135 → `ceil5(135)` = **135** = xlsx «Цена отряда». Catalog prices match xlsx rows 37–55 exactly. Stats (rank, speed, melee, armor) match. **No formula changes needed** — only a restyle.

### Machine cost model — formula (from xlsx «Калькулятор» + «Арсенал», reproduced in `machine_cost_model.py`)

```
Стоимость машины = ceil5( Σ weaponCosts + броня×10 + скорость×10 [+ flyer premium] )

weaponCost(slot) = ceil( (rangePrice + powerPrice + propertyPrice + ammo×10) / 10 )
  rangePrice:  Д6=10, Д12=40, Д20=80  (per single die)
  powerPrice:  2× range table          (Д6=20, Д12=80, Д20=160)
  multi-dice multiplier: 1 die ×1, n dice ×(2n)   (2 dice ×4, 3 dice ×6)
  bonus:       +20 per "+1" (range and power independently)
  property:    burst3 ("3 выстрела в 3 напр.")=20, blast1 ("Взрыв 1шг −1Д12")=50, blast2 ("Взрыв 2шг −1Д20")=100
  ammo (БК):   10 per shot
  ББ slot:     cost = ББ rank (1/2/3)   [flat: ceil(rank×10/10) = rank]

броня   = monoblock.baseArmor + chassis.armorMod
скорость = monoblock.baseSpeed + chassis.speedMod

flyer premium (Гравилёт chassis):
  total += speed×10            // second move action (move-shoot-move)
  total *= 1.40                // flight bonus (overflight + grenade immunity)
```

Verified on xlsx example vehicles (Грифон: 5 weapons 125 + броня 16×10 160 + скорость 2×10 20 = **305** ✓; Вервольф 250, Предатор 415, Ти-Рекс 320, etc.). All 24 «Арсенал» preset prices (rows 59–85) reproduce exactly (Гатлинг Мк20=57, Шторм=79, Драконье пламя=30, Гарпун PB-1M=73 ✓).

## Architecture

### 1. Data model — `src/lib/editor/types.ts`

Add an optional round-trip field on `CustomMachine` (mirrors `CustomSquad.calculatorParams`):

```ts
export interface CustomMachine {
  // …existing fields…
  calculatorParams?: MachineCalculatorParams;   // NEW — present when cost was computed by the calculator
}

export type MonoblockId = 'РМ-1П' | 'РМ-1' | 'РМ-2' | 'УМ-1' | 'УМ-2';
export type ChassisId = 'Шагатель' | 'Траккер' | 'Гравилёт' | 'Стационарное';

export interface MachineCalculatorParams {
  monoblock: MonoblockId;
  chassis: ChassisId;
  slots: WeaponSlotConfig[];      // EXACTLY 5: [Верх, Верх, Манипулятор, Манипулятор, Нижнее]
}

export interface WeaponSlotConfig {
  preset: string;        // id from ARSENAL_PRESETS, or 'custom', or 'empty'
  range: string;         // 'Д12' | '2Д20' | 'Д6+2' | 'ББ'
  power: string;         // '3Д12' | 'Д20+3' | '1'|'2'|'3' (ББ rank)
  ammo: number;
  property: null | 'burst3' | 'blast1' | 'blast2';
}
```

The calculator **derives** from `calculatorParams`: `durability_max` (=броня), `ammo_max` (=БК tonnage), `rank`, `fire_rate`, `speed_sectors` (from weight class), `weapons[]`, `cost`. Existing machines without `calculatorParams` open with a «ручная стоимость» badge and remain fully editable as today.

### 2. Cost engine — `src/lib/machine-calculator-engine.ts` (NEW)

A pure-TS port of `tools/machine_cost_model.py`. Exports:

- `parseDice(s)` → `{ count, sides, bonus } | { kind: 'melee' } | null`
- `weaponCost(slot: WeaponSlotConfig): number`
- `machineCost(params: MachineCalculatorParams): { weapons: number; armor: number; speed: number; flyer: number; total: number; derived: { durability_max, ammo_max, speed_sectors, rank, fire_rate } }`
- types `WeaponSlotConfig`, `MachineCalculatorParams`

Reuses the dice-parsing approach already in `src/lib/game-logic.ts` (`parseRoll`) where sensible, but keeps the machine price tables local (they differ from squad tables).

### 3. Catalogs — `src/data/calculator/machine-catalogs.ts` (NEW)

```ts
MONOBLOCKS: { id, name, baseArmor, baseSpeed, ammoTonnage, fireRate, rank, weightClass }[]
// РМ-1П(11,6,18), РМ-1(14,5,18), РМ-2(15,4,16), УМ-1(15,3,20), УМ-2(12,5,16); all fireRate 2, rank 3

CHASSIS: { id, name, armorMod, speedMod, flyer, stationary }[]
// Шагатель(+0/+0), Траккер(+1/−1), Гравилёт(−4/+2, flyer), Стационарное(speed 0, stationary)

ARSENAL_PRESETS: { id, name, range, power, ammo, property, category, expectedCost }[]
// ~24 presets from xlsx «Арсенал» rows 59–85 (see table below) + ББ weapons + 'empty' + 'custom'

WEIGHT_SPEED_SECTORS: Record<weightClass, number[]>   // 3 sector speeds
// Лёгкий[6,5,4] Средний[5,4,3] Тяжёлый[4,3,2] Сверх.тяж[3,2,1]
```

**ARSENAL_PRESETS** (from xlsx, all prices verified):

| Preset | range | power | ammo | property | → cost | category |
|---|---|---|---|---|---|---|
| Лёгкий 3-х ствольный пулемёт Триплет Mk56 | Д12 | 2Д6 | 6 | burst3 | 20 | Огнестрельное |
| Двуствольный лёгкий пулемёт MG-546X2 | Д12 | 2Д6 | 6 | — | 18 | Огнестрельное |
| Шестиствольный пулемёт Вулкан Мк29 | Д12 | 3Д12 | 5 | — | 57 | Огнестрельное |
| 4-х ствольный пулемёт MG-442X4 | Д12 | 3Д12 | 5 | — | 57 | Огнестрельное |
| Двуствольный пулемёт S&W Mk95 | Д12 | 2Д12 | 5 | — | 41 | Огнестрельное |
| Лёгкая бронебойная пушка AрC-20S | Д20 | Д20 | 5 | — | 29 | Огнестрельное |
| Шестиствольная авт. пушка Гатлинг Мк20 | Д12 | 3Д12 | 5 | — | 57 | Огнестрельное |
| Двуствольная бронебойная пушка АТС-35Х2 | Д20 | 2Д20 | 4 | — | 76 | Огнестрельное |
| Скорострельная пушка Бамбук ATC-40 | Д12 | Д20 | 4 | — | 24 | Ракетное |
| Сверхтяжёлый пулемёт Тайфун S&W Mk40 | Д12 | 2Д12 | 5 | — | 41 | Огнестрельное |
| Авт. бронебойная пушка АТС-56X2 | Д12 | Д20 | 4 | — | 24 | Ракетное |
| Скорострельная авт. пушка АТСМ-56д | Д12 | Д20 | 4 | — | 24 | Ракетное |
| Тяжёлая бронебойная пушка АТС-76 | Д12 | 2Д12 | 5 | — | 41 | Огнестрельное |
| Пусковая установка Молот | Д12 | Д20 | 3 | — | 23 | Ракетное |
| Спаренная ракетная Длинный лук Mk25 | Д12 | Д20 | 2 | blast1 | 27 | Ракетное |
| Спаренная пусковая Шторм | Д12 | 2Д20 | 1 | blast2 | 79 | Ракетное |
| Лазерная пушка Световой меч LG-25 | 2Д12 | Д20 | 4 | — | 36 | Энергетическое |
| Плазменная пушка Драконье пламя | Д12 | Д20+3 | 4 | — | 30 | Энергетическое |
| Импульсная пушка Power Dart IMG-1M | 2Д12 | Д20 | 4 | — | 36 | Энергетическое |
| Энергетический гарпун Power Bolt PB-1M | Д6+2 | 2Д20 | 4 | — | 73 | Энергетическое |
| Механическая пила (ББ) | ББ | 2 | — | — | 2 | ББ |
| Бульдозерный отвал (ББ) | ББ | 3 | — | — | 3 | ББ |
| Кулак-манипулятор / Мех. пила (ББ) | ББ | 2 | — | — | 2 | ББ |
| Клешня (ББ) | ББ | 1 | — | — | 1 | ББ |

Plus `empty` («(ничего)», cost 0) and `custom` («Своё орудие», user-entered dice).

### 4. UI components

- **`MachineCalculator.tsx`** (NEW) — mirrors `SoldiersCalculator`. Top-level **«Тип: Техника | Орудие»** toggle; Моноблок + Шасси selectors → live derived броня/скорость/БК readout (speed hidden for Орудие); 5 weapon-slot rows (preset dropdown → fills dice, editable; ББ toggle → rank; ammo + property fields; per-slot cost); live cost breakdown (`Σ орудий | броня×10 | скорость×10 | полёт | = ИТОГО` — speed row omitted for Орудие); «Применить» button.
- **`MachineEditor.tsx`** — restructured: calculator becomes the primary mode (approach A: calculator = editor), with a manual tab for fine-tuning `speed_sectors`/weapons if needed. Saves `calculatorParams` alongside derived stats.
- **`SoldiersCalculator.tsx` / `SquadEditor.tsx`** — restyle only (no logic change; verified correct).
- **`EditorLayout.tsx`, `SourcesList`, `FactionsList`, `UnitsList`, `ModifiersEditor`** — restyle to the shared design system.

### 5. Visual design system (editor-scoped)

Fonts via `next/font/google`: **Black Ops One** (brand/numbers), **Oswald** (UI), **JetBrains Mono** (stats/prices). Colors as CSS variables scoped to an editor wrapper (do NOT leak into the main app):

```
--bg:#0f1216  --panel:#161a20  --panel2:#1d222a  --panel3:#252b34
--border:#2a313a  --bone:#e8e3d6  --muted:#8c949f  --dim:#5b636f
--ru:#ea580c  --green:#4ade80  --red:#f43f5e
```

Signature elements (from `card_matcher_gen.py`): hazard topbar (`repeating-linear-gradient` orange/black), subtle SVG-noise + radial-glow background, "military corner" accents on cards, status pills (ok=green / bad=red), red-pulsing empty stat cells, monospace stat grids. Implementation: an `editor-theme.css` (CSS variables) + a small set of shared Tailwind utility classes / a `ui/editor/` primitives folder, applied only within `/editor`.

## Орудия (стационарная артиллерия) — separate case

Орудия are a **first-class unit kind**, not just "a machine with a chassis dropdown". Per the user's own `import-cards` skill: *"Орудия (миномёты, спаренные пушки) — model as machines with empty `speed_sectors` (immobile), heavy weapons, low durability."*

**Model:** an орудие is a machine with `chassis: 'Стационарное'`:
- **No movement** — speed = 0; `speed_sectors` = a single immobile sector (`{ min_durability: 1, max_durability: durability_max, speed: 0 }`), rendered with a «⊕ неподвижно» badge (the navigator already treats immobile machines correctly).
- **Cost** = `ceil5(Σ weapons + броня×10)` — **no speed term** (speed×10 = 0). Armor is still priced.
- **Typical profile** — low броня, heavy weapons (миномёты, спаренные пушки, АТС на лафете).

**UX (explicit, not hidden in a dropdown):**
- Top-level **«Тип юнита: Техника | Орудие»** toggle in `MachineCalculator` / `UnitsList` "Создать" menu.
- Selecting **Орудие** → locks `chassis` to `Стационарное`, **hides the speed readout**, shows «⊕ орудие · неподвижно», and the моноблок selector stays (for base броня) but speed is forced to 0.
- The cost breakdown panel adapts: `Σ орудий + броня×10 = ИТОГО` (no speed row).

**Why a separate case:** the technique xlsx has no stationary example rows, so орудия must be modelled explicitly (immobility + no-speed-cost) rather than inferred. Treating them as a distinct kind prevents the user from accidentally pricing a towed gun as if it moved.

## Гравилёты (flyers)

`chassis: 'Гравилёт'` → applies flyer premium in `machineCost` (+speed×10 second move, then ×1.40), sets the machine's `flying` behavior. Default броня = моноблок base − 4 (the xlsx шасси rule); editable. See memory `flying-machines-cost.md` and `tools/machine_cost_model.py` for the per-vehicle armor overrides already in the data.

## Existing-machine handling

Machines already in `src/data/sources/*/machines.json` (and existing custom machines) have no `calculatorParams`. The editor opens them in manual mode with a «ручная стоимость» badge; all current fields remain editable. Users can opt into the calculator by picking a моноблок/шасси (which back-fills `calculatorParams`). No data migration required — the field is optional.

## Testing

**Unit** (`src/__tests__/`):
- `machine-calculator-engine.test.ts`:
  - Each of the 24 ARSENAL_PRESETS → exact `expectedCost`.
  - All 17 xlsx example vehicles (rows 45–61) → exact total cost (305, 250, 415, 320, 340, …).
  - Edge cases: ББ-only slot, empty slot, Гравилёт premium (+40% + second move), 3-dice weapons, +bonus dice.
  - **Орудие case** (explicit): a `Стационарное` machine → cost has **no speed term** (`Σ weapons + броня×10`), `speed_sectors` = single immobile `{1..durability_max, speed:0}`. E.g. 2 weapons (60) + броня 10×10 (100) → 160.
- Extend the existing squad-calculator test with the verified 6-soldier «Ударное подразделение» squad → 135 (regression guard).

**E2E** (`e2e/`):
- `editor.spec.ts` — add: create a machine via the calculator (pick УМ-1 + Траккер + 2 weapons → assert computed cost → save), switch squad/machine tabs, apply cost.
- `calculator-tab.spec.ts` — update selectors/assertions to the restyled UI.

`npm run type-check` + `npm run test` must pass (E2E is CI-only per CLAUDE.md).

## Scope / phasing

Single PR, but ordered for reviewability:
1. **Engine + catalogs + unit tests** (`machine-calculator-engine.ts`, `machine-catalogs.ts`, tests) — pure logic, lands first.
2. **`MachineCalculator` + `MachineEditor` integration** — the feature.
3. **Visual design system** (`editor-theme`, shared primitives) + restyle all editor components (chrome, squad calculator, modifiers).
4. **E2E updates.**

## Decisions log (from brainstorming)

- **Scope:** Full editor redesign (verifier aesthetic) + machine calculator. *(chosen over machine-only or calculator-only)*
- **Weapon entry:** Formula-driven cost (faithful to xlsx) **+ named preset dropdown** compiled from xlsx «Арсенал» rows 59–85. *(chosen over formula-only or fixed-price catalog)*
- **Approach:** Calculator IS the editor (моноблок+шасси derive stats), mirroring `SoldiersCalculator`. *(chosen over side-panel or phased)*
- **Slots:** Exactly 5 fixed weapon slots (Верх×2, Манипулятор×2, Нижнее) — as in xlsx «Калькулятор».
- **Aesthetic scope:** Editor only; main app unchanged.
- **Fonts:** `next/font/google` (Black Ops One / Oswald / JetBrains Mono).

## Open implementation notes

- **Speed-sector band mapping:** the xlsx gives 3 sector speeds per weight class; how `durability_max` splits into 3 durability bands (the `min_durability`/`max_durability` of each `speed_sectors` entry) follows the xlsx armor-range pattern (e.g. броня "16…7" → bands). To be finalized in implementation against existing machines' `speed_sectors`.
- **Flyer armor:** default моноблок−4, editable in the UI (the python tool's per-vehicle `ARMOR_OVERRIDE` values are already baked into the existing flyer JSON).
- **УМ-2 weight class:** not explicitly labelled in xlsx; assign Средний speed table (5/4/3) per the Локуст example.
