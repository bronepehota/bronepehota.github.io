# Защитник в ближнем бою использует Бр — дизайн (#160)

**Дата:** 2026-06-30
**Issue:** [#160 — В ближнем бою защитник использует Бр (броню), а не ББ](https://github.com/Luxor/bronepehota/issues/160)
**Тип:** bug (правила)
**Scope:** ближний бой — стат защитника, обе версии правил, UI параметров.

## Контекст

Правила v0.3, §8 «Ближний бой», стр. 43, 46. Сила в ближнем бою:

- **Атакующий:** D6 + ББ (для машины-атакующего — D6 + броня + мощности оружия ближнего боя;
  это отдельная фича #125, вне scope).
- **Защищающийся:** D6 + **Бр / броня** (стр. 43: пехотинец ББ 2 атакует пехотинца Бр 3;
  стр. 46 поддержка: «ББ для атакующих и Бр для защищающихся»).

Из фидбека игрока (п.4): «При ближнем бою у обороняющегося учитывается БР, а не ББ, как
пишет приложение».

## Корневая причина

`calculateMelee` в обеих версиях правил имеет сигнатуру
`(attackerMelee, defenderMelee)` и считает `dTotal = dRoll + defenderMelee`. Единственный
живой вызов — `src/hooks/useCombatFlow.ts:543`:

```ts
meleeResult = rules.calculateMelee(attackerMelee, state.parameters.targetMelee);
```

передаёт как стат защитника `targetMelee` (ББ), а должен — `targetArmor` (Бр). Та же ошибка
в ветке surprise-attack (`useCombatFlow.ts:527`):
`dTotal = defenderRoll + state.parameters.targetMelee`.

В UI (`src/components/combat/ParameterInputs.tsx`) melee показывает поле «ББ цели»
(`:370-389`, bound to `targetMelee`), а shot/grenade — «Броня цели» (`targetArmor`).
Melee-превью (`:304`) тоже показывает защитника как `1D6+effectiveTargetMelee`.

## Цели

1. Защитник в ближнем бою использует **броню** (Бр): `calculateMelee` получает броню цели,
   не ББ. И пехота, и «машина»-защитник — это просто число брони, которое вводит игрок.
2. Атакующий остаётся по **ББ** (без изменений).
3. Имя параметра не врёт: `defenderMelee` → `defenderArmor` (clarity-rename) — та самая
   путаница ББ/Бр породила этот баг.
4. UI: в melee защитник вводится как «Броня цели», превью показывает `1D6+броня`.

## Non-goals

- **Machine-атакер** в melee (D6 + броня + ББ-оружие) — это #125 «ББ + Таран для машин»,
  отдельная фича. Атакующая сторона здесь не трогается (пехотинец-атакующий по ББ).
- Выбор конкретного бойца-защитника в UI (игрок вводит броню вручную, как сейчас).
- `calculator-engine.ts:58 calculateMelee` — **другая** функция (standalone-калькулятор,
  иная сигнатура), не трогаем.

## Дизайн

### 1. Поведение — `src/hooks/useCombatFlow.ts` (`executeMelee`)

- Обычный путь (`:543`):
  `rules.calculateMelee(attackerMelee, state.parameters.targetArmor)`.
- Surprise-attack путь (`:527`):
  `dTotal = defenderRoll + state.parameters.targetArmor`.
- `attackerMelee` остаётся ББ атакующего — без изменений.

### 2. Clarity-rename (тип + оба rules + неиспользуемые хелперы)

- `src/lib/types.ts:322` —
  `export type CalculateMeleeFn = (attackerMelee: number, defenderArmor: number) => MeleeResult;`
- `src/lib/rules/community_star_system.ts:233` и `src/lib/rules/tehnolog.ts:48` —
  параметр `defenderMelee` → `defenderArmor`, тело: `const dTotal = dRoll + defenderArmor;`.
- `src/lib/game-logic.ts` — `calculateMelee` (`:189`, неиспользуемый) и
  `calculateMeleeWithSurpriseAttack` (`:261`, test-only): параметр `defenderMelee` →
  `defenderArmor` для консистентности. Обновить test-only `src/__tests__/surprise-attack.test.ts`
  под новое имя (семантика та же — там защитник и раньше тестировался числом).

### 3. UI — `src/components/combat/ParameterInputs.tsx`

- Убрать melee-поле «ББ цели» (`:370-389`, bound to `targetMelee`).
- Расширить условие поля «Броня цели» (`:350`) с
  `actionType === 'shot' || actionType === 'grenade'` →
  `actionType === 'shot' || actionType === 'grenade' || actionType === 'melee'`.
  Одно поле брони цели для всех действий.
- Melee-превью `renderMeleeStats` (`:304`): defender показывать
  `1D6+${effectiveTargetArmor}` вместо `1D6+${effectiveTargetMelee}`.

### 4. Тесты

- **Unit**: `calculateMelee` (community + tehnolog) — обновить существующие и добавить
  кейсы: защитник = броня (пехота: D6+Бр; «машина»-защитник: D6+броня машины — просто
  число). Обновить `useCombatFlow.test.ts` (melee) и `surprise-attack.test.ts` под новую
  семантику/имя.
- **E2E**: ближний бой — в melee показано поле «Броня цели» (не «ББ цели»), выполнение
  проходит. D6 случайно, поэтому E2E покрывает UI-флоу/подпись, а не конкретный исход.

## Краевые случаи

- **Surprise attack**: обе ветки (обычная `:543` и surprise `:527`) используют `targetArmor`.
- **Memory** (`targetMemory`): melee теперь пишет/читает `targetArmor` вместо `targetMelee`.
  `targetMemory.targetMelee` остаётся в типе, но для melee не используется — безвредно.
- **Standalone-калькулятор** (`useStandaloneCombatFlow`): melee не исполняет (только дефолт
  `melee: 0`), менять нечего.

## Критерии приёмки

- [ ] Защитник в melee использует броню (Бр) в обоих rules; атакующий — ББ.
- [ ] Surprise-attack melee тоже использует броню защитника.
- [ ] UI melee: поле «Броня цели» (не «ББ цели»); превью защитника `1D6+броня`.
- [ ] Параметр переименован `defenderMelee` → `defenderArmor` (тип + rules + game-logic).
- [ ] Выстрел/граната не сломаны (existing E2E + unit зелёные).
- [ ] `npm run validate` + `npm run test:e2e` проходят.

## Риски

- Существующие melee-тесты будут обновляться (семантика защитника поменялась) — это
  ожидаемо, не регрессия.
- `effectiveTargetMelee`/`targetMemory.targetMelee` могут остаться в коде частично
  неиспользуемыми для melee — принять (не удалять параметр из `CombatParameters`, он может
  использоваться иначе; проверить в реализации).
