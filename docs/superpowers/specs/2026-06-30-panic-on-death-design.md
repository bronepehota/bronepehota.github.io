# Паника при любой гибели бойца (включая пилота) — дизайн (#166)

**Дата:** 2026-06-30
**Issue:** [#166 — Паника не срабатывает при добивании бойца в уже походившем отряде](https://github.com/Luxor/bronepehota/issues/166)
**Тип:** bug (механика паники)
**Scope:** централизация триггера паники в `UnitCard`; `panic-logic.ts` не меняется (он корректен).

## Контекст и расследование

Эмпирический repro (E2E, community-правила + panic вкл) показал, что **ручной kill бойца →
panic-модалка работает корректно** и для done-, и для не-done отряда. Буквальный сценарий #166
в этом пути не воспроизводится. `panic-logic.checkPanicTrigger` корректен (без `done`-гейта;
триггер по `deadCount ≥ половины && !panicTestUsed`). `panicTestUsed` не выставляется преждевременно.

Definitive grep путей мутации `deadSoldiers` — их два:
1. `SoldierCard.handleToggleDead` (ручной kill) — **зовёт `checkPanicTrigger`** ✓
2. `UnitCard.handlePanicSurvivalTest:~256` (пилот машины гибнет на тесте выживания → его боец
   отмечается мёртвым в своём отряде) — **БЕЗ `checkPanicTrigger`** ✗

## Корневая причина

Триггер паники реализован **точечно** в `SoldierCard.handleToggleDead` (прямой вызов
`setShowPanicModal(true)` внутри `updateUnit`-апдейтера). Второй путь гибели (пилот) не имеет
триггера вообще. Плюс побочный эффект `setState` внутри чужого updater'а — душок.

Дополнительно: модалка паники принадлежит `UnitCard`, а триггер — в `SoldierCard` (потомке),
что и породило хрупкую проводку.

## Решение — централизовать триггер в `UnitCard`

`UnitCard` (для отрядов) через `useEffect` следит за ростом `unit.deadSoldiers`. При росте
(погиб боец) + `checkPanicTrigger(unit, rulesVersion)` → `setShowPanicModal(true)`. Это:

- **чинит путь пилота**: гибель пилота обновляет `deadSoldiers` отряда → отрядный `UnitCard`
  ре-рендерится → эффект ловит рост → открывает СВОЮ модалку паники (на правильной карточке);
- **сохраняет ручной kill**: `SoldierCard.handleToggleDead` обновляет `deadSoldiers` → тот же
  эффект срабатывает;
- **устойчиво к будущим путям** гибели;
- **убирает душок**: `setShowPanicModal` больше не зовётся внутри `updateUnit`-апдейтера.

### Дизайн

В `src/components/cards/UnitCard.tsx`:
```ts
const prevDeadCountRef = useRef<number>(unit.deadSoldiers?.length ?? 0);

useEffect(() => {
  if (!isSquad) return;
  if (rulesVersion !== 'community_star_system') return;
  const currentDead = unit.deadSoldiers?.length ?? 0;
  if (currentDead > prevDeadCountRef.current) {
    if (!showPanicModal && checkPanicTrigger(unit, rulesVersion)) {
      setShowPanicModal(true);
    }
  }
  prevDeadCountRef.current = currentDead;
}, [unit, unit.deadSoldiers, rulesVersion, isSquad, showPanicModal]);
```

В `src/components/cards/SoldierCard.tsx` — убрать точечный триггер из `handleToggleDead`
(блок `if (isAddingKill && rulesVersion === 'community_star_system') { ... setShowPanicModal(true) }`).
`handleToggleDead` оставляет только обновление `deadSoldiers`. Если `checkPanicTrigger`/`rulesVersion`/
`setShowPanicModal` становятся неиспользуемыми в `SoldierCard` — убрать импорты/пропсы (lint-clean).

### Краевые случаи

- **Mount с уже мёртвыми**: `prevDeadCountRef` инициализируется текущим `deadSoldiers.length`,
  рост = 0 → на загрузке не триггерит (исторические смерти — ок).
- **Воскрешение (long-press undo kill)**: `currentDead < prev` → не триггерит, `ref` обновляется.
- **Once-per-game**: `checkPanicTrigger` уже гейтит по `panicTestUsed` — повторно не сработает.
- **Уже открыта**: `!showPanicModal` гейтит повтор.
- **rulesVersion !== community**: ранний `return` (tehnolog — авто-паники нет, по дизайну).
- **Машины**: `if (!isSquad) return` — машины не паникуют.

## Non-goals

- `panic-logic.ts` не трогаем (корректен).
- Дизайн once-per-game не меняем.
- #162 (зонный урон по технике) / #163 (тест брони защитника) — отдельные задачи.
- Не добавляем авто-панику для tehnolog (по дизайну её нет).

## Тесты

- **E2E регрессия** (ручной kill → panic): squad с deadSoldiers у порога, kill до порога →
  panic-модалка открывается (done и не-done отряд). Доказывает, что централизация не сломала
  рабочий путь.
- **E2E путь пилота** (если setup реалистичен): машина с пилотом, чей отряд у порога; пилот
  гибнет на тесте выживания → panic-модалка отряда. Если setup слишком сложен — полагаемся на
  централизованный механизм (тот же эффект, что в регрессии) + code review; отметить в плане.
- `npm run validate` + `npm run test:e2e`.

## Критерии приёмки

- [ ] Гибель бойца через ЛЮБОЙ путь (ручной kill, гибель пилота) при `deadCount ≥ половины`
      и `!panicTestUsed` (community) → открывается panic-модалка.
- [ ] Ручной kill→panic не сломан (регрессия E2E зелёная).
- [ ] Нет преждевременного `panicTestUsed`; не срабатывает на mount/воскрешение/tehnolog.
- [ ] `npm run validate` + `npm run test:e2e` проходят.

## Риски

- `useEffect` на `unit` (объект) — ре-рендер частый; гейт по росту `deadSoldiers.length`
  гарантирует действие только при гибели. Проверить, что нет лишних срабатываний.
- E2E пути пилота может быть сложен в setup (машина+пилот+тест выживания) — fallback на
  централизованный механизм + регрессию.
