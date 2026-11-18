import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 150000,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5173', headless: true },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1080 } } },
    { name: 'mobile', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
    { name: 'small-mobile', use: { viewport: { width: 740, height: 320 }, isMobile: true, hasTouch: true } },
    { name: 'compact-phone', use: { viewport: { width: 568, height: 320 }, isMobile: true, hasTouch: true } },
    { name: 'tablet', use: { viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true } },
  ],
});
