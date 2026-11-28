import { test, expect } from './fixtures.js';

test('birthday transformation stays inside short landscape screens at peak bounce', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.height > 600, 'Short landscape layout only.');
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0, 1, 2, 3, 4, 5], finished: false, flowerRoom: { phase: 'done', flower: 'blue' } })));
  await page.goto('/');
  const character = page.locator('.birthday-transformation');
  await character.locator('.chef-after').evaluate(img => img.decode());
  await character.evaluate(async el => {
    el.scrollIntoView({ block: 'center', behavior: 'instant' });
    el.dataset.phase = 'transforming';
    await new Promise(resolve => requestAnimationFrame(resolve));
    for (const animation of el.getAnimations({ subtree: true })) {
      animation.pause(); animation.currentTime = 1404;
    }
  });
  const box = await character.locator('.chef-after').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(testInfo.project.use.viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(testInfo.project.use.viewport.height);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-birthday-bounce-viewport.png` });
});

test('chef sprites have transparent backgrounds, full color and animated gameplay rendering', async ({ page }) => {
  await page.goto('/?debug=1&chapter=1');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(async () => {
    const { CHEF_SPRITES, drawChef } = await import('/src/art.js');
    const sprites = [];
    for (const src of Object.values(CHEF_SPRITES)) {
      const image = new Image(); image.src = src; await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const c = canvas.getContext('2d'); c.drawImage(image, 0, 0);
      const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
      let visible = 0; let colored = 0; let blue = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 200) continue;
        visible++;
        if (pixels[i] > 80 || pixels[i + 1] > 80 || pixels[i + 2] > 80) colored++;
        if (pixels[i + 2] > pixels[i] * 1.4 && pixels[i + 2] > 100) blue++;
      }
      sprites.push({ cornerAlpha: pixels[3], visible, colored, blue });
    }
    const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 200;
    const c = canvas.getContext('2d');
    drawChef(c, 100, 100, '#ff0000', 0);
    // The renderer lazily creates its image on the first frame.
    await new Promise(resolve => requestAnimationFrame(resolve));
    c.clearRect(0, 0, 200, 200); drawChef(c, 100, 100, '#ff0000', 0);
    const still = canvas.toDataURL();
    const pixels = c.getImageData(0, 0, 200, 200).data;
    let blue = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] > 200 && pixels[i + 2] > pixels[i] * 1.4 && pixels[i + 2] > 100) blue++;
    }
    c.clearRect(0, 0, 200, 200); drawChef(c, 100, 100, '#ff0000', 2);
    return { sprites, blue, moving: still !== canvas.toDataURL() };
  });
  for (const sprite of result.sprites) {
    expect(sprite.cornerAlpha).toBe(0);
    expect(sprite.visible).toBeGreaterThan(50000);
    expect(sprite.colored / sprite.visible).toBeGreaterThan(.5);
    expect(sprite.blue).toBeGreaterThan(500);
  }
  expect(result.blue).toBeGreaterThan(20);
  expect(result.moving).toBeTruthy();
});

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
