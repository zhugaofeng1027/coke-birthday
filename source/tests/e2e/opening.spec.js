import { test, expect } from '@playwright/test';

const KEY = 'birthday-bistro-cooking-v2';
const INTRO_KEY = 'birthday-bistro-opening-v1';
const SESSION_KEY = 'birthday-bistro-opening-session-v1';
async function opening(page) {
  await page.goto('/');
  await expect(page.locator('.opening')).toHaveAttribute('data-ready', 'true');
}
async function next(page) { await page.locator('[data-opening="next"]').click(); }
async function inViewport(page, selector) {
  const box = await page.locator(selector).boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

test('four opening scenes show real artwork and enter the first kitchen without spoilers', async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const warmup = page.waitForRequest(/\/kitchen-engine(?:-[\w-]+)?\.js(?:\?|$)/);
  await opening(page);
  await warmup;
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await expect(page.locator('#kitchen-host')).toHaveCount(0);
  await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.rotation-prompt')).toHaveCount(0);
  await inViewport(page, '.opening-next');
  const initial = await page.locator('.opening-canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(220);
  expect(await page.locator('.opening-canvas').evaluate(canvas => canvas.toDataURL())).not.toBe(initial);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-opening-store.png` });
  await next(page);
  await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.opening-letter')).toBeVisible();
  await expect(page.locator('.opening-letter')).toContainText('藏进了六道特别菜单里');
  await inViewport(page, '.opening-letter');
  expect(await page.locator('.opening-letter').evaluate(el => el.scrollHeight <= el.clientHeight)).toBeTruthy();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-opening-letter.png`, animations: 'disabled' });
  await next(page);
  await expect(page.locator('.opening-menu')).toBeVisible();
  await inViewport(page, '.opening-menu');
  const colors = await page.locator('[data-moment]').evaluateAll(canvases => canvases.map(canvas => {
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set();
    for (let i = 0; i < pixels.length; i += 100) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
    return colors.size;
  }));
  colors.forEach(count => expect(count).toBeGreaterThan(30));
  for (const spoiler of ['果汁软糖', 'Chiikawa', '相纸', '香水礼盒']) await expect(page.locator('.opening')).not.toContainText(spoiler);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-opening-menu.png`, animations: 'disabled' });
  await next(page);
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '3');
  await expect(page.locator('.opening-next')).toHaveText('开门，今天我主厨');
  await page.waitForTimeout(650);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-opening-door.png` });
  await next(page);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), INTRO_KEY)).toBe(true);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
  await page.reload();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.opening')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('returning players can continue or replay without losing progress or the live kitchen', async ({ page }) => {
  const saved = JSON.stringify({ completed: [0, 1], finished: false });
  await page.addInitScript(({ key, saved }) => localStorage.setItem(key, saved), { key: KEY, saved });
  await opening(page);
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', 'welcome');
  await expect(page.locator('.opening-next')).toHaveText('继续第 3 道菜单');
  await page.locator('[data-opening="replay"]').click();
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await page.locator('[data-opening="skip"]').click();
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  await expect(host).toHaveAttribute('data-theme', '2');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(250); await page.keyboard.up('ArrowRight');
  await page.locator('[data-action="settings"]').click();
  const x = Number(await host.getAttribute('data-player-x'));
  await page.locator('[data-action="opening-replay"]').click();
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await page.locator('[data-opening="skip"]').click();
  await expect(host).toHaveAttribute('data-ready', 'true');
  expect(Math.abs(Number(await host.getAttribute('data-player-x')) - x)).toBeLessThan(2);
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(saved);
  await page.evaluate(key => sessionStorage.removeItem(key), SESSION_KEY);
  await page.reload();
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', 'welcome');
  await next(page);
  await expect(host).toHaveAttribute('data-theme', '2');
});

test('opening auto plays to the door and waits for the player', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Autoplay timing runs once.');
  await opening(page);
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '3', { timeout: 18000 });
  await page.waitForTimeout(700);
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '3');
  await expect(page.locator('#kitchen-host')).toHaveCount(0);
});

test('opening can be paused and its sound choice survives entering the kitchen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Playback timing runs once.');
  await opening(page);
  await page.getByRole('button', { name: '暂停开场', exact: true }).click();
  await page.waitForTimeout(3300);
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '0');
  await page.getByRole('button', { name: '继续播放开场', exact: true }).click();
  await expect(page.locator('.opening')).toHaveAttribute('data-stage', '1', { timeout: 4500 });
  await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-opening="skip"]').click();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
});

test('reduced motion keeps the story still and supports keyboard entry', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await opening(page);
  const image = await page.locator('.opening-canvas').evaluate(canvas => canvas.toDataURL());
  await page.waitForTimeout(180);
  expect(await page.locator('.opening-canvas').evaluate(canvas => canvas.toDataURL())).toBe(image);
  await expect(page.locator('[data-opening="pause"]')).toBeHidden();
  for (let i = 0; i < 4; i++) {
    await page.locator('.opening-next').focus(); await page.keyboard.press('Enter');
  }
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
});

test('a long custom sender stays on the invitation and is rendered as text', async ({ page }) => {
  const sender = '<img>' + '小助手'.repeat(11);
  await page.addInitScript(sender => localStorage.setItem('birthday-bistro-config-v1', JSON.stringify({ sender })), sender);
  await opening(page);
  await next(page);
  await expect(page.locator('.opening-letter cite')).toHaveText(`来自 ${sender}`);
  await expect(page.locator('.opening-letter img')).toHaveCount(0);
  expect(await page.locator('.opening-letter').evaluate(el => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth)).toBeTruthy();
});

test('portrait opening waits to ask for rotation until the kitchen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Portrait touch entry.');
  await page.setViewportSize({ width: 390, height: 844 });
  await opening(page);
  await next(page);
  await inViewport(page, '.opening-letter');
  await page.screenshot({ path: 'test-results/portrait-opening-letter.png', animations: 'disabled' });
  await next(page);
  await inViewport(page, '.opening-menu');
  await page.screenshot({ path: 'test-results/portrait-opening-menu.png', animations: 'disabled' });
  await page.locator('[data-opening="skip"]').click();
  await expect(page.locator('body')).toHaveClass(/needs-rotation/);
  await expect(page.locator('.rotation-prompt')).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
});
