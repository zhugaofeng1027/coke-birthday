import { test, expect } from '@playwright/test';
import { DISHES, INGREDIENTS } from '../../src/cooking.js';
import { THEMES } from '../../src/themes.js';

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
  }
}
const approaches = {
  'stock-0': [137, 267], 'stock-1': [312, 267], 'stock-2': [487, 267], 'stock-3': [662, 267],
  board: [325, 503], pot: [505, 503], oven: [660, 399], plates: [184, 399],
  plating: [335, 572], serve: [585, 572], trash: [173, 620],
  puzzle: [750, 540], lamp: [184, 535],
  'slot-0': [520, 585], 'slot-1': [585, 585], 'slot-2': [650, 585],
  'spice-anise': [505, 585], 'spice-cinnamon': [560, 585], 'spice-bay': [615, 585], 'spice-chili': [670, 585],
};
async function go(page, station) {
  const p = await position(page);
  if (p.y < 470) {
    const exit = p.x > 600 ? 641 : 199;
    if (p.x >= 230 && p.x <= 600) { await walk(page, p.x, 279); await walk(page, exit, 279); }
    else await walk(page, exit, p.y);
    await walk(page, exit, 520);
  }
  const chapter = Number(await page.locator('#kitchen-host').getAttribute('data-theme'));
  const [x, y] = station === 'serve' && [1, 2, 3].includes(chapter) ? [190, 530] : approaches[station];
  const q = await position(page);
  await walk(page, q.x, 520);
  if (station.startsWith('stock')) {
    await walk(page, 199, 520); await walk(page, 199, 267); await walk(page, x, y);
  } else { await walk(page, x, 520); await walk(page, x, y); }
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-nearest', station);
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
async function prepPlate(page) {
  await use(page, 'plates');
  await expect(page.locator('#hands-name')).toHaveText('空餐盘');
  await use(page, 'plating');
  await expect(page.locator('#hands-name')).toHaveText('两手空空');
}

async function puzzle(page, chapter) {
  await use(page, 'puzzle');
  await expect(page.locator('.kitchen-puzzle-modal')).toBeVisible();
  const theme = THEMES[chapter];
  if (theme.answer) {
    for (const id of theme.answer) await page.locator(`[name="choice"][value="${id}"]`).check();
  } else if (theme.order) {
    if (chapter === 1) await page.locator('[name="shape"][value="triangle"]').check();
    for (const [i, id] of theme.order.entries()) await page.locator(`[name="slot-${i}"]`).selectOption(id);
  }
  await page.locator('#kitchen-puzzle-form button[type="submit"]').click();
  await expect(page.locator('.kitchen-puzzle-modal')).toBeHidden();
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
}

for (const { chapter, debug } of [...DISHES.map((_, chapter) => ({ chapter, debug: false })), { chapter: 4, debug: true }]) {
  const dish = DISHES[chapter];
  test(`${debug ? 'debug out-of-order gift: ' : ''}cook, solve and deliver kitchen ${chapter + 1}: ${THEMES[chapter].name}`, async ({ page }, testInfo) => {
    test.skip(debug && testInfo.project.name !== 'desktop', 'Debug gift progression runs once on desktop.');
    test.skip(![0, 3, 4].includes(chapter) && !['desktop', 'mobile'].includes(testInfo.project.name), 'All six workflows run on desktop and phone; shared meal slots and steam also run at every size.');
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
      expect(blocked.y).toBeGreaterThanOrEqual(470);
      expect(blocked.y).toBeLessThan(before.y - 10);
    }
    if (chapter === 0) {
      await use(page, 'puzzle');
      await expect(page.locator('.kitchen-puzzle-modal')).toHaveCount(0);
      await expect(page.locator('#kitchen-feedback')).toContainText('红红的心');
    }
    if ([1, 2, 3].includes(chapter)) {
      await use(page, 'puzzle');
      await expect(page.locator('.kitchen-puzzle-modal')).toHaveCount(0);
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
      if (chapter === 1 && part.id === 'rice') {
        await use(page, 'puzzle');
        await expect(page.locator('#hands-name')).toHaveText('圆形饭团');
        await page.locator('[data-action="kitchen-interact"]').click();
        await expect(page.locator('#hands-name')).toHaveText('三角饭团');
      }
      if (chapter === 4 && i === 0) {
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'false');
        await use(page, 'puzzle');
        await expect(page.locator('.kitchen-puzzle-modal')).toHaveCount(0);
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-steam-ready', 'true', { timeout: 5000 });
        await expect(page.locator('#kitchen-feedback')).toContainText('热茶留在灯旁');
        await page.screenshot({ path: `test-results/${testInfo.project.name}-tea-window.png`, fullPage: true });
        await use(page, 'serve');
        await expect(page.locator('#hands-name')).toHaveText('煮好的食用薄荷');
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-flowers-served', 'false');
        await use(page, 'lamp');
        await expect(page.locator('#kitchen-host')).toHaveAttribute('data-lamp-served', 'true');
        await expect(page.locator('.riddle-letter')).toHaveCount(0);
        continue;
      }
      await use(page, [1, 3].includes(chapter) ? `slot-${chapter === 3 ? 2 - i : i}` : 'plating');
    }
    if (chapter === 3) {
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'false');
      await use(page, 'plating'); await use(page, 'serve');
      await expect(page.locator('.riddle-letter')).toHaveCount(0);
      await use(page, 'plating');
      await use(page, 'slot-2');
      await expect(page.locator('#hands-name')).toHaveText('煮好的番茄');
      await use(page, 'slot-0');
      await expect(page.locator('#hands-name')).toHaveText('切好的蘑菇');
      await use(page, 'slot-2');
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
    }
    if ([1, 3].includes(chapter)) await page.screenshot({ path: `test-results/${testInfo.project.name}-meal-tray-${chapter + 1}.png`, fullPage: true });
    await use(page, 'plating');
    if (chapter === 0) {
      await expect(page.locator('#kitchen-host')).toHaveAttribute('data-puzzle-solved', 'true');
      await page.screenshot({ path: `test-results/${testInfo.project.name}-heart-toast.png`, fullPage: true });
    }
    if ([1, 2, 3].includes(chapter)) await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-ready.png`, fullPage: true });
    await use(page, 'serve');
    await expect(page.locator('.riddle-letter')).toHaveCount(chapter === 5 ? 0 : 1);
    if (chapter === 5) {
      await expect(page.locator('#hands-name')).toContainText('餐盘');
      await puzzle(page, chapter);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-ready.png`, fullPage: true });
      await use(page, 'serve');
    }
    await expect(page.locator('.riddle-letter')).toBeVisible();
    if (chapter === 3) await expect(page.locator('.delivered-photo')).toBeVisible();
    await page.locator('#guess').fill('猜错也可以收到心意');
    await page.locator('[data-action="reveal"]').click();
    await expect(page.locator('.gift-modal h2')).toHaveText(['果汁软糖', 'Chiikawa 挂件', '卤货零食大礼盒', '拍立得相纸', '香薰', '古驰香水礼盒'][chapter]);
    await page.locator('[data-action="next"]').click();
    if (debug) {
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('birthday-bistro-cooking-v2')))).toEqual({ completed: [0], finished: false });
      await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'debug');
    }
    if (chapter === 5) await expect(page.locator('.ending-scene')).toBeVisible();
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
      await expect(page.locator('.kitchen-puzzle-modal')).toHaveCount(0);
      await expect(page.locator('#kitchen-feedback')).toHaveText(THEMES[chapter].clue);
      await page.screenshot({ path: `test-results/${testInfo.project.name}-theme-${chapter + 1}-clue.png`, fullPage: true, animations: 'disabled' });
      continue;
    }
    await expect(page.locator('.kitchen-puzzle-modal h2')).toHaveText(THEMES[chapter].title);
    await expect(page.locator('.puzzle-clue')).toBeVisible();
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
      hands: rect('.hands-status'), recipe: rect('.mobile-recipe'),
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
  expect(boxes.stick.right).toBeLessThanOrEqual(boxes.kitchen.x);
  expect(boxes.buttons.x).toBeGreaterThanOrEqual(boxes.kitchen.right - 1);
  expect(boxes.hands.bottom).toBeLessThan(boxes.buttons.y);
  await expect(page.locator('#kitchen')).toHaveAttribute('height', '600');
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
  await expect(canvas).toHaveAttribute('height', '600');
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

test('completed-save ending, gift album and progress reset still work', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({ completed: [0, 1, 2, 3, 4, 5], finished: false })));
  await page.goto('/'); await expect(page.locator('.ending-scene')).toBeVisible();
  await page.locator('[data-action="wish"]').click();
  await expect(page.locator('.ending-scene h2')).toHaveText('新的一岁，继续一起胡闹吧。');
  await page.locator('[data-action="album"]').click();
  await expect(page.locator('.album-item:not(.locked)')).toHaveCount(6);
  await page.locator('[data-action="close"]').click(); await page.locator('[data-action="settings"]').click();
  await page.locator('[data-action="confirm-reset"]').click(); await page.locator('[data-action="reset"]').click();
  await expect(page.locator('.scene-heading h2')).toHaveText('双果酱烤吐司');
  await expect(page.locator('.menu-bottom p')).toContainText('0 / 6');
});
