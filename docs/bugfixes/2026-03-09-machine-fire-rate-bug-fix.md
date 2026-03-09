# Machine Fire Rate Bug Fix

**Date:** 2026-03-09
**Status:** ✅ Fixed and Tested
**Branch:** unit-card

## Problem Statement

Машины могли стрелять бесконечно, игнорируя лимит скорострельности `fire_rate`. Счётчик выстрелов не обновлялся после совершения выстрела.

## Root Causes

### 1. Fire rate limit not enforced
**File:** `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx`

Fire button didn't check if shots exceeded fireRate:
```typescript
// BEFORE - No disabled prop
<button onClick={() => onWeaponAttack(weaponIdx)}>
  ВЫСТРЕЛ
</button>
```

### 2. Wrong prop passed for shots
**File:** `src/components/cards/unit-card/MachineView.tsx`

Passed `shotsUsed={(unit as any).shotsUsed}` but should be `unit.machineShotsUsed`.

### 3. Shot counting not triggered
**File:** `src/components/cards/UnitCard.tsx`

`useEffect` processed results when `phase === 'RESULTS'` but this happened before user clicked "Apply". When user clicked "Apply", the useEffect didn't re-run because state hadn't changed.

## Solutions

### Fix 1: Add fireRate prop and disabled logic
**File:** `src/components/cards/unit-card/machine-view/MachineWeaponsList.tsx`

```typescript
// AFTER - Correct disabled logic
<button
  onClick={() => onWeaponAttack(weaponIdx)}
  disabled={shots >= fireRate}
  className={cn(
    shots >= fireRate
      ? "bg-slate-900/40 border-slate-700/50 text-slate-600 cursor-not-allowed opacity-50"
      : "bg-amber-950/20 hover:bg-amber-950/40 border-amber-700/50 text-amber-400"
  )}
>
  ВЫСТРЕЛ
</button>
```

### Fix 2: Correct prop in MachineView
**File:** `src/components/cards/unit-card/MachineView.tsx`

```typescript
// AFTER
<MachineAmmoPanel
  shotsUsed={unit.machineShotsUsed || 0}  // Correct!
  fireRate={machine.fire_rate}
/>
```

### Fix 3: Move shot counting to handleApplyResult
**File:** `src/components/cards/UnitCard.tsx`

Moved machine shot counting logic from `useEffect` to `handleApplyResult`:

```typescript
const handleApplyResult = (markAsDone?: boolean) => {
  const result = combatController.state.result;

  // Process result for machines
  if (!isSquad && result?.unitType === 'machine') {
    if (result.actionType === 'shot' || result.actionType === 'grenade') {
      const weaponIndex = result.parameters.weaponIndex || 0;
      const newShotsUsed = (unit.machineShotsUsed || 0) + 1;
      const newWeaponShots = {
        ...(unit.machineWeaponShots || {}),
        [weaponIndex]: (unit.machineWeaponShots?.[weaponIndex] || 0) + 1
      };

      // Update unit with new shot counts
      updateThisUnit((u) => ({
        ...u,
        currentAmmo: newAmmo,
        machineShotsUsed: newShotsUsed,
        machineWeaponShots: newWeaponShots,
        isMachineShot: true
      }));
    }
  }

  // Close combat after processing
  combatController.closeCombat();
};
```

## Test Coverage

Added comprehensive test coverage:

### New test files:
- `UnitCardMachineFireRate.test.tsx` - 17 tests
- `MachineFireRateIntegration.test.tsx` - 19 integration tests

### Enhanced test files:
- `MachineView.test.tsx` - 13 tests
- `MachineWeaponsList.test.tsx` - 28 tests

### Total: 77 new tests
- **Before:** 586 tests
- **After:** 663 tests
- **All passing:** ✅

## Commits

1. `b0ba9b8` - fix(unit-card): enforce fire rate limit and fix shot counter
2. `7f15096` - fix(unit-card): move machine shot counting to handleApplyResult
3. `22c311f` - fix(machine-view): use correct machineShotsUsed prop
4. `9493474` - test: add comprehensive machine weapon fire rate tests

## Verification

### Manual Testing Checklist
- [x] Fire button becomes disabled after fireRate shots
- [x] Button shows visual feedback (opacity, colors) when disabled
- [x] Shot counter displays correctly (1/2, 2/2)
- [x] Each weapon tracks shots independently
- [x] Ammo decreases when shot is fired
- [x] Melee weapons (ББ) don't consume ammo

### Automated Testing
- [x] All 663 unit tests passing
- [x] All 41 E2E tests passing
- [x] No lint errors

## Success Criteria Met

✅ Machine fire rate limit is enforced
✅ Shot counter increments correctly
✅ Button disabled state with visual feedback
✅ Per-weapon independent shot tracking
✅ Comprehensive test coverage added
✅ All tests passing
