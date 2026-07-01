# Зонный урон по машине-цели (ручной ввод макс зоны) — дизайн (#162)

**Дата:** 2026-07-01
**Issue:** [#162 — Урон по технике: броня зон шкалы прочности + D20→3 / D12→2 / D6→1](https://github.com/Luxor/bronepehota/issues/162)
**Тип:** bug (механика урона / community rules)
**Scope:** community rules `calculateDamage` (зонный урон по цели-машине) + UI цели в CombatModal + память выбора.

## Контекст и решение игрока

Правило v0.3 §6 «Повреждения орудий и боевых машин» + §«Тест брони»: броня машины = **максимум
текущей зоны** шкалы прочности (зелёная/жёлтая/красная). Мощность выстрела ≤ максимума зоны → броня
не пробита; > максимума → пробита. Пробитие: **D6 → 1 урон, D12 → 2, D20 → 3**.

Зонная логика в `community_star_system.ts` ЕСТЬ (`getDurabilityZone`, `damagePerDie {D6:1,D12:2,D20:3}`),
но `executeShot` зовёт `calculateDamage` без данных цели → зонная ветка не срабатывает. Корень: бой
«заточен под атакующего», цели-объекта нет; `isVehicle` ошибочно = `state.unitType === 'machine'`
(**атакующий** — машина, а не цель).

**Решение игрока (упрощённое):** в приложении НЕТ отслеживаемой армии врага (одностороннее), поэтому
«выбирать машину врага из списка» нельзя. Вместо этого — **ручной ввод максимума текущей зоны** как
порога пробития (игрок читает зону по шкале прочности машины врага и вводит её максимум). Тоггл «цель —
техника» включает зонный расчёт; выбор **запоминается** для каждого атакующего через существующий
`TargetMemory`.

## Дизайн

### 1. Параметры и память

- `CombatParameters` (`combat-types.ts`): добавить `targetIsVehicle?: boolean`.
- `TargetMemory` (`contexts/CombatTargetContext.tsx`): добавить `targetIsVehicle: boolean | null`
  (запоминается per-атакующий, как `distance`/`targetArmor`).

### 2. `executeShot` — исправить isVehicle (`useCombatFlow.ts`)

Оба пути урона (обычный `:318` и surprise `:303/310`): `isVehicle` = **`state.parameters.targetIsVehicle`**
(цель — машина), НЕ `state.unitType === 'machine'` (атакующий). Остальные аргументы `calculateDamage`
без изменений (currentDurability/vehicleData не нужны — см. §3).

### 3. `calculateDamage` — зонный урон по введённому порогу (`community_star_system.ts`)

Заменить зонную ветку (сейчас требует `vehicleData && currentDurability` и выводит зону через
`getDurabilityZone`) на расчёт по **введённому максимуму зоны = `targetArmor`**:

```ts
// Vehicle target (community rules §6): armor = entered zone-max threshold;
// damage scales by die type (D6→1, D12→2, D20→3) for penetrating dice.
if (isVehicle) {
  const zoneMax = targetArmor;
  const damagePerDie = (sides: number) => (sides === 6 ? 1 : sides === 12 ? 2 : sides === 20 ? 3 : 1);
  let damage = 0;
  const rolls = [];
  for (let i = 0; i < dice; i++) {
    const r = rollDie(sides) + bonus;
    rolls.push(r);
    if (r > zoneMax) damage += damagePerDie(sides);
  }
  return { damage, rolls };
}
```

Если `getDurabilityZone` становится неиспользуемой — удалить (и обновить её тесты в
`community-star-system-rules.test.ts` под новый «введённый порог» контракт). Параметры
`currentDurability`/`durabilityMax`/`vehicleData` в сигнатуре `CalculateDamageFn` оставить
(backward-compat) но в community-ветке не использовать; tehnolog `calculateDamage` не меняется
(бьёт машину как пехоту по броне — по дизайну).

### 4. UI — `ParameterInputs` (community + выстрел)

- **Тоггл «цель — техника»** (community rules + `actionType === 'shot'`): мелкий переключатель над/рядом
  с полем брони. Состояние — `parameters.targetIsVehicle`, persist в `targetMemory.targetIsVehicle`
  (как distance/armor).
- Когда вкл: лейбл поля `targetArmor` → **«макс зоны»** (порог пробития); значение то же поле
  (`targetArmor`). Подсказка: «введите максимум зоны цели по её шкале прочности».
- Когда выкл: как сейчас (броня цели, пехотный урон).
- Recall через `targetMemory?.isDirty && targetMemory?.targetIsVehicle !== null` (зеркало существующего
  паттерна для distance/armor).

### 5. Что НЕ меняется

- `calculateHit` (попадание) — не зависит от типа цели (дальность vs дистанция).
- Penetration-превью (`calculatePenetrationProbability`) — порог = `targetArmor` (для машины это
  макс зоны), шанс корректен; количество урона (damagePerDie) видно в результатах.
- Tehnolog rules — без изменений (нет зонной механики).
- `executeShot` логика попадания/surprise/гранаты — не трогаем.

## Краевые случаи

- **`targetIsVehicle` выкл / tehnolog**: урон как у пехоты (каждый кубик > брони = 1). Регрессии нет.
- **Машина-атакер**: атакующая машина стреляет по машине-цели — корректно, `isVehicle` теперь = цель.
- **Surprise attack по машине**: обе ветки `calculateDamage` получают `isVehicle=targetIsVehicle`.
- **Память per-атакующий**: каждый атакующий помнит свой `targetIsVehicle` + макс зоны → повторный
  выстрел по той же цели без повторного ввода.
- **Standalone-калькулятор**: `useStandaloneCombatFlow` — `targetIsVehicle` можно добавить
  опционально (через `combatantData`/parameters); MVP — только боевой поток.

## Тесты

- **Unit (`community-star-system-rules.test.ts`)**: обновить vehicle-кейсы под «введённый порог» —
  `calculateDamage(power, zoneMax, ..., isVehicle=true)` → D20 пробивает на 3, D12 на 2, D6 на 1,
  непробивший = 0. Удалить тесты `getDurabilityZone`, если функцию убрали.
- **Unit (`useCombatFlow.test.ts`)**: shot с `targetIsVehicle=true` → зонный урон (damagePerDie);
  `targetIsVehicle=false` → пехотный.
- **E2E (новый `e2e/vehicle-zone-damage.spec.ts`)**: community + shot + тоггл «цель — техника» вкл +
  макс зоны введён → результат урона отражает damagePerDie (напр. D20-мощность → 3 за пробитие).
  Тоггл запоминается (тот же атакующий — повторный бой без ввода макс зоны).

## Критерии приёмки

- [ ] Тоггл «цель — техника» (community + выстрел); поле брони → «макс зоны» при вкл.
- [ ] При `targetIsVehicle` урон = damagePerDie (D6→1/D12→2/D20→3) для кубиков > макс зоны.
- [ ] `isVehicle` в `executeShot` = цель (не атакующий); оба пути (обычный + surprise).
- [ ] `targetIsVehicle` + макс зоны запоминаются per-атакующий (через `TargetMemory`).
- [ ] Без тоггла / tehnolog — урон как у пехоты (регрессии нет).
- [ ] `npm run validate` + `npm run test:e2e` проходят.

## Non-goals

- Реестр/трекинг машин врага с сохранением их прочности (отдельная фича — игрок указал, что для ядра
  не нужно; достаточно ввести макс зоны + память).
- #163 (тест брони/выживания защитника) — отдельная задача.
- Изменения tehnolog rules / `calculateHit` / гранаты / melee.

## Риски

- Существующие vehicle-тесты community rules (`community-star-system-rules.test.ts`) тестировали
  зонную ветку через `vehicleData`/`currentDurability` — обновить под «введённый порог» (ожидаемо,
  подход поменялся по решению игрока).
- Удаление `getDurabilityZone` — проверить, что не используется в других местах (она module-private);
  обновить тесты.
