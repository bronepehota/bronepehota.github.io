import { test, expect } from '@playwright/test';
import { setupGameSessionWithSquad, waitForBattleDock, openNavigator } from './helpers/setup';

/**
 * Навигатор отрядов (плейтест): скорость дублируется в сантиметрах
 * (👣 5 (25см)), а ✓ на строке отмечает ВЕСЬ юнит походившим одним тапом
 * (повторный тап снимает) — без захода в карточку и ручной отметки бойцов.
 */
test.describe('Навигатор: сантиметры и «весь юнит походил»', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameSessionWithSquad(page);
    await waitForBattleDock(page);
  });

  test('в строке юнита скорость показана в шагах и сантиметрах', async ({ page }) => {
    await openNavigator(page);

    const row = page.getByTestId('expanded-unit-squad-test-1');
    await expect(row).toBeVisible();
    await expect(row).toContainText('👣 5 (25см)');
  });

  test('✓ на строке отмечает весь отряд походившим, повторный тап снимает', async ({ page }) => {
    await openNavigator(page);

    const header = page.locator('[data-testid="expanded-navigator"]').getByText(/активн\./);
    await expect(header).toHaveText(/активн\. 1/);

    const toggle = page.getByTestId('unit-done-toggle-squad-test-1');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();

    // Отряд ушёл из активных, кнопка залита (pressed)
    await expect(header).toHaveText(/активн\. 0/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Повторный тап возвращает
    await toggle.click();
    await expect(header).toHaveText(/активн\. 1/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('тап по строке (не по ✓) по-прежнему выбирает юнита и закрывает список', async ({ page }) => {
    await openNavigator(page);

    await page.getByTestId('expanded-unit-squad-test-1').click();
    // Док схлопнулся — сфокусированная карточка юнита осталась в контенте
    await expect(page.getByTestId('expanded-navigator')).not.toBeVisible();
    await expect(page.getByTestId('soldier-card').first()).toBeVisible();
  });
});
