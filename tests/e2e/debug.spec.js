import { test, expect } from '@playwright/test';

const KEY = 'birthday-bistro-cooking-v2';
const saved = JSON.stringify({ completed: [0], finished: false });
async function seed(page) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: KEY, value: saved });
}
async function enter(scope, chapter) {
  await scope.getByRole('button', { name: '关卡调试', exact: true }).click();
  await scope.locator('[name="play-mode"][value="debug"]').check();
  await scope.locator('[name="debug-chapter"]').selectOption(String(chapter));
  await scope.locator('#debug-form button[type="submit"]').click();
  await expect(scope.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(scope.locator('#kitchen-host')).toHaveAttribute('data-theme', String(chapter));
}
async function story(scope) {
  await scope.getByRole('button', { name: '关卡调试', exact: true }).click();
  await scope.locator('[name="play-mode"][value="story"]').check();
  await expect(scope.locator('[name="debug-chapter"]')).toBeDisabled();
  await scope.locator('#debug-form button[type="submit"]').click();
  await expect(scope.locator('body')).toHaveAttribute('data-play-mode', 'story');
}

test('debug button jumps to every kitchen and restores locked formal progress', async ({ page }, testInfo) => {
  await seed(page); await page.goto('/');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-action="chapter"][data-index="5"]')).toBeDisabled();
  for (let chapter = 0; chapter < 6; chapter++) {
    await enter(page, chapter);
    await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'debug');
    await expect(page.locator('[data-action="chapter"]:disabled')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(saved);
  }
  await page.reload();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '5');
  await page.getByRole('button', { name: '关卡调试', exact: true }).click();
  const before = await page.locator('#kitchen-host').getAttribute('data-player-x');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-player-x', before);
  expect(await page.locator('.debug-modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
  const submit = await page.locator('#debug-form button[type="submit"]').boundingBox();
  const modal = await page.locator('.debug-modal').boundingBox();
  expect(submit.y + submit.height).toBeLessThanOrEqual(modal.y + modal.height);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-debug-menu.png`, fullPage: true, animations: 'disabled' });
  await page.locator('[data-action="close"]').click();
  await story(page);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
  await expect(page.locator('[data-action="chapter"][data-index="2"]')).toBeDisabled();
  expect(new URL(page.url()).searchParams.has('debug')).toBe(false);
  expect(new URL(page.url()).searchParams.has('chapter')).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(saved);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('debug reset and QR sharing never change or expose formal progress', async ({ page }) => {
  await seed(page); await page.goto('/?debug=1&chapter=4');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '3');
  await page.locator('[data-action="share"]').click();
  await expect(page.locator('.share-url')).not.toHaveValue(/debug|chapter|layout|preview/);
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="confirm-reset"]').click();
  await page.locator('[data-action="reset"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'debug');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '0');
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(saved);
  await story(page);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
});

test('phone preview retains debugging chapter across reload and mode changes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop preview shell.');
  await seed(page); await page.goto('/?preview=phone');
  const game = page.frameLocator('iframe');
  await expect(game.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await enter(game, 4);
  await expect(page).toHaveURL(/debug=1.*chapter=5/);
  await expect(page.locator('#preview-open')).toHaveAttribute('href', /debug=1.*chapter=5/);
  await page.reload();
  await expect(game.locator('#kitchen-host')).toHaveAttribute('data-theme', '4');
  await story(game);
  await expect(page).not.toHaveURL(/debug|chapter/);
  await expect(game.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
});

test('invalid debugging chapter falls back to the first kitchen', async ({ page }) => {
  await page.goto('/?debug=1&chapter=99');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '0');
});

test('production ignores debugging URLs and keeps chapter locks', async ({ page }, testInfo) => {
  test.skip(!process.env.PRODUCTION_TEST_URL || testInfo.project.name !== 'desktop', 'Set a production preview URL to verify the release build.');
  await seed(page); await page.goto(`${process.env.PRODUCTION_TEST_URL}/?debug=1&chapter=6`);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'story');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
  await expect(page.getByRole('button', { name: '关卡调试', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-action="chapter"][data-index="5"]')).toBeDisabled();
});
