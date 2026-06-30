# Документация Бронепехоты

Справочный материал для разработчиков и игроков (правила, армлисты, планы работ).
В приложение попадает только то, что под `src/` и импортируется при сборке;
`docs/` в продакшен-сборку **не входит**.

## Структура

### `tehnolog/` — официальные правила (Tehnolog)
- `official_rules.md` — официальные правила в Markdown. Источник для версии правил
  `tehnolog` (`src/lib/rules/tehnolog.ts`), показывается игроку в `RulesInfoModal`.
  Машинная конвертация из PDF.
- `Bronepekhota_Pravila_05_08_08.pdf` — **каноничный авторитетный источник**.

### `star_system/` — фанатская редакция Star System (v0.3)
- `fan_rules.md` — правила в Markdown. Источник для версии правил
  `community_star_system` (`src/lib/rules/community_star_system.ts`). Машинная конвертация из PDF.
- `fan_rules_v0.3.pdf` — **каноничный авторитетный источник** (тестовая версия 0.3, 2025).

> Имена директорий соответствуют редакциям правил (`tehnolog`, `star_system`).
> Файлы `.md` — редактируемый текст; PDF — замороженный авторитетный источник
> (при расхождениях верен PDF).

### `promo/` — маркетинговые материалы (VK/Telegram-посты, скриншоты, обложки). **Gitignored** (не отслеживается).
### `superpowers/` — рабочие процессы: `plans/` (планы реализации) и `specs/` (дизайн-документы).

## Прочие документы в docs/
- `ADDING_ARMLISTS.md` — как добавлять новые армлисты в источники.

## Связь с кодом
Пути к текстам правил захардкожены как «источник» в:
- `src/lib/rules/tehnolog.ts` → `docs/tehnolog/official_rules.md`
- `src/lib/rules/community_star_system.ts` → `docs/star_system/fan_rules.md`
- `src/components/modals/RulesInfoModal.tsx` (отображается игроку в модалке правил)

При переименовании/перемещении этих файлов — обновить ссылки и тест
`src/__tests__/RulesInfoModal.test.tsx`.
