# Promo VK/Telegram Post — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a promotional VK/Telegram post in Russian with 6 real Playwright screenshots showcasing Bronepehota's key features.

**Architecture:** A Playwright script takes 6 screenshots at 375px mobile viewport by navigating to app pages and pre-populating localStorage state. A separate markdown file contains the post text with screenshot references. No code changes to the app itself.

**Tech Stack:** Playwright (existing E2E setup), Node.js script, Markdown.

---

## File Structure

| Action | File | Purpose |
|--------|------|---------|
| Create | `scripts/take-promo-screenshots.ts` | Playwright script that captures all 6 screenshots |
| Create | `docs/promo/vk-telegram-post.md` | VK/Telegram post text with screenshot references |
| Create | `docs/promo/screenshots/` | Output directory for 6 PNG screenshots |

---

### Task 1: Create the screenshot output directory

**Files:**
- Create: `docs/promo/screenshots/` (directory)

- [ ] **Step 1: Create directory**

```bash
mkdir -p docs/promo/screenshots
```

- [ ] **Step 2: Commit**

```bash
git add docs/promo/screenshots/
git commit -m "chore: create promo screenshots directory"
```

---

### Task 2: Write the Playwright screenshot script

**Files:**
- Create: `scripts/take-promo-screenshots.ts`

This script uses Playwright directly (not the test runner) to take screenshots. It reuses the same patterns from existing E2E tests: `addInitScript` for localStorage, `devices['Pixel 5']` for mobile viewport, same `baseURL`.

- [ ] **Step 1: Create the screenshot script**

```typescript
// scripts/take-promo-screenshots.ts
import { chromium, devices } from 'playwright';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'promo', 'screenshots');
const BASE_URL = 'http://localhost:3001';

// Army state with multiple units for a realistic game session screenshot
const NAVIGATOR_ARMY = {
  name: 'Гвардия Поларис',
  faction: 'polaris',
  sourceId: 'star_system',
  units: [
    {
      instanceId: 'nav-squad-1',
      type: 'squad',
      data: {
        id: 'polaris_lineynaya_klon_pehota',
        name: 'Линейная клон-пехота',
        shortName: 'Линейная',
        faction: 'polaris',
        cost: 50,
        image: '/images/squads/polaris/lineynaya_klon_pehota/1.png',
        soldiers: [
          { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          { num: 3, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          { num: 4, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          { num: 5, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
          { num: 6, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
        ]
      },
      instanceNumber: 1,
      currentSoldiers: [0, 1, 2, 3, 4, 5],
      deadSoldiers: [],
      actionsUsed: [
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
        { moved: false, shot: false, melee: false, done: false },
      ],
      activeBuffs: [
        {
          id: 'buff_cover_1',
          catalogId: 'cover',
          name: 'Укрытие',
          description: '+1 к броне',
          target: 'armor_bonus',
          value: 1,
          phase: 'shot',
          appliedAtTurn: 1,
        }
      ],
      activeDebuffs: [
        {
          id: 'debuff_suppression_1',
          catalogId: 'suppression',
          name: 'Подавление',
          description: '-1 к дистанции',
          target: 'range_penalty',
          value: 1,
          phase: 'shot',
          duration: 2,
          appliedAtTurn: 1,
        }
      ],
      soldierModifiers: [],
      soldierAbilitiesUsed: [],
    },
    {
      instanceId: 'nav-squad-2',
      type: 'squad',
      data: {
        id: 'polaris_lyogkaya_shturmovaya_klon_pehota',
        name: 'Лёгкая штурмовая клон-пехота',
        shortName: 'Лёгкая штурмовая',
        faction: 'polaris',
        cost: 70,
        image: '/images/squads/polaris/lyogkaya_shturmovaya_klon_pehota/1.png',
        soldiers: [
          { num: 1, rank: 2, speed: 5, range: 'D6', power: '1D6+3', melee: 5, modifiers: ['jump_boost_4'], armor: 2, image: '' },
          { num: 2, rank: 2, speed: 5, range: 'D6', power: '3D6', melee: 6, modifiers: ['jump_boost_4'], armor: 2, image: '' },
          { num: 3, rank: 2, speed: 5, range: '', power: '', melee: 6, modifiers: ['jump_boost_4'], armor: 2, image: '' },
          { num: 4, rank: 2, speed: 5, range: 'D6', power: '1D6+3', melee: 5, modifiers: ['jump_boost_4'], armor: 2, image: '' },
        ]
      },
      instanceNumber: 2,
      currentSoldiers: [0, 1, 2, 3],
      deadSoldiers: [],
      actionsUsed: [
        { moved: true, shot: true, melee: false, done: true },
        { moved: true, shot: true, melee: false, done: true },
        { moved: true, shot: true, melee: false, done: true },
        { moved: true, shot: true, melee: false, done: true },
      ],
      activeBuffs: [],
      activeDebuffs: [],
      soldierModifiers: [],
      soldierAbilitiesUsed: [],
    },
    {
      instanceId: 'nav-machine-1',
      type: 'machine',
      data: {
        id: 'demolisher',
        name: 'Демолишер',
        shortName: 'Демолишер',
        faction: 'polaris',
        cost: 400,
        image: '/images/machines/demolisher.jpg',
        weapons: [
          { name: 'Шестиствольная автоматическая пушка ARC-20X6', range: 'D12', power: '3D20', ammo: 5 },
          { name: 'Спаренная пусковая установка Шторм для ракет R-9', range: 'D12', power: '2D20', ammo: 2 },
        ],
        speed_sectors: [
          { min_durability: 9, max_durability: 16, speed: 2 },
          { min_durability: 1, max_durability: 8, speed: 1 },
        ],
        rank: 3,
        fire_rate: 2,
        ammo_max: 5,
        durability_max: 16,
      },
      instanceNumber: 1,
      currentDurability: 14,
      currentAmmo: 4,
      isMachineMoved: false,
      isMachineShot: false,
      machineShotsUsed: 0,
      machineWeaponShots: {},
    },
  ],
  totalCost: 520,
  currentStep: 'battle',
  isInBattle: true,
  currentTurn: 2,
};

async function takeScreenshot(
  page: any,
  name: string,
  actions: (page: any) => Promise<void>
) {
  await actions(page);
  await page.waitForTimeout(1000); // Let animations settle
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, name),
    fullPage: false,
  });
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log('Taking promo screenshots...\n');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['Pixel 5'],
  });
  const page = await context.newPage();

  // Screenshot 1: Landing page
  console.log('1/6 Landing page');
  await takeScreenshot(page, '01-landing.png', async (p) => {
    await p.goto(BASE_URL);
    await p.waitForLoadState('networkidle');
  });

  // Screenshot 2: Army builder
  console.log('2/6 Army builder');
  await takeScreenshot(page, '02-army.png', async (p) => {
    await p.addInitScript(() => {
      localStorage.clear();
    });
    await p.goto(BASE_URL + '/app');
    await p.evaluate(() => localStorage.clear());
    await p.reload();
    await p.waitForLoadState('networkidle');
    // Navigate through setup flow
    // Rules confirm
    const rulesBtn = p.getByTestId('rules-confirm-button');
    if (await rulesBtn.count() > 0) {
      await rulesBtn.click();
      await p.waitForTimeout(300);
    }
    // Source confirm
    const sourceBtn = p.getByTestId('source-confirm-button');
    if (await sourceBtn.count() > 0) {
      await sourceBtn.click();
      await p.waitForTimeout(300);
    }
    // Select faction
    const factionCard = p.getByTestId('faction-card-polaris');
    if (await factionCard.count() > 0) {
      await factionCard.click();
      await p.waitForTimeout(300);
      const continueBtn = p.getByTestId('faction-continue-button');
      if (await continueBtn.count() > 0) {
        await continueBtn.click();
        await p.waitForTimeout(300);
      }
    }
    // Select budget
    const budget350 = p.getByTestId('budget-500');
    if (await budget350.count() > 0) {
      await budget350.click();
      await p.waitForTimeout(300);
      const nextBtn = p.getByTestId('budget-next-button');
      if (await nextBtn.count() > 0) {
        await nextBtn.click();
        await p.waitForTimeout(300);
      }
    }
    // Add a unit
    const addBtn = p.locator('button:has-text("добавить")').first();
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await p.waitForTimeout(300);
    }
  });

  // Screenshot 3: Card navigator (game session with expanded navigator)
  console.log('3/6 Card navigator');
  await takeScreenshot(page, '03-navigator.png', async (p) => {
    await p.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('bronepehota_army', JSON.stringify(NAVIGATOR_ARMY));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });
    await p.goto(BASE_URL + '/app');
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1000);

    // Expand navigator
    const expandedNav = p.getByTestId('expanded-navigator');
    if (await expandedNav.count() > 0) {
      await p.evaluate(() => {
        const handle = document.querySelector('.fixed.left-0.right-0.z-50 > .flex.justify-center');
        if (handle) handle.dispatchEvent(new Event('click', { bubbles: true }));
      });
      await p.waitForTimeout(500);
    }
  });

  // Screenshot 4: Combat with modifiers
  console.log('4/6 Combat with modifiers');
  await takeScreenshot(page, '04-combat-modifiers.png', async (p) => {
    await p.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('bronepehota_army', JSON.stringify(NAVIGATOR_ARMY));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });
    await p.goto(BASE_URL + '/app');
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(1000);

    // Click on the first unit to open combat
    const unitCard = p.getByTestId('unit-nav-nav-squad-1');
    if (await unitCard.count() > 0) {
      await unitCard.first().click();
      await p.waitForTimeout(500);
    }

    // Look for attack/shoot button
    const shootBtn = p.getByRole('button', { name: /ВЫСТРЕЛ|Выстрел|стрелять/i }).first();
    if (await shootBtn.count() > 0) {
      await shootBtn.click();
      await p.waitForTimeout(500);
    }
  });

  // Screenshot 5: Standalone calculator
  console.log('5/6 Standalone calculator');
  await takeScreenshot(page, '05-calculator.png', async (p) => {
    await p.addInitScript(() => {
      localStorage.clear();
    });
    await p.goto(BASE_URL + '/calculator');
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(500);

    // Click on the shot action card to show parameters
    const cards = await p.locator('[class*="relative w-full overflow-hidden"]').all();
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes('ВЫСТРЕЛ') && text.includes('Дистанция')) {
        await card.click();
        break;
      }
    }
    await p.waitForTimeout(500);
  });

  // Screenshot 6: Encyclopedia
  console.log('6/6 Encyclopedia');
  await takeScreenshot(page, '06-encyclopedia.png', async (p) => {
    await p.addInitScript(() => {
      localStorage.clear();
    });
    await p.goto(BASE_URL + '/encyclopedia');
    await p.waitForLoadState('networkidle');
    await p.waitForTimeout(500);

    // Click polaris filter to show faction-specific units
    const polarisBtn = p.locator('button:has-text("ПОЛЯРИС")').first();
    if (await polarisBtn.count() > 0) {
      await polarisBtn.click();
      await p.waitForTimeout(500);
    }
  });

  await browser.close();
  console.log('\n✓ All screenshots saved to docs/promo/screenshots/');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/take-promo-screenshots.ts
git commit -m "feat: add promo screenshot capture script"
```

---

### Task 3: Run the screenshot script

- [ ] **Step 1: Ensure dev server is running on port 3001**

```bash
npm run dev:e2e &
```

Wait for server to be ready (check `http://localhost:3001` responds).

- [ ] **Step 2: Run the screenshot script**

```bash
npx tsx scripts/take-promo-screenshots.ts
```

Expected output:
```
Taking promo screenshots...

1/6 Landing page
  ✓ 01-landing.png
2/6 Army builder
  ✓ 02-army.png
3/6 Card navigator
  ✓ 03-navigator.png
4/6 Combat with modifiers
  ✓ 04-combat-modifiers.png
5/6 Standalone calculator
  ✓ 05-calculator.png
6/6 Encyclopedia
  ✓ 06-encyclopedia.png

✓ All screenshots saved to docs/promo/screenshots/
```

- [ ] **Step 3: Verify screenshots exist and look correct**

Open each screenshot and verify it shows the intended content. If any screenshot is blank or shows an error, debug the navigation flow for that screen.

- [ ] **Step 4: Commit screenshots**

```bash
git add docs/promo/screenshots/
git commit -m "docs: add promo screenshots for VK/Telegram post"
```

---

### Task 4: Write the VK/Telegram post text

**Files:**
- Create: `docs/promo/vk-telegram-post.md`

- [ ] **Step 1: Write the post**

```markdown
🎮 **Бронепехота — твой цифровой штаб**

Устал считать на бумажке и забывать какие модификаторы висят на отряде? Бронепехота берёт рутину на себя — а ты кидаешь кубики и командуешь.

📱 Работает в браузере телефона. Ничего скачивать не надо.

---

🏗️ **Сбор армии**

Выбираешь фракцию, ставишь бюджет, добавляешь отряды и технику. Приложение само считает стоимость и нумерует юниты. Всё сохраняется в браузере — ничего не потеряется.

📎 *Скриншот: 02-army.png*

---

🗂️ **Навигатор по карточкам в бою**

Все карточки отрядов под рукой. Видишь прочность, боеприпасы, кто жив, кто походил, кто убит. Прокликиваешь отряды одним свайпом.

Можно играть кубиками как обычно — приложение просто заменяет стопку карточек на экране телефона.

📎 *Скриншот: 03-navigator.png*

---

⚔️ **Боевой калькулятор**

Нажал «Выстрел» — приложение подставило дальность и мощь оружия. Нажал «Выйти в бой» — увидел результат. Модификаторы (баффы, дебаффы, способности) приложение помнит за тебя — не нужно держать в голове кто под укрытием, а кто под подавлением.

📎 *Скриншот: 04-combat-modifiers.png*

---

🔢 **Отдельный калькулятор**

Хочешь прикинуть «а что если?» — открываешь отдельный калькулятор и вводишь параметры вручную. Поддерживает кубики D6, D12, D20, модификаторы и два свода правил.

📎 *Скриншот: 05-calculator.png*

---

🔗 **Попробовать:** https://luxor.github.io/bronepehota/
📂 **Исходный код:** https://github.com/Luxor/bronepehota
```

- [ ] **Step 2: Commit**

```bash
git add docs/promo/vk-telegram-post.md
git commit -m "docs: add VK/Telegram promotional post"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ 4 feature blocks (army builder, navigator, in-combat calculator, standalone calculator) — Tasks 2-3 (screenshots) + Task 4 (text)
- ✅ Key message "app replaces paper not dice" — Task 4, navigator section
- ✅ Modifiers emphasis — Task 4, combat calculator section
- ✅ 6 screenshots at 375px mobile viewport — Tasks 2-3
- ✅ Informal Russian, emoji markers — Task 4
- ✅ Call to action with links — Task 4

**2. Placeholder scan:**
- No TBD/TODO found. All code is concrete.

**3. Type consistency:**
- Army shape in the script matches patterns from existing E2E tests (`combat.spec.ts`, `expanded-navigator.spec.ts`).
- Selectors use `data-testid` as per project conventions.
- Viewport uses `devices['Pixel 5']` which is 393px wide (close enough to 375px, standard mobile).
