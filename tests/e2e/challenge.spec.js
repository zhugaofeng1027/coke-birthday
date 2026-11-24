import { test, expect } from './fixtures.js';

test('orders hide preparation instructions and the challenge clock pauses for reading', async ({ page }) => {
  await page.goto('/?debug=1&chapter=2');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  for (const selector of ['.mobile-recipe', '.cooking-recipe']) await expect(page.locator(selector)).not.toContainText(/切配|煮锅|烤箱|秒|新鲜装盘/);
  await expect(page.locator('#shift-score')).toHaveText('0 / 200');
  const start = Number(await host.getAttribute('data-time-left'));
  await expect.poll(async () => Number(await host.getAttribute('data-time-left'))).toBeLessThan(start);
  await page.getByRole('button', { name: '查看本关线索', exact: true }).click();
  const paused = await host.getAttribute('data-time-left');
  await page.waitForTimeout(1300);
  await expect(host).toHaveAttribute('data-time-left', paused);
  await page.getByRole('button', { name: '继续料理', exact: true }).click();
  await expect.poll(async () => Number(await host.getAttribute('data-time-left'))).toBeLessThan(Number(paused));
  const boxes = await page.locator('.shift-hud').evaluate(el => [...el.children].map(child => {
    const r = child.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight };
  }));
  for (const box of boxes) {
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(box.width); expect(box.bottom).toBeLessThanOrEqual(box.height);
  }
});

test('expiry freezes the kitchen, denies gifts and retries with fresh time and score', async ({ page }) => {
  // Shorten only the test's module response; production challenge settings stay unchanged.
  await page.route('**/src/cooking.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('timeLeft: CHALLENGES[chapter].seconds', 'timeLeft: 5');
    await route.fulfill({ response, body });
  });
  await page.goto('/?debug=1&chapter=2');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.shift-hud')).toHaveClass(/urgent/);
  await expect(page.locator('.challenge-result-modal')).toBeVisible({ timeout: 10000 });
  await expect(host).toHaveAttribute('data-expired', 'true');
  await expect(page.locator('#shift-time')).toHaveText('00:00');
  await expect(page.locator('.letter-modal, .gift-modal')).toHaveCount(0);
  await page.getByRole('button', { name: '关闭', exact: true }).click();
  const before = await host.evaluate(el => [el.dataset.playerX, el.dataset.playerY]);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(400); await page.keyboard.up('ArrowRight');
  expect(await host.evaluate(el => [el.dataset.playerX, el.dataset.playerY])).toEqual(before);
  await expect(page.locator('[data-action="kitchen-interact"]')).toBeDisabled();
  await page.locator('[data-action="confirm-retry"]').click();
  await page.locator('[data-action="retry-dish"]').click();
  await expect(host).toHaveAttribute('data-ready', 'true');
  await expect(host).toHaveAttribute('data-expired', 'false');
  await expect(host).toHaveAttribute('data-score', '0');
  expect(Number(await host.getAttribute('data-time-left'))).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('birthday-bistro-cooking-v2'))).toBe(null);
});

test('gift modal keeps its title, close and action visible with a long message', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0], finished: false }));
    localStorage.setItem('birthday-bistro-config-v1', JSON.stringify({
      gifts: [{ name: '果汁软糖', message: '生日快乐！这是送给你的长长留言，希望你在新的一岁天天开心。'.repeat(80) }],
    }));
  });
  await page.goto('/');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await page.locator('[data-action="album"]:visible, [data-action="album-shortcut"]:visible').click();
  await expect(page.locator('.album-item .gift-photo')).toHaveCount(1);
  await expect(page.locator('.album-item.locked')).toHaveCount(5);
  await page.locator('[data-action="revisit"][data-index="0"]').click();
  await expect(page.locator('.gift-modal')).toBeVisible();
  const photo = page.locator('.gift-modal .gift-photo');
  await expect(photo).toHaveAttribute('src', /gift-grape-candy\.webp$/);
  await expect(photo).toHaveCSS('object-fit', 'contain');
  expect(await photo.evaluate(async img => { await img.decode(); return img.naturalWidth; })).toBeGreaterThan(0);
  const result = await page.locator('.gift-modal').evaluate(el => {
    const scroll = el.querySelector('.reward-scroll');
    const boxes = ['h2', '.modal-close', '.primary-button', '.gift-art img'].map(selector => {
      const r = el.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    });
    return { boxes, width: innerWidth, height: innerHeight, scrollable: scroll.scrollHeight > scroll.clientHeight, scrollTop: el.scrollTop };
  });
  expect(result.scrollTop).toBe(0);
  expect(result.scrollable).toBe(true);
  for (const rect of result.boxes) {
    expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(result.width + 1); expect(rect.bottom).toBeLessThanOrEqual(result.height + 1);
  }
  await page.locator('.gift-modal .reward-scroll').evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(page.locator('.gift-modal')).toHaveJSProperty('scrollTop', 0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-gift-long-message.png`, animations: 'disabled' });
  await page.getByRole('button', { name: '好好收下这份心意', exact: true }).click();
  await expect(page.locator('.gift-modal')).toHaveCount(0);
});

test('rolling orders arrive without delivery, pause for clues and expire with a score penalty', async ({ page }, testInfo) => {
  await page.route('**/src/cooking.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text())
      .replace('orderInterval: [40, 45, 50, 45, 40, 45][chapter]', 'orderInterval: 2')
      .replace('orderLifetime: [110, 130, 150, 130, 110, 130][chapter]', 'orderLifetime: 8');
    await route.fulfill({ response, body });
  });
  await page.goto('/?debug=1&chapter=2');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  await expect(host).toHaveAttribute('data-order-ids', '1');
  await expect(host).toHaveAttribute('data-order-ids', '1,2,3', { timeout: 30000 });
  await expect(host).toHaveAttribute('data-deliveries', '0');
  const cards = page.locator('.rolling-order');
  await expect(cards).toHaveCount(3);
  const countdowns = await page.locator('.order-time').allTextContents();
  expect(new Set(countdowns).size).toBe(3);
  await page.getByRole('button', { name: '查看本关线索', exact: true }).click();
  const frozen = await host.evaluate(el => [el.dataset.orderIds, el.dataset.score, el.dataset.timeLeft]);
  const times = await page.locator('.order-time').allTextContents();
  await page.waitForTimeout(2300);
  expect(await host.evaluate(el => [el.dataset.orderIds, el.dataset.score, el.dataset.timeLeft])).toEqual(frozen);
  expect(await page.locator('.order-time').allTextContents()).toEqual(times);
  await page.getByRole('button', { name: '继续料理', exact: true }).click();
  await expect(host).toHaveAttribute('data-missed-orders', '1', { timeout: 30000 });
  await expect(page.locator('#shift-score')).toHaveText('-30 / 200');
  await expect(page.locator('[data-order-id="1"]')).toHaveCount(0);
  await expect(page.locator('#toast')).toContainText('超时');
  await expect(host).toHaveAttribute('data-expired', 'false');
  await expect(page.locator('.letter-modal')).toHaveCount(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-rolling-orders.png`, animations: 'disabled' });
  const queue = await page.locator('.order-queue').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: innerWidth, height: innerHeight, clipped: el.scrollWidth > el.clientWidth };
  });
  expect(queue.x).toBeGreaterThanOrEqual(0); expect(queue.y).toBeGreaterThanOrEqual(0);
  expect(queue.right).toBeLessThanOrEqual(queue.width + 1); expect(queue.bottom).toBeLessThanOrEqual(queue.height + 1);
  if (testInfo.project.name === 'compact-phone') expect(queue.clipped).toBe(true);
  await page.locator('.order-queue').evaluate(el => { el.scrollLeft = el.scrollWidth; });
  if (queue.clipped) expect(await page.locator('.order-queue').evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.locator('.order-queue').focus();
  const position = await host.evaluate(el => [el.dataset.playerX, el.dataset.playerY]);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(200);
  await page.keyboard.up('ArrowRight');
  expect(await host.evaluate(el => [el.dataset.playerX, el.dataset.playerY])).toEqual(position);
});
