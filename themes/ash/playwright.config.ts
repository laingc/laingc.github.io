import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 4,
  use: {
    baseURL: 'http://127.0.0.1:1314/demo/',
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-tests.mjs',
    url: 'http://127.0.0.1:1314/demo/',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
