import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E testing configuration for Next.js
 * @see https://playwright.dev/docs/test-configuration
 *
 * E2E_PORT (default 3001): соседние сессии делят порты 3000-3003 — если
 * :3001 занят ЧУЖИМ сервером (проверь /proc/<pid>/cwd), запускай сюит на
 * свободном порту: `E2E_PORT=3002 npx playwright test`. Иначе
 * reuseExistingServer молча прогонит тесты по чужому билду.
 */
const E2E_PORT = process.env.E2E_PORT || '3001';
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use */
  reporter: 'html',
  /* Shared settings for all tests */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: E2E_BASE_URL,
    /* Боевой инструктаж не должен перекрывать экран боя в e2e: сеем флаг
       «пройден» в каждый контекст. Спеки, сидящие армию через собственный
       localStorage.clear(), перепосевают флаг в своих скриптах;
       battle-tutorial.spec снимает флаг явно. */
    storageState: {
      cookies: [],
      origins: [{
        origin: E2E_BASE_URL,
        localStorage: [{ name: 'bronepehota_battle_tutorial_done', value: '1' }],
      }],
    },
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // On CI: server is started by the workflow, just reuse it
  // Locally: start dev server automatically
  webServer: {
    command: process.env.CI
      ? 'echo "Server already started by CI workflow"'
      : `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST NEXT_PUBLIC_YANDEX_METRICA_ID=111302711 PORT=${E2E_PORT} next dev`,
    url: E2E_BASE_URL,
    // Свой порт (E2E_PORT) — свой сервер; дефолт :3001 переиспользуется как раньше
    reuseExistingServer: process.env.E2E_PORT ? false : true,
    timeout: 60 * 1000,
  },
});
