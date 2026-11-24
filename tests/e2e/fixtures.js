import { test as base, expect } from '@playwright/test';

// Kitchen regressions start after the opening; opening.spec.js covers the fresh entry.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => sessionStorage.setItem('birthday-bistro-opening-session-v1', 'true'));
    await use(page);
  },
});
export { expect };
