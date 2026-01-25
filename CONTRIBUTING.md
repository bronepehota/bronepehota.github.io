# Внесение вклада в проект

Благодарим за интерес к contribut'у в проект «Бронепехота»!

## О проекте

Данный проект создан с использованием **Vibe Coding** — подхода, при котором AI-ассистент (Claude Code) пишет код под руководством человека. Это учебный проект, созданный в целях:

- Изучения современных веб-технологий (Next.js 14, TypeScript, Tailwind CSS)
- Практики работы с AI-инструментами разработки
- Создания полезного приложения для сообщества варгейма «Бронепехота»
- **Приобщения молодого поколения к отечественным настольным варгеймам** — попытка упростить и ускорить игровой процесс за счёт мобильного приложения с автоматическими расчётами

Идея проста: убрать рутину (расчёт кубиков, учет боезапаса, потерь) и оставить удовольствие от тактики и стратегии — так современные игроки легче входят в хобби.

## Формат пожеланий по улучшениям

Поскольку проект использует AI-assisted разработку, **пожелания и баг-репорты должны быть в структурированном виде** — это позволит эффективно передать их AI для реализации.

### Шаблон для баг-репорта

```markdown
## Что сломалось
*Краткое описание проблемы*

### Шаги воспроизведения
1. Перейти в...
2. Нажать на...
3. Ожидаемый результат:...
4. Фактический результат:...

### Окружение
- Браузер:...
- Устройство:...
- Версия правил:...
```

### Шаблон для пожелания по функционалу

```markdown
## Желаемая функция
*Название функции*

### Описание
*Что должна делать функция*

### Текущее поведение
*Как это работает сейчас*

### Желаемое поведение
*Как должно работать*

### Пример использования
*Конкретный сценарий*
```

## Добавление новых юнитов

Для добавления новых отрядов или техники отредактируйте JSON файлы в директории `src/data/{фракция}/`.

### Структура директорий

```
src/data/
├── polaris/          # Поларис
│   ├── squads.json   # Отряды пехоты
│   └── machines.json # Техника
├── protectorate/     # Протекторат
│   ├── squads.json
│   └── machines.json
└── mercenaries/      # Наёмники
    ├── squads.json
    └── machines.json
```

### Добавление отряда пехоты

Откройте `src/data/{фракция}/squads.json` и добавьте новый объект:

```json
{
  "id": "polaris_new_squad",
  "name": "Новый отряд",
  "shortName": "Новый",
  "faction": "polaris",
  "cost": 75,
  "image": "/images/squads/polaris_new_squad.jpg",
  "soldiers": [
    {
      "rank": 7,
      "speed": 4,
      "range": "D6",
      "power": "1D6",
      "melee": 0,
      "props": ["Г"],
      "armor": 2
    }
  ]
}
```

### Добавление техники

Откройте `src/data/{фракция}/machines.json` и добавьте новый объект:

```json
{
  "id": "polaris_new_machine",
  "name": "Новая машина",
  "shortName": "Машина",
  "faction": "polaris",
  "cost": 120,
  "rank": 2,
  "fire_rate": 2,
  "ammo_max": 16,
  "durability_max": 12,
  "image": "/images/machines/polaris_new_machine.jpg",
  "speed_sectors": [
    {"min_durability": 7, "max_durability": 12, "speed": 4},
    {"min_durability": 1, "max_durability": 6, "speed": 3}
  ],
  "weapons": [
    {
      "name": "Основное оружие",
      "range": "D12",
      "power": "2D20"
    }
  ]
}
```

### Обязательные поля

| Поле | Описание | Пример |
|------|----------|--------|
| id | Уникальный ID | `polaris_light_assault` |
| name | Полное название | `"Лёгкая штурмовая пехота"` |
| shortName | Краткое название | `"Штурмовики"` |
| faction | Фракция | `"polaris"` |
| cost | Стоимость в очках | `70` |

### Обозначение бросков кубиков

- **Дальность**: `D6`, `D12`, `D20`, `D6+2`, `D12+3`
- **Сила**: `1D6`, `2D12`, `ББ` (рукопашная)
- **Свойства**: `["Г"]` - граната, `["БЫ"]` - медик, `[]` - без свойств

### Секторы скорости

Секторы должны покрывать весь диапазон от 1 до `durability_max` без пробелов.

### Добавление изображений

Разместите изображения в соответствующих директориях:
- `public/images/squads/` — для отрядов
- `public/images/machines/` — для техники

## Создание Pull Request

### Подготовка окружения

1. Forkните репозиторий на GitHub
2. Клонируйте ваш fork:
```bash
git clone https://github.com/ВАШ_ЮЗЕРНЕЙМ/bronepehota-2.git
cd bronepehota-2
```

3. Добавьте upstream remote:
```bash
git remote add upstream https://github.com/Luxor/bronepehota-2.git
```

4. Установите зависимости:
```bash
npm install
```

### Создание ветки

Создайте ветку для вашего изменения:
```bash
git checkout -b feature/add-тип-юнита-название
```

Примеры имён веток:
- `feature/add-polaris-heavy-squad`
- `feature/add-protectorate-tank`
- `fix/update-machine-stats`

### Внесение изменений

1. Отредактируйте соответствующий JSON файл
2. Добавьте изображения в `public/images/`
3. Проверьте валидность JSON:
```bash
npm run type-check
```

4. Запустите dev сервер для проверки:
```bash
npm run dev
```

5. Откройте http://localhost:3000 и убедитесь, что:
   - Новый юнит отображается в списке
   - Все поля корректны
   - Изображение загружается

### Тестирование

Запустите тесты перед отправкой:
```bash
npm run validate
```

### Коммит изменений

Сделайте коммит с описательным сообщением:
```bash
git add .
git commit -m "Add: Поларис тяжёлый штурмовой отряд

- Добавлен новый отряд в squads.json
- Добавлено изображение
- Стоимость: 95 очков"
```

### Пуш и создание Pull Request

1. Запушьте ветку в ваш fork:
```bash
git push origin feature/add-тип-юнита-название
```

2. Откройте GitHub и создайте Pull Request

3. Заполните шаблон PR:

**Заголовок**: `Add: {тип} {название}`

Пример: `Add: Поларис тяжёлый штурмовой отряд`

**Описание**:
```markdown
## Что добавлено
- Новый отряд/машина: {название}
- Фракция: {фракция}
- Стоимость: {очков}

## Изменённые файлы
- `src/data/{фракция}/squads.json` (или machines.json)
- `public/images/squads/` (или machines/)

## Скриншоты
![Скриншот нового юнита](ссылка-на-скриншот)

## Проверка
- [ ] Юнит отображается в списке
- [ ] Все поля корректны
- [ ] Изображение загружается
- [ ] `npm run validate` проходит
```

### После создания PR

1. Дождитесь прохождения CI проверок
2. Внесите правки по запросу ревьювера
3. После одобрения PR будет влит в основную ветку

## Добавление новой фракции

Для добавления новой фракции:

1. Обновите тип `FactionID` в `src/lib/types.ts`:
```typescript
export type FactionID = 'polaris' | 'protectorate' | 'mercenaries' | 'ваша_фракция';
```

2. Добавьте запись в `src/data/factions.json`:
```json
{
  "id": "ваша_фракция",
  "name": "Название фракции",
  "color": "#hexcolor"
}
```

3. Создайте директорию `src/data/ваша_фракция/`
4. Добавьте `squads.json` и `machines.json`
5. Обновите импорты в `src/components/ArmyBuilder.tsx`

## Добавление новых правил

В приложении уже реализованы две версии правил:
- **Tehnolog** — официальные правила от Технолог (по умолчанию)
- **Fan** — фанатские правила от Панова с расширенными механиками

### Структура системы правил

Правила находятся в `src/lib/rules/`:
```
src/lib/rules/
├── tehnolog.ts      # Официальные правила
└── fan.ts           # Фанатские правила
```

Реестр правил: `src/lib/rules-registry.ts`

### Добавление новой версии правил

#### 1. Создайте файл правил

Создайте новый файл в `src/lib/rules/{version}.ts`:

```typescript
import { RulesVersion, HitResult, DamageResult, MeleeResult, WeaponSpecial, FortificationType, FORTIFICATION_MODIFIERS } from '../types';
import { rollDie, parseRoll, executeRoll } from '../game-logic';

export const myVersionRules: RulesVersion = {
  id: 'my-version',
  name: 'Моя Версия',
  source: 'docs/my-version/rules.txt',
  description: 'Краткое описание правил (2-3 предложения)',
  features: [
    'Особенность 1',
    'Особенность 2',
    'Особенность 3'
  ],
  color: '#8b5cf6',
  supportsSpecialEffects: false,

  calculateHit: (rangeStr: string, distanceSteps: number, fortification?: FortificationType): HitResult => {
    // Логика расчёта попадания
    const { total, rolls } = executeRoll(rangeStr);
    return {
      success: total >= distanceSteps,
      roll: rolls[0] || 0,
      total
    };
  },

  calculateDamage: (
    powerStr: string,
    targetArmor: number,
    fortification: FortificationType = 'none',
    special?: WeaponSpecial,
    isVehicle?: boolean,
    currentDurability?: number,
    durabilityMax?: number
  ): DamageResult => {
    // Логика расчёта урона
    const { dice, sides, bonus } = parseRoll(powerStr);
    let damage = 0;
    const rolls = [];

    for (let i = 0; i < dice; i++) {
      const r = rollDie(sides) + bonus;
      rolls.push(r);
      if (r > targetArmor) {
        damage += 1;
      }
    }

    return { damage, rolls };
  },

  calculateMelee: (attackerMelee: number, defenderMelee: number): MeleeResult => {
    // Логика расчёта ближнего боя
    const aRoll = rollDie(6);
    const dRoll = rollDie(6);
    const aTotal = aRoll + attackerMelee;
    const dTotal = dRoll + defenderMelee;

    let winner: 'attacker' | 'defender' | 'draw' = 'draw';
    if (aTotal > dTotal) winner = 'attacker';
    else if (dTotal > aTotal) winner = 'defender';

    return {
      attackerRoll: aRoll,
      attackerTotal: aTotal,
      defenderRoll: dRoll,
      defenderTotal: dTotal,
      winner
    };
  }
};
```

#### 2. Обновите тип RulesVersionID

В `src/lib/types.ts` добавьте новый ID:

```typescript
export type RulesVersionID = 'tehnolog' | 'fan' | 'my-version';
```

#### 3. Зарегистрируйте правила

В `src/lib/rules-registry.ts` добавьте импорт и регистрацию:

```typescript
import { myVersionRules } from './rules/my-version';

export const rulesRegistry: Record<RulesVersionID, RulesVersion> = {
  tehnolog: tehnologRules,
  fan: fanRules,
  'my-version': myVersionRules,
};
```

#### 4. Проверьте

```bash
npm run type-check
npm run test
npm run dev
```

Откройте http://localhost:3000 и проверьте:
- Новая версия правил доступна в селекторе
- Расчёты работают корректно
- Описание и особенности отображаются

### Ключевые моменты

- **calculateHit**: Определяет, попал ли выстрел. Возвращает `{ success, roll, total }`
- **calculateDamage**: Рассчитывает урон. Возвращает `{ damage, rolls, special? }`
- **calculateMelee**: Рассчитывает исход рукопашной. Возвращает `{ attackerRoll, attackerTotal, defenderRoll, defenderTotal, winner }`
- **supportsSpecialEffects**: Поддерживает ли версия спецэффекты (Взрыв, Ремонт, Burst)
- **fortification**: Укрепления. Используйте `FORTIFICATION_MODIFIERS` для модификаторов

### Различия между существующими правилами

| Характеристика | Tehnolog | Fan |
|----------------|----------|-----|
| Расчёт урона | Виртуальная стрельба | Зонные повреждения |
| Укрепления | Добавляют броне | Увеличивают дистанцию |
| Спецэффекты | Не поддерживаются | Взрыв, Ремонт, Burst |
| Техника | Стандартный расчёт | Зелёный/жёлтый/красный сектор |

## Вопросы?

Если у вас есть вопросы, создайте issue с меткой `question`.
