# Developer Documentation

## Требования

- Node.js 18+
- npm или yarn

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd bronepehota-tech
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
npm run dev          # Запуск dev сервера (http://localhost:3000)
npm run build        # Продуктивная сборка
npm run start        # Запуск продуктивного сервера
npm run lint         # Запуск ESLint
npm run test         # Запуск всех Jest тестов
npm run test:watch   # Запуск тестов в watch режиме
```

## Структура проекта

```
src/
├── app/
│   ├── api/armlists/    # API маршруты для фракций, отрядов, машин
│   ├── page.tsx         # Главная страница
│   └── layout.tsx       # Корневой layout
├── components/          # React компоненты
├── lib/
│   ├── types.ts         # TypeScript типы
│   └── game-logic.ts    # Игровая логика
└── data/                # JSON файлы с данными игры
    ├── factions.json
    ├── squads.json
    └── machines.json
```

## Технологии

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Jest (тестирование)
