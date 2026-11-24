import { test, expect } from './fixtures.js';

async function useKitchenFixture(page, transform) {
  await page.route('**/src/cooking.js*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: transform(await response.text()) });
  });
}

function prepareFinalOrder(source) {
  return source
    .replace('k.player = candidates[0];', 'k.player = { ...stationsFor(k).find(s => s.id === "serve").approach };')
    .replace('player: { x: 420, y: 548 }, holding: null,',
      `player: { ...stationsFor(chapter).find(s => s.id === "serve").approach },
        holding: {
          type: chapter === 1 ? "bento" : "plate", packed: true,
          contents: DISHES[chapter].parts.map(part => ({ ...part, type: "ingredient", cut: true })),
        },`)
    .replace('score: 0, targetScore:', 'score: ORDER_POINTS, targetScore:')
    .replace('puzzle: { solved: false,', 'puzzle: { solved: true,')
    .replace('x: 20, y: -16, focus: 20, shots: 0', 'x: 0, y: 0, focus: 55, shots: 0');
}

test('two expiring orders give one combined deduction while a later ticket stays normal', async ({ page }) => {
  await useKitchenFixture(page, source => source
    .replace('orders: [newOrder(chapter, 1, 0)]',
      'orders: [{id: 1, createdAt: 0, expiresAt: 2.5}, {id: 2, createdAt: 0, expiresAt: 2.5}, {id: 3, createdAt: 0, expiresAt: 55}]')
    .replace('nextOrderId: 2', 'nextOrderId: 4'));
  await page.goto('/?debug=1&chapter=2');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.order-expiring .order-sequence')).toHaveText(['订单 01', '订单 02']);
  await Promise.all([
    expect(page.locator('.score-fx-loss')).toHaveText('\u221260'),
    expect(page.locator('.score-fx-ticket-missed .order-sequence')).toHaveText(['订单 01', '订单 02']),
  ]);
  await expect(page.locator('.rolling-order .order-sequence')).toHaveText(['订单 03']);
  await expect(page.locator('#shift-score')).toHaveText('-60 / 200');
  await expect(page.locator('.score-fx-delta')).toHaveCount(0);
  await expect(page.locator('.letter-modal')).toHaveCount(0);
});

test('the real last delivery lands on the scoreboard before the birthday note opens', async ({ page }, testInfo) => {
  await useKitchenFixture(page, prepareFinalOrder);
  await page.addInitScript(() => localStorage.setItem('birthday-bistro-cooking-v2', '{"completed":[0],"finished":false}'));
  await page.goto('/');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-nearest', 'serve');
  await page.locator('[data-action="kitchen-interact"]').click();
  await expect(host).toHaveAttribute('data-score', '200');
  await expect(page.locator('.score-fx-win')).toHaveText('+100');
  await expect(page.locator('.score-fx-station')).toBeVisible();
  await expect(page.locator('.score-fx-ticket-served .order-sequence')).toHaveText('订单 01');
  await expect(page.locator('#shift-score')).toHaveText('100 / 200');
  if (testInfo.project.name === 'compact-phone') {
    await page.waitForTimeout(150);
    await page.screenshot({ path: testInfo.outputPath('serve-effects.png') });
  }
  await expect(page.locator('.score-fx-pass')).toContainText('达标');
  await expect(page.locator('#shift-score')).toHaveText('200 / 200');
  await expect(page.locator('.letter-modal')).toHaveCount(0);
  await expect(page.locator('.letter-modal')).toBeVisible();
  await expect(page.locator('.score-fx-pass')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('birthday-bistro-cooking-v2')).completed)).toEqual([0]);
});

test('retrying during the score effect does not open the previous kitchen note', async ({ page }) => {
  await useKitchenFixture(page, prepareFinalOrder);
  await page.goto('/?debug=1&chapter=2');
  const host = page.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-nearest', 'serve');
  await page.locator('[data-action="kitchen-interact"]').click();
  await expect(page.locator('.score-fx-win')).toHaveText('+100');
  await page.locator('[data-action="confirm-retry"]').click();
  await page.locator('[data-action="retry-dish"]').click();
  await expect(host).toHaveAttribute('data-score', '100');
  await expect(host).toHaveAttribute('data-deliveries', '0');
  await page.waitForTimeout(1200);
  await expect(page.locator('.score-effects')).toBeEmpty();
  await expect(page.locator('.letter-modal')).toHaveCount(0);
});

test('keeping the finished photo awards the order and opens the note with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await useKitchenFixture(page, prepareFinalOrder);
  await page.addInitScript(() => {
    const create = AudioContext.prototype.createOscillator;
    window.handoffBells = 0;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = create.call(this);
      const set = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
      oscillator.frequency.setValueAtTime = (frequency, time) => {
        if (frequency === 1180) window.handoffBells++;
        return set(frequency, time);
      };
      return oscillator;
    };
  });
  await page.goto('/?debug=1&chapter=4');
  await expect(page.locator('#kitchen-host')).toHaveAttribute('data-nearest', 'serve');
  await page.locator('[data-action="music"]').click();
  await page.locator('[data-action="kitchen-interact"]').click();
  await page.locator('[data-action="memory-shutter"]').click();
  await expect(page.locator('#shift-score')).toHaveText('100 / 200');
  await page.locator('[data-action="memory-keep"]').click();
  await expect(page.locator('.memory-print-modal')).toHaveCount(0);
  await expect(page.locator('.score-fx-win')).toHaveText('+100');
  await expect(page.locator('.letter-modal .delivered-photo')).toBeVisible();
  await expect(page.locator('#shift-score')).toHaveText('200 / 200');
  expect(await page.evaluate(() => window.handoffBells)).toBe(1);
});
