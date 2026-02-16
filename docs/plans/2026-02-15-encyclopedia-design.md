# Энциклопедия Бронепехоты - Design Document

**Дата:** 2026-02-15
**Автор:** Claude (brainstorming session)
**Статус:** Утверждено

## Обзор

Создание энциклопедии для существующих отрядов и техники игры Бронепехота. Отдельный раздел приложения с детальной информацией об each unit, включая лор, тактику и историю.

## Цели

1. **Справочник для игроков** — характеристики, тактика, игровые советы
2. **Лор/история мира** — истории создания, производители,_background
3. **SEO-оптимизация** — каждая страница имеет уникальные метаданные

## URL-структура

```
/encyclopedia              # Главная: фильтры + поиск + карточки
/encyclopedia/units        # Все отряды (пехота + техника)
/encyclopedia/squads       # Только пехота
/encyclopedia/machines     # Только техника
/encyclopedia/unit/[id]    # Детальная страница отряда
```

## Файловая структура

```
src/app/encyclopedia/
├── page.tsx                    # Главная: фильтры + поиск + карточки
├── units/
│   └── page.tsx               # Все отряды
├── squads/
│   └── page.tsx               # Только пехота
├── machines/
│   └── page.tsx               # Только техника
└── unit/
    └── [id]/
        └── page.tsx           # Детальная страница (динамический роут)

src/components/encyclopedia/
├── EncyclopediaLayout.tsx      # Лейаут с навигацией и фильтрами
├── UnitCard.tsx                # Карточка отряда в списке
├── UnitGrid.tsx                # Сетка карточек
├── FilterBar.tsx               # Панель фильтров
├── SearchInput.tsx             # Поиск по названию
├── FactionTabs.tsx             # Табы по фракциям
└── UnitDetail/
    ├── UnitDetailPage.tsx      # Детальная страница (wrapper)
    ├── UnitHeader.tsx          # Заголовок с названием и фракцией
    ├── UnitStats.tsx           # Блок характеристик
    ├── UnitLore.tsx            # Лор и история
    ├── UnitTactics.tsx         # Тактика
    ├── UnitWeapons.tsx         # Оружие (для техники)
    ├── UnitSoldiers.tsx        # Солдаты (для отрядов)
    └── SourceLink.tsx          # Ссылка на источник
```

## Структура данных

### Новое поле `encyclopedia` в JSON

** squads.json:**
```json
{
  "id": "polaris_lineynaya_klon_pehota",
  "name": "Линейная клон-пехота",
  "shortName": "Линейная клон-пехота",
  "faction": "polaris",
  "cost": 50,
  "encyclopedia": {
    "class": "Линейная пехота",
    "lore": "Основная сила Империи Полярис...",
    "tactics": "Держите дистанцию и используйте численное преимущество...",
    "history": "Созданы после Войны Воссоединения...",
    "manufacturer": "Имперский Департамент Клонирования",
    "sourceUrl": "https://vk.com/@age_of_robogear-pehota"
  },
  "soldiers": [...]
}
```

** machines.json:**
```json
{
  "id": "demolisher",
  "name": "Демолишер",
  // ... существующие поля ...
  "encyclopedia": {
    "class": "Штурмовая бронетехника",
    "lore": "Демолишер — первый массовый шагающий танк Империи...",
    "tactics": "Идеален для прорыва укреплений. В ближнем бою не имеет равных.",
    "history": "Разработан в 2147 году в ответ на появление..."
  }
}
```

### Типизация

```typescript
interface EncyclopediaData {
  class?: string;
  lore?: string;
  tactics?: string;
  history?: string;
  manufacturer?: string;
  sourceUrl?: string;
}

interface Squad {
  id: string;
  name: string;
  shortName: string;
  faction: FactionID;
  cost: number;
  encyclopedia?: EncyclopediaData;
  soldiers: Soldier[];
}

interface Machine {
  id: string;
  name: string;
  shortName: string;
  faction: FactionID;
  cost: number;
  rank: number;
  fire_rate: number;
  ammo_max: number;
  durability_max: number;
  image: string;
  class?: string;
  type?: string;
  developer?: string;
  monoblock?: string;
  mass?: string;
  crew?: string;
  description?: string;
  sourceUrl?: string;
  encyclopedia?: EncyclopediaData;
  speed_sectors: SpeedSector[];
  weapons: Weapon[];
}
```

## Архитектура

### Статическая генерация

Используем Next.js App Router с `generateStaticParams`:

```typescript
// src/app/encyclopedia/unit/[id]/page.tsx

export async function generateStaticParams() {
  const squads = await import('@/data/polaris/squads.json');
  const machines = await import('@/data/polaris/machines.json');
  // ... все фракции

  const allUnits = [
    ...squads.map(s => ({...s, type: 'squad'})),
    ...machines.map(m => ({...m, type: 'machine'}))
  ];

  return allUnits.map(unit => ({ id: unit.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const unit = getUnitById(params.id);

  return {
    title: `${unit.name} — Энциклопедия Бронепехота`,
    description: unit.encyclopedia?.lore || `Отряд ${unit.name}`,
  };
}
```

### Фильтрация на клиенте

- React state для фильтров
- Массив отрядов фильтруется и отображается
- Поиск по названию (инклюзивный)

## Фильтры

| Фильтр | Значения | Источник |
|--------|----------|----------|
| Фракция | Все/Полярис/Протекторат/Наёмники | `unit.faction` |
| Тип | Все/Пехота/Техника | `unit.type` (squad/machine) |
| Класс | Все/Линейная/Штурмовая/Спецназ/... | `unit.encyclopedia.class` |

## Обработка ошибок

### Несуществующий ID

```typescript
if (!unit) {
  notFound(); // Next.js notFound() страница
}
```

### Отсутствие поля `encyclopedia`

Условный рендеринг:

```tsx
{unit.encyclopedia?.lore && (
  <Section title="Лор">
    {unit.encyclopedia.lore}
  </Section>
)}
```

## MOBILE FIRST

- Фильтры в выпадающем меню на мобильном
- Сбоку на десктопе
- Bottom sheet для деталей на мобильном
- Минимальный размер тап-таргета: 44x44px

## Тестирование

### Unit-тесты

```typescript
// __tests__/encyclopedia/utils.test.ts
describe('getUnitById', () => {
  it('возвращает отряд по существующему ID', () => {});
  it('возвращает null для несуществующего ID', () => {});
});

describe('filterUnits', () => {
  it('фильтрует по фракции', () => {});
  it('фильтрует по типу (squad/machine)', () => {});
  it('фильтрует по классу из encyclopedia', () => {});
  it('выполняет поиск по названию', () => {});
});
```

### E2E тесты

```typescript
// e2e/encyclopedia.spec.ts
test.describe('Энциклопедия', () => {
  test('отображает список всех отрядов', async ({ page }) => {});
  test('фильтрация по фракции работает', async ({ page }) => {});
  test('детальная страница открывается', async ({ page }) => {});
  test('несуществующий ID возвращает 404', async ({ page }) => {});
});
```

## Источники контента

- **Машины**: VK статьи (существующие `sourceUrl` в machines.json)
- **Солдаты**: Форум Tehnolog и другие источники

## Следующие шаги

1. Обновить типы в `src/lib/types.ts`
2. Добавить поле `encyclopedia` в JSON для всех отрядов
3. Создать роуты в `src/app/encyclopedia/`
4. Создать компоненты в `src/components/encyclopedia/`
5. Добавить навигацию в main app
6. Написать тесты
