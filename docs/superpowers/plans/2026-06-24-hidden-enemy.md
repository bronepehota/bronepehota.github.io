# Операция «Скрытый враг» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the «Операция "Скрытый враг"» story as a chronicle in «Хроники войн» and as a playable-reference mission `skrytyj_vrag` (new `ruthenium` campaign; first mercenaries-side mission), from the user's canon on the Second Ruthenium Conflict (~4537).

**Architecture:** Chronicle = one Markdown file in `src/content/campaigns/` consumed by the existing build-time loader (`src/lib/campaigns.ts`). Mission = one entry appended to `src/data/missions/missions.json` + one campaign appended to `src/data/missions/campaigns.json`, surfaced by the existing missions registry + `/encyclopedia/mission/[id]` route. Diagram PNG is a user-provided asset at `public/images/missions/skrytyj_vrag/diagram.png` (optional for build; mission renders without it).

**Tech Stack:** Next.js 14.2.35 (App Router, `output: 'export'`), TypeScript, Tailwind, Jest (`next/jest`), Playwright. No new dependencies.

## Global Constraints

- **Russian UI text**, English code conventions. All user-facing copy in Russian.
- **`output: 'export'` static export** for GitHub Pages — new pages must prerender at build. The mission detail route `/encyclopedia/mission/[id]` already has `generateStaticParams` (reads all missions), so a new mission auto-prerenders.
- **basePath**: internal nav uses Next `<Link>` (auto-prefixes).
- **Mission ids are bare slugs** (`hunter`, `salamander`, `puma`, `raptor`) — confirmed in `src/data/encyclopedia/units/{polaris,protectorate}/machines.json`. Mission participants link via `/encyclopedia/unit/${unitId}`.
- **No fabricated canon.** Chronicle prose is a faithful paraphrase of the spec appendix (the user's canon). No invented dates/events. The era is **4537** (Second Ruthenium Conflict, during «Бдительный Мир»).
- **Registry tests use `>0`**, not hard counts — adding entries won't break them; we ADD focused assertions instead.
- **E2E dev server** on `http://localhost:3001`; `beforeEach` clears localStorage; `waitForLoadState('networkidle')` after navigation.
- **Do not touch unrelated working-tree files**; `git add` only the files each task creates/changes.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/content/campaigns/skrytyj-vrag.md` | Chronicle: frontmatter (units, mission, era 4537) + narrative body | Create |
| `src/__tests__/lib/campaigns.test.ts` | + assertions for the new chronicle | Modify |
| `src/data/missions/campaigns.json` | + `ruthenium` campaign | Modify |
| `src/data/missions/missions.json` | + `skrytyj_vrag` mission (full entry) | Modify |
| `src/__tests__/lib/missions-registry.test.ts` | + assertions for the new mission & campaign | Modify |
| `public/images/missions/skrytyj_vrag/diagram.png` | User-provided deployment diagram | User provides |
| `e2e/missions.spec.ts` | + detail-page test for `skrytyj_vrag` | Modify |
| `e2e/campaigns.spec.ts` | + new chronicle visible in Хроники list | Modify |
| `src/app/campaigns/page.tsx` | + faint background-image layer | Modify (Task 4) |
| `src/app/campaigns/[slug]/page.tsx` | + faint background-image layer | Modify (Task 4) |
| `public/images/campaigns/chronicle-bg.jpg` | Abstract military bg asset (user-provided) | User provides (Task 4) |

---

### Task 1: Chronicle «Скрытый враг»

**Files:**
- Create: `src/content/campaigns/skrytyj-vrag.md`
- Modify: `src/__tests__/lib/campaigns.test.ts`

**Interfaces:**
- Consumes: the existing `getAllCampaigns()` loader (Task 1 only needs the `.md` to exist with the right frontmatter).
- Produces: a chronicle whose `slug` is `skrytyj-vrag`, `title` is `Операция «Скрытый враг»`, with a `units` roster and one entry in `missions`.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/lib/campaigns.test.ts`, append two new `it(...)` blocks inside the existing `describe('campaigns loader', ...)` (after the existing tests, before the closing `});`):

```ts
  it('discovers the Скрытый враг chronicle', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag');
    expect(sv).toBeDefined();
    expect(sv!.title).toBe('Операция «Скрытый враг»');
  });

  it('Скрытый враг has a units roster and a mission', () => {
    const sv = getAllCampaigns().find((c) => c.slug === 'skrytyj-vrag')!;
    expect(sv.units?.length).toBeGreaterThan(0);
    expect(
      sv.units?.some((u) => u.id === 'mercenaries_piraty_markusa_novye')
    ).toBe(true);
    expect(sv.missions?.length).toBe(1);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/lib/campaigns.test.ts`
Expected: FAIL — `sv` is `undefined` (no `skrytyj-vrag.md` yet).

- [ ] **Step 3: Create the chronicle Markdown file**

Create `src/content/campaigns/skrytyj-vrag.md` with exactly this content:

```md
---
slug: skrytyj-vrag
title: Операция «Скрытый враг»
subtitle: Второй рутенийский конфликт
era: "4537"
factions: [mercenaries, protectorate]
order: 2
units:
  - { id: mercenaries_piraty_markusa_novye, role: «Банда пиратов Маркуса» }
  - { id: mercenaries_reydery_pylnoy_zony, role: «Рейдеры Пыльной Зоны» }
  - { id: protectorate_voyska_planety_ruteniya, role: «Войска Рутении» }
  - { id: protectorate_ruteniyskaya_gvardiya, role: «Рутенийская гвардия» }
  - { id: protectorate_spetsnaz_planety_felitsiya, role: «Рота "Валькирия"» }
missions:
  - { name: Скрытый враг, box: Рутения }
---

## Месть Империи

Империя Полярис, выбитая с планеты Рутения — Ржавого Осколка — сразу после Третьей Волны, не оставляла мыслей о реванше. Имперская разведка пристально следила за профессором Филиппом Реббитом: тем самым геологом и вулканологом, чьи тектонические заряды уничтожили значительную часть имперского гарнизона и позволили Протекторату отбить планету. Агенты донесли, что Реббит занят новым секретным проектом — уникальными излучателями сигналов и резонаторами нового поколения. Дело постановили: налёт на лабораторию, изъять наработки, а учёного — похитить или уничтожить.

Но **«Бдительный Мир»** исключал прямое вторжение и спецназ — провал мог вновь развязать полномасштабную войну. И тогда разведка Империи пошла проверенной формулой Протектората: грязную работу — чужими руками. Налёт поручили пиратам-наёмникам, обставив как обычный рейд.

## Чужими руками

Имперское командование вновь обратилось к адмиралу **Маркусу Трёхглазому**. Ставку адмирал сделал на самые преданные ему кланы — **Банду пиратов Маркуса**; за немалое вознаграждение те согласились захватить комплекс и изъять разработки Реббита.

Чтобы блокировать связь комплекса с внешним миром, Маркус подключил специалистов по захвату индустриальных объектов — **Рейдеров Пыльной Зоны**. Эти сорвиголовы прославились «коридорными войнами» — боями в замкнутом пространстве, от узлов связи до корабельных коридоров. Действовать предстояло в подземных лабиринтах лабораторий — лучшего отряда не сыскать.

Командовать операцией назначили одного из лучших полевых командиров Маркуса — **Свена «Локи» Торвардсона**. План: Рейдеры вскрывают комплекс и глушат связь, Банда Маркуса на поверхности прикрывает выход, а для отвода глаз у космопорта поднимают «бунт» среди шахтёров. Эвакуация — с космопорта на низкую орбиту, пока стража отвлечена.

## Ход операции

За несколько дней до срока агент передал координаты входов в комплекс и подробную план-схему подземных уровней, а заодно временно вывел из строя спутники слежения — проделав «дыру» в противокосмической обороне. Рейдер вынырнул из гиперпространства у самой планеты и сбросил десантные шаттлы и боевые катера: каждый шаттл нёс 30–40 пиратов с тяжёлым вооружением либо четыре имперских багги огневой поддержки.

Случайность всё испортила. Один катер наткнулся на рутенийский пост аэроконтроля и не дал полётных кодов; попытка уничтожить пост кончилась тем, что катер сбили рутенийские перехватчики. Через полчаса у комплекса объявили тревогу.

В то же время Рейдеры скрытно проникли через вспомогательный ход и за десять минут захватили резервный командный центр. Запустив вирус, они парализовали связь — персонал так и не успел позвать на помощь — и отключили защитные системы, открыв дорогу другим группам. Комплекс оказался почти беззащитным.

## «Валькирия»

Группа с боями прорывалась на нижние уровни, к подземным лабораториям. Но имперская разведка не знала главного: новейший проект профессора заказало и оплатило правительство **Фелиции**. Для охраны лабораторий и самого Реббита оно прислало на Рутению противодиверсионную роту **«Валькирия»** под командованием полковника **Марты Керри** — дочери героини битвы на Фелиции, капитан-адмирала Керри. Вступив в бой, женщины-воительницы заставили Рейдеров отступить.

Но Рейдеры сполна оправдали звание лучших бойцов «коридорной войны». Уступая «Валькириям» в броне и вооружении, они имели множество специальных приспособлений именно для тесноты. Бросившись за якобы сломленным врагом, фелицианки попали в ловушки, расставленные при отступлении, и понесли огромные потери. С подкреплением из захваченного центра шквальный огонь пиратов добил оставшихся. Реббит был найден в одной из лабораторий; скопировав данные, пираты заминировали всё вокруг и вышли на поверхность.

## Трагический финал

На поверхности их уже ждал полноценный бой. Рутенийские отряды при поддержке шагающих танкеток и новейших фелицианских лёгких шагающих танков методично теснили Банду Маркуса у шахтёрского посёлка. В критической обстановке Локи оставил большую часть людей сдерживать бой, а мобильной группе на багги приказал прорываться с профессором к точке эвакуации.

Разъярённая гибелью подчинённых, полковник Керри увидела уходящую колонну и на своём шагающем танке бросилась в погоню. Она разнесла несколько бронемашин в щепы… а в одной из них сидел профессор Филипп Реббит со всеми скопированными данными. Ослеплённая местью командир «Валькирий» убила того, кого обязана была защищать. Танк Керри протаранил багги, и в небе появились пиратские катера.

Свен «Локи» Торвардсон с выжившими благополучно эвакуировался и ушёл гиперпрыжком к Империи. Данные добыть не удалось, оборудование уничтожено — но Реббит мёртв, и адмирал Маркус остался доволен. Полковника Керри военный трибунал лишил всех наград, разжаловал и отправил на пожизненные рудники планетоида Рэдхелл-9.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/__tests__/lib/campaigns.test.ts`
Expected: PASS (all tests, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add src/content/campaigns/skrytyj-vrag.md src/__tests__/lib/campaigns.test.ts
git commit -m "feat(campaigns): «Операция Скрытый враг» chronicle (Second Ruthenium conflict, 4537)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Mission `skrytyj_vrag` + `ruthenium` campaign

**Files:**
- Modify: `src/data/missions/campaigns.json`
- Modify: `src/data/missions/missions.json`
- Modify: `src/__tests__/lib/missions-registry.test.ts`

**Interfaces:**
- Consumes: the existing registry selectors `getMission(id)` and `getAllCampaigns()` (both already imported in the test).
- Produces: a mission `skrytyj_vrag` (campaign `ruthenium`, factions `['mercenaries','protectorate']`) and a campaign `ruthenium`, which the existing `/encyclopedia/mission/[id]` route + missions registry surface automatically.

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/lib/missions-registry.test.ts`, add a new `describe` block at the end of the file (after the existing closing `});` of the top-level describe — or a new `it(...)` inside it; either is fine. Add:

```ts
describe('skrytyj_vrag mission', () => {
  it('exists in the ruthenium campaign as mercenaries vs protectorate', () => {
    const m = getMission('skrytyj_vrag');
    expect(m).toBeDefined();
    expect(m!.campaign).toBe('ruthenium');
    expect(m!.factions).toContain('mercenaries');
    expect(m!.factions).toContain('protectorate');
    expect(m!.objectives.mercenaries).toBeTruthy();
    expect(m!.objectives.protectorate).toBeTruthy();
  });

  it('maps the canon machines to participants', () => {
    const m = getMission('skrytyj_vrag');
    expect(m!.participants?.mercenaries?.some((u) => u.unitId === 'hunter')).toBe(true);
    expect(m!.participants?.protectorate?.some((u) => u.unitId === 'salamander')).toBe(true);
    expect(m!.participants?.protectorate?.some((u) => u.unitId === 'puma')).toBe(true);
  });

  it('exposes the ruthenium campaign', () => {
    expect(getAllCampaigns().some((c) => c.id === 'ruthenium')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/__tests__/lib/missions-registry.test.ts`
Expected: FAIL — `getMission('skrytyj_vrag')` returns undefined / campaign `ruthenium` not found.

- [ ] **Step 3: Add the `ruthenium` campaign**

In `src/data/missions/campaigns.json`, append a new object before the closing `]` (after the `classic` entry). The file becomes:

```json
[
  {
    "id": "cerber",
    "name": "Цербер",
    "intro": "Боевые действия между войсками Империи «Полярис» и Торгового Протектората перекинулись на окраины исследованного космоса. Одним из центров столкновений стала малонаселенная планета Цербер в секторе малых Тильмид. Кто сможет установить контроль над планетой? Войска высажены. Сражение за Цербер начинается."
  },
  {
    "id": "classic",
    "name": "Классические сценарии",
    "intro": "Помимо сюжетных операций, в сражениях «Бронепехоты» применяются классические сценарии-шаблоны, знакомые по множеству настольных варгеймов. Они не привязаны к конкретной планете или фракции: обе стороны имеют одинаковые условия победы и самостоятельно набирают армии под заданный бюджет. Перед игрой договоритесь о числе точек (обычно 2, 3 или 5) и количестве ходов."
  },
  {
    "id": "ruthenium",
    "name": "Рутенийские конфликты",
    "intro": "«Бдительный Мир» лишь заморозил большую войну, уступив место тайным операциям и малым ударным группам. Рутения — Ржавый Осколок на краю Буферной Зоны — помнит годы имперского ига и своё восстание 4531 года. Здесь, в тени мира, чужими руками режиссируются новые удары."
  }
]
```

(Only the `ruthenium` object is new — keep `cerber` and `classic` exactly as they were.)

- [ ] **Step 4: Add the `skrytyj_vrag` mission**

In `src/data/missions/missions.json`, append this object to the end of the top-level array (after the `zahvat_tochek` entry), adding a comma after the previous entry's closing `}`:

```json
{
  "id": "skrytyj_vrag",
  "name": "Скрытый враг",
  "order": 8,
  "campaign": "ruthenium",
  "factions": ["mercenaries", "protectorate"],
  "tagline": "Тёмный рейд под прикрытием «Бдительного Мира». «Скрытый враг» — Империя, бьющая чужими руками. Чья сторона — твоя: пират-наёмник Свена «Локи» или защитник Рутении из роты «Валькирия»?",
  "summary": "По тайному заказу имперской разведки пираты Маркуса и Рейдеры Пыльной Зоны рейдят подземную лабораторию профессора Реббита на Рутении, чтобы захватить учёного и его разработки. Комплекс защищают войска Рутении и фелицианская рота «Валькирия».",
  "briefing": {
    "setting": "СОВЕРШЕННО СЕКРЕТНО. Планета Рутения (Ржавый Осколок). Штаб адмирала Маркуса Трёхглазого. Командиру сводной группы Свену «Локи» Торвардсону:",
    "order": "«Бдительный Мир» не оставляет нам прямого вторжения, поэтому дело поручено вам и вашим людям. Задача: выйти на подземный лабораторно-испытательный комплекс профессора Филиппа Реббита, изъять все научные наработки, а самого учёного — либо захватить, либо, в крайнем случае, уничтожить. Рейдеры Пыльной Зоны вскрывают комплекс через вспомогательные ходы и глушат связь. Банда Маркуса на поверхности прикрывает выход и устраивает беспорядки у космопорта для отвода глаз. Эвакуация — с ближайшего космопорта на низкую орбиту.\n\n— Адмирал Маркус Трёхглазый",
    "report": "Говорит Свен «Локи» Торвардсон. Рейдеры вошли чисто, связь мы срезали за десять минут — комплекс лежал беззащитным. На нижних уровнях выяснилось то, о чём разведка промолчала: лаборатории охраняла фелицианская «Валькирия» под командованием полковника Марты Керри. В коридорах они нас потрепали — но в «коридорном бою» Рейдерам равных нет: отступая, мы загнали «Валькирии» в ловушки и положили почти всех. Реббит найден, данные скопированы.\n\nНа поверхности начался ад: рутенийцы прижали Банду у шахтёрского посёлка. Я увёл профессора на багги к точке эвакуации, оставив остальных сдерживать бой. И тут за нами погналась сама Керри — на своём шагающем танке. Она разнесла колонну в щепы… и в одной из подорванных ею машин сидел профессор Реббит — тот, кого она обязана была защитить. Данные мы не вывезли, оборудование уничтожено. Но Реббит мёртв — и адмирал остался доволен. Полковника Керри после трибунала разжаловали и отправили на рудники Рэдхелл-9."
  },
  "setup": "Подготовьте стол по диаграмме. В центре — подземный комплекс Реббита: основной вход и несколько вспомогательных, ведущих в лабиринт коридоров и нижних лабораторий. На одном фланге — шахтёрский посёлок, на другом — космопорт (точка эвакуации). Рейдеры Пыльной Зоны входят через вспомогательный ход; Банда пиратов Маркуса высаживается у шахтёрского посёлка, прикрывая выход на поверхность; войска Рутении и рота «Валькирия» защищают комплекс и подходы к космопорту.",
  "parameters": { "turnCount": 8, "firstMove": "mercenaries", "rulesVariant": "быстрые правила" },
  "objectives": {
    "mercenaries": { "text": "Прорваться в комплекс, захватить профессора Реббита (либо его данные) и эвакуировать с космопорта за 8 ходов." },
    "protectorate": { "text": "Не дать похитить профессора и удержать комплекс до конца боя." }
  },
  "specialRules": [
    "Профессор Филипп Реббит должен остаться жив — он ценнее любых данных. Игрок, чей солдат «уничтожит» профессора, сразу считается проигравшим (каноничная ирония операции: в «Скрытом враге» профессора убила именно защитница — полковник Марта Керри)."
  ],
  "diagramImage": "/images/missions/skrytyj_vrag/diagram.png",
  "participants": {
    "mercenaries": [
      { "name": "Банда пиратов Маркуса", "type": "squad", "unitId": "mercenaries_piraty_markusa_novye" },
      { "name": "Рейдеры Пыльной Зоны", "type": "squad", "unitId": "mercenaries_reydery_pylnoy_zony" },
      { "name": "Имперские багги (Хантер)", "type": "machine", "unitId": "hunter" }
    ],
    "protectorate": [
      { "name": "Войска Рутении", "type": "squad", "unitId": "protectorate_voyska_planety_ruteniya" },
      { "name": "Рутенийская гвардия", "type": "squad", "unitId": "protectorate_ruteniyskaya_gvardiya" },
      { "name": "Рота «Валькирия» (спецназ Фелиции)", "type": "squad", "unitId": "protectorate_spetsnaz_planety_felitsiya" },
      { "name": "Фелицианские шагающие танки (Саламандра)", "type": "machine", "unitId": "salamander" },
      { "name": "Шагающие танкетки (Пума)", "type": "machine", "unitId": "puma" }
    ]
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest src/__tests__/lib/missions-registry.test.ts`
Expected: PASS (all, including the three new `skrytyj_vrag mission` tests).

- [ ] **Step 6: type-check + commit**

Run: `npm run type-check`
Expected: no errors.

```bash
git add src/data/missions/campaigns.json src/data/missions/missions.json src/__tests__/lib/missions-registry.test.ts
git commit -m "feat(missions): skrytyj_vrag mission + ruthenium campaign (first mercenaries-side mission)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Diagram dir + E2E + full verification

**Files:**
- Create: `public/images/missions/skrytyj_vrag/` (directory; user drops `diagram.png` here)
- Modify: `e2e/missions.spec.ts`
- Modify: `e2e/campaigns.spec.ts`

- [ ] **Step 1: Create the diagram directory**

```bash
mkdir -p public/images/missions/skrytyj_vrag
```

The user provides the deployment diagram as `public/images/missions/skrytyj_vrag/diagram.png`. The build/prerender does NOT require the image to exist (it is rendered as a plain `<img>` at runtime), so the mission page works without it; the diagram simply appears once the PNG is placed.

- [ ] **Step 2: Add the mission detail E2E test**

In `e2e/missions.spec.ts`, add this test inside the existing `test.describe('Миссии', ...)` block (after the existing `'/encyclopedia/mission/osvobozhdenie'` test):

```ts
  test('энциклопедия: миссия «Скрытый враг» (наёмники vs протекторат) открывается', async ({ page }) => {
    await page.goto('/encyclopedia/mission/skrytyj_vrag');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toContainText('Скрытый враг');
    await expect(page.getByText('Условия победы')).toBeVisible();
    await expect(page.getByText('Особые правила')).toBeVisible();
    // mercenaries-side roster present (first mercenaries mission)
    await expect(page.getByText('Рейдеры Пыльной Зоны')).toBeVisible();
  });
```

- [ ] **Step 3: Add the chronicle E2E assertion**

In `e2e/campaigns.spec.ts`, inside the existing `test.describe('Хроники войн', ...)`, add a test that the new chronicle appears in the list:

```ts
  test('в Хрониках видна операция «Скрытый враг»', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-testid="campaign-card"]', { hasText: 'Скрытый враг' }).first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Операция «Скрытый враг»' })).toBeVisible();
  });
```

- [ ] **Step 4: Run the full unit + type-check + lint gate**

Run: `npm run validate`
Expected: PASS (type-check + lint + ~1150 unit tests; the new campaigns/missions tests included).

- [ ] **Step 5: Run the production build (REQUIRED — verifies prerender)**

Run: `NEXT_PUBLIC_GITHUB_PAGES=true npm run build`
Expected: reaches `✓ Generating static pages (NN/NN)` with NO errors; confirm `/campaigns/skrytyj-vrag`, `/encyclopedia/mission/skrytyj_vrag`, and the missions list prerender.

- [ ] **Step 6: Run the affected E2E specs**

Run: `npm run test:e2e -- missions.spec.ts campaigns.spec.ts`
Expected: all tests PASS (including the two new ones).

- [ ] **Step 7: Commit**

```bash
git add e2e/missions.spec.ts e2e/campaigns.spec.ts
git commit -m "test(e2e): Скрытый враг mission + chronicle

Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] **Step 8: Diagram handoff**

If the user has not yet provided `public/images/missions/skrytyj_vrag/diagram.png`, leave a note: the mission is fully functional; the deployment diagram appears once the PNG is dropped at that path.

---

### Task 4: Хроники section background (abstract military image)

**Files:**
- Modify: `src/app/campaigns/page.tsx`
- Modify: `src/app/campaigns/[slug]/page.tsx`
- Asset (user-provided): `public/images/campaigns/chronicle-bg.jpg`

**Context:** The user provided an abstract military image to serve as a faint atmospheric background across the whole Хроники section (not mission-specific). Both campaign pages already stack background layers (`diagonal-stripes` + `film-grain-overlay` + vignette over `bg-military-dark`); this adds one image layer at the bottom at low opacity so prose stays readable.

- [ ] **Step 1: Place the background asset**

Drop the user's abstract military image at `public/images/campaigns/chronicle-bg.jpg`. If absent during dev, the page still renders (the layer just loads no image); the build is unaffected.

- [ ] **Step 2: Add the background layer to the campaigns LIST page**

In `src/app/campaigns/page.tsx`, add a basePath-aware constant after the imports:

```tsx
const BASE_PATH = process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ? '/bronepehota' : '';
const CHRONICLE_BG = `${BASE_PATH}/images/campaigns/chronicle-bg.jpg`;
```

Then inside `<main ...>`, as the FIRST child (before the `diagonal-stripes` div), add:

```tsx
        {/* Atmospheric chronicle background (abstract military image, faint) */}
        <div
          className="fixed inset-0 bg-cover bg-center opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: `url(${CHRONICLE_BG})` }}
        />
```

- [ ] **Step 3: Add the same layer to the campaigns DETAIL page**

Repeat Step 2 in `src/app/campaigns/[slug]/page.tsx`: add the same `BASE_PATH` / `CHRONICLE_BG` constants after the imports, and the same `<div>` as the first child of `<main>` (before its `diagonal-stripes` layer).

- [ ] **Step 4: Verify type-check + build + visual readability**

Run: `npm run type-check` (expect no errors).
Run: `NEXT_PUBLIC_GITHUB_PAGES=true npm run build` (expect `✓ Generating static pages`, no errors).
Then visually confirm: start dev, open `/campaigns` and `/campaigns/korporativnye-voyny`, and check text is legible over the faint background. If the image is too strong, drop `opacity-[0.08]` to `opacity-[0.05]`.

- [ ] **Step 5: Commit**

```bash
git add src/app/campaigns/page.tsx "src/app/campaigns/[slug]/page.tsx"
# if the asset is placed now, also: git add public/images/campaigns/chronicle-bg.jpg
git commit -m "feat(campaigns): faint abstract-military background for Хроники section

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review (completed)

**1. Spec coverage:**
- Chronicle in Хроники войн (markdown, era 4537, roster) → Task 1. ✓
- `ruthenium` campaign in campaigns.json → Task 2 Step 3. ✓
- `skrytyj_vrag` mission (factions merc+prot, briefing, setup, objectives, specialRules VIP-twist, parameters, participants with Hunter/Salamander/Puma) → Task 2 Step 4. ✓
- Diagram PNG at `/images/missions/skrytyj_vrag/diagram.png` (user-provided) → Task 3 Step 1/8. ✓
- Verification (type-check, jest, `NEXT_PUBLIC_GITHUB_PAGES=true build`, E2E) → Task 3. ✓
- Locked decisions (era 4537; merc first move; machine ids bare) → reflected in data + Global Constraints. ✓

**2. Placeholder scan:** none — every code/data step has complete content; the diagram is the only user-supplied asset and is explicitly optional for the build.

**3. Type consistency:** mission `id`/`campaign`/`factions`/`objectives`/`participants` match `Mission`/`MissionParticipant` types and the registry selectors used in tests (`getMission`, `getAllCampaigns` — both already imported). Chronicle frontmatter shape matches the existing `korporativnye-voyny.md` (same loader). Machine unitIds are bare slugs, consistent with the existing `raptor` participant and confirmed in encyclopedia machines JSON.

**Risk noted:** this is the first mission with a `mercenaries` faction. `mission-army.ts` and `MissionDetailPage` are faction-generic (verified), and the build prerender + the new E2E test confirm it renders. If any color/label helper assumed only polaris/protectorate, the build or E2E will surface it.
