# Боевая песочница в энциклопедии (подход A) + намёки на бой

Дата: 2026-08-27
Статус: утверждён владельцем (подход A: bottom-sheet на странице юнита;
калькулятор переносится в энциклопедию целиком, маршрут `/calculator` удаляется)
Ветка: продолжение `feat/battle-discoverability` (PR #226) — по решению
владельца работаем тут же.

## Контекст

Standalone-калькулятор (`/calculator`) не используется (0 трафика). Владелец:
«сделать калькулятор частью энциклопедии, попробовать на солдате оттуда» +
«из энциклопедии намекать, что есть режим боя». Энциклопедия — основной
SEO-трафик; песочница прямо в досье юнита = самый сильный намёк на режим боя.

## Решение

### 1. Панель «// В БОЙ» на странице отряда — две кнопки

`UnitToBattleCta` (только `type === 'squad'`):

- **ВЗЯТЬ ОТРЯД В БОЙ** (primary, заливка фракции — как сейчас) → `/app?faction=`
- **ПРОВЕРИТЬ БОЕМ** (secondary, outline) → открывает песочницу

Для машин — панель без изменений (одна кнопка; песочница машин — v2).

### 2. Песочница `UnitCombatSandbox` (bottom sheet)

Новый `src/components/encyclopedia/UnitDetail/UnitCombatSandbox.tsx` +
hooks-обвязка. Паттерн — `useBottomSheet` (свайп-закрытие), стилистика
`BottomSheetCombatModal`.

Флоу:
1. **Выбор солдата** — чипы «1…6» (если у солдат различаются статы;
   при одном солдате/одинаковых — сразу шаг 2). Статы берутся из
   `activeUnit.soldiers[i]` как есть: `range/power` в JSON армлистов уже
   финальные для выбранного при импорте оружия. Отдельный выбор оружия
   (`weapon_selections` из билдера) в песочнице v1 НЕ разруливается.
2. **Параметры** — цель вводится руками (как в standalone): дистанция (шаги),
   броня цели.
3. **Действия** — ВЫСТРЕЛ и ББ (гранаты — out of scope v2). Результат:
   броски/попадания/урон — существующий `CombatResults`.

Реализация: `useStandaloneCombatFlow` + `CombatantData`
(`src/lib/combatant-data.ts`) — предзаполнение из `Soldier`
(`rank/range/power/melee/armor`), переиспользование `ActionSelector`,
`ParameterInputs`, `CombatResults`, `DiceInputPopup` (история ввода работает).

Закрытие: свайп вниз, крестик, Esc. `data-testid="unit-combat-sandbox"`,
кнопка открытия `data-testid="unit-sandbox-open"`.

### 3. Аналитика

- `trackEvent('sandbox_open', { unit: <unitId> })` при открытии песочницы.
- `battle_entry` расширяется значением `from: 'encyclopedia_main'` (плашка, п.4).
- CLAUDE.md: таксономия + таблица issue #225 (`sandbox_open`, `encyclopedia_main`).

### 4. Намёк на главной энциклопедии

Компактная плашка над сеткой юнитов (или под шапкой):
`// РЕЖИМ БОЯ` + «Любой отряд можно собрать и вести в бой» + ссылка
«ШТАБ →» (`/app`, `battle_entry {from: 'encyclopedia_main'}`).
Стиль — как плашки досье; не модалка, не перекрывает сетку.

### 5. Удаление standalone-калькулятора

- Удалить `src/app/calculator/**`; вычистить ссылки: лендинг-модуль
  КАЛЬКУЛЯТОР (вторичные модули: один широкий **ЭНЦИКЛОПЕДИЯ**), кнопка
  «Калькулятор» в battle-карточке лендинга (остаются «Начать заново» +
  «Продолжить бой»), «Помочь проекту»-ссылки, sitemap (`app/sitemap.ts`),
  любые внутренние упоминания.
- `useStandaloneCombatFlow`, `combatant-data.ts`, `dice-history.ts` —
  ОСТАЮТСЯ (используются песочницей).
- E2E: `calculator.spec.ts` (7) и `calculator-tab.spec.ts` (7) — ключевые
  сценарии переносятся на песочницу (страница юнита), остальное удаляется;
  `landing.spec.ts` — модуль-тест на ЭНЦИКЛОПЕДИЮ (калькулятор-тест уходит).
- SEO: 301 не нужен (GitHub Pages, статики немного) — sitemap без /calculator.

## Тестирование

| Что | Тип | Где |
|---|---|---|
| Prefill `CombatantData` из Soldier (все поля, оружие) | Unit | `src/__tests__/lib/` |
| Панель: две кнопки, testid'ы, машины без песочницы | Unit | `UnitToBattleCta.test.tsx` (расширить) |
| Песочница: чипы солдат, выбор, `sandbox_open` | Unit | `UnitCombatSandbox.test.tsx` |
| Открытие с кнопки → чипы → параметры → выстрел | E2E | `encyclopedia.spec.ts` |
| Плашка главной энциклопедии → /app + battle_entry | E2E | `encyclopedia.spec.ts` |
| Мигрированные сценарии calculator-спек | E2E | `encyclopedia.spec.ts` / sandbox spec |
| Лендинг: модуль ЭНЦИКЛОПЕДИЯ (без калькулятора) | E2E | `landing.spec.ts` |

## Затрагиваемые файлы (ориентир)

Create: `UnitCombatSandbox.tsx` (+ тесты), прехелпер `soldier→CombatantData`.
Modify: `UnitToBattleCta.tsx`, `UnitDetailPage.tsx` (песочница + панель),
`EncyclopediaPage.tsx` (плашка), `CTAButton.tsx` (модули), `app/sitemap.ts`,
`CLAUDE.md`, issue #225, e2e спеки.
Delete: `src/app/calculator/**`, `calculator*.spec.ts` (после миграции).

## Out of scope (v2)

- Песочница машин (fire_rate, арсенал, прочность).
- Гранаты в песочнице.
- «в бой →» на карточках сетки энциклопедии.
- Редактор и RulesInfoModal — не трогаем.
