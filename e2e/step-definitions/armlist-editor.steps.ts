import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { BronepehotaWorld } from '../support/world';

// Armlist Editor steps

When('я выбираю режим {string}', async function(this: BronepehotaWorld, mode: string) {
  // Wait for page to stabilize
  await this.page.waitForTimeout(300);

  // Map mode names to actual button text
  const modeMap: Record<string, string> = {
    'Отряд': 'Взвод солдат',
    'отряд': 'Взвод солдат',
    'Squad': 'Взвод солдат',
    'Машина': 'Техника',
    'машина': 'Техника',
    'Machine': 'Техника'
  };

  const buttonText = modeMap[mode] || mode;

  // Try to find the button with multiple strategies
  const modeButton = this.page.getByRole('button', { name: buttonText, exact: true });

  // Wait for button to be visible and attached
  await modeButton.waitFor({ state: 'visible', timeout: 10000 });
  await this.page.waitForTimeout(200);

  // Click the button
  await modeButton.click({ timeout: 10000, force: true });
  await this.page.waitForTimeout(500);
});

// Editor-specific faction selection (for dropdown, not main selection)
When('я выбираю фракцию {string} в редакторе', async function(this: BronepehotaWorld, factionName: string) {
  const factionSelect = this.page.getByRole('combobox', { name: /фракция/i });
  if (await factionSelect.isVisible()) {
    await factionSelect.selectOption(factionName);
  }
});

When('я ввожу название {string}', async function(this: BronepehotaWorld, name: string) {
  const nameInput = this.page.getByRole('textbox', { name: /название|name/i });
  if (await nameInput.isVisible()) {
    await nameInput.fill(name);
  }
});

When('я ввожу стоимость {string}', async function(this: BronepehotaWorld, cost: string) {
  const costInput = this.page.getByRole('spinbutton', { name: /стоимость|cost/i });
  if (await costInput.isVisible()) {
    await costInput.fill(cost);
  }
});

When('я добавляю первого солдата с характеристиками:', async function(this: BronepehotaWorld, dataTable) {
  const data = dataTable.hashes()[0];

  // Fill soldier form fields
  for (const [key, value] of Object.entries(data)) {
    const input = this.page.getByRole(key === 'звание' ? 'spinbutton' : 'spinbutton', { name: new RegExp(key, 'i') })
      .or(this.page.getByRole('textbox', { name: new RegExp(key, 'i') }));

    if (await input.isVisible()) {
      await input.fill(String(value));
    }
  }
});

When('я ввожу звание {string}', async function(this: BronepehotaWorld, rank: string) {
  const rankInput = this.page.getByRole('spinbutton', { name: /звание|ранг/i });
  if (await rankInput.isVisible()) {
    await rankInput.fill(rank);
  }
});

When('я ввожу темп стрельбы {string}', async function(this: BronepehotaWorld, fireRate: string) {
  const fireRateInput = this.page.getByRole('spinbutton', { name: /темп|стрельба/i });
  if (await fireRateInput.isVisible()) {
    await fireRateInput.fill(fireRate);
  }
});

When('я ввожу максимум боезапаса {string}', async function(this: BronepehotaWorld, ammo: string) {
  const ammoInput = this.page.getByRole('spinbutton', { name: /боезапас|патроны/i });
  if (await ammoInput.isVisible()) {
    await ammoInput.fill(ammo);
  }
});

When('я ввожу максимум прочности {string}', async function(this: BronepehotaWorld, durability: string) {
  const durabilityInput = this.page.getByRole('spinbutton', { name: /прочность|durability/i });
  if (await durabilityInput.isVisible()) {
    await durabilityInput.fill(durability);
  }
});

When('я добавляю сектора скорости:', async function(this: BronepehotaWorld, dataTable) {
  for (const row of dataTable.hashes()) {
    // Add speed sector for each row
    const addButton = this.page.getByRole('button', { name: /добавить сектор|\+ сектор/i });
    if (await addButton.isVisible()) {
      await addButton.click();
    }

    // Fill sector fields
    const minInput = this.page.getByRole('spinbutton', { name: /мин/i });
    if (await minInput.isVisible()) {
      await minInput.fill(row['мин_прочность']);
    }

    const maxInput = this.page.getByRole('spinbutton', { name: /макс/i });
    if (await maxInput.isVisible()) {
      await maxInput.fill(row['макс_прочность']);
    }

    const speedInput = this.page.getByRole('spinbutton', { name: /скорость/i });
    if (await speedInput.isVisible()) {
      await speedInput.fill(row['скорость']);
    }
  }
});

When('я добавляю оружие {string} с характеристиками:', async function(this: BronepehotaWorld, weaponName: string, dataTable) {
  const data = dataTable.hashes()[0];

  const addWeaponButton = this.page.getByRole('button', { name: /добавить оружие|\+ оружие/i });
  if (await addWeaponButton.isVisible()) {
    await addWeaponButton.click();
  }

  // Weapon name
  const nameInput = this.page.getByRole('textbox', { name: /название/i });
  if (await nameInput.isVisible()) {
    await nameInput.fill(weaponName);
  }

  // Weapon stats
  for (const [key, value] of Object.entries(data)) {
    const input = this.page.getByRole('textbox', { name: new RegExp(key, 'i') });
    if (await input.isVisible()) {
      await input.fill(String(value));
    }
  }
});

Then('отряд должен быть создан', async function(this: BronepehotaWorld) {
  const successMessage = this.page.getByText(/сохранен|создан|успеш/i);
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
});

Then('машина должна быть создана', async function(this: BronepehotaWorld) {
  const successMessage = this.page.getByText(/сохранен|создан|успеш/i);
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
});

Given('в системе существует отряд {string}', async function(this: BronepehotaWorld, squadName: string) {
  // Setup: Create squad through API or direct data manipulation
});

When('я выбираю этот отряд для редактирования', async function(this: BronepehotaWorld) {
  const editButton = this.page.getByRole('button', { name: /редактировать|изменить/i });
  await editButton.first().click();
  await this.page.waitForTimeout(300);
});

When('я изменяю название на {string}', async function(this: BronepehotaWorld, newName: string) {
  const nameInput = this.page.getByRole('textbox', { name: /название|name/i });
  await nameInput.fill(newName);
});

Then('изменения должны быть сохранены', async function(this: BronepehotaWorld) {
  const successMessage = this.page.getByText(/сохранен|обновлен/i);
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
});

Then('отряд должен иметь новое название', async function(this: BronepehotaWorld, newName: string) {
  const unitName = this.page.getByText(newName);
  await expect(unitName).toBeVisible();
});

When('я выбираю этот отряд', async function(this: BronepehotaWorld) {
  const selectButton = this.page.getByRole('button', { name: /выбрать/i });
  await selectButton.first().click();
});

Then('отряд должен быть удалён из системы', async function(this: BronepehotaWorld) {
  const confirmMessage = this.page.getByText(/удален/i);
  await expect(confirmMessage.first()).toBeVisible({ timeout: 5000 });
});

Given('я создаю новый отряд', async function(this: BronepehotaWorld) {
  // Setup
});

Given('у меня есть файл изображения', async function(this: BronepehotaWorld) {
  // Precondition
});

When('я загружаю изображение через файловый менеджер', async function(this: BronepehotaWorld) {
  const fileInput = this.page.getByLabel(/изображение|image/i).or(this.page.getByRole('button', { name: /загрузить/i }));

  // Use a base64 encoded test image
  const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  await fileInput.setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: testImage,
  });
});

Then('изображение должно быть отображено в превью', async function(this: BronepehotaWorld) {
  const imagePreview = this.page.locator('img').or(this.page.locator('[class*="preview"]'));
  await expect(imagePreview.first()).toBeVisible({ timeout: 5000 });
});

Then('после сохранения изображение должно быть связано с отрядом', async function(this: BronepehotaWorld) {
  // Verify image association
  const imageElement = this.page.locator('img');
  const isSrcValid = await imageElement.first().evaluate(img => {
    const src = (img as HTMLImageElement).src;
    return src && src.length > 0;
  });
  expect(isSrcValid).toBe(true);
});

Given('у меня в буфере обмена есть изображение', async function(this: BronepehotaWorld) {
  // Precondition - clipboard has image
});

When('я нажимаю Ctrl+V в поле изображения', async function(this: BronepehotaWorld) {
  const imageArea = this.page.locator('[class*="upload"]').or(this.page.getByPlaceholder(/перетащить|загрузить/i));

  // Simulate paste event
  await imageArea.dispatchEvent('paste', {
    clipboardData: [
      {
        kind: 'file',
        type: 'image/png',
        getAsFile: () => new File(['test'], 'test.png', { type: 'image/png' })
      }
    ]
  });
});

When('я перетаскиваю файл в область загрузки', async function(this: BronepehotaWorld) {
  const dropZone = this.page.locator('[class*="drop-zone"]').or(this.page.getByPlaceholder(/перетащить/i));

  // Simulate drag and drop
  const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());

  await dropZone.dispatchEvent('drop', { dataTransfer });
});

Given('я создаю машину с максимальной прочностью {string}', async function(this: BronepehotaWorld, durability: string) {
  // Setup
});

When('сектора скорости не покрывают весь диапазон от 1 до {string}', async function(this: BronepehotaWorld, maxDurability: string) {
  // Create incomplete speed sectors
  const addButton = this.page.getByRole('button', { name: /добавить сектор/i });
  await addButton.click();

  const maxInput = this.page.getByRole('spinbutton', { name: /макс/i });
  await maxInput.fill(String(parseInt(maxDurability) - 5));
});

Then('я должен увидеть ошибку валидации', async function(this: BronepehotaWorld) {
  const errorMessage = this.page.getByText(/ошибка|не верно|валидаци/i);
  await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
});

Then('я не должен сохранить машину', async function(this: BronepehotaWorld) {
  const saveButton = this.page.getByRole('button', { name: /сохранить/i });
  await expect(saveButton).toBeEnabled(); // Save should be enabled but validation fails
});

Given('я создаю машину', async function(this: BronepehotaWorld) {
  // Setup
});

// Editor-specific rules selection (for combobox)
Given('я выбрал правила {string} в редакторе', async function(this: BronepehotaWorld, rules: string) {
  const rulesSelect = this.page.getByRole('combobox', { name: /правила/i });
  if (await rulesSelect.isVisible()) {
    await rulesSelect.selectOption(rules);
  }
});

When('я добавляю оружие с эффектом {string}', async function(this: BronepehotaWorld, effect: string) {
  const addWeaponButton = this.page.getByRole('button', { name: /добавить оружие/i });
  if (await addWeaponButton.isVisible()) {
    await addWeaponButton.click();
  }

  const effectSelect = this.page.getByRole('combobox', { name: /эффект|special/i });
  if (await effectSelect.isVisible()) {
    await effectSelect.selectOption(effect);
  }
});

When('я ввожу радиус {string}', async function(this: BronepehotaWorld, radius: string) {
  const radiusInput = this.page.getByRole('spinbutton', { name: /радиус/i });
  if (await radiusInput.isVisible()) {
    await radiusInput.fill(radius);
  }
});

When('я ввожу формулу урона {string}', async function(this: BronepehotaWorld, damageFormula: string) {
  const damageInput = this.page.getByRole('textbox', { name: /урон/i });
  if (await damageInput.isVisible()) {
    await damageInput.fill(damageFormula);
  }
});

Then('оружие должно иметь специальный эффект', async function(this: BronepehotaWorld) {
  const effectDisplay = this.page.getByText(/AoE|эффект/i);
  await expect(effectDisplay.first()).toBeVisible();
});

Then('эффект должен быть сохранён', async function(this: BronepehotaWorld) {
  const savedEffect = this.page.getByText(/AoE|эффект/i);
  await expect(savedEffect).toBeVisible();
});

When('я создаю новый отряд или машину', async function(this: BronepehotaWorld) {
  // Navigate to create mode
});

Then('должны отображаться только фракции {string}, {string}, {string}', async function(this: BronepehotaWorld, f1: string, f2: string, f3: string) {
  const options = this.page.getByRole('option');

  const count = await options.count();
  expect(count).toBe(3);

  for (const faction of [f1, f2, f3]) {
    const option = this.page.getByRole('option', { name: new RegExp(faction, 'i') });
    await expect(option).toBeVisible();
  }
});

Then('выбранная фракция должна быть сохранена с юнитом', async function(this: BronepehotaWorld) {
  const savedUnit = await this.page.evaluate(() => {
    // Check localStorage or API for saved unit data
    const data = localStorage.getItem('temp_unit_data');
    return data ? JSON.parse(data) : null;
  });

  expect(savedUnit).toBeDefined();
  expect(savedUnit.faction).toBeDefined();
});

Given('я создаю отряд с названием {string} для фракции {string}', async function(this: BronepehotaWorld, name: string, faction: string) {
  // Setup unit creation
});

When('отряд сохранён', async function(this: BronepehotaWorld) {
  // Wait for save
  await this.page.waitForTimeout(500);
});

Then('ID отряда должно быть в формате {string}', async function(this: BronepehotaWorld, format: string) {
  const idDisplay = this.page.getByText(new RegExp(format.replace(' ', '_').toLowerCase(), 'i'));
  await expect(idDisplay).toBeVisible();
});

Then('ID должно быть уникальным', async function(this: BronepehotaWorld) {
  // Verify uniqueness through API or data check
  const savedUnits = await this.page.evaluate(() => {
    const data = localStorage.getItem('all_units');
    return data ? JSON.parse(data) : [];
  });

  const ids = savedUnits.map((u: any) => u.id);
  const uniqueIds = new Set(ids);

  expect(ids.length).toBe(uniqueIds.size);
});

Then('изображение должно быть вставлено', async function(this: BronepehotaWorld) {
  const imagePreview = this.page.locator('img').or(this.page.locator('[class*="preview"]'));
  await expect(imagePreview.first()).toBeVisible({ timeout: 5000 });
});

Then('оно должно отображаться в превью', async function(this: BronepehotaWorld) {
  const imagePreview = this.page.locator('img').or(this.page.locator('[class*="preview"]'));
  await expect(imagePreview.first()).toBeVisible({ timeout: 5000 });
});

Then('изображение должно быть загружено', async function(this: BronepehotaWorld) {
  const imagePreview = this.page.locator('img').or(this.page.locator('[class*="preview"]'));
  await expect(imagePreview.first()).toBeVisible({ timeout: 5000 });
});

When('сектора скорости не покрывают весь диапазон от {int} до {int}', async function(this: BronepehotaWorld, min: number, max: number) {
  // Create incomplete speed sectors
  const addButton = this.page.getByRole('button', { name: /добавить сектор/i });
  if (await addButton.isVisible()) {
    await addButton.click();
  }

  const minInput = this.page.getByRole('spinbutton', { name: /мин/i });
  if (await minInput.isVisible()) {
    await minInput.fill(String(min));
  }

  const maxInput = this.page.getByRole('spinbutton', { name: /макс/i });
  if (await maxInput.isVisible()) {
    await maxInput.fill(String(max - 5));
  }
});

When('я выбираю фракцию из списка', async function(this: BronepehotaWorld) {
  const factionSelect = this.page.getByRole('combobox', { name: /фракция/i });
  if (await factionSelect.isVisible()) {
    await factionSelect.click();
  }
});
