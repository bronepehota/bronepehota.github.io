import { test, expect } from '@playwright/test';
import { clearStorage } from './helpers/setup';

/**
 * Editor E2E tests
 * Tests the custom armylist editor functionality
 */

test.describe('Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await clearStorage(page);
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');
  });

  test('should display editor page', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Should see header
    await expect(page.getByText('Редактор армлистов')).toBeVisible();

    // Should see sources list
    await expect(page.getByText('Армлисты').first()).toBeVisible();

    // Should see create button
    await expect(page.getByTitle('Создать источник').first()).toBeVisible();

    // Should see empty state message
    await expect(page.getByText('Нет пользовательских источников').first()).toBeVisible();

    // Should see warning about local storage
    await expect(page.getByText(/Данные хранятся локально/)).toBeVisible();
  });

  test('should open create source modal', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.getByTitle('Создать источник').first().click();

    // Should see modal
    await expect(page.getByText('Новый источник').first()).toBeVisible();

    // Should see form fields
    await expect(page.getByPlaceholder('Мой армлист').first()).toBeVisible();
    await expect(page.getByPlaceholder('Опциональное описание').first()).toBeVisible();

    // Should see type buttons
    await expect(page.getByText('Новый источник').nth(1)).toBeVisible();
    await expect(page.getByText('Расширение существующего').first()).toBeVisible();

    // Should see action buttons
    await expect(page.getByText('Отмена').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Создать', exact: true }).first()).toBeVisible();
  });

  test('should have unified save/load toolbar', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Toolbar should have save/load icon buttons
    const saveButton = page.getByTitle('Сохранить в файл').first();
    await expect(saveButton).toBeVisible();

    const loadButton = page.getByTitle('Загрузить из файла').first();
    await expect(loadButton).toBeVisible();

    // Help button should be present
    const helpButton = page.getByTitle('Как перенести настройки').first();
    await expect(helpButton).toBeVisible();
  });

  test('should import config from JSON file', async ({ page }) => {
    const fs = require('fs');
    const path = require('path');

    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Create a config envelope with a test source
    const testSource = {
      id: 'custom_test_import',
      name: 'Импортированный источник',
      description: 'Тестовый импорт',
      version: '1.0',
      baseSource: null,
      factions: [
        { id: 'test_faction', name: 'Тестовая фракция', color: '#ff0000' }
      ],
      squads: [],
      machines: [],
      hiddenUnits: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const configEnvelope = {
      version: 1,
      type: 'bronepehota_config',
      exportedAt: new Date().toISOString(),
      data: { sources: [testSource], modifiers: { buffs: [], debuffs: [] } }
    };

    const tmpFile = path.join('/tmp', 'test-config.json');
    fs.writeFileSync(tmpFile, JSON.stringify(configEnvelope, null, 2));

    // Upload via file input
    const fileInput = page.locator('input[type="file"][accept=".json"]').first();
    await fileInput.setInputFiles(tmpFile);

    // Confirm dialog should appear
    const confirmButton = page.getByRole('button', { name: 'Загрузить', exact: true });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Should see imported source in the list
    await expect(page.getByText('Импортированный источник').first()).toBeVisible();

    // Cleanup
    fs.unlinkSync(tmpFile);
  });

  test('should interact with create source form fields', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.getByTitle('Создать источник').first().click();

    // Verify form fields are present and interactive
    const nameInput = page.getByTestId('source-name-input');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('');

    // Type in the name field
    await nameInput.click();
    await nameInput.pressSequentially('Test Source', { delay: 30 });

    // Verify the input has content (DOM value is set)
    await expect(nameInput).toHaveValue('Test Source');

    // Description field
    const descInput = page.getByPlaceholder('Опциональное описание').first();
    await expect(descInput).toBeVisible();
    await descInput.click();
    await descInput.pressSequentially('Test description', { delay: 30 });

    // Verify type buttons are present
    await expect(page.getByText('Новый источник').nth(1)).toBeVisible();
    await expect(page.getByText('Расширение существующего').first()).toBeVisible();

    // Verify action buttons are present
    await expect(page.getByText('Отмена').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Создать', exact: true }).first()).toBeVisible();

    // Note: Full form submission is tested via import functionality
    // React controlled inputs have known limitations in E2E tests
  });

  test('should close create modal on cancel', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.getByTitle('Создать источник').first().click();

    // Should see modal
    await expect(page.getByText('Новый источник').first()).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Отмена")');

    // Modal should be closed - check that the modal container is gone
    await expect(page.getByTestId('create-source-modal')).not.toBeVisible();
  });

  test('should select source type buttons', async ({ page }) => {
    await page.goto('/editor');
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.getByTitle('Создать источник').first().click();

    // Find the "Новый источник" type button (second occurrence - first is the modal title)
    const newTypeButton = page.getByRole('button').filter({ hasText: 'Новый источник' }).first();
    await expect(newTypeButton).toBeVisible();
    await expect(newTypeButton).toHaveClass(/border-blue-500/);

    // Click "Расширение существующего"
    const extButton = page.getByRole('button').filter({ hasText: 'Расширение существующего' });
    await extButton.click();

    // Should see base source selector appear
    await expect(page.getByText('Базовый источник').first()).toBeVisible();
    await expect(page.getByText('Выберите источник').first()).toBeVisible();
  });

  // Helper: create source + faction, then open the machine editor
  async function setupMachineEditor(page: import('@playwright/test').Page) {
    // Create source
    await page.getByTitle('Создать источник').first().click();
    await page.waitForTimeout(300);
    const nameInput = page.getByTestId('source-name-input');
    await nameInput.click();
    await nameInput.pressSequentially('TestMachine', { delay: 20 });
    await page.getByRole('button', { name: 'Создать', exact: true }).first().click();

    // Source should be auto-selected; create a faction
    await page.getByTitle('Создать фракцию').first().click();
    await page.getByText('Новая фракция').first().click();

    // Switch to the "Техника" tab in UnitsList and create a machine
    await page.getByTestId('create-machine-button').click();
    await page.waitForTimeout(500);
  }

  test('should compute machine cost via calculator', async ({ page }) => {
    await setupMachineEditor(page);

    // Switch to the calculator tab inside MachineEditor
    await page.getByTestId('machine-calculator-tab').click();

    // Configure: УМ-1 monoblock + Траккер chassis
    await page.getByTestId('mc-monoblock').selectOption('УМ-1');
    await page.getByTestId('mc-chassis').selectOption('Траккер');

    // Slot 0 -> Гарпун Power Bolt PB-1M preset
    await page.getByTestId('mc-slot-0-preset').selectOption('garpun_pb1m');

    // Apply computed cost back to the editor's cost field
    await page.getByTestId('mc-apply').click();

    // Total breakdown must be a positive cost
    const total = await page.getByTestId('mc-total').textContent();
    expect(parseInt(total!, 10)).toBeGreaterThan(0);

    // Save the machine
    await page.getByRole('button', { name: /Сохранить/ }).click();
  });
});
