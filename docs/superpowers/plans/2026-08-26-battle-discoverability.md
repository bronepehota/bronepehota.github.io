# Discoverability боя — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Построить измеримые мосты «ленциклопедия/лендинг → бой»: модульная строка на первом экране лендинга, CTA на страницах юнитов и фракций, deep-link `/app?faction=<id>`, событие `battle_entry`.

**Architecture:** Чистый хелпер deep-link (валидация + правило «не трогать непустую армию») в `src/lib/deep-link.ts`; применение — один effect в `src/app/app/page.tsx`. CTA-мосты — маленькие ссылки/панели в существующих компонентах, каждая шлёт `trackEvent('battle_entry', { from })` через фасад `src/lib/analytics.ts`. Визуал — существующий military-HUD язык (folded-paper, military-corners, IBM Mono, Russo).

**Tech Stack:** Next.js 14 (App Router, static export), React 18, Tailwind, Jest+RTL (unit), Playwright (e2e, CI-only).

Спецификация: `docs/superpowers/specs/2026-08-26-battle-discoverability-design.md`

## Global Constraints

- Ветка: `worktree-feat+battle-discoverability` (ворктри `.claude/worktrees/feat+battle-discoverability`). Пуш: `git -c credential.helper='!gh auth git-credential' push`.
- Stage только конкретные пути (никогда `git add -A`).
- **Копирайт не трогаем**: промо-цитата героя, заголовок, подтекст, кредит Технолога; карточка battle-state («Бой идёт») в `CTAButton`; тексты досье юнита.
- Внутренние ссылки — только `next/link`; изображения через `GitHubPagesImage`/`BASE_PATH`.
- Tap-таргеты ≥ 44px, mobile-first (grid-cols-1 → sm:grid-cols-*).
- Новый копирайт (дословно): «ШТАБ» / «собери армию и веди бой»; «ЭНЦИКЛОПЕДИЯ» / «отряды, лор, тактика»; «КАЛЬКУЛЯТОР» / «броски и урон в бою»; панель «// В БОЙ» + кнопка «Взять отряд в бой»; ссылка «Собрать армию».
- Новых зависимостей нет.
- Проверки перед каждым коммитом: `npm run type-check` и `npm run test <file>` (полный `npm run test` в конце). **E2E локально НЕ запускать** (harness убивает webServer, exit 1) — e2e-спеки пишутся и коммитятся, исполняются в CI.
- Комментарии в коде — на русском, в плотности окружающего кода.
- `data-testid` обязательны на новых интерактивных элементах (см. код задач).

---

### Task 1: Хелпер deep-link (`parseFactionParam` / `factionParamToApply`)

**Files:**
- Create: `src/lib/deep-link.ts`
- Test: `src/__tests__/lib/deep-link.test.ts`

**Interfaces:**
- Consumes: `Army` из `@/lib/types` (поля `units`, `isInBattle`).
- Produces (используют Task 6 и тесты):
  - `parseFactionParam(search: string, validFactions: string[]): string | null`
  - `factionParamToApply(search: string, army: Pick<Army, 'units' | 'isInBattle'>, validFactions: string[]): string | null`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/deep-link.test.ts
import { parseFactionParam, factionParamToApply } from '@/lib/deep-link';
import { Army, ArmyUnit } from '@/lib/types';

const VALID = ['polaris', 'protectorate', 'mercenaries', 'rutenia', 'dead_fleet'];

describe('parseFactionParam', () => {
  it('возвращает валидную фракцию из ?faction=', () => {
    expect(parseFactionParam('?faction=polaris', VALID)).toBe('polaris');
  });

  it('валидирует по списку: неизвестная фракция → null', () => {
    expect(parseFactionParam('?faction=unknown', VALID)).toBeNull();
  });

  it('нет параметра → null (пустая строка и другие параметры)', () => {
    expect(parseFactionParam('', VALID)).toBeNull();
    expect(parseFactionParam('?utm_source=vk', VALID)).toBeNull();
  });

  it('соседние параметры не мешают', () => {
    expect(parseFactionParam('?utm=1&faction=dead_fleet', VALID)).toBe('dead_fleet');
  });

  it('пустое значение → null', () => {
    expect(parseFactionParam('?faction=', VALID)).toBeNull();
  });

  it('пустой список валидных → null', () => {
    expect(parseFactionParam('?faction=polaris', [])).toBeNull();
  });
});

describe('factionParamToApply', () => {
  const freshArmy = { units: [], isInBattle: false } as Pick<Army, 'units' | 'isInBattle'>;

  it('применяет к свежей армии (без юнитов, не в бою)', () => {
    expect(factionParamToApply('?faction=rutenia', freshArmy, VALID)).toBe('rutenia');
  });

  it('НЕ применяет к армии с юнитами', () => {
    const army = { units: [{} as ArmyUnit], isInBattle: false };
    expect(factionParamToApply('?faction=rutenia', army, VALID)).toBeNull();
  });

  it('НЕ применяет к армии в бою', () => {
    const army = { units: [], isInBattle: true };
    expect(factionParamToApply('?faction=rutenia', army, VALID)).toBeNull();
  });

  it('невалидная фракция → null даже для свежей армии', () => {
    expect(factionParamToApply('?faction=xxx', freshArmy, VALID)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- deep-link`
Expected: FAIL — `Cannot find module '@/lib/deep-link'`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/deep-link.ts
import { Army } from './types';

/** Имя URL-параметра deep-link-моста «энциклопедия → приложение». */
export const FACTION_PARAM = 'faction';

/**
 * Достать ?faction= из search-строки и провалидировать по списку фракций
 * текущего источника. Невалидное/пустое значение → null (молча игнорируем).
 */
export function parseFactionParam(search: string, validFactions: string[]): string | null {
  if (!search) return null;
  const value = new URLSearchParams(search).get(FACTION_PARAM);
  if (!value) return null;
  return validFactions.includes(value) ? value : null;
}

/**
 * Решение о применении deep-link к армии: только «свежая» армия
 * (без юнитов и не в бою) — армию вернувшегося игрока не перезаписываем.
 */
export function factionParamToApply(
  search: string,
  army: Pick<Army, 'units' | 'isInBattle'>,
  validFactions: string[],
): string | null {
  if (army.units.length > 0 || army.isInBattle) return null;
  return parseFactionParam(search, validFactions);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- deep-link`
Expected: PASS (10 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/deep-link.ts src/__tests__/lib/deep-link.test.ts
git commit -m "feat(deep-link): хелпер parseFactionParam/factionParamToApply — валидация + защита существующей армии"
```

---

### Task 2: Компонент `UnitToBattleCta` (панель «// В БОЙ»)

**Files:**
- Create: `src/components/encyclopedia/UnitDetail/UnitToBattleCta.tsx`
- Test: `src/__tests__/components/UnitToBattleCta.test.tsx`

**Interfaces:**
- Consumes: `trackEvent` из `@/lib/analytics`; `getFactionColors` из `@/lib/faction-colors` (возвращает объект с `primary: string`).
- Produces: `UnitToBattleCta({ faction: FactionID })` — рендерит `<section data-testid="unit-to-battle-cta">` с единственным `<a href="/app?faction=<id>">`. Используется в Task 3-й ревизии `UnitDetailPage` (вставка в конец `space-y-8`).

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/UnitToBattleCta.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UnitToBattleCta } from '@/components/encyclopedia/UnitDetail/UnitToBattleCta';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('UnitToBattleCta', () => {
  it('кнопка ведёт на /app?faction=<фракция>', () => {
    render(<UnitToBattleCta faction="dead_fleet" />);
    const link = screen.getByTestId('unit-to-battle-cta').querySelector('a');
    expect(link?.getAttribute('href')).toBe('/app?faction=dead_fleet');
  });

  it('клик шлёт battle_entry(from=encyclopedia_unit)', () => {
    render(<UnitToBattleCta faction="polaris" />);
    fireEvent.click(screen.getByRole('link'));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'encyclopedia_unit' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- UnitToBattleCta`
Expected: FAIL — `Cannot find module '@/components/encyclopedia/UnitDetail/UnitToBattleCta'`

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/encyclopedia/UnitDetail/UnitToBattleCta.tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { getFactionColors } from '@/lib/faction-colors';
import { FactionID } from '@/lib/types';
import { cn } from '@/lib/utils';

interface UnitToBattleCtaProps {
  faction: FactionID;
}

/** Мост «энциклопедия → игра»: панель призыва в конце досье юнита. */
export function UnitToBattleCta({ faction }: UnitToBattleCtaProps) {
  const colors = getFactionColors(faction);
  return (
    <section
      data-testid="unit-to-battle-cta"
      className="folded-paper military-corners p-5 md:p-6"
      style={{ borderColor: `${colors.primary}55` }}
    >
      <div className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust/70 mb-3">
        {'// В БОЙ'}
      </div>
      <Link
        href={`/app?faction=${faction}`}
        onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_unit' })}
        className={cn(
          'inline-flex items-center justify-between gap-3 w-full',
          'min-h-[52px] px-4 md:px-5 py-3 no-underline touch-manipulation',
          'border-2 transition-all duration-300 hover:opacity-80',
          'hover:shadow-[0_0_24px_-6px]',
        )}
        style={{ borderColor: `${colors.primary}99`, color: colors.primary }}
      >
        <span className="font-russo font-bold text-sm md:text-base uppercase tracking-wider">
          Взять отряд в бой
        </span>
        <ArrowRight className="w-5 h-5 shrink-0" />
      </Link>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- UnitToBattleCta`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/encyclopedia/UnitDetail/UnitToBattleCta.tsx src/__tests__/components/UnitToBattleCta.test.tsx
git commit -m "feat(encyclopedia): панель «// В БОЙ» — мост со страницы юнита в приложение (battle_entry)"
```

---

### Task 3: Вставка панели в `UnitDetailPage`

**Files:**
- Modify: `src/components/encyclopedia/UnitDetailPage.tsx` (блок `{/* Buffs section */}` — после его закрытия, перед `</div></main>` ~строка 508)

**Interfaces:**
- Consumes: `UnitToBattleCta` из Task 2; `unit.faction` уже есть в компоненте.

- [ ] **Step 1: Добавить импорт**

После строки `import { UnitSectionNav } from './UnitDetail/UnitSectionNav';` (строка 25) добавить:

```tsx
import { UnitToBattleCta } from './UnitDetail/UnitToBattleCta';
```

- [ ] **Step 2: Вставить панель в конец контента**

В `UnitDetailPage.tsx` после закрывающей `</section>` секции Buffs (сразу перед `</div>` блока `space-y-8`, ~строка 509) вставить:

```tsx
            {/* Мост в приложение — deep-link предвыбирает фракцию юнита */}
            <UnitToBattleCta faction={unit.faction} />
```

- [ ] **Step 3: Verify — типы и смоук-набор тестов**

Run: `npm run type-check && npm run test -- encyclopedia`
Expected: обе PASS (существующие тесты энциклопедии не сломаны)

- [ ] **Step 4: Commit**

```bash
git add src/components/encyclopedia/UnitDetailPage.tsx
git commit -m "feat(encyclopedia): панель «Взять отряд в бой» на странице юнита"
```

---

### Task 4: Модульная строка на лендинге (`CTAButton`, fresh state)

**Files:**
- Modify: `src/components/landing/CTAButton.tsx`
- Test: `src/__tests__/components/CTAButton.test.tsx`

**Interfaces:**
- Consumes: `trackEvent` из `@/lib/analytics`.
- Produces (используют e2e Task 8): `data-testid="landing-cta-button"` (ШТАБ, сохранён — на нём завязаны существующие тесты), `data-testid="landing-encyclopedia-button"`, `data-testid="landing-calculator-button"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/CTAButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import CTAButton from '@/components/landing/CTAButton';
import { trackEvent } from '@/lib/analytics';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));
jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('CTAButton — модульная строка (fresh state)', () => {
  it('рендерит три модуля с верными href', () => {
    render(<CTAButton />);
    expect(screen.getByTestId('landing-cta-button').getAttribute('href')).toBe('/app');
    expect(screen.getByTestId('landing-encyclopedia-button').getAttribute('href')).toBe('/encyclopedia');
    expect(screen.getByTestId('landing-calculator-button').getAttribute('href')).toBe('/calculator');
  });

  it('микротексты модулей', () => {
    render(<CTAButton />);
    expect(screen.getByText('собери армию и веди бой')).toBeInTheDocument();
    expect(screen.getByText('отряды, лор, тактика')).toBeInTheDocument();
    expect(screen.getByText('броски и урон в бою')).toBeInTheDocument();
  });

  it('клик по ШТАБ шлёт battle_entry(from=landing_hero)', () => {
    render(<CTAButton />);
    fireEvent.click(screen.getByTestId('landing-cta-button'));
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'landing_hero' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- CTAButton`
Expected: FAIL — `Unable to find an element with [data-testid="landing-encyclopedia-button"]`

- [ ] **Step 3: Implement — заменить fresh-state разметку**

В `CTAButton.tsx`:

3a. Добавить импорт аналитики (после `import { cn } from '@/lib/utils';`):

```tsx
import { trackEvent } from '@/lib/analytics';
```

3b. Перед `export default function CTAButton` добавить общий фрагмент разметки (используется и SSR-веткой `!isMounted`, и fresh-веткой — одинаковая разметка, чтобы не было hydration mismatch):

```tsx
/** Модульная строка первого экрана: ШТАБ (primary) + ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР.
 *  Единая разметка для SSR и свежего состояния клиента. */
function ModuleRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-stretch gap-2.5 w-full max-w-sm mx-auto', className)}>
      {/* Primary: ШТАБ */}
      <Link
        href="/app"
        data-testid="landing-cta-button"
        onClick={() => trackEvent('battle_entry', { from: 'landing_hero' })}
        className="group relative inline-flex bg-transparent border-2 border-military-rust/60 font-russo font-bold text-sm sm:text-base uppercase tracking-wider md:tracking-widest text-military-rust hover:border-military-amber hover:text-military-amber transition-all duration-300 overflow-hidden touch-manipulation min-h-[56px] no-underline"
      >
        <span className="absolute inset-0 bg-military-rust/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
        <span className="absolute top-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-l-2 border-military-rust" />
        <span className="absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-t-2 border-r-2 border-military-rust" />
        <span className="absolute bottom-0 left-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-l-2 border-military-rust" />
        <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-3 sm:h-3 border-b-2 border-r-2 border-military-rust" />
        <span className="relative flex items-center justify-between gap-3 w-full px-4 sm:px-6">
          <span className="flex flex-col items-start leading-tight text-left">
            <span>ШТАБ</span>
            <span className="font-ibm-mono text-[9px] sm:text-[10px] normal-case tracking-normal text-military-steel/80">
              собери армию и веди бой
            </span>
          </span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
        </span>
      </Link>

      {/* Secondary: ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/encyclopedia"
          data-testid="landing-encyclopedia-button"
          className="group relative inline-flex items-center bg-transparent border-2 border-military-steel/30 hover:border-military-steel/60 transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
        >
          <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
            <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-steel/80 group-hover:text-military-steel">
              ЭНЦИКЛОПЕДИЯ
            </span>
            <span className="font-ibm-mono text-[8px] sm:text-[9px] text-military-steel/50">
              отряды, лор, тактика
            </span>
          </span>
        </Link>
        <Link
          href="/calculator"
          data-testid="landing-calculator-button"
          className="group relative inline-flex items-center bg-transparent border-2 border-military-steel/30 hover:border-military-steel/60 transition-all duration-300 overflow-hidden touch-manipulation min-h-[44px] no-underline"
        >
          <span className="relative flex flex-col items-center justify-center leading-tight w-full px-2 py-2">
            <span className="font-russo font-bold text-[10px] sm:text-xs uppercase tracking-wider text-military-steel/80 group-hover:text-military-steel">
              КАЛЬКУЛЯТОР
            </span>
            <span className="font-ibm-mono text-[8px] sm:text-[9px] text-military-steel/50">
              броски и урон в бою
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
```

3c. Заменить тело SSR-ветки `if (!isMounted) { return (…); }` (строки 92–128) на:

```tsx
  if (!isMounted) {
    return <ModuleRow />;
  }
```

3d. Заменить fresh-ветку (блок `// Normal state - CTA button + calculator link` и её `return`, строки 215–281) на:

```tsx
  // Normal state - модульная строка: ШТАБ + ЭНЦИКЛОПЕДИЯ + КАЛЬКУЛЯТОР
  return <ModuleRow className={className} />;
```

(`ModuleRow` уже принимает `className` и прокидывает в корневой div через `cn` — см. 3b.)

Battle-state ветку (`hasActiveBattle`) НЕ трогать. Импорты `Calculator` из lucide остаются неиспользуемыми — убрать `Calculator` из импорта lucide-react (строка 6), он больше не используется в fresh-ветке, но используется в battle-карточке — оставить, если используется там; проверить `npm run lint`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- CTAButton && npm run type-check`
Expected: PASS (3 tests), type-check без ошибок

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/CTAButton.tsx src/__tests__/components/CTAButton.test.tsx
git commit -m "feat(landing): модульная строка первого экрана — ШТАБ/ЭНЦИКЛОПЕДИЯ/КАЛЬКУЛЯТОР + battle_entry"
```

---

### Task 5: `FactionsSection` — карточки становятся ссылками

**Files:**
- Modify: `src/components/landing/FactionsSection.tsx`
- Test: `src/__tests__/components/FactionsSection.test.tsx`

**Interfaces:**
- Consumes: `trackEvent` из `@/lib/analytics`.
- Produces (e2e Task 8): каждая карточка — `<a data-testid="landing-faction-card" href="/encyclopedia/factions">`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/FactionsSection.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FactionsSection from '@/components/landing/FactionsSection';
import { trackEvent } from '@/lib/analytics';

jest.mock('@/lib/analytics', () => ({ trackEvent: jest.fn() }));

describe('FactionsSection — карточки-ссылки', () => {
  it('каждая карточка — ссылка на /encyclopedia/factions', () => {
    render(<FactionsSection />);
    const cards = screen.getAllByTestId('landing-faction-card');
    expect(cards.length).toBeGreaterThanOrEqual(5);
    cards.forEach((c) => expect(c.getAttribute('href')).toBe('/encyclopedia/factions'));
  });

  it('клик шлёт battle_entry(from=landing_factions)', () => {
    render(<FactionsSection />);
    fireEvent.click(screen.getAllByTestId('landing-faction-card')[0]);
    expect(trackEvent).toHaveBeenCalledWith('battle_entry', { from: 'landing_factions' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- FactionsSection`
Expected: FAIL — `landing-faction-card` не найден

- [ ] **Step 3: Implement**

В `FactionsSection.tsx`:

3a. Импорты — добавить:

```tsx
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
```

3b. Заменить открывающий тег карточки (строки 56–67):

```tsx
// БЫЛО:
//            <div
//              key={faction.id}
//              className={cn(
//                'folded-paper military-corners p-6 md:p-8',
//                'group cursor-pointer transition-all duration-300',
//                'fade-in-up opacity-0',
//                `stagger-${index + 1}`
//              )}
//              style={{ animationFillMode: 'forwards', borderColor: `${faction.color}20` }}
//            >
// СТАЛО:
            <Link
              key={faction.id}
              href="/encyclopedia/factions"
              data-testid="landing-faction-card"
              onClick={() => trackEvent('battle_entry', { from: 'landing_factions' })}
              className={cn(
                'folded-paper military-corners p-6 md:p-8 block no-underline',
                'group cursor-pointer transition-all duration-300',
                'fade-in-up opacity-0',
                `stagger-${index + 1}`
              )}
              style={{ animationFillMode: 'forwards', borderColor: `${faction.color}20` }}
            >
```

3c. Закрывающий тег карточки: последняя `</div>` перед `);` в конце `.map` (строка 167) заменить на `</Link>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- FactionsSection && npm run type-check`
Expected: PASS (2 tests), type-check чисто

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/FactionsSection.tsx src/__tests__/components/FactionsSection.test.tsx
git commit -m "feat(landing): карточки фракций ведут в энциклопедию фракций (battle_entry: landing_factions)"
```

---

### Task 6: `FactionsListPage` — «Собрать армию» + deep-link в `app/page.tsx`

**Files:**
- Modify: `src/components/encyclopedia/FactionsListPage.tsx` (блок `mt-3` со ссылкой «Отряды фракции …», строки 234–254)
- Modify: `src/app/app/page.tsx` (новый effect после загрузки армии, ~строка 178)
- Test: `src/__tests__/components/FactionsListPage.test.tsx`

**Interfaces:**
- Consumes: `factionParamToApply` из Task 1; `getSource`/`getDefaultSource` из `@/lib/sources-registry` (`getSource(id).factions: Faction[]`, у Faction есть `id`); `trackEvent`.
- Produces (e2e Task 8): `data-testid="faction-build-army-link"`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/components/FactionsListPage.test.tsx
import { render, screen } from '@testing-library/react';
import FactionsListPage from '@/components/encyclopedia/FactionsListPage';

describe('FactionsListPage — мост в приложение', () => {
  it('на карточке фракции есть «Собрать армию» с deep-link', () => {
    render(<FactionsListPage />);
    const links = screen.getAllByTestId('faction-build-army-link');
    expect(links.length).toBeGreaterThanOrEqual(5);
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/app?faction=polaris');
    expect(hrefs).toContain('/app?faction=dead_fleet');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- FactionsListPage`
Expected: FAIL — `faction-build-army-link` не найден

- [ ] **Step 3: Implement — FactionsListPage**

3a. Импорт (рядом с остальными из `@/lib`):

```tsx
import { trackEvent } from '@/lib/analytics';
```

3b. В блоке `<div className="mt-3">` (строка 234) после существующей ссылки «Отряды фракции …» (закрытый `</Link>`, строка 242) добавить:

```tsx
                        <Link
                          href={`/app?faction=${faction.id}`}
                          onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_factions' })}
                          data-testid="faction-build-army-link"
                          className="ml-5 inline-flex items-center gap-2 font-ibm-mono uppercase tracking-wider transition-opacity hover:opacity-80 text-military-rust"
                        >
                          <span>Собрать армию</span>
                          <span>→</span>
                        </Link>
```

- [ ] **Step 4: Implement — deep-link effect в `app/app/page.tsx`**

4a. Импорты — дополнить существующие (строка 8–11):

```tsx
import { FactionID } from '@/lib/types';   // добавить в существующий import типов (строка 4)
import { getDefaultSource, getSource } from '@/lib/sources-registry';
import { factionParamToApply } from '@/lib/deep-link';
```

(строку 4 `import { Army, ArmyUnit, RulesVersionID } from '@/lib/types';` заменить на `import { Army, ArmyUnit, FactionID, RulesVersionID } from '@/lib/types';`)

4b. После effect загрузки армии (`setIsArmyLoaded(true); … }, [isMounted]);`, строки 170–178) добавить:

```tsx
  // Deep-link /app?faction=<id> — мост из энциклопедии: предвыбор фракции.
  // Только для «свежей» армии (см. factionParamToApply): армию вернувшегося
  // игрока не перезаписываем. Параметр вычищаем из URL, чтобы F5 не применял его снова.
  useEffect(() => {
    if (!isArmyLoaded || typeof window === 'undefined') return;
    const source = getSource(army.sourceId ?? getDefaultSource());
    const validFactions = source ? source.factions.map((f) => String(f.id)) : [];
    const faction = factionParamToApply(window.location.search, army, validFactions);
    if (!faction) return;
    setArmy((prev) => ({ ...prev, faction: faction as FactionID }));
    window.history.replaceState({}, '', window.location.pathname);
  }, [isArmyLoaded, army]);
```

- [ ] **Step 5: Verify**

Run: `npm run test -- FactionsListPage deep-link && npm run type-check`
Expected: PASS, type-check чисто

- [ ] **Step 6: Commit**

```bash
git add src/components/encyclopedia/FactionsListPage.tsx src/app/app/page.tsx src/__tests__/components/FactionsListPage.test.tsx
git commit -m "feat(bridges): «Собрать армию» на фракциях + применение deep-link ?faction= в /app"
```

---

### Task 7: E2E-спеки (пишем; исполняются в CI)

**Files:**
- Modify: `e2e/landing.spec.ts`
- Modify: `e2e/encyclopedia.spec.ts`
- Modify: `e2e/analytics.spec.ts`

**Interfaces:**
- Consumes: testid'ы из Tasks 2–6: `landing-cta-button`, `landing-encyclopedia-button`, `landing-calculator-button`, `landing-faction-card`, `unit-to-battle-cta`, `faction-build-army-link`; хелперы `clearStorage`, `ymCalls`/`gaCalls`.

- [ ] **Step 1: `e2e/landing.spec.ts` — добавить тесты в describe**

В конец `test.describe('Landing Page', …)` добавить:

```ts
  test('модульная строка: ЭНЦИКЛОПЕДИЯ и КАЛЬКУЛЯТОР ведут куда надо', async ({ page }) => {
    await page.getByTestId('landing-encyclopedia-button').click();
    await page.waitForURL(/\/encyclopedia/);

    await page.goBack();
    await page.getByTestId('landing-calculator-button').click();
    await page.waitForURL(/\/calculator/);
  });

  test('карточка фракции ведёт в энциклопедию фракций', async ({ page }) => {
    await page.getByTestId('landing-faction-card').first().click();
    await page.waitForURL(/\/encyclopedia\/factions/);
  });
```

- [ ] **Step 2: `e2e/encyclopedia.spec.ts` — мост со страницы юнита**

В подходящий `test.describe` добавить:

```ts
  test('«Взять отряд в бой»: deep-link предвыбирает фракцию юнита', async ({ page }) => {
    await clearStorage(page);
    await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
    await expect(page.getByTestId('unit-to-battle-cta')).toBeVisible();
    await page.getByTestId('unit-to-battle-cta').getByRole('link').click();

    // /app компилируется по требованию (~до 30с в dev)
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

    // армия получила фракцию (persist дебаунс 300мс)
    await expect
      .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('bronepehota_army') ?? '{}').faction))
      .toBe('polaris');

    // параметр вычищен из URL
    await expect(page).toHaveURL(/\/app$/);
  });
```

- [ ] **Step 3: `e2e/analytics.spec.ts` — battle_entry**

В конец файла добавить тест (внутри файла, вне `test.beforeEach`; перехватчики уже глобальные):

```ts
test('battle_entry(from=encyclopedia_unit) при клике на странице юнита', async ({ page }) => {
  await page.goto('/encyclopedia/unit/polaris_lineynaya_klon_pehota');
  await page.getByTestId('unit-to-battle-cta').getByRole('link').click();
  await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });

  const ym = await ymCalls(page);
  const ga = await gaCalls(page);
  expect(
    ym.some(
      (c) =>
        c[1] === 'reachGoal' && c[2] === 'battle_entry' &&
        (c[3] as { from?: string }).from === 'encyclopedia_unit',
    ),
  ).toBeTruthy();
  expect(ga.some((c) => c[0] === 'event' && c[1] === 'battle_entry')).toBeTruthy();
});
```

- [ ] **Step 4: Verify — типы (e2e в CI)**

Run: `npm run type-check && npm run lint`
Expected: чисто. **НЕ запускать** `npm run test:e2e` локально (harness убивает webServer) — спеки исполнятся в CI после пуша.

- [ ] **Step 5: Commit**

```bash
git add e2e/landing.spec.ts e2e/encyclopedia.spec.ts e2e/analytics.spec.ts
git commit -m "test(e2e): мосты discoverability — модули лендинга, карточки фракций, deep-link юнита, battle_entry"
```

---

### Task 8: Финал — полный прогон, issue #225, CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (раздел «Аналитика», строка про события)
- Modify: GitHub issue #225 (таблица custom dimensions — строка `from`)

- [ ] **Step 1: Полный локальный прогон**

Run: `npm run validate`
Expected: type-check + lint + 1443+ unit-тестов PASS (новых падений нет)

- [ ] **Step 2: CLAUDE.md — дополнить список событий**

В разделе «Аналитика (GA4 + Яндекс.Метрика)» строку
`**События**: \`wizard_step\` (6 шагов), \`battle_start\`, \`battle_turn\` (turn), \`battle_engaged\``
(ход 2 = «реальный бой»), \`editor_unit_saved\`, \`pwa_install\`. Спека+таксономия:
\`docs/superpowers/specs/2026-08-18-analytics-battles-design.md\`.`
заменить на ту же строку с добавленным `\`battle_entry\` (from: landing_hero | landing_factions | encyclopedia_unit | encyclopedia_factions) — мосты в /app` перед `editor_unit_saved`.

- [ ] **Step 3: Issue #225 — добавить dimension `from`**

```bash
# скачать текущее тело, вставить строку в таблицу dimensions, закоммитить обратно
gh issue view 225 --repo bronepehota/bronepehota.github.io --json body --jq .body > /tmp/i225.md
# в таблицу «| Параметр | Событие | Что означает |» добавить строку:
# | `from` | `battle_entry` | источник входа в /app (лендинг/энциклопедия) |
gh issue edit 225 --repo bronepehota/bronepehota.github.io --body-file /tmp/i225.md
# проверить:
gh issue view 225 --repo bronepehota/bronepehota.github.io --json body --jq .body | grep -c "battle_entry"
```

Expected: вывод `1` (строка добавлена). Примечание: gh в этой среде глотает stdout — если вывод пуст, проверить повторным `gh issue view` (или через `| cat`).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude-md): событие battle_entry в таксономии аналитики"
```

- [ ] **Step 5: Пуш и PR**

Сначала записать тело PR в файл (worktree-изоляция блокирует heredoc — используем Write tool, файл `.pr-body.md` в корне ворктри):

```markdown
<!-- .pr-body.md -->
## Что

Мосты «энциклопедия/лендинг → бой» (спека: docs/superpowers/specs/2026-08-26-battle-discoverability-design.md):

- Модульная строка первого экрана лендинга: ШТАБ / ЭНЦИКЛОПЕДИЯ / КАЛЬКУЛЯТОР
- Панель «// В БОЙ» на странице юнита + «Собрать армию» на карточках фракций
- Deep-link /app?faction=<id> — предвыбор фракции (только свежая армия)
- Событие battle_entry {from} — измеримая воронка входа
- Карточки фракций лендинга → /encyclopedia/factions

## Проверки

- npm run validate — PASS
- E2E — CI (landing/encyclopedia/analytics спеки обновлены)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Затем (простые команды по одной):

```bash
git -c credential.helper='!gh auth git-credential' push -u origin worktree-feat+battle-discoverability:feat/battle-discoverability
gh pr create --repo bronepehota/bronepehota.github.io --base main --head feat/battle-discoverability --title "feat: discoverability боя — мосты энциклопедия→бой + первый экран лендинга" --body-file .pr-body.md
rm .pr-body.md
```

После merge: e2e в CI прогонит новые спеки; чек-лист настройки GA4 — issue #225.
