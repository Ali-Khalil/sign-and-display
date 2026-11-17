import { defineConfig } from '@playwright/test';

// Tests run against the preview build with sample content:
//   pnpm build:preview && pnpm test
// Set PLAYWRIGHT_CHROMIUM_PATH to use an already-installed Chromium.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4391',
    trace: 'off',
    launchOptions: { executablePath },
  },
  projects: [
    // Mid-range Android phone size, with touch.
    { name: 'mobile', use: { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm exec astro preview --port 4391 --ignore-lock',
    url: 'http://localhost:4391',
    reuseExistingServer: !process.env.CI,
  },
});
