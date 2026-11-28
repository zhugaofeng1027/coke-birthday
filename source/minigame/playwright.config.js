import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './tests',
  outputDir: '../test-results/wechat',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5181', isMobile: true, hasTouch: true },
  projects: [
    { name: 'phone', use: { viewport: { width: 844, height: 390 } } },
    { name: 'compact', use: { viewport: { width: 568, height: 320 } } },
  ],
  webServer: {
    command: 'npm run dev:wechat -- --strictPort',
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    url: 'http://127.0.0.1:5181',
    reuseExistingServer: true,
  },
});
