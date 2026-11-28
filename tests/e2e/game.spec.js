import { test, expect } from './fixtures.js';
import { createKitchen, DISHES, INGREDIENTS, LANDSCAPE_WORLD, orderRecipe, stationsFor } from '../../src/cooking.js';
import { THEMES } from '../../src/themes.js';
import { kitchenRoute } from './navigation.js';

async function ready(page) {
  await page.goto('/');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
}
async function position(page) {
  return page.locator('#kitchen-host').evaluate(el => ({ x: Number(el.dataset.playerX), y: Number(el.dataset.playerY) }));
}
async function walk(page, x, y) {
  for (const [axis, target] of [['x', x], ['y', y]]) {
    const current = (await position(page))[axis];
    if (Math.abs(target - current) <= 3) continue;
    const positive = target > current;
    const key = axis === 'x' ? positive ? 'ArrowRight' : 'ArrowLeft' : positive ? 'ArrowDown' : 'ArrowUp';
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => {
        const p = (await position(page))[axis];
        return positive ? p >= target - 2 : p <= target + 2;
      }, { intervals: [20, 30, 30], timeout: 7000, message: `walk ${axis} to ${target}` }).toBeTruthy();
    } finally { await page.keyboard.up(key); }
    await page.waitForTimeout(120);
    for (let attempt = 0; attempt < 6; attempt++) {
      const delta = target - (await position(page))[axis];
      if (Math.abs(delta) <= 3) break;
      const correction = axis === 'x' ? delta > 0 ? 'ArrowRight' : 'ArrowLeft' : delta > 0 ? 'ArrowDown' : 'ArrowUp';
      await page.keyboard.press(correction, { delay: Math.max(16, Math.min(45, Math.abs(delta) / 235 * 1000)) });
      await page.waitForTimeout(40);
    }
  }
}
async function go(page, station) {
  const p = await position(page);
  const host = page.locator('#kitchen-host');
  const chapter = Number(await host.getAttribute('data-theme'));
  for (const point of kitchenRoute(chapter, p, station, await host.getAttribute('data-layout'))) await walk(page, point.x, point.y);
  await expect(host).toHaveAttribute('data-nearest', station);
}
async function use(page, station) { await go(page, station); await page.locator('[data-action="kitchen-interact"]').click(); }
async function chop(page) {
  await use(page, 'board');
  await expect(page.locator('[data-action="kitchen-chop"]')).toBeEnabled();
  if (test.info().project.name === 'desktop') {
    await page.keyboard.down('Space'); await page.waitForTimeout(2600); await page.keyboard.up('Space');
  } else {
    const button = page.locator('[data-action="kitchen-chop"]');
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 }] });
    await page.waitForTimeout(2600);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-board-state', 'cut');
  await page.locator('[data-action="kitchen-interact"]').click();
}
async function prepPlate(page, station = 'plating') {
  await use(page, 'plates');
  await expect(page.locator('#hands-name')).toHaveText('空餐盘');
  await use(page, station);
  await expect(page.locator('#hands-name')).toHaveText('两手空空');
}

async function puzzle(page, chapter, order = THEMES[chapter].order) {
  await use(page, 'puzzle');
  await expect(page.locator('.kitchen-puzzle-modal')).toBeVisible();
  const theme = THEMES[chapter];
  if (theme.answer) {
    for (const id of theme.answer) await page.locator(`[name="choice"][value="${id}"]`).check();
  } else if (theme.order) {
    const main = page.locator('[name="slot-1"]');
    await expect(main.locator('option[value="beef"]')).toHaveText('牛肉');
    await expect(main.locator('option[value="mushroom"]')).toHaveText('蘑菇');
    for (const [i, id] of order.entries()) await page.locator(`[name="slot-${i}"]`).selectOption(id);
    await main.selectOption(order[1] === 'beef' ? 'mushroom' : 'beef');
    await page.locator('#kitchen-puzzle-form button[type="submit"]').click();
    await expect(page.locator('.puzzle-result')).toContainText('和线索还差一点');
    await main.selectOption(order[1]);
  }
  await page.locator('#kitchen-puzzle-form button[type="submit"]').click();
  await expect(page.locator('.kitchen-puzzle-modal')).toBeHidden();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
}

async function repeatOrder(page, chapter) {
  const dish = DISHES[chapter];
  const recipe = orderRecipe(chapter, { variant: 1 });
  await prepPlate(page, 'plating-2');
  for (const part of recipe.parts) {
    if (part.id === 'jam') {
      for (const id of ['strawberry', 'grape']) {
        await use(page, `stock-${dish.stock.indexOf(id)}`); await chop(page); await use(page, 'pot-2');
      }
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-pot-2-state', 'ready', { timeout: 12000 });
      await page.locator('[data-action="kitchen-interact"]').click();
    } else {
      await use(page, `stock-${dish.stock.indexOf(part.id)}`);
      if (INGREDIENTS[part.id].cut) await chop(page);
      if (part.method !== 'fresh') {
        const appliance = chapter === 2 && part.method === 'pot' ? 'pot' : `${part.method}-2`;
        await use(page, appliance);
        await expect(page.locator('#kitchen-host')).toHaveAttribute(`data-${appliance}-state`, 'ready', { timeout: 12000 });
        await page.locator('[data-action="kitchen-interact"]').click();
      }
    }
    if (chapter === 4 && part.id === 'mint') { await use(page, 'lamp'); continue; }
    await use(page, 'plating-2');
  }
  await use(page, 'plating-2');
  if (chapter === 1) {
    await use(page, 'puzzle');
    for (const step of ['lid', 'band', 'seal']) await page.locator(`[data-packing-piece="${step}"]`).click();
    await page.locator('[data-action="bento-take"]').click();
  }
  if (chapter === 5) await puzzle(page, chapter, recipe.parts.map(part => part.id));
  await use(page, 'serve');
  if (chapter === 3) {
    await page.getByRole('button', { name: '居中取景', exact: true }).click();
    await page.getByRole('slider', { name: '焦点', exact: true }).fill('55');
    await page.getByRole('button', { name: '拍照', exact: true }).click();
    await expect(page.locator('[data-action="memory-keep"]')).toBeEnabled();
    await page.locator('[data-action="memory-keep"]').click();
  }
}

async function expectRewardFits(page, selector, action) {
  const dimensions = await page.locator(selector).evaluate((el, actionSelector) => {
    const rect = node => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    };
    return { width: innerWidth, height: innerHeight, scrollTop: el.scrollTop,
      boxes: [el, el.querySelector('h2'), el.querySelector('.modal-close'), el.querySelector(actionSelector)].map(rect) };
  }, action);
  expect(dimensions.scrollTop).toBe(0);
  for (const rect of dimensions.boxes) {
    expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.right).toBeLessThanOrEqual(dimensions.width + 1);
    expect(rect.bottom).toBeLessThanOrEqual(dimensions.height + 1);
  }
}

test('bento polish plays through from the chopping board to a scored delivery', async ({ page }, testInfo) => {
  test.skip(!['mobile', 'compact-phone'].includes(testInfo.project.name), 'Runs at standard and compact phone sizes.');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.bentoFrequencies = [];
    const create = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (frequency, start) => {
        window.bentoFrequencies.push(frequency);
        return set(frequency, start);
      };
      return oscillator;
    };
  });
  await page.goto('/?debug=1&chapter=2&layout=landscape&kitchen-polish=after');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-board-state', 'raw');
  await expect(host).toHaveAttribute('data-oven-state', 'ready');
  await expect(host).toHaveAttribute('data-nearest', 'board');
  await expect(page.locator('[data-action="kitchen-chop"]')).toBeEnabled();
  const scene = page.locator('#kitchen');
  await expect.poll(() => scene.evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, 1, 1).data[3])).toBe(255);
  await page.screenshot({ path: testInfo.outputPath('bento-kitchen.png') });
  await page.locator('[data-action="music"]').click();
  await chop(page);
  await expect(page.locator('#hands-name')).toContainText('西兰花');
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(186))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(620))).toBe(true);
  await use(page, 'plating');
  await expect(page.locator('#hands-name')).toHaveText('两手空空');
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(340))).toBe(true);
  await go(page, 'oven');
  const kitchen = { ...createKitchen(1), layout: 'landscape' };
  const ovenStation = stationsFor(kitchen).find(station => station.id === 'oven');
  const oven = async () => scene.evaluate((canvas, { station, world }) => {
    const x = (canvas.width - world.width) / 2 + station.x;
    const y = (canvas.height - world.height) / 2 + station.y;
    return [...canvas.getContext('2d').getImageData(x, y, station.w, station.h).data];
  }, { station: ovenStation, world: LANDSCAPE_WORLD });
  await page.locator('[data-action="kitchen-interact"]').click();
  await expect(page.locator('#hands-name')).toContainText('鸡肉');
  await expect(host).toHaveAttribute('data-oven-state', 'empty');
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(268))).toBe(true);
  const swinging = await oven();
  await page.waitForTimeout(570);
  expect(await oven()).not.toEqual(swinging);
  await use(page, 'plating');
  await page.locator('[data-action="kitchen-interact"]').click();
  await expect(page.locator('#hands-name')).toContainText('餐盘');
  await use(page, 'puzzle');

  const modal = page.locator('.bento-packing-modal');
  const canvas = modal.locator('canvas#bento-packing');
  const lid = await modal.locator('[data-packing-piece="lid"]').evaluate(button => {
    const table = document.querySelector('#bento-packing');
    const initial = table.toDataURL();
    button.click();
    const arriving = table.toDataURL();
    return { initial, arriving };
  });
  expect(lid.arriving).not.toBe(lid.initial);
  await expect(modal).toHaveAttribute('data-step', '1');
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(220))).toBe(true);
  await expect.poll(() => canvas.evaluate((el, arriving) => el.toDataURL() !== arriving, lid.arriving)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('bento-packing.png') });
  await modal.locator('[data-packing-piece="band"]').click();
  await modal.locator('[data-packing-piece="seal"]').click();
  await modal.locator('[data-action="bento-take"]').click();
  await expect(modal).toHaveCount(0);
  await use(page, 'serve');
  await expect(host).toHaveAttribute('data-deliveries', '1');
  await expect(page.locator('#shift-score')).toHaveText('100 / 200');
  await expect.poll(() => page.evaluate(() => window.bentoFrequencies.includes(1180))).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('birthday-bistro-cooking-v2'))).toBeNull();
  expect(errors).toEqual([]);
});

for (const { chapter, debug, reducedMotion } of [...DISHES.map((_, chapter) => ({ chapter, debug: false })), { chapter: 4, debug: true }, { chapter: 5, reducedMotion: true }]) {
  const dish = DISHES[chapter];
  test(`${reducedMotion ? 'reduced motion: ' : debug ? 'debug out-of-order gift: ' : ''}cook, solve and deliver kitchen ${chapter + 1}: ${THEMES[chapter].name}`, async ({ page }, testInfo) => {
    test.setTimeout(300000);
    test.skip(reducedMotion && testInfo.project.name !== 'desktop', 'Reduced motion completion runs once on desktop.');
    if (reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
    test.skip(debug && testInfo.project.name !== 'desktop', 'Debug gift progression runs once on desktop.');
    test.skip(![0, 1, 3, 4].includes(chapter) && !['desktop', 'mobile'].includes(testInfo.project.name), 'All six workflows run on desktop and phone; packing, photos and steam also run at every size.');
    // Exercise the full cooking and reward workflows independently of automation speed.
    // The challenge and score-effect suites exercise actual ticket expiry separately.
    await page.route('**/src/cooking.js*', async route => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'orderLifetime: [110, 130, 150, 130, 110, 130][chapter]', 'orderLifetime: seconds',
      );
      await route.fulfill({ response, body });
    });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    if (chapter) await page.addInitScript(count => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: Array.from({ length: count }, (_, i) => i), finished: false })), debug ? 1 : chapter);
    await ready(page);
    if (debug) {
      await page.getByRole('button', { name: '关卡调试', exact: true }).click();
      await page.locator('[name="debug-chapter"]').selectOption(String(chapter));
      await page.locator('#debug-form button[type="submit"]').click();
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', String(chapter));
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
    }
    await expect(page.locator('[data-action="serve"]')).toBeHidden();
    if (chapter === 0) {
      await expect(page.locator('[data-action="chapter"][data-index="1"]')).toBeDisabled();
      const before = await position(page);
      await page.keyboard.down('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.up('ArrowUp');
      const blocked = await position(page);
      expect(blocked.y).toBeGreaterThanOrEqual(testInfo.project.name === 'desktop' ? 470 : 180);
      expect(blocked.y).toBeLessThan(before.y - 10);
    }
    if (chapter === 0) {
      await use(page, 'puzzle');
      await expect(page.locator('.kitchen-clue-modal')).toBeVisible();
      await expect(page.locator('#kitchen-feedback')).toContainText('红红的心');
      await page.getByRole('button', { name: '继续料理', exact: true }).click();
    }
    if ([1, 2, 3].includes(chapter)) {
      await use(page, 'puzzle');
      await expect(page.locator('.kitchen-clue-modal')).toBeVisible();
      await page.getByRole('button', { name: '继续料理', exact: true }).click();
    }
    if (chapter === 2) {
      for (const id of ['anise', 'cinnamon', 'chili']) { await use(page, `spice-${id}`); await use(page, 'puzzle'); }
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'false');
      await use(page, 'puzzle');
      await expect(page.locator('#hands-name')).toHaveText('辣椒');
      await use(page, 'spice-chili'); await use(page, 'spice-bay'); await use(page, 'puzzle');
      await use(page, 'puzzle');
      await expect(page.locator('#hands-name')).toHaveText('配好的卤料袋');
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-broth-ready', 'false');
      await page.screenshot({ path: `test-results/${testInfo.project.name}-spice-bag.png`, fullPage: true });
      await use(page, 'pot');
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-broth-ready', 'true');
    }
    await prepPlate(page);
    for (const [i, part] of dish.parts.entries()) {
      if (part.id === 'jam') {
        for (const [index, id] of ['strawberry', 'grape'].entries()) {
          await use(page, `stock-${dish.stock.indexOf(id)}`); await chop(page); await use(page, 'pot');
          await expect(page.locator('#kitchen-host')).toHaveAttribute('data-pot-state', index === 0 ? 'waiting' : 'cooking');
        }
        await page.locator('[data-action="settings"]').click();
        const potProgress = page.locator('[data-appliance="pot"] [role="progressbar"]');
        const paused = await potProgress.getAttribute('aria-valuenow');
        await page.waitForTimeout(450);
        await expect(potProgress).toHaveAttribute('aria-valuenow', paused);
        await page.locator('[data-action="close"]').click();
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-pot-state', 'ready', { timeout: 12000 });
        await page.locator('[data-action="kitchen-interact"]').click();
        await expect(page.locator('#hands-name')).toHaveText('爱心双果酱');
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'false');
        await use(page, 'plating');
        continue;
      }
      await use(page, `stock-${dish.stock.indexOf(part.id)}`);
      await expect(page.locator('#hands-name')).toHaveText(INGREDIENTS[part.id].name);
      if (INGREDIENTS[part.id].cut) await chop(page);
      if (part.method !== 'fresh') {
        await use(page, part.method);
        await expect(page.locator('#kitchen-host')).toHaveAttribute(`data-${part.method}-state`, 'cooking');
        await expect(page.locator('#kitchen-host')).toHaveAttribute(`data-${part.method}-state`, 'ready', { timeout: 12000 });
        await page.locator('[data-action="kitchen-interact"]').click();
      }
      if (chapter === 4 && i === 0) {
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'false');
        await use(page, 'puzzle');
        await expect(page.locator('.kitchen-clue-modal .clue-copy')).toHaveText(THEMES[4].clue);
        await page.getByRole('button', { name: '继续料理', exact: true }).click();
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'true', { timeout: 5000 });
        await expect(page.locator('#kitchen-feedback')).toContainText('热茶留在灯旁');
        await page.getByRole('button', { name: '查看本关线索', exact: true }).click();
        await expect(page.locator('.clue-copy')).toHaveText('热茶留在灯旁，面包放在花下。');
        await page.getByRole('button', { name: '继续料理', exact: true }).click();
        await page.screenshot({ path: `test-results/${testInfo.project.name}-tea-window.png`, fullPage: true });
        await use(page, 'serve');
        await expect(page.locator('#hands-name')).toHaveText('煮好的食用薄荷');
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-flowers-served', 'false');
        await use(page, 'lamp');
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-lamp-served', 'true');
        await expect(page.locator('.riddle-letter')).toHaveCount(0);
        continue;
      }
      await use(page, 'plating');
    }
    await use(page, 'plating');
    if (chapter === 0) {
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
      await page.screenshot({ path: `test-results/${testInfo.project.name}-heart-toast.png`, fullPage: true });
    }
    if ([1, 2, 3].includes(chapter)) await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-ready.png`, fullPage: true });
    if (chapter === 1) {
      await use(page, 'serve');
      await expect(page.locator('.riddle-letter')).toHaveCount(0);
      await expect(page.locator('#hands-name')).toContainText('餐盘');
      await use(page, 'puzzle');
      const packing = page.locator('.bento-packing-modal');
      const box = page.locator('#bento-packing');
      await expect(packing).toHaveAttribute('data-step', '0');
      const packingTime = Number(await page.locator('#kitchen-host').getAttribute('data-time-left'));
      await expect.poll(async () => Number(await page.locator('#kitchen-host').getAttribute('data-time-left'))).toBeLessThan(packingTime);
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-packing-meal', 'true');
      await expect(page.locator('.plated-count')).toHaveText('3 / 3');
      await expect(page.locator('[data-action="bento-take"]')).toBeDisabled();
      await page.getByRole('button', { name: '贴爱心封签', exact: true }).click();
      await expect(packing).toHaveAttribute('data-step', '0');
      await expect(page.locator('.bento-status')).toContainText('前一步');
      const dragPiece = async (id, valid = true) => {
        const piece = await page.locator(`[data-packing-piece="${id}"]`).boundingBox();
        const target = await box.boundingBox();
        const from = { x: piece.x + piece.width / 3, y: piece.y + piece.height / 2 };
        const to = { x: target.x + target.width * (valid ? .5 : .03), y: target.y + target.height * (valid ? .5 : .03) };
        if (testInfo.project.use.hasTouch) {
          const client = await page.context().newCDPSession(page);
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
          await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...to, id: 1 }] });
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await client.detach();
        } else {
          await page.mouse.move(from.x, from.y); await page.mouse.down();
          await page.mouse.move(to.x, to.y, { steps: 5 }); await page.mouse.up();
        }
      };
      await dragPiece('lid', false);
      await expect(packing).toHaveAttribute('data-step', '0');
      await expect(page.locator('.bento-status')).toContainText('放回原处');
      const openBox = await box.evaluate(c => c.toDataURL());
      expect(await box.evaluate(canvas => {
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set();
        for (let i = 0; i < pixels.length; i += 400) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
        return colors.size;
      })).toBeGreaterThan(20);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-bento-open.png`, fullPage: true });
      await dragPiece('lid');
      await expect(packing).toHaveAttribute('data-step', '1');
      expect(await box.evaluate(c => c.toDataURL())).not.toBe(openBox);
      await page.locator('[data-action="close"]').click();
      await use(page, 'puzzle');
      await expect(packing).toHaveAttribute('data-step', '1');
      await expect(page.getByRole('button', { name: '盖上盒盖', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: '套好绑带', exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(packing).toHaveAttribute('data-step', '2');
      const bandedBox = await box.evaluate(c => c.toDataURL());
      await dragPiece('seal');
      await expect(packing).toHaveAttribute('data-step', '3');
      expect(await box.evaluate(c => c.toDataURL())).not.toBe(bandedBox);
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
      await expect(page.locator('.riddle-letter')).toHaveCount(0);
      for (const selector of ['#bento-packing', '.bento-pieces', '.bento-status', '.bento-take']) {
        const rect = await page.locator(selector).boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(testInfo.project.use.viewport.width + 1);
        expect(rect.y + rect.height).toBeLessThanOrEqual(testInfo.project.use.viewport.height + 1);
      }
      const rect = await box.boundingBox();
      expect(rect.width / rect.height).toBeCloseTo(1.5, 1);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-bento-sealed.png`, fullPage: true });
      await page.locator('[data-action="close"]').click();
      await use(page, 'puzzle');
      await expect(packing).toHaveAttribute('data-step', '3');
      await page.locator('[data-action="bento-take"]').click();
      await expect(packing).toBeHidden();
      await expect(page.locator('#hands-name')).toHaveText('封好的爱心便当');
    }
    await use(page, 'serve');
    if (chapter === 3) {
      await expect(page.locator('.memory-camera-modal')).toBeVisible();
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-photo-meal', 'true');
      await expect(page.locator('.riddle-letter')).toHaveCount(0);
      await page.getByRole('button', { name: '拍照', exact: true }).click();
      await expect(page.locator('.memory-print.developing')).toBeVisible();
      await expect(page.locator('[data-action="memory-keep"]')).toBeDisabled();
      await expect(page.locator('.memory-print-status')).toContainText('没拍全');
      await page.locator('[data-action="close"]').click();
      await use(page, 'serve');
      await expect(page.locator('.memory-print-modal')).toBeVisible();
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-photo-shots', '1');
      await expect(page.locator('.memory-print-status')).toContainText('没拍全');
      await page.locator('[data-action="memory-retake"]').click();
      await page.locator('[data-action="close"]').click();
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-photo-meal', 'true');
      await use(page, 'serve');
      await expect(page.locator('.memory-camera-modal')).toBeVisible();
      await page.getByRole('button', { name: '向左取景', exact: true }).click();
      await page.getByRole('button', { name: '向下取景', exact: true }).click();
      await expect(page.locator('.memory-camera-modal')).toHaveAttribute('data-ready', 'false');
      await page.getByRole('button', { name: '居中取景', exact: true }).click();
      const focus = page.getByRole('slider', { name: '焦点', exact: true });
      await focus.focus(); await focus.press('Home');
      for (let step = 0; step < 55; step++) await focus.press('ArrowRight');
      await expect(page.locator('.memory-camera-modal')).toHaveAttribute('data-ready', 'true');
      const camera = page.locator('#memory-camera');
      const cameraBox = await camera.boundingBox();
      expect(cameraBox.width / cameraBox.height).toBeCloseTo(1.5, 1);
      const originalFrame = await camera.evaluate(canvas => canvas.toDataURL());
      const from = { x: cameraBox.x + cameraBox.width / 2, y: cameraBox.y + cameraBox.height / 2 };
      const to = { x: from.x + cameraBox.width * .2, y: from.y };
      if (testInfo.project.use.hasTouch) {
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...from, id: 1 }] });
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...to, id: 1 }] });
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await client.detach();
      } else {
        await page.mouse.move(from.x, from.y); await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 4 }); await page.mouse.up();
      }
      await expect(page.locator('.memory-camera-modal')).toHaveAttribute('data-ready', 'false');
      expect(await camera.evaluate(canvas => canvas.toDataURL())).not.toBe(originalFrame);
      await page.getByRole('button', { name: '居中取景', exact: true }).click();
      await expect(page.locator('.memory-camera-modal')).toHaveAttribute('data-ready', 'true');
      expect(await camera.evaluate(canvas => {
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const colors = new Set();
        for (let i = 0; i < pixels.length; i += 400) colors.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`);
        return colors.size;
      })).toBeGreaterThan(20);
      for (const selector of ['.memory-viewfinder', '.memory-camera-tools', '.memory-shutter', '#memory-focus']) {
        const rect = await page.locator(selector).boundingBox();
        expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(testInfo.project.use.viewport.width + 1);
        expect(rect.y + rect.height).toBeLessThanOrEqual(testInfo.project.use.viewport.height + 1);
      }
      await page.screenshot({ path: `test-results/${testInfo.project.name}-memory-camera.png`, fullPage: true });
      await page.getByRole('button', { name: '拍照', exact: true }).click();
      await expect(page.locator('[data-action="memory-keep"]')).toBeEnabled();
      const capturedImage = await page.locator('.memory-print img').getAttribute('src');
      expect(capturedImage).toMatch(/^data:image\/png/);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-memory-print.png`, fullPage: true });
      await page.locator('[data-action="memory-keep"]').click();
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'false');
    }
    await expect(page.locator('.riddle-letter')).toHaveCount(0);
    if (chapter === 5) {
      await expect(page.locator('#hands-name')).toContainText('餐盘');
      await puzzle(page, chapter);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-ready.png`, fullPage: true });
      await use(page, 'serve');
    }
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-score', '100');
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-deliveries', '1');
    await expect.poll(async () => Number(await page.locator('#kitchen-host').getAttribute('data-order-count')), { timeout: 60000 }).toBeGreaterThan(0);
    await expect(page.locator('.order-sequence').first()).toHaveText('订单 02');
    await expect(page.locator('[data-action="serve"]')).toBeHidden();
    await expect(page.locator('.riddle-letter')).toHaveCount(0);
    if (chapter === 2) await expect(page.locator('#kitchen-host')).toHaveAttribute('data-broth-ready', 'true');
    if (chapter === 4) await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'true');
    await repeatOrder(page, chapter);
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-score', '200');
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-deliveries', '2');
    await expect(page.locator('.riddle-letter')).toBeVisible();
    if (chapter === 3) await expect(page.locator('.delivered-photo')).toBeVisible();
    await expectRewardFits(page, '.letter-modal', '[data-action="reveal"]');
    await expect(page.locator('#guess')).not.toBeFocused();
    if (chapter === 0) {
      await page.screenshot({ path: `test-results/${testInfo.project.name}-letter-landscape.png`, animations: 'disabled' });
      if (testInfo.project.name === 'mobile') {
        for (const width of [740, 568, 844]) {
          await page.setViewportSize({ width, height: width === 844 ? 390 : 320 });
          await expectRewardFits(page, '.letter-modal', '[data-action="reveal"]');
          await page.screenshot({ path: `test-results/letter-${width}.png`, animations: 'disabled' });
        }
      }
      await page.locator('.riddle-letter').evaluate(el => { el.textContent = '生日快乐，这是一封很长很长的便笺。'.repeat(180); });
      await expectRewardFits(page, '.letter-modal', '[data-action="reveal"]');
      expect(await page.locator('.letter-modal .reward-scroll').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    }
    await page.locator('#guess').fill('猜错也可以收到心意');
    await page.locator('[data-action="reveal"]').click();
    await expect(page.locator('.gift-modal h2')).toHaveText(['果汁软糖', 'Chiikawa 挂件', '卤货零食大礼盒', '拍立得相纸', '香薰', '古驰香水礼盒'][chapter]);
    await expectRewardFits(page, '.gift-modal', '[data-action="next"]');
    await expect(page.locator('.gift-modal').getByRole('button', { name: '重玩本关' })).toBeInViewport({ ratio: 1 });
    if (chapter === 0) await page.screenshot({ path: `test-results/${testInfo.project.name}-gift-landscape.png`, animations: 'disabled' });
    await page.locator('[data-action="next"]').click();
    if (debug) {
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('birthday-bistro-cooking-v2')))).toEqual({ completed: [0], finished: false });
      await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'debug');
    }
    if (chapter === 5) {
      await expect(page.getByRole('heading', { name: '打烊啦' })).toBeVisible();
      for (const action of ['enter', 'open', 'place']) await page.locator(`[data-action="flower-${action}"]`).click();
      await page.getByRole('button', { name: '雾蓝花枝' }).click();
      await page.locator('[data-action="flower-light"]').click();
      await expect(page.getByRole('heading', { name: 'DIMOO 手办 + 永生花' })).toBeVisible();
      await page.locator('[data-action="flower-finish"]').click();
      await expect(page.locator('.ending-scene')).toBeVisible();
      const transformation = page.locator('.birthday-transformation');
      if (reducedMotion) await expect(transformation).toHaveAttribute('data-phase', 'complete');
      else {
        await expect(page.locator('.ending-invitation')).toHaveText('主厨大人，今天辛苦啦。接下来，请换你当今天的主角。');
        await expect(transformation).toHaveAttribute('data-phase', 'inviting');
        await expect(transformation).toHaveAttribute('data-phase', 'transforming');
      }
      const characterBox = await transformation.boundingBox();
      expect(characterBox.y).toBeGreaterThanOrEqual(0);
      expect(characterBox.y + characterBox.height).toBeLessThanOrEqual(testInfo.project.use.viewport.height);
      if (!reducedMotion) {
        await expect(transformation).toHaveAttribute('data-phase', 'transforming');
        await expect(page.locator('[data-action="wish"]')).toBeDisabled();
        await page.waitForTimeout(1400);
        await page.screenshot({ path: `test-results/${testInfo.project.name}-birthday-transform.png`, fullPage: true });
      }
      await expect(transformation).toHaveAttribute('data-phase', 'complete');
      await expect(transformation).toHaveAccessibleName('戴生日帽的主厨');
      await expect(page.locator('.chef-after')).toHaveCSS('opacity', '1');
      await page.screenshot({ path: `test-results/${testInfo.project.name}-birthday-complete.png`, fullPage: true });
      await page.locator('[data-action="wish"]').click();
      await expect(transformation).toHaveAttribute('data-phase', 'complete');
      await expect(page.locator('.chef-after')).toHaveCSS('opacity', '1');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('birthday-bistro-cooking-v2')).finished)).toBe(true);
    }
    else {
      await expect(page.locator('.scene-heading h2')).toHaveText(DISHES[chapter + 1].name);
    }
    expect(errors).toEqual([]);
  });
}

test('six kitchens render distinct scenes and readable clues at every viewport', async ({ page }, testInfo) => {
  const floorColors = new Set();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await ready(page);
  for (let chapter = 0; chapter < 6; chapter++) {
    await page.evaluate(count => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: Array.from({ length: count }, (_, i) => i), finished: false })), chapter);
    await page.reload();
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-theme', String(chapter));
    await page.waitForTimeout(160);
    const painted = await page.locator('#kitchen').evaluate(canvas => {
      const c = canvas.getContext('2d');
      const data = c.getImageData(0, 0, canvas.width, canvas.height).data;
      const colors = new Set();
      for (let i = 0; i < data.length; i += 400) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
      return { colors: colors.size, floor: [...c.getImageData(210, canvas.height - 160, 1, 1).data].join(',') };
    });
    expect(painted.colors).toBeGreaterThan(30);
    floorColors.add(painted.floor);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}.png`, fullPage: true, animations: 'disabled' });
    await use(page, 'puzzle');
    if (chapter !== 5) {
      await expect(page.locator('.kitchen-clue-modal h2')).toHaveText(THEMES[chapter].title);
      await expect(page.locator('.clue-copy')).toHaveText(THEMES[chapter].clue);
      expect(await page.locator('.clue-copy').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(15);
      const modal = await page.locator('.kitchen-clue-modal').boundingBox();
      const button = await page.getByRole('button', { name: '继续料理', exact: true }).boundingBox();
      expect(button.y + button.height).toBeLessThanOrEqual(modal.y + modal.height);
      expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
      await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-clue.png`, fullPage: true, animations: 'disabled' });
      await page.getByRole('button', { name: '继续料理', exact: true }).click();
      continue;
    }
    await expect(page.locator('.kitchen-puzzle-modal h2')).toHaveText(THEMES[chapter].title);
    await expect(page.locator('.puzzle-clue')).toBeVisible();
    await expect(page.locator('.meal-alternatives img')).toHaveCount(2);
    expect(await page.locator('.modal').evaluate(el => el.scrollWidth <= el.clientWidth)).toBeTruthy();
    if (THEMES[chapter].order) {
      const reference = await page.locator('.meal-reference').boundingBox();
      expect(reference.height).toBeLessThan(150);
    }
    if (testInfo.project.name !== 'desktop') {
      const modal = await page.locator('.modal').boundingBox();
      const submit = await page.locator('#kitchen-puzzle-form button[type="submit"]').boundingBox();
      expect(submit.y + submit.height).toBeLessThanOrEqual(modal.y + modal.height);
    }
    await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-clue.png`, fullPage: true, animations: 'disabled' });
    await page.locator('[data-action="close"]').click();
  }
  expect(floorColors.size).toBe(6);
  expect(errors).toEqual([]);
});

test('clues can be reread remotely without expiring, moving the chef or solving the puzzle', async ({ page }) => {
  await ready(page);
  for (let chapter = 0; chapter < 6; chapter++) {
    await page.goto(`/?debug=1&chapter=${chapter + 1}`);
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
    const before = await position(page);
    const clueButton = page.getByRole('button', { name: '查看本关线索', exact: true });
    await expect(clueButton).toBeInViewport();
    await clueButton.click();
    await expect(page.locator('.clue-copy')).toHaveText(THEMES[chapter].clue);
    if (chapter === 0) await page.waitForTimeout(3500);
    await expect(page.locator('.kitchen-clue-modal')).toBeVisible();
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(200); await page.keyboard.up('ArrowRight');
    expect(await position(page)).toEqual(before);
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'false');
    await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'false');
    await page.getByRole('button', { name: '继续料理', exact: true }).click();
    await clueButton.click();
    await expect(page.locator('.clue-copy')).toHaveText(THEMES[chapter].clue);
    await page.keyboard.press('Escape');
    await expect(page.locator('.kitchen-clue-modal')).toHaveCount(0);
    await expect(clueButton).toBeFocused();
  }
});

test('touch joystick moves and releases, remote stations cannot grant food, and canvas draws', async ({ page }, testInfo) => {
  await ready(page);
  const original = await position(page);
  await page.locator('#kitchen').click({ position: { x: 50, y: 50 } });
  await expect(page.locator('#hands-name')).toHaveText('两手空空');
  await page.locator('.joystick').scrollIntoViewIfNeeded();
  const stick = await page.locator('.joystick').boundingBox();
  const x = stick.x + stick.width * .82; const y = stick.y + stick.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
  await page.waitForTimeout(350);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(120);
  const moved = await position(page);
  expect(moved.x).toBeGreaterThan(original.x + 30);
  await page.waitForTimeout(300);
  expect(Math.abs((await position(page)).x - moved.x)).toBeLessThan(3);
  const pixels = await page.locator('#kitchen').evaluate(c => {
    const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const colors = new Set();
    for (let i = 0; i < data.length; i += 400) colors.add(`${data[i]}-${data[i + 1]}-${data[i + 2]}`);
    return colors.size;
  });
  expect(pixels).toBeGreaterThan(25);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-kitchen-v2.png`, fullPage: true, animations: 'disabled' });
});

test('modal pauses input, notes remain editable, QR works and retry keeps the configuration', async ({ page }) => {
  await ready(page);
  await page.locator('[data-action="settings"]').click();
  const before = await position(page); await page.keyboard.press('ArrowUp');
  await page.locator('[name="recipient"]').fill('小寿星');
  await page.locator('[name="riddle-0"]').fill('一 份 空 格 也 能 写 的 心 意');
  await expect(page.locator('[name="riddle-0"]')).toHaveValue('一 份 空 格 也 能 写 的 心 意');
  expect(await position(page)).toEqual(before);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const { readFile } = await import('node:fs/promises');
  const exported = JSON.parse(await readFile(await (await downloadPromise).path(), 'utf8'));
  expect(exported.recipient).toBe('小寿星');
  await page.getByRole('button', { name: '保存到本机' }).click();
  await expect(page.locator('h1')).toContainText('小寿星');
  await page.locator('[data-action="share"]').click();
  await expect(page.locator('#qr-canvas')).toBeVisible();
  await page.locator('[data-action="close"]').click();
  await page.locator('[data-action="hint"]:visible, [data-action="hint-shortcut"]:visible').click();
  await expect(page.locator('#toast')).toContainText('果园订单');
  await page.locator('[data-action="confirm-retry"]').click();
  await page.locator('[data-action="retry-dish"]').click();
  await expect(page.locator('#hands-name')).toHaveText('两手空空');
  await expect(page.locator('h1')).toContainText('小寿星');
  await page.reload(); await expect(page.locator('h1')).toContainText('小寿星');
});

test('landscape keeps the kitchen and both thumb controls on one screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop', 'Compact play layout is for phones and touch tablets.');
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0, 1, 2, 3, 4], finished: false })));
  await ready(page);
  await expect(page.locator('body')).toHaveClass(/landscape-play/);
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  const boxes = await page.evaluate(() => {
    const rect = selector => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    return {
      kitchen: rect('#kitchen'), stick: rect('.joystick'), buttons: rect('.cooking-buttons'),
      hands: rect('.hands-status'), recipe: rect('.order-strip'),
      feedback: rect('#kitchen-feedback'), header: rect('.site-header'),
      width: innerWidth, height: innerHeight,
      scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
    };
  });
  expect(boxes.scrollWidth).toBeLessThanOrEqual(boxes.width);
  expect(boxes.scrollHeight).toBeLessThanOrEqual(boxes.height);
  for (const name of ['kitchen', 'stick', 'buttons', 'hands', 'recipe', 'feedback', 'header']) {
    expect(boxes[name].x).toBeGreaterThanOrEqual(0);
    expect(boxes[name].y).toBeGreaterThanOrEqual(0);
    expect(boxes[name].right).toBeLessThanOrEqual(boxes.width + 1);
    expect(boxes[name].bottom).toBeLessThanOrEqual(boxes.height + 1);
  }
  expect(boxes.recipe.bottom).toBeLessThan(boxes.stick.y);
  expect(boxes.kitchen.width).toBeGreaterThanOrEqual(boxes.width - 2);
  expect(boxes.stick.x).toBeGreaterThanOrEqual(boxes.kitchen.x);
  expect(boxes.buttons.right).toBeLessThanOrEqual(boxes.kitchen.right + 1);
  expect(boxes.hands.bottom).toBeLessThan(boxes.buttons.y);
  expect(Number(await page.locator('#kitchen').getAttribute('height'))).toBeGreaterThanOrEqual(525);
  await page.locator('[data-action="album-shortcut"]').click();
  await expect(page.locator('.album-modal')).toBeVisible();
  await page.locator('[data-action="close"]').click();
  const fullscreen = page.locator('[data-action="fullscreen"]');
  if (await fullscreen.isVisible()) {
    await fullscreen.click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBeTruthy();
    await expect(fullscreen).toHaveAttribute('aria-label', '退出全屏');
    await fullscreen.click();
    await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBeFalsy();
  }
  await page.screenshot({ path: `test-results/${testInfo.project.name}-landscape.png`, fullPage: true, animations: 'disabled' });
});

test('rotating pauses cooking and movement without losing the dish or modal pause', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Rotation regression runs on the phone.');
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0, 1, 2], finished: false })));
  await ready(page);
  await use(page, 'stock-0'); await chop(page); await use(page, 'pot');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-pot-state', 'cooking');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.rotation-prompt')).toBeVisible();
  const canvas = page.locator('#kitchen');
  const pot = page.locator('[data-appliance="pot"] [role="progressbar"]');
  const paused = await pot.getAttribute('aria-valuenow');
  const before = await position(page);
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
  expect(await position(page)).toEqual(before);
  await expect(pot).toHaveAttribute('aria-valuenow', paused);
  await page.screenshot({ path: 'test-results/mobile-rotate-prompt.png', fullPage: true });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.rotation-prompt')).toBeHidden();
  expect(Number(await canvas.getAttribute('height'))).toBeGreaterThanOrEqual(525);
  expect(await position(page)).toEqual(before);
  await expect.poll(() => pot.getAttribute('aria-valuenow')).not.toBe(paused);
  await page.locator('[data-action="settings"]').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('body')).toHaveClass(/landscape-play/);
  const modalPaused = await pot.getAttribute('aria-valuenow');
  await page.waitForTimeout(400);
  await expect(pot).toHaveAttribute('aria-valuenow', modalPaused);
  await page.locator('[data-action="close"]').click();
  await expect.poll(() => pot.getAttribute('aria-valuenow')).not.toBe(modalPaused);
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-pot-state', 'ready', { timeout: 11000 });
  await page.locator('[data-action="kitchen-interact"]').click();
  await expect(page.locator('#hands-name')).toHaveText('煮好的番茄');
});

test('completed-save ending, gift album and progress reset still work', async ({ page }, testInfo) => {
  const giftPhotos = ['grape-candy', 'plush', 'braised-snacks', 'instant-film', 'diffuser', 'perfume']
    .map(name => new RegExp(`gift-${name}\\.webp$`));
  async function checkGiftPhotos(photos) {
    await expect(photos).toHaveCount(giftPhotos.length);
    for (const [i, photo] of (await photos.all()).entries()) {
      await expect(photo).toHaveAttribute('src', giftPhotos[i]);
      expect(await photo.evaluate(async img => { await img.decode(); return img.naturalWidth; })).toBeGreaterThan(0);
    }
  }
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0, 1, 2, 3, 4, 5], finished: false, flowerRoom: { phase: 'done', flower: 'blue' } })));
  await page.goto('/'); await expect(page.locator('.ending-scene')).toBeVisible();
  await expect(page.locator('.birthday-transformation')).toHaveAttribute('data-phase', 'complete');
  await expect(page.locator('.chef-after')).toHaveCSS('opacity', '1');
  const chef = await page.locator('.birthday-transformation').boundingBox();
  const cake = await page.locator('.cake-scene').boundingBox();
  expect(chef.x + chef.width).toBeLessThanOrEqual(cake.x);
  expect(cake.x + cake.width).toBeLessThanOrEqual(testInfo.project.use.viewport.width);
  await checkGiftPhotos(page.locator('.ending-gifts [data-action="revisit"] .gift-photo'));
  await page.screenshot({ path: `test-results/${testInfo.project.name}-saved-birthday.png`, fullPage: true });
  await page.locator('[data-action="wish"]').click();
  await expect(page.locator('.ending-scene h2')).toHaveText('新的一岁，继续一起胡闹吧。');
  await page.locator('[data-action="album"]').click();
  await expect(page.locator('.album-item:not(.locked)')).toHaveCount(7);
  await checkGiftPhotos(page.locator('.album-item[data-action="revisit"] .gift-photo'));
  await page.locator('[data-action="ending"]').click();
  await expect(page.locator('.birthday-transformation')).toHaveAttribute('data-phase', 'complete');
  await page.locator('[data-action="album"]').click();
  await page.locator('[data-action="close"]').click(); await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="confirm-reset"]').click(); await page.locator('[data-action="reset"]').click();
  await expect(page.locator('.scene-heading h2')).toHaveText('双果酱烤吐司');
  await expect(page.locator('.menu-bottom p')).toContainText('0 / 6');
});
