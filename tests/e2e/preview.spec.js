import { test, expect } from '@playwright/test';

test('a narrow desktop window can play without a rotation prompt', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop input detection regression.');
  await page.setViewportSize({ width: 647, height: 690 });
  await page.goto('/');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/needs-rotation/);
  const x = Number(await page.locator('#kitchen-host').getAttribute('data-player-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await expect.poll(async () => Number(await page.locator('#kitchen-host').getAttribute('data-player-x'))).toBeGreaterThan(x + 30);
  await page.getByRole('button', { name: '手机横屏预览', exact: true }).click();
  await expect(page).toHaveURL(/preview=phone/);
  await expect(page.locator('iframe')).toBeVisible();
});

test('desktop phone preview fits narrow panels and preserves the chef when resized', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'The preview shell is a desktop debugging tool.');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 647, height: 690 });
  await page.goto('/?preview=phone');
  const game = page.frameLocator('iframe');
  const host = game.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  await expect(game.locator('body')).toHaveClass(/landscape-play/);
  await expect(game.locator('.rotation-prompt')).toBeHidden();
  await expect(game.locator('#kitchen')).toHaveAttribute('height', '600');
  const geometry = () => page.locator('iframe').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, viewport: innerWidth, height: innerHeight, width: el.contentWindow.innerWidth };
  });
  let rect = await geometry();
  expect(rect.width).toBe(844);
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.right).toBeLessThanOrEqual(rect.viewport);
  expect(rect.bottom).toBeLessThanOrEqual(rect.height);
  await game.locator('#kitchen').click();
  const x = Number(await host.getAttribute('data-player-x'));
  await page.keyboard.down('d'); await page.waitForTimeout(300); await page.keyboard.up('d');
  await page.waitForTimeout(120);
  await expect.poll(async () => Number(await host.getAttribute('data-player-x'))).toBeGreaterThan(x + 30);
  const moved = Number(await host.getAttribute('data-player-x'));
  await page.locator('#preview-size').selectOption('compact');
  await expect.poll(async () => (await geometry()).width).toBe(568);
  expect(Math.abs(Number(await host.getAttribute('data-player-x')) - moved)).toBeLessThan(2);
  await game.locator('[data-action="share"]').click();
  await expect(game.locator('.share-url')).not.toHaveValue(/layout|preview/);
  await game.locator('[data-action="close"]').click();
  await page.locator('#preview-size').selectOption('standard');
  await page.screenshot({ path: 'test-results/desktop-phone-preview.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 320, height: 740 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await expect.poll(async () => {
    const current = await geometry();
    return current.right <= current.viewport && current.bottom <= current.height;
  }).toBeTruthy();
  rect = await geometry();
  expect(rect.right).toBeLessThanOrEqual(rect.viewport);
  expect(rect.bottom).toBeLessThanOrEqual(rect.height);
  await page.locator('#preview-back').click();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  expect(errors).toEqual([]);
});

test('explicit desktop layout bypasses rotation even with touch input', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Explicit layout override regression.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?layout=desktop');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/needs-rotation|landscape-play/);
});
