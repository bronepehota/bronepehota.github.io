# Аналитика: воронка, бои, PWA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Единый аналитический фасад: один вызов уходит в GA4 и Яндекс.Метрику, SPA-просмотры считаются при клиентских переходах, бои/воронка/PWA/офлайн покрыты событиями.

**Architecture:** Расширяем `src/lib/analytics.ts` до фасада с офлайн-буфером (localStorage, at-most-once). Новый `RouteTracker` в корневом layout шлёт просмотры при смене `usePathname()`. Явные `trackEvent`-вызовы в 8 точках (визард, бой, редактор). Заглушки счётчиков в E2E через `addInitScript`.

**Tech Stack:** Next.js 14 App Router, TypeScript, Jest + @testing-library, Playwright. **Новых зависимостей нет.**

**Спека:** `docs/superpowers/specs/2026-08-18-analytics-battles-design.md`
**Ветка:** `feat/analytics-funnel` (уже создана от origin/main, спека в ней)

## Global Constraints

- Ветка `feat/analytics-funnel`; каждый таск = отдельный коммит; stage ТОЛЬКО файлы таска (в репо есть посторонние untracked-файлы — НЕ `git add -A`).
- **Все события — только через `src/lib/analytics.ts`.** Никаких прямых `window.gtag`/`window.ym` вне фасада (кроме заглушек в тестах).
- Новых npm-зависимостей нет.
- UI не меняется вообще (кроме одного символа конфига GA) — весь текст интерфейса нетронут.
- `npm run type-check` и `npm run test` обязаны проходить после каждого таска.
- **E2E локально НЕ запускать** — CI-only (harness убивает webServer, см. CLAUDE.md). Локально проверять только type-check + unit.
- LSP-диагностика может вратьmid-edit — верить `npm run type-check`.
- localStorage-ключ нового буфера: `bronepehota_analytics_queue` (через `LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE`).
- Тест-ids для E2E уже существуют в коде: `landing-cta-button`, `rules-confirm-button`, `source-confirm-button`, `faction-continue-button`, `start-battle-button`, `new-turn-button`, `initiative-modal`, `confirm-initiative-button`.

---

### Task 1: Константы + аналитический фасад с офлайн-буфером

**Files:**
- Modify: `src/lib/constants.ts:30` (рядом с `YANDEX_METRICA_ID`) и `LOCAL_STORAGE_KEYS`
- Modify: `src/lib/analytics.ts` (полная замена содержимого)
- Test: `src/__tests__/lib/analytics.test.ts` (новый)

**Interfaces (produces):**
```typescript
// src/lib/analytics.ts — на что опираются все последующие таски:
export { GA_MEASUREMENT_ID } from '@/lib/constants';
export function trackPageView(path: string): void;         // обе системы
export function trackInitialPageView(path: string): void;  // только GA
export function trackEvent(name: string, params?: Record<string, unknown>): void;
export function flushAnalyticsQueue(): void;
export function diffCustomSourceUnits(
  prev: { squads: { id: string }[]; machines: { id: string }[] },
  next: { squads: { id: string }[]; machines: { id: string }[] },
): Array<{ kind: 'squad' | 'machine'; id: string }>;
// src/lib/constants.ts:
export const GA_MEASUREMENT_ID: string | undefined;
// LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE === 'bronepehota_analytics_queue'
```

- [ ] **Step 1: Добавить константы**

В `src/lib/constants.ts` после строки 30 (`YANDEX_METRICA_ID`) добавить:

```typescript
// Google Analytics 4 measurement id. Optional — component no-ops without it.
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
```

В объект `LOCAL_STORAGE_KEYS` (строки 32–48) добавить строку после `CUSTOM_MODIFIERS:`:

```typescript
  ANALYTICS_QUEUE: 'bronepehota_analytics_queue',
```

- [ ] **Step 2: Написать failing-тесты**

Создать `src/__tests__/lib/analytics.test.ts`:

```typescript
/**
 * Юнит-тесты аналитического фасада: fan-out GA/YM, офлайн-буфер, diff юнитов.
 */
jest.mock('@/lib/constants', () => {
  const actual = jest.requireActual('@/lib/constants');
  return {
    ...actual,
    GA_MEASUREMENT_ID: 'G-TEST',
    YANDEX_METRICA_ID: '111302711',
  };
});

import {
  trackEvent,
  trackPageView,
  trackInitialPageView,
  flushAnalyticsQueue,
  diffCustomSourceUnits,
} from '@/lib/analytics';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';

const QUEUE_KEY = LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE;

function setOnline(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

function stubTransports(): { gtag: jest.Mock; ym: jest.Mock } {
  const gtag = jest.fn();
  const ym = jest.fn();
  window.gtag = gtag as unknown as typeof window.gtag;
  window.ym = ym as unknown as typeof window.ym;
  (window as unknown as { matchMedia: unknown }).matchMedia = jest
    .fn()
    .mockReturnValue({ matches: false });
  return { gtag, ym };
}

beforeEach(() => {
  localStorage.clear();
  stubTransports();
  setOnline(true);
});

describe('trackEvent — fan-out в обе системы', () => {
  test('шлёт event в gtag и reachGoal в ym с меткой pwa', () => {
    trackEvent('battle_start', { faction: 'polaris', rules: 'tehnolog' });
    expect(window.gtag).toHaveBeenCalledWith('event', 'battle_start', {
      faction: 'polaris',
      rules: 'tehnolog',
      pwa: false,
    });
    expect(window.ym).toHaveBeenCalledWith(111302711, 'reachGoal', 'battle_start', {
      faction: 'polaris',
      rules: 'tehnolog',
      pwa: false,
    });
  });

  test('pwa=true в standalone-режиме', () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = jest
      .fn()
      .mockReturnValue({ matches: true });
    trackEvent('pwa_install');
    expect(window.gtag).toHaveBeenCalledWith('event', 'pwa_install', { pwa: true });
  });

  test('без id счётчиков ничего не отправляет и не буферизует', () => {
    jest.isolateModules(() => {
      jest.doMock('@/lib/constants', () => {
        const actual = jest.requireActual('@/lib/constants');
        return { ...actual, GA_MEASUREMENT_ID: undefined, YANDEX_METRICA_ID: undefined };
      });
      const mod = require('@/lib/analytics');
      mod.trackEvent('x');
    });
    expect(window.gtag).not.toHaveBeenCalled();
    expect(window.ym).not.toHaveBeenCalled();
    expect(localStorage.getItem(QUEUE_KEY)).toBeNull();
  });
});

describe('офлайн-буфер', () => {
  test('офлайн событие ставится в очередь и уходит при flush', () => {
    setOnline(false);
    trackEvent('battle_turn', { turn: 2 });
    expect(window.gtag).not.toHaveBeenCalled();
    const queued = JSON.parse(localStorage.getItem(QUEUE_KEY)!) as unknown[];
    expect(queued).toHaveLength(1);

    setOnline(true);
    flushAnalyticsQueue();
    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'battle_turn',
      expect.objectContaining({ turn: 2 }),
    );
    expect(window.ym).toHaveBeenCalledWith(
      111302711,
      'reachGoal',
      'battle_turn',
      expect.objectContaining({ turn: 2 }),
    );
    expect(JSON.parse(localStorage.getItem(QUEUE_KEY)!)).toHaveLength(0);
  });

  test('незагруженный транспорт — событие ждёт в очереди оба транспорта', () => {
    (window as unknown as { ym: unknown }).ym = undefined;
    trackEvent('battle_start');
    expect(window.gtag).not.toHaveBeenCalled(); // GA-часть тоже ждёт (единый элемент очереди)
    stubTransports();
    flushAnalyticsQueue();
    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.ym).toHaveBeenCalledTimes(1);
  });

  test('кап 200: старые вытесняются', () => {
    setOnline(false);
    for (let i = 0; i < 205; i++) trackEvent(`ev_${i}`);
    const queued = JSON.parse(localStorage.getItem(QUEUE_KEY)!) as { name?: string }[];
    expect(queued).toHaveLength(200);
    expect(queued[0].name).toBe('ev_5');
    expect(queued[199].name).toBe('ev_204');
  });
});

describe('просмотры страниц', () => {
  test('trackPageView — config в GA и hit в YM', () => {
    trackPageView('/app');
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_path: '/app' });
    expect(window.ym).toHaveBeenCalledWith(
      111302711,
      'hit',
      '/app',
      expect.objectContaining({ params: expect.objectContaining({ pwa: false }) }),
    );
  });

  test('trackInitialPageView — только GA (визит Метрики уже послал её init)', () => {
    trackInitialPageView('/');
    expect(window.gtag).toHaveBeenCalledWith('config', 'G-TEST', { page_path: '/' });
    expect(window.ym).not.toHaveBeenCalled();
  });
});

describe('diffCustomSourceUnits', () => {
  const prev = {
    squads: [{ id: 's1', name: 'A' }],
    machines: [{ id: 'm1', name: 'T' }],
  };

  test('новый отряд', () => {
    const next = { squads: [...prev.squads, { id: 's2', name: 'B' }], machines: prev.machines };
    expect(diffCustomSourceUnits(prev, next)).toEqual([{ kind: 'squad', id: 's2' }]);
  });

  test('изменённая техника', () => {
    const next = { squads: prev.squads, machines: [{ id: 'm1', name: 'T2' }] };
    expect(diffCustomSourceUnits(prev, next)).toEqual([{ kind: 'machine', id: 'm1' }]);
  });

  test('без изменений и удаление — пусто', () => {
    expect(diffCustomSourceUnits(prev, prev)).toEqual([]);
    expect(diffCustomSourceUnits(prev, { squads: [], machines: prev.machines })).toEqual([]);
  });
});
```

- [ ] **Step 3: Запустить тесты — убедиться, что падают**

Run: `npm run test -- src/__tests__/lib/analytics.test.ts`
Expected: FAIL — `ANALYTICS_QUEUE` есть в константах (уже добавлен в Step 1), но `trackPageView`/`trackInitialPageView`/`flushAnalyticsQueue`/`diffCustomSourceUnits` не существуют (`is not a function`), часть тестов падает.

- [ ] **Step 4: Реализовать фасад**

Полностью заменить содержимое `src/lib/analytics.ts`:

```typescript
import { GA_MEASUREMENT_ID, LOCAL_STORAGE_KEYS, YANDEX_METRICA_ID } from '@/lib/constants';

// Обратная совместимость: GoogleAnalytics.tsx импортирует id отсюда.
export { GA_MEASUREMENT_ID } from '@/lib/constants';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    ym: (id: number, action: string, ...rest: unknown[]) => void;
  }
}

type QueuedItem = {
  kind: 'pageview' | 'event';
  path?: string;
  name?: string;
  params?: Record<string, unknown>;
  /** false => YM-часть не отправляем (первый просмотр: визит уже послал init Метрики) */
  ym?: boolean;
  ts: number;
};

const QUEUE_LIMIT = 200;

function pwaStandalone(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

function activeTransportsReady(): boolean {
  const needGa = Boolean(GA_MEASUREMENT_ID);
  const needYm = Boolean(YANDEX_METRICA_ID);
  if (!needGa && !needYm) return true;
  const gaReady = !needGa || typeof window.gtag === 'function';
  const ymReady = !needYm || typeof window.ym === 'function';
  return gaReady && ymReady;
}

function canSendNow(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.onLine && activeTransportsReady();
}

function readQueue(): QueuedItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as QueuedItem[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ANALYTICS_QUEUE, JSON.stringify(items));
  } catch {
    // quota exceeded — теряем буфер, это аналитика
  }
}

function enqueue(item: QueuedItem): void {
  const queue = [...readQueue(), item].slice(-QUEUE_LIMIT);
  writeQueue(queue);
}

function deliver(item: QueuedItem): void {
  const params = { ...item.params, pwa: pwaStandalone() };
  if (item.kind === 'pageview' && item.path) {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('config', GA_MEASUREMENT_ID, { page_path: item.path });
    }
    if (item.ym !== false && YANDEX_METRICA_ID && typeof window.ym === 'function') {
      window.ym(Number(YANDEX_METRICA_ID), 'hit', item.path, { params });
    }
    return;
  }
  if (item.kind === 'event' && item.name) {
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('event', item.name, params);
    }
    if (YANDEX_METRICA_ID && typeof window.ym === 'function') {
      window.ym(Number(YANDEX_METRICA_ID), 'reachGoal', item.name, params);
    }
  }
}

function dispatch(item: QueuedItem): void {
  if (canSendNow()) deliver(item);
  else enqueue(item);
}

/** Просмотр страницы при клиентском переходе — в обе системы. */
export function trackPageView(path: string): void {
  dispatch({ kind: 'pageview', path, ts: Date.now() });
}

/**
 * Первый просмотр (полная загрузка страницы). В Метрику hit НЕ шлём:
 * её init при загрузке уже зарегистрировал визит — повторный hit дал бы
 * двойной счёт лендинга. GA получает page_view (у нас send_page_view: false).
 */
export function trackInitialPageView(path: string): void {
  dispatch({ kind: 'pageview', path, ym: false, ts: Date.now() });
}

/** Событие — в обе системы. */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  dispatch({ kind: 'event', name, params, ts: Date.now() });
}

/** Отправка накопленного офлайн-буфера (at-most-once: очередь чистится до отправки). */
export function flushAnalyticsQueue(): void {
  if (typeof window === 'undefined' || !navigator.onLine || !activeTransportsReady()) return;
  const queue = readQueue();
  if (queue.length === 0) return;
  writeQueue([]);
  queue.forEach(deliver);
}

type UnitLike = { id: string } & Record<string, unknown>;

/**
 * Diff юнитов кастомного источника до/после сохранения —
 * кто реально изменился (basis для события editor_unit_saved).
 */
export function diffCustomSourceUnits(
  prev: { squads: UnitLike[]; machines: UnitLike[] },
  next: { squads: UnitLike[]; machines: UnitLike[] },
): Array<{ kind: 'squad' | 'machine'; id: string }> {
  const changed: Array<{ kind: 'squad' | 'machine'; id: string }> = [];
  const prevSquads = new Map(prev.squads.map((s) => [s.id, JSON.stringify(s)]));
  for (const s of next.squads) {
    if (prevSquads.get(s.id) !== JSON.stringify(s)) changed.push({ kind: 'squad', id: s.id });
  }
  const prevMachines = new Map(prev.machines.map((m) => [m.id, JSON.stringify(m)]));
  for (const m of next.machines) {
    if (prevMachines.get(m.id) !== JSON.stringify(m)) changed.push({ kind: 'machine', id: m.id });
  }
  return changed;
}
```

Примечание: прежний `trackScreenView` удаляется — он нигде не использовался (мёртвый код, подтверждено поиском).

- [ ] **Step 5: Прогнать тесты — зелёные**

Run: `npm run test -- src/__tests__/lib/analytics.test.ts`
Expected: PASS, все ~10 тестов.

- [ ] **Step 6: type-check + полный юнит-прогон**

Run: `npm run type-check && npm run test`
Expected: оба проходят (старые тесты не задеты: `GoogleAnalytics.tsx` пока импортирует `GA_MEASUREMENT_ID` из `@/lib/analytics` — реэкспорт сохраняет контракт).

- [ ] **Step 7: Commit**

```bash
git add src/lib/constants.ts src/lib/analytics.ts src/__tests__/lib/analytics.test.ts
git commit -m "feat(analytics): единый фасад GA4/Метрика + офлайн-буфер + diff юнитов"
```

---

### Task 2: RouteTracker + подключение (layout, GA-конфиг, sw.ts)

**Files:**
- Create: `src/components/RouteTracker.tsx`
- Test: `src/__tests__/components/RouteTracker.test.tsx` (новый; если директории нет — создать)
- Modify: `src/app/layout.tsx:141` (рядом с `<NavigationProgress />`)
- Modify: `src/components/GoogleAnalytics.tsx:4,20`
- Modify: `src/app/sw.ts:74`

**Interfaces:**
- Consumes: `trackPageView`, `trackInitialPageView`, `trackEvent`, `flushAnalyticsQueue` из Task 1 (сигнатуры выше).
- Produces: `<RouteTracker />` (без пропсов) — рендерится один раз в root layout.

- [ ] **Step 1: Failing-тест RouteTracker**

Создать `src/__tests__/components/RouteTracker.test.tsx`:

```tsx
/**
 * RouteTracker: первый рендер — GA-only pageview; смена маршрута — pageview;
 * appinstalled → pwa_install; mount → flush буфера.
 */
jest.mock('next/navigation', () => ({
  usePathname: (): string => usePathnameMock(),
}));

import { render } from '@testing-library/react';
import RouteTracker from '@/components/RouteTracker';

const trackInitialPageView = jest.fn();
const trackPageView = jest.fn();
const trackEvent = jest.fn();
const flushAnalyticsQueue = jest.fn();

jest.mock('@/lib/analytics', () => ({
  trackInitialPageView: (...args: unknown[]) => trackInitialPageView(...args),
  trackPageView: (...args: unknown[]) => trackPageView(...args),
  trackEvent: (...args: unknown[]) => trackEvent(...args),
  flushAnalyticsQueue: (...args: unknown[]) => flushAnalyticsQueue(...args),
}));

let usePathnameMock: () => string;

beforeEach(() => {
  jest.clearAllMocks();
  usePathnameMock = () => '/';
});

test('первый рендер — trackInitialPageView + flush, без trackPageView', () => {
  render(<RouteTracker />);
  expect(trackInitialPageView).toHaveBeenCalledWith('/');
  expect(trackPageView).not.toHaveBeenCalled();
  expect(flushAnalyticsQueue).toHaveBeenCalledTimes(1);
});

test('смена маршрута — trackPageView', () => {
  const { rerender } = render(<RouteTracker />);
  usePathnameMock = () => '/app';
  rerender(<RouteTracker />);
  expect(trackPageView).toHaveBeenCalledWith('/app');
  expect(trackInitialPageView).toHaveBeenCalledTimes(1);
});

test('повторный рендер того же пути ничего не шлёт', () => {
  const { rerender } = render(<RouteTracker />);
  rerender(<RouteTracker />);
  expect(trackPageView).not.toHaveBeenCalled();
});

test('appinstalled → pwa_install', () => {
  render(<RouteTracker />);
  window.dispatchEvent(new Event('appinstalled'));
  expect(trackEvent).toHaveBeenCalledWith('pwa_install');
});
```

- [ ] **Step 2: Запустить — упасть**

Run: `npm run test -- src/__tests__/components/RouteTracker.test.tsx`
Expected: FAIL — `Cannot find module '@/components/RouteTracker'`.

- [ ] **Step 3: Реализовать RouteTracker**

Создать `src/components/RouteTracker.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  flushAnalyticsQueue,
  trackEvent,
  trackInitialPageView,
  trackPageView,
} from '@/lib/analytics';

/**
 * SPA-слежение маршрутов: первый просмотр — только GA (визит Метрики шлёт её
 * init), каждое последующее изменение пути — в обе системы. Также ловит
 * установку PWA и флешит офлайн-буфер аналитики.
 */
export default function RouteTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const onInstall = () => trackEvent('pwa_install');
    const onOnline = () => flushAnalyticsQueue();
    window.addEventListener('appinstalled', onInstall);
    window.addEventListener('online', onOnline);
    flushAnalyticsQueue();
    // повторный flush: транспорты (afterInteractive-скрипты) могли догрузиться позже
    const timer = setTimeout(flushAnalyticsQueue, 3000);
    return () => {
      window.removeEventListener('appinstalled', onInstall);
      window.removeEventListener('online', onOnline);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (lastPath.current === null) {
      trackInitialPageView(pathname);
    } else if (lastPath.current !== pathname) {
      trackPageView(pathname);
    }
    lastPath.current = pathname;
  }, [pathname]);

  return null;
}
```

- [ ] **Step 4: Тесты зелёные**

Run: `npm run test -- src/__tests__/components/RouteTracker.test.tsx`
Expected: PASS, 4 теста.

- [ ] **Step 5: Подключить в layout + GA-конфиг + sw.ts**

`src/app/layout.tsx` — добавить импорт (после строки 6, к другим импортам компонентов):

```tsx
import RouteTracker from '@/components/RouteTracker'
```

и в `RootLayout` после `<NavigationProgress />` (строка 141) добавить:

```tsx
        <RouteTracker />
```

`src/components/GoogleAnalytics.tsx` — сменить импорт id (строка 4) с `@/lib/analytics` на `@/lib/constants` (единый источник) и отключить авто-просмотр (строка 20):

```tsx
import { GA_MEASUREMENT_ID } from '@/lib/constants';
```

```javascript
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
```

`src/app/sw.ts` строка 74 — расширить список исключений (маяки аналитики не должны идти через SW-кэш):

```typescript
        const excludedHosts = ['accounts.google.com', 'www.googleapis.com', 'content.googleapis.com', 'mc.yandex.ru', 'www.googletagmanager.com'];
```

- [ ] **Step 6: Полная проверка**

Run: `npm run type-check && npm run test`
Expected: оба проходят.

- [ ] **Step 7: Commit**

```bash
git add src/components/RouteTracker.tsx src/__tests__/components/RouteTracker.test.tsx src/app/layout.tsx src/components/GoogleAnalytics.tsx src/app/sw.ts
git commit -m "feat(analytics): RouteTracker — SPA-просмотры, pwa_install, флеш буфера; GA send_page_view:false; sw исключает маяки"
```

---

### Task 3: События визарда и battle_start (ArmyBuilder)

**Files:**
- Modify: `src/components/ArmyBuilder.tsx` (импорты; хелпер; обработчики на строках 297, 307, 317, 327–350, 360–362, 454–460, 479–487)

**Interfaces:**
- Consumes: `trackEvent` из Task 1.
- Produces: события `wizard_step { step, faction, rules }` и `battle_start { faction, rules, units, cost }`.

Пояснение по тестам: изменения — однострочные вызовы внутри существующих inline-обработчиков большого компонента; юнит-рендер ArmyBuilder ради вызова трекера избыточен (сетап визарда в jsdom тяжёлый). Покрытие — E2E-спека Task 5 (`wizard_step`, `battle_start` ассерты). Это осознанное решение, а не пропуск.

- [ ] **Step 1: Импорт и хелпер**

В `src/components/ArmyBuilder.tsx` добавить к импортам:

```tsx
import { trackEvent } from '@/lib/analytics';
```

Внутрь компонента `ArmyBuilder` (рядом с другими хелперами, до `return`):

```tsx
  const trackWizardStep = (step: string) =>
    trackEvent('wizard_step', { step, faction: army.faction, rules: rulesVersion });
```

- [ ] **Step 2: Обернуть переходы визарда**

Заменить (строка ~297, шаг rules):

```tsx
                onConfirm={() => setSetupStep('source')}
```
на
```tsx
                onConfirm={() => { trackWizardStep('rules'); setSetupStep('source'); }}
```

Заменить (строка ~307, шаг source):

```tsx
                onConfirm={() => setSetupStep('faction')}
```
на
```tsx
                onConfirm={() => { trackWizardStep('source'); setSetupStep('faction'); }}
```

Заменить (строка ~317, шаг faction):

```tsx
                onNext={() => setSetupStep('mission')}
```
на
```tsx
                onNext={() => { trackWizardStep('faction'); setSetupStep('mission'); }}
```

В onConfirm MissionSelector (строка ~327) добавить первой строкой тела:

```tsx
                  trackWizardStep('mission');
```
(итоговое начало тела: `trackWizardStep('mission'); const missionId = army.missionId;`)

Заменить (строки ~360–362, шаг budget; целиком блок onNext у PointBudgetInput):

```tsx
                onNext={() => {
                  setArmy({ ...army, currentStep: 'unit-select' });
                  setSetupStep('units');
                }}
```
на
```tsx
                onNext={() => {
                  trackWizardStep('budget');
                  setArmy({ ...army, currentStep: 'unit-select' });
                  setSetupStep('units');
                }}
```

Заменить (строки ~454–460, onToBattle — переход в preparation):

```tsx
            onToBattle={() => {
              setArmy({
                ...army,
                isInBattle: true,
                currentStep: 'preparation',
              });
            }}
```
на
```tsx
            onToBattle={() => {
              trackWizardStep('preparation');
              setArmy({
                ...army,
                isInBattle: true,
                currentStep: 'preparation',
              });
            }}
```

- [ ] **Step 3: battle_start**

Заменить (строки ~479–487):

```tsx
              onStartBattle={() => {
                setArmy({
                  ...army,
                  isInBattle: true,
                  currentStep: 'battle',
                  lastBattleDate: army.lastBattleDate || new Date().toISOString()
                });
                _onStartBattle();
              }}
```
на
```tsx
              onStartBattle={() => {
                trackEvent('battle_start', {
                  faction: army.faction,
                  rules: rulesVersion,
                  units: army.units.length,
                  cost: army.totalCost,
                });
                setArmy({
                  ...army,
                  isInBattle: true,
                  currentStep: 'battle',
                  lastBattleDate: army.lastBattleDate || new Date().toISOString()
                });
                _onStartBattle();
              }}
```

- [ ] **Step 4: Проверка**

Run: `npm run type-check && npm run test`
Expected: оба проходят (поведение UI не изменилось — только добавленные вызовы).

- [ ] **Step 5: Commit**

```bash
git add src/components/ArmyBuilder.tsx
git commit -m "feat(analytics): wizard_step на 6 переходах визарда + battle_start"
```

---

### Task 4: battle_turn / battle_engaged + editor_unit_saved

**Files:**
- Modify: `src/components/GameSession.tsx:313-317` (+ импорт)
- Modify: `src/components/editor/EditorLayout.tsx:197-201` (+ импорт)

**Interfaces:**
- Consumes: `trackEvent`, `diffCustomSourceUnits` из Task 1.
- Produces: события `battle_turn { turn, faction }`, `battle_engaged { faction }` (при `newTurn === 2` — срабатывает ровно один раз на бой, `currentTurn` монотонный), `editor_unit_saved { kind, sourceId }`.

Тесты: логика `diffCustomSourceUnits` покрыта Task 1; inline-вызовы — код-ревью + E2E (battle_turn). `editor_unit_saved` E2E сознательно не покрываем (редактор desktop-only, тяжёлый сетап; событие — низкочастотный сигнал).

- [ ] **Step 1: GameSession — смена хода**

В `src/components/GameSession.tsx` добавить импорт:

```tsx
import { trackEvent } from '@/lib/analytics';
```

В `confirmStartNewTurn` (строка 313) после вычисления `newTurn` вставить:

```tsx
    const newTurn = (army.currentTurn || 1) + 1;

    trackEvent('battle_turn', { turn: newTurn, faction: army.faction });
    if (newTurn === 2) {
      trackEvent('battle_engaged', { faction: army.faction });
    }
```

- [ ] **Step 2: EditorLayout — сохранение юнитов**

В `src/components/editor/EditorLayout.tsx` добавить импорт:

```tsx
import { diffCustomSourceUnits, trackEvent } from '@/lib/analytics';
```

Заменить `handleUpdateSource` (строки 197–201):

```tsx
  const handleUpdateSource = (updated: CustomSource) => {
    const storage = getCustomSourcesStorage();
    storage.save(updated);
    setSources(storage.getAll());
  };
```
на
```tsx
  const handleUpdateSource = (updated: CustomSource) => {
    const storage = getCustomSourcesStorage();
    const prev = storage.getById(updated.id);
    storage.save(updated);
    if (prev) {
      diffCustomSourceUnits(prev, updated).forEach((u) =>
        trackEvent('editor_unit_saved', { kind: u.kind, sourceId: updated.id })
      );
    }
    setSources(storage.getAll());
  };
```

(`prev === null` — создание нового источника; события не шлём — сохранение юнитов начнёт считаться с первого редактирования. Решение зафиксировано в спеке.)

- [ ] **Step 3: Проверка**

Run: `npm run type-check && npm run test`
Expected: оба проходят.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameSession.tsx src/components/editor/EditorLayout.tsx
git commit -m "feat(analytics): battle_turn/battle_engaged на смене хода + editor_unit_saved через diff"
```

---

### Task 5: E2E-спека + env для тестовых счётчиков

**Files:**
- Create: `e2e/analytics.spec.ts`
- Modify: `playwright.config.ts:41` (локальная команда webServer)
- Modify: `.github/workflows/test.yml:64-69` (запуск dev-сервера в CI)

**Interfaces:**
- Consumes: хелперы `clearStorage`, `setupToPreparation`, `setupGameSessionWithSquad` из `e2e/helpers/setup.ts`; события из Tasks 3–4.
- Produces: 4 E2E-теста (локально НЕ запускать — CI-only).

- [ ] **Step 1: env тестовых id**

`playwright.config.ts` — заменить строку 41:

```typescript
    command: process.env.CI ? 'echo "Server already started by CI workflow"' : 'npm run dev:e2e',
```
на
```typescript
    command: process.env.CI
      ? 'echo "Server already started by CI workflow"'
      : 'NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST NEXT_PUBLIC_YANDEX_METRICA_ID=111302711 npm run dev:e2e',
```

`.github/workflows/test.yml` — в шаге «Start dev server in background with logging» заменить строку:

```yaml
          nohup npm run dev:e2e > logs/server.log 2>&1 &
```
на
```yaml
          NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST NEXT_PUBLIC_YANDEX_METRICA_ID=111302711 nohup npm run dev:e2e > logs/server.log 2>&1 &
```

- [ ] **Step 2: Спека**

Создать `e2e/analytics.spec.ts`:

```typescript
import { test, expect, Page } from '@playwright/test';
import { clearStorage, setupToPreparation, setupGameSessionWithSquad } from './helpers/setup';

// Перехват аналитики ДО загрузки страниц:
// - ym: геттер/сеттер на window.ym — реальный tag.js не может перезаписать рекордер;
// - gtag: настоящий gtag пишет в dataLayer — подменяем dataLayer.push.
// Без env- id (см. playwright.config) фасад бы молчал — потому G-TEST/111302711 в webServer.
test.beforeEach(async ({ page }) => {
  await clearStorage(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __ymLog: unknown[][]; __gaLog: unknown[][] };
    w.__ymLog = [];
    w.__gaLog = [];
    let ymRecorder: ((...args: unknown[]) => void) | undefined;
    Object.defineProperty(window, 'ym', {
      configurable: true,
      get: () => ymRecorder,
      set: () => {
        ymRecorder = (...args: unknown[]) => {
          w.__ymLog.push(args);
        };
      },
    });
    window.dataLayer = {
      push: (...args: unknown[]) => {
        w.__gaLog.push(args);
        return 0;
      },
    } as unknown as unknown[];
  });
});

async function ymCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window as unknown as { __ymLog: unknown[][] }).__ymLog);
}

async function gaCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => (window as unknown as { __gaLog: unknown[][] }).__gaLog);
}

test('SPA-переход лендинг→/app даёт pageview в обеих системах', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-cta-button').first().click();
  // /app загружен: виден первый шаг визарда (дев-компиляция ~до 30с)
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

  const ym = await ymCalls(page);
  const ga = await gaCalls(page);
  expect(ym.some((c) => c[1] === 'hit' && c[2] === '/app')).toBeTruthy();
  expect(
    ga.some((c) => c[0] === 'config' && (c[2] as { page_path?: string } | undefined)?.page_path === '/app'),
  ).toBeTruthy();
});

test('воронка: wizard_step на каждом confirm-клике', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('landing-cta-button').first().click();
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });
  await page.getByTestId('rules-confirm-button').click();
  await expect(page.getByTestId('source-confirm-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('source-confirm-button').click();
  await expect(page.getByTestId('faction-continue-button')).toBeVisible({ timeout: 10000 });
  await page.getByTestId('faction-continue-button').click();

  const ym = await ymCalls(page);
  const steps = ym
    .filter((c) => c[1] === 'reachGoal' && c[2] === 'wizard_step')
    .map((c) => (c[3] as { step?: string }).step);
  expect(steps).toEqual(expect.arrayContaining(['rules', 'source', 'faction']));
});

test('battle_start после «Начать бой» через модалку инициативы', async ({ page }) => {
  await setupToPreparation(page);
  await page.getByTestId('start-battle-button').click();
  await expect(page.getByTestId('initiative-modal').first()).toBeVisible({ timeout: 10000 });
  // авто-бросок кости ~600мс — кнопка игнорирует клики во время анимации
  await page.waitForTimeout(800);
  await page.getByTestId('confirm-initiative-button').click({ force: true });

  const ym = await ymCalls(page);
  expect(ym.some((c) => c[1] === 'reachGoal' && c[2] === 'battle_start')).toBeTruthy();
});

test('первая смена хода: battle_turn(2) и battle_engaged', async ({ page }) => {
  await setupGameSessionWithSquad(page, {
    unitOverrides: { instanceId: 'analytics-unit-1' },
  });
  await page.waitForTimeout(500);

  // Паттерн из e2e/combat.spec.ts:39-50 — меню юнита → new-turn-button
  const menuButton = page.locator('.ml-auto button:has(svg.lucide-more-vertical)').last();
  await menuButton.click({ force: true });
  await page.getByTestId('new-turn-button').click({ force: true });

  const turnConfirm = page.locator('text=ЗАВЕРШИТЬ ТУР').first();
  if (await turnConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.locator('button:has-text("ЗАВЕРШИТЬ")').last().click({ force: true });
  }

  await expect(page.getByTestId('initiative-modal').first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.getByTestId('confirm-initiative-button').click({ force: true });

  const ym = await ymCalls(page);
  expect(
    ym.some(
      (c) =>
        c[1] === 'reachGoal' && c[2] === 'battle_turn' && (c[3] as { turn?: number }).turn === 2,
    ),
  ).toBeTruthy();
  expect(ym.some((c) => c[1] === 'reachGoal' && c[2] === 'battle_engaged')).toBeTruthy();
});
```

- [ ] **Step 3: Локальная проверка (без запуска E2E)**

Run: `npm run type-check && npm run lint`
Expected: оба проходят — спека типобезопасна (типы `test`/`expect`/`Page` из `@playwright/test`).

- [ ] **Step 4: Commit**

```bash
git add e2e/analytics.spec.ts playwright.config.ts .github/workflows/test.yml
git commit -m "test(analytics): E2E — pageview SPA, воронка wizard_step, battle_start, battle_turn/engaged"
```

CI прогонит спеку сам после пуша (E2E — CI-only).

---

### Task 6: CLAUDE.md — ключ, конвенция, чек-лист

**Files:**
- Modify: `CLAUDE.md` (список localStorage-ключей; секция после «### SEO / Discoverability»)

- [ ] **Step 1: Ключ в список**

В секции State Management, в список ключей (после `bronepehota_weapon_selections`) добавить:

```markdown
- `bronepehota_analytics_queue` - Offline buffer for analytics events (battles at tables with poor connectivity); flushed on load/online
```

- [ ] **Step 2: Секция «Аналитика»**

После секции `### SEO / Discoverability` добавить:

```markdown
### Аналитика (GA4 + Яндекс.Метрика)

**Один фасад — `src/lib/analytics.ts`.** Никаких прямых `window.gtag`/`window.ym` вне него:
`trackPageView(path)` (SPA-переход, обе системы), `trackInitialPageView(path)` (первая загрузка,
только GA — визит Метрики шлёт её init), `trackEvent(name, params)` (обе системы).
Офлайн-буфер `bronepehota_analytics_queue` (кап 200, at-most-once флеш), метка `pwa` подмешивается
автоматически. `RouteTracker` в root layout шлёт просмотры при смене маршрута + `pwa_install`.

**События**: `wizard_step` (6 шагов), `battle_start`, `battle_turn` (turn), `battle_engaged`
(ход 2 = «реальный бой»), `editor_unit_saved`, `pwa_install`. Спека+таксономия:
`docs/superpowers/specs/2026-08-18-analytics-battles-design.md`.

**Чек-лист после деплоя (руками, один раз)**: GA4 → Admin → Data streams → Enhanced measurement →
выключить «Page views» (иначе дубли с RouteTracker); пометить `battle_start`/`battle_engaged`
как Key events. Метрика → цели «JavaScript-событие» на `battle_start` и `battle_engaged`.
Сверять события (не сессии): дельта GA ≤ Метрика для РФ — норма (блокировщики).

**E2E**: `e2e/analytics.spec.ts` требует env- id `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST
NEXT_PUBLIC_YANDEX_METRICA_ID=111302711` (прописаны в playwright.config webServer + test.yml);
перехват через `__ymLog`/`__gaLog` в `addInitScript`.
```

- [ ] **Step 3: Проверка и commit**

Run: `npm run type-check && npm run test`
Expected: PASS.

```bash
git add CLAUDE.md
git commit -m "docs(claude): ключ буфера аналитики, конвенция фасада, чек-лист GA4/Метрики"
```

---

## Ручные шаги ПОСЛЕ мерджа (не код — владелец продукта)

1. GA4: выключить «Page views» в Enhanced Measurement (Admin → Data streams).
2. GA4: пометить `battle_start`, `battle_engaged` как Key events.
3. Метрика: цели «JavaScript-событие» на `battle_start` и `battle_engaged`.
4. Через 1–2 недели: сравнить события GA vs Метрика, зафиксировать дельту-константу; построить воронку `wizard_step → battle_start → battle_engaged`.
