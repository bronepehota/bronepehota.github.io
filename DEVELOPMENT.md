# Developer Documentation

## Требования

- Node.js 22.16.0+
- npm 10.0.0+

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/bronepehota/bronepehota.github.io.git
cd bronepehota.github.io
```

2. Установите зависимости:
```bash
npm install
```

## Запуск проекта

### Режим разработки

Запустите сервер разработки:

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

### Продуктивный режим

Соберите проект для продакшена:

```bash
npm run build
```

Запустите продуктивный сервер:

```bash
npm run start
```

## Доступные команды

```bash
npm run dev              # Запуск dev сервера (http://localhost:3000)
npm run build            # Продуктивная сборка
npm run start            # Запуск продуктивного сервера
npm run lint             # Запуск ESLint
npm run type-check       # TypeScript type check
npm run validate         # Запуск type-check + lint + unit tests
npm run test             # Запуск всех Jest тестов
npm run test:watch       # Запуск тестов в watch режиме
npm run test:ci          # Запуск тестов с покрытием (CI режим)
npm run test:e2e         # Запуск Cucumber E2E тестов (headless)
npm run test:e2e:headed  # Запуск E2E тестов с видимым браузером
npm run test:e2e:debug   # Запуск E2E тестов в замедленном режиме
```

## Структура проекта

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API маршруты
│   │   └── armlists/             # Фракции, отряды, машины
│   ├── page.tsx                  # Главная страница
│   └── layout.tsx                # Корневой layout
├── components/                   # React компоненты
│   ├── ArmyBuilder.tsx           # Построитель армии
│   ├── GameSession.tsx           # Игровая сессия
│   ├── UnitCard.tsx              # Карточка юнита
│   ├── UnitDetailsModal.tsx      # Модалка деталей юнита (bottom sheet)
│   ├── UnitSelector.tsx          # Селектор юнитов с фильтрами
│   ├── FactionSelector.tsx       # Выбор фракции
│   ├── RulesSelector.tsx         # Выбор версии правил
│   ├── RulesVersionSelector.tsx  # Дропдаун версии правил
│   ├── RulesInfoModal.tsx        # Модалка информации о правилах
│   ├── StepProgressIndicator.tsx # Индикатор прогресса шагов
│   ├── DiceRoller.tsx            # Анимация кубиков
│   ├── CombatAssistant.tsx       # Калькулятор боя
│   ├── PilotAssignmentModal.tsx  # Назначение пилотов
│   ├── PilotSurvivalTestModal.tsx# Тест на выживание пилота
│   ├── WeaponSelectorModal.tsx   # Выбор оружия
│   ├── FortificationSelector.tsx # Выбор укреплений
│   ├── PointBudgetInput.tsx      # Ввод лимита очков
│   └── SafeImage.tsx             # Image с обработкой ошибок
├── hooks/                        # Custom React hooks
│   └── useBottomSheet.ts         # Swipe-down жест для bottom sheet
├── lib/                          # Бизнес-логика
│   ├── types.ts                  # TypeScript типы
│   ├── game-logic.ts             # Игровая логика (кубики, урон, бой)
│   ├── unit-utils.ts             # Утилиты для юнитов
│   ├── rules-registry.ts         # Реестр версий правил
│   └── rules/                    # Реализации правил
│       ├── fan.ts                # Fan rules
│       └── tehno.ts              # Tehnolog rules
├── data/                         # JSON файлы с данными игры
│   ├── factions.json             # Определения фракций
│   ├── polaris/                  # Фракция Поларис
│   │   ├── squads.json           # Отряды пехоты
│   │   └── machines.json         # Техника
│   ├── protectorate/             # Фракция Протекторат
│   │   ├── squads.json
│   │   └── machines.json
│   └── mercenaries/              # Фракция Наёмники
│       ├── squads.json
│       └── machines.json
└── __tests__/                    # Jest unit тесты
```

## Архитектура

### Data Layer

**File-based JSON storage** в `src/data/`:

- Template data (Squad, Machine) — неизменяемые определения из JSON
- Runtime data (ArmyUnit) — экземпляры с текущим состоянием (durability, ammo, deadSoldiers, actionsUsed)

### State Management

**Client-side persistence** (localStorage):
- `bronepehota_army` — состояние армии игрока
- `bronepehota_rules_version` — выбранная версия правил

Главная страница (`src/app/page.tsx`) управляет состоянием `Army` и передаёт его дочерним компонентам.

### Core Types (`src/lib/types.ts`)

```typescript
FactionID = 'polaris' | 'protectorate' | 'mercenaries'

Soldier      // Параметры солдата (rank, speed, range, power, melee, props, armor)
Squad        // Набор из 1-6 солдат
Machine      // Машина с оружием, speed_sectors, durability, ammo
ArmyUnit     // Runtime экземпляр Squad или Machine с игровым состоянием
Army         // Армия игрока с юнитами, totalCost, faction
```

### Game Logic (`src/lib/game-logic.ts`)

Парсинг обозначения кубиков: `D6`, `D12+2`, `2D12`, `ББ` (рукопашная)

- `parseRoll(rollStr)` → `{ dice, sides, bonus }`
- `executeRoll(rollStr)` → `{ total, rolls[] }`
- `calculateHit(rangeStr, distanceSteps)` → проверка попадания
- `calculateDamage(powerStr, targetArmor)` → расчёт урона
- `calculateMelee(attackerMelee, defenderMelee)` → исход ближнего боя

### Rules System (`src/lib/`)

**Rules Registry** (`rules-registry.ts`):
- `getAllRulesVersions()` — список всех версий правил
- `getRulesByVersion(version)` — получение конкретной реализации

**Реализации правил** (`rules/`):
- `fan.ts` — Fan rules
- `tehnolog.ts` — Tehnolog rules

### Custom Hooks

**useBottomSheet** (`src/hooks/useBottomSheet.ts`):
- Swipe-down жест для мобильных bottom sheet модалок
- Настраиваемый порог закрытия (default: 100px)
- Плавная анимация возврата

## Технологии

**Core Stack**:
- TypeScript 5.x
- React 18
- Next.js 14.2.35 (App Router)
- Tailwind CSS
- Lucide React (icons)

**State & Storage**:
- localStorage для army state и rules version
- JSON файлы в `src/data/`

**Testing**:
- Jest с jsdom окружением (unit tests)
- Cucumber 10.9.0 + Playwright (E2E tests, BDD с Russian Gherkin)

**Utilities**:
- clsx, tailwind-merge для условных стилей

## Тестирование

### Unit Tests (Jest)

Фокус на игровой логике (`game-logic.ts`, `unit-utils.ts`)

Файлы тестов: `src/__tests__/`

Запуск:
```bash
npm run test
```

### E2E Tests (Cucumber + Playwright)

BDD-стиль с русским Gherkin синтаксисом

Файлы: `e2e/features/`
Step definitions: `e2e/step-definitions/`
Конфигурация: `e2e/cucumber.yaml`

**Требуется запущенное приложение** на `http://localhost:3000`

Запуск:
```bash
npm run test:e2e
```

### CI/CD Pipeline

- Unit tests запускаются на каждом коммите (быстро, ~30s)
- E2E tests запускаются только в CI после деплоя (медленно, ~2-5min)

См. `.github/workflows/test.yml` для конфигурации pipeline

## Mobile First Design

**Primary Target Device**: Mobile phones (320px+)

**Patterns**:
- Bottom sheets для мобильных модалок
- Центрированные карточки для desktop
- Скрытие labels на мобильных (`hidden md:inline`)
- Swipe-жесты для модалок (`useBottomSheet` hook)
- Touch-friendly targets (минимум 44x44px)

## Добавление функциональности

См. **[CONTRIBUTING.md](CONTRIBUTING.md)** для:
- Добавления новых юнитов
- Создания Pull Request
- Руководства по стилю кода
