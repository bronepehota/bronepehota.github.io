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

  test('колонки листа конфигурируются: 1/2/3 с запоминанием', async ({ page }) => {
    await setupToPreparation(page);

    // Дефолт — 2 колонки
    await expect(page.getByTestId('print-columns-2')).toHaveAttribute('aria-pressed', 'true');

    // Переключение на 3 — aria + localStorage
    await page.getByTestId('print-columns-3').click();
    await expect(page.getByTestId('print-columns-3')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('print-columns-2')).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => localStorage.getItem('bronepehota_print_columns'))).toBe('3');

    // В print-медиа лист рендерит 3 колонки
    await page.emulateMedia({ media: 'print' });
    const columnCount = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="print-columns"]') as HTMLElement | null;
      return el ? el.style.columnCount : null;
    });
    expect(columnCount).toBe('3');
  });
});
