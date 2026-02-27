# Per-Weapon Ammo System

## Overview

Раздельный боезапас для каждого орудия техники. Применяется только для фанатской версии правил (`community_star_system`).

## Motivation

В фанатской редакции правил каждое орудие имеет свой боезапас, а не общий пул. Это делает геймплей более тактическим — игрок должен выбирать, какое оружие использовать, учитывая оставшиеся снаряды.

## Design

### 1. Data Model Changes

#### Weapon interface (types.ts)

```typescript
export interface Weapon {
  name: string;
  range: string;
  power: string;
  special?: WeaponSpecial;
  description?: string;
  manufacturer?: string;
  ammo?: number;  // NEW: Per-weapon ammo (only for community_star_system)
}
```

#### ArmyUnit runtime state

```typescript
export interface ArmyUnit {
  // ... existing fields
  weaponAmmo?: number[];  // NEW: Current ammo per weapon [weapon0Ammo, weapon1Ammo, ...]
}
```

### 2. JSON Data Format

**Before:**
```json
{
  "ammo_max": 20,
  "weapons": [
    { "name": "Пушка", "range": "D12", "power": "2D20" },
    { "name": "Ракеты", "range": "D6+2", "power": "3D20" }
  ]
}
```

**After:**
```json
{
  "ammo_max": 20,
  "weapons": [
    { "name": "Пушка", "range": "D12", "power": "2D20", "ammo": 20 },
    { "name": "Ракеты", "range": "D6+2", "power": "3D20", "ammo": 4 }
  ]
}
```

### 3. UI Changes (community_star_system only)

- Display format: `Название оружия (текущий/макс)`
- Example: `Шестиствольная пушка (15/20)`
- Weapons with `ammo = 0`: grayed out, disabled for selection

### 4. Combat Logic

#### Rules behavior:

| Rules Version | Ammo Behavior |
|---------------|---------------|
| `tehnolog` | Use global `ammo_max` (current behavior) |
| `community_star_system` | Use per-weapon `ammo` |

#### Shooting flow:
1. Select weapon
2. Check if weapon has ammo > 0 (for community_star_system)
3. If no ammo: weapon is disabled/grayed
4. Execute shot
5. Decrease weapon's ammo by 1

### 5. Backward Compatibility

- If `weapon.ammo` is not specified in JSON:
  - For `community_star_system`: use `machine.ammo_max` as default
- Existing saves with `currentAmmo` continue to work for `tehnolog` rules

## Implementation Tasks

1. Update `types.ts` - add `ammo?: number` to Weapon interface
2. Update `types.ts` - add `weaponAmmo?: number[]` to ArmyUnit
3. Update all `machines.json` files - add `ammo` to each weapon
4. Update UI components to show per-weapon ammo
5. Update combat logic to handle per-weapon ammo consumption
6. Add weapon disabling when ammo = 0

## Files to Modify

- `src/lib/types.ts`
- `src/data/*/machines.json` (all factions)
- `src/components/combat/*` (combat UI)
- `src/components/cards/*` (unit cards)
- `src/hooks/useCombatFlow.ts` (combat logic)
