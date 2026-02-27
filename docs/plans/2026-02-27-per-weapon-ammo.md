# Per-Weapon Ammo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить раздельный боезапас для каждого орудия техники в фанатской версии правил (community_star_system).

**Architecture:** Добавляем `ammo` в каждое оружие в JSON и `weaponAmmo[]` в runtime-состояние ArmyUnit. UI показывает боезапас по оружию и блокирует оружие без боеприпасов.

**Tech Stack:** TypeScript, React, Next.js 14, Tailwind CSS

---

## Task 1: Update Weapon type

**Files:**
- Modify: `src/lib/types.ts:108-115`

**Step 1: Add ammo field to Weapon interface**

```typescript
export interface Weapon {
  name: string;
  range: string;
  power: string;
  special?: WeaponSpecial;
  description?: string;
  manufacturer?: string;
  ammo?: number;  // Per-weapon ammo (only for community_star_system)
}
```

**Step 2: Add weaponAmmo to ArmyUnit interface**

Find the `ArmyUnit` interface (around line 154) and add:

```typescript
weaponAmmo?: number[];  // Current ammo per weapon [weapon0Ammo, weapon1Ammo, ...]
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add ammo to Weapon and weaponAmmo to ArmyUnit"
```

---

## Task 2: Update Polaris machines.json

**Files:**
- Modify: `src/data/polaris/machines.json`

**Step 1: Add ammo field to each weapon**

For each machine, add `"ammo": <ammo_max>` to every weapon. Example:

```json
{
  "id": "raptor",
  "name": "Раптор",
  ...
  "ammo_max": 10,
  "weapons": [
    {
      "name": "Пусковая установка Молот для ракет R-6",
      "range": "D6+2",
      "power": "2D20",
      "ammo": 10,
      "description": "..."
    },
    {
      "name": "Пусковая установка Молот для ракет R-6 (вторая)",
      "range": "D6+2",
      "power": "2D20",
      "ammo": 10,
      "description": "..."
    }
  ]
}
```

Repeat for all machines in the file. Use the machine's `ammo_max` value.

**Step 2: Verify JSON is valid**

Run: `cat src/data/polaris/machines.json | jq . > /dev/null && echo "Valid JSON"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add src/data/polaris/machines.json
git commit -m "feat(data): add ammo to polaris machine weapons"
```

---

## Task 3: Update Protectorate machines.json

**Files:**
- Modify: `src/data/protectorate/machines.json`

**Step 1: Add ammo field to each weapon**

Same as Task 2 - add `"ammo": <ammo_max>` to every weapon.

**Step 2: Verify JSON is valid**

Run: `cat src/data/protectorate/machines.json | jq . > /dev/null && echo "Valid JSON"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add src/data/protectorate/machines.json
git commit -m "feat(data): add ammo to protectorate machine weapons"
```

---

## Task 4: Update Mercenaries machines.json

**Files:**
- Modify: `src/data/mercenaries/machines.json`

**Step 1: Add ammo field to each weapon**

Same as Task 2 - add `"ammo": <ammo_max>` to every weapon.

**Step 2: Verify JSON is valid**

Run: `cat src/data/mercenaries/machines.json | jq . > /dev/null && echo "Valid JSON"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add src/data/mercenaries/machines.json
git commit -m "feat(data): add ammo to mercenaries machine weapons"
```

---

## Task 5: Add weaponAmmo initialization in ArmyBuilder

**Files:**
- Modify: `src/components/ArmyBuilder.tsx`

**Step 1: Find where machines are added to army**

Search for where `addUnitToArmy` or similar function handles machines.

**Step 2: Initialize weaponAmmo for machines**

When adding a machine, initialize `weaponAmmo` array from weapon definitions:

```typescript
// When creating ArmyUnit for a machine:
const machine = unitData as Machine;
const weaponAmmo = machine.weapons.map(w => w.ammo ?? machine.ammo_max);

const newUnit: ArmyUnit = {
  instanceId: generateInstanceId(),
  type: 'machine',
  data: machine,
  currentDurability: machine.durability_max,
  currentAmmo: machine.ammo_max,
  weaponAmmo, // NEW
  // ... other fields
};
```

**Step 3: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 4: Commit**

```bash
git add src/components/ArmyBuilder.tsx
git commit -m "feat(army): initialize weaponAmmo when adding machine"
```

---

## Task 6: Update UnitCard to show per-weapon ammo (community_star_system only)

**Files:**
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Get rules version in UnitCard**

Add rules version detection at the top of the component:

```typescript
const [rulesVersion, setRulesVersion] = useState<RulesVersionID>('tehnolog');

useEffect(() => {
  const saved = localStorage.getItem('bronepehota_rules_version');
  if (saved) setRulesVersion(saved as RulesVersionID);
}, []);
```

**Step 2: Create helper to check if per-weapon ammo is enabled**

```typescript
const usePerWeaponAmmo = rulesVersion === 'community_star_system';
```

**Step 3: Update weapon display to show ammo**

Find where weapons are displayed (around line 900+). Update to show ammo per weapon:

```tsx
{(data as Machine).weapons.map((weapon, idx) => {
  const weaponAmmo = unit.weaponAmmo?.[idx] ?? (weapon.ammo ?? (data as Machine).ammo_max);
  const weaponMaxAmmo = weapon.ammo ?? (data as Machine).ammo_max;
  const hasAmmo = weaponAmmo > 0;
  const isMeleeWeapon = weapon.range === 'ББ';

  return (
    <button
      key={idx}
      onClick={() => handleWeaponClick(idx)}
      disabled={!hasAmmo && !isMeleeWeapon && usePerWeaponAmmo}
      className={cn(
        "px-2 py-1 text-xs rounded border transition-all",
        !hasAmmo && !isMeleeWeapon && usePerWeaponAmmo
          ? "opacity-40 cursor-not-allowed border-slate-700"
          : "border-slate-600 hover:border-slate-500"
      )}
    >
      {shortenWeaponName(weapon.name)}
      {usePerWeaponAmmo && !isMeleeWeapon && (
        <span className="ml-1 text-blue-400">
          ({weaponAmmo}/{weaponMaxAmmo})
        </span>
      )}
    </button>
  );
})}
```

**Step 4: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 5: Commit**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "feat(ui): show per-weapon ammo in UnitCard"
```

---

## Task 7: Update ammo consumption in combat result handler

**Files:**
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Update applyCombatResult to use weaponAmmo**

Find the `applyCombatResult` function (around line 220-250). Update the ammo consumption logic:

```typescript
if (result.unitType === 'machine') {
  const weaponIndex = result.parameters.weaponIndex || 0;
  const weapon = (unit.data as Machine).weapons[weaponIndex];
  const isMeleeWeapon = weapon?.range === 'ББ';

  // Per-weapon ammo for community_star_system
  const usePerWeaponAmmo = rulesVersion === 'community_star_system';

  if (usePerWeaponAmmo) {
    // Decrease weapon-specific ammo
    const currentWeaponAmmo = unit.weaponAmmo?.[weaponIndex] ?? (weapon.ammo ?? (unit.data as Machine).ammo_max);
    const newWeaponAmmo = [...(unit.weaponAmmo || [])];
    newWeaponAmmo[weaponIndex] = isMeleeWeapon
      ? currentWeaponAmmo
      : Math.max(0, currentWeaponAmmo - 1);

    updateThisUnit((u) => ({
      ...u,
      weaponAmmo: newWeaponAmmo,
      // Also update global ammo for display compatibility
      currentAmmo: Math.max(0, (u.currentAmmo || 0) - (isMeleeWeapon ? 0 : 1)),
      machineShotsUsed: newShotsUsed,
      machineWeaponShots: newWeaponShots,
      isMachineShot: true
    }));
  } else {
    // Original behavior for tehnolog
    const newAmmo = isMeleeWeapon
      ? (unit.currentAmmo || 0)
      : Math.max(0, (unit.currentAmmo || 0) - 1);
    // ... existing code
  }
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "feat(combat): consume per-weapon ammo for community_star_system"
```

---

## Task 8: Update canShoot check for per-weapon ammo

**Files:**
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Update canShoot logic**

Find the `canShoot` variable (around line 902-906). Update to check weapon-specific ammo:

```typescript
const weaponIndex = selectedWeaponIndex ?? 0;
const weapon = (data as Machine).weapons[weaponIndex];
const isMeleeWeapon = weapon?.range === 'ББ';

let hasAmmo = true;
if (usePerWeaponAmmo && !isMeleeWeapon) {
  const weaponAmmo = unit.weaponAmmo?.[weaponIndex] ?? (weapon.ammo ?? (data as Machine).ammo_max);
  hasAmmo = weaponAmmo > 0;
} else if (!isMeleeWeapon) {
  hasAmmo = (unit.currentAmmo || 0) > 0;
}

const canShoot = !isMachineDone && !isMachineDestroyed &&
                hasAmmo &&
                totalShotsUsed < fireRate;
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "feat(combat): check per-weapon ammo before shooting"
```

---

## Task 9: Update ammo UI display for per-weapon mode

**Files:**
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Update ammo progress bar section**

Find the ammo progress bar (around line 805-823). For `community_star_system`, show total ammo across all weapons or hide it:

```tsx
{!usePerWeaponAmmo && (
  <>
    {/* Existing ammo progress bar - only for tehnolog */}
    <div className="flex-1 flex items-center gap-1">
      {/* ... existing code ... */}
    </div>
  </>
)}
{usePerWeaponAmmo && (
  <div className="text-xs text-slate-400 italic">
    Боезапас по орудиям
  </div>
)}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No new errors

**Step 3: Commit**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "feat(ui): hide global ammo bar for community_star_system"
```

---

## Task 10: Test and verify

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run type check**

Run: `npm run type-check`
Expected: No errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Manual test**

1. Start dev server: `npm run dev`
2. Open app in browser
3. Select `community_star_system` rules
4. Add a machine to army
5. Go to battle mode
6. Verify weapon buttons show ammo `(10/10)`
7. Fire a weapon
8. Verify ammo decreased `(9/10)`
9. Fire until ammo is 0
10. Verify weapon is grayed out/disabled

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete per-weapon ammo system for community_star_system"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Update types | types.ts |
| 2-4 | Update machines.json | data/*/machines.json |
| 5 | Initialize weaponAmmo | ArmyBuilder.tsx |
| 6-9 | Update UI and logic | UnitCard.tsx |
| 10 | Test and verify | - |
