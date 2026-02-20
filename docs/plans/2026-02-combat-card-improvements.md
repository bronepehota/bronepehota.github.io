# Combat Card Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the combat card UI with long-press undo, status stripe, soft dimming, gradient buttons, and highlighted armor.

**Architecture:** Extract SoldierCard component from UnitCard, create useLongPress hook for gesture handling, add StatusStripe for visual state indication.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Jest (unit tests), existing game-logic.ts utilities

---

## Task 1: Create useLongPress Hook

**Files:**
- Create: `src/hooks/useLongPress.ts`
- Create: `src/hooks/__tests__/useLongPress.test.ts`

**Step 1: Write the failing test**

```typescript
// src/hooks/__tests__/useLongPress.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should call onLongPress after 600ms', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress: callback, ms: 600 }));

    act(() => {
      result.current.onTouchStart();
      jest.advanceTimersByTime(600);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel if released before threshold', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress: callback, ms: 600 }));

    act(() => {
      result.current.onTouchStart();
      jest.advanceTimersByTime(300);
      result.current.onTouchEnd();
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should set isPressed state during press', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress: callback, ms: 600 }));

    expect(result.current.isPressed).toBe(false);

    act(() => {
      result.current.onTouchStart();
    });

    expect(result.current.isPressed).toBe(true);

    act(() => {
      result.current.onTouchEnd();
    });

    expect(result.current.isPressed).toBe(false);
  });

  it('should work with mouse events', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress: callback, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
      jest.advanceTimersByTime(600);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel on mouse leave', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useLongPress({ onLongPress: callback, ms: 600 }));

    act(() => {
      result.current.onMouseDown();
      jest.advanceTimersByTime(300);
      result.current.onMouseLeave();
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- useLongPress.test.ts`
Expected: FAIL with "Cannot find module '@/hooks/useLongPress'"

**Step 3: Write minimal implementation**

```typescript
// src/hooks/useLongPress.ts
import { useState, useCallback, useRef } from 'react';

export interface UseLongPressOptions {
  onLongPress: () => void;
  ms?: number;
}

export interface UseLongPressReturn {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  isPressed: boolean;
}

export function useLongPress({ onLongPress, ms = 500 }: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false);
  const timer = useRef<NodeJS.Timeout>();

  const start = useCallback(() => {
    setIsPressed(true);
    timer.current = setTimeout(onLongPress, ms);
  }, [onLongPress, ms]);

  const cancel = useCallback(() => {
    setIsPressed(false);
    if (timer.current) {
      clearTimeout(timer.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    isPressed,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- useLongPress.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/hooks/useLongPress.ts src/hooks/__tests__/useLongPress.test.ts
git commit -m "feat: add useLongPress hook for gesture handling

- 600ms long-press triggers callback
- Cancels on early release
- Works with touch and mouse events
- Visual feedback via isPressed state

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create StatusStripe Component

**Files:**
- Create: `src/components/cards/soldier-card/StatusStripe.tsx`
- Create: `src/components/cards/soldier-card/__tests__/StatusStripe.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/cards/soldier-card/__tests__/StatusStripe.test.tsx
import { render, screen } from '@testing-library/react';
import { StatusStripe } from '../StatusStripe';

describe('StatusStripe', () => {
  it('should render green stripe for done state', () => {
    const { container } = render(<StatusStripe state="done" />);
    const stripe = container.firstChild as HTMLElement;
    expect(stripe).toHaveClass('from-emerald-500', 'to-emerald-600');
  });

  it('should render red stripe for dead state', () => {
    const { container } = render(<StatusStripe state="dead" />);
    const stripe = container.firstChild as HTMLElement;
    expect(stripe).toHaveClass('from-red-600', 'to-red-700');
  });

  it('should render orange stripe for panic state', () => {
    const { container } = render(<StatusStripe state="panic" />);
    const stripe = container.firstChild as HTMLElement;
    expect(stripe).toHaveClass('from-orange-500', 'to-amber-500');
  });

  it('should render transparent for active state', () => {
    const { container } = render(<StatusStripe state="active" />);
    const stripe = container.firstChild as HTMLElement;
    expect(stripe).toHaveClass('transparent');
  });

  it('should apply custom className', () => {
    const { container } = render(<StatusStripe state="done" className="custom-class" />);
    const stripe = container.firstChild as HTMLElement;
    expect(stripe).toHaveClass('custom-class');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- StatusStripe.test.tsx`
Expected: FAIL with "Cannot find module '@/components/cards/soldier-card/StatusStripe'"

**Step 3: Write minimal implementation**

```typescript
// src/components/cards/soldier-card/StatusStripe.tsx
import { cn } from '@/lib/utils';

export type SoldierState = 'done' | 'dead' | 'panic' | 'active';

interface StatusStripeProps {
  state: SoldierState;
  className?: string;
}

const stripeStyles = {
  done: 'from-emerald-500 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.5)] w-1.5',
  dead: 'from-red-600 to-red-700 shadow-[0_0_12px_rgba(220,38,38,0.5)] w-1.5',
  panic: 'from-orange-500 to-amber-500 shadow-[0_0_12px_rgba(251,146,60,0.5)] w-1.5',
  active: 'transparent w-1',
};

export function StatusStripe({ state, className }: StatusStripeProps) {
  return (
    <div
      className={cn(
        'absolute left-0 top-0 bottom-0 bg-gradient-to-b transition-all duration-300',
        stripeStyles[state],
        className
      )}
      aria-hidden="true"
    />
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- StatusStripe.test.tsx`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/components/cards/soldier-card/StatusStripe.tsx src/components/cards/soldier-card/__tests__/StatusStripe.test.tsx
git commit -m "feat: add StatusStripe component for visual state indication

- Green stripe for done state
- Red stripe for dead state
- Orange stripe for panic state
- Transparent for active state
- Gradient with glow effect

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create SoldierStats Component (with highlighted armor)

**Files:**
- Create: `src/components/cards/soldier-card/SoldierStats.tsx`
- Modify: `src/components/cards/UnitCard.tsx` (reference only)

**Step 1: Create SoldierStats component**

```typescript
// src/components/cards/soldier-card/SoldierStats.tsx
import { Shield, Footprints, Target, Flame, Sword } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Soldier } from '@/lib/types';

interface SoldierStatsProps {
  soldier: Soldier;
  className?: string;
}

export function SoldierStats({ soldier, className }: SoldierStatsProps) {
  return (
    <div className={cn("flex flex-wrap gap-0.5 md:gap-1", className)}>
      {/* Armor - HIGHLIGHTED with border and glow */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px] bg-yellow-950/30 border-2 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.25)]">
        <Shield className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-yellow-400 mb-1 md:mb-0 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-yellow-200 leading-none truncate w-full text-center" title={soldier.armor.toString()}>
          {soldier.armor}
        </span>
        {/* Tech corners */}
        <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-yellow-400/40" />
        <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-yellow-400/40" />
      </div>

      {/* Speed */}
      <div className="relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]">
        <Footprints className="w-[14px] md:w-[18px] h-[14px] md:h-[18px] text-cyan-400 mb-1 md:mb-0 shrink-0" />
        <span className="text-xs md:text-sm font-mono font-black text-cyan-300 leading-none truncate w-full text-center" title={soldier.speed.toString()}>
          {soldier.speed}
        </span>
      </div>

      {/* Range - disabled if no ranged attack */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
        (!soldier.range || soldier.range === '0') && "opacity-40"
      )}>
        <Target className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", (!soldier.range || soldier.range === '0') ? "text-slate-600" : "text-amber-400")} />
        <span className={cn(
          "text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center",
          (!soldier.range || soldier.range === '0') ? "text-slate-600" : "text-amber-300"
        )} title={soldier.range}>
          {soldier.range && soldier.range !== '0' ? (soldier.range.length > 4 ? soldier.range.replace('D', '') : soldier.range) : '—'}
        </span>
      </div>

      {/* Power - disabled if no ranged attack */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
        (!soldier.power || soldier.power === '0') && "opacity-40"
      )}>
        <Flame className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", (!soldier.power || soldier.power === '0') ? "text-slate-600" : "text-red-400")} />
        <span className={cn(
          "text-[10px] md:text-xs font-mono font-black leading-none truncate w-full text-center",
          (!soldier.power || soldier.power === '0') ? "text-slate-600" : "text-red-300"
        )} title={soldier.power}>
          {soldier.power && soldier.power !== '0' ? (soldier.power.length > 4 ? soldier.power.replace('D', '') : soldier.power) : '—'}
        </span>
      </div>

      {/* Melee - disabled if no melee attack */}
      <div className={cn(
        "relative flex flex-col items-center justify-center p-0.5 md:p-1 rounded-lg md:rounded-full min-h-[44px] min-w-[42px] md:min-w-[56px]",
        soldier.melee <= 0 && "opacity-40"
      )}>
        <Sword className={cn("w-[14px] md:w-[18px] h-[14px] md:h-[18px] mb-1 md:mb-0 shrink-0", soldier.melee <= 0 ? "text-slate-600" : "text-red-400")} />
        <span className={cn(
          "text-xs md:text-sm font-mono font-black leading-none truncate w-full text-center",
          soldier.melee <= 0 ? "text-slate-600" : "text-red-300"
        )} title={soldier.melee.toString()}>
          {soldier.melee > 0 ? soldier.melee : '—'}
        </span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cards/soldier-card/SoldierStats.tsx
git commit -m "feat: add SoldierStats component with highlighted armor

- Armor has yellow border, glow, and tech corners
- Other stats (speed, range, power, melee) unchanged
- Size remains the same, only styling enhanced

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Create SoldierActions Component (gradient buttons + long-press)

**Files:**
- Create: `src/components/cards/soldier-card/SoldierActions.tsx`

**Step 1: Create SoldierActions component**

```typescript
// src/components/cards/soldier-card/SoldierActions.tsx
import { CheckCircle2, Skull, Crosshair, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import type { SoldierActionState } from '@/lib/types';

interface SoldierActionsProps {
  isDead: boolean;
  isDone: boolean;
  isInPanic: boolean;
  actions: SoldierActionState;
  onActionClick: () => void;
  onToggleDone: () => void;
  onToggleDead: () => void;
  soldierIndex: number;
}

export function SoldierActions({
  isDead,
  isDone,
  isInPanic,
  onActionClick,
  onToggleDone,
  onToggleDead,
}: SoldierActionsProps) {
  // Long press for undo DONE state
  const doneLongPress = useLongPress({
    onLongPress: onToggleDone,
    ms: 600,
  });

  // Long press for undo DEATH state
  const deathLongPress = useLongPress({
    onLongPress: onToggleDead,
    ms: 600,
  });

  return (
    <div className="flex gap-2 md:gap-3 items-center">
      {/* ДЕЙСТВИЕ button - disabled for dead/done soldiers */}
      {isInPanic ? (
        <div className="relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden border-2 text-xs font-mono font-bold uppercase tracking-wider bg-orange-950/30 border-orange-700/50 text-orange-400">
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-orange-600/40" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-orange-600/40" />
          <Footprints className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">В ПАНИКЕ</span>
        </div>
      ) : (
        <button
          disabled={isDone || isDead}
          onClick={onActionClick}
          className={cn(
            "relative flex-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 p-1.5 md:p-2 rounded-sm transition-all flex items-center justify-center gap-1.5 md:gap-2 overflow-hidden",
            "border-2 text-xs font-mono font-bold uppercase tracking-wider",
            "bg-purple-950/20 hover:bg-purple-950/40 border-purple-700/50 text-purple-400 active:scale-95"
          )}
          title="Выберите действие"
          aria-label="Выберите действие"
        >
          <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-purple-600/40" />
          <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-purple-600/40" />
          <Crosshair className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline">ДЕЙСТВИЕ</span>
        </button>
      )}

      {/* Visual separator - desktop only */}
      <div className="hidden md:block w-px h-8 bg-slate-700/50 mx-1" />

      {/* ГОТОВ button - with gradient + glow + long press */}
      {isInPanic ? (
        <div className="relative p-1.5 md:p-2 rounded-sm min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden bg-orange-950/20 border-orange-700/30 text-orange-400/50">
          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 opacity-50" />
        </div>
      ) : (
        <button
          {...doneLongPress}
          disabled={isDead}
          onClick={() => !isDead && onToggleDone()}
          className={cn(
            "relative p-1.5 md:p-2 rounded-sm transition-all min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center border-2 overflow-hidden",
            "font-mono font-black uppercase",
            isDone
              ? "bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_20px_rgba(16,185,129,0.7)] border-emerald-500 text-emerald-100"
              : "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 border-slate-600 text-slate-300",
            doneLongPress.isPressed && "scale-95 opacity-80"
          )}
          title={isDone ? "Долгое нажатие для отмены" : "Завершить ход бойца"}
          aria-label={isDone ? "Боевых действий завершён. Долгое нажатие для отмены." : "Завершить ход бойца"}
          aria-pressed={isDone}
        >
          {isDone && (
            <>
              <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-emerald-400/60" />
              <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-emerald-400/60" />
            </>
          )}
          {doneLongPress.isPressed && (
            <div className="absolute inset-0 bg-white/10 animate-pulse" aria-hidden="true" />
          )}
          <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}

      {/* УБИТЬ button - with gradient + glow + long press */}
      <button
        {...deathLongPress}
        className={cn(
          "relative p-1.5 md:p-2 rounded-sm font-mono font-black uppercase tracking-wider min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-1 md:gap-1.5 border-2 overflow-hidden transition-all",
          isDead
            ? "bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_20px_rgba(220,38,38,0.7)] border-red-600 text-red-100"
            : "bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 border-slate-600 text-slate-300",
          deathLongPress.isPressed && "scale-95 opacity-80"
        )}
        title={isDead ? "Долгое нажатие для воскрешения" : "Пометить как убитый"}
        aria-label={isDead ? "Боец убит. Долгое нажатие для отмены." : "Пометить бойца как убитого"}
        aria-pressed={isDead}
      >
        {isDead ? (
          <>
            <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-red-500/60" />
            <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-red-500/60" />
          </>
        ) : null}
        {deathLongPress.isPressed && (
          <div className="absolute inset-0 bg-white/10 animate-pulse" aria-hidden="true" />
        )}
        <Skull className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
        <span className="hidden md:inline text-[10px] font-mono font-black uppercase ml-0.5">
          {isDead ? 'УБИТ' : 'ЖИВ'}
        </span>
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cards/soldier-card/SoldierActions.tsx
git commit -m "feat: add SoldierActions with gradient buttons and long-press

- ГОТОВ button: green gradient with glow, long-press to undo
- УБИТЬ button: red gradient with glow, long-press to resurrect
- Visual feedback: scale-95 + pulse overlay during press
- Updated aria labels for accessibility

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Create SoldierImage Component

**Files:**
- Create: `src/components/cards/soldier-card/SoldierImage.tsx`

**Step 1: Create SoldierImage component**

```typescript
// src/components/cards/soldier-card/SoldierImage.tsx
import { GitHubPagesImage as Image } from '@/components/GitHubPagesImage';
import { CheckCircle2, Skull, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoldierImageProps {
  imageUrl: string;
  soldierIndex: number;
  isDead: boolean;
  isDone: boolean;
  isInPanic: boolean;
  isMounted: boolean;
  onImageClick: () => void;
}

export function SoldierImage({
  imageUrl,
  soldierIndex,
  isDead,
  isDone,
  isInPanic,
  isMounted,
  onImageClick,
}: SoldierImageProps) {
  return (
    <div className="relative w-16 md:w-20 aspect-[3/4] rounded-sm overflow-hidden flex-shrink-0 bg-slate-900 cursor-pointer shadow-md absolute top-0 right-0">
      <div onClick={onImageClick} className="w-full h-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={`Солдат ${soldierIndex + 1}`}
          width={60}
          height={80}
          className="w-full h-full object-cover object-center"
          unoptimized
        />
      </div>

      {/* Soldier number HUD */}
      <div className="absolute bottom-1 right-1 z-10">
        <div className="px-1.5 py-0.5 backdrop-blur-md bg-slate-900/70 border border-slate-600/50 rounded-sm">
          <span className="font-mono text-[10px] font-bold text-white">
            #{soldierIndex + 1}
          </span>
        </div>
      </div>

      {/* Death overlay */}
      {isMounted && isDead && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Skull
            className="w-8 h-8 md:w-10 md:h-10 text-red-500"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 0 12px rgba(239,68,68,1))' }}
          />
        </div>
      )}

      {/* Done overlay */}
      {isMounted && isDone && !isDead && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-emerald-500 rounded-full p-1 md:p-1.5 shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Panic overlay */}
      {isMounted && isInPanic && !isDead && !isDone && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/30">
          <Footprints
            className="w-8 h-8 md:w-10 md:h-10 text-orange-400"
            strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 8px rgba(251,146,60,0.8))' }}
          />
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cards/soldier-card/SoldierImage.tsx
git commit -m "feat: add SoldierImage component with overlays

- Photo with soldier number HUD
- Death overlay (skull icon)
- Done overlay (green checkmark)
- Panic overlay (footprints icon)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Create SoldierCard Component (assemble all parts)

**Files:**
- Create: `src/components/cards/SoldierCard.tsx`

**Step 1: Create SoldierCard component**

```typescript
// src/components/cards/SoldierCard.tsx
import { useState, useEffect } from 'react';
import { SoldierActions } from './soldier-card/SoldierActions';
import { SoldierStats } from './soldier-card/SoldierStats';
import { SoldierImage } from './soldier-card/SoldierImage';
import { StatusStripe, type SoldierState } from './soldier-card/StatusStripe';
import { cn } from '@/lib/utils';
import type { Squad, SoldierActionState, ArmyUnit } from '@/lib/types';
import type { PilotInfo } from '@/lib/types';
import { checkPanicTrigger } from '@/lib/panic-logic';
import type { RulesVersionID } from '@/lib/types';

interface SoldierCardProps {
  squad: Squad;
  unit: ArmyUnit;
  soldierIndex: number;
  allUnits: ArmyUnit[];
  rulesVersion: RulesVersionID;
  updateUnit: (unit: ArmyUnit) => void;
  onSoldierAction: (soldierIndex: number) => void;
  setShowSoldierImage: (idx: number | null) => void;
  setShowPanicModal: (show: boolean) => void;
  getSoldierImage: (idx: number) => string;
}

export function SoldierCard({
  squad,
  unit,
  soldierIndex,
  allUnits,
  rulesVersion,
  updateUnit,
  onSoldierAction,
  setShowSoldierImage,
  setShowPanicModal,
  getSoldierImage,
}: SoldierCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const soldier = squad.soldiers[soldierIndex];
  const isDead = unit.deadSoldiers?.includes(soldierIndex) || false;
  const actions = unit.actionsUsed?.[soldierIndex] || { moved: false, shot: false, melee: false, done: false };
  const isDone = actions.done;
  const isInPanic = unit.panicState?.some(p => p.soldierIndex === soldierIndex) || false;

  // Determine stripe state
  const getStripeState = (): SoldierState => {
    if (isDead) return 'dead';
    if (isInPanic) return 'panic';
    if (isDone) return 'done';
    return 'active';
  };

  const handleToggleAction = () => {
    const newActions = [...(unit.actionsUsed || [])];
    const currentDone = newActions[soldierIndex]?.done || false;

    if (currentDone) {
      // Untoggling "done" - reset all actions
      newActions[soldierIndex] = {
        moved: false,
        shot: false,
        melee: false,
        done: false
      };
    } else {
      newActions[soldierIndex] = {
        ...newActions[soldierIndex],
        done: true
      };
    }
    updateUnit({ ...unit, actionsUsed: newActions });
  };

  const handleToggleDead = () => {
    const dead = unit.deadSoldiers || [];
    const newDead = dead.includes(soldierIndex)
      ? dead.filter(i => i !== soldierIndex)
      : [...dead, soldierIndex];

    const updatedUnit = { ...unit, deadSoldiers: newDead };

    // Check panic trigger for community rules
    if (rulesVersion === 'community_star_system' && newDead.length > 0 && !dead.includes(soldierIndex)) {
      const currentTurn = 1;
      const shouldTestPanic = checkPanicTrigger(updatedUnit, 'community_star_system', currentTurn);
      if (shouldTestPanic) {
        setShowPanicModal(true);
      }
    }

    updateUnit(updatedUnit);
  };

  // Check if this soldier is a pilot
  const isPilot = soldier.isPilot || false;

  return (
    <div
      className={cn(
        "relative p-1 md:p-1.5 rounded-sm border flex gap-1.5 md:gap-2 transition-all overflow-hidden",
        isDead ? "bg-slate-950/80 border-slate-800 opacity-40 grayscale" :
        isDone ? "bg-slate-900/40 border-slate-700/50 opacity-90" : "bg-slate-800/30 border-slate-700/50",
        isPilot && !isDead ? "border-cyan-700/40" : ""
      )}
    >
      {/* Status stripe */}
      <StatusStripe state={getStripeState()} />

      {/* Tech corners for pilot */}
      {isPilot && !isDead && (
        <>
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-cyan-500/40" />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-cyan-500/40" />
        </>
      )}

      {/* Soldier image (right side) */}
      <SoldierImage
        imageUrl={getSoldierImage(soldierIndex)}
        soldierIndex={soldierIndex}
        isDead={isDead}
        isDone={isDone}
        isInPanic={isInPanic}
        isMounted={isMounted}
        onImageClick={() => setShowSoldierImage(soldierIndex)}
      />

      {/* Left side: actions and stats */}
      <div className="flex-1 flex flex-col justify-between min-w-0 gap-1.5 md:gap-2">
        {/* Row 1: Action buttons */}
        <SoldierActions
          isDead={isDead}
          isDone={isDone}
          isInPanic={isInPanic}
          actions={actions}
          onActionClick={() => onSoldierAction(soldierIndex)}
          onToggleDone={handleToggleAction}
          onToggleDead={handleToggleDead}
          soldierIndex={soldierIndex}
        />

        {/* Row 2: Stats */}
        <SoldierStats soldier={soldier} />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/cards/SoldierCard.tsx
git commit -m "feat: add SoldierCard component assembling all parts

- Combines StatusStripe, SoldierActions, SoldierStats, SoldierImage
- Handles done/dead/panic states
- Soft dimming: opacity-90 instead of opacity-70 for done state
- Long-press integration via SoldierActions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Refactor UnitCard to use SoldierCard

**Files:**
- Modify: `src/components/cards/UnitCard.tsx`

**Step 1: Replace soldier row rendering with SoldierCard**

Find the soldier map section (around line 690) and replace with:

```typescript
import { SoldierCard } from './SoldierCard';

// In the squad rendering section, replace the entire soldier row div with:
{(data as Squad).soldiers.map((s, idx) => (
  <SoldierCard
    key={idx}
    squad={data as Squad}
    unit={unit}
    soldierIndex={idx}
    allUnits={allUnits}
    rulesVersion={rulesVersion}
    updateUnit={updateUnit}
    onSoldierAction={_handleSoldierAction}
    setShowSoldierImage={setShowSoldierImage}
    setShowPanicModal={setShowPanicModal}
    getSoldierImage={getSoldierImage}
  />
))}
```

**Step 2: Remove now-unused helper functions**

Remove these functions from UnitCard (now in SoldierCard):
- `toggleAction` - now handled by SoldierCard
- `toggleDead` - now handled by SoldierCard
- `isSoldierInPanic` - now handled by SoldierCard
- `getSoldierImage` - passed as prop

**Step 3: Test locally**

Run: `npm run dev`

Verify:
1. Soldier cards display correctly
2. Status stripe shows for done/dead/panic
3. Long-press on ГОТОВ works (600ms)
4. Long-press on УБИТЬ works (600ms)
5. Armor has yellow border and glow
6. Buttons have gradient + glow

**Step 4: Commit**

```bash
git add src/components/cards/UnitCard.tsx
git commit -m "refactor: UnitCard now uses SoldierCard component

- Extracted soldier rendering to SoldierCard
- Removed duplicate toggleAction/toggleDead functions
- Cleaner separation of concerns
- UnitCard reduced from ~1400 to ~1100 lines

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add index export for soldier-card components

**Files:**
- Create: `src/components/cards/soldier-card/index.ts`

**Step 1: Create barrel export**

```typescript
// src/components/cards/soldier-card/index.ts
export { StatusStripe } from './StatusStripe';
export { SoldierActions } from './SoldierActions';
export { SoldierStats } from './SoldierStats';
export { SoldierImage } from './SoldierImage';
export type { SoldierState } from './StatusStripe';
```

**Step 2: Commit**

```bash
git add src/components/cards/soldier-card/index.ts
git commit -m "chore: add barrel export for soldier-card components

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Run full test suite

**Step 1: Run all tests**

Run: `npm test`

Expected: All existing tests still pass

**Step 2: Run type check**

Run: `npm run type-check`

Expected: No TypeScript errors

**Step 3: Run lint**

Run: `npm run lint`

Expected: No ESLint errors (or fix auto-fixable issues)

**Step 4: Commit if any fixes needed**

```bash
git add .
git commit -m "fix: resolve test/lint issues from combat card refactor

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Manual QA checklist

**Step 1: Test long-press undo**

- [ ] Open app, go to game session
- [ ] Find a squad, click ГОТОВ on a soldier
- [ ] Long-press (hold) the green checkmark for ~600ms
- [ ] Verify: soldier returns to active state

**Step 2: Test long-press resurrect**

- [ ] Click УБИТЬ on a soldier
- [ ] Long-press the red skull button for ~600ms
- [ ] Verify: soldier returns to alive

**Step 3: Test status stripe**

- [ ] Verify active soldier: no visible stripe
- [ ] Click ГОТОВ: verify green stripe appears
- [ ] Click УБИТЬ: verify red stripe appears
- [ ] (If panic enabled) verify orange stripe

**Step 4: Test soft dimming**

- [ ] Click ГОТОВ on soldier
- [ ] Verify: card is slightly dimmed (not dark like before)
- [ ] Verify: card is still readable

**Step 5: Test armor highlight**

- [ ] Look at armor stat on any soldier
- [ ] Verify: yellow border visible
- [ ] Verify: subtle glow effect
- [ ] Verify: tech corners present

**Step 6: Test button gradients**

- [ ] Look at ГОТОВ button (when done)
- [ ] Verify: green gradient with glow
- [ ] Look at УБИТЬ button (when dead)
- [ ] Verify: red gradient with glow

**Step 7: Test accessibility**

- [ ] Tab to ГОТОВ button, verify focus visible
- [ ] Check aria-label includes long-press hint
- [ ] Verify screen reader announces state correctly

---

## Task 11: Update CLAUDE.md (optional, if patterns are worth documenting)

**Step 1: Add long-press pattern to CLAUDE.md**

If this pattern will be reused elsewhere, add to CLAUDE.md:

```markdown
### Long-Press Pattern

For undo actions via long-press:

\`\`\`typescript
import { useLongPress } from '@/hooks/useLongPress';

const longPress = useLongPress({
  onLongPress: () => handleUndo(),
  ms: 600,
});

<button {...longPress} className={cn(longPress.isPressed && "scale-95")}>
  {longPress.isPressed && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
  <Icon />
</button>
\`\`\`
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document long-press gesture pattern in CLAUDE.md

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

**New files created:** 8
- `src/hooks/useLongPress.ts`
- `src/hooks/__tests__/useLongPress.test.ts`
- `src/components/cards/soldier-card/StatusStripe.tsx`
- `src/components/cards/soldier-card/__tests__/StatusStripe.test.tsx`
- `src/components/cards/soldier-card/SoldierStats.tsx`
- `src/components/cards/soldier-card/SoldierActions.tsx`
- `src/components/cards/soldier-card/SoldierImage.tsx`
- `src/components/cards/SoldierCard.tsx`
- `src/components/cards/soldier-card/index.ts`

**Modified files:** 1
- `src/components/cards/UnitCard.tsx`

**Total commits:** ~11 (frequent, small commits)
