# Боевая песочница в энциклопедии — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Кнопка «ПРОВЕРИТЬ БОЕМ» на странице отряда открывает bottom-sheet песочницу (статы солдата предзаполнены, выстрел/ББ), `/calculator` упраздняется, на главной энциклопедии плашка «// РЕЖИМ БОЯ → ШТАБ».

**Architecture:** Чистый хелпер `soldierToCombatantData` + расширение `useStandaloneCombatFlow(initial?)`; компонент `UnitCombatSandbox` (bottom sheet по паттерну `useBottomSheet`) переиспользует combat-компоненты; панель `UnitToBattleCta` получает вторую кнопку (только отряды); удаление маршрута `/calculator` с чисткой ссылок и миграцией e2e.

**Tech Stack:** Next.js 14 (static export), React 18, Jest+RTL, Playwright (CI-only).

Спецификация: `docs/superpowers/specs/2026-08-27-encyclopedia-sandbox-design.md`

## Global Constraints

- Ветка: `worktree-feat+battle-discoverability`, пуш в `feat/battle-discoverability` (PR #226): `git -c credential.helper='!gh auth git-credential' push origin worktree-feat+battle-discoverability:feat/battle-discoverability`.
- Stage только конкретные пути (никогда `git add -A`).
- Копирайт (дословно): кнопка «ПРОВЕРИТЬ БОЕМ»; шапка песочницы `// ПЕСОЧНИЦА`; плашка `// РЕЖИМ БОЯ` + «Любой отряд можно собрать и вести в бой» + «ШТАБ →»; чипы солдат «1»…«6».
- `data-testid`: `unit-sandbox-open` (кнопка открытия), `unit-combat-sandbox` (лист), `sandbox-soldier-<i>` (чип), `encyclopedia-battle-banner` (плашка), `encyclopedia-battle-banner-link`.
- Песочница ТОЛЬКО для `unit.type === 'squad'`; действия — ВЫСТРЕЛ и ББ (без гранаты).
- Аналитика: `trackEvent('sandbox_open', { unit: <unitId> })` при открытии; `battle_entry {from: 'encyclopedia_main'}` с плашки.
- Удаление `/calculator`: маршрут, sitemap-запись, модуль КАЛЬКУЛЯТОР на лендинге (остаётся ОДИН широкий вторичный модуль ЭНЦИКЛОПЕДИЯ), кнопка «Калькулятор» в battle-карточке лендинга. Компоненты `src/components/calculator/*` (RulesSelector, ModifiersSelector, DiceInputPopup) ОСТАЮТСЯ — их использует песочница; `CalculatorPage.tsx` удаляется.
- E2E локально НЕ запускать (CI-only); верификация `npm run type-check` + `npm run test`.
- Комментарии на русском; новых зависимостей нет; tap ≥ 44px; mobile-first.

---

### Task 1: `soldierToCombatantData` + `useStandaloneCombatFlow(initial?)`

**Files:**
- Modify: `src/lib/combatant-data.ts`
- Modify: `src/hooks/useStandaloneCombatFlow.ts` (строка 20)
- Test: `src/__tests__/lib/combatant-data.test.ts` (create/расширить, если есть)

**Interfaces:**
- Produces: `soldierToCombatantData(soldier: Soldier): CombatantData` и `useStandaloneCombatFlow(initialCombatant?: CombatantData)` — используют Tasks 2–3.

- [ ] **Step 1: Failing test**

```ts
// src/__tests__/lib/combatant-data.test.ts
import { soldierToCombatantData } from '@/lib/combatant-data';
import type { Soldier } from '@/lib/types';

const soldier: Soldier = {
  num: 1, rank: 3, speed: 5, range: 'D12', power: '2D6+1',
  melee: 4, armor: 2, props: [], image: '',
} as Soldier;

describe('soldierToCombatantData', () => {
  it('prefill из статов солдата', () => {
    expect(soldierToCombatantData(soldier)).toEqual({
      type: 'squad', range: 'D12', power: '2D6+1', melee: 4, armor: 2,
      rank: 3, grenadesAvailable: true,
    });
  });
  it('недостающие range/power остаются undefined (пусть DicePopup спросит)', () => {
    const s = { ...soldier, range: undefined as unknown as string, power: '' };
    const d = soldierToCombatantData(s);
    expect(d.range).toBeUndefined();
    expect(d.power).toBe('');
  });
});
```

- [ ] **Step 2:** Run `npm run test -- combatant-data` — FAIL (нет функции).

- [ ] **Step 3: Implement** — в `combatant-data.ts` (в конец файла):

```ts
import type { Soldier } from './types';

/**
 * Prefill боевой песочницы энциклопедии: статы солдата отряда как есть.
 * range/power в JSON армлистов уже финальные; undefined/пустые значения
 * оставляем как есть — песочница запросит их через DiceInputPopup.
 */
export function soldierToCombatantData(soldier: Soldier): CombatantData {
  return {
    type: 'squad',
    range: soldier.range,
    power: soldier.power,
    melee: soldier.melee ?? 0,
    armor: soldier.armor ?? 0,
    rank: soldier.rank ?? 1,
    grenadesAvailable: true,
  };
}
```
(импорт `Soldier` поднять к существующему `import type { Weapon }`).

В `useStandaloneCombatFlow.ts`: сигнатура `export function useStandaloneCombatFlow(initialCombatant?: CombatantData) {` и `useState<CombatantData>(initialCombatant ?? DEFAULT_COMBATANT)`.

- [ ] **Step 4:** Run `npm run test -- combatant-data useStandaloneCombatFlow` (или полный сьют) + `npm run type-check` — PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/combatant-data.ts src/hooks/useStandaloneCombatFlow.ts src/__tests__/lib/combatant-data.test.ts
git commit -m "feat(sandbox): soldierToCombatantData + префилл useStandaloneCombatFlow(initial?)"
```

---

### Task 2: `UnitCombatSandbox` — bottom-sheet песочница

**Files:**
- Create: `src/components/encyclopedia/UnitDetail/UnitCombatSandbox.tsx`
- Test: `src/__tests__/components/UnitCombatSandbox.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`soldierToCombatantData`, `useStandaloneCombatFlow(initial?)`), `useBottomSheet` из `@/hooks/useBottomSheet`, combat-компоненты (`ActionSelector`, `ParameterInputs`, `CombatResults`), `DiceInputPopup`, `RulesSelector` из `@/components/calculator/RulesSelector`.
- Produces: `UnitCombatSandbox({ unit, soldiers, onClose }: { unit: EnrichedUnit; soldiers: Soldier[]; onClose: () => void })`; testid'ы из Global Constraints. Вызов аналитики `sandbox_open` — внутри (при mount).

Существенные части реализации (компоновка по образцу `CalculatorPage`):

```tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useStandaloneCombatFlow } from '@/hooks/useStandaloneCombatFlow';
import { soldierToCombatantData } from '@/lib/combatant-data';
import { ActionSelector } from '@/components/combat/ActionSelector';
import { ParameterInputs } from '@/components/combat/ParameterInputs';
import { CombatResults } from '@/components/combat/CombatResults';
import { DiceInputPopup } from '@/components/calculator/DiceInputPopup';
import { trackEvent } from '@/lib/analytics';
import type { Soldier } from '@/lib/types';
import type { EnrichedUnit } from '@/lib/encyclopedia-utils';

// Чипы солдат показываем только если статы различаются.
function distinctSoldiers(soldiers: Soldier[]): boolean {
  const sig = (s: Soldier) => JSON.stringify([s.rank, s.range, s.power, s.melee, s.armor]);
  return new Set(soldiers.map(sig)).size > 1;
}

export function UnitCombatSandbox({ unit, soldiers, onClose }: {...}) {
  // префилл первого солдата
  const [soldierIdx, setSoldierIdx] = useState(0);
  const flow = useStandaloneCombatFlow(soldierToCombatantData(soldiers[0]));
  const sheetRef = useBottomSheet(onClose); // свайп-вниз закрывает
  useEffect(() => { trackEvent('sandbox_open', { unit: unit.id }); }, [unit.id]);
  const showChips = useMemo(() => distinctSoldiers(soldiers), [soldiers]);
  // выбор солдата: пересоздать поток нельзя — переключаем поля через updateCombatantField
  const pickSoldier = (i: number) => {
    setSoldierIdx(i);
    const d = soldierToCombatantData(soldiers[i]);
    (['range','power','melee','armor','rank'] as const).forEach((f) => flow.updateCombatantField(f, d[f] as never));
    flow.newCalculation();
  };
  // Рендер: fixed overlay (bg-black/60) + панель снизу (rounded-t-2xl, max-h-[90dvh], overflow-y-auto),
  // шапка: {'// ПЕСОЧНИЦА'} + имя юнита + крестик (44px) + чипы солдат (sandbox-soldier-i),
  // ниже — flow.combatState фазы: ACTION_SELECT → ActionSelector (БЕЗ гранаты: пропустить grenade
  // при рендере вкладок) / PARAMETERS → ParameterInputs / RESULTS → CombatResults.
  // ... (полная реализация по CalculatorPage:105+ как образцу)
}
```

Тесты (RTL): рендер с двумя солдатами разных статов → чипы `sandbox-soldier-0/1` видны; клик чипа 2 вызывает `updateCombatantField` (проверить через изменение отображаемых статов/или мок потока); аналитика `sandbox_open` вызвана с unit id; закрытие по крестику вызывает `onClose`. Моки: `@/hooks/useStandaloneCombatFlow` (jest.fn-заглушка фаз), `@/lib/analytics`.

- [ ] Steps: failing test → implement → pass → commit `feat(sandbox): UnitCombatSandbox — bottom-sheet с чипами солдат и prefill`.

---

### Task 3: Кнопка «ПРОВЕРИТЬ БОЕМ» в панели + врезка в UnitDetailPage

**Files:**
- Modify: `src/components/encyclopedia/UnitDetail/UnitToBattleCta.tsx`
- Modify: `src/components/encyclopedia/UnitDetailPage.tsx`
- Test: `src/__tests__/components/UnitToBattleCta.test.tsx` (расширить)

**Interfaces:**
- Consumes: `UnitCombatSandbox` из Task 2.
- Produces: `UnitToBattleCta({ faction, onOpenSandbox?: () => void })` — если `onOpenSandbox` задан, под primary рисуется вторая кнопка `<button data-testid="unit-sandbox-open">ПРОВЕРИТЬ БОЕМ</button>` (outline, цвет фракции, min-h-[48px]).

UnitDetailPage: `const [sandboxOpen, setSandboxOpen] = useState(false);` — панель получает `onOpenSandbox={unit.type === 'squad' ? () => setSandboxOpen(true) : undefined}`; при `sandboxOpen && unit.type === 'squad'` рендер `<UnitCombatSandbox unit={unit} soldiers={(activeUnit.soldiers ?? []) as Soldier[]} onClose={() => setSandboxOpen(false)} />`.

Тест: `onOpenSandbox` undefined → кнопки нет (машины); задан → кнопка есть, клик вызывает callback.

- [ ] Steps: failing test → implement → pass (`npm run test -- UnitToBattleCta UnitCombatSandbox encyclopedia`) → commit `feat(sandbox): кнопка «ПРОВЕРИТЬ БОЕМ» на странице отряда`.

---

### Task 4: Плашка «// РЕЖИМ БОЯ» на главной энциклопедии

**Files:**
- Modify: `src/components/encyclopedia/EncyclopediaPage.tsx` (под шапкой, над сеткой/фильтрами)
- Test: e2e в `e2e/encyclopedia.spec.ts` (Step ниже; unit-тест не обязателен — компонент в потоке страницы)

Плашка (стиль досье, `data-testid="encyclopedia-battle-banner"`):

```tsx
{/* Мост в режим боя — энциклопедия как витрина армии */}
<div data-testid="encyclopedia-battle-banner" className="mx-auto max-w-7xl px-4">
  <div className="folded-paper military-corners p-4 flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex-1">
      <div className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-military-rust/70 mb-1">{'// РЕЖИМ БОЯ'}</div>
      <p className="font-oswald text-sm md:text-base text-military-sand">Любой отряд можно собрать и вести в бой</p>
    </div>
    <Link
      href="/app"
      onClick={() => trackEvent('battle_entry', { from: 'encyclopedia_main' })}
      data-testid="encyclopedia-battle-banner-link"
      className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 border-2 border-military-rust/60 hover:border-military-amber font-russo text-xs uppercase tracking-widest text-military-rust hover:text-military-amber transition-all touch-manipulation no-underline"
    >
      ШТАБ →
    </Link>
  </div>
</div>
```

E2E (`encyclopedia.spec.ts`, в describe «Энциклопедия»):
```ts
  test('плашка режима боя ведёт в штаб', async ({ page }) => {
    await page.goto('/encyclopedia');
    await expect(page.getByTestId('encyclopedia-battle-banner')).toBeVisible();
    await page.getByTestId('encyclopedia-battle-banner-link').click();
    await dismissIntroIfShown(page);
    await expect(page.getByTestId('rules-confirm-button')).toBeVisible({ timeout: 30000 });
  });
```

- [ ] Steps: правка + e2e-код + `npm run type-check` → commit `feat(encyclopedia): плашка «// РЕЖИМ БОЯ» на главной + battle_entry(encyclopedia_main)`.

---

### Task 5: Удаление `/calculator`

**Files:**
- Delete: `src/app/calculator/page.tsx` (каталог), `src/components/calculator/CalculatorPage.tsx`
- Modify: `src/components/landing/CTAButton.tsx`, `src/app/sitemap.ts`, `e2e/landing.spec.ts`, `e2e/calculator.spec.ts`, `e2e/calculator-tab.spec.ts`, прочие упоминания (проверить `grep -rn "/calculator" src e2e --include="*.ts*" | grep -v calculator/`)

Изменения:
1. `CTAButton.tsx`: вторичная сетка `grid-cols-2` с двумя модулями → ОДИН широкий модуль ЭНЦИКЛОПЕДИЯ (`data-testid="landing-encyclopedia-button"` остаётся; `landing-calculator-button` удаляется). Battle-карточка: сегмент «Калькулятор» убрать (остаются «Начать заново» + «Продолжить бой»); иконку `Calculator` из lucide — удалить из импортов, если стала неиспользуемой.
2. `sitemap.ts`: убрать запись калькулятора.
3. `e2e/landing.spec.ts`: тест модулей — ветка калькулятора удаляется (ЭНЦИКЛОПЕДИЯ остаётся).
4. `e2e/calculator.spec.ts` (7) и `calculator-tab.spec.ts` (7): ключевые расчётные сценарии (выстрел по броня=X, ББ) переносятся в новый describe песочницы на странице юнита (`/encyclopedia/unit/polaris_lineynaya_klon_pehota`: кнопка `unit-sandbox-open` → выбрать действие → параметры → результат виден); тесты про гранату/навигацию страницы калькулятора — удалить. Итог: один файл `e2e/sandbox.spec.ts` (или расширение encyclopedia.spec) + удаление обоих старых.
5. Проверка чистоты: `grep -rn "calculator" src/app src/components/landing e2e/landing.spec.ts` — только осмысленные остатки (компоненты calculator/* остаются, это общий UI).

- [ ] Steps: grep-инвентарь → правки → `npm run test` (обновить юнит-тест CTAButton: убрать ассерт calculator-кнопки) + `npm run type-check` → commit `feat(!): /calculator упразднён — песочница в энциклопедии; модуль лендинга → широкая ЭНЦИКЛОПЕДИЯ`.

---

### Task 6: CLAUDE.md, issue #225, финальный прогон, пуш

- [ ] CLAUDE.md:
  - строка событий: `battle_entry` значения + `encyclopedia_main`; добавить `sandbox_open (unit)`;
  - раздел «Calculator Page» → переписать как «Боевая песочница» (UnitCombatSandbox на странице отряда; `/calculator` удалён);
  - e2e-таблица: calculator/calculator-tab строки → sandbox;
  - раздел «E2E» конвенций — без изменений.
- [ ] issue #225: таблица событий — строки `sandbox_open` и `encyclopedia_main` в `from`.
- [ ] `npm run test` + `npm run type-check` — PASS.
- [ ] Commit `docs(claude-md): песочница в таксономии; калькулятор → энциклопедия` + push (команда в Global Constraints).

## Out of scope
Машины в песочнице, гранаты, «в бой →» на карточках сетки — v2 (см. спеку).
