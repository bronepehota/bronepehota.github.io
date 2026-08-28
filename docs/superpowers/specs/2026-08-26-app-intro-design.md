# /app: короткий тайтл + брифинг-экран «что будет происходить»

Дата: 2026-08-26
Статус: утверждён (подход A — шаг «0» визарда)
Ветка: `feat/battle-discoverability` (PR #226, часть инициативы discoverability боя)

## Контекст и проблема

1. `/app` наследует SEO-тайтл лендинга: «Бронепехота — настольный варгейм:
   энциклопедия, фракции, миссии, калькулятор боя» — во вкладке нечитаем и не
   отражает суть экрана.
2. Новичок, пришедший по мосту (лендинг/энциклопедия → `/app`), сразу упирается
   в «выберите версию правил» без объяснения, что вообще будет происходить.
   Владелец: «промо-страница, чтобы было понятно, что будет происходить».

## Решение

### 1. Тайтл

Новый `src/app/app/layout.tsx` (серверная обёртка, стандартный паттерн для
клиентской страницы):

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Штаб — Бронепехота',
};
```

Перекрывает тайтл root-layout только для сегмента `/app`; остальные метаданные
наследуются. Лендинг/энциклопедия не меняются.

### 2. Шаг `intro` визарда (`ArmyBuilder.tsx`)

- Union `setupStep` расширяется значением `'intro'` (первым по смыслу).
- **Правило начального шага** (заменяет «нет сохранённого → `'rules'`»):
  - есть сохранённый `bronepehota_setup_step` → он;
  - нет → `'intro'`.
  Отдельный флаг «видел интро» НЕ нужен: наличие сохранённого шага = «уже
  видел». Следствие — вернувшиеся и старые пользователи никогда не видят интро;
  `clearStorage` в e2e корректно «омолаживает» устройство.
- **Факт хранения** (важно для реализации): сегодня `bronepehota_setup_step`
  только читается (`ArmyBuilder.tsx:107`) и никем не пишется — позиция игрока
  восстанавливается через `army.currentStep`-синк (`unit-select`/`preparation`),
  а не через этот ключ. Кнопка «Начать» интро становится **единственным
  писателем** `SETUP_STEP = 'rules'`. Поведение ранних шагов при перезагрузке
  не меняется (как были, так и остаются со «rules»).
- Рендер: при `setupStep === 'intro'` — полный экран `<IntroBriefing />`
  вместо остального контента. Прогресс-индикатор шагов НЕ включает `intro`
  (брифинг — не шаг); `stepOrder` и `handleStepClick` не меняются.
- Кнопка «Начать»: `setSetupStep('rules')` + persist `bronepehota_setup_step
  = 'rules'` + `trackWizardStep('intro')`.
- Резолвер начального шага — чистая функция (тестируемая):
  `initialSetupStep(savedStep: string | null): SetupStep` — `null`/мусор →
  `'intro'`, валидное значение → оно.
- Взаимодействие с deep-link `?faction=`: effect в `app/page.tsx` применяется
  независимо; игрок видит интро → правила → источник → фракция предвыбрана.

### 3. `IntroBriefing` (`src/components/rules/IntroBriefing.tsx`)

Полный экран в HUD-стиле, mobile-first (одна колонка; `md:` — крупнее, максимум
~28rem по центру):

- HUD-метка `// БРИФИНГ` (font-ibm-mono, rust/70).
- Заголовок «СОБЕРИ АРМИЮ И В БОЙ» (font-russo, military-text-gradient).
- Подзаголовок: «Три шага — и сражение за игровым столом.»
- Три карточки `folded-paper military-corners`:
  1. **① ПРАВИЛА** — «версия правил боя»
  2. **② АРМИЯ** — «фракция, бюджет, отряды»
  3. **③ БОЙ** — «ходы, броски, счётчики»
  (номер — rust, титул — russo, пояснение — mono)
- Primary-кнопка «НАЧАТЬ СБОРКУ →»: угловые скобки, rust, `min-h-[56px]`,
  full-width, tap ≥ 44px.
- Пропс один: `onStart: () => void` (переходы и аналитика — в ArmyBuilder).
- `data-testid="intro-briefing"`, `data-testid="intro-start-button"`.
- Никаких внешних ссылок и альтернативных путей — один путь вперёд.

### 4. Аналитика

- `wizard_step` со значением `intro` при клике «Начать» (существующий механизм
  `trackWizardStep`).
- CLAUDE.md: «wizard_step (6 шагов)» → «wizard_step (7 шагов: intro)».
- GA4 dimension `step` уже регистрируется (issue #225) — значение `intro`
  появится в отчётах без дополнительных настроек.

### 5. Тестирование

| Что | Тип | Где |
|---|---|---|
| `initialSetupStep` (экспорт из `ArmyBuilder.tsx`): null → 'intro'; 'rules' → 'rules'; мусор → 'intro' | Unit | существующий `src/__tests__/components/ArmyBuilder.test.tsx` |
| `IntroBriefing`: карточки рендерятся, клик «Начать» вызывает `onStart` | Unit | `src/__tests__/components/` |
| e2e-хелперы: `dismissIntroIfShown(page)` в `setupToArmyBuilder`, `setupToPreparation`, `setupGameSessionWithSquad` и др. входах в `/app` | E2E | `e2e/helpers/setup.ts` |
| Прямые тесты после входа в `/app`: `analytics.spec.ts` (2 кликающих теста), `encyclopedia.spec.ts` (deep-link тест) | E2E | соотв. спеки |
| Новинка: интро показано новичку → «Начать» → `rules-confirm-button`; при сохранённом `setup_step` интро нет | E2E | `landing.spec.ts` |

`landing.spec.ts` «should navigate to app when clicking CTA» (только waitForURL)
не меняется.

### 6. Затрагиваемые файлы

- Create: `src/app/app/layout.tsx`, `src/components/rules/IntroBriefing.tsx`
- Modify: `src/components/ArmyBuilder.tsx` (union + резолвер + рендер + переход),
  `e2e/helpers/setup.ts`, `e2e/analytics.spec.ts`, `e2e/encyclopedia.spec.ts`,
  `e2e/landing.spec.ts`, `CLAUDE.md` (одна строка)
- Test: `IntroBriefing.test.tsx`, тест `initialSetupStep`

Новых зависимостей нет.

## Out of scope

- Кнопка «пропустить брифинг» / повторный показ интро (вернувшиеся не видят).
- Расширение `StepProgressIndicator` и `stepOrder` на `intro`.
- Изменение остальных шагов визарда и SEO лендинга.
