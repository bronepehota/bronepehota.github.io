# README Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переписать устаревший `README.md` в худой лендинг для игроков, вынести «Благодарности» в `docs/COMMUNITY.md`, снять 6 свежих скриншотов в не-игнорируемый путь и поправить счётчики юнитов.

**Architecture:** README (root) — игрокам; `docs/COMMUNITY.md` — сообщество/благодарности; `docs/screenshots/*.png` — скриншоты (вне `.gitignore`, чтобы рендерились на GitHub). Скриншоты снимаются автономным Node-скриптом `scripts/capture-readme-shots.mjs` через `chromium` из `@playwright/test`, на дев-сервере порта 3001, с мобильным вьюпортом 390×844. `DEVELOPMENT.md`/`CONTRIBUTING.md`/`CLAUDE.md` не трогаются.

**Tech Stack:** Markdown, Node ESM, `@playwright/test` (только `chromium`), Next.js dev server (`npm run dev:e2e`).

## Global Constraints

- Все UI-тексты и тексты README/COMMUNITY — на русском (как в приложении).
- Скриншоты кладутся **только** в `docs/screenshots/` (путь проверен: НЕ в `.gitignore`). Папка `docs/promo/` — игнорируется, использовать нельзя.
- Источник отображаемых имён: `src/lib/sources-registry.ts`. Имена: `Star System`, `Технолог Классик`. `Технолог 2026` — пустой стаб (0 юнитов), в README **не упоминается**.
- Сверенные по данным счётчики (финальные, перепроверить в Task 2):
  - **Star System**: 44 отряда + 30 машин = **74 юнита** (Поларис 15/14, Протекторат 21/15, Наёмники 8/1).
  - **Технолог Классик**: 30 отрядов + 30 машин = **60 юнитов** (Поларис 9/9, Протекторат 14/14, Наёмники 7/7).
- В коммитах staged **только целевые пути**. Не подхватывать untracked `docs/superpowers/plans/2026-06-22-capture-hold-mission.md` (он лежит в дереве, к задаче не относится).
- Дев-сервер плодит процессы на портах 3000–3003. После съёмки: `pkill -9 -f next` + `rm -rf .next`.
- Ссылка на живой сайт: `https://luxor.github.io/bronepehota/`; калькулятор: `.../calculator`.
- `CLAUDE.md` на ветке `main` содержит устаревшую ссылку на `TacticalDashboard.tsx` — её НЕ править (за рамками задачи; правки на `feat/168-machine-capture`).

---

## File Structure

| Файл | Действие | Ответственность |
|---|---|---|
| `scripts/capture-readme-shots.mjs` | создать | Автономный скрипт съёмки 6 скриншотов (mobile viewport) |
| `docs/screenshots/01..06-*.png` | создать | 6 PNG: лендинг, армия, навигатор, бой, калькулятор, энциклопедия |
| `README.md` | переписать | Худой лендинг для игроков |
| `docs/COMMUNITY.md` | создать | Благодарности, Star System, миниатюры, VK |
| `DEVELOPMENT.md`, `CONTRIBUTING.md`, `CLAUDE.md` | без изменений | — |

---

### Task 1: Снять 6 скриншотов

**Files:**
- Create: `scripts/capture-readme-shots.mjs`
- Create: `docs/screenshots/01-landing.png`, `02-army.png`, `03-navigator.png`, `04-combat.png`, `05-calculator.png`, `06-encyclopedia.png`

**Interfaces:**
- Produces: 6 PNG в `docs/screenshots/`, на которые ссылается README в Task 2 (`docs/screenshots/0N-*.png`).

- [ ] **Step 1: Создать скрипт съёмки**

Создать `scripts/capture-readme-shots.mjs` с содержимым:

```js
// scripts/capture-readme-shots.mjs
// Снимает 6 скриншотов для README на дев-сервере http://localhost:3001.
// Запуск: сначала поднять `npm run dev:e2e`, дождаться порта 3001, затем `node scripts/capture-readme-shots.mjs`.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:3001';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const VIEWPORT = { width: 390, height: 844 }; // mobile portrait
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';

const newMobilePage = async (browser) => {
  const ctx = await browser.newContext({ viewport: VIEWPORT, userAgent: UA });
  return ctx.newPage();
};
const shot = async (page, name) => {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log('captured', path);
};

// --- game-session seed (зеркало e2e/helpers/setup.ts) ---
const squad = (instanceId, num = 1) => ({
  instanceId, type: 'squad', instanceNumber: num,
  currentSoldiers: [0, 1, 2, 3, 4, 5], deadSoldiers: [], actionsUsed: [],
  data: {
    id: 'polaris_lineynaya_klon_pehota', name: 'Линейная клон-пехота', shortName: 'Линейная',
    faction: 'polaris', cost: 50, image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
    soldiers: Array.from({ length: 6 }, (_, i) => ({ num: i + 1, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' })),
  },
});
const machine = (instanceId, num = 1) => ({
  instanceId, type: 'machine', instanceNumber: num,
  currentSoldiers: [], deadSoldiers: [], actionsUsed: [],
  durability: 16, ammo: 20, currentAmmo: 20, machineShotsUsed: 0,
  data: {
    id: 'polaris_legkiy_shturmovoy_ekranoplan', name: 'Лёгкий штурмовой экраноплан', shortName: 'Экраноплан',
    faction: 'polaris', cost: 150, rank: 2, fire_rate: 2, ammo_max: 20, durability_max: 16,
    image: '/images/machines/polaris/legkiy_shturmovoy_ekranoplan/1.png',
    speed_sectors: [{ min_durability: 9, max_durability: 16, speed: 2 }, { min_durability: 1, max_durability: 8, speed: 1 }],
    weapons: [{ name: 'Пушка', range: 'D12', power: '2D20', special: '' }],
  },
});
const seedGameSession = (page, units) => page.addInitScript((u) => {
  const army = { name: 'Фото', faction: 'polaris', sourceId: 'star_system', units: u, totalCost: 200, currentStep: 'battle', isInBattle: true, currentTurn: 1 };
  localStorage.clear();
  localStorage.setItem('bronepehota_army', JSON.stringify(army));
  localStorage.setItem('bronepehota_view', 'game');
  localStorage.setItem('bronepehota_display_mode', 'detailed');
}, units);
const clearStorage = (page) => page.addInitScript(() => {
  Object.keys(localStorage).filter((k) => k.startsWith('bronepehota')).forEach((k) => localStorage.removeItem(k));
});

(async () => {
  const browser = await chromium.launch();
  try {
    // 1. Лендинг
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '01-landing');
      await page.close();
    }
    // 2. Сбор армии (провести визард + добавить пару отрядов)
    {
      const page = await newMobilePage(browser);
      await clearStorage(page);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('rules-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByTestId('source-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByTestId('faction-card-polaris').click();
      await page.waitForTimeout(400);
      await page.getByTestId('faction-continue-button').click();
      await page.waitForTimeout(500);
      await page.getByTestId('mission-confirm-button').click();
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: '350' }).click();
      await page.waitForTimeout(400);
      await page.getByTestId('budget-next-button').click();
      await page.waitForTimeout(1200);
      for (let i = 0; i < 3; i++) {
        try { await page.getByRole('button', { name: /добавить/i }).first().click({ timeout: 1500 }); await page.waitForTimeout(350); } catch {}
      }
      await page.waitForTimeout(800);
      await shot(page, '02-army');
      await page.close();
    }
    // 3. Навигатор (игровая сессия с несколькими юнитами)
    {
      const page = await newMobilePage(browser);
      await seedGameSession(page, [squad('nav-squad-1', 1), squad('nav-squad-2', 2), machine('nav-machine-1', 1)]);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('game-session').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.waitForTimeout(1200);
      await shot(page, '03-navigator');
      await page.close();
    }
    // 4. Боевой калькулятор (фаза параметров выстрела)
    {
      const page = await newMobilePage(browser);
      await seedGameSession(page, [squad('combat-squad-1', 1)]);
      await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
      await page.getByTestId('game-session').first().waitFor({ state: 'visible', timeout: 15000 });
      await page.getByTestId('unit-nav-combat-squad-1').first().click({ force: true });
      await page.waitForTimeout(800);
      try {
        await page.getByRole('button', { name: 'Выберите действие' }).first().click({ timeout: 3000 });
        await page.waitForTimeout(600);
        await page.getByRole('button', { name: /выстрел/i }).first().click({ timeout: 3000 });
        await page.waitForTimeout(900);
      } catch (e) { console.log('combat flow partial:', e.message); }
      await shot(page, '04-combat');
      await page.close();
    }
    // 5. Отдельный калькулятор
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/calculator', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '05-calculator');
      await page.close();
    }
    // 6. Энциклопедия
    {
      const page = await newMobilePage(browser);
      await page.goto(BASE + '/encyclopedia', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      await shot(page, '06-encyclopedia');
      await page.close();
    }
  } finally {
    await browser.close();
  }
})();
```

- [ ] **Step 2: Поднять дев-сервер на 3001 и дождаться готовности**

Run:
```bash
pkill -9 -f next || true
rm -rf .next
npm run dev:e2e > /tmp/bronepehota-dev.log 2>&1 &
```
Poll до ответа (до ~60с, первый доступ к `/app` компилируется ~30с):
```bash
for i in $(seq 1 60); do curl -sf http://localhost:3001/ -o /dev/null && echo "UP after ${i}s" && break; sleep 1; done
```
Expected: `UP after Ns`. Если за 60с не поднялся — проверить `/tmp/bronepehota-dev.log`.

- [ ] **Step 3: Запустить скрипт съёмки**

Run: `node scripts/capture-readme-shots.mjs`
Expected: 6 строк `captured docs/screenshots/0N-*.png`, выход без ошибок.

- [ ] **Step 4: Проверить, что 6 PNG на месте и не пустые**

Run:
```bash
ls -la docs/screenshots/*.png
```
Expected: 6 файлов `01..06`, каждый **> 20 КБ** (меньше = пустой/бланковый скриншот — переснять).

- [ ] **Step 5: Визуально проверить кадры**

Открыть как минимум `01-landing.png`, `03-navigator.png`, `04-combat.png` (Read как изображения). Подтвердить: лендинг показывает hero; навигатор — карточки юнитов; бой — открытое окно параметров. Если кадр бледный/пустой — поправить таймауты/селекторы в скрипте и повторить Step 3.

- [ ] **Step 6: Остановить дев-сервер**

Run:
```bash
pkill -9 -f next || true
rm -rf .next
```

- [ ] **Step 7: Закоммитить скрипт и скриншоты**

```bash
git add scripts/capture-readme-shots.mjs docs/screenshots
git commit -m "docs(readme): capture 6 fresh screenshots + reproducible capture script

Co-Authored-By: Claude <noreply@anthropic.com>"
```
Проверить перед коммитом: `git diff --cached --name-only` — только `scripts/capture-readme-shots.mjs` и 6 PNG. Никаких прочих файлов.

---

### Task 2: Переписать README.md

**Files:**
- Modify: `README.md` (полная замена содержимого)

**Interfaces:**
- Consumes: 6 PNG из `docs/screenshots/` (Task 1); счётчики юнитов из данных.
- Produces: README ссылается на `docs/COMMUNITY.md` (создаётся в Task 3), `DEVELOPMENT.md`, `CONTRIBUTING.md`, `CLAUDE.md`.

- [ ] **Step 1: Перепроверить счётчики по данным**

Run:
```bash
python3 - <<'EOF'
import json, os
def counts(src):
    base=f'src/data/sources/{src}'; ts=tm=0; per={}
    for f in ['polaris','protectorate','mercenaries']:
        sp=f'{base}/{f}/squads.json'; mp=f'{base}/{f}/machines.json'
        s=len(json.load(open(sp))) if os.path.exists(sp) else 0
        m=len(json.load(open(mp))) if os.path.exists(mp) else 0
        per[f]=(s,m); ts+=s; tm+=m
    return ts,tm,per
for src in ['star_system','tehnolog']:
    ts,tm,per=counts(src)
    print(f'{src}: {ts} squads + {tm} machines | {per}')
EOF
```
Expected: `star_system: 44 squads + 30 machines | {'polaris': (15, 14), 'protectorate': (21, 15), 'mercenaries': (8, 1)}` и `tehnolog: 30 squads + 30 machines | {...}`. Если расходится — обновить числа в Step 2.

- [ ] **Step 2: Полностью заменить содержимое `README.md`**

Записать в `README.md`:

````markdown
# Бронепехота

Веб-приложение для настольного варгейма «Бронепехота» от компании [Технолог](http://www.tehnolog.ru/).

<p align="center">
  <img src="docs/screenshots/01-landing.png" alt="Лендинг приложения" width="320" />
</p>

Используется в двух режимах — на усмотрение игрока. Минимально это цифровая база карточек и конструктор армии: вы собираете отряды и видите параметры на экране телефона, а кости бросаете руками. В полном варианте приложение считает броски само — учитывает вероятности, модификаторы и результаты попаданий.

**Попробуйте** на [сайте проекта](https://luxor.github.io/bronepehota/) · отдельно — [калькулятор боя](https://luxor.github.io/bronepehota/calculator).

## Фракции

Три фракции в источнике Star System — всего **74 юнита: 44 отряда пехоты и 30 боевых машин**.

- **Поларис** — космическая империя, ставка на клон-пехоту: массовость, стандартизация, мощная огневая поддержка. **29 юнитов** (15 отрядов, 14 машин).
- **Протекторат** — федерация планет, профессиональные солдаты и ополчение: гибкость, адаптивность. **36 юнитов** (21 отряд, 15 машин).
- **Наёмники** — военные корпорации и искатели приключений: низкая стоимость, специализация. **9 юнитов** (8 отрядов, 1 машина).

> Лор и тактика фракций — также в разделе «Энциклопедия» внутри приложения.

## Возможности

<p align="center">
  <img src="docs/screenshots/02-army.png" alt="Сбор армии" width="240" />
  <img src="docs/screenshots/03-navigator.png" alt="Навигатор в бою" width="240" />
</p>

- **Сбор армии** — выбор фракции, лимит очков, поиск и фильтрация, автонумерация, автосохранение в браузере.
- **Навигатор в бою** — все юниты на экране телефона, состояние прочности/боеприпасов/потерь, переход между карточками одним касанием.
- **Карточки отрядов и машин** — параметры каждого солдата (ранг, скорость, дальность, мощь, рукопашная, броня), вооружение и секторы скорости техники.
- **Боевой калькулятор** — автоподстановка параметров оружия, учёт баффов/дебаффов/способностей; три действия — выстрел, ближний бой, граната; опциональные тест паники, прицельная и внезапная стрельба.

<p align="center">
  <img src="docs/screenshots/04-combat.png" alt="Боевой калькулятор" width="240" />
  <img src="docs/screenshots/05-calculator.png" alt="Калькулятор боя" width="240" />
</p>

- **Отдельный калькулятор** — расчёт боя без создания армии: ввод кубиков (D6/D12/D20), история значений, два набора правил.
- **Энциклопедия** — лор, класс, история и тактика по всем юнитам, с изображениями и поиском.
- **Редактор отрядов** *(десктоп)* — собственные фракции, отряды и машины; сохранение в файл или на Google Drive.
- **PWA / оффлайн** — установка на телефон без магазина, базовые функции без интернета; анимация бросков кубиков.

<p align="center">
  <img src="docs/screenshots/06-encyclopedia.png" alt="Энциклопедия" width="240" />
</p>

## Источники и правила

**Источники армлистов** (выбираются при создании армии):

- **Star System** *(сообщество)* — расширенные листы от [Star System](https://vk.com/bp_bnp): 44 отряда + 30 машин. По умолчанию.
- **Технолог Классик** *(официальный)* — оригинальные листы от [Технолог](http://www.tehnolog.ru/): 30 отрядов + 30 машин.

Любой источник сочетается с любым набором правил. Есть встроенный редактор для собственных листов.

**Наборы правил:**

- **Технолог** — базовые официальные правила.
- **Star System** *(сообщество)* — расширенные механики: зонные повреждения техники, спецэффекты оружия, тест паники, бонус за высоту.

## Быстрый старт

1. Откройте https://luxor.github.io/bronepehota/
2. Выберите набор правил и источник армлиста
3. Выберите фракцию и укажите лимит очков
4. Добавьте отряды и технику, нажмите «В бой»
5. Управляйте юнитами во вкладке «Войска», рассчитывайте бой во вкладке «Атака»

Или сразу в **[калькулятор боя](https://luxor.github.io/bronepehota/calculator)** — рассчитать выстрел, ближний бой или гранату без создания армии.

## Сообщество

Проект существует благодаря сообществу **[Star System — Бронепехота B&P](https://vk.com/bp_bnp)**: армлисты, правила, покрашенные миниатюры. Благодарности и контакты — в **[docs/COMMUNITY.md](docs/COMMUNITY.md)**.

## Документация

- **[DEVELOPMENT.md](DEVELOPMENT.md)** — для разработчиков (установка, команды, архитектура)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — как внести вклад (баг-репорты, новые юниты, PR)
- **[docs/COMMUNITY.md](docs/COMMUNITY.md)** — сообщество и благодарности
- **[CLAUDE.md](CLAUDE.md)** — структура проекта для AI-ассистента

## Лицензия

Проект создан с уважением к игре «Бронепехота» и не связан с компанией Технолог. Сделано через **Vibe Coding** — AI-ассистент пишет код под руководством человека.
````

- [ ] **Step 3: Проверить, что ссылки на изображения и документы разрешаются**

Run:
```bash
for f in docs/screenshots/01-landing.png docs/screenshots/02-army.png docs/screenshots/03-navigator.png docs/screenshots/04-combat.png docs/screenshots/05-calculator.png docs/screenshots/06-encyclopedia.png DEVELOPMENT.md CONTRIBUTING.md docs/COMMUNITY.md CLAUDE.md; do
  [ -f "$f" ] && echo "OK  $f" || echo "MISS $f"
done
```
Expected: все `OK`. `docs/COMMUNITY.md` будет создан в Task 3 — если задача выполняется последовательно, к этому моменту файла ещё нет; либо сначала выполнить Task 3, либо проигнорировать `MISS docs/COMMUNITY.md` до Task 3.

- [ ] **Step 4: Закоммитить README**

```bash
git add README.md
git commit -m "docs(readme): rewrite as lean player-facing landing, fix unit counts

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Создать docs/COMMUNITY.md

**Files:**
- Create: `docs/COMMUNITY.md`

**Interfaces:**
- Consumes: содержимое секции «Благодарности» из старого README (переносится сюда).
- Produces: целевая ссылка из README → `docs/COMMUNITY.md`.

- [ ] **Step 1: Создать `docs/COMMUNITY.md`**

Записать:

````markdown
# Сообщество и благодарности

Этот проект был бы невозможен без поддержки и вклада сообщества **[Star System — Бронепехота B&P](https://vk.com/bp_bnp)**.

## Особая благодарность

Выражаем искреннюю благодарность активным участникам сообщества, которые годами развивают вселенную игры:

- **За оригинальные армлисты и техлисты** — новый фундамент игровой механики. Методическая база, создававшаяся годами, позволяет новичкам и ветеранам наслаждаться игрой.
- **За разработку новых правил** — расширение механик, добавление глубины и тактического разнообразия.
- **За модернизацию армлистов** — постоянную работу по балансу и обновлению данных, поддерживая игру актуальной и интересной.
- **За сохранение истории** — архивирование материалов, создание баз знаний, помощь новичкам.

## Присоединяйтесь

Если вы хотите узнать больше об игре, найти партнёров для игр или внести свой вклад:

- **VK-группа**: [https://vk.com/bp_bnp](https://vk.com/bp_bnp)
- Участвуйте в обсуждениях, делитесь repaint-ами, предлагайте новые армлисты.

## Миниатюры

Фотографии покрашенных миниатюр в энциклопедии (9 отрядов: клон-пехота Поларис, киберпехота, спецназ и ополчение Протектората, мутанты) предоставлены **[Покрасы Шнайдера](https://vk.com/shnayder_brush)**.

Остальные изображения и армлисты — от сообщества **[Star System — Бронепехота B&P](https://vk.com/bp_bnp)**.
````

- [ ] **Step 2: Проверить, что README теперь ссылается на существующий файл**

Run: `[ -f docs/COMMUNITY.md ] && echo OK || echo MISS`
Expected: `OK`.

- [ ] **Step 3: Закоммитить**

```bash
git add docs/COMMUNITY.md
git commit -m "docs: extract community/credits to docs/COMMUNITY.md

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Финальная проверка

**Files:** без изменений (только проверка).

- [ ] **Step 1: Проверить целостность ссылок в README**

Run:
```bash
grep -oE '\(docs/[^)]+\)|\(DEVELOPMENT\.md\)|\(CONTRIBUTING\.md\)|\(CLAUDE\.md\)' README.md | tr -d '()' | while read p; do [ -f "$p" ] && echo "OK  $p" || echo "MISS $p"; done
```
Expected: все `OK`.

- [ ] **Step 2: Убедиться, что старые «битые» пути больше не упоминаются**

Run: `grep -nE 'docs/promo/screenshots' README.md`
Expected: пусто (нет выводена) — старые битые ссылки удалены.

- [ ] **Step 3: Проверить чистоту ветки**

Run: `git status --short`
Expected: только untracked `docs/superpowers/plans/2026-06-22-capture-hold-mission.md` (не относится к задаче, не коммитится). Никаких случайно staged файлов.

- [ ] **Step 4: Сводный лог коммитов ветки**

Run: `git log main..HEAD --oneline | cat`
Expected: 4 коммита (spec + screenshots + readme + community), либо 5 со spec'ом.

---

## Self-Review (исполнено автором плана)

- **Spec coverage:** Скриншоты → Task 1; худой README + точные числа + убранные секции → Task 2; COMMUNITY.md → Task 3; «битые ссылки устранены» → Task 4 Step 2. Покрыто полностью.
- **Placeholder scan:** TBD/TODO нет. Все числа, селекторы, пути, команды — конкретные.
- **Type consistency:** Имена файлов скриншотов в Task 1 (`01..06-*.png`) совпадают со ссылками в README (Task 2). Имя `docs/COMMUNITY.md` едино во всех задачах.
