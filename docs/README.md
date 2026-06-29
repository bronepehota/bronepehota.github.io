# Документация Бронепехоты

Этот каталог — справочный материал для разработчиков и игроков (правила,
армлисты, промо-материалы, планы работ). В приложение попадает только то,
что лежит под `src/` и импортируется при сборке; `docs/` в продакшен-сборку
**не входит**.

## Структура

### `original/` — официальные правила (Tehnolog)
- `official_rules.txt` — текст официальных правил. Источник для версии правил
  `tehnolog` (см. `src/lib/rules/tehnolog.ts`).
- `Bronepekhota_Pravila_*.pdf`, `bp_all_armsheets.pdf`, `bp_all_techsheets.pdf` —
  оригиналы официальных правил и листов.

### `panov/` — фанатская редакция Star System (v0.3)
- `fan_rules.md` — правила в Markdown. Источник для версии правил
  `community_star_system` (`src/lib/rules/community_star_system.ts`),
  показывается игроку в `RulesInfoModal`. Машинная конвертация из PDF.
- `fan_rules_v0.3.pdf` — **каноничный авторитетный источник** правил
  (тестовая версия 0.3, 2025). При расхождениях верен PDF.
- `Kalkulyator_armlistov_pekhoty_Alfa_v-1_02.xlsx` — калькулятор армлистов пехоты.
- `Шаблоны АрмЛистов.jpg` — шаблоны армлистов.

### `promo/` — маркетинговые материалы
VK/Telegram-посты, скриншоты экранов приложения, обложки и логотипы.

### `superpowers/` — рабочие процессы
- `plans/` — планы реализации (superpowers writing-plans).
- `specs/` — дизайн-документы (superpowers brainstorming).

## Корневые документы
- `ADDING_ARMLISTS.md` — как добавлять новые армлисты в источники.
- `manual-qa-checklist.md` — чек-лист ручного QA перед релизом.

## Связь с кодом
Пути к текстам правил захардкожены как «источник» в:
- `src/lib/rules/tehnolog.ts` → `docs/original/official_rules.txt`
- `src/lib/rules/community_star_system.ts` → `docs/panov/fan_rules.md`
- `src/components/modals/RulesInfoModal.tsx` (отображается игроку в модалке правил)

При переименовании/перемещении этих файлов — обновить ссылки и тест
`src/__tests__/RulesInfoModal.test.tsx`.
