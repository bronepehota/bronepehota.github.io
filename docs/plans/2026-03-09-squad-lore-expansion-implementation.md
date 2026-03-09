# Squad Lore Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand squad lore with new fields (traditions, keyBattles, locations) and update UI to display them.

**Architecture:** Add optional fields to TypeScript types, update JSON data files with rich lore content, modify EncyclopediaModal and related components to render new sections.

**Tech Stack:** TypeScript, Next.js 14, JSON data files, React components, Tailwind CSS

---

## Task 1: Update TypeScript Types

**Files:**
- Modify: `src/lib/types.ts`

**Step 1: Add new interfaces for lore expansion**

Find the existing `Squad` interface definition and add new optional fields:

```typescript
// Add these new interfaces before the Squad interface
export interface KeyBattle {
  name: string;
  year: string;
  description: string;
  outcome: string;
}

export interface Location {
  name: string;
  type: 'base' | 'academy' | 'battlefield' | 'homeworld';
  description: string;
}

// Find the Encyclopedia interface and extend it
export interface Encyclopedia {
  class: string;
  lore: string;
  tactics: string;
  history: string;
  manufacturer: string;

  // NEW FIELDS - all optional:
  traditions?: string;
  keyBattles?: KeyBattle[];
  locations?: Location[];
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS (no errors, fields are optional)

**Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add optional lore expansion fields - traditions, keyBattles, locations"
```

---

## Task 2: Create Lore Content Helper

**Files:**
- Create: `src/lib/lore-utils.ts`

**Step 1: Create utility functions for lore rendering**

```typescript
import { KeyBattle, Location } from '@/lib/types';

export function hasLoreExpansion(encyclopedia?: any): boolean {
  return Boolean(
    encyclopedia?.traditions ||
    (encyclopedia?.keyBattles && encyclopedia.keyBattles.length > 0) ||
    (encyclopedia?.locations && encyclopedia.locations.length > 0)
  );
}

export function formatBattleYear(year: string): string {
  // Could add formatting logic later
  return year;
}

export function getLocationIcon(type: Location['type']): string {
  const icons = {
    base: '🏠',
    academy: '🎓',
    battlefield: '⚔️',
    homeworld: '🌍'
  };
  return icons[type] || '📍';
}
```

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/lore-utils.ts
git commit -m "feat(lore): add utility functions for lore expansion"
```

---

## Task 3: Update EncyclopediaModal Component

**Files:**
- Modify: `src/components/modals/EncyclopediaModal.tsx`

**Step 1: Add imports for new utilities**

After line 5, add:
```typescript
import { hasLoreExpansion } from '@/lib/lore-utils';
```

**Step 2: Add Traditions section**

Find the History section (around line 214) and add after it:

```typescript
          {/* Traditions section */}
          {unit.encyclopedia?.traditions && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_TRADITIONS
                </span>
              </div>
              <p className="font-oswald text-military-sand leading-relaxed italic border-l-4 border-military-amber/60 pl-4">
                {unit.encyclopedia.traditions}
              </p>
            </section>
          )}
```

**Step 3: Add Key Battles section**

After the Traditions section:

```typescript
          {/* Key Battles section */}
          {unit.encyclopedia?.keyBattles && unit.encyclopedia.keyBattles.length > 0 && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_BATTLES
                </span>
              </div>
              <div className="space-y-4">
                {unit.encyclopedia.keyBattles.map((battle, index) => (
                  <div key={index} className="border-l-2 border-military-rust/40 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-russo font-bold text-white">{battle.name}</h4>
                      <span className="font-ibm-mono text-[10px] text-military-amber">{battle.year}</span>
                    </div>
                    <p className="font-oswald text-sm text-military-sand mb-2">{battle.description}</p>
                    <p className="font-ibm-mono text-xs text-military-steel italic">{battle.outcome}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
```

**Step 4: Add Locations section**

After the Key Battles section:

```typescript
          {/* Locations section */}
          {unit.encyclopedia?.locations && unit.encyclopedia.locations.length > 0 && (
            <section className="folded-paper military-corners p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-ibm-mono text-[10px] text-military-rust/60 uppercase tracking-wider">
                  DATA_LOCATIONS
                </span>
              </div>
              <div className="space-y-3">
                {unit.encyclopedia.locations.map((location, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-xl">{getLocationIcon(location.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-russo font-bold text-white mb-1">{location.name}</h4>
                      <p className="font-oswald text-sm text-military-sand">{location.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
```

**Step 5: Add getLocationIcon helper function**

At the top of the component, after imports:

```typescript
function getLocationIcon(type: string): string {
  const icons: Record<string, string> = {
    base: '🏠',
    academy: '🎓',
    battlefield: '⚔️',
    homeworld: '🌍'
  };
  return icons[type] || '📍';
}
```

**Step 6: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 7: Build and verify**

Run: `npm run build`
Expected: PASS with no errors

**Step 8: Commit**

```bash
git add src/components/modals/EncyclopediaModal.tsx
git commit -m "feat(ui): add traditions, battles, locations sections to EncyclopediaModal"
```

---

## Task 4: Create Proof of Concept - Polaris Tribunators

**Files:**
- Modify: `src/data/polaris/squads.json`

**Step 1: Add lore expansion to Трибунаторы (новые)**

Find the entry with `id: "polaris_tribunatory_novye"` and replace the `encyclopedia` section with:

```json
"encyclopedia": {
  "class": "Элитная гвардия",
  "lore": "Личная гвардия Императора. Новые модели трибунаторов с улучшенным вооружением. Ранг 5, Броня 6. Самые элитные бойцы в Империи. Верны только Императору.",
  "tactics": "Элитная гвардия с максимальными характеристиками. Броня 6 обеспечивает исключительную защиту. Снайпер с D20 обеспечивает дальнобойную точность. Смешанное вооружение D6, D12 и специалист ближнего боя. Используйте для охраны или критических штурмов. Медленные (Скорость 3), но чрезвычайно выносливы. Высокая стоимость отражает элитный статус.",
  "history": "Изначально личная гвардия Имперского Трибуна. Переоснащена современным оружием после Реформы Трибуна. Служат только Императору лично.",
  "manufacturer": "Имперская Гвардия (Exclusively for Emperor)",
  "traditions": "Каждый трибунатор проходит Ритуал Крови на Алтаре Императора перед получением звания. Щит трибунатора никогда не покидает владельча — даже после смерти он кремируется вместе с ним. Отступление при живом командире считается предательством и карается смертью. Ежегодная церемония присяги проводится в День Императора.",
  "keyBattles": [
    {
      "name": "Осада крепости Саруков",
      "year": "Эпоха Consolidation, 3287 год",
      "description": "300 трибунаторов под командованием трибуна Кассиана удерживали крепость против 10,000 повстанцев в течение 40 дней. Когда припалы закончились, они шли в контратаку с штыками.",
      "outcome": "Полная победа. Все 300 погибли, но крепость устояла. Впервые применена тактика 'последнего щита'."
    },
    {
      "name": "Битва при Небесных Воротах",
      "year": "Эпоха Expansion, 3412 год",
      "description": "Первая десантная операция трибунаторов. Захватили орбитальную станцию 'Небесные Ворота' ценой 80% потерь. Прорвали шлюзовые ворота в вакууме.",
      "outcome": "Захват ключевого стратегического объекта. Открыт путь для Имперского флота в систему Зенит."
    },
    {
      "name": "Резня в Долине Теней",
      "year": "Эпоха Stabilization, 3520 год",
      "description": "Амбуш сил Протократа на конвой Императора. 12 трибунаторов защитили Императора от 200 киберсолдат. Все погибли, Император выжил.",
      "outcome": "Появление традиции 'Двенадцати Невозвратных'. Каждый год 12 лучших курсантов выбираются для символической миссии."
    }
  ],
  "locations": [
    {
      "name": "Академия Трибунов, планета Полярис Prime",
      "type": "academy",
      "description": "Тренировочный комплекс в кратере потухшего вулкана Горький. Температура в зонах тренировок достигает -60°C. Только 1 из 100 кандидатов заканчивает 10-летнюю подготовку."
    },
    {
      "name": "Дворец Императора, сектор Золотой Трон",
      "type": "base",
      "description": "Постоянная дислокация личной гвардии. Трибунаторы в почёте никогда не покидают столицу без прямого приказа Императора. Смен караула происходит каждые 4 часа."
    },
    {
      "name": "Поле Саруков, планета Сарук IV",
      "type": "battlefield",
      "description": "Место легендарной осады. Теперь это мемориал и место традиционной клятвы выпускников Академии."
    }
  ]
}
```

**Step 2: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/polaris/squads.json', 'utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Build to verify**

Run: `npm run build`
Expected: PASS

**Step 4: Manual test**

1. Start dev server: `npm run dev`
2. Navigate to app
3. Select Polaris faction
4. Add "Трибунаторы (новые)" to army
5. Click on unit to open EncyclopediaModal
6. Verify new sections appear: Traditions, Key Battles, Locations

**Step 5: Commit**

```bash
git add src/data/polaris/squads.json
git commit -m "feat(lore): add expanded lore to Polaris Tribunators (proof of concept)"
```

---

## Task 5: Expand Proof of Concept - Protectorate

**Files:**
- Modify: `src/data/protectorate/squads.json`

**Step 1: Add lore expansion to Киберспецназ**

Find the entry with `id: "protectorate_kiberspetsnaz"` and expand `encyclopedia`:

```json
"encyclopedia": {
  "class": "Кибернетические специальные силы",
  "lore": "Полностью кибернетизированные солдаты элитного класса. Обладают огромной силой (ББ 6) и тяжёлой бронёй (5). Специализируются на ближнем бою и полном уничтожении противника.",
  "tactics": "Элитный кибернетический отряд ближнего боя. 6 бойцов с ББ 6/3, бронёй 5. Непревзойдён в рукопашной. Не имеет огнестрельного оружия.",
  "history": "Вершина кибернетической технологии Протократа. Киберспецназ создаётся из лучших волонтёров и усиливается передовыми имплантами.",
  "manufacturer": "Кибернетикал Системз Инк.",
  "traditions": "Кандидаты undergo Полную Замену — добровольный процесс удаления 80% биологической ткани. Нейро-синхронизация отряда создаёт коллективное сознание в бою. Раненый боец активирует 'Феникс-протокол' — взрыв с термоядерным зарядом. После каждого боя проводится дефрагментация памяти. Потеря отрядника ощущается как потеря конечности.",
  "keyBattles": [
    {
      "name": "Штурм комплекса 'Чёрный Солнце'",
      "year": "Эпоха Кибернетической Интеграции, 3405 год",
      "description": "Первое боевое применение киберспецназа. 24 бойца штурмовали fortified комплекс пиратов. Потери: 3 бойца, все уничтожены Феникс-протоколом.",
      "outcome": "Комплекс захвачен за 47 минут. Технология признана успешной."
    },
    {
      "name": "Битва на орбите Гелиона",
      "year": "3428 год",
      "description": "Бортовой бой на крейсере 'Горизонт'. Киберспецназ против штурмовиков Полярис. Бой в невесомости и декомпрессии.",
      "outcome": "Победа. Все 12 врагов уничтожены. Потери: 1 (активировал Феникс из-за критического повреждения)."
    },
    {
      "name": "Операция 'Пустой Гроб'",
      "year": "3455 год",
      "description": "Секретная миссия по ликвидации био-оружия в исследовательской станции. Станция была заражена мутагеном.",
      "outcome": "Успех. Все образцы уничтожены. 4 бойца contaminated — демонтированы на месте."
    }
  ],
  "locations": [
    {
      "name": "Фабрика Сознания, орбитальная станция CS-1",
      "type": "base",
      "description": "Место производства и имплантации киберспецназа. Расположена на орбите для секретности. Доступ только по уровню допуска АЛЬФА."
    },
    {
      "name": "Полигон 'Нейтронная Яма', луна Гелиона II",
      "type": "academy",
      "description": "Тренировочный комплекс с моделированием экстремальных условий: вакуум, радиация, невесомость. Каждый кандидат проводит здесь 2 года."
    },
    {
      "name": "Сектор 'Чёрное Зеркало', планета Рутения",
      "type": "battlefield",
      "description": "Место первого успешного deployment киберспецназа. Теперь мемориальный комплекс корпорации Кибернетикал Системз."
    }
  ]
}
```

**Step 2: Validate and build**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/protectorate/squads.json', 'utf8')); console.log('Valid JSON')"`
Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/protectorate/squads.json
git commit -m "feat(lore): add expanded lore to Protectorate Kiberspetsnaz"
```

---

## Task 6: Expand Proof of Concept - Mercenaries

**Files:**
- Modify: `src/data/mercenaries/squads.json`

**Step 1: Add lore expansion to Найтсталкеры**

Find the entry with `id: "mercenaries_naytstalkery"` and expand `encyclopedia`:

```json
"encyclopedia": {
  "class": "Элитные наёмники",
  "lore": "Элитное подразделение наёмников, специализирующееся на ночных операциях. Солдаты высокого ранга (3) с хорошим вооружением и бронёй (3). Мастера скрытности и внезапных атак.",
  "tactics": "Элитный наёмный отряд. 6 бойцов ранга 3, броня 3, мощное смешанное вооружение. Универсален в любой ситуации, особенно в ночных условиях.",
  "history": "Найтсталкеры сформировались как элитное подразделение для специальных операций. Служат самым высокооплачиваемым заказчикам.",
  "manufacturer": "Гильдия наёмников",
  "traditions": "Все члены отряда носят светонепроницаемые татуировки с кодом репутации. Первая миссия новичка — 'Ночной Переход', solo-операция без поддержки. Контракт на ночные операции оплачивается triple rate. Оружие именное — каждый боец вручает своё именное оружие apprentice на initiation. Отряд не оставляет следов — ни живых, ни мёртвых.",
  "keyBattles": [
    {
      "name": "Ночной рейд на Тортугу",
      "year": "Эпоха Пиратских Войн, 3410 год",
      "description": "6 найтсталкеров проникли на станцию Тортуга через вентиляцию. Убили 50 пиратов, освободили заложников, исчезли за 2 часа до прибытия reinforcements.",
      "outcome": "Выплата контракта: 500,000 кредитов. Репутация 'неуловимых' закрепилась."
    },
    {
      "name": "Операция 'Призрачный Свет'",
      "year": "3435 год",
      "description": "Защита convoy Протократа от рейдеров Полярис. 3 ночные атаки отбиты без потерь. Рейдеры так и не увидели атакующих.",
      "outcome": "Бонус за stealth: +200,000. Репутация выросла до 'призраки'."
    },
    {
      "name": "Штурм поселения Альфа-9",
      "year": "3458 год",
      "description": "Контракт на устранение bandit settlement. Операция проведена ночью. Все 100 bandits нейтрализованы, поселение сгорело дотла.",
      "outcome": "Контракт выполнен. Один найтсталкер погиб — его кремировали на месте, оставив mark."
    }
  ],
  "locations": [
    {
      "name": "Убежище 'Тень', астероид Belt-42",
      "type": "base",
      "description": "Секретная база Гильдии наёмников в asteroid belt. Найтовая академия, armory, hospital. Местоположение известно только членам Гильдии."
    },
    {
      "name": "Полигон 'Чёрная Луна', луна Тортуги",
      "type": "academy",
      "description": "Тренировочный комплекс с моделированием ночного боя, zero gravity, stealth operations. Graduates получают 'Night Mark' tattoo."
    },
    {
      "name": "Станция Тортуга, сектор Внешний Кольцо",
      "type": "battlefield",
      "description": "Место легендарного ночного рейда. Найсталкеры запрещены на станции под угрозой немедленного уничтожения."
    }
  ]
}
```

**Step 2: Validate and build**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/mercenaries/squads.json', 'utf8')); console.log('Valid JSON')"`
Run: `npm run build`
Expected: PASS

**Step 3: Manual test**

1. Start dev server
2. Test all 3 proof-of-concept squads in encyclopedia
3. Verify all new sections render correctly

**Step 4: Commit**

```bash
git add src/data/mercenaries/squads.json
git commit -m "feat(lore): add expanded lore to Mercenaries Nightstalkers - complete PoC"
```

---

## Task 7: Expand Remaining Polaris Squads

**Files:**
- Modify: `src/data/polaris/squads.json`

**Priority order:**
1. Спецназ планеты Шиду (90 pts)
2. Тяжёлый штурмовой десант (105 pts)
3. Лёгкий штурмовой десант (95 pts)
4. Тяжёлая клон-пехота (80 pts)
5. Лёгкая штурмовая клон-пехота (70 pts)
6. Режимная клон-пехота (60 pts)
7. Линейная клон-пехота (50 pts)
8. Трибунаторы (старые) (170 pts) — update existing

**Step 1: For each squad, add lore expansion**

Follow the pattern established in Task 4. Each squad should have unique:
- `traditions`: 3-5 sentences about their culture/rituals
- `keyBattles`: 2-4 battles that shaped their reputation
- `locations`: 2-3 significant places

**Step 2: Validate after each squad**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/data/polaris/squads.json', 'utf8')); console.log('Valid JSON')"`

**Step 3: Commit per squad**

```bash
git add src/data/polaris/squads.json
git commit -m "feat(lore): add expanded lore to [squad name]"
```

---

## Task 8: Expand Remaining Protectorate Squads

**Files:**
- Modify: `src/data/protectorate/squads.json`

**Priority order:**
1. Спецназ планеты Фелиция (135 pts)
2. Штурмовой отряд Стервятники (125 pts)
3. Штурмовой спецназ (новые) (120 pts)
4. Штурмовой спецназ (старые) (120 pts)
5. Тяжёлая штурмовая пехота Велиана (115 pts)
6. Регуляры планеты Велиан (115 pts)
7. Киберпехота (105 pts)
8. Рутенийская гвардия (100 pts)
9. Лёгкая киберпехота (95 pts)
10. Войска планеты Рутения (60 pts)
11. Ополчение планеты Велиан (75 pts)
12. Фелицианская гвардия (50 pts)
13. Ополчение планеты Гелион (40 pts)

**Follow pattern from Task 5, commit per squad.**

---

## Task 9: Expand Remaining Mercenaries Squads

**Files:**
- Modify: `src/data/mercenaries/squads.json`

**Priority order:**
1. Пираты Маркуса (старые) (80 pts)
2. Косари (75 pts)
3. Пираты Тортуги (65 pts)
4. Пираты Маркуса (новые) (50 pts)
5. Мутанты (50 pts)
6. Рейдеры пыльной зоны (50 pts)
7. Аборигены крепости Молодых Ростков (20 pts)

**Follow pattern from Task 6, commit per squad.**

---

## Task 10: Update Encyclopedia Detail Pages

**Files:**
- Modify: `src/components/encyclopedia/UnitDetail/UnitLore.tsx`

**Step 1: Add Traditions section**

After line 32, add:

```typescript
      {unit.encyclopedia?.traditions && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Традиции</h3>
          <p className="text-slate-300 leading-relaxed italic border-l-4 border-amber-500/60 pl-4">
            {unit.encyclopedia.traditions}
          </p>
        </div>
      )}
```

**Step 2: Add Key Battles section**

```typescript
      {unit.encyclopedia?.keyBattles && unit.encyclopedia.keyBattles.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Ключевые сражения</h3>
          <div className="space-y-3">
            {unit.encyclopedia.keyBattles.map((battle, index) => (
              <div key={index} className="border-l-2 border-slate-600 pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white">{battle.name}</h4>
                  <span className="text-xs text-amber-400">{battle.year}</span>
                </div>
                <p className="text-sm text-slate-300 mb-1">{battle.description}</p>
                <p className="text-xs text-slate-400 italic">{battle.outcome}</p>
              </div>
            ))}
          </div>
        </div>
      )}
```

**Step 3: Add Locations section**

```typescript
      {unit.encyclopedia?.locations && unit.encyclopedia.locations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Значимые места</h3>
          <div className="space-y-2">
            {unit.encyclopedia.locations.map((location, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-lg">{getLocationIcon(location.type)}</span>
                <div>
                  <h4 className="font-semibold text-white">{location.name}</h4>
                  <p className="text-sm text-slate-300">{location.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
```

**Step 4: Add helper function**

At the top of the component:

```typescript
function getLocationIcon(type: string): string {
  const icons: Record<string, string> = {
    base: '🏠',
    academy: '🎓',
    battlefield: '⚔️',
    homeworld: '🌍'
  };
  return icons[type] || '📍';
}
```

**Step 5: Build and test**

Run: `npm run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/encyclopedia/UnitDetail/UnitLore.tsx
git commit -m "feat(encyclopedia): add traditions, battles, locations to UnitLore component"
```

---

## Task 11: Add Unit Tests for Lore Utilities

**Files:**
- Create: `src/__tests__/lore-utils.test.ts`

**Step 1: Write tests**

```typescript
import { hasLoreExpansion, formatBattleYear, getLocationIcon } from '@/lib/lore-utils';
import { Encyclopedia } from '@/lib/types';

describe('Lore Utilities', () => {
  describe('hasLoreExpansion', () => {
    it('returns false for undefined encyclopedia', () => {
      expect(hasLoreExpansion(undefined)).toBe(false);
    });

    it('returns false for encyclopedia with no new fields', () => {
      const encyclopedia: Encyclopedia = {
        class: 'Test',
        lore: 'Test lore',
        tactics: 'Test tactics',
        history: 'Test history',
        manufacturer: 'Test'
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(false);
    });

    it('returns true when traditions is present', () => {
      const encyclopedia: Encyclopedia = {
        class: 'Test',
        lore: 'Test lore',
        tactics: 'Test tactics',
        history: 'Test history',
        manufacturer: 'Test',
        traditions: 'Test traditions'
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });

    it('returns true when keyBattles is present', () => {
      const encyclopedia: Encyclopedia = {
        class: 'Test',
        lore: 'Test lore',
        tactics: 'Test tactics',
        history: 'Test history',
        manufacturer: 'Test',
        keyBattles: [{ name: 'Test', year: '2024', description: 'Test', outcome: 'Test' }]
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });

    it('returns true when locations is present', () => {
      const encyclopedia: Encyclopedia = {
        class: 'Test',
        lore: 'Test lore',
        tactics: 'Test tactics',
        history: 'Test history',
        manufacturer: 'Test',
        locations: [{ name: 'Test', type: 'base', description: 'Test' }]
      };
      expect(hasLoreExpansion(encyclopedia)).toBe(true);
    });
  });

  describe('formatBattleYear', () => {
    it('returns year as-is', () => {
      expect(formatBattleYear('3410 год')).toBe('3410 год');
    });
  });

  describe('getLocationIcon', () => {
    it('returns correct icon for base', () => {
      expect(getLocationIcon('base')).toBe('🏠');
    });

    it('returns correct icon for academy', () => {
      expect(getLocationIcon('academy')).toBe('🎓');
    });

    it('returns correct icon for battlefield', () => {
      expect(getLocationIcon('battlefield')).toBe('⚔️');
    });

    it('returns correct icon for homeworld', () => {
      expect(getLocationIcon('homeworld')).toBe('🌍');
    });

    it('returns default icon for unknown type', () => {
      expect(getLocationIcon('unknown')).toBe('📍');
    });
  });
});
```

**Step 2: Run tests**

Run: `npm run test -- lore-utils.test.ts`
Expected: PASS all tests

**Step 3: Commit**

```bash
git add src/__tests__/lore-utils.test.ts
git commit -m "test(lore): add unit tests for lore utilities"
```

---

## Task 12: Final Validation and Documentation

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 2: Run type check**

Run: `npm run type-check`
Expected: PASS

**Step 3: Run E2E tests**

Run: `npm run test:e2e`
Expected: All E2E tests pass

**Step 4: Build production version**

Run: `npm run build`
Expected: PASS

**Step 5: Manual testing checklist**

- [ ] Open encyclopedia for each faction
- [ ] Verify lore sections display for all squads
- [ ] Check mobile responsiveness of new sections
- [ ] Verify icons render correctly
- [ ] Test with squads that have no new fields (backward compatibility)

**Step 6: Update CLAUDE.md**

Add to "Adding New Units via JSON" section:

```markdown
**Lore Expansion Fields (optional):**
- `traditions` - Cultural practices, rituals, traditions
- `keyBattles` - Array of notable battles
- `locations` - Array of significant places
```

**Step 7: Final commit**

```bash
git add docs/plans/2026-03-09-squad-lore-expansion*.md CLAUDE.md
git commit -m "docs: add lore expansion documentation and complete implementation"
```

---

## Success Criteria

- [ ] All 32 squads have enhanced lore with new fields
- [ ] Content is thematically consistent within each faction
- [ ] UI properly displays all new fields in both modal and encyclopedia pages
- [ ] No generic AI-sounding text — each squad feels unique
- [ ] All tests pass
- [ ] Type check passes
- [ ] Build succeeds
- [ ] Manual testing confirms functionality

**Total Estimated Time:** 4-6 hours for content creation + 1-2 hours for implementation
