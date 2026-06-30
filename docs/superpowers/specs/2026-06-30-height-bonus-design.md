# Бонус +1 за стрельбу с высоты + реорганизация строки модификаторов — дизайн (#164)

**Дата:** 2026-06-30
**Issue:** [#164 — Переключаемый бонус +1 за стрельбу с высоты](https://github.com/Luxor/bronepehota/issues/164)
**Тип:** enhancement (удобство; в правилах v0.3 такого бонуса НЕТ — по решению игрока)
**Scope:** выстрел (`actionType === 'shot'`) — механика бонуса + рефактор строки per-shot модификаторов в combat-модалке.

## Контекст

Фидбек пункт 2: «Нет бонуса за стрельбу с высоты». В правилах v0.3 бонуса за высоту при стрельбе нет
(есть только «метание гранат с возвышенности», стр. 41 — это отдельное правило, вне scope). По решению
игрока добавляем как удобство: **+1 к броску на попадание**, когда стреляешь с возвышенности.

Решение игрока по UX (уточнено в диалоге):
- **Гейт в конфигурации** (как паника) — на экране настроек/правил выбираем, играем ли мы с этим
  бонусом вообще. Гейт выкл → механика недоступна.
- **Per-shot кнопка** — если гейт вкл, в combat-модалке выстрела появляется чип `⬃ С высоты`; игрок
  жмёт его на конкретный выстрел с холма. Никакого auto-применения — только ручное включение per-shot.

Дополнительно (по ходу дизайна): добавление 4-го чипа перегружает текущую строку
`[чип surprise][чип aimed] [ВЫСТРЕЛИТЬ]` (всё в один `flex`-ряд, execute-кнопка сжимается, иконки без
подписей загадочны). Поэтому **реорганизуем строку per-shot модификаторов**: выносим модификаторы в
отдельный подписанный бар над полноразмерной кнопкой ВЫСТРЕЛИТЬ.

## Корневая причина (текущее состояние)

- Бой читает per-combat параметры из `state.parameters` (`useCombatFlow`): `isSurpriseAttack`,
  `isAimedShot` (дефолт `false`, `initialCombatFlowState` строки 33–34). Глобальные setup-тогглы
  (`RulesSelector`: panic/aimed/surprise) **не засеевают** эти параметры и **не соединены с боевой
  математикой** — их роль чисто setup-отображение + persist.
- Паника — единственный тоггл, чей гейт реально читается в логике: `panic-logic.ts:15` читает
  `localStorage.getItem('bronepehota_panic_enabled')` и выходит, если `'false'`. Это канонический
  паттерн гейта в проекте — его и повторяем.
- Строка модификаторов (`BottomSheetCombatModal.tsx:291–378`): surprise-чип (shot+melee), aimed-чип
  (shot, squad-only) и execute-кнопка в одном `flex gap-2` ряду. Чипы — иконочные квадраты 40–48px,
  без подписей.

## Решение (две части)

### Часть A — Механика бонуса за высоту

**A1. Гейт (конфигурация).** Новый глобальный тоггл `Бонус за высоту` в `RulesSelector` (рядом с
паникой/прицельным/с-тыла). Persist в `localStorage` (`bronepehota_height_bonus_enabled`), дефолт
**выкл**. State живёт в `ArmyBuilder` (`heightBonusEnabled`), пробрасывается в `RulesSelector`.
Точно по образцу `AimedShotToggle`/`SurpriseAttackToggle` (info-модалка + persist + helper).

**A2. Гейт читается в UI (как panic-logic).** В `BottomSheetCombatModal` чип `С высоты` рендерится
**только если** `getHeightBonusEnabled() === true` (helper читает `localStorage`, как
`getAimedShotEnabled()`/`panic-logic`). Гейт выкл → чипа нет → бонус нельзя включить. Читаем один
раз (config-значение стабильно во время сессии): `const heightBonusAvailable = getHeightBonusEnabled()`.

**A3. Per-shot параметр.** `isHeightBonus?: boolean` в `CombatParameters` (`combat-types.ts`); дефолт
`false` в `initialCombatFlowState.parameters`. Чип `С высоты` toggles
`onSetParameters({ isHeightBonus: !state.parameters.isHeightBonus })`. Никакого засевания из гейта —
только ручное per-shot.

**A4. Эффект (+1 к броску).** В `useCombatFlow.executeShot`, новый шаг **после** прицельного
(после строки ~265 `multiplyRange(range, 2)`):
```ts
// Height bonus (+1 to hit roll) — player convenience, not in v0.3 rules
if (state.parameters.isHeightBonus) {
  range = addBonusToRoll(range, 1); // D6 → D6+1, D12 → D12+1
}
```
Формат: **+1 к броску на дальность** (не −1 к дистанции). Математически для попадания идентично
(`total+1 >= D` ⟺ `total >= D-1`), но: (1) точно по тексту issue «бонус к попаданию»; (2) видно в
отображаемом броске; (3) переиспользует `addBonusToRoll`. Корректно стекается с прицельным
(`D6 → D12 → D12+1`) и с `mods.rangeBonus` (`addBonusToRoll` поддерживает существующий бонус).

**A5. Hit-prob preview.** В `ParameterInputs` превью дальности (строка ~155) применяет +1 когда чип
вкл, до подсчёта вероятности:
```ts
let effectiveRange = isAimedShot && actionType === 'shot' ? multiplyRange(unitStats.range, 2) : unitStats.range;
if (parameters.isHeightBonus && actionType === 'shot') {
  effectiveRange = addBonusToRoll(effectiveRange, 1);
}
```
(потребуется `import { addBonusToRoll }` в `ParameterInputs`, если ещё нет).

### Часть B — Реорганизация строки модификаторов (layout)

Текущий блок `BottomSheetCombatModal.tsx:291–378` (чипы + execute в один ряд) → разбивается на:

**B1. Бар модификаторов** — отдельный блок над execute:
- Заголовок-микролейбл в существующем стиле (`text-[10px] font-mono opacity-50 uppercase`): `МОДИФИКАТОРЫ`.
  (Универсально для shot и melee — для melee в баре только surprise.)
- Контейнер `flex flex-wrap gap-1.5` — pill'ы переносятся на тесных экранах (масштабируется).
- Каждый pill: иконка + короткая подпись (раньше были иконки-квадраты без подписи).
- Pill'ы: `surprise` (shot+melee), `aimed` (shot, squad-only), `height` (shot, по гейту A2).

**B2. Цвета/состояние pill'ов** (акценты не меняются — используем устоявшиеся):
- surprise → purple (`bg-purple-600/20 border-purple-500`, иконка `text-purple-400`), активный = заливка+glow.
- aimed → cyan (`bg-cyan-600/20 border-cyan-500`, `text-cyan-400`).
- height → emerald (`bg-emerald-600/20 border-emerald-500`, `text-emerald-400`) — отличимо от cyan/purple.
- Неактивный pill: `bg-slate-700/50 border-slate-600`, иконка+подпись `text-slate-400`.
- Активный pill: пульсирующая точка-индикатор (как сейчас, строки 312–314 / 336–338).
- Иконки (Lucide): surprise `EyeOff`, aimed `Crosshair`, height `Mountain` (возвышенность).

**B3. Подписи pill'ов:** `с тыла` (surprise), `прицельный` (aimed), `с высоты` (height).

**B4. Полная execute-кнопка.** `flex-1` → `w-full` (своя строка под баром), заметнее как primary-action.
В подзаголовке кнопки — активные модификаторы: `с тыла` / `прицельный` / `с высоты`, через ` + `
(расширяем текущий summary, строки 370–376; показываем и на мобильном, `text-[10px]`).

**B5. КРИТИЧНО — сохранить aria-labels существующих чипов** (иначе падают E2E `aimed-shot.spec.ts` и др.):
- aimed: `aria-label` ровно `'Прицельный выстрел включён'` / `'Прицельный выстрел выключён'`.
- surprise: `aria-label` ровно `'Внезапная атака включена'` / `'Внезапная атака выключена'`.
- height (новый): `aria-label` `'Бонус за высоту включён'` / `'Бонус за высоту выключён'`.
- Гейт-тоггл получает `data-testid="height-bonus-toggle"` (по аналогии с `aimed-shot-toggle` /
  `surprise-attack-toggle`), внутренняя кнопка — `aria-pressed` (как у существующих setup-тогглов).

## Точки изменений (файлы)

| Файл | Изменение |
|------|-----------|
| `src/lib/constants.ts` | `HEIGHT_BONUS_ENABLED: 'bronepehota_height_bonus_enabled'` в `LOCAL_STORAGE_KEYS`. |
| `src/lib/combat-types.ts` | `isHeightBonus?: boolean` в `CombatParameters`. |
| `src/hooks/useCombatFlow.ts` | дефолт `isHeightBonus: false` в `initialCombatFlowState`; новый шаг +1 в `executeShot` (A4). |
| `src/components/toggles/HeightBonusToggle.tsx` (новый) | по образцу `AimedShotToggle` + `export function getHeightBonusEnabled()`. |
| `src/components/ArmyBuilder.tsx` | state `heightBonusEnabled` (init из localStorage, дефолт false) + проброс в `RulesSelector`. |
| `src/components/rules/RulesSelector.tsx` | prop `heightBonusEnabled` + mount `<HeightBonusToggle>`. |
| `src/components/combat/BottomSheetCombatModal.tsx` | рефактор строки 291–378 → бар модификаторов (B1–B3) + полная execute-кнопка (B4); чип height по гейту (A2); все aria-labels сохранены (B5). |
| `src/components/combat/ParameterInputs.tsx` | hit-prob preview учитывает height +1 (A5); `import addBonusToRoll`. |
| `src/__tests__/hooks/useCombatFlow.test.ts` | unit: shot +1 когда `isHeightBonus`. |
| `e2e/height-bonus.spec.ts` (новый) | E2E: гейт выкл → чипа нет; гейт вкл → чип есть, toggle, execute; persist между сессиями. |

## Краевые случаи

- **Гейт выкл mid-сессии:** гейт — config-значение, читается один раз в модалке. Переключение на
  config-экране (до боя) применится к следующему бою. Внутри одного боя значение стабильно — ок.
- **Стек с прицельным:** `D6` → multiply → `D12` → height → `D12+1`. Порядок шагов в `executeShot`:
  rangeBonus → multiply(aimed) → height(+1) → powerBonus. Сохранить текущий порядок, вставить height
  после aimed.
- **Стек с `mods.rangeBonus`:** `addBonusToRoll` корректно добавляет к существующему бонусу
  (`D6+2` → `D6+3`); height применяется после multiply, поэтому на «очищенном» выстреле (без модов)
  бонус из height = 1 (тестируем именно так).
- **Melee:** height не применяется (только shot). Surprise в баре остаётся для melee; aimed/height —
  только shot. Бар рендерится, когда есть хотя бы один применимый pill.
- **Машина-стрелок:** height доступен (любой стрелок на холме), не ограничен пехотой (в отличие от
  aimed, который squad-only).
- **Hit-prob preview vs факт:** и preview (A5), и бой (A4) применяют один и тот же +1 — консистентно.

## Тесты

**Unit (`useCombatFlow.test.ts`):** на «чистом» выстреле (без активных модов, без aimed) с
`isHeightBonus: true` — бросок на попадание получает +1. Детерминированная проверка через бонус
дальности: `executeShot` прокидывает `finalDisplay.hitBonus = hitResult.bonus` (`useCombatFlow.ts:290`),
а `hitResult.bonus` = распарсенный бонус строки range. Для range `D6` → bonus 0; с height → `D6+1` →
bonus 1. Утверждаем `result…hitBonus === 1` (с height) vs `=== 0` (без). Без зависимости от случайных
D6. (Точный путь к hitBonus в возвращаемом `CombatResult` уточняется в плане.)

**E2E (`e2e/height-bonus.spec.ts`, новый):**
1. Гейт выкл (дефолт) → в shot-модалке чип «С высоты» / aria-label «Бонус за высоту» отсутствует.
2. На config-экране включить гейт (`height-bonus-toggle`) → в shot-модалке чип появляется.
3. Жмём чип → `aria-label` меняется на «Бонус за высоту включён»; в подзаголовке execute-кнопки
   появляется «с высоты».
4. Execute → бой разрешается.
5. Persist: после reload гейт остаётся вкл (читается из localStorage).
(D6 случайно, поэтому E2E покрывает UI-флоу/подписи/гейт, а не конкретный +1 к броску — это в unit.)

**Регрессия:** существующие `aimed-shot.spec.ts` / `battle-buffs.spec.ts` / `combat.spec.ts` должны
остаться зелёными — чипы surprise/aimed сохраняют aria-labels и функциональность, только переезжают
в бар и получают подписи.

## Критерии приёмки

- [ ] Гейт `Бонус за высоту` в RulesSelector, persist в localStorage, дефолт выкл.
- [ ] Гейт выкл → чипа `С высоты` в shot-модалке нет. Гейт вкл → чип есть.
- [ ] Чип `С высоты` (shot, пехота+техника) toggles `isHeightBonus`; +1 к броску на попадание в `executeShot`.
- [ ] +1 виден в hit-prob preview и корректно стекается с прицельным/мод-бонусами.
- [ ] Бар модификаторов: pill'ы с подписями над полной execute-кнопкой; активные в подзаголовке кнопки.
- [ ] Существующие чипы surprise/aimed сохраняют точные aria-labels и поведение (E2E регрессия зелёная).
- [ ] Unit + E2E зелёные; `npm run validate` + `npm run test:e2e` проходят.

## Non-goals

- **Standalone-калькулятор** (`/calculator`, `useStandaloneCombatFlow`) — отдельный UI, вне scope
  (можно добавить позже).
- **Метание гранат с возвышенности** — отдельное правило v0.3 стр. 41; граната не затрагивается.
- **Бонус за высоту в melee** — нет (height только для выстрела).
- **Засевание per-combat параметра из гейта** — намеренно отсутствует: гейт = доступность, активация per-shot ручная.
- Рефактор глобальных тогглов aimed/surprise (они не соединены с боевой математикой) — отдельно; здесь только добавляем height по каноническому гейт-паттерну.

## Риски

- **Сломать существующие E2E** при переносе чипов в бар — митигировано жёстким сохранением aria-labels
  (B5); проверяем `aimed-shot.spec.ts` / `battle-buffs.spec.ts` / `combat.spec.ts` после рефактора.
- **Высота бара** добавляет ~1 строку в bottom-sheet. Приемлемо (полная execute-кнопка — обычный
  mobile-primary паттерн); bar `flex-wrap` не ломает layout при 3+ модификаторах.
- **Детерминированный unit-тест +1:** полагается на `hitResult.bonus`/`finalDisplay.hitBonus`; если
  путь к полю в `CombatResult` иной — уточнить в плане (assertion остаётся на бонус дальности, не на случайном броске).
