# Дизайн: унифицированная аналитика — воронка, бои, PWA

**Дата:** 2026-08-18
**Статус:** одобрен пользователем (brainstorming)
**Ветка реализации:** `feat/analytics-funnel` (создать от `main`)

## Контекст и проблема

Три наблюдения пользователя:

1. **GA4 и Яндекс.Метрика расходятся** между собой.
2. **Не видно, сколько боёв проводят игроки** — событий в аналитике нет вообще.
3. **Воронка выглядит сломанной**: много визитов на лендинг, мало в энциклопедию, совсем мало в `/app`.

### Диагноз (по коду)

- `src/components/GoogleAnalytics.tsx` — `send_page_view: true` срабатывает только при полной загрузке страницы.
- `src/components/YandexMetrica.tsx` — стандартный init без SPA-режима; `ym(ID,'hit',…)` при клиентских переходах не вызывается.
- `src/lib/analytics.ts` — `trackPageView`/`trackEvent`/`trackScreenView` **не вызываются ни в одном месте** (мёртвый код).
- Вся навигация внутри сайта — клиентская (`<Link>`/`router.push`, напр. `CTAButton.tsx:71` → `/app`).
  **Вывод: переход лендинг → приложение невидим для обеих систем. «Мало визитов в /app» — артефакт измерения, а не сломанная воронка.** Реальную воронку мы пока не знаем — этот дизайн сделает её видимой.
- PWA: Serwist установлен, но `display-mode: standalone` нигде не учитывается — запуски с иконки неотличимы от браузерных заходов.
- Расхождение GA ↔ Метрика состоит из двух частей: (а) методическая — разные события/правила сессий — **устранима**; (б) блокировочная — разная аудитория блокировщиков (`googletagmanager.com` режется в РФ чаще, чем `mc.yandex.ru`) — **неустранима никак**, фиксируем как константу проекта.

## Цели / не-цели

**Цели:**
- Одна точка отправки → одинаковые события в GA4 и Метрике.
- SPA-просмотры страниц считаются при клиентских переходах.
- Счёт боёв: старт + ходы (+ событие «бой дошёл до 2-го хода»).
- Полная воронка визарда: rules → source → faction → budget → units → preparation → battle.
- PWA: метка `pwa` на каждом hit/event + событие установки.
- Офлайн-устойчивость: буфер в localStorage, отправка при появлении сети.
- Редактор покрыт: просмотры `/editor` + событие сохранения кастомного юнита.

**Не-цели (YAGNI):**
- Трекинг отдельных боевых действий (выстрел/мили/граната) — шум.
- События калькулятора и кликов по карточкам энциклопедии — покрываются SPA-просмотрами страниц.
- Server-side аналитика — сайт статический (GitHub Pages).
- Попытка «уравнять» блокировочную дельту GA ↔ Метрика.
- Локальная (персональная) статистика боёв игрока — только агрегатная аналитика.

## Решение

### 1. Трекер-фасад — `src/lib/analytics.ts` (расширить)

Один вызов уходит в обе системы:

```typescript
trackPageView(path)        // GA: gtag('config', id, {page_path}) · YM: ym(id, 'hit', path, {params})
trackEvent(name, params)   // GA: gtag('event', …) · YM: ym(id, 'reachGoal', name, params)
```

В каждый hit/event автоматически подмешивается `pwa: matchMedia('(display-mode: standalone)').matches`.

Ограничитель шума: не отправлять ничего, если не задан соответствующий id (`GA_MEASUREMENT_ID` / `YANDEX_METRICA_ID`).

### 2. Офлайн-буфер (в `analytics.ts`)

- Перед отправкой: `navigator.onLine === false` → событие/hit кладётся в очередь
  `localStorage['bronepehota_analytics_queue']` (новый ключ, добавить в `STORAGE_KEYS` в `src/lib/constants.ts`).
- Кап 200 записей, старые вытесняются.
- Флеш: на `window.load` и на событие `online`. Идемпотентность — очистка очереди до отправки (at-most-once; потеря при крэше между «извлёк» и «отправил» допустима, это аналитика).
- Буфер покрывает и pageview'ы: они идут через тот же фасад.

### 3. SPA-просмотры — новый `src/components/RouteTracker.tsx`

- `'use client'`; в корневом `layout.tsx` рядом с `GoogleAnalytics`/`YandexMetrica`.
- `usePathname()`; на mount и каждое изменение пути → `trackPageView(pathname)`.
- ref-защита от повтора того же пути (StrictMode / двойной render).

**Устранение двойного счёта в GA4:**
- В `GoogleAnalytics.tsx` конфиг меняется на `send_page_view: false` — единственный источник просмотров в GA становится `RouteTracker`.
- **Ручной шаг после релиза** (чек-лист ниже): выключить «Page views» в Enhanced Measurement GA4, иначе дубли.

### 4. Таксономия событий

Одни и те же имена в обеих системах; всё через `trackEvent`:

| Событие | Точка | Параметры |
|---|---|---|
| `wizard_step` | клики confirm-кнопок визарда — якоря по testid: `rules-confirm-button` (`RulesSelector.tsx:300`), `source-confirm-button`, `faction-continue-button`, `budget-next-button`, `to-battle-button` | `step: rules\|source\|faction\|budget\|units\|preparation`, `faction`, `rules` |
| `battle_start` | `ArmyBuilder.tsx:479` `onStartBattle` — фактический старт (после модалки инициативы, `currentStep: 'battle'`) | `faction`, `rules`, `units`, `cost` |
| `battle_turn` | `GameSession.tsx:313` `confirmStartNewTurn` | `turn`, `faction` |
| `battle_engaged` | там же, один раз при `turn === 2` | `faction` |
| `editor_unit_saved` | запись кастомного юнита в источник (место записи `STORAGE_KEYS.CUSTOM_SOURCES` — точную функцию фиксирует план имплементации) | `kind: squad\|machine`, `sourceId` |
| `pwa_install` | слушатель `appinstalled` в `RouteTracker` | — |

Счёт «реальных боёв» = `battle_engaged` (дошли до 2-го хода); все запуски = `battle_start`.

### 5. PWA

- `pwa: true/false` в params каждого hit/event (см. фасад).
- `pwa_install` на `appinstalled` (Chrome/Android). iOS событие не даёт — там установку видим косвенно (`pwa:true` + iOS-устройство в отчёте Метрики).
- Офлайн-запуск PWA: страница из кэша Serwist, события в буфер, отправка при появлении сети — работает «из коробки» через фасад.

### 6. Правка `src/app/sw.ts`

В catch-all `NetworkFirst`-матчер (`sw.ts:73-77`) добавить в `excludedHosts`: `mc.yandex.ru`, `www.googletagmanager.com` — аналитические маяки не должны проходить через SW-кэш.

### 7. Редактор

- Визиты: SPA-просмотры `/editor` (desktop-only маршрут, отделяется в отчётах по устройству).
- Активность: `editor_unit_saved`.

## Ручные шаги после релиза (не код)

1. **GA4**: Admin → Data streams → stream → Enhanced measurement → выключить «Page views» (остальные тумблеры оставить).
2. **GA4**: пометить `battle_start` и `battle_engaged` как Key events.
3. **Метрика**: создать цели «JavaScript-событие» на `battle_start` и `battle_engaged`.
4. Через 1–2 недели сверить числа (см. ниже).

## Как читать отчёты / сверка

- Сравнивать **события**, не сессии/визиты — правила сессий у платформ разные, это несравнимо by design.
- Ожидаемо `GA ≤ Метрика` для РФ-аудитории. Остаточная дельта после унификации — «коэффициент непопадания GA», константа, не баг.
- Воронка: Метрика «Отчёт по целям» / GA4 Funnel Exploration по `wizard_step` → `battle_start` → `battle_engaged`.
- PWA-доля: фильтр/сегмент по параметру `pwa`.

## Тестирование

- **Jest** `src/__tests__/lib/analytics.test.ts`: буфер (постановка/флеш/кап 200 с вытеснением/офлайн-режим), fan-out в стабы `gtag`/`ym`, `battle_engaged` ровно один раз, отсутствие отправки без id.
- **E2E** `e2e/analytics.spec.ts` (новый): `addInitScript` подменяет `gtag`/`ym` записывающими стабами; проверки: SPA-переход лендинг → `/app` даёт pageview; проход визарда до боя даёт `battle_start`; смена хода — `battle_turn` и (на 2-м ходу) `battle_engaged`. E2E — CI-only (см. CLAUDE.md).
- **CLAUDE.md**: добавить `bronepehota_analytics_queue` в список ключей; конвенция «трекинг только через `analytics.ts`»; чек-лист ручных шагов GA4/Метрики.

## Затрагиваемые файлы

| Файл | Изменение |
|---|---|
| `src/lib/analytics.ts` | фасад + ym + буфер (расширить) |
| `src/components/RouteTracker.tsx` | новый |
| `src/app/layout.tsx` | подключить `RouteTracker` |
| `src/components/GoogleAnalytics.tsx` | `send_page_view: false` |
| `src/app/sw.ts` | +2 хоста в `excludedHosts` |
| `src/lib/constants.ts` | +ключ `ANALYTICS_QUEUE` |
| `src/components/ArmyBuilder.tsx` | `battle_start` |
| `src/components/GameSession.tsx` | `battle_turn`, `battle_engaged` |
| Компоненты визарда (5 confirm-кнопок) | `wizard_step` |
| Редактор (сохранение кастомного юнита) | `editor_unit_saved` |
| `src/__tests__/lib/analytics.test.ts` | новый |
| `e2e/analytics.spec.ts` | новый |
| `CLAUDE.md` | ключ + конвенция + чек-лист |

## Ограничения

- Дельта блокировщиков GA ↔ Метрика остаётся (неустранимо).
- Установки PWA на iOS не ловятся событием — косвенно через `pwa:true`.
- At-most-once буфер: крэш в окне флеша может потерять до очереди целиком — приемлемо для аналитики.
- Webvisor Метрики видит только реально доехавшие сессии — офлайн-сессии в карту кликов не попадут (только в события после флеша).
