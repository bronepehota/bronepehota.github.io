import { test, expect } from '@playwright/test';

test.describe('Expanded Navigator', () => {
  test('expanded navigator shows sections and handles clicks', async ({ page }) => {
    // Set up game session state BEFORE page loads
    await page.addInitScript(() => {
      const army = {
        name: 'Navigator Test Army',
        faction: 'polaris',
        sourceId: 'star_system',
        units: [
          {
            instanceId: 'nav-active-unit',
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
              ]
            },
            instanceNumber: 1,
            currentSoldiers: [0, 1],
            deadSoldiers: [],
            actionsUsed: [
              { moved: false, shot: false, melee: false, done: false },
              { moved: false, shot: false, melee: false, done: false },
            ]
          },
          {
            instanceId: 'nav-done-unit',
            type: 'squad',
            data: {
              id: 'polaris_shturmovaya_klon_pehota',
              name: 'Штурмовая клон-пехота',
              shortName: 'Штурмовая',
              faction: 'polaris',
              cost: 60,
              image: '/images/squads/polaris/shturmovaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 2, speed: 5, range: 'D6', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
                { num: 2, rank: 2, speed: 5, range: 'D12', power: '2D6', melee: 3, props: [], armor: 2, image: '' },
              ]
            },
            instanceNumber: 2,
            currentSoldiers: [0, 1],
            deadSoldiers: [],
            actionsUsed: [
              { moved: true, shot: true, melee: false, done: true },
              { moved: true, shot: true, melee: false, done: true },
            ]
          },
          {
            instanceId: 'nav-dead-unit',
            type: 'squad',
            data: {
              id: 'polaris_tyazhelaya_klon_pehota',
              name: 'Тяжелая клон-пехота',
              shortName: 'Тяжелая',
              faction: 'polaris',
              cost: 70,
              image: '/images/squads/polaris/tyazhelaya_klon_pehota/1.png',
              soldiers: [
                { num: 1, rank: 3, speed: 4, range: 'D12', power: '2D6', melee: 4, props: [], armor: 3, image: '' },
              ]
            },
            instanceNumber: 3,
            currentSoldiers: [],
            deadSoldiers: [0],
            actionsUsed: []
          }
        ],
        totalCost: 180,
        currentStep: 'battle',
        isInBattle: true,
        currentTurn: 1
      };
      localStorage.setItem('bronepehota_army', JSON.stringify(army));
      localStorage.setItem('bronepehota_view', 'game');
      localStorage.setItem('bronepehota_display_mode', 'detailed');
    });

    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Verify game session loaded
    const gameSession = page.getByTestId('game-session');
    await expect(gameSession.first()).toBeVisible({ timeout: 10000 });

    // Expand dock via JS dispatch (bypasses mouseDown drag detection)
    const expandedNav = page.getByTestId('expanded-navigator');
    await expect(expandedNav).not.toBeVisible();

    await page.evaluate(() => {
      const handle = document.querySelector('.fixed.left-0.right-0.z-50 > .flex.justify-center');
      if (handle) handle.dispatchEvent(new Event('click', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    await expect(expandedNav).toBeVisible();

    // Verify all three sections render
    await expect(page.locator('[role="region"][aria-label="Активные юниты"]')).toBeVisible();
    await expect(page.locator('[role="region"][aria-label="Походили юниты"]')).toBeVisible();
    await expect(page.locator('[role="region"][aria-label="Убитые юниты"]')).toBeVisible();

    // Verify unit cards in correct sections
    const activeSection = page.locator('[role="region"][aria-label="Активные юниты"]');
    await expect(activeSection.getByTestId('expanded-unit-nav-active-unit')).toBeVisible();

    const doneSection = page.locator('[role="region"][aria-label="Походили юниты"]');
    await expect(doneSection.getByTestId('expanded-unit-nav-done-unit')).toBeVisible();

    const deadSection = page.locator('[role="region"][aria-label="Убитые юниты"]');
    await expect(deadSection.getByTestId('expanded-unit-nav-dead-unit')).toBeVisible();

    // Click a unit card to close navigator
    await page.getByTestId('expanded-unit-nav-active-unit').click();
    await page.waitForTimeout(300);
    await expect(expandedNav).not.toBeVisible();
  });
});
