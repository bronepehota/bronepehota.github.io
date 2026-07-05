# Machine Capture Implementation Plan (#168)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a soldier capture an enemy machine (add it to the army with current durability/ammo + the soldier as pilot) and let the player mark their own machine captured (with recapture).

**Architecture:** Side A — a `'capture'` combat action opens a new `CaptureModal` (machine picker from the full cross-faction catalog, rank-filtered, default opposing faction; enter current durability/ammo); confirm adds the machine via `setArmy` and assigns the capturing soldier as its pilot (reusing `PilotAssignmentModal`'s assign logic). Side B — an `isCaptured` flag on machine `ArmyUnit`; the card shows a «ЗАХВАЧЕНА» banner, disables actions, and a toggle button («Отметить захваченной» ↔ «Вернуть»).

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind, lucide-react, Jest + RTL (unit), Playwright (E2E).

**Spec:** `docs/superpowers/specs/2026-07-05-machine-capture-design.md`

## Global Constraints

- **Rule (v0.3 §9):** a pilot-less machine can be captured; the capturer (rank ≥ machine rank) becomes its pilot; machine transfers with **current durability + ammo**. Single-army app → captured machine entered manually (type from catalog + current durability/ammo); no opponent army modeled.
- **Catalog:** use `getUnitsByType('machine')` from `@/lib/encyclopedia-registry` (cross-faction; each `EncyclopediaUnit` has `id, name, faction, rank, durability_max, ammo_max, image, type`).
- **Default faction filter = opposing** (≠ `army.faction`); player can switch faction in the picker.
- **Rank filter** (`strictPilotRankEnabled`): only machines with `rank ≤ soldier.rank`.
- **Numbering:** `getNextInstanceNumber(army, machine.id)` + `assignInstanceNumber`; `instanceId = \`${machine.id}_${Date.now()}\``.
- **Pilot assignment** mirrors `PilotAssignmentModal`: capturer gets `isPilot=true`, `pilotOfInstanceId`, action done; machine gets `pilotInfo = { squadInstanceId, soldierIndex, pilotArmor, alive:true }`.
- **Preserve existing flows:** shot/melee/grenade/ram combat, pilot assignment, army builder unchanged.
- Russian UI text; English code. 44px touch targets. Trust `npm run type-check` over stale LSP.
- **Branch:** `feat/168-machine-capture` (off `main`). Commit per task. `Co-Authored-By: Claude <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `src/lib/capture-catalog.ts` — catalog aggregation + pure filters (rank, faction).
- `src/components/modals/CaptureModal.tsx` — 2-step bottom-sheet (pick machine → enter durability/ammo → confirm).
- `src/__tests__/lib/capture-catalog.test.ts` — unit tests for filters.

**Modify:**
- `src/lib/types.ts` — `ArmyUnit.isCaptured?: boolean`.
- `src/lib/combat-types.ts` — `'capture'` in `CombatActionType`.
- `src/components/combat/ActionSelector.tsx` — `capture` action (gated) + style entry.
- `src/components/cards/UnitCard.tsx` — intercept `'capture'` → open `CaptureModal`; `handleCaptureConfirm`; `isCaptured` toggle; pass-through.
- `src/components/cards/unit-card/MachineView.tsx` — «ЗАХВАЧЕНА» banner + toggle button + disable actions when captured.

---

## Task 1: Types + catalog helper (TDD)

**Files:**
- Modify: `src/lib/types.ts` (ArmyUnit)
- Modify: `src/lib/combat-types.ts` (CombatActionType)
- Modify: `src/components/combat/ActionSelector.tsx` (style map — required by the union)
- Create: `src/lib/capture-catalog.ts`
- Create: `src/__tests__/lib/capture-catalog.test.ts`

**Interfaces:**
- Produces: `CaptureCandidate` + `getCaptureCandidates()` + `filterCaptureCatalog(catalog, opts)` + `opposingFaction(armyFaction, allFactions)` (capture-catalog.ts); `ArmyUnit.isCaptured`; `'capture'` action type. Consumed by Tasks 2-4.

- [ ] **Step 1: Add `isCaptured` to ArmyUnit**

In `src/lib/types.ts`, add to the `ArmyUnit` interface (next to `isMachineDone`/similar runtime flags):
```ts
  /** Machine captured by the opponent (inactive, recapture-able). #168 */
  isCaptured?: boolean;
```

- [ ] **Step 2: Add `'capture'` to CombatActionType**

In `src/lib/combat-types.ts` (line ~20):
```ts
export type CombatActionType = 'shot' | 'melee' | 'grenade' | 'ram' | 'capture';
```

- [ ] **Step 3: Add `capture` style entry to ActionSelector**

In `src/components/combat/ActionSelector.tsx`, add to the `styles` map inside `getActionStyle` (after `ram`):
```ts
    capture: {
      primary: 'text-fuchsia-400',
      border: 'border-fuchsia-600/50',
      bg: 'bg-fuchsia-950/30',
      hover: 'hover:bg-fuchsia-950/50 hover:border-fuchsia-500/60',
      shadow: 'shadow-fuchsia-900/20',
    },
```
(This prevents a TS error from the union extension; the action button itself is added in Task 3.)

- [ ] **Step 4: Write failing tests for the catalog helper**

`src/__tests__/lib/capture-catalog.test.ts`:
```ts
import { filterCaptureCatalog, opposingFaction, getCaptureCandidates, CaptureCandidate } from '@/lib/capture-catalog';

const catalog: CaptureCandidate[] = [
  { id: 'm1', name: 'M1', faction: 'polaris', rank: 2, durability_max: 10, ammo_max: 5 },
  { id: 'm2', name: 'M2', faction: 'protectorate', rank: 4, durability_max: 12, ammo_max: 6 },
  { id: 'm3', name: 'M3', faction: 'mercenaries', rank: 1, durability_max: 8, ammo_max: 4 },
];

describe('filterCaptureCatalog', () => {
  it('rank filter (strict): only machines with rank ≤ soldier.rank', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 2, strictRank: true });
    expect(r.map(m => m.id).sort()).toEqual(['m1', 'm3']);
  });
  it('no rank filter when strictRank=false', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 0, strictRank: false });
    expect(r).toHaveLength(3);
  });
  it('faction filter: only matching faction', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 9, strictRank: true, factionFilter: 'protectorate' });
    expect(r.map(m => m.id)).toEqual(['m2']);
  });
  it('null factionFilter = all factions', () => {
    const r = filterCaptureCatalog(catalog, { soldierRank: 9, strictRank: true, factionFilter: null });
    expect(r).toHaveLength(3);
  });
});

describe('opposingFaction', () => {
  it('returns a faction ≠ the army faction', () => {
    const all = ['polaris', 'protectorate', 'mercenaries'];
    expect(opposingFaction('polaris', all)).not.toBe('polaris');
    expect(all).toContain(opposingFaction('polaris', all));
  });
});

describe('getCaptureCandidates', () => {
  it('returns the cross-faction machine catalog with required fields', () => {
    const c = getCaptureCandidates();
    expect(c.length).toBeGreaterThan(0);
    c.forEach(m => {
      expect(m.id).toBeTruthy();
      expect(typeof m.rank).toBe('number');
      expect(typeof m.durability_max).toBe('number');
      expect(typeof m.ammo_max).toBe('number');
    });
  });
});
```

- [ ] **Step 5: Run tests — verify FAIL**

Run: `npm test -- capture-catalog`
Expected: FAIL — module not found.

- [ ] **Step 6: Implement `src/lib/capture-catalog.ts`**

```ts
import { getUnitsByType } from './encyclopedia-registry';

/** A machine selectable for capture (cross-faction catalog). */
export interface CaptureCandidate {
  id: string;
  name: string;
  faction: string;
  rank: number;
  durability_max: number;
  ammo_max: number;
  image?: string;
}

/** Aggregate all machines across factions (encyclopedia). */
export function getCaptureCandidates(): CaptureCandidate[] {
  return getUnitsByType('machine').map((u: any) => ({
    id: u.id,
    name: u.name,
    faction: u.faction,
    rank: u.rank ?? 0,
    durability_max: u.durability_max ?? 0,
    ammo_max: u.ammo_max ?? 0,
    image: u.image,
  }));
}

/** Filter catalog by capturing soldier's rank (strict) and optionally faction. */
export function filterCaptureCatalog(
  catalog: CaptureCandidate[],
  opts: { soldierRank: number; strictRank: boolean; factionFilter?: string | null }
): CaptureCandidate[] {
  return catalog.filter((m) => {
    if (opts.strictRank && m.rank > opts.soldierRank) return false;
    if (opts.factionFilter && m.faction !== opts.factionFilter) return false;
    return true;
  });
}

/** Default opposing faction: any faction ≠ the player's. */
export function opposingFaction(armyFaction: string, allFactions: string[]): string {
  const other = allFactions.find((f) => f !== armyFaction);
  return other ?? armyFaction;
}
```

- [ ] **Step 7: Run tests — verify PASS**

Run: `npm test -- capture-catalog`
Expected: PASS (all tests).

- [ ] **Step 8: Validate + commit**

Run: `npm run validate` (green). Then:
```bash
git add src/lib/types.ts src/lib/combat-types.ts src/lib/capture-catalog.ts \
        src/__tests__/lib/capture-catalog.test.ts src/components/combat/ActionSelector.tsx
git commit -m "feat(capture): #168 — isCaptured type, 'capture' action, catalog helper + filters

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: CaptureModal component

A 2-step bottom-sheet: (1) pick machine from the catalog (faction selector defaulting to opposing, rank-filtered), (2) enter current durability + ammo, confirm.

**Files:**
- Create: `src/components/modals/CaptureModal.tsx`

**Interfaces:**
- Consumes: `CaptureCandidate`, `filterCaptureCatalog`, `opposingFaction`, `getCaptureCandidates` (Task 1); `PilotInfo`, `Machine` from `@/lib/types`; `useEscapeToClose`/`useFocusTrap` (existing hooks).
- Produces: `CaptureModal` with props:
  ```ts
  interface CaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    armyFaction: string;                                  // for default opposing filter
    capturingSoldierRank: number;                         // for rank filter
    strictPilotRankEnabled: boolean;
    onConfirm: (machine: CaptureCandidate, currentDurability: number, currentAmmo: number) => void;
  }
  ```

- [ ] **Step 1: Implement CaptureModal**

Mirror `PilotAssignmentModal.tsx` chrome (bottom-sheet `fixed inset-0 z-[60] flex items-end`, backdrop, drag handle, header with X, `useEscapeToClose(isOpen,onClose)`, `useFocusTrap`). Two steps (`'machine'` → `'state'`):

- **Step `'machine'`**: a faction selector (chips: «all» + each faction; default = `opposingFaction(armyFaction, allFactions)`), then a scrollable list of `filterCaptureCatalog(getCaptureCandidates(), { soldierRank: capturingSoldierRank, strictRank: strictPilotRankEnabled, factionFilter })`. Each row shows name, faction, rank, durability_max/ammo_max; tap → set selected machine → `setStep('state')`.
- **Step `'state'`**: number inputs for **Прочность** (1…selected.durability_max) and **Боезапас** (0…selected.ammo_max), clamped. Back button → `'machine'`. Confirm button (disabled until both entered) → `onConfirm(selected, durability, ammo)` + `onClose()`.

Key handlers (adapt from PilotAssignmentModal's structure):
```tsx
const allCatalog = useMemo(() => getCaptureCandidates(), []);
const allFactions = useMemo(() => Array.from(new Set(allCatalog.map(m => m.faction))), [allCatalog]);
const [factionFilter, setFactionFilter] = useState<string | null>(
  () => opposingFaction(armyFaction, allFactions.length ? allFactions : [armyFaction])
);
const [step, setStep] = useState<'machine' | 'state'>('machine');
const [selected, setSelected] = useState<CaptureCandidate | null>(null);
const [durability, setDurability] = useState<number>(1);
const [ammo, setAmmo] = useState<number>(0);

const candidates = useMemo(
  () => filterCaptureCatalog(allCatalog, { soldierRank: capturingSoldierRank, strictRank: strictPilotRankEnabled, factionFilter }),
  [allCatalog, capturingSoldierRank, strictPilotRankEnabled, factionFilter]
);

// reset on open
useEffect(() => { if (isOpen) { setStep('machine'); setSelected(null); setFactionFilter(opposingFaction(armyFaction, allFactions.length ? allFactions : [armyFaction])); } }, [isOpen, armyFaction, allFactions]);

const handleConfirm = () => {
  if (!selected) return;
  const d = Math.max(1, Math.min(selected.durability_max, durability));
  const a = Math.max(0, Math.min(selected.ammo_max, ammo));
  onConfirm(selected, d, a);
  onClose();
};
```
Render the machine list rows like PilotAssignmentModal's soldier rows (card with name + faction + rank badge + stats). Render the state inputs as number steppers (`−` / value / `+`), 44px buttons. Header: «Захват техники». Empty state when `candidates.length === 0`: «Нет машин для захвата».

- [ ] **Step 2: Run validate**

Run: `npm run validate` → green (no unit test for this UI task; covered by E2E in Task 5).
```bash
git add src/components/modals/CaptureModal.tsx
git commit -m "feat(capture): #168 — CaptureModal (machine picker + durability/ammo entry)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Side A wiring — ActionSelector entry + UnitCard capture handler

**Files:**
- Modify: `src/components/combat/ActionSelector.tsx`
- Modify: `src/components/cards/UnitCard.tsx`

**Interfaces:**
- Consumes: `CaptureModal` (Task 2); `getCaptureCandidates` (Task 1); `getNextInstanceNumber`/`assignInstanceNumber` (`@/lib/unit-utils`); `getEncyclopediaUnit` or the candidate → `Machine` data; existing `combatController`, `setArmy`, `allUnits`, `strictPilotRankEnabled`, `army`.
- Produces: soldier combat modal offers «ЗАХват»; selecting it opens `CaptureModal`; confirm adds the machine + assigns the capturing soldier as pilot.

- [ ] **Step 1: Add `capture` action to ActionSelector**

In `src/components/combat/ActionSelector.tsx`:
1. Import: `import { Flag } from 'lucide-react';` and `import { getCaptureCandidates } from '@/lib/capture-catalog';`
2. Add to the `actions` array (after grenade):
```tsx
    {
      type: 'capture',
      label: 'ЗАХВАТ',
      description: 'Захватить технику',
      icon: <Flag className="w-6 h-6" />,
      hidden: !canCapture,
    },
```
3. Add a `canCapture` gate near `canShoot`/`canMelee`:
```tsx
  const catalogNonEmpty = getCaptureCandidates().length > 0;
  const soldierAlreadyPilot = (() => {
    if (!unit || unit.type !== 'squad' || soldierIndex === null || soldierIndex === undefined) return false;
    const s = (unit.data as Squad).soldiers[soldierIndex];
    return !!s?.isPilot;
  })();
  const canCapture = !!unit && unit.type === 'squad' && soldierIndex !== null && soldierIndex !== undefined
    && catalogNonEmpty && !soldierAlreadyPilot;
```
(Machines don't get the capture action — only squads.)

- [ ] **Step 2: Intercept `'capture'` in UnitCard and open CaptureModal**

In `src/components/cards/UnitCard.tsx`:
1. Import: `import { CaptureModal } from '../modals/CaptureModal';` and `import { getCaptureCandidates } from '@/lib/capture-catalog';`
2. Add state: `const [showCaptureModal, setShowCaptureModal] = useState(false);` and remember the capturing soldier: `const [captureSoldierIdx, setCaptureSoldierIdx] = useState<number | null>(null);`
3. Wrap the combat modal's `onSelectAction` (currently `onSelectAction={combatController.selectAction}` ~line 506):
```tsx
          onSelectAction={(action) => {
            if (action === 'capture') {
              setCaptureSoldierIdx(state.soldierIndex);  // current soldier (see note)
              setShowCaptureModal(true);
              combatController.cancelCombat();
            } else {
              combatController.selectAction(action);
            }
          }}
```
**Note:** the capturing soldier index = the soldier the combat modal was opened for. `combatController.state.soldierIndex` holds it (read it before `cancelCombat()`). Capture it into a ref/state. If the combat modal was opened for a machine (no soldierIndex), `canCapture` was hidden, so this path is soldier-only.
4. Add the `CaptureModal` render near the other modals (after PilotAssignmentModal):
```tsx
      {showCaptureModal && captureSoldierIdx !== null && (
        <CaptureModal
          isOpen={showCaptureModal}
          onClose={() => { setShowCaptureModal(false); setCaptureSoldierIdx(null); }}
          armyFaction={army?.faction || 'polaris'}
          capturingSoldierRank={(data as Squad).soldiers[captureSoldierIdx]?.rank ?? 0}
          strictPilotRankEnabled={strictPilotRankEnabled}
          onConfirm={handleCaptureConfirm}
        />
      )}
```

- [ ] **Step 3: Implement `handleCaptureConfirm`**

In `UnitCard.tsx` (near `handlePilotAssign`):
```ts
  const handleCaptureConfirm = (machine: CaptureCandidate, currentDurability: number, currentAmmo: number) => {
    // Build the new machine ArmyUnit
    const instanceNumber = getNextInstanceNumber(army || { units: [] } as any, machine.id);
    const instanceId = `${machine.id}_${Date.now()}`;
    // Pull full machine data from the encyclopedia (stats/weapons/speed_sectors)
    const fullMachine = getEncyclopediaUnit(machine.id)?.data ?? (machine as any);
    const newMachineUnit: ArmyUnit = assignInstanceNumber({
      instanceId,
      type: 'machine',
      instanceNumber: 0,  // replaced by assignInstanceNumber
      data: fullMachine as Machine,
      currentDurability,
      currentAmmo,
      pilotInfo: {
        squadInstanceId: unit.instanceId,
        soldierIndex: captureSoldierIdx ?? 0,
        pilotArmor: (data as Squad).soldiers[captureSoldierIdx ?? 0]?.armor ?? 0,
        alive: true,
      },
    } as any, instanceNumber);

    // Add machine + mark capturing soldier as pilot + done
    setArmy((prev) => ({
      ...prev,
      units: [...prev.units, newMachineUnit],
    }));
    // Mark the soldier as pilot of the new machine + done (same update path as PilotAssignmentModal)
    updateUnit(unit.instanceId, (u) => {
      if (u.type !== 'squad') return u;
      const soldiers = [...(u.data as Squad).soldiers];
      const idx = captureSoldierIdx ?? 0;
      if (soldiers[idx]) {
        soldiers[idx] = { ...soldiers[idx], isPilot: true, pilotOfInstanceId: instanceId };
      }
      const actionsUsed = [...(u.actionsUsed || [])];
      actionsUsed[idx] = { ...(actionsUsed[idx] || { moved:false,shot:false,melee:false,done:false }), done: true };
      return { ...u, data: { ...u.data, soldiers } as Squad, actionsUsed };
    });
    setShowCaptureModal(false);
    setCaptureSoldierIdx(null);
  };
```
**Imports needed:** `getNextInstanceNumber`, `assignInstanceNumber` from `@/lib/unit-utils`; `getEncyclopediaUnit` from `@/lib/encyclopedia-registry`; `Machine` type; `CaptureCandidate` type. `setArmy` is available on `UnitCard` (it receives `setArmy` — verify the prop; if not, the parent page passes it; check UnitCard props and use the same setter used elsewhere, e.g. the existing `updateUnit` wraps `setArmy`).

**If `setArmy` is not a direct prop of UnitCard** (it may only have `updateUnit`), implement via `updateUnit` + a sibling add: instead, expose an `onCaptureMachine(newUnit, pilotSquadId, soldierIdx)` callback prop on `UnitCard` that the parent (`GameSession`/page) implements using its `setArmy`. Read `UnitCard` props first — pick the path that matches how other army mutations (e.g. pilot assign) flow.

- [ ] **Step 4: Validate + commit**

Run: `npm run validate` → green.
```bash
git add src/components/combat/ActionSelector.tsx src/components/cards/UnitCard.tsx
git commit -m "feat(capture): #168 — 'capture' action + UnitCard handler (add machine + pilot)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Side B — isCaptured banner + toggle + action lock

**Files:**
- Modify: `src/components/cards/unit-card/MachineView.tsx`
- Modify: `src/components/cards/UnitCard.tsx`

**Interfaces:**
- Consumes: `ArmyUnit.isCaptured` (Task 1); existing `setArmy`/`updateUnit`.
- Produces: a «ЗАХВАЧЕНА ПРОТИВНИКОМ» banner overlay + grayscale + all actions disabled when `isCaptured`; a toggle button («Отметить захваченной» ↔ «Вернуть (перезахват)»).

- [ ] **Step 1: Pass `isCaptured` + toggle handler into MachineView**

In `UnitCard.tsx`, pass to `<MachineView …/>`:
```tsx
            isCaptured={!!unit.isCaptured}
            onToggleCaptured={() => updateUnit(unit.instanceId, (u) => ({ ...u, isCaptured: !u.isCaptured }))}
```

- [ ] **Step 2: MachineView — banner + toggle + lock**

In `src/components/cards/unit-card/MachineView.tsx`:
1. Add props `isCaptured?: boolean;` and `onToggleCaptured?: () => void;` to `MachineViewProps`; destructure.
2. At the top of the returned JSX (wrap the card root), apply a grayscale when captured: change the root `<div className="bg-slate-800/30 border …">` to add `${isCaptured ? 'grayscale opacity-60' : ''}`.
3. Inside the card (after the close-combat buttons block), add the banner + toggle:
```tsx
      {isCaptured && (
        <div className="rounded-lg border-2 border-red-600/60 bg-red-950/40 px-3 py-2 text-center">
          <span className="text-sm font-black uppercase tracking-wider text-red-300">ЗАХВАЧЕНА ПРОТИВНИКОМ</span>
        </div>
      )}
      <button
        type="button"
        disabled={!onToggleCaptured || (currentDurability === 0)}
        onClick={onToggleCaptured}
        className="min-h-[44px] rounded-lg px-2 py-2 text-xs font-bold border border-slate-700/50 bg-slate-900/30 text-slate-400 hover:bg-slate-800/50 disabled:opacity-30 transition-colors"
      >
        {isCaptured ? 'Вернуть (перезахват)' : 'Отметить захваченной'}
      </button>
```
4. Lock actions when captured: add `isCaptured ? true : <existing>` to the `disabled` of: ranged weapon rows (MachineWeaponsList gets a `disabled` prop OR the existing `isDestroyed`-style gating), the melee/ram buttons (`disabled={isDestroyed || !!isCaptured}`), and the damage/repair buttons (`disabled={… || !!isCaptured}`). Simplest: compute `const inactive = isDestroyed || !!isCaptured;` and use it on the melee/ram/damage/repair buttons. For `MachineWeaponsList`, if it accepts an `isDestroyed`/lock prop, pass `inactive`; otherwise wrap the section in a `pointer-events-none opacity-40` div when `isCaptured`.

- [ ] **Step 3: Validate + commit**

Run: `npm run validate` → green.
```bash
git add src/components/cards/unit-card/MachineView.tsx src/components/cards/UnitCard.tsx
git commit -m "feat(capture): #168 — Side B: isCaptured banner + toggle + action lock

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: E2E + full regression

**Files:**
- Create: `e2e/machine-capture.spec.ts`

- [ ] **Step 1: Write the capture E2E**

Mirror the seed pattern from `e2e/defender-pilot-test.spec.ts` (wrapped `{schemaVersion:1, army:{...}}` via `addInitScript`, `clearStorage`, expand unit). Seed a squad (soldier of sufficient rank) + a machine, in battle. Two tests:

1. **Capture (Side A):** open the squad → tap a soldier (combat modal) → action «ЗАХВАТ» (`getByRole('button', { name: /захват/i })`) → `CaptureModal` opens → pick the first machine → set durability/ammo → confirm → a new machine unit appears in the navigator with the soldier as its pilot (assert navigator shows the new machine + the soldier shows «ПИЛОТ»).
2. **Mark captured (Side B):** open the existing machine card → tap «Отметить захваченной» → the «ЗАХВАЧЕНА ПРОТИВНИКОМ» banner appears + combat buttons disabled → tap «Вернуть (перезахват)» → banner gone, buttons enabled.

Use `getByTestId`/`getByRole` per conventions; `clearStorage` in `beforeEach`; no fixed sleeps.

- [ ] **Step 2: Full regression**

Run: `npm run validate` (green) + `npm run test:e2e` (ALL green, incl. new spec + combat/pilot-assignment/melee-ram regression).

- [ ] **Step 3: Commit**

```bash
git add e2e/machine-capture.spec.ts
git commit -m "test(e2e): #168 — machine capture (Side A) + mark-captured (Side B) flows

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review Notes (plan author)

- **Spec coverage:** Side A (catalog helper T1, CaptureModal T2, action+wiring T3) ✓; Side B (isCaptured banner/toggle/lock T4) ✓; rank + opposing-faction filters (T1/T2) ✓; current durability/ammo entry (T2/T3) ✓; pilot assign + numbering (T3) ✓; tests + E2E (T1 unit, T5 E2E) ✓.
- **Type consistency:** `CaptureCandidate` + `filterCaptureCatalog`/`opposingFaction`/`getCaptureCandidates` defined in T1, used in T2/T3; `ArmyUnit.isCaptured` (T1) used in T4; `'capture'` action (T1) used in T3.
- **Known risk:** `UnitCard` may not have `setArmy` directly — Task 3 Step 3 instructs the implementer to read UnitCard props and use the existing army-mutation path (or expose an `onCaptureMachine` callback). The capturing-soldier index is captured from `combatController.state.soldierIndex` before closing the combat modal.
- **`getEncyclopediaUnit(machine.id)?.data`** in T3 Step 3 — verify `getEncyclopediaUnit` returns `.data` (the Machine); if the shape differs, use `getUnitsByType('machine').find(id)` to source the full Machine. The candidate carries enough fields to rebuild minimally if needed.
