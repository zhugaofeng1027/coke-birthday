import { test, expect } from './fixtures.js';
import { createKitchen, stationsFor, LANDSCAPE_WORLD } from '../../src/cooking.js';

test('wide kitchens fill the canvas without stretching or hiding stations behind controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Landscape screen coverage.');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (let chapter = 0; chapter < 6; chapter++) {
    await page.goto(`/?debug=1&chapter=${chapter + 1}&layout=landscape`);
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
    await page.waitForTimeout(150);
    const geometry = await page.evaluate(() => {
      const bounds = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      const canvas = document.querySelector('#kitchen');
      const context = canvas.getContext('2d');
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < pixels.length; i += 400) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
      return {
        canvas: bounds('#kitchen'), host: bounds('#kitchen-host'),
        width: canvas.width, height: canvas.height, colors: colors.size,
        controls: ['.joystick', '.cooking-buttons', '.rolling-order', '.hands-status', '#kitchen-feedback'].map(bounds),
      };
    });
    expect(geometry.canvas.width).toBeGreaterThanOrEqual(geometry.host.width - 2);
    expect(geometry.canvas.height).toBeGreaterThanOrEqual(geometry.host.height - 2);
    expect(geometry.canvas.width / geometry.canvas.height).toBeCloseTo(geometry.width / geometry.height, 2);
    expect(geometry.colors).toBeGreaterThan(30);
    const k = createKitchen(chapter);
    k.layout = 'landscape';
    const scale = geometry.canvas.width / geometry.width;
    for (const s of stationsFor(k)) {
      const x = geometry.canvas.x + (s.x + (geometry.width - LANDSCAPE_WORLD.width) / 2) * scale;
      const y = geometry.canvas.y + (s.y + (geometry.height - LANDSCAPE_WORLD.height) / 2) * scale;
      for (const control of geometry.controls) {
        const overlapX = Math.min(x + s.w * scale, control.x + control.width) - Math.max(x, control.x);
        const overlapY = Math.min(y + s.h * scale, control.y + control.height) - Math.max(y, control.y);
        expect(overlapX > 1 && overlapY > 1, `${s.id} hidden behind a control in kitchen ${chapter + 1}`).toBeFalsy();
      }
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-wide-kitchen-${chapter + 1}.png` });
  }
  expect(errors).toEqual([]);
});
