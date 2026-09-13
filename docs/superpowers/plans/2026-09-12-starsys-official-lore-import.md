# Импорт официальной библиотеки «СтарСис» (25 PDF) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Залить в энциклопедию 4 потока из официальной PDF-библиотеки «Варгеймы „СтарСис"» (vk.ru/docs-32426380, залита 2021-09, у нас не обрабатывалась): Летопись Звёздного Бытия, легенда SkyTech «Пиратские войны Окраин», события/миссии (Захват Реганы, Битва на Песке, 4 миссии ИС Robogear), каталог «Бронетехника галактических войск».

**Architecture:** Контент-импорт по отработанному конвейеру (прецеденты: waves 4e–4k, PR #230/#231): verbatim-архив в `docs/lore-sources/starsys-official/` → адаптация (НЕ копипаста) в `src/content/**` + `src/data/missions/` → каталог источников №28+ → тесты-счётчики → реестр `docs/ENCYCLOPEDIA_LORE_SOURCES.md`. Новых типов сущностей НЕ создаём (правило спеки 2026-08-18): только существующие world/campaigns/missions/машины.

**Tech Stack:** pdftotext/pdftoppm + `tools/check_copy_paste.py` (норма ≤11 слов подряд) + zai-vision MCP для скан-OCR; Jest-тесты контент-лоадеров.

**Spec:** `docs/superpowers/specs/2026-08-18-encyclopedia-lore-expansion-design.md` (правила адаптации/атрибуции/границ) + шпаргалка «Как добавить следующий источник» в `docs/ENCYCLOPEDIA_LORE_SOURCES.md` (конец файла).

## Global Constraints

- **Анти-копипаста**: пересказ своими словами, ≤11 совпадающих слов подряд (`npm run check:copy-paste`, порог 12). Новый источник = новый claus в npm-скрипте.
- **Атрибуция**: всё из библиотеки = официальный «Технолог» → `loreAuthor: tehnolog`, `origin` не трогаем (дефолт tehnolog у машин). Новых записей в `NON_TEHNOLOG_WORKS` НЕ добавлять.
- **UI-текст русский, код/айди английские**; id слаги ASCII.
- **Тесты**: `npx jest --testPathIgnorePatterns='/node_modules/' '/.next/' '/e2e/'` (ворктри-гочча: config-паттерн `/.claude/` выкашивает всё), `npm run type-check`. E2E — CI-only, локально не гонять.
- **Ворктри**: `.claude/worktrees/feat+starsys-official-lore`, ветка `worktree-feat+starsys-official-lore`. Коммитить волнами; стейджить конкретные пути (не `git add -A`).
- **Исходники** лежат в `/tmp/starsys_docs/` (текстовые выжимки уже сняты: Летопись.txt 66К чистые, Песок.txt 7К чистые, 3 миссии .txt чистые, Каталог_бронетехники.txt 260К mojibake-латиница, Регана.pdf 13 стр. сканы, Piratskie_voyny_okrain.pdf 18 стр. сканы, Звёздная_пыль.txt битая кодировка шрифта).
- **PDF в репо не коммитим** — только текстовые конверты с frontmatter-заголовком (конвенция docs/lore-sources/).

---

### Task 1: Verbatim-архив источника

**Files:**
- Create: `docs/lore-sources/starsys-official/README.md` (карта раздела: 25 PDF, какие взяты/пропущены и почему)
- Create: `docs/lore-sources/starsys-official/letopis-zvezdnogo-bytiya.md`, `bitva-na-peske.md`, `missiya-zahvat-flaga.md`, `missiya-zapretnaya-zona.md`, `missiya-stremitelnaya-ataka.md`, `katalog-bronetehniki.md`
- Modify: `docs/lore-sources/README.md` (строка в «Карте архива» + буллет в «Статусе обработки»)

**Interfaces:** Produces: верbatim-тексты, на которые ссылаются Tasks 4–9 (`check:copy-paste` glob `docs/lore-sources/starsys-official/*.md`).

- [ ] **Step 1:** Конверт каждого текста: копия из `/tmp/starsys_docs/*.txt`, сверху frontmatter-заголовок по конвенции каталога (`источник`, `url: https://vk.ru/docs-32426380` (+ конкретный doc-id), `дата публикации: 2021-09-04`, `автор: ООО «Технолог»`, `название`, `архивировано: 2026-09-12`, `примечание`). Пример заголовка взять из `docs/lore-sources/dead-fleet-articles/akasi.md`.
- [ ] **Step 2:** Каталог починить: `/tmp/starsys_docs/Каталог_бронетехники.txt` → `t.encode('latin-1', errors='replace').decode('cp1251')` (в тексте есть U+2013, ломающий прямой round-trip). Проверить читаемость первых абзацев («В ходе наземных операций последней галактической войны…»).
- [ ] **Step 3:** README обоих уровней; в карте архива — строка `starsys-official/ | Официальная PDF-библиотека «Варгеймы „СтарСис"» (vk.ru/docs-32426380) | 2021 | tehnolog`.
- [ ] **Step 4:** `git add docs/lore-sources/ && git commit -m "docs(lore): архив официальной библиотеки СтарСис — верbatim-конверты"`

### Task 2: OCR «Захват Реганы» (13 стр. сканов)

**Files:**
- Create: `docs/lore-sources/starsys-official/zahvat-regany.md` (verbatim-сборка)

**Interfaces:** Produces: текст сценария для Task 7 (миссия `regana`): цели, силы сторон, спецправила, предыстория.

- [ ] **Step 1:** `pdftoppm -png -r 200 /tmp/starsys_docs/Регана.pdf /tmp/starsys_docs/pages/regana_full` (13 страниц; ⚠ 60–110 dpi визиону мало — проверено, нужно ≥150 dpi / ~1500px ширины).
- [ ] **Step 2:** Каждая страница через `mcp__zai-mcp-server__analyze_image` (промпт: «Извлеки ВЕСЬ русский текст со страницы скана правил настольной игры, сохраняя структуру: заголовки/абзацы/таблицы. Есть ли схема расстановки?»). Стр. 1 — обложка (пропустить арты). Склеить текст по порядку.
- [ ] **Step 3:** Собранный текст + frontmatter-заголовок → verbatim-файл. Зафиксировать в конце файла: состав сил, victory conditions, есть ли карта (для Task 7 — diagramImage).
- [ ] **Step 4:** Коммит вместе с Task 1 или отдельным `docs(lore): OCR «Захват Реганы»`.

### Task 3: OCR SkyTech «Пиратские войны Окраин» (18 стр. сканов)

**Files:**
- Create: `docs/lore-sources/starsys-official/skytech-piratskie-voyny-okrain.md`

**Interfaces:** Produces: контент-карта легенды для Task 8: список сущностей/событий/эры, что мапится на существующий канон (Периферия/Пыльная Зона/пираты), что специфично для SkyTech-линейки.

- [ ] **Step 1:** `pdftoppm -png -r 200 /tmp/starsys_docs/Piratskie_voyny_okrain.pdf /tmp/starsys_docs/pages/skytech_full` (18 стр., 200 dpi). ⚠ По пробе стр. 4: легенда может оказаться ДРУГИМ сеттингом линейки SkyTech (воздушный флот, альтернативно-историческая Россия: «подьячий», «Смольный», «самоходы»), не космосом СтарСиса — если подтвердится по полному OCR, контент НЕ втискивать в world Доминиона: только верbatim-архив + запись каталога с пометкой «параллельная линейка», решение о месте — за владельцем.
- [ ] **Step 2:** Постраничный vision-OCR (тот же промпт; чисто арт-страницы — пометить `[иллюстрация]`). Сканы тёмные — если визион галлюцинирует, перезапросить конкретную страницу с уточнением «только реальный текст».
- [ ] **Step 3:** Verbatim-файл + в конце раздел «Карта содержимого»: события, персонажи, планеты, техника, годы. Коммит.

### Task 4: Каталог источников №28

**Files:**
- Modify: `src/data/sources-catalog.json` (запись №28)
- Modify: `src/__tests__/lib/sources-catalog.test.ts` (27→28; секции [7,4,9,7]→[8,4,9,7]; при желании — новый title в key-title presence list)

**Interfaces:** Produces: id `letopis-zvezdnogo-bytiya` (или решение «это то же, что №1» — см. Step 1), на который ссылаются frontmatter `sources:` новых досье (Task 5) и `takenTo` записи.

- [ ] **Step 1 (проверка дубля — ЗАКРЫТА Task 1):** Дубль ПОДТВЕРЖДЁН побайтово: «Летопись Звёздного Бытия» (©Технолог 2002, 18 стр., VK-версия ~31K знаков) — то же произведение, что `star-heroes/Летопись-Звёздные-герои.md` (2005, 65 стр., ~138K знаков — издание полнее). Запись №28 НЕ создавать. Дополнить №1 `letopis-zvezdnye-geroi`: `"url": "https://vk.ru/doc-32426380_612802719"`, в description — найденное первоиздание 2002 г. в официальной библиотеке, takenTo — новые досье из Task 5. Счётчики тестов НЕ меняются (27).
- [ ] **Step 2:** Запись (если №28): `{ "id": "letopis-zvezdnogo-bytiya", "section": "official", "title": "Летопись Звёздного Бытия", "author": "ООО «Технолог»", "year": 2002, "kind": "chronicle", "era": "2398–4530", "loreAuthor": "tehnolog", "description": "Официальная краткая легенда вселенной «СтарСис»… (2–4 предложения: от Тунгусского артефакта до Бдительного Мира; первоисточник глав «Истории»)", "takenTo": ["Досье: Космические Рыцари, Облако, Звёздная Шпага, Джамирия, Звёздный тюльпан, Советники, Имперский Легион", "Сверка глав «Истории» (первоисточник)"], "url": "https://vk.ru/doc-32426380_612802719" }` (doc-id сверить по /home/atuzov/.claude/jobs/d2bdf298/tmp/starsys/doc_urls.txt — надёжный маппинг id↔title↔url).
- [ ] **Step 3:** Тест: обновить `toHaveLength(27)`→28 и массив счётчиков секций (+комментарий). Прогнать `npx jest sources-catalog --testPathIgnorePatterns='/node_modules/'` → PASS.
- [ ] **Step 4:** Коммит `feat(catalog): источник №28 — Летопись Звёздного Бытия (офиц. библиотека СтарСис)`.

### Task 5: Досье world из Летописи (7 новых)

**Files:**
- Create: `src/content/world/kosmicheskie-rytsari.md`, `oblako.md`, `zvezdnaya-shpaga.md`, `dzhamiriya.md`, `zvezdnyy-tyulpan.md`, `sovetniki.md`, `imperskiy-legion.md`
- Modify: `src/__tests__/lib/world.test.ts` (72→79: slug-список, order-массив, корабли 19→20)
- Modify: `package.json` (npm script `check:copy-paste` += пара `world`↔`docs/lore-sources/starsys-official`)

**Interfaces:** Consumes: Task 4 id источника для `sources:`. Produces: слаги для `related:` связей (все 7 валидны после теста).

- [ ] **Step 1:** Каждое досье по конвенции `WorldEntryMeta` (`src/lib/world.ts:49-64`): `slug/title/kind/subtitle?/era/faction?/order?/related/sources`. Виды: рыцари/облако/шпага/советники/легион = `term`; Джамирия = `location`; тюльпан = `ship`. `era`: Советники+Облако+Шпага+Джамирия `"4478–4530"`, Рыцари/Легион/тюльпан — по тексту (тюльпан без era либо до-Летописная, см. тест: кораблям ЗАПРЕЩЕНЫ related.chapters/campaigns, только factions!). Тело = адаптация ≤11 слов подряд, 2–4 абзаца, у Рыцарей — связь с существующими упоминаниями (velian, era-sverhchelovechestva) через `related: {chapters: [], }`… (рыцарям можно chapters: [konversiya…]? нет — только реальные слаги; безопасно оставить related по сущностям-юнитам/фракциям).
- [ ] **Step 2:** `sources:` каждой записи: `["Летопись Звёздного Бытия (© ООО «Технолог», 2002) — vk.ru/docs-32426380"]` (+ для Рыцарей доп. строка про упоминания в velian/era-sverhchelovechestva).
- [ ] **Step 3:** Тест world.test.ts: добавить 7 слагов в точный slug-лист и order-массив (в конец, номера 74–80; текущий максимум 73), корабли `toHaveLength(19)`→20. `related`-поля — только существующие слаги. Прогон: PASS.
- [ ] **Step 4:** `npm run check:copy-paste` — добавить claus `world↔starsys-official` ДО прогона; MAX RUN < 12. Если ≥12 — перефразировать.
- [ ] **Step 5:** Коммит `feat(world): 7 досье из Летописи Звёздного Бытия — Рыцари, Облако, Шпага, Джамирия, Тюльпан, Советники, Легион`.

### Task 6: Миссии — 2 новых набора (события СтарСис + Robogear)

**Files:**
- Modify: `src/data/missions/campaigns.json` (+2: `starsys_events`, `robogear`)
- Modify: `src/data/missions/missions.json` (+6: `osada_pesok`, `regana`, `zvezdnaya_pyl`, `zapretnaya_zona`, `zahvat_flaga`, `stremitelnaya_ataka`)
- Create: `public/images/missions/<id>/diagram.png` — где у PDF есть карта (вырезать pdfimages/pdftoppm-кропом; если карта не отделяется чисто — поле `diagramImage` не ставить)
- Modify: `src/__tests__/lib/missions-registry.test.ts` (+describe-блоки на новый набор)
- Modify: `e2e/missions.spec.ts` (+2 теста: группы на списке, деталька одной миссии) и `CLAUDE.md` (таблица e2e: Missions 14→16)

**Interfaces:** Consumes: Task 2 (Регана-текст). Produces: миссии с `campaign`/`order` (продолжить глобальную нумерацию после текущего максимума — сверить в missions.json), участники с `unitId` голыми слагами (`locust`, `raptor`, `trex`, `salamander`, `spider`, `helix` — все существуют в машинах).

- [ ] **Step 1:** campaigns.json: `{ "id": "starsys_events", "name": "События ИС «СтарСис»", "intro": "Официальные сценарии-события издательства…" }`, `{ "id": "robogear", "name": "Миссии ИС Robogear", "intro": "Сценарии первой редакции Robogear (2004–2006)…" }`.
- [ ] **Step 2:** Каждая миссия по схеме `Mission` (`src/lib/mission-types.ts`): id/name/order/campaign/factions `[polaris, protectorate]`/briefing{setting,order,report} (из предыстории PDF, пересказ)/setup/parameters/objectives (асимметричные по фракциям)/specialRules/participants (из «состав сил»: `{name:"Локуст", type:"machine", count:1, unitId:"locust"}`; пехота — `{name:"Стрелок", type:"squad", count:2}` без unitId, если взвод собирательный)/sourceUrl (vk.ru/doc ссылка)/provenance не ставить (дефолт tehnolog). Тексты из верbatim-конвертов Tasks 1–2, НЕ копипаста больших блоков (короткие игровые формулировки целей допустимы — это правила, не художка; проверить self-check).
- [ ] **Step 3:** Звёздная пыль: текст битый — восстановить через vision-OCR страницы (как Task 2) ИЛИ взять из текста только составы (латиница читается: SPIDER, HELIX, LOCUST).
- [ ] **Step 4:** Юнит-тесты: describe «starsys_events/robogear campaigns» — существование групп, сортировка, у каждой миссии objectives для обеих фракций, у 4 robogear-миссий participants содержат машины с валидными unitId (сверить через getAllMachines… если такого хелпера нет — захардкодить список существующих слагов машин в тесте). Прогон PASS.
- [ ] **Step 5:** e2e (+2): `mission-group-robogear` виден на /encyclopedia/missions; деталька `zahvat_flaga` показывает участников-машины со ссылкой `/encyclopedia/unit/locust`. Локально НЕ гонять (CI-only) — только type-check.
- [ ] **Step 6:** Коммит `feat(missions): 6 официальных сценариев — события СтарСис + миссии Robogear`.

### Task 7: Каталог бронетехники — сверка и добор машинного лора

**Files:**
- Modify: `src/data/encyclopedia/units/{polaris,protectorate,mercenaries}/machines.json` — только там, где найдены пробелы
- Modify: `package.json` `check:copy-paste` += машины↔starsys-official (если трогали тексты)

**Interfaces:** Consumes: Task 1 (декодированный katalog-bronetehniki.md). Производит: отчёт сверки (в реестр, Task 9).

- [ ] **Step 1:** Скрипт-сверка (одноразовый python в /tmp): имена машин из каталога (латиница + транслит-мэппинг как в import-cards: RAPTOR↔Раптор) ↔ `machines.json` трёх фракций; оружейные индексы (ATC-40/76, PG-1M→PB-1M!, MG-127X2, MDB 17…) ↔ `weapons[]`. Вывести: машины каталога без лора, машины каталога НЕ существующие у нас, расхождения вооружений.
- [ ] **Step 2:** Доборы: тонкие `history`/`lore` дополнить адаптированными фрагментами (≤11 слов), источником в `provenance.credit {work:"Бронетехника галактических войск (каталог)", year:2005?}` — сверить год по PDF; `loreAuthor` остаётся tehnolog, в NON_TEHNOLOG_WORKS не добавлять. Новых машин НЕ создавать (нет геймплейных статов — правило СтарСис-2001-спеки).
- [ ] **Step 3:** `npm run check:copy-paste` + `npx jest encyclopedia --testPathIgnorePatterns=…`. Коммит `feat(machines): машинный лор из печатного каталога — сверка и добор`.

### Task 8: SkyTech «Пиратские войны Окраин» — контент по карте Task 3

**Files:** (по итогам OCR; кандидаты)
- Modify: `src/data/sources-catalog.json` (+№29 `piratskie-voyny-okrain`, kind `chronicle`/`legend`→ выбрать из enum: chronicle, loreAuthor tehnolog, era по тексту) + тест (28→29, секции [8,4,9,7]→[9,4,9,7])
- Create: `src/content/world/<сущности>` — только те, что мапятся на существующий канон (ожидаемо: Окраины↔Периферия уже есть `periferiya`; пираты ↔ `piraty_*`; возможны новые term/ship досье) + `src/content/campaigns/piratskie-voyny-okrain.md` ЕСЛИ это связная война с эрой внутри 4360–4546 (иначе — вне «Хроник войн», только досье; проверка `warsEraSpan` в campaigns.test.ts!)
- Modify: `src/__tests__/lib/{world,campaigns,sources-catalog}.test.ts` соответственно

- [ ] **Step 1:** По «Карте содержимого» (Task 3) решить маппинг; правило: сущности SkyTech-линейки без армлистов у нас → упоминания инлайн в существующие досье, НЕ новые юниты.
- [ ] **Step 2:** Внести контент адаптацией; тесты-счётчики обновить; check:copy-paste уже покрыт claus'ом Task 5 (тот же каталог источников) — прогнать.
- [ ] **Step 3:** Коммит `feat(world): легенда SkyTech «Пиратские войны Окраин»`.

### Task 9: Реестр + финальная верификация

**Files:**
- Modify: `docs/ENCYCLOPEDIA_LORE_SOURCES.md` — раздел `### 21. Официальная PDF-библиотека «Варгеймы „СтарСис"»` (что взято/куда/кредиты; отметить закрытие долга «Летопись Звёздного Бытия — найдена») + обновить «Очередь» (пункты про Летопись и Гронт/Рун-первоисточники)
- Modify: `docs/lore-sources/README.md` — статус, если не закрыт в Task 1

- [ ] **Step 1:** Раздел реестра по формату соседних (№1–20): список PDF → куда легло.
- [ ] **Step 2:** Верификация: `npm run type-check` → 0; `npx jest --testPathIgnorePatterns='/node_modules/' '/.next/' '/e2e/'` → все PASS; `npm run check:copy-paste` → нет run ≥12; `NEXT_PUBLIC_GITHUB_PAGES=true npm run build` → без ошибок пререндера (ловит world/mission-слаги в sitemap).
- [ ] **Step 3:** Коммит `docs(lore): реестр №21 — официальная библиотека СтарСис`.
- [ ] **Step 4:** PR: ветка → main (gh pr create; push через `git -c credential.helper='!gh auth git-credential' push`), в описании — сводка 4 потоков.
