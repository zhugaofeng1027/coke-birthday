import { test, expect } from './fixtures.js';

const KEY = 'birthday-bistro-cooking-v2';
const INTRO_KEY = 'birthday-bistro-opening-v1';
const INTRO_SESSION_KEY = 'birthday-bistro-opening-session-v1';
const saved = JSON.stringify({ completed: [0], finished: false });
async function seed(page) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: KEY, value: saved });
}
async function selectDebug(scope, selection) {
  await scope.getByRole('button', { name: '关卡调试', exact: true }).click();
  await scope.locator('[name="play-mode"][value="debug"]').check();
  await scope.locator('[name="debug-chapter"]').selectOption(String(selection));
  await scope.locator('#debug-form button[type="submit"]').click();
}
async function enter(scope, chapter) {
  await selectDebug(scope, chapter);
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

test('debug menu jumps to and restarts the opening, hidden gift and candles without saving', async ({ page }) => {
  await seed(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(key => sessionStorage.removeItem(key), INTRO_SESSION_KEY);

  await selectDebug(page, 'opening');
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await page.getByRole('button', { name: '拆开邀请' }).click();
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '1');
  await selectDebug(page, 'opening');
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await page.getByRole('button', { name: '跳过开场' }).click();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '0');
  await expect(page).not.toHaveURL(/intro=/);

  await selectDebug(page, 'opening');
  await selectDebug(page, 'flower');
  const flower = page.locator('.flower-room-grid');
  await expect(flower).toHaveAttribute('data-phase', 'door');
  await page.locator('[data-action="flower-enter"]').click();
  await expect(flower).not.toHaveAttribute('data-phase', 'door');
  await selectDebug(page, 'flower');
  await expect(flower).toHaveAttribute('data-phase', 'door');
  await expect(page).toHaveURL(/flower-room=1/);

  await selectDebug(page, 'candles');
  await expect(page.locator('[data-action="wish-mic"]')).toBeEnabled();
  await expect(page.getByRole('button', { name: '关卡调试', exact: true })).toBeInViewport({ ratio: 1 });
  await page.locator('[data-action="wish"]').click();
  await expect(page.locator('.cake-scene')).toHaveClass(/candles-out/);
  await selectDebug(page, 'candles');
  await expect(page.locator('.cake-scene')).not.toHaveClass(/candles-out/);
  await expect(page).toHaveURL(/candle=1/);
  await story(page);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
  await expect(page).not.toHaveURL(/debug|chapter|intro|flower-room|candle/);
  const storage = await page.evaluate(({ key, intro, session }) => ({
    progress: localStorage.getItem(key), seen: localStorage.getItem(intro), entered: sessionStorage.getItem(session),
  }), { key: KEY, intro: INTRO_KEY, session: INTRO_SESSION_KEY });
  expect(storage).toEqual({ progress: saved, seen: null, entered: null });
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

test('phone preview remembers all three debug scenes in the shell and standalone link', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop preview shell.');
  await seed(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?preview=phone');
  const game = page.frameLocator('iframe');
  await page.getByLabel('预览设备尺寸').selectOption('compact');
  for (const [selection, param, selector] of [
    ['opening', 'intro', '.opening'],
    ['flower', 'flower-room', '.flower-room-grid[data-phase="door"]'],
    ['candles', 'candle', '.cake-scene:not(.candles-out)'],
  ]) {
    await selectDebug(game, selection);
    const matching = new RegExp(`[?&]${param}=1(?:&|$)`);
    await expect(page).toHaveURL(matching);
    await expect(page.locator('#preview-open')).toHaveAttribute('href', matching);
    await expect(game.locator(selector)).toBeVisible();
    expect(new URL(page.url()).searchParams.get('chapter')).toBe(selection === 'opening' ? '1' : '6');
    expect(['intro', 'flower-room', 'candle'].filter(key => new URL(page.url()).searchParams.has(key))).toEqual([param]);
    await page.reload();
    await expect(game.locator(selector)).toBeVisible();
    await page.getByLabel('预览设备尺寸').selectOption('compact');
  }
  await enter(game, 5);
  await expect(page).not.toHaveURL(/intro|flower-room|candle/);
  await story(game);
  await expect(page).not.toHaveURL(/debug|chapter/);
});

test('invalid debugging chapter falls back to the first kitchen', async ({ page }) => {
  await page.goto('/?debug=1&chapter=99');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '0');
});

test('production ignores debugging URLs and keeps chapter locks', async ({ page }, testInfo) => {
  test.skip(!process.env.PRODUCTION_TEST_URL || testInfo.project.name !== 'desktop', 'Set a production preview URL to verify the release build.');
  await seed(page); await page.goto(`${process.env.PRODUCTION_TEST_URL}/?debug=1&chapter=6&intro=1&flower-room=1&candle=1`);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'story');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
  await expect(page.getByRole('button', { name: '关卡调试', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-action="chapter"][data-index="5"]')).toBeDisabled();
});
