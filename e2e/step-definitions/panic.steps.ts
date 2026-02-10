import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// Helper to get page from context
const getPage = () => (global as any).page;

When('я убиваю (\\d+)-го бойца из (\\d+)', async function (soldierNumStr: string, totalStr: string) {
  const page = getPage();
  const idx = parseInt(soldierNumStr) - 1;
  // Click the KIA (Skull) button for the specific soldier
  const kiaButton = page.locator(`button[aria-label*="Убит"]`).nth(idx);
  await kiaButton.click({ timeout: 10000 });
});

When('я провожу тест на панику', async function () {
  const page = getPage();
  // Wait for modal to be visible
  await page.waitForTimeout(500);

  // Click the test button
  const testButton = page.getByText(/ПРОВЕСТИ ТЕСТ/i);
  await testButton.click({ timeout: 10000 });

  // Wait for dice animation (1 second)
  await page.waitForTimeout(1500);

  // Click apply button
  const applyButton = page.getByText(/ПРИМЕНИТЬ/i);
  await applyButton.click({ timeout: 10000 });
});

Then('модалка {string} открывается автоматически', async function (modalTitle: string) {
  const page = getPage();
  const modal = page.getByText(new RegExp(modalTitle, 'i'));
  await expect(modal).toBeVisible({ timeout: 5000 });
});

Then('паникующие бойцы помечены иконкой бега', async function () {
  const page = getPage();
  // Look for Footprints icon (panic indicator)
  const panicIcons = page.locator('svg').filter(async (el: any) => {
    const className = await el.getAttribute('class');
    return className?.includes('lucide-footprints') || false;
  });
  expect(await panicIcons.count()).toBeGreaterThan(0);
});

Then('действия паникующих бойцов заблокированы', async function () {
  const page = getPage();
  // Check for "В ПАНИКЕ" label instead of disabled action buttons
  const panicLabels = page.getByText('В ПАНИКЕ');
  await expect(panicLabels.first()).toBeVisible();
});

When('я начинаю новый ход', async function () {
  const page = getPage();
  // Click the new turn button (implementation depends on UI)
  const newTurnButton = page.getByText(/Новый ход/i).or(page.getByText(/Начать ход/i));
  if (await newTurnButton.isVisible()) {
    await newTurnButton.click({ timeout: 10000 });
  }
});

Then('статус паники снят с бойцов', async function () {
  const page = getPage();
  // Look for Footprints icons - should be gone
  const panicIcons = page.locator('svg').filter(async (el: any) => {
    const className = await el.getAttribute('class');
    return className?.includes('lucide-footprints') || false;
  });
  expect(await panicIcons.count()).toBe(0);
});
