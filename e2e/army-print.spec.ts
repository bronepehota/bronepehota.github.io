import { test, expect } from '@playwright/test';
import { setupToPreparation } from './helpers/setup';

/**
 * Печатный арм-лист (A4, ч/б) на этапе «Подготовка»:
 * - кнопка «Печать A4» вызывает window.print();
 * - лист (army-print-sheet) скрыт на экране и виден только в print-медиа;
 * - при печати хром приложения скрыт (print:hidden на экране подготовки).
 *
 * Физическую пагинацию «умещается на 1 лист» в сюите не проверяем (она
 * зависит от печатного движка браузера) — см. скрипт верификации page.pdf.
 */

test.describe('Army print sheet (A4)', () => {
  test('кнопка «Печать A4» на подготовке, лист скрыт на экране', async ({ page }) => {
    await setupToPreparation(page);

    const button = page.getByTestId('print-army-button');
    await expect(button).toBeVisible();

    // Лист в DOM, но скрыт на экране
    const display = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="army-print-sheet"]');
      return el ? getComputedStyle(el).display : 'missing';
    });
    expect(display).toBe('none');
  });

  test('в print-медиа лист виден, хром приложения скрыт', async ({ page }) => {
    await setupToPreparation(page);
    await page.emulateMedia({ media: 'print' });

    await expect(page.getByTestId('army-print-sheet')).toBeVisible();
    await expect(page.getByTestId('battle-preparation-screen')).toBeHidden();

    // Содержимое: шапка и юнит
    await expect(page.getByTestId('print-header')).toContainText('очков');
  });

  test('кнопка вызывает window.print()', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__printCalled = false;
      window.print = () => {
        (window as unknown as Record<string, unknown>).__printCalled = true;
      };
    });
    await setupToPreparation(page);

    await page.getByTestId('print-army-button').click();
    const called = await page.evaluate(() => (window as unknown as Record<string, unknown>).__printCalled);
    expect(called).toBe(true);
  });
});
