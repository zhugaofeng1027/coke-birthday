import { test, expect } from './fixtures.js';
import { LANDSCAPE_WORLD, stationsFor } from '../../src/cooking.js';

const demo = '/?debug=1&chapter=1&layout=landscape&touch-demo=1';

test('chapter one touch demo enlarges the controls and keeps larger orders readable', async ({ page }, testInfo) => {
  test.skip(!['mobile', 'small-mobile', 'compact-phone'].includes(testInfo.project.name), 'Touchscreen layouts only.');
  await page.route('**/src/cooking.js*', async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace('orderInterval: [40, 45, 50, 45, 40, 45][chapter]', 'orderInterval: 2');
    await route.fulfill({ response, body });
  });
  const host = page.locator('#kitchen-host');
  const selectors = ['.joystick', '.interact-button', '.chop-button', '.rolling-order', '#kitchen'];
  const sizes = () => page.evaluate(selectors => selectors.map(selector => {
    const el = document.querySelector(selector);
    const { x, y, width, height } = el.getBoundingClientRect();
    const canvas = el instanceof HTMLCanvasElement;
    return { x, y, width, height, canvasWidth: canvas ? el.width : null, canvasHeight: canvas ? el.height : null };
  }), selectors);
  await page.goto(demo.replace('&touch-demo=1', ''));
  await expect(host).toHaveAttribute('data-layout', 'landscape');
  const original = await sizes();
  await page.goto(demo);
  await expect(host).toHaveAttribute('data-layout', 'landscape');
  const enlarged = await sizes();
  const viewport = page.viewportSize();
  enlarged.slice(0, 4).forEach(({ x, y, width, height }, i) => {
    expect(height / original[i].height).toBeGreaterThan(1.2);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(viewport.width);
    expect(y + height).toBeLessThanOrEqual(viewport.height);
  });
  expect(enlarged[4].canvasWidth).toBeGreaterThan(original[4].canvasWidth);
  const [stick, , , , scene] = enlarged;
  const plate = stationsFor({ chapter: 0, layout: 'landscape', touchControlsDemo: true }).find(s => s.id === 'plates');
  const plateLeft = scene.x + scene.width / 2 + (plate.x - LANDSCAPE_WORLD.width / 2) * scene.width / scene.canvasWidth;
  const plateBottom = scene.y + scene.height / 2 + (plate.y + plate.h - LANDSCAPE_WORLD.height / 2) * scene.height / scene.canvasHeight;
  expect(Math.hypot(Math.max(0, plateLeft - stick.x - stick.width / 2),
    Math.max(0, stick.y + stick.height / 2 - plateBottom))).toBeGreaterThan(stick.width / 2);

  const client = await page.context().newCDPSession(page);
  const playerY = async () => Number(await host.getAttribute('data-player-y'));
  const initialY = await playerY();
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { x: stick.x + stick.width / 2, y: stick.y + stick.height * .15, id: 1 },
  ] });
  await expect.poll(playerY).toBeLessThan(initialY - 8);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(host).toHaveAttribute('data-nearest', 'pot');
  const interact = page.locator('.interact-button');
  await expect(interact).toBeEnabled();
  await interact.tap();
  await expect(page.locator('#kitchen-feedback')).not.toContainText('欢迎');

  await expect(page.locator('[data-order-id="3"]')).toBeAttached();
  const allVisibleCardsFit = () => page.locator('.rolling-order:not([hidden]) .order-food').evaluateAll(rows =>
    rows.length > 0 && rows.every(row => row.scrollWidth <= row.clientWidth + 1 && row.scrollHeight <= row.clientHeight + 1));
  expect(await allVisibleCardsFit()).toBe(true);
  if (testInfo.project.name !== 'mobile') {
    await page.getByRole('button', { name: '下一页订单' }).tap();
    await expect(page.locator('.order-page-count')).toHaveText(/^2\//);
    expect(await allVisibleCardsFit()).toBe(true);
  }
  expect(await page.evaluate(() => localStorage.getItem('birthday-bistro-cooking-v2'))).toBeNull();
});

test('the right-pane demo stays on chapter one and drops its layout when switching chapters', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop preview shell only.');
  await page.goto(demo + '&preview=phone');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(frame.locator('body')).toHaveClass(/touch-controls-demo/);
  await expect(page.locator('.preview-title')).toHaveText('第 1 关 · 手机操作 Demo');
  await expect(page.locator('#preview-open')).toHaveAttribute('href', /touch-demo=1/);
  await frame.getByRole('button', { name: '关卡调试', exact: true }).click();
  await frame.locator('[name="debug-chapter"]').selectOption('1');
  await frame.getByRole('button', { name: '进入调试' }).click();
  await expect(frame.locator('#kitchen-host')).toHaveAttribute('data-theme', '1');
  await expect(frame.locator('body')).not.toHaveClass(/touch-controls-demo/);
  await expect(page.locator('.preview-title')).toHaveText('手机横屏预览');
  await expect(page.locator('#preview-open')).not.toHaveAttribute('href', /touch-demo=/);
});
