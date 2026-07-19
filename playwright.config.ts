import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E testing configuration for Next.js
 * @see https://playwright.dev/docs/test-configuration
 */
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
    baseURL: 'http://localhost:3001',
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
    command: process.env.CI ? 'echo "Server already started by CI workflow"' : 'npm run dev:e2e',
    url: 'http://localhost:3001',
    reuseExistingServer: true, // Always reuse existing server
    timeout: 60 * 1000,
  },
});
