import { expect, test } from '@playwright/test';

async function tapButton(page, id) {
  await expect.poll(() => page.evaluate(id => __miniTest.app.buttons().some(b => b.id === id), id)).toBe(true);
  const { x, y } = await page.evaluate(id => {
    const b = __miniTest.app.buttons().find(b => b.id === id);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }, id);
  await page.touchscreen.tap(x, y);
}

async function tapStation(page, id) {
  const { x, y } = await page.evaluate(id => {
    const { app, stationsFor } = __miniTest;
    const k = app.state.kitchen.k;
    const station = stationsFor(k).find(s => s.id === id);
    k.player = { ...station.approach };
    const a = app.worldAt({ x: 0, y: 0 });
    const b = app.worldAt({ x: 1, y: 1 });
    return {
      x: (station.x + station.w / 2 - a.x) / (b.x - a.x),
      y: (station.y + station.h / 2 - a.y) / (b.y - a.y),
    };
  }, id);
  await page.touchscreen.tap(x, y);
}

function advance(page, seconds, cut = false) {
  return page.evaluate(({ seconds, cut }) => __miniTest.app.state.kitchen.step(seconds, { x: 0, y: 0, cut }, performance.now()), { seconds, cut });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/?test');
});

test('large touch targets allow a second finger to operate while movement continues', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await tapButton(page, 'start');
  await expect.poll(() => page.evaluate(() => Boolean(__miniTest.app.worldAt({ x: 0, y: 0 })))).toBe(true);
  const { stick, hand, x } = await page.evaluate(() => {
    const { app } = __miniTest;
    const { joystick, use, header, headerRight } = app.layout();
    if (headerRight > app.layout().width - 86 || header < 32 || joystick.r < 45 || use.w < 66) throw new Error('Layout misses control or capsule bounds');
    return {
      x: app.state.kitchen.k.player.x,
      stick: { id: 1, x: joystick.x + joystick.r * .6, y: joystick.y },
      hand: { id: 2, x: use.x + use.w / 2, y: use.y + use.h / 2 },
    };
  });
  const cdp = await context.newCDPSession(page);
  const send = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await send('touchStart', [stick]);
  await send('touchStart', [stick, hand]);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.message)).not.toContain('欢迎来到');
  await send('touchEnd', [hand]);
  expect(await page.evaluate(() => __miniTest.app.state.input.x)).toBeGreaterThan(.5);
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.kitchen.k.player.x)).toBeGreaterThan(x + 10);
  await send('touchEnd', []);
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.input.x)).toBe(0);
  expect(errors).toEqual([]);
});

test('first level reveals its clue, scores two different recipes, and saves the gift', async ({ page }, info) => {
  await tapButton(page, 'start');
  await expect.poll(() => page.evaluate(() => Boolean(__miniTest.app.worldAt({ x: 0, y: 0 })))).toBe(true);
  await tapStation(page, 'puzzle');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.modal?.type)).toBe('clue');
  await tapButton(page, 'dismiss');
  await expect.poll(() => page.evaluate(() => __miniTest.app.buttons().some(b => b.id === 'menu'))).toBe(true);
  await page.screenshot({ path: info.outputPath('kitchen.png') });
  const serve = async (pot, oven, plating, topping) => {
    await tapStation(page, 'stock-2');
    await tapStation(page, oven);
    for (const fruit of ['stock-0', 'stock-1']) {
      await tapStation(page, fruit);
      await tapStation(page, 'board');
      await advance(page, 2.5, true);
      await tapStation(page, 'board');
      await tapStation(page, pot);
    }
    await tapStation(page, 'plates');
    await tapStation(page, pot);
    await tapStation(page, oven);
    await tapStation(page, plating);
    if (topping) {
      await tapStation(page, 'stock-3');
      await tapStation(page, 'board');
      await advance(page, 2.5, true);
    }
    await advance(page, 8);
    await tapStation(page, plating);
    await tapStation(page, pot);
    await tapStation(page, oven);
    if (topping) {
      await tapStation(page, plating);
      await tapStation(page, 'board');
      await tapStation(page, plating);
      await tapStation(page, plating);
    }
    await tapStation(page, 'serve');
  };
  await serve('pot', 'oven', 'plating', false);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.score)).toBe(100);
  await advance(page, 40);
  await serve('pot-2', 'oven-2', 'plating-2', true);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.score)).toBe(200);
  expect(await page.evaluate(() => __miniTest.app.state.modal)).toBeNull();
  await tapButton(page, 'reveal');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.modal?.type)).toBe('gift');
  await page.reload();
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.giftSeen)).toBe(true);
  await tapButton(page, 'gift');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.modal?.type)).toBe('gift');
});

test('tickets roll, the background freezes time, and an expired order reduces the score', async ({ page }) => {
  await tapButton(page, 'start');
  await advance(page, 41);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.orders.map(o => o.id))).toEqual([1, 2]);
  await advance(page, 70);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.score)).toBe(-30);
  await page.evaluate(() => __miniTest.handlers.hide());
  const left = await page.evaluate(() => __miniTest.app.state.kitchen.k.timeLeft);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.timeLeft)).toBe(left);
  await page.evaluate(() => __miniTest.handlers.show());
  await advance(page, 130);
  await tapButton(page, 'retry');
  expect(await page.evaluate(() => __miniTest.app.state.kitchen.k.score)).toBe(0);
});

test('mic failure still permits blowing out and relighting the animated candles', async ({ page }, info) => {
  await tapButton(page, 'candles');
  await tapButton(page, 'mic');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.micPhase)).toBe('unavailable');
  await page.screenshot({ path: info.outputPath('candles.png') });
  await tapButton(page, 'blow');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.candlesOut)).toBe(true);
  await tapButton(page, 'candles');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.candlesOut)).toBe(false);
});

test('starting the shift after a tap plays the original synthesized music and can be muted', async ({ page }) => {
  await page.addInitScript(() => {
    window.noteStarts = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.noteStarts++;
      return start.apply(this, args);
    };
  });
  await page.reload();
  await tapButton(page, 'start');
  await expect.poll(() => page.evaluate(() => window.noteStarts)).toBeGreaterThan(3);
  await tapButton(page, 'sound');
  await expect.poll(() => page.evaluate(() => __miniTest.app.state.muted)).toBe(true);
  const notes = await page.evaluate(() => window.noteStarts);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.noteStarts)).toBe(notes);
});
