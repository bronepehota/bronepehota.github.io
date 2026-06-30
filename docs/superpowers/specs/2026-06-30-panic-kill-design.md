# Kill in panic — дизайн (#167)

**Дата:** 2026-06-30
**Issue:** [#167 — Нельзя отметить убитым бойца в состоянии паники](https://github.com/Luxor/bronepehota/issues/167)
**Тип:** bug (UX)
**Scope:** кнопки действий бойца в состоянии паники.

## Контекст

Из фидбека (п.9) и правил v0.3 §10 «Паника», стр. 56: паникующий боец находится на
поле и **может быть уничтожен**, но не может действовать. Сейчас в приложении бойца в
панике нельзя отметить убитым — кнопка УБИТЬ не отображается.

## Корневая причина

`src/components/cards/soldier-card/SoldierActions.tsx:99-108` — при `isInPanic` весь
блок действий заменяется статичной иконкой `Footprints` (индикатор паники). Ни DONE, ни
KILL не рендерятся. Поэтому убить паникующего нельзя.

`isInPanic` вычисляется в `SoldierCard.tsx:70` как
`unit.panicState?.some(p => p.soldierIndex === soldierIndex)`; `PanicState =
{ soldierIndex, testRoll, rank, triggeredAtTurn }`. `onToggleDead`
(`SoldierCard.handleToggleDead`, `:164-188`) уже подключён и даже перепроверяет триггер
паники при добивании — логика kill-а готова, не хватает только кнопки.

## Цели

1. В состоянии паники доступна кнопка **УБИТЬ** (`soldier-kill-button`).
2. Кнопка **ГОТОВ** (`soldier-done-button`) в панике **скрыта** — паникующий боец не
   может завершить действия (правила §10).
3. Инициация боя (клик по центру карточки, `SoldierStats`) остаётся отключённой в
   панике (`SoldierCard.tsx:278` `disabled={isDone || isDead || isInPanic}`) — паникующий
   не стреляет/не бьёт.

## Non-goals

- Очистка `panicState` при убийстве бойца — вне scope. Dead имеет приоритет в
  `getStripeState`, а `resolvePanic` чистит панику к началу тура; lingering-запись
  безвредна.
- Триггер паники / модалка паники — не трогаем.

## Дизайн

**1 файл, только презентация:**

`SoldierActions.tsx:99-108` — ветку `isInPanic` переписать: вместо одной иконки
рендерить вертикальный стек:

- **Индикатор паники** (иконка `Footprints`, статичный, оранжевый) — только при `!isDead`.
- **Кнопка УБИТЬ** — повторно использовать тот же блок `soldier-kill-button` и те же
  хендлеры (`handleDeadMouseDown` / `handleDeadClick` / long-press), что и в дефолтной
  ветке. DONE не рендерится.

Поскольку кнопка УБИТЬ одинакова для паники и нормы, разумно вынести её в локальный
`renderKillButton()` внутри компонента, чтобы не дублировать разметку (DRY).

### Краевые случаи

- **Dead + panic:** `isDead=true` → индикатор `Footprints` скрыт, УБИТЬ показывает
  состояние «убит» (long-press для отмены). `getStripeState` (`SoldierCard.tsx:73-78`)
  уже приоритизирует `dead` над `panic` → стрипа консистентна.
- **Клик УБИТЬ в панике:** `handleDeadClick` вызывает `onToggleDead` (при `!isDead`) →
  `handleToggleDead` добавляет в `deadSoldiers` и (community) перепроверяет триггер
  паники для отряда. Корректно.

## Тесты

**Unit** — расширить `src/__tests__/components/cards/soldier-card/SoldierActions.test.tsx`:

- `isInPanic=true` → `soldier-kill-button` в DOM, `soldier-done-button` отсутствует.
- Клик `soldier-kill-button` при `isInPanic` → `onToggleDead` вызван.
- `isInPanic=true && isDead=true` → `soldier-kill-button` присутствует (состояние killed).

**E2E** — новый `e2e/panic-kill.spec.ts`:

- Через `setupGameSessionWithSquad` (community_star_system) посеять отряд с
  `panicState: [{ soldierIndex: 0, ... }]` на бойце.
- Открыть карточку,/assert `soldier-kill-button` видим → клик → боец помечен убитым
  (status-stripe / state подтверждает dead).

## Критерии приёмки

- [ ] В панике кнопка **УБИТЬ** доступна и работает.
- [ ] В панике кнопка **ГОТОВ** скрыта.
- [ ] Инициация боя в панике по-прежнему отключена (регресс: existing поведение).
- [ ] Dead+panic отображается консистентно (стрипа dead, кнопка УБИТЬ в состоянии killed).
- [ ] `npm run validate` + `npm run test:e2e` проходят.

## Риски

- Дублирование разметки кнопки УБИТЬ — mitigated выносом в `renderKillButton()`.
- Регресс нормального (не-паника) режима — дефолтная ветка не меняется; покрыть существующим
  тестом `soldier-kill-button` в нормальном состоянии.
