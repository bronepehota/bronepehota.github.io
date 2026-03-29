# Soldier Effects Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow players to apply buffs and debuffs to individual soldiers during battle via the ModifierIndicator on SoldierCard.

**Architecture:** Add `onModifierClick` prop through the component chain (GameSession → UnitCard → SquadView → SoldierCard → SoldierStats → ModifierIndicator). Create SoldierEffectsModal bottom-sheet component. Store effects in `soldierModifiers[]` on ArmyUnit. Use existing `cleanupExpiredModifiers()` for auto-cleanup.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, existing modifier system

**Spec:** `docs/superpowers/specs/2026-03-23-soldier-effects-integration-design.md`

---

### Task 1: Create SoldierEffectsModal component

**Files:**
- Create: `src/components/modals/SoldierEffectsModal.tsx`
- Reference: `src/components/modals/DebuffModal.tsx` (bottom-sheet pattern)

- [ ] **Step 1: Create SoldierEffectsModal**

Mobile bottom-sheet modal with:
- Header: "Эффекты: {soldierName}" + close button (X)
- Section "Активные": list of `soldierModifiers` with ModifierIcon, name, timer (ход X/Y), remove button (Minus icon)
- Two tabs: "БАФЫ" / "ДЕБАФЫ" with catalog items
- Each catalog item: ModifierIcon, name, description, apply button (Plus icon)
- Empty state when no available modifiers

```tsx
// Key structure:
interface SoldierEffectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soldierModifiers: SoldierModifier[];
  availableBuffs: BuffDefinition[];
  availableDebuffs: DebuffTemplate[];
  currentTurn: number;
  onApplyModifier: (item: BuffDefinition | DebuffTemplate, type: 'buff' | 'debuff') => void;
  onRemoveModifier: (modifierId: string) => void;
  soldierName: string;
}
```

Reuse from DebuffModal: bottom-sheet layout, body scroll lock, escape key, focus management, drag handle.

- [ ] **Step 2: Verify with type-check**

Run: `npm run type-check`
Expected: PASS (may have errors until prop chain is connected in Task 2)

---

### Task 2: Wire onModifierClick through component chain

**Files:**
- Modify: `src/components/cards/SoldierCard.tsx:13-27` (add prop + pass to SoldierStats)
- Modify: `src/components/cards/SoldierCard.tsx:268-286` (memo comparison: add `onModifierClick`)
- Modify: `src/components/cards/unit-card/SquadView.tsx:4-16` (add prop + pass to SoldierCard)
- Modify: `src/components/cards/UnitCard.tsx:23-37` (add prop + pass to SquadView)

- [ ] **Step 1: Add onModifierClick to SoldierCard**

Add `onModifierClick?: () => void` to `SoldierCardProps` interface. Pass it to `<SoldierStats onModifierClick={onModifierClick} />` on line 243 (currently missing).

Add `onModifierClick` to memo comparison function.

- [ ] **Step 2: Add onModifierClick to SquadView**

Add `onModifierClick?: () => void` to `SquadViewProps` interface. Pass it to `<SoldierCard onModifierClick={onModifierClick} />`.

- [ ] **Step 3: Add onModifierClick to UnitCard**

Add `onModifierClick?: () => void` to `UnitCardProps` interface. Pass it to `<SquadView onModifierClick={onModifierClick} />`.

- [ ] **Step 4: Verify with type-check**

Run: `npm run type-check`
Expected: PASS

---

### Task 3: Integrate modal into GameSession

**Files:**
- Modify: `src/components/GameSession.tsx`

- [ ] **Step 1: Add imports and state**

Import `SoldierEffectsModal`, `getStandardBuffs`, `getStandardDebuffs`, `getCustomModifiers` from modifier-utils.

Add state:
```tsx
const [effectsModalState, setEffectsModalState] = useState<{
  unitId: string;
  soldierIndex: number;
  soldierName: string;
} | null>(null);
```

Add memo for available modifiers (filtered by `applyTo.includes('soldier')`):
```tsx
const { soldierBuffs, soldierDebuffs } = useMemo(() => {
  const custom = getCustomModifiers();
  const standard = getStandardBuffs();
  const standardDebuffs = getStandardDebuffs();
  const allBuffs = [...standard, ...custom.buffs];
  const allDebuffs = [...standardDebuffs, ...custom.debuffs];
  return {
    soldierBuffs: allBuffs.filter(b => b.applyTo.includes('soldier')),
    soldierDebuffs: allDebuffs.filter(d => d.applyTo.includes('soldier')),
  };
}, []);
```

- [ ] **Step 2: Add handlers**

```tsx
const handleSoldierModifierClick = (unitId: string, soldierIndex: number, soldierName: string) => {
  setEffectsModalState({ unitId, soldierIndex, soldierName });
};

const handleCloseEffectsModal = () => {
  setEffectsModalState(null);
};

const handleApplySoldierModifier = (unitId: string, soldierIndex: number, item: BuffDefinition | DebuffTemplate) => {
  updateUnit(unitId, (unit) => ({
    ...unit,
    soldierModifiers: [
      ...(unit.soldierModifiers || []),
      {
        id: `${item.id}_${Date.now()}`,
        name: item.name,
        description: item.description,
        target: item.target,
        value: item.value,
        phase: item.phase,
        icon: item.icon,
        appliedAtTurn: army.currentTurn || 1,
        duration: 'duration' in item ? item.duration! : 1,
        expiresAtTurn: (army.currentTurn || 1) + ('duration' in item ? item.duration! : 1),
        soldierIndex,
      },
    ],
  }));
};

const handleRemoveSoldierModifier = (unitId: string, modifierId: string) => {
  updateUnit(unitId, (unit) => ({
    ...unit,
    soldierModifiers: (unit.soldierModifiers || []).filter((m) => m.id !== modifierId),
  }));
};
```

- [ ] **Step 3: Pass onModifierClick to UnitCard**

On the `<UnitCard>` JSX (line ~586), add:
```tsx
onModifierClick={effectsModalState ? () => setEffectsModalState(null) : undefined}
```

Wait — this is wrong. The UnitCard needs a callback that captures unitId + soldierIndex. But UnitCard renders multiple SoldierCards through SquadView. The correct approach:

- `onModifierClick` on UnitCard/SquadView/SoldierCard takes no args — it's bound to a specific soldier
- We need a different approach: pass a factory function `onModifierClickFactory: (unitId: string, soldierIndex: number, soldierName: string) => () => void`

Actually simpler: just add a single callback prop `onSoldierModifierClick: (unitId: string, soldierIndex: number, soldierName: string) => void` and handle the binding inside SoldierCard.

- [ ] **Step 4: Render SoldierEffectsModal**

Add before closing `</div>` of GameSession:
```tsx
{effectsModalState && (() => {
  const unit = army.units.find(u => u.instanceId === effectsModalState.unitId);
  if (!unit) return null;
  return (
    <SoldierEffectsModal
      isOpen={!!effectsModalState}
      onClose={handleCloseEffectsModal}
      soldierModifiers={(unit.soldierModifiers || []).filter(
        m => m.soldierIndex === effectsModalState.soldierIndex
      )}
      availableBuffs={soldierBuffs}
      availableDebuffs={soldierDebuffs}
      currentTurn={army.currentTurn || 1}
      onApplyModifier={(item) => handleApplySoldierModifier(
        effectsModalState.unitId, effectsModalState.soldierIndex, item
      )}
      onRemoveModifier={(modId) => handleRemoveSoldierModifier(
        effectsModalState.unitId, modId
      )}
      soldierName={effectsModalState.soldierName}
    />
  );
})()}
```

- [ ] **Step 5: Verify with type-check and lint**

Run: `npm run type-check && npm run lint`
Expected: PASS

---

### Task 4: Wire the prop chain with callback

**Files:**
- Modify: `src/components/cards/SoldierCard.tsx` — add `onSoldierModifierClick` prop
- Modify: `src/components/cards/unit-card/SquadView.tsx` — pass through
- Modify: `src/components/cards/UnitCard.tsx` — pass through from GameSession
- Modify: `src/components/GameSession.tsx` — pass to UnitCard

- [ ] **Step 1: Add onSoldierModifierClick to SoldierCard**

Replace `onModifierClick?: () => void` (if added in Task 2) with:
```tsx
onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void;
```

Bind it in SoldierStats:
```tsx
<SoldierStats
  ...
  onModifierClick={onSoldierModifierClick ? () => onSoldierModifierClick(unit.instanceId, soldierIndex, soldier.name) : undefined}
/>
```

- [ ] **Step 2: Pass through SquadView and UnitCard**

SquadView: add `onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void` and pass to SoldierCard.

UnitCard: add `onSoldierModifierClick?: (unitId: string, soldierIndex: number, soldierName: string) => void` and pass to SquadView.

GameSession: pass `onSoldierModifierClick={handleSoldierModifierClick}` to UnitCard.

- [ ] **Step 3: Verify with type-check**

Run: `npm run type-check`
Expected: PASS

---

### Task 5: Run tests and verify

- [ ] **Step 1: Run unit tests**

Run: `npm run test`
Expected: All tests pass (existing tests + any new ones)

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS (no new errors)

- [ ] **Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: PASS (no regressions)

- [ ] **Step 4: Manual verification in browser**

Run: `npm run dev`
1. Navigate to battle, open a squad unit
2. Tap ModifierIndicator on a soldier → modal opens
3. Only soldier-applicable modifiers shown
4. Apply a buff → indicator shows icon
5. Apply a debuff → indicator shows icon
6. Remove effect → icon disappears
7. Check localStorage persistence (reload page)
