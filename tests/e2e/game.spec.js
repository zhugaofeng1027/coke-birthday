import { test, expect } from '@playwright/test';

test('six real puzzles, six reveals, birthday ending and saved progress', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('今天也要开心');
  await expect(page.getByRole('button', { name: /神秘便当/ })).toBeDisabled();
  await page.locator('[data-action="serve"]').click();
  await expect(page.locator('.feedback')).toContainText('差一点点');

  for (const fruit of ['banana', 'grape', 'strawberry']) await page.locator(`[data-action="fruit"][data-id="${fruit}"]`).click();
  await reveal(page, 0, '果汁软糖');
  for (const [i, id] of ['rice', 'broccoli', 'strawberry'].entries()) await page.locator(`[data-customer="${i}"]`).selectOption(id);
  await reveal(page, 1, 'Chiikawa 挂件');
  for (let i = 0; i < 3; i++) await page.locator(`[data-action="scrap"][data-id="${i}"]`).click();
  for (const id of ['wash', 'simmer', 'plate']) await page.locator(`[data-action="recipe"][data-id="${id}"]`).click();
  await reveal(page, 2, '卤货零食大礼盒');
  for (const id of ['morning', 'afternoon', 'night']) await page.locator(`[data-action="photo"][data-id="${id}"]`).click();
  await reveal(page, 3, '拍立得相纸');
  for (const id of ['lights', 'flowers', 'radio']) await page.locator(`[data-action="ambience"][data-id="${id}"]`).click();
  await reveal(page, 4, '香薰');
  for (const id of [2, 0, 4, 1, 3]) await page.locator(`[data-action="token"][data-id="${id}"]`).click();
  await reveal(page, 5, '古驰香水礼盒');
  await page.locator('[data-action="wish"]').click();
  await expect(page.getByRole('heading', { name: '新的一岁，继续一起胡闹吧。' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: '新的一岁，继续一起胡闹吧。' })).toBeVisible();
  await page.locator('[data-action="album"]').click();
  await expect(page.locator('.album-item:not(.locked)')).toHaveCount(6);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

async function reveal(page, i, name) {
  await page.locator('[data-action="serve"]').click();
  await expect(page.locator('#guess')).toBeVisible();
  await page.locator('#guess').fill('不正确的猜测也可以收到礼物');
  await page.locator('[data-action="reveal"]').click();
  await expect(page.locator('.gift-modal h2')).toHaveText(name);
  await expect(page.locator('.package-number')).toContainText(`0${i + 1}`);
  await page.locator('[data-action="next"]').click();
}

test('custom notes, hint assistance, QR, restart and no spoilers in album', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-action="album"]').click();
  await expect(page.locator('.album-item.locked')).toHaveCount(6);
  await expect(page.locator('.album-grid')).not.toContainText('香水');
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[name="recipient"]').fill('小寿星');
  await page.locator('[name="riddle-0"]').fill('只属于我们的甜甜暗号');
  await page.getByRole('button', { name: '保存到本机' }).click();
  await expect(page.locator('h1')).toContainText('小寿星');
  await page.reload();
  await expect(page.locator('h1')).toContainText('小寿星');
  for (let i = 0; i < 3; i++) await page.locator('[data-action="hint"]').click();
  await page.locator('[data-action="serve"]').click();
  await expect(page.locator('.riddle-letter')).toContainText('只属于我们的甜甜暗号');
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="share"]').click();
  await expect(page.locator('#qr-canvas')).toBeVisible();
  const qr = await page.locator('#qr-canvas').evaluate((c) => c.width > 100 && c.getContext('2d').getImageData(30, 30, 1, 1).data.length === 4);
  expect(qr).toBeTruthy();
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="confirm-reset"]').click();
  await page.locator('[data-action="reset"]').click();
  await expect(page.locator('h1')).toContainText('小寿星');
  await expect(page.locator('.menu-bottom p')).toContainText('0 / 6');
});

test('responsive scene is drawn, controls fit, and settings safely display markup as text', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.waitForTimeout(350);
  const pixels = await page.locator('#kitchen').evaluate(c => {
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let visible = 0; let varied = new Set();
    for (let i = 0; i < data.length; i += 400) { if (data[i + 3] > 0) visible++; varied.add(`${data[i]}-${data[i + 1]}-${data[i + 2]}`); }
    return { visible, colors: varied.size };
  });
  expect(pixels.visible).toBeGreaterThan(100);
  expect(pixels.colors).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-kitchen.png`, fullPage: true });
  await page.locator('[data-action="settings"]').click();
  await page.locator('[name="recipient"]').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: '保存到本机' }).click();
  await expect(page.locator('h1')).toContainText('<img src=x onerror=alert(1)>');
  expect(await page.locator('h1 img').count()).toBe(0);
});
