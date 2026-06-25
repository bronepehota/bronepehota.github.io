# Хроники войн + лор Велиана/Шиду — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable in-app «Хроники войн» section that renders campaign stories from build-time-imported Markdown, seeded with «Хало и Вахо 2», and update the encyclopedia lore of Велиан and Шиду with their official docx canon.

**Architecture:** Markdown files live in `src/content/campaigns/*.md` (frontmatter + body). A server module `src/lib/campaigns.ts` reads them with `fs` at build time, parses frontmatter with `gray-matter`, and compiles the body to HTML with `remark` + `remark-gfm` + `remark-html`. Two App Router server-component routes render them: `/campaigns` (list) and `/campaigns/[slug]` (detail, via `generateStaticParams`). The body HTML is injected with `dangerouslySetInnerHTML` styled by `@tailwindcss/typography` (`prose prose-invert`). The encyclopedia lore of two squads is edited in place (5-key shape unchanged).

**Tech Stack:** Next.js 14.2.35 (App Router, `output: 'export'`), TypeScript, Tailwind CSS, `gray-matter`, `remark`, `remark-gfm`, `remark-html`, `@tailwindcss/typography`, Jest (`next/jest`), Playwright.

> **Spec deviation (flagged):** The spec named `react-markdown` for rendering. This plan uses `remark`→HTML at **build** time instead. Same user-visible outcome (static HTML, no client-side parsing), but avoids React-server-component boundary quirks under `output: 'export'` and ships zero extra client JS. The trusted first-party content makes `dangerouslySetInnerHTML` safe (no `rehype-sanitize` needed).

## Global Constraints

- **Russian UI text**, English code conventions. All user-facing copy in Russian.
- **Mobile-first**, Tailwind dark theme (`slate-950/900` base, `military-amber` / `hud-green` accents).
- **`output: 'export'` static export** for GitHub Pages. Every new page must prerender at build — detail pages MUST implement `generateStaticParams`.
- **basePath**: use Next `<Link href="/...">` (auto-prefixes). Never bare `<a href="/...">` for internal nav.
- **Encyclopedia lore 5-key shape is enforced** by `src/__tests__/lib/encyclopedia-squad-lore.test.ts` (`class, history, lore, shortDescription, tactics` exactly; 32 squads). This plan only edits `lore`/`history` **values** — never keys — so the test stays green.
- **No fabricated canon.** All lore prose is paraphrased from the official docx (appendix in the spec). No invented dates, battles, or named characters.
- **No Latin/CJK bleed** in lore text (the lore test rejects `\b[A-Za-z]{4,}\b`). Keep all prose Cyrillic.
- **E2E dev server** auto-starts on `http://localhost:3001`. `beforeEach` clears localStorage; `await page.waitForLoadState('networkidle')` after navigation.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/content/campaigns/halo-i-vakho-2.md` | First campaign: frontmatter (units, missions, era) + narrative body | Create |
| `src/lib/campaigns.ts` | Build-time loader: `getAllCampaigns()` (sync, meta only), `getCampaign(slug)` (async, +rendered HTML) + types | Create |
| `src/__tests__/lib/campaigns.test.ts` | Unit test: discovery + frontmatter parsing + sorting | Create |
| `src/app/campaigns/page.tsx` | List page (server component) — cards linking to detail | Create |
| `src/components/landing/Footer.tsx` | Add «ХРОНИКИ» nav link (testid `campaigns-link`) | Modify |
| `src/app/campaigns/[slug]/page.tsx` | Detail page (server component): `generateStaticParams`, render body + units + missions | Create |
| `tailwind.config.ts` | Register `@tailwindcss/typography` plugin | Modify |
| `src/data/encyclopedia/units/protectorate/squads.json` | Велиан `lore`/`history` → official docx canon | Modify |
| `src/data/encyclopedia/units/polaris/squads.json` | Шиду `lore`/`history` → official docx canon | Modify |
| `e2e/campaigns.spec.ts` | E2E: list → detail flow + footer nav | Create |

---

### Task 1: Campaign content + data loader (with deps)

**Files:**
- Create: `src/content/campaigns/halo-i-vakho-2.md`
- Create: `src/lib/campaigns.ts`
- Create: `src/__tests__/lib/campaigns.test.ts`

**Interfaces:**
- Produces: `getAllCampaigns(): CampaignMeta[]` (sync), `getCampaign(slug: string): Promise<Campaign | null>` (async), and types `CampaignMeta`, `Campaign`, `CampaignUnit`, `CampaignMission`. Later tasks consume these.

- [ ] **Step 1: Install dependencies**

```bash
npm install gray-matter remark remark-gfm remark-html
```

Expected: packages added to `dependencies` in `package.json`; install succeeds.

- [ ] **Step 2: Create the campaign Markdown file**

Create `src/content/campaigns/halo-i-vakho-2.md` with exactly this content:

```md
---
slug: halo-i-vakho-2
title: Хало и Вахо 2
subtitle: Войны корпораций
era: "4546"
factions: [polaris, protectorate, mercenaries]
order: 1
units:
  - id: protectorate_tyazhyolaya_shturmovaya_pehota_veliana
    role: «Велианские штурмовики»
  - id: polaris_spetsnaz_planety_shidu
    role: «Шидуанский спецназ»
  - id: protectorate_spetsnaz_planety_felitsiya
    role: «Фелицианский спецназ»
  - id: protectorate_ruteniyskaya_gvardiya
    role: «Рутенийская гвардия»
  - id: mercenaries_piraty_markusa_novye
    role: «Пираты Маркуса»
  - id: mercenaries_piraty_markusa_starye
    role: «Пираты Маркуса (ветераны)»
  - id: mercenaries_reydery_pylnoy_zony
    role: «Рейдеры Пыльной Зоны»
missions:
  - name: Зачистка
    box: Рейдеры
  - name: Освобождение
    box: Пираты Маркуса
  - name: Диверсия
    box: Фелицианки
  - name: Хаос
    box: Рутенийцы
---

## Корпоративные войны

На грани всеобщего уничтожения застыла галактическая война. Хрупкое равновесие наступило после смертоносной демонстрации новейших типов оружия: Империя Полярис и Торговый Протекторат заключили **«Бдительный мир»**. Огромные флотилии застыли на орбитах своих ключевых миров, уступив место малым ударным группам.

Захват Империей большинства сырьевых планет Протектората привёл к тому, что крупные компании начали испытывать дефицит сырья. Острая конкуренция взвинтила цены, и взоры добывающих компаний обратились к планетам периферии и Буферной Зоны — добыча сырья там не облагалась налогом. Вскоре в дележе источников сырья появились и новые игроки: частные компании, занявшиеся добычей в приграничье, где государственные комбинаты не строились из-за нестабильной обстановки.

## Велиан и концерн РуВел

Со времён «Бдительного Мира» **Велиан** — планета, бывшая ареной одной из самых кровопролитных битв, — превратился в общегалактический торговый центр. По единственному официальному договору Велиан получил статус свободной планеты: торговые агенты обеих супердержав открыли там представительства, и торговля между Империей и Протекторатом шла беспошлинно.

Огромные финансовые вливания позволили корпорации **Дженерал МехсДайнемикс** стать крупнейшим конгломератом планеты — и буквально выпотрошить из Велиана и окрестных миров все ценные ресурсы. Чтобы избежать краха, она объединилась с Рутенийской компанией **Румет** (добыча руды и продажа металлов) в концерн **РуВел**, начавший освоение миров Буферной зоны.

## Театр войны — планета Мантис

На планете **Мантис**, ставшей ареной затяжной партизанской войны ещё в ходе Третьей Волны вторжения, мир так и не наступил: несколько политических группировок продолжали гражданскую войну, многие предприятия закрылись. Но природные богатства Мантиса притянули взгляды концерна РуВел. Чтобы не привлекать внимания, концерн заключил сделку с одной из воюющих группировок и нанял для охраны горнодобывающих предприятий **Фелицианский спецназ**.

Имперский концерн **СатенМинингКомпани**, хоть и не планировал сам разрабатывать недра Мантиса, обратил внимание на активность РуВел. Чтобы ослабить конкурентов, СатенМинингКомпани наняла пиратов для набегов на велианские предприятия. Но пиратам пришлась по душе обстановка на планете: они обосновались в небольшом городке горняков вблизи нескольких шахт. После разграбления ряда предприятий компания РуВел воззвала к своим правительствам — и на Мантис для борьбы с пиратством прибыли **Рутенийская гвардия** и **Велианские штурмовики**.

Крупнейшая шидуанская компания **Сакурай Метал Мининг**, бывшая на грани банкротства, решила осваивать Западную Буферную Зону: все ископаемые Шиду были выкачаны ещё во времена Золотой Сотни, а ресурсы звёздной системы — в период оккупации Торговым Протекторатом. Через менеджеров СатенМинингКомпани правление Сакурай узнало, что наиболее перспективна планета Мантис, но там нестабильная обстановка и орудует РуВел. Под давлением директоров правительство Шиду организовало рейд **Шидуанского спецназа** для уничтожения охраны интересующих предприятий.

Война за богатейшие шахты Мантиса в самом разгаре. Кто захватит богатства планеты, а кто разорится — зависит от тебя.
```

- [ ] **Step 3: Write the failing unit test**

Create `src/__tests__/lib/campaigns.test.ts`:

```ts
import { getAllCampaigns } from '@/lib/campaigns';

describe('campaigns loader', () => {
  it('discovers the Хало и Вахо 2 campaign', () => {
    const all = getAllCampaigns();
    expect(all.length).toBeGreaterThan(0);
    const hv2 = all.find((c) => c.slug === 'halo-i-vakho-2');
    expect(hv2).toBeDefined();
    expect(hv2!.title).toBe('Хало и Вахо 2');
  });

  it('parses units and missions frontmatter', () => {
    const hv2 = getAllCampaigns().find((c) => c.slug === 'halo-i-vakho-2')!;
    expect(hv2.units?.length).toBeGreaterThan(0);
    expect(
      hv2.units?.some((u) => u.id === 'protectorate_tyazhyolaya_shturmovaya_pehota_veliana')
    ).toBe(true);
    expect(hv2.missions?.length).toBe(4);
  });

  it('sorts campaigns by order', () => {
    const all = getAllCampaigns();
    expect(all[0].slug).toBe('halo-i-vakho-2');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest src/__tests__/lib/campaigns.test.ts`
Expected: FAIL — `Cannot find module '@/lib/campaigns'`.

- [ ] **Step 5: Implement the loader**

Create `src/lib/campaigns.ts`:

```ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface CampaignUnit {
  id: string;
  role: string;
}

export interface CampaignMission {
  name: string;
  box: string;
}

export interface CampaignMeta {
  slug: string;
  title: string;
  subtitle?: string;
  era?: string;
  factions?: string[];
  units?: CampaignUnit[];
  missions?: CampaignMission[];
  order?: number;
}

export interface Campaign extends CampaignMeta {
  bodyHtml: string;
}

const CAMPAIGNS_DIR = path.join(process.cwd(), 'src', 'content', 'campaigns');

function readFrontmatter(slug: string) {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, 'utf8');
  return matter(raw);
}

// Sync: frontmatter only (no Markdown rendering). Safe to call in Jest.
export function getAllCampaigns(): CampaignMeta[] {
  if (!fs.existsSync(CAMPAIGNS_DIR)) return [];
  const files = fs.readdirSync(CAMPAIGNS_DIR).filter((f) => f.endsWith('.md'));
  const metas = files.map((f) => {
    const slug = f.replace(/\.md$/, '');
    const { data } = readFrontmatter(slug);
    return { slug, ...(data as Omit<CampaignMeta, 'slug'>) };
  });
  metas.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  return metas;
}

// Async: dynamically imports remark (ESM-only) so the module stays Jest-importable.
export async function getCampaign(slug: string): Promise<Campaign | null> {
  const fullPath = path.join(CAMPAIGNS_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const { data, content } = readFrontmatter(slug);
  const { remark } = await import('remark');
  const { default: remarkGfm } = await import('remark-gfm');
  const { default: remarkHtml } = await import('remark-html');
  const bodyHtml = String(
    await remark().use(remarkGfm).use(remarkHtml).process(content)
  );
  return { slug, ...(data as Omit<CampaignMeta, 'slug'>), bodyHtml };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest src/__tests__/lib/campaigns.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/content/campaigns/halo-i-vakho-2.md src/lib/campaigns.ts src/__tests__/lib/campaigns.test.ts package.json package-lock.json
git commit -m "feat(campaigns): markdown content + build-time loader

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Campaign list page + landing nav link

**Files:**
- Create: `src/app/campaigns/page.tsx`
- Modify: `src/components/landing/Footer.tsx` (add nav link)

**Interfaces:**
- Consumes: `getAllCampaigns(): CampaignMeta[]` from Task 1.

- [ ] **Step 1: Add «ХРОНИКИ» link to the landing Footer**

In `src/components/landing/Footer.tsx`, insert a new `<Link>` immediately after the ЭНЦИКЛОПЕДИЯ link (after the closing `</Link>` of the encyclopedia block, before the `{/* Editor link */}` comment):

```tsx
          {/* Chronicles link */}
          <Link
            href="/campaigns"
            data-testid="campaigns-link"
            className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-all duration-300 group touch-manipulation whitespace-nowrap"
          >
            <span className="font-russo text-[10px] md:text-xs text-slate-400 group-hover:text-military-amber transition-colors">
              ХРОНИКИ
            </span>
          </Link>
```

- [ ] **Step 2: Create the list page**

Create `src/app/campaigns/page.tsx`:

```tsx
import Link from 'next/link';
import { getAllCampaigns } from '@/lib/campaigns';

export default async function CampaignsPage() {
  const campaigns = await getAllCampaigns();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <h1
          data-testid="campaigns-title"
          className="font-russo text-2xl md:text-3xl text-military-amber mb-6"
        >
          ХРОНИКИ ВОЙН
        </h1>

        {campaigns.length === 0 && (
          <p className="text-slate-400">Пока нет опубликованных историй.</p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/campaigns/${c.slug}`}
                data-testid="campaign-card"
                className="block border border-slate-700/50 hover:border-military-amber/50 rounded-sm p-4 transition-colors"
              >
                {c.era && (
                  <div className="text-xs text-hud-green font-ibm-mono mb-1">
                    {c.era}
                  </div>
                )}
                <h2 className="font-russo text-lg text-slate-100">{c.title}</h2>
                {c.subtitle && (
                  <p className="text-sm text-slate-400 mt-1">{c.subtitle}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify it type-checks and the dev page loads**

Run: `npm run type-check`
Expected: PASS (no errors).

Then smoke-check the route renders:
```bash
npm run dev:e2e &  # starts port 3001
sleep 8
curl -s http://localhost:3001/campaigns | grep -o "ХРОНИКИ ВОЙН" | head -1
# then stop the dev server (kill %1 or pkill -f next)
```
Expected: prints `ХРОНИКИ ВОЙН`.

- [ ] **Step 4: Commit**

```bash
git add src/app/campaigns/page.tsx src/components/landing/Footer.tsx
git commit -m "feat(campaigns): list page + landing nav link

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Campaign detail page + typography styling

**Files:**
- Modify: `tailwind.config.ts` (register plugin)
- Create: `src/app/campaigns/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllCampaigns(): CampaignMeta[]` (for `generateStaticParams`) and `getCampaign(slug): Promise<Campaign | null>` from Task 1.

- [ ] **Step 1: Install the typography plugin**

```bash
npm install -D @tailwindcss/typography
```

- [ ] **Step 2: Register the plugin in Tailwind config**

In `tailwind.config.ts`, change the plugins line from:

```ts
  plugins: [],
```

to:

```ts
  plugins: [require('@tailwindcss/typography')],
```

- [ ] **Step 3: Create the detail page**

Create `src/app/campaigns/[slug]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllCampaigns, getCampaign } from '@/lib/campaigns';

export function generateStaticParams() {
  return getAllCampaigns().map((c) => ({ slug: c.slug }));
}

export default async function CampaignDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const campaign = await getCampaign(params.slug);
  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <article className="max-w-3xl mx-auto">
        <Link
          href="/campaigns"
          className="text-sm text-hud-green mb-4 inline-block"
        >
          ← Хроники войн
        </Link>

        <h1 className="font-russo text-2xl md:text-3xl text-military-amber">
          {campaign.title}
        </h1>
        {campaign.subtitle && (
          <p className="text-slate-400 mt-1">{campaign.subtitle}</p>
        )}
        {campaign.era && (
          <p className="text-xs text-hud-green font-ibm-mono mt-2">
            Эпоха: {campaign.era}
          </p>
        )}

        {/* Rendered Markdown body. Content is first-party/trusted (authored .md). */}
        <div
          className="prose prose-invert prose-headings:text-military-amber prose-a:text-hud-green max-w-none mt-6"
          dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
        />

        {campaign.units && campaign.units.length > 0 && (
          <section className="mt-10">
            <h2 className="font-russo text-lg text-slate-200 mb-3">Участники</h2>
            <ul className="flex flex-wrap gap-2">
              {campaign.units.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/encyclopedia/unit/${u.id}`}
                    className="inline-block text-sm px-3 py-1.5 rounded-sm border border-slate-700/50 hover:border-military-amber/50 transition-colors"
                  >
                    {u.role}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {campaign.missions && campaign.missions.length > 0 && (
          <section className="mt-8">
            <h2 className="font-russo text-lg text-slate-200 mb-3">Миссии</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {campaign.missions.map((m, i) => (
                <li
                  key={i}
                  className="border border-slate-800 rounded-sm p-3"
                >
                  <div className="font-russo text-military-amber">{m.name}</div>
                  <div className="text-xs text-slate-400">Коробка: {m.box}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
```

- [ ] **Step 4: Verify type-check passes**

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts src/app/campaigns/\[slug\]/page.tsx package.json package-lock.json
git commit -m "feat(campaigns): detail page with markdown rendering + typography

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Update Велиан + Шиду lore (official docx canon)

**Files:**
- Modify: `src/data/encyclopedia/units/protectorate/squads.json` (entry `protectorate_tyazhyolaya_shturmovaya_pehota_veliana`)
- Modify: `src/data/encyclopedia/units/polaris/squads.json` (entry `polaris_spetsnaz_planety_shidu`)

**Constraints:** Only edit `lore` and `history` string **values**. Do NOT touch `class`, `tactics`, `shortDescription`, or any keys — the lore-shape test requires exactly 5 keys. Text must be Cyrillic (no 4+ char Latin words).

> Rationale: merge the docx canon into the existing entries. For Шиду, keep the existing VK-canon beats («самураи», операция «Катана», автономия) and fold in the docx (partisan origin, батальон «Дракон», послевоенные рейды, уникальный доспех/арсенал). For Велиан, replace with the docx origin and keep the broad «слава в битве за Велиан» beat; drop the unverifiable specifics («Советник Ольгерд» / «Северный Блок») — restore them only if later confirmed canon.

- [ ] **Step 1: Update Велиан lore + history**

In `src/data/encyclopedia/units/protectorate/squads.json`, find the `protectorate_tyazhyolaya_shturmovaya_pehota_veliana` entry and replace its `lore` value:

old:
```json
      "lore": "Тяжёлые штурмовики Велиана в броне максимальной защиты — специалисты прорыва и уличных боёв в плотной застройке города-планеты. Они покрыли себя неувядаемой славой в кровавой битве за Велиан: их бронедивизион под командованием Советника Ольгерда насмерть держал Северный Блок мегаполиса, отбивая атаки имперских бронеэскадронов вплоть до самого Бдительного Мира.",
```
new:
```json
      "lore": "Тяжёлая штурмовая пехота Велиана — порождение кровопролитных боёв, что шли за город-планету в конце войны. После них правительство Велиана постановило создать части, способные биться в плотной городской застройке не только с пехотой противника, но и с бронетехникой. По заказу Сил планетарной обороны был разработан тяжёлый пехотный доспех и комплекс штурмового вооружения, а в новые части отобрали лучших ветеранов последней войны, прошедших жесточайший отбор. В броне максимальной защиты эти штурмовики стали специалистами прорыва и уличного боя и покрыли себя неувядаемой славой в кровавой битве за Велиан.",
```

Then in the same entry replace the `history` value:

old:
```json
      "history": "Сформирована из городских штурмовых частей Велиана для боя в застройке мегаполиса, где обычная пехота бессильна.",
```
new:
```json
      "history": "Сформирована после тяжёлых, кровопролитных боёв на Велиане в конце войны: по заказу Сил планетарной обороны был разработан тяжёлый доспех и штурмовой комплекс, а в новые части отобрали лучших ветеранов прошедшей кампании.",
```

- [ ] **Step 2: Update Шиду lore + history**

In `src/data/encyclopedia/units/polaris/squads.json`, find the `polaris_spetsnaz_planety_shidu` entry and replace its `lore` value:

old:
```json
      "lore": "Шидуанский бронепехотный спецназ — элита планеты Шиду, которая присоединилась к Империи на правах автономии. Шидуанцы, прозванные «самураями», — признанные мастера штурма укреплённых городов и планет-океанов: они очищали от врага океан Посейдон, а два их полка полегли в легендарной битве за Велиан. Их коронный приём — стремительный, неуловимый удар, после которого от обороны противника остаётся только дым.",
```
new:
```json
      "lore": "Шидуанский бронепехотный спецназ ведёт род от партизанских диверсионных отрядов, боровшихся за освобождение родной планеты. После её освобождения с помощью Имперских войск эти части, прозванные «самураями», приняли активное участие в Третьей волне вторжения: с их помощью была захвачена планета Посейдон, а батальон «Дракон» сражался в легендарной битве за Велиан. И по окончании галактической войны они продолжают рейды на планеты Протектората и его союзников. На вооружении отряда — уникальный пехотный доспех с лучшим в своём роде соотношением защиты и подвижности, а в распоряжении бойцов — большой арсенал, выбираемый под предстоящую миссию.",
```

Then in the same entry replace the `history` value:

old:
```json
      "history": "Прославились в операции «Катана», свергнув протекторатовскую власть над Шиду; за стойкость планета получила автономию и право формировать собственные ударные части.",
```
new:
```json
      "history": "Ведёт происхождение от партизанских диверсионных отрядов, боровшихся за освобождение Шиду; после её освобождения с помощью Имперских войск спецназовцы участвовали в Третьей волне вторжения — в том числе в захвате Посейдона и в битве за Велиан (батальон «Дракон»). За стойкость, проявленную ещё в операции «Катана», планета получила автономию и право формировать собственные ударные части.",
```

- [ ] **Step 3: Run the lore-shape test + type-check**

Run: `npx jest src/__tests__/lib/encyclopedia-squad-lore.test.ts`
Expected: PASS — still 32 squads, exactly 5 keys each, no CJK/Latin bleed.

Run: `npm run type-check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/encyclopedia/units/protectorate/squads.json src/data/encyclopedia/units/polaris/squads.json
git commit -m "docs(encyclopedia): update Велиан + Шиду lore from official Хало и Вахо 2 docx

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: E2E test + full verification

**Files:**
- Create: `e2e/campaigns.spec.ts`

- [ ] **Step 1: Write the E2E spec**

Create `e2e/campaigns.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Хроники войн', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('список кампаний открывается и ведёт на страницу кампании', async ({ page }) => {
    await page.goto('/campaigns');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('campaigns-title')).toHaveText('ХРОНИКИ ВОЙН');
    const card = page.getByTestId('campaign-card').first();
    await expect(card).toBeVisible();
    await card.click();
    await page.waitForLoadState('networkidle');

    // detail page renders the title and rendered body
    await expect(page.getByRole('heading', { name: 'Хало и Вахо 2' })).toBeVisible();
    // cross-link to an encyclopedia unit is present
    await expect(page.locator('[href*="/encyclopedia/unit/"]').first()).toBeVisible();
    // missions block rendered
    await expect(page.getByText('Миссии')).toBeVisible();
  });

  test('футер лендинга ведёт в Хроники', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('campaigns-link').click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/campaigns$/);
  });
});
```

- [ ] **Step 2: Run the full unit + lint + type-check suite**

Run: `npm run validate`
Expected: type-check + lint + unit tests PASS.

- [ ] **Step 3: Run the production build (REQUIRED — verifies prerender of new pages)**

Run: `NEXT_PUBLIC_GITHUB_PAGES=true npm run build`
Expected: build reaches `✓ Generating static pages (NN/NN)` with NO errors. Confirms `/campaigns`, `/campaigns/halo-i-vakho-2`, and the updated `/encyclopedia/unit/{...}` pages all prerender.

- [ ] **Step 4: Run the new E2E spec**

Run: `npm run test:e2e -- campaigns.spec.ts`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/campaigns.spec.ts
git commit -m "test(e2e): Хроники войн list → detail flow + landing nav

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review (completed)

**1. Spec coverage:**
- «Хроники войн» section fed by build-time markdown → Tasks 1–3. ✓
- Reusable (content dir + loader + list/detail routes) → Tasks 1–3. ✓
- `/campaigns` index + `/campaigns/[slug]` detail → Tasks 2, 3. ✓
- Landing nav entry point → Task 2 (Footer link). ✓
- Cross-links campaign → encyclopedia units → Task 3 (Участники links). ✓
- First campaign = «Хало и Вахо 2» (full docx canon) → Task 1. ✓
- Велиан + Шиду lore updated from docx, 5-key shape unchanged → Task 4. ✓
- Other 4 squads untouched → (explicitly excluded; no task touches them). ✓
- Verification: type-check, jest, `NEXT_PUBLIC_GITHUB_PAGES=true build`, E2E → Task 5. ✓

**2. Placeholder scan:** none — every code step has complete code; lore edits have exact old/new strings.

**3. Type consistency:** `CampaignMeta`/`Campaign`/`CampaignUnit`/`CampaignMission` defined in Task 1; `getAllCampaigns`/`getCampaign` signatures match usage in Tasks 2 & 3. `generateStaticParams` returns `{ slug }[]` matching the `[slug]` route param. `params: { slug: string }` is correct for Next 14.2.35 (sync params).

**Open risk noted:** if the landing page (`/`) does not render `<Footer>`, the second E2E test fails at the `campaigns-link` step. Verify Footer is mounted on `/` during Task 5; if not, navigate to the page that does mount it (or scope the link test to `/campaigns` directly).
