import { test, expect } from './fixtures.js';

const KEY = 'birthday-bistro-cooking-v2';

test('flower room resumes the bouquet and reveals the hidden gift before cake', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(key => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify({ completed: [0, 1, 2, 3, 4, 5], finished: false }));
    }
  }, KEY);
  await page.goto('/');
  const scene = page.locator('.flower-room-grid');
  const action = name => scene.locator(`[data-action="flower-${name}"]`);
  await expect(scene).toHaveAttribute('data-phase', 'door');
  await expect(page.locator('.shift-hud, .order-queue, .ending-scene, [data-action="flower-revisit"]')).toHaveCount(0);
  await expect(scene.getByRole('img', { name: /DIMOO/ })).toHaveCount(0);
  await action('enter').click();
  await action('open').click();
  expect(await scene.locator('.flower-figure').evaluate(async img => { await img.decode(); return img.naturalWidth; })).toBeGreaterThan(0);
  await action('place').click();
  await scene.getByRole('button', { name: '浅粉花枝' }).click();
  await expect(scene).toHaveAttribute('data-phase', 'light');
  await expect(scene).toHaveAttribute('data-flower', 'pink');
  await page.reload();
  await expect(scene).toHaveAttribute('data-phase', 'light');
  await expect(scene).toHaveAttribute('data-flower', 'pink');
  await action('light').click();
  const product = scene.getByRole('img', { name: 'DIMOO 手办 + 永生花' });
  await expect(page.locator('.flower-room-bar')).toBeInViewport({ ratio: 1 });
  await expect(product).toBeInViewport({ ratio: 1 });
  await expect(action('finish')).toBeInViewport({ ratio: 1 });
  await expect(scene.locator('.flower-letter')).toContainText('也想长长久久地陪在你身边');
  expect(await product.evaluate(async img => { await img.decode(); return img.naturalWidth; })).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('flower-room-gift.png') });
  await page.reload();
  await expect(scene).toHaveAttribute('data-phase', 'reveal');
  await action('finish').click();
  await expect(page.locator('.birthday-transformation')).toHaveAttribute('data-phase', 'complete');
  await page.locator('[data-action="wish"]').click();
  await page.locator('[data-action="album"]').click();
  await page.locator('.album-item[data-action="flower-revisit"]').click();
  await expect(page.locator('.flower-revisit h2')).toHaveText('DIMOO 手办 + 永生花');
  const save = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
  expect(save).toEqual({ completed: [0, 1, 2, 3, 4, 5], finished: true, flowerRoom: { phase: 'done', flower: 'pink' } });
});

test('flower room dev preview does not write a story save', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'compact-phone');
  await page.goto('/?debug=1&chapter=6&flower-room=1');
  await expect(page.getByRole('heading', { name: '打烊啦' })).toBeVisible();
  await page.locator('[data-action="flower-enter"]').click();
  await page.locator('[data-action="flower-open"]').click();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
});
