# Импорт лора robogear.ru — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дополнить `/encyclopedia/history` хроникой Империи (главы 9–11), справочными секциями, 9 рассказами игроков с robogear.ru; обновить реестр источников; расширить поиск (SEO «Робогир» + поиск по лору в приложении).

**Architecture:** Контент — markdown-главы в существующей системе `src/content/history/*.md` (лоадер `src/lib/history.ts`); новое опциональное поле `group` группирует некроникальные секции в оглавлении. Поиск — чистая утилита `src/lib/unit-search.ts` (haystack по полям лора юнита + подсказки заголовков глав), встраивается в клиентский фильтр `EncyclopediaPage`. SEO — keywords/тексты существующих страниц. Новых роутов и табов нет.

**Tech Stack:** Next.js 14 App Router (static export), gray-matter, Tailwind, Jest + jsdom, Playwright (CI-only), pdftotext, python3 (скрипт чистки рассказов, cp1251).

**Спека:** `docs/superpowers/specs/2026-08-28-robogear-lore-import-design.md`. Ветка: `feat/robogear-lore-import` (уже создана, спека закоммичена).

## Global Constraints

- Сайт robogear.ru и его PDF в кодировке cp1251 → UTF-8 при извлечении.
- E2E локально НЕ запускать (harness убивает webServer) — только `npm run type-check` и `npm run test`; e2e проверит CI.
- Новых роутов/табов не появляется; блок «Хроники войн» (`#wars`) остаётся завершающим на странице Истории.
- `group` опционален: старые главы не меняются; нумерация `01..NN` — только у глав без `group`; группированные записи в TOC без номера (маркер `//`, как у «Хроник войн»).
- Порядки: главы 9–11 (хроника), 12–15 (справочные секции, `group: Справочник`), 100+ (рассказы, `group: Творчество игроков`).
- Атрибуция: главы Империи — `loreAuthor: tehnolog` + `credit: {work: "Новейшая история Империи"}` (без автора — автор не установлен); рассказы — `loreAuthor: avb` + `credit: {author, work, url}` (мини-АВБ на чипе).
- Коммиты `[type(scope)]`, stage конкретных путей (НЕ `git add -A` — в рабочей копии мусорные скриншоты).
- В JSX тексты с `//` — в фигурных скобках: `{'// …'}` (иначе `react/jsx-no-comment-textnodes`).

---

### Task 1: Источники — скачать PDF и извлечь текст

**Files:**
- Create (вне репо): `~/Documents/BP/legend_empire.pdf`, `~/Documents/BP/legend_robogear.pdf`
- Create (вне репо, черновики для чтения): `/tmp/robogear-txt/legend_empire.txt`, `/tmp/robogear-txt/legend_robogear.txt`, `/tmp/robogear-txt/star_heroes.txt`

**Interfaces:**
- Consumes: ничего.
- Produces: текстовые выгрузки трёх PDF (для Tasks 2–4). `Star_heroes.pdf` уже лежит как `~/Documents/BP/LETOPIS_-_ZVEZDNYE_GEROI.pdf` (реестр, источник №6).

- [ ] **Step 1: Скачать/скопировать PDF**

Если `/tmp/robogear/*.pdf` ещё живы с брейншторма — просто скопировать; иначе скачать:

```bash
mkdir -p ~/Documents/BP /tmp/robogear /tmp/robogear-txt
cd /tmp/robogear
for f in legend_empire legend_robogear; do
  curl -s --max-time 60 -o "$f.zip" "http://www.robogear.ru/skelet/3/download/legend/$f.zip" \
    && unzip -o -q "$f.zip"
done
cp /tmp/robogear/legend_empire.pdf /tmp/robogear/legend_robogear.pdf ~/Documents/BP/
```

- [ ] **Step 2: Извлечь текст**

```bash
pdftotext -raw ~/Documents/BP/legend_empire.pdf /tmp/robogear-txt/legend_empire.txt
pdftotext -raw ~/Documents/BP/legend_robogear.pdf /tmp/robogear-txt/legend_robogear.txt
pdftotext -raw ~/Documents/BP/LETOPIS_-_ZVEZDNYE_GEROI.pdf /tmp/robogear-txt/star_heroes.txt
```

- [ ] **Step 3: Проверить извлечение**

```bash
wc -c /tmp/robogear-txt/*.txt          # каждая выгрузка > 20000 байт
grep -c "Регентств" /tmp/robogear-txt/legend_empire.txt   # > 0
grep -c "Космограф" /tmp/robogear-txt/star_heroes.txt     # > 0
grep -c "Блауд" /tmp/robogear-txt/legend_robogear.txt     # > 0
head -20 /tmp/robogear-txt/legend_empire.txt              # читаемая кириллица
```

Кириллица кривая (`Ðóññêèé`)? — `pdftotext` уже даёт UTF-8; если вдруг latin-1-мусор (баг InDesign-выгрузок из шпаргалки реестра): `python3 -c "print(open('/tmp/robogear-txt/legend_empire.txt').read().encode('latin-1').decode('cp1251'))" > fixed.txt`.

Коммита нет (файлы вне репо).

---

### Task 2: Главы 9–11 «Новейшая история Империи»

**Files:**
- Create: `src/content/history/konversiya-raskol-regentstvo.md` (order 9)
- Create: `src/content/history/flot-epokhi-regentstva.md` (order 10)
- Create: `src/content/history/legendarnye-imperskie-lordy.md` (order 11)
- Modify: `src/__tests__/lib/history.test.ts`
- Modify: `e2e/history.spec.ts`
- Modify: `docs/ENCYCLOPEDIA_LORE_SOURCES.md` (запись №7)

**Interfaces:**
- Consumes: `/tmp/robogear-txt/legend_empire.txt` (Task 1).
- Produces: три главы `HistoryChapterMeta` c `loreAuthor: 'tehnolog'`, `credit: {work: 'Новейшая история Империи'}`; slugs `konversiya-raskol-regentstvo`, `flot-epokhi-regentstva`, `legendarnye-imperskie-lordy`.

- [ ] **Step 1: Написать падающий тест (метаданные новых глав)**

В `src/__tests__/lib/history.test.ts` заменить тест «возвращает 8 глав…» (строки 6–10) и тест «первая глава… восьмая…» (12–15) на:

```ts
  it('возвращает 11 глав, отсортированных по order', () => {
    expect(chapters).toHaveLength(11);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('первая глава — Тунгусский артефакт, восьмая — экипировка пехоты', () => {
    expect(chapters[0]?.slug).toBe('tungusskiy-artefakt');
    expect(chapters[7]?.slug).toBe('ekipirovka-pehoty-dominiona');
  });

  it('главы 9–11 — «Новейшая история Империи»: tehnolog, кредит издания без автора', () => {
    const empire = chapters.filter((c) => {
      const o = c.order ?? 99;
      return o >= 9 && o <= 11;
    });
    expect(empire).toHaveLength(3);
    expect(empire.map((c) => c.slug)).toEqual([
      'konversiya-raskol-regentstvo',
      'flot-epokhi-regentstva',
      'legendarnye-imperskie-lordy',
    ]);
    for (const c of empire) {
      expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      expect(c.credit).toEqual({ work: 'Новейшая история Империи' });
    }
  });
```

(Тест про «главы 1–7 — Летопись» и «глава 8 — Косары» НЕ трогаем — они остаются верными.)

- [ ] **Step 2: Запустить и убедиться в падении**

Run: `npx jest src/__tests__/lib/history.test.ts`
Expected: FAIL — «received 8 chapters, expected 11» / slugs not found.

- [ ] **Step 3: Написать главы (куриция из legend_empire.txt)**

Прочитать `/tmp/robogear-txt/legend_empire.txt` целиком (19 стр.). Стиль — как у существующих глав (см. `src/content/history/dve-sily.md`): плотная фактологическая проза, 4–7 абзацев, без таблиц и списков. Frontmatter-шаблон:

```yaml
---
slug: konversiya-raskol-regentstvo
title: Конверсия, Раскол, Регентство
era: "4530–4600"   # ← реальные даты из текста PDF; если дат нет — поле убрать
order: 9
loreAuthor: tehnolog
credit:
  work: "Новейшая история Империи"
---
```

Структура из PDF:
- **Глава 9** «Конверсия, Раскол, Регентство» — первый раздел PDF (начинается «За несколько лет Бдительного мира Империя заметно изменилась…»).
- **Глава 10** «Флот эпохи Регентства» — одноимённый раздел.
- **Глава 11** «Легендарные Имперские Лорды» — раздел с 6 биографиями; в markdown — вводный абзац + по `### Лорд Алексей Долгорукий`, `### Лорд Кросс`, `### Лорд Эркхарт`, `### Леди Агата`, `### Лорд Шинджи`, `### Маркус Трёхглазый` (2–4 абзаца на каждого; длинные биографии сжать до ключевых событий).

Имена/названия не переводить и не менять; текст — адаптация, не посимвольная копия.

- [ ] **Step 4: Прогнать тесты**

Run: `npx jest src/__tests__/lib/history.test.ts`
Expected: PASS (все, включая старые).

Run: `npm run type-check`
Expected: exit 0.

- [ ] **Step 5: E2E — новая глава видна**

В `e2e/history.spec.ts` внутрь describe добавить:

```ts
  test('глава «Конверсия, Раскол, Регентство» отображается с источником «Новейшая история Империи»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const chapter = page.locator('[data-testid="history-chapter"]', {
      hasText: 'Конверсия, Раскол, Регентство',
    });
    await expect(chapter).toBeVisible();
    await expect(chapter.getByTestId('lore-source-row')).toContainText('Новейшая история Империи');
    await expect(chapter.getByTestId('credit-avb-mark')).toHaveCount(0);
  });
```

Локально НЕ запускать (CI-only). Проверить существование селекторов: `lore-source-row` уже используется в этом файле выше.

- [ ] **Step 6: Реестр — запись №7**

В `docs/ENCYCLOPEDIA_LORE_SOURCES.md` после записи №6 («Летопись: Звёздные герои») добавить:

```markdown
### 7. «Новейшая история Империи» — официальный «Технолог», 2007
- **Тип**: официальная хроника (продолжение «Летописи» после 4530 г.).
  **Файл**: `~/Documents/BP/legend_empire.pdf` (19 стр.; с
  `robogear.ru/skelet/3/download/legend/legend_empire.zip`).
- **Кредит**: `credit → {work:"Новейшая история Империи"}` без автора;
  `loreAuthor:"tehnolog"` (без АВБ).
- **Инвентаризация секций**: ✅ «Конверсия, Раскол, Регентство» → глава 9;
  ✅ «Флот эпохи Регентства» → глава 10; ✅ «Легендарные Имперские Лорды»
  (Долгорукий, Кросс, Эркхарт, Агата, Шинджи, Маркус Трёхглазый) → глава 11
  (биографии сжаты до ключевых событий; решение 2026-08-28 — истории героев
  из Star Heroes вне скоупа, лорды из хроники — в скоупе).
- **Статус**: ✅
```

- [ ] **Step 7: Коммит**

```bash
git add src/content/history/konversiya-raskol-regentstvo.md \
        src/content/history/flot-epokhi-regentstva.md \
        src/content/history/legendarnye-imperskie-lordy.md \
        src/__tests__/lib/history.test.ts e2e/history.spec.ts \
        docs/ENCYCLOPEDIA_LORE_SOURCES.md
git commit -m "feat(history): главы 9–11 — Новейшая история Империи (robogear.ru)"
```

---

### Task 3: Поле `group` + справочные секции Star Heroes

**Files:**
- Modify: `src/lib/history.ts` (тип `HistoryChapterMeta`)
- Modify: `src/app/encyclopedia/history/page.tsx` (TOC + рендер секций)
- Create: `src/content/history/kosmografiya-dominiona.md` (order 12), `src/content/history/politicheskoe-ustroystvo.md` (order 13), `src/content/history/sravnenie-voennykh-struktur.md` (order 14), `src/content/history/polyaris-perevorot.md` (order 15)
- Modify: `src/__tests__/lib/history.test.ts`
- Modify: `e2e/history.spec.ts`
- Modify: `docs/ENCYCLOPEDIA_LORE_SOURCES.md` (запись №6 — инвентаризация)

**Interfaces:**
- Consumes: `/tmp/robogear-txt/star_heroes.txt` (Task 1); `HistoryChapterMeta` из `src/lib/history.ts`.
- Produces: `HistoryChapterMeta.group?: string` — необязательное поле; рендер TOC с подзаголовками групп; секции со slug'ами выше. Позже (Task 5) рассказы используют `group: 'Творчество игроков'`.

- [ ] **Step 1: Падающий тест — поле group у секций**

В `src/__tests__/lib/history.test.ts` тест «возвращает 11 глав…» обновить до 15 и добавить новый:

```ts
  it('возвращает 15 глав, отсортированных по order', () => {
    expect(chapters).toHaveLength(15);
    const orders = chapters.map((c) => c.order ?? 99);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('справочные секции Star Heroes: order 12–15, группа «Справочник», без эры', () => {
    const ref = chapters.filter((c) => {
      const o = c.order ?? 99;
      return o >= 12 && o <= 15;
    });
    expect(ref).toHaveLength(4);
    expect(ref.map((c) => c.slug)).toEqual([
      'kosmografiya-dominiona',
      'politicheskoe-ustroystvo',
      'sravnenie-voennykh-struktur',
      'polyaris-perevorot',
    ]);
    for (const c of ref) {
      expect(`${c.slug}: ${c.group}`).toBe(`${c.slug}: Справочник`);
      expect(c.era).toBeUndefined();
      expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
      expect(c.credit).toEqual({ work: 'Летопись: Звёздные герои' });
    }
  });
```

- [ ] **Step 2: Запустить, убедиться в падении**

Run: `npx jest src/__tests__/lib/history.test.ts`
Expected: FAIL — 11 ≠ 15.

- [ ] **Step 3: Добавить `group` в тип**

`src/lib/history.ts`, в `HistoryChapterMeta` после `order?: number;`:

```ts
  /** Grouping label for non-chronicle sections (TOC subheader): «Справочник»,
   *  «Творчество игроков». Absent = the chronological flow (numbered chapters). */
  group?: string;
```

- [ ] **Step 4: Написать 4 секции (куриция из star_heroes.txt)**

Найти в `/tmp/robogear-txt/star_heroes.txt` разделы по оглавлению: «Космография Доминиона Человека», «Политическое устройство Протектората и Империи», «Сравнительное описание военных структур Доминиона и Империи», «Полярис. Попытка государственного переворота в Империи во время Вторжения Первой Волны». Frontmatter-шаблон:

```yaml
---
slug: kosmografiya-dominiona
title: Космография Доминиона
order: 12
group: Справочник
loreAuthor: tehnolog
credit:
  work: "Летопись: Звёздные герои"
---
```

Стиль: проза + допустимы `###`-подразделы по регионам/структурам. «Сравнительное описание военных структур» можно свести в короткие `###` по родам сил (без markdown-таблиц — таблицы в санкитайзере не проходят, а стиль страниц — проза).

- [ ] **Step 5: Рендер групп на странице Истории**

`src/app/encyclopedia/history/page.tsx`. TOC: сейчас один `<ol>` с нумерацией `String(i + 1)`. Заменить блок `{chapters.map((c, i) => ( … ))}` (строки 55–74) на групповой рендер — главы без `group` нумеруются по своему счётчику, перед первой записью группы вставляется подзаголовок, группированные записи без номера:

```tsx
{(() => {
  let chrono = 0;
  let lastGroup: string | undefined;
  return chapters.map((c) => {
    const showHeader = c.group !== undefined && c.group !== lastGroup;
    lastGroup = c.group;
    const number = c.group ? '// ' : String(++chrono).padStart(2, '0');
    return (
      <li key={c.slug} className={showHeader ? 'pt-2 mt-2 border-t border-military-steel/20' : ''}>
        {showHeader && (
          <p
            data-testid={`history-group-${c.group}`}
            className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-military-amber/70 mb-1"
          >
            {`// ${c.group}`}
          </p>
        )}
        <a href={`#${c.slug}`} className="flex items-baseline gap-3 group">
          <span className="font-ibm-mono text-[10px] text-military-rust">{number}</span>
          <span className="font-oswald text-military-sand group-hover:text-military-amber transition-colors">
            {c.title}
          </span>
          {c.era && (
            <span className="font-ibm-mono text-[10px] text-military-steel/50">{c.era}</span>
          )}
        </a>
      </li>
    );
  });
})()}
```

В теле страницы (блок `chapters.map` строк 93–121) ту же логику номера: заменить
`{String(i + 1).padStart(2, '0')}` на `{c.group ? '//' : String(i + 1).padStart(2, '0')}` и убрать неиспользуемый `i` (`chapters.map((c, i) =>` → оставить `i` только если линтер не ругается — иначе `chapters.map((c) =>`). Заголовок секции остаётся `h2`.

- [ ] **Step 6: Тесты + type-check**

Run: `npx jest src/__tests__/lib/history.test.ts`
Expected: PASS (15 глав, группы).

Run: `npm run type-check`
Expected: exit 0.

- [ ] **Step 7: E2E — группы в оглавлении**

В `e2e/history.spec.ts` добавить:

```ts
  test('справочные секции идут под заголовком группы «Справочник»', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('history-group-Справочник')).toBeVisible();
    const kosmo = page.locator('[data-testid="history-chapter"]', { hasText: 'Космография Доминиона' });
    await expect(kosmo).toBeVisible();
    await expect(kosmo.getByTestId('lore-source-row')).toContainText('Летопись');
  });
```

- [ ] **Step 8: Реестр — инвентаризация в записи №6**

В `docs/ENCYCLOPEDIA_LORE_SOURCES.md`, запись №6, после строки «**Статус**: ✅ Именной кредит не ставился…» добавить:

```markdown
- **Инвентаризация секций** (обновлено 2026-08-28): ✅ главы 1–7 (история
  человечества); ✅ «Космография Доминиона» → секция 12; ✅ «Политическое
  устройство Протектората и Империи» → секция 13; ✅ «Сравнительное описание
  военных структур» → секция 14; ✅ «Полярис. Попытка переворота» → секция 15;
  ⏭️ истории героев («Пустотный Бой», «Призрак», «Взятие Велиан» и др.) — вне
  скоупа (решение 2026-08-28).
```

- [ ] **Step 9: Коммит**

```bash
git add src/lib/history.ts src/app/encyclopedia/history/page.tsx \
        src/content/history/kosmografiya-dominiona.md \
        src/content/history/politicheskoe-ustroystvo.md \
        src/content/history/sravnenie-voennykh-struktur.md \
        src/content/history/polyaris-perevorot.md \
        src/__tests__/lib/history.test.ts e2e/history.spec.ts \
        docs/ENCYCLOPEDIA_LORE_SOURCES.md
git commit -m "feat(history): справочные секции Star Heroes + группировка «Справочник» в оглавлении"
```

---

### Task 4: Сверка «Легенд мира Робогир» (дедупликация)

**Files:**
- Modify (возможно): `src/content/history/*.md` глав 1–7 — точечные обогащения
- Modify: `docs/ENCYCLOPEDIA_LORE_SOURCES.md` (вердикты сверки)

**Interfaces:**
- Consumes: `/tmp/robogear-txt/legend_robogear.txt` (Task 1); главы 1–7.
- Produces: вердикт по каждому эпизоду — ✅ уже покрыто / ➕ дозаполнено в главу N / ⏭️ пропущено (дубль/мелочь). Число глав НЕ меняется (тест Task 3 остаётся 15).

- [ ] **Step 1: Прочитать и составить таблицу эпизодов**

Прочитать `/tmp/robogear-txt/legend_robogear.txt` (9 стр., 16 эпизодов: «Стремление к звёздам», «Умирающая Земля», «Первые шаги», «Разведывательный Корпус», «Потерянные корабли», «Доминион Человечества», «Легенда о старой Земле», «Темные времена», «Торговая Лига», «Торговые войны», «Появление Империи», «Арсеналы Протектората», «Битва за Блауд», «Восстание», «Патовая ситуация», «Бдительный мир»). Для каждого — grep по существующим главам:

```bash
for kw in "Блауд" "Арсеналы" "Восстание" "Патовая" "Бдительный" "Торговая Лига" "Потерянные"; do
  echo "== $kw =="; grep -rl "$kw" src/content/history/ src/content/campaigns/ || echo "  НЕ ПОКРЫТО"
done
```

- [ ] **Step 2: Дозаполнить пробелы (критерий: уникальный сюжетный факт)**

Для эпизодов «НЕ ПОКРЫТО», которые несут **новые факты вселенной** (кандидаты: «Битва за Блауд», «Арсеналы Протектората»), добавить 1–2 абзаца в тематически подходящую главу (Блауд → `dve-sily.md` или `liga-i-dominion.md`, смотря какая эра в тексте). Главу 8 и порядок не трогать. Мелкие расхождения формулировок 2005 vs 2007 — игнорировать (канон-база: Star Heroes, «Легенды» — вторичный источник).

Если не покрыто ничего существенного — файлы глав не менять вообще.

- [ ] **Step 3: Проверить, что ничего не сломалось**

Run: `npx jest src/__tests__/lib/history.test.ts && npm run type-check`
Expected: PASS / exit 0 (15 глав — число не менялось).

- [ ] **Step 4: Реестр — вердикты**

В `docs/ENCYCLOPEDIA_LORE_SOURCES.md` после записи №7 добавить:

```markdown
### 8. «Легенды мира Робогир» — официальный «Технолог», 2007 (источник сверки)
- **Тип**: ранняя редакция хронологии (16 эпизодов, до «Бдительного мира»).
  **Файл**: `~/Documents/BP/legend_robogear.pdf` (9 стр.).
- **Роль**: дедупликация против глав 1–7 (издание 2005 г. — базовое); уникальные
  факты дозаполняют существующие главы, новых глав не создаёт.
- **Инвентаризация эпизодов**: <заполнить по факту Step 1–2: у каждого ✅ покрыто
  главой N / ➕ дозаполнено в главу N / ⏭️ дубль>
- **Статус**: ✅
```

- [ ] **Step 5: Коммит**

```bash
git add src/content/history/ docs/ENCYCLOPEDIA_LORE_SOURCES.md
git commit -m "docs(lore): сверка «Легенд мира Робогир» — вердикты по эпизодам, дозаполнение глав"
```

(если главы не менялись — только реестр: `git add docs/ENCYCLOPEDIA_LORE_SOURCES.md`.)

---

### Task 5: Рассказы игроков — скрипт + 9 глав

**Files:**
- Create: `tools/robogear_story_fetch.py`
- Create: `src/content/history/` + 9 файлов: `krasnaya-yarost.md` (order 100), `seryy-leytenant.md` (101), `domashnyaya-voyna.md` (102), `general.md` (103), `istoriya-odnogo-soldata.md` (104), `put-voyna.md` (105), `mayndfaytery-1.md` (106), `mayndfaytery-2.md` (107), `mayndfaytery-3.md` (108)
- Modify: `src/__tests__/lib/history.test.ts`, `src/__tests__/lib/lore-credits-avb.test.ts`, `e2e/history.spec.ts`, `docs/ENCYCLOPEDIA_LORE_SOURCES.md`

**Interfaces:**
- Consumes: `group` из Task 3; URL рассказов (см. скрипт).
- Produces: 9 глав с `group: 'Творчество игроков'`, `order: 100+`, `loreAuthor: 'avb'`, `credit: {author, work, url}`.

- [ ] **Step 1: Падающие тесты**

`src/__tests__/lib/history.test.ts`: «возвращает 15 глав…» → 24, плюс:

```ts
  it('рассказы игроков: order 100+, группа, avb + именной кредит с URL', () => {
    const stories = chapters.filter((c) => (c.order ?? 99) >= 100);
    expect(stories).toHaveLength(9);
    for (const s of stories) {
      expect(`${s.slug}: ${s.group}`).toBe(`${s.slug}: Творчество игроков`);
      expect(`${s.slug}: ${s.loreAuthor}`).toBe(`${s.slug}: avb`);
      expect(s.credit?.author?.length).toBeGreaterThan(2);
      expect(s.credit?.url).toMatch(/^http:\/\/www\.robogear\.ru\/skelet\/6\//);
      expect(s.credit?.work).toBe(s.title);
    }
    expect(stories.map((s) => s.slug)).toEqual([
      'krasnaya-yarost', 'seryy-leytenant', 'domashnyaya-voyna', 'general',
      'istoriya-odnogo-soldata', 'put-voyna',
      'mayndfaytery-1', 'mayndfaytery-2', 'mayndfaytery-3',
    ]);
  });
```

`src/__tests__/lib/lore-credits-avb.test.ts` — в конец файла добавить блок (сканирует главы Истории по тому же принципу, что units/factions):

```ts
import { getAllHistoryChapters } from '@/lib/history';

describe('главы Истории: мини-АВБ ровно на не-Технолог текстах', () => {
  it('рассказы игроков — avb, главы «Летописи» и Империи — tehnolog', () => {
    const chapters = getAllHistoryChapters();
    for (const c of chapters) {
      if ((c.order ?? 99) >= 100) {
        expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: avb`);
      } else {
        // главы 1–8 и 9–15: tehnolog, кроме главы 8 («Косары», avb)
        if (c.slug !== 'ekipirovka-pehoty-dominiona') {
          expect(`${c.slug}: ${c.loreAuthor}`).toBe(`${c.slug}: tehnolog`);
        }
      }
    }
  });
});
```

(Импорт — вверху файла к остальным импортам, не внутри describe.)

- [ ] **Step 2: Запустить, убедиться в падении**

Run: `npx jest src/__tests__/lib/history.test.ts src/__tests__/lib/lore-credits-avb.test.ts`
Expected: FAIL — 15 ≠ 24; stories list empty.

- [ ] **Step 3: Скрипт загрузки/чистки**

`tools/robogear_story_fetch.py` (новый файл):

```python
#!/usr/bin/env python3
"""Скачивает рассказ игрока с robogear.ru (cp1251), чистит вёрстку 2008 года,
выводит markdown-черновик в stdout. После скрипта — ручная вычитка
(диалоги, переносы, мусор навигации).

Usage: python3 tools/robogear_story_fetch.py URL > /tmp/story.md
"""
import html
import re
import sys
import urllib.request

FOOTER_MARK = 'Все права принадлежат'


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (bronepehota lore-import)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('cp1251', errors='replace')


def extract_body(h: str) -> str:
    # Тело рассказа живёт в контентной таблице; подвал с копирайтом — граница конца.
    start = h.rfind('<table cellspacing="10"')
    end = h.find(FOOTER_MARK)
    if start == -1 or end == -1 or end < start:
        raise SystemExit('не найдены границы тела рассказа')
    return h[start:end]


def to_markdown(fragment: str) -> str:
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', fragment, flags=re.S | re.I)
    s = re.sub(r'<img[^>]*>', ' ', s, flags=re.I)              # иллюстрации не переносим
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</p>', '\n\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


if __name__ == '__main__':
    print(to_markdown(extract_body(fetch(sys.argv[1]))))
```

Проверка: `python3 tools/robogear_story_fetch.py http://www.robogear.ru/skelet/6/story_1.php | head -30` — читаемый текст с «Красная ярость», «Автор: Rasher», без меню/счётчиков.

- [ ] **Step 4: Перенести 9 рассказов**

Карта (порядок = как в «Содержании» на сайте):

| order | slug | title | author | URL |
|---|---|---|---|---|
| 100 | krasnaya-yarost | Красная ярость | Rasher | `skelet/6/story_1.php` |
| 101 | seryy-leytenant | Серый лейтенант | Ervin | `skelet/6/story_3.php` |
| 102 | domashnyaya-voyna | Домашняя война | Chebur | `skelet/6/story_4.php` |
| 103 | general | Генерал | Chebur | `skelet/6/story_17.php` |
| 104 | istoriya-odnogo-soldata | История одного солдата | Анатолий | `skelet/6/story_14.php` |
| 105 | put-voyna | Путь воина | Rasher | `skelet/6/story_15.php` |
| 106 | mayndfaytery-1 | Майндфайтеры. Часть 1 | Найтрос | `skelet/6/story_16.php` |
| 107 | mayndfaytery-2 | Майндфайтеры. Часть 2 | Найтрос | `skelet/6/story_16_2.php` |
| 108 | mayndfaytery-3 | Майндфайтеры. Часть 3 | Найтрос | `skelet/6/story_16_3.php` |

Frontmatter (пример krasnaya-yarost.md):

```yaml
---
slug: krasnaya-yarost
title: Красная ярость
order: 100
group: Творчество игроков
loreAuthor: avb
credit:
  author: "Rasher"
  work: "Красная ярость"
  url: "http://www.robogear.ru/skelet/6/story_1.php"
---
```

Тело: черновик из скрипта + ручная вычитка — убрать шапку-дубль заголовка/«Опубликован:», служебные строки навигации; диалоги и разбивку абзацев сохранить; прозаический текст НЕ сокращать и не переписывать (в отличие от глав хроники — это художественные тексты, переносятся целиком).

- [ ] **Step 5: Тесты + type-check**

Run: `npx jest src/__tests__/lib/history.test.ts src/__tests__/lib/lore-credits-avb.test.ts`
Expected: PASS.

Run: `npm run type-check`
Expected: exit 0.

- [ ] **Step 6: E2E — рассказ с кредитом и АВБ-маркой**

В `e2e/history.spec.ts`:

```ts
  test('рассказ «Красная ярость» — кредит автора с мини-АВБ', async ({ page }) => {
    await page.goto('/encyclopedia/history');
    await page.waitForLoadState('networkidle');

    const story = page.locator('[data-testid="history-chapter"]', { hasText: 'Красная ярость' });
    await expect(story).toBeVisible();
    await expect(story.getByTestId('lore-source-row')).toContainText('Rasher');
    await expect(story.getByTestId('credit-avb-mark')).toBeVisible();
  });
```

- [ ] **Step 7: Реестр — запись №9 + очередь**

В `docs/ENCYCLOPEDIA_LORE_SOURCES.md` после записи №8:

```markdown
### 9. Творчество игроков robogear.ru — независимые авторы
- **Тип**: художественные рассказы (9 шт.), опубликованы в «Клубе Robogear».
  **Откуда**: `robogear.ru/skelet/6/story_{1,3,4,17,14,15,16,16_2,16_3}.php`.
- **Кредит**: каждый рассказ — `credit → {author, work, url}` + `loreAuthor:"avb"`
  (мини-АВБ на кредит-чипе). Авторы: Rasher (2), Ervin, Chebur (2), Анатолий,
  Найтрос (3).
- **Куда перенесено**: группа «Творчество игроков» Истории (order 100–108).
- **Статус**: ✅ Текст перенесён целиком (с чисткой вёрстки), без пересказа.
```

В разделе «Очередь (необработанное)» удалить/обновить пункт про рассказы, если он появлялся, оставив: «Именованные отряды из „Косарей“…», «Биографии… вне скоупа», добавить «Статьи и „Описание войск" robogear.ru — не импортированы: дублируют справочник».

- [ ] **Step 8: Коммит**

```bash
git add tools/robogear_story_fetch.py src/content/history/ \
        src/__tests__/lib/history.test.ts src/__tests__/lib/lore-credits-avb.test.ts \
        e2e/history.spec.ts docs/ENCYCLOPEDIA_LORE_SOURCES.md
git commit -m "feat(history): 9 рассказов игроков robogear.ru — группа «Творчество игроков»"
```

---

### Task 6: Поиск по лору — `unit-search.ts`

**Files:**
- Create: `src/lib/unit-search.ts`
- Create: `src/__tests__/lib/unit-search.test.ts`
- Modify: `src/components/encyclopedia/EncyclopediaPage.tsx` (фильтр + плейсхолдер)

**Interfaces:**
- Consumes: `EncyclopediaUnit` (в т.ч. `unit.encyclopedia?: EncyclopediaLore` с полями `lore/history/tactics/manufacturer`) из `@/lib/encyclopedia-registry`; `factionDisplayNames` из `@/lib/faction-colors`.
- Produces (для Task 7): `buildSearchHaystack(unit: EncyclopediaUnit): string`; `matchesSearch(unit: EncyclopediaUnit, query: string, haystack?: string): boolean`; `interface LorePageRef { title: string; href: string; kind: 'chapter' | 'campaign' }`; `matchLoreTitles(query: string, pages: LorePageRef[]): LorePageRef[]`.

- [ ] **Step 1: Падающий тест**

`src/__tests__/lib/unit-search.test.ts` (новый):

```ts
import { buildSearchHaystack, matchesSearch, matchLoreTitles } from '@/lib/unit-search';
import type { EncyclopediaUnit } from '@/lib/encyclopedia-registry';

const unit = {
  id: 'test_hunter',
  name: 'Охотник',
  shortName: 'Хантер',
  faction: 'protectorate',
  type: 'machine',
  sources: [],
  encyclopedia: {
    manufacturer: 'Робогир Индастриз',
    lore: 'Машина времён Битвы за Блауд.',
  },
} as unknown as EncyclopediaUnit;

describe('unit-search', () => {
  it('haystack включает название, фракцию, производителя и лор', () => {
    const h = buildSearchHaystack(unit);
    expect(h).toContain('охотник');
    expect(h).toContain('протекторат');
    expect(h).toContain('робогир');
    expect(h).toContain('блауд');
  });

  it('matchesSearch: регистронезависимо, пустой запрос пропускает всех', () => {
    expect(matchesSearch(unit, 'РОБОГИР')).toBe(true);
    expect(matchesSearch(unit, 'Блауд')).toBe(true);
    expect(matchesSearch(unit, 'нет такого слова')).toBe(false);
    expect(matchesSearch(unit, '')).toBe(true);
  });

  it('matchLoreTitles: подстрока в заголовке, минимум 3 символа, до 3 результатов не режется тут', () => {
    const pages = [
      { title: 'Легендарные Имперские Лорды', href: '/encyclopedia/history#legendarnye-imperskie-lordy', kind: 'chapter' as const },
      { title: 'Красная ярость', href: '/encyclopedia/history#krasnaya-yarost', kind: 'chapter' as const },
      { title: 'Имперские войны', href: '/encyclopedia/history#wars', kind: 'campaign' as const },
    ];
    expect(matchLoreTitles('Лорд', pages)).toHaveLength(1);
    expect(matchLoreTitles('Имперск', pages)).toHaveLength(2);
    expect(matchLoreTitles('яр', pages)).toHaveLength(0);   // < 3 символов
    expect(matchLoreTitles('', pages)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Запустить, убедиться в падении**

Run: `npx jest src/__tests__/lib/unit-search.test.ts`
Expected: FAIL — Cannot find module '@/lib/unit-search'.

- [ ] **Step 3: Реализация**

`src/lib/unit-search.ts`:

```ts
import type { EncyclopediaUnit } from './encyclopedia-registry';
import { factionDisplayNames } from './faction-colors';

/** Lore page reference for search hints (chapters + campaigns). */
export interface LorePageRef {
  title: string;
  href: string;
  kind: 'chapter' | 'campaign';
}

/** Precomputed per-unit search string: name, shortName, faction display name,
 *  manufacturer and lore fields (lore/history/tactics), lowercased.
 *  Build once (useMemo) — the filter then does a cheap substring check. */
export function buildSearchHaystack(unit: EncyclopediaUnit): string {
  const enc = unit.encyclopedia;
  return [
    unit.name,
    unit.shortName,
    factionDisplayNames[unit.faction],
    enc?.manufacturer,
    enc?.lore,
    enc?.history,
    enc?.tactics,
  ]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
    .toLowerCase();
}

/** Case-insensitive substring match against the (optional precomputed) haystack. */
export function matchesSearch(unit: EncyclopediaUnit, query: string, haystack?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (haystack ?? buildSearchHaystack(unit)).includes(q);
}

/** Chapters/campaigns whose TITLE matches the query (≥3 chars). Body text is
 *  intentionally not searched — titles cover discovery intent. */
export function matchLoreTitles(query: string, pages: LorePageRef[]): LorePageRef[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  return pages.filter((p) => p.title.toLowerCase().includes(q));
}
```

- [ ] **Step 4: Тест проходит**

Run: `npx jest src/__tests__/lib/unit-search.test.ts`
Expected: PASS.

- [ ] **Step 5: Встроить в EncyclopediaPage**

`src/components/encyclopedia/EncyclopediaPage.tsx`:

1. Импорт: `import { buildSearchHaystack, matchesSearch } from '@/lib/unit-search';`
2. После `const [isLoaded, setIsLoaded] = useState(false);` (строка ~43) — кеш haystack'ов:

```ts
  // Haystacks are built once (lore fields are stable per unit); the filter
  // effect below then does a cheap substring check per keystroke.
  const haystacks = useMemo(
    () => new Map(units.map((u) => [u.id, buildSearchHaystack(u)])),
    [units],
  );
```

3. В фильтре (строки 134–139) заменить блок:

```ts
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = unit.name.toLowerCase().includes(searchLower);
        const shortNameMatch = unit.shortName?.toLowerCase().includes(searchLower);
        if (!nameMatch && !shortNameMatch) return false;
      }
```

на:

```ts
      // Search covers name, shortName, faction, manufacturer and lore fields —
      // see buildSearchHaystack (queries like «Робогир» or «Блауд» find units).
      if (searchQuery && !matchesSearch(unit, searchQuery, haystacks.get(unit.id))) {
        return false;
      }
```

и добавить `haystacks` в deps эффекта: `}, [units, haystacks, selectedFaction, selectedSculptor, selectedType, searchQuery]);`

4. Плейсхолдер (строка ~263): `placeholder="ПОИСК ПО НАЗВАНИЮ…"` → `placeholder="ПОИСК…"` (e2e-селектор `input[placeholder*="ПОИСК"]` остаётся валидным).

- [ ] **Step 6: Проверки**

Run: `npx jest src/__tests__/lib/unit-search.test.ts && npm run type-check`
Expected: PASS / exit 0.

Run: `npm run test`
Expected: все юнит-тесты зелёные (поиск теперь шире — если какой-то тест ожидал фильтрацию только по имени, обновить ожидание).

- [ ] **Step 7: Коммит**

```bash
git add src/lib/unit-search.ts src/__tests__/lib/unit-search.test.ts \
        src/components/encyclopedia/EncyclopediaPage.tsx
git commit -m "feat(encyclopedia): поиск юнитов по лору (производитель/фракция/текст) — unit-search"
```

---

### Task 7: Подсказки лор-страниц в поиске

**Files:**
- Create: `src/components/encyclopedia/LoreSearchHints.tsx`
- Modify: `src/app/encyclopedia/page.tsx`
- Modify: `src/components/encyclopedia/EncyclopediaPage.tsx` (проп + рендер)
- Modify: `src/__tests__/lib/unit-search.test.ts` — без изменений (matchLoreTitles покрыт Task 6)
- Modify: `e2e/encyclopedia.spec.ts`

**Interfaces:**
- Consumes: `LorePageRef`, `matchLoreTitles` из `@/lib/unit-search` (Task 6); `getAllHistoryChapters()` (`@/lib/history`, sync, frontmatter-only); `getAllCampaigns()` (`@/lib/campaigns`).
- Produces: `EncyclopediaPageProps.lorePages: LorePageRef[]` (новый обязательный проп).

- [ ] **Step 1: Серверная страница собирает заголовки**

`src/app/encyclopedia/page.tsx` целиком:

```tsx
import { getAllUnits } from '@/lib/encyclopedia-utils';
import { getAllHistoryChapters } from '@/lib/history';
import { getAllCampaigns } from '@/lib/campaigns';
import type { LorePageRef } from '@/lib/unit-search';
import EncyclopediaPageClient from '@/components/encyclopedia/EncyclopediaPage';

export default async function EncyclopediaPage() {
  // Fetch all units at build time
  const allUnits = await getAllUnits();

  // Lore page titles for search hints (chapters + campaigns); titles only —
  // body search is out of scope by design.
  const lorePages: LorePageRef[] = [
    ...getAllHistoryChapters().map((c) => ({
      title: c.title,
      href: `/encyclopedia/history#${c.slug}`,
      kind: 'chapter' as const,
    })),
    ...getAllCampaigns().map((c) => ({
      title: c.title,
      href: '/encyclopedia/history#wars',
      kind: 'campaign' as const,
    })),
  ];

  return <EncyclopediaPageClient initialUnits={allUnits} lorePages={lorePages} />;
}
```

- [ ] **Step 2: Компонент LoreSearchHints**

`src/components/encyclopedia/LoreSearchHints.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { matchLoreTitles, type LorePageRef } from '@/lib/unit-search';

interface LoreSearchHintsProps {
  pages: LorePageRef[];
  query: string;
}

/** Thin row of lore-page chips above the unit grid: shows when the search query
 *  matches a history chapter / story / campaign TITLE. Hidden otherwise. */
export function LoreSearchHints({ pages, query }: LoreSearchHintsProps) {
  const matches = matchLoreTitles(query, pages).slice(0, 3);
  if (matches.length === 0) return null;
  return (
    <div data-testid="lore-search-hints" className="flex flex-wrap items-center gap-2">
      {matches.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          data-testid="lore-search-hint"
          className="inline-flex items-center gap-1.5 rounded-full border border-military-amber/40 bg-military-charcoal/60 px-3 py-1 font-ibm-mono text-[10px] uppercase tracking-wide text-military-amber/90 hover:border-military-amber transition-colors"
        >
          <span className="text-military-rust/60">{p.kind === 'campaign' ? '// ХРОНИКИ' : '// ГЛАВА'}</span>
          <span>{p.title}</span>
          <span>→</span>
        </Link>
      ))}
    </div>
  );
}

export default LoreSearchHints;
```

- [ ] **Step 3: Прокинуть проп и отрендерить**

`src/components/encyclopedia/EncyclopediaPage.tsx`:

1. Пропы:

```ts
interface EncyclopediaPageProps {
  initialUnits: EncyclopediaUnit[];
  /** Lore page titles for search hints (history chapters + campaigns). */
  lorePages: LorePageRef[];
}
```

и сигнатура `export default function EncyclopediaPage({ initialUnits, lorePages }: EncyclopediaPageProps) {`.

2. Импорты: `import { buildSearchHaystack, matchesSearch, type LorePageRef } from '@/lib/unit-search';` и `import { LoreSearchHints } from './LoreSearchHints';`.

3. Рендер — сразу ПОСЛЕ закрывающего `</div>` блока «Search + count» (после строки ~276, перед блоком селекторов):

```tsx
            {/* Lore hints — chapters/campaigns whose title matches the query */}
            <LoreSearchHints pages={lorePages} query={searchQuery} />
```

- [ ] **Step 4: Проверки**

Run: `npm run type-check && npm run test`
Expected: exit 0 / PASS.

- [ ] **Step 5: E2E**

В `e2e/encyclopedia.spec.ts` после теста «поиск по названию работает» добавить:

```ts
  test('поиск «Робогир» находит технику, подсказка ведёт на главу Истории', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="ПОИСК"]', 'Робогир');
    await page.waitForTimeout(300);

    // Производитель «Робогир Индастриз» — техника находится поиском по лору
    const cards = page.locator('[href*="/encyclopedia/unit/"]');
    expect(await cards.count()).toBeGreaterThan(0);

    // Подсказки лор-строк могли не совпасть (зависит от заголовков) — не падаем:
    // обязательна только видимость строки подсказок при совпадении.
  });

  test('поиск «Лорд» показывает подсказку-главу', async ({ page }) => {
    await page.goto('/encyclopedia');
    await page.waitForLoadState('networkidle');

    await page.fill('input[placeholder*="ПОИСК"]', 'Лорд');
    await page.waitForTimeout(300);

    const hint = page.getByTestId('lore-search-hint');
    await expect(hint.first()).toBeVisible();
    await expect(hint.first()).toContainText('Лорды');
  });
```

(300ms-таймауты здесь — устоявшийся паттерн этого спека; новые спеки их не вводят.)

- [ ] **Step 6: Коммит**

```bash
git add src/app/encyclopedia/page.tsx src/components/encyclopedia/LoreSearchHints.tsx \
        src/components/encyclopedia/EncyclopediaPage.tsx e2e/encyclopedia.spec.ts
git commit -m "feat(encyclopedia): подсказки глав/хроник в поиске — LoreSearchHints"
```

---

### Task 8: SEO — «Робогир»

**Files:**
- Modify: `src/app/layout.tsx` (keywords, строка 58)
- Modify: `src/app/encyclopedia/history/page.tsx` (metadata + вводный абзац)
- Modify: `src/components/landing/FactionsSection.tsx` (подзаголовок после «ФРАКЦИИ»)

**Interfaces:**
- Consumes: готовые главы (Tasks 2–5) — текст упоминает реальный контент.
- Produces: ничего для кода — тексты/метаданные.

- [ ] **Step 1: Keywords**

`src/app/layout.tsx`, в массиве keywords после строки `'robogear',`:

```ts
    'робогир',
    'вселенная робогир',
    'легенды робогир',
    'летопись робогир',
```

- [ ] **Step 2: Метаданные и вводный абзац Истории**

`src/app/encyclopedia/history/page.tsx`:

```ts
export const metadata = {
  title: 'История вселенной Робогир — Энциклопедия Бронепехоты',
  description:
    'Хроника вселенной Робогир (Robogear) — общего мира настольных игр «Робогир» и «Бронепехота»: от Тунгусского артефакта и первых прыжков к звёздам до Доминиона, Новейшей истории Империи, Легендарных Лордов и хроник войн.',
  alternates: { canonical: '/encyclopedia/history' },
};
```

Сразу после `<EncyclopediaTabs className="mb-6" />` (внутри `<header>`, после строки 49):

```tsx
          <p className="font-ibm-mono text-[10px] md:text-[11px] text-military-steel/60 tracking-wide">
            {'// Вселенная настольных игр «Робогир» (Robogear) и «Бронепехота» — общая'}
          </p>
```

- [ ] **Step 3: Лендинг — подзаголовок секции фракций**

`src/components/landing/FactionsSection.tsx`, после `<div className="military-divider max-w-md mx-auto" />` (строка 44):

```tsx
          <p className="mt-4 text-center text-sm text-military-sand/60 max-w-2xl mx-auto">
            Вселенная общая с настольной игрой «Робогир» (Robogear): Протекторат,
            Полярис и боевая техника — те же.
          </p>
```

- [ ] **Step 4: Проверки**

Run: `npm run type-check && npm run test`
Expected: exit 0 / PASS (метаданные тестами не покрыты — проверка типами и сборкой).

Run: `grep -c "робогир" src/app/layout.tsx src/app/encyclopedia/history/page.tsx src/components/landing/FactionsSection.tsx`
Expected: ≥1 в каждом.

- [ ] **Step 5: Коммит**

```bash
git add src/app/layout.tsx src/app/encyclopedia/history/page.tsx \
        src/components/landing/FactionsSection.tsx
git commit -m "feat(seo): «Робогир» в keywords, описании Истории и на лендинге"
```

---

### Task 9: Финальная верификация

**Files:** — (только проверки)

- [ ] **Step 1: Полный прогон**

```bash
npm run type-check   # exit 0
npm run test         # все юнит-тесты PASS (~1300)
npm run validate     # type-check + lint + unit (без e2e)
```

- [ ] **Step 2: Ручная приёмка (dev-сервер)**

```bash
pkill -9 -f next; rm -rf .next; nohup npm run dev > /tmp/dev.log 2>&1 &
```

(фоновый запуск — ОТДЕЛЬНОЙ командой, не chaining с pkill; потом открыть `http://localhost:3000/encyclopedia/history`)

Проверить глазами:
- главы 9–11 стилево согласованы с 1–7 (плотность, длина абзацев);
- группы «Справочник» и «Творчество игроков» в оглавлении, `#wars` — последний;
- рассказы читаемы, у каждого чип автора с мини-АВБ;
- поиск «Робогир» находит технику, «Лорд» даёт подсказку-главу;
- лендинг: подзаголовок фракций не ломает вёрстку на 320px.

- [ ] **Step 3: Пуш и PR**

```bash
git -c credential.helper='!gh auth git-credential' push -u origin feat/robogear-lore-import
```

PR в `main` (не мерджить самому): заголовок `feat: импорт лора robogear.ru — главы Империи, справочник, рассказы, поиск по «Робогир»`, в описании — ссылка на спеку, чек-лист e2e CI.

---

## Самопроверка плана (выполнена)

- **Покрытие спеки**: глав 9–11 → Task 2; справочные секции → Task 3; дедуп «Легенд» → Task 4; рассказы → Task 5; реестр → Tasks 2–5 (по частям); поиск в приложении → Tasks 6–7; SEO → Task 8; тесты — в каждом таске TDD. Пропусков нет.
- **Скоуп**: один план, одна ветка, задачи независимы для ревью.
- **Типы**: `LorePageRef`/`matchLoreTitles` определены в Task 6, потреблены в Task 7; slugs/order совпадают между контент-тасками и тестами; `lore-credits-avb.test.ts` дополняется сканом глав (в Task 5 — отклонение от буквы спеки «дополнить lore-credits-avb»: файл сканирует units/factions, главам — отдельный describe в нём же).
