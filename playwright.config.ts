import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'frontend/tests',
  timeout: 60_000, // Increased timeout for e2e tests
  expect: { timeout: 15_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0, // Retry on CI
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Global test timeout
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  webServer: {
    command: 'cd frontend && npm run dev',
    port: 4000,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*\.spec\.ts/,
    },
    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/.*\.spec\.ts/,
      timeout: 120_000, // Longer timeout for e2e tests
    },
  ],
  // Global setup and teardown
  globalSetup: 'frontend/tests/global-setup.ts',
  globalTeardown: 'frontend/tests/global-teardown.ts',
})