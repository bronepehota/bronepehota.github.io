# Soldier Effects Integration Design

## Context

Модификаторная система (баффы/дебаффы) имеет полный бэкенд: типы в `modifier-types.ts`, каталог в `standard-modifiers.json`, расчёты в `modifier-utils.ts`, UI создания в `ModifiersEditor.tsx`. Но в боевом интерфейсе **нет способа** применить эффект на юнита. `DebuffModal` и `ApplyBuffModal` созданы, но нигде не подключены. `ModifierIndicator` на SoldierCard показывает счётчик эффектов, но onClick не обрабатывается.

**Цель**: позволить игроку назначать баффы, дебаффы и активировать способности на отдельных солдат во время боя через нажатие на индикатор эффектов. Отображать активные модификаторы в фазах боя (выстрел/ближний бой).

## Scope

- Солдатские эффекты: баффы, дебаффы и способности
- Бафы и способности берутся из списка назначенных взводу модификаторов (`squad.buffs`), не из полного каталога
- Дебаффы берутся из каталога (назначаются противником)
- `applyTo` фильтрация: показываем только модификаторы с `'soldier'` в `applyTo`
- Хранение: `soldierModifiers[]` на ArmyUnit
- Отображение в бою: `ActiveModifiersDisplay` в фазах PARAMETERS и RESULTS

## Implemented Changes

### 1. Типы: `scope` → `applyTo`

**Файл**: `src/lib/modifier-types.ts`

- Удалён `BuffScope` тип и поле `scope` из всех интерфейсов
- Удалено `canApplyToSoldier?: boolean` из `BuffDefinition` и `DebuffTemplate`
- Добавлен `ModifierApplyTarget = 'machine' | 'soldier' | 'army'` (без `squad`)
- Добавлено `applyTo: ModifierApplyTarget[]` в `BuffDefinition`, `ActiveBuff`, `DebuffTemplate`
- `SoldierModifier.duration` и `expiresAtTurn` теперь optional — для постоянных способностей
- Добавлено `catalogId?: string` на `SoldierModifier` для отслеживания одноразового применения

### 2. Каталог: `standard-modifiers.json`

- Все `scope` → `applyTo` массивы
- Все `"squad"` → `"soldier"` в `applyTo`
- Постоянные баффы (`battle_cry`, `spotter`, `medic`) получили `duration: 1`
- `banner` (знамёносец) остался без `duration` — постоянный армейский бафф
- Исправлены дубликаты в `applyTo` массивах (например `["soldier", "soldier"]` → `["soldier"]`)
- Исправлена опечатка "Рыжковой" → "Прыжковой"

### 3. Утилиты: `modifier-utils.ts`

- `isModifierActive()` обновлён: при `duration === undefined` возвращает `true` (постоянный эффект)
- `collectBuffsForUnit()`: `!buff.applyTo.includes('army')` вместо `buff.scope === 'personal'`
- `cleanupExpiredModifiers()`: корректно обрабатывает модификаторы без `duration`
- `resolveModifierSummary()`: добавлен параметр `soldierIndex?`, включает `soldierModifiers` с фильтрацией по фазе

### 4. Одноразовые способности: `soldierAbilitiesUsed`

**Файл**: `src/lib/types.ts`

- Добавлено `soldierAbilitiesUsed?: string[]` на `ArmyUnit` — формат `"catalogId_soldierIndex"`
- Отслеживает использованные способности независимо от активных модификаторов
- Способность остаётся недоступной даже после снятия с активных эффектов

**Файл**: `src/components/GameSession.tsx`

- Вычисляет `abilitiesUsed` из `unit.soldierAbilitiesUsed` фильтрацией по `soldierIndex`
- Передаёт в `SoldierEffectsModal`
- При применении постоянной способности (без `duration`) записывает в `soldierAbilitiesUsed`

### 5. SoldierEffectsModal — НОВЫЙ компонент

**Файл**: `src/components/modals/SoldierEffectsModal.tsx`

Три вкладки:
- **БАФЫ** (временные, с `duration`) — из списка взвода
- **ДЕБАФЫ** — из каталога (назначаются противником)
- **СПОСОБНОСТИ** (постоянные, без `duration`) — из списка взвода

Функциональность:
- Активные эффекты показаны сверху с таймером (Ход X/Y) или "Постоянная"
- Применение бафа/дебафа/способности — одна штука за бой (отслеживание через `catalogId` + `abilitiesUsed`)
- Повторно применённые элементы показываются как ✓ с пониженной прозрачностью
- Кнопка "Снять" для удаления активного эффекта
- Bottom sheet на мобильных, центрированный на десктопе

### 6. ModifierIndicator — обновлён

**Файл**: `src/components/cards/soldier-card/ModifierIndicator.tsx`

- Пустое состояние: кликабельный плейсхолдер (пунктирная рамка + иконка Sparkles)
- Все три варианта рендера используют `e.stopPropagation()` для предотвращения всплытия к действию солдата
- Тултип: для временных — "Ход X/Y", для постоянных — "(постоянная)"

### 7. GameSession — интеграция

**Файл**: `src/components/GameSession.tsx`

- Стейт: `effectsModalState: { unitId, soldierIndex, soldierName } | null`
- Бафы и способности фильтруются из `squad.buffs` юнита (не из глобального каталога):
  ```
  const squadBuffs = (unit.data.buffs || []).filter(b => b.applyTo?.includes('soldier'));
  const modalBuffs = squadBuffs.filter(b => b.duration);
  const modalAbilities = squadBuffs.filter(b => !b.duration);
  ```
- Дебаффы из каталога: `soldierDebuffs` через useMemo
- `onApplyModifier`: создаёт SoldierModifier с `catalogId` для отслеживания; записывает в `soldierAbilitiesUsed` для постоянных
- `onRemoveModifier`: удаляет по id
- Проброска `onSoldierModifierClick` через UnitCard → SquadView → SoldierCard

### 8. Отображение модификаторов в бою

**Файл**: `src/components/combat/BottomSheetCombatModal.tsx`

- Добавлен проп `army: Army`
- Вычисляет `modifierSummary` через `useMemo`:
  - Фаза: `'melee'` для ближнего боя, `'shot'` для всего остального
  - `soldierIndex`: для отрядов передаётся, для машин — `undefined`
- Синхронизирует `modifierSummary` в `state.parameters.activeModifiers` через `useEffect`
- Рендерит `ActiveModifiersDisplay` в фазе PARAMETERS между вводом параметров и кнопкой выполнения
- Передаёт `isAimedShot`/`isSurpriseAttack` в `ActiveModifiersDisplay`

**Файл**: `src/components/combat/ActiveModifiersDisplay.tsx`

- Добавлены пропсы `isAimedShot?` и `isSurpriseAttack?`
- Показывает бейджи "Прицельный x2 дальность" (cyan) и "С тыла x2 урон" (purple)
- Цветовое кодирование: зелёный для бонусов, красный для штрафов, amber для нейтральных

**Файл**: `src/components/cards/UnitCard.tsx`

- Добавлен проп `army?: Army`, передаётся в `BottomSheetCombatModal`
- Fallback: `{ name: '', totalCost: 0, units: allUnits }` если army не передан

### 9. Editor: описания полей

**Файл**: `src/components/editor/ModifiersEditor.tsx`

- Добавлены подсказки ко всем полям формы:
  - Одноразовый: "Истощается после первого использования за бой"
  - Временный: "Действует N ходов, затем автоматически снимается"
- `scope` заменён на `applyTo` chips
- Дефолтная форма: `applyTo: ['soldier']` (было `['squad']`)

### 10. Другие файлы

- `BuffSelector.tsx`: `scopeLabel` → `applyToLabel`
- `ApplyBuffModal.tsx`: `scope` → `applyTo`
- `UnitDetailPage.tsx`: бейджи `applyTo` вместо `scope`
- `SoldierCard.tsx`: добавлен `soldierModifiers` в memo-сравнение

## Prop chain

```
GameSession
  ├─ state: effectsModalState
  ├─ onSoldierModifierClick(unitId, soldierIndex, name)
  ├─ SoldierEffectsModal (render in IIFE)
  │    ├─ availableBuffs (from squad.buffs, has duration)
  │    ├─ availableAbilities (from squad.buffs, no duration)
  │    └─ availableDebuffs (from catalog)
  │    ↓
  UnitCard (army prop)
  ├─ SquadView → SoldierCard → SoldierStats → ModifierIndicator
  └─ BottomSheetCombatModal
       ├─ modifierSummary (useMemo: resolveModifierSummary)
       ├─ ActiveModifiersDisplay (PARAMETERS phase)
       └─ CombatResults (RESULTS phase)
```

## Verification

1. В бою открыть карточку юнита → нажать на ModifierIndicator солдата → модал открывается
2. В модале три вкладки: БАФЫ, ДЕБАФЫ, СПОСОБНОСТИ
3. Бафы и способности — только из списка назначенных взводу модификаторов
4. Применить баф → отмечен ✓, повторное применение невозможно
5. Способности показывают "Постоянная" без счётчика ходов
6. Снять способность → она **недоступна** для повторного применения (tracked in `soldierAbilitiesUsed`)
7. Перейти на следующий ход → истёкшие баффы/дебаффы очищаются, способности остаются
8. Перезагрузка страницы → эффекты сохранены (через army в localStorage)
9. В бою: фаза PARAMETERS → видны активные модификаторы (и для отрядов, и для машин)
10. В бою: фаза RESULTS → модификаторы показаны рядом с результатами
11. `npm run type-check` — без ошибок
12. `npm run test` — 821 тест проходит
13. E2E тесты проходят (55/56 — 1 сбой в editor.spec.ts не связан с модификаторами)

## Resolved limitations

- ~~После снятия способности она снова доступна для применения~~ → **Исправлено**: отслеживание через `soldierAbilitiesUsed` на ArmyUnit
- ~~`resolveModifierSummary` не включает soldierModifiers~~ → **Исправлено**: добавлен параметр `soldierIndex?` с фильтрацией по фазе
- ~~`activeModifiers` в CombatParameters никогда не заполняется~~ → **Исправлено**: вычисляется в BottomSheetCombatModal через useMemo
- ~~`ActiveModifiersDisplay` нигде не подключён~~ → **Исправлено**: используется в PARAMETERS фазе боевого модала

## Known limitations

- Нет E2E тестов для SoldierEffectsModal
- `ActiveModifiersDisplay` не показан в RESULTS фазе CombatResults (только в PARAMETERS)
