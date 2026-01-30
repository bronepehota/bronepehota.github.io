# E2E Тесты Бронепехота

Интеграционные тесты с использованием Cucumber + Playwright.

## Структура

```
e2e/
├── features/              # Feature файлы со сценариями
│   ├── army-building.feature
│   ├── game-session.feature
│   ├── armlist-editor.feature
│   └── rules-selection.feature
├── step-definitions/      # Шаги тестов
│   ├── common.steps.ts
│   ├── army-building.steps.ts
│   ├── game-session.steps.ts
│   ├── armlist-editor.steps.ts
│   └── rules-selection.steps.ts
├── support/              # Вспомогательные файлы
│   ├── world.ts         # Кастомный World с методами приложения
│   └── hooks.ts         # Before/After hooks для браузера
├── screenshots/          # Скриншоты при ошибках
├── reports/             # HTML и JSON отчёты
├── cucumber.yaml        # Конфигурация Cucumber
└── tsconfig.json        # TypeScript конфигурация
```

## Основные сценарии

### 1. Создание армии (army-building.feature)
- Выбор фракции и ввод балла очков
- Добавление отрядов и машин в армию
- Валидация лимита очков
- Удаление юнитов из армии
- Фильтрация юнитов
- Экспорт/импорт армии
- Переход в режим боя

### 2. Игровая сессия (game-session.feature)
- Отображение юнитов во вкладке "Войска"
- Выбор атакующего юнита и цели
- Дистанционная атака
- Атака ближнего боя
- Отслеживание действий юнитов
- Потеря солдат и снижение прочности машин
- Использование гранат
- Сброс действий между ходами
- Завершение боя

### 3. Редактор армейских списков (armlist-editor.feature)
- Создание новых отрядов
- Создание новых машин
- Редактирование существующих юнитов
- Удаление юнитов
- Загрузка изображений (файл, буфер обмена, drag-drop)
- Валидация секторов скорости
- Специальные эффекты оружия
- Генерация ID юнитов

### 4. Выбор правил игры (rules-selection.feature)
- Выбор версии правил (Технолог/Панова)
- Просмотр информации о правилах
- Сравнение версий правил
- Сохранение версии между сессиями
- Расчёт попадания по разным правилам
- Расчёт урона машине (зоны прочности)
- Специальные эффекты оружия

## Установка зависимостей

```bash
npm install
npx playwright install
```

## Запуск тестов

Перед запуском убедитесь, что приложение запущено на `http://localhost:3001`:

```bash
# Терминал 1: Запуск dev-сервера на порту 3001
PORT=3001 npm run dev

# Терминал 2: Запуск E2E тестов
npm run test:e2e
```

> **Примечание**: E2E тесты настроены на порт 3001, чтобы не конфликтовать с основным dev-сервером на порту 3000.

### Варианты запуска

```bash
# Обычный запуск (headless)
npm run test:e2e

# С визуализацией браузера
npm run test:e2e:headed

# С замедлением для отладки
npm run test:e2e:debug

# Запуск конкретного feature
npx cucumber-js e2e/features/army-building.feature

# Запуск сценариев по тегам
npx cucumber-js --tags "@smoke"
```

## Отчёты

После запуска тесты генерируют отчёты в директории `e2e/reports/`:

- `cucumber-report.html` - HTML отчёт для просмотра в браузере
- `cucumber-report.json` - JSON отчёт для CI/CD интеграции
- `junit-report.xml` - JUnit формат для CI/CD

Скриншоты при ошибках сохраняются в `e2e/screenshots/`.

## Написание новых тестов

1. **Feature файл**: Создайте `.feature` файл в `e2e/features/`

```gherkin
# language: ru
Функция: Название функции
  Как роль пользователя
  Я хочу выполнить действие
  Чтобы достичь цели

  Сценарий: Название сценария
    Допустим предусловие
    Когда я выполняю действие
    То результат должен быть виден
```

2. **Step definitions**: Создайте файл в `e2e/step-definitions/`

```typescript
import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

When('я выполняю действие', async function(this: BronepehotaWorld) {
  // Ваш код
});

Then('результат должен быть виден', async function(this: BronepehotaWorld) {
  const element = this.page.getByText('результат');
  await expect(element).toBeVisible();
});
```

3. **Используйте World**:

```typescript
// Навигация
await this.gotoHome();

// localStorage
await this.clearLocalStorage();
const data = await this.getFromLocalStorage('key');
await this.setInLocalStorage('key', value);

// Playwright page
await this.page.goto('...');
await this.page.click('...');
```

## MOBILE FIRST

Все тесты используют мобильные viewport размеры (375x812) по умолчанию, в соответствии с философией проекта.

## Теги

Вы можете использовать теги для группировки сценариев:

```gherkin
@smoke
Сценарий: Базовый сценарий

@wip
Сценарий: Сценарий в разработке
```

## CI/CD Интеграция

```yaml
# .github/workflows/e2e.yml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run dev server
  run: npm run build && npm start &

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload reports
  uses: actions/upload-artifact@v3
  with:
    name: cucumber-reports
    path: e2e/reports/
```
