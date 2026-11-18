import { test, expect } from '@playwright/test';

test('greenhouse frames never paint over the wall lettering', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  const lettering = await page.evaluate(async () => {
    const { paintKitchen } = await import('/src/kitchen-art.js');
    const { createKitchen } = await import('/src/cooking.js');
    const render = chapter => {
      const canvas = document.createElement('canvas');
      canvas.width = 840; canvas.height = 720;
      const context = canvas.getContext('2d');
      paintKitchen(context, createKitchen(chapter), 0);
      return context.getImageData(90, 20, 650, 65).data;
    };
    const reference = render(1);
    const greenhouse = render(0);
    const ink = new Set(['123,140,131', '111,129,121', '178,143,124']);
    let glyphPixels = 0; let obscuredPixels = 0;
    for (let i = 0; i < reference.length; i += 4) {
      if (!ink.has(`${reference[i]},${reference[i + 1]},${reference[i + 2]}`)) continue;
      glyphPixels++;
      if ([0, 1, 2].some(offset => reference[i + offset] !== greenhouse[i + offset])) obscuredPixels++;
    }
    return { glyphPixels, obscuredPixels };
  });
  expect(lettering.glyphPixels).toBeGreaterThan(100);
  expect(lettering.obscuredPixels).toBe(0);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-greenhouse-lettering.png`, fullPage: true, animations: 'disabled' });
});
