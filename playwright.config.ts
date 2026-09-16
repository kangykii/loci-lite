import { defineConfig, devices } from '@playwright/test';

const isWindows = process.platform === 'win32';

export default defineConfig({
  testDir: './tests/regression',
  // Visual checks need a stable renderer; one browser at a time avoids
  // resource contention and makes their baselines reproducible locally/CI.
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    locale: 'en-AU',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 860 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: isWindows
      ? 'node_modules\\.bin\\vite.cmd --host 127.0.0.1 --port 4173'
      : './node_modules/.bin/vite --host 127.0.0.1 --port 4173',
    env: { VITE_REGRESSION_FIXTURE: 'editor', VITE_PORT: '4173' },
    reuseExistingServer: false,
    timeout: 90_000,
    url: 'http://127.0.0.1:4173',
  },
});
