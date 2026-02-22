# Battle Screen Performance Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3-5 second lags on Android when switching between units in battle screen by removing heavy CSS effects and memoizing components.

**Architecture:** Remove animated CSS backgrounds/overlays from GameSession, extract helper function to utils, memoize navigation cards and SoldierCard components.

**Tech Stack:** React, TypeScript, Tailwind CSS, Next.js 14

---

## Task 1: Remove Heavy CSS Effects from GameSession

**Files:**
- Modify: `src/components/GameSession.tsx:303-345`

**Step 1: Remove Battle Screen Atmosphere section**

Delete lines 305-345 (entire "Battle Screen Atmosphere - Tactical HUD Effects" div with all overlays).

Keep the component structure, just remove the special effects div.

**Step 2: Verify the file compiles**

Run: `npm run type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "perf: remove heavy CSS effects from GameSession background"
```

---

## Task 2: Clean Up Unused CSS Animations

**Files:**
- Modify: `src/app/globals.css:706-724`

**Step 1: Remove combat-grid-bg animation**

Delete lines 706-712 (`.combat-grid-bg` definition and `@keyframes grid-move`).

**Step 2: Remove combat-scanlines class**

Delete lines 714-724 (`.combat-scanlines` definition).

**Step 3: Remove unused scan animation**

Delete lines 811-819 (`.animate-scan` and `@keyframes scan-horizontal`).

**Step 4: Verify build still works**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "perf: remove unused CSS animations (grid, scanlines, scan)"
```

---

## Task 3: Extract shortenWeaponName to Utils

**Files:**
- Modify: `src/lib/unit-utils.ts`
- Modify: `src/components/cards/UnitCard.tsx:22-41`

**Step 1: Add function to unit-utils.ts**

Add to `src/lib/unit-utils.ts`:

```typescript
// Helper function to shorten weapon names for mobile
export function shortenWeaponName(name: string): string {
  return name
    .replace(/шестиствольная/gi, '6-ств.')
    .replace(/четырехствольная/gi, '4-ств.')
    .replace(/трехствольная/gi, '3-ств.')
    .replace(/двуствольная/gi, '2-ств.')
    .replace(/двуствольный/gi, '2-ств.')
    .replace(/скорострельные/gi, 'скор.')
    .replace(/автоматическая/gi, 'авт.')
    .replace(/автоматический/gi, 'авт.')
    .replace(/бронебойная/gi, 'бронеб.')
    .replace(/бронебойный/gi, 'бронеб.')
    .replace(/пусковые установки/gi, 'ПУ')
    .replace(/управляемые ракеты/gi, 'УР')
    .replace(/стандартный/gi, 'станд.')
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Step 2: Update UnitCard imports**

In `src/components/cards/UnitCard.tsx`, line 8:
Add to import: `shortenWeaponName`

Change from:
```typescript
import { formatUnitNumber } from '@/lib/unit-utils';
```

To:
```typescript
import { formatUnitNumber, shortenWeaponName } from '@/lib/unit-utils';
```

**Step 3: Remove local function definition**

Delete lines 22-41 (the `_shortenWeaponName` function inside UnitCard).

**Step 4: Update usage in component**

Find all uses of `_shortenWeaponName(` and replace with `shortenWeaponName(` (remove underscore).

**Step 5: Verify type-check**

Run: `npm run type-check`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/unit-utils.ts src/components/cards/UnitCard.tsx
git commit -m "refactor: extract shortenWeaponName to unit-utils.ts"
```

---

## Task 4: Create Memoized UnitNavigationCard Component

**Files:**
- Create: `src/components/GameSession/UnitNavigationCard.tsx`

**Step 1: Create new component file**

Create `src/components/GameSession/UnitNavigationCard.tsx`:

```typescript
'use client';

import { memo } from 'react';
import Image from 'next/image';
import { ArmyUnit, Squad, FactionID } from '@/lib/types';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitNavigationCardProps {
  unit: ArmyUnit;
  originalIndex: number;
  isActive: boolean;
  isDone: boolean;
  isDead: boolean;
  isMachine: boolean;
  onClick: () => void;
  faction: FactionID;
  dockStyles: ReturnType<typeof getUnitDockStyles>;
}

// Helper outside component to avoid recreation
const getUnitDockStyles = (factionId: string) => {
  const colors = {
    polaris: { borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400' },
    protectorate: { borderSolid: 'border-cyan-500', bgSolid: 'bg-cyan-500', border: 'border-cyan-500/30', bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/50', accent: 'border-cyan-400' },
    mercenaries: { borderSolid: 'border-yellow-500', bgSolid: 'bg-yellow-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/50', accent: 'border-yellow-400' },
  }[factionId] || {
    borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400'
  };

  return {
    primary: colors.borderSolid,
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  };
};

export const UnitNavigationCard = memo(function UnitNavigationCard({
  unit,
  isActive,
  isDone,
  isDead,
  isMachine,
  onClick,
  dockStyles,
}: Omit<UnitNavigationCardProps, 'originalIndex' | 'faction'>) {
  const imageUrl = isMachine
    ? unit.data.image!
    : ((unit.data as Squad).soldiers[0]?.image || unit.data.image!)!;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative shrink-0 snap-start rounded-md border-2 transition-all duration-300 overflow-hidden group",
        "hover:scale-105 active:scale-95 shadow-md",
        "h-20 w-[72px] md:h-24 md:w-[88px]",
        isActive
          ? cn("scale-110 shadow-2xl border-current z-20", dockStyles.activeGlow, dockStyles.primaryBg, dockStyles.primary)
          : "border-slate-700/50 opacity-80 hover:opacity-100 grayscale hover:grayscale-0 z-10"
      )}
      data-testid={`unit-nav-${unit.instanceId}`}
    >
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt={unit.data.name}
          fill
          className="object-cover"
          style={{ objectPosition: '50% 85%' }}
          sizes="(max-width: 768px) 72px, 88px"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {isActive && <div className="absolute inset-0 bg-slate-700/30" />}
      {isDead && <div className="absolute inset-0 bg-red-900/50" />}

      <div className={cn(
        "absolute w-4 h-4 transition-all z-20",
        isMachine ? "bottom-0 right-0" : "bottom-0 left-0",
        isMachine
          ? cn("border-r-2 border-t-2", dockStyles.accent || dockStyles.primary)
          : cn("border-l-2 border-t-2", dockStyles.muted)
      )} />

      {isActive && (
        <>
          <div className={cn("absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 z-30", dockStyles.primary)} />
          <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 z-30", dockStyles.primary)} />
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className={cn("px-2 pb-1 pt-1", isActive ? "bg-slate-800/90" : "bg-black/70")}>
          <div className="flex items-center justify-center gap-1">
            {unit.instanceNumber && (
              <span className="font-mono text-[8px] font-black text-white/90">
                {unit.instanceNumber}
              </span>
            )}
            <span className="font-mono text-[9px] font-bold text-white tracking-wide">
              {(unit.data.shortName || unit.data.name || '').substring(0, 4).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {isDone && !isDead && (
        <div className="absolute top-1 left-1 w-5 h-5 md:w-6 md:h-6
                     bg-emerald-500 rounded-full border-2 border-white
                     flex items-center justify-center z-30
                     shadow-lg">
          <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
        </div>
      )}

      {isDead && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-red-900/40">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
            <X className="w-5 h-5 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
    </button>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.unit.instanceId === nextProps.unit.instanceId &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isDone === nextProps.isDone &&
    prevProps.isDead === nextProps.isDead
  );
});
```

**Step 2: Export from index**

Create `src/components/GameSession/index.ts`:

```typescript
export { UnitNavigationCard } from './UnitNavigationCard';
```

**Step 3: Verify type-check**

Run: `npm run type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/GameSession/
git commit -m "feat: add memoized UnitNavigationCard component"
```

---

## Task 5: Integrate UnitNavigationCard in GameSession

**Files:**
- Modify: `src/components/GameSession.tsx`

**Step 1: Add import**

Add at top with other imports:
```typescript
import { UnitNavigationCard } from './GameSession';
```

**Step 2: Remove getUnitDockStyles function**

Delete lines 15-27 (the `getUnitDockStyles` function definition).

**Step 3: Update compact view to use new component**

Find the compact view section (around line 720) and replace the inline button rendering with:

```tsx
<UnitNavigationCard
  key={unit.instanceId}
  unit={unit}
  originalIndex={originalIndex}
  isActive={isActive}
  isDone={isDone}
  isDead={isDead}
  isMachine={isMachine}
  onClick={() => setFocusedUnitIdx(originalIndex)}
  faction={army.faction}
  dockStyles={getUnitDockStyles(army.faction)}
/>
```

**Note:** Keep the sorting and spacer logic, only replace the button element.

**Step 4: Update expanded view similarly**

Find expanded view section (around line 527) and use UnitNavigationCard there too.

**Step 5: Add getUnitDockStyles helper at top of file**

After imports, add:
```typescript
const getUnitDockStyles = (factionId: string) => {
  const colors = {
    polaris: { borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400' },
    protectorate: { borderSolid: 'border-cyan-500', bgSolid: 'bg-cyan-500', border: 'border-cyan-500/30', bg: 'bg-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/50', accent: 'border-cyan-400' },
    mercenaries: { borderSolid: 'border-yellow-500', bgSolid: 'bg-yellow-500', border: 'border-yellow-500/30', bg: 'bg-yellow-500/20', text: 'text-yellow-400', glow: 'shadow-yellow-500/50', accent: 'border-yellow-400' },
  }[factionId] || {
    borderSolid: 'border-red-500', bgSolid: 'bg-red-500', border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400', glow: 'shadow-red-500/50', accent: 'border-red-400'
  };

  return {
    primary: colors.borderSolid,
    primaryBg: colors.bgSolid,
    muted: colors.border,
    mutedBg: colors.bg,
    text: colors.text,
    activeGlow: colors.glow,
    accent: colors.accent
  };
};
```

**Step 6: Verify**

Run: `npm run type-check`
Expected: No errors

**Step 7: Commit**

```bash
git add src/components/GameSession.tsx
git commit -m "perf: use memoized UnitNavigationCard in GameSession"
```

---

## Task 6: Memoize SoldierCard

**Files:**
- Modify: `src/components/cards/SoldierCard.tsx`
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Add memo export to SoldierCard**

In `src/components/cards/SoldierCard.tsx`, wrap the export with memo.

Find the export (around line with `export function SoldierCard`) and change to:

```typescript
import { memo } from 'react';

// ... component code ...

export const SoldierCard = memo(function SoldierCard({ /* props */ }: SoldierCardProps) {
  // ... existing component body ...
}, (prevProps, nextProps) => {
  return (
    prevProps.soldierIdx === nextProps.soldierIdx &&
    prevProps.isDead === nextProps.isDead &&
    prevProps.isDone === nextProps.isDone &&
    prevProps.soldier === nextProps.soldier
  );
});
```

**Step 2: Update UnitCard import**

In `src/components/cards/UnitCard.tsx`, the import should work the same way since we're using named export.

**Step 3: Verify**

Run: `npm run type-check`
Expected: No errors

**Step 4: Test navigation works**

Run: `npm run dev`
Open http://localhost:3001, go to battle screen, switch between units.

**Step 5: Commit**

```bash
git add src/components/cards/SoldierCard.tsx
git commit -m "perf: memoize SoldierCard component"
```

---

## Task 7: Final Testing and Cleanup

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No warnings

**Step 3: Build production version**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Manual device test (if available)**

On Android device:
1. Open app in battle mode
2. Switch between 5+ different units
3. Verify: No lag, switching is instant

**Step 5: Final commit**

```bash
git add .
git commit -m "perf: complete battle screen performance optimization

- Removed heavy CSS effects (grid, scanlines, noise, scan line)
- Extracted shortenWeaponName to utils
- Added memoized UnitNavigationCard component
- Memoized SoldierCard for reduced re-renders

Expected: 3-5 second lags eliminated on mid-range Android"
```

---

## Testing Checklist

- [ ] Type check passes
- [ ] All unit tests pass
- [ ] Build succeeds
- [ ] Battle screen opens without errors
- [ ] Switching between units is instant (< 100ms)
- [ ] Combat modals still work
- [ ] Navigation dock functions correctly
- [ ] No visual regressions (cleaner but acceptable)

---

## References

- Design doc: `docs/plans/2026-02-22-battle-screen-performance-optimization-design.md`
- Related components: `GameSession.tsx`, `UnitCard.tsx`, `SoldierCard.tsx`
- CSS cleanup: `globals.css`
