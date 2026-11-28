import { test, expect } from './fixtures.js';

test('all six story kitchens start with their real timers and play the new soundtrack', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Checks actual story mode in landscape.');
  await page.addInitScript(() => {
    const count = new URLSearchParams(location.search).get('test-progress');
    if (count !== null) localStorage.setItem('birthday-bistro-cooking-v2', JSON.stringify({
      completed: Array.from({ length: Number(count) }, (_, i) => i), finished: false,
    }));
    const start = OscillatorNode.prototype.start;
    window.songPitches = [];
    OscillatorNode.prototype.start = function (time) {
      if (this.context.state === 'running') window.songPitches.push(this.frequency.value);
      return start.call(this, time);
    };
  });
  for (let chapter = 0; chapter < 6; chapter++) {
    await page.goto(`/?test-progress=${chapter}`);
    const host = page.locator('#kitchen-host');
    await expect(page.locator('body')).toHaveAttribute('data-play-mode', 'story');
    await expect(host).toHaveAttribute('data-theme', String(chapter));
    await expect(host).toHaveAttribute('data-oven-state', 'empty');
    await expect(host).toHaveAttribute('data-board-state', 'empty');
    expect(Number(await host.getAttribute('data-time-left'))).toBeGreaterThan(200);
    await expect(host).toHaveAttribute('data-ready', 'true');
    expect(await page.evaluate(() => window.songPitches)).toEqual([]);
    await page.locator('.joystick').tap();
    await expect.poll(() => page.evaluate(() => window.songPitches.some(hz => hz > 130 && hz < 132))).toBe(true);
    await expect(page.locator('[data-action="music"]')).toHaveAttribute('aria-pressed', 'true');
  }
});

test('an explicit mute survives reload and playing again restores music', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Checks touch activation and mute in a fresh session.');
  await page.goto('/');
  const music = page.locator('[data-action="music"]');
  await page.locator('.joystick').tap();
  await expect(music).toHaveAttribute('aria-pressed', 'true');
  await music.tap();
  await expect(music).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await page.locator('.joystick').tap();
  await expect(music).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('birthday-bistro-muted-v1'))).toBe('true');
  await music.tap();
  await expect(music).toHaveAttribute('aria-pressed', 'true');
});

test('music in the landscape audition speeds up and settles with the real order clock', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Exercises audio in the right-pane preview iframe.');
  await page.addInitScript(() => {
    const start = OscillatorNode.prototype.start;
    window.songStarts = [];
    OscillatorNode.prototype.start = function (time) {
      window.songStarts.push(time);
      return start.call(this, time);
    };
  });
  await page.goto('/?preview=phone&debug=1&chapter=2&kitchen-polish=after&bgm-audition=1');
  const frame = page.locator('iframe').contentFrame();
  const host = frame.locator('#kitchen-host');
  await expect(host).toHaveAttribute('data-ready', 'true');
  const audio = frame.locator('[data-action="music"]');
  const count = () => audio.evaluate(() => window.songStarts.length);
  const shortestBeat = () => audio.evaluate(() => {
    const beats = [...new Set(window.songStarts)].slice(-7);
    return Math.min(...beats.slice(1).map((time, index) => time - beats[index]));
  });
  await expect(audio).toHaveAttribute('aria-pressed', 'false');
  expect(await count()).toBe(0);
  await audio.click();
  await expect.poll(shortestBeat, { timeout: 4500 }).toBeCloseTo(.278, 2);
  await expect.poll(shortestBeat, { timeout: 12000 }).toBeLessThan(.24);
  await expect(host).toHaveAttribute('data-missed-orders', '1', { timeout: 20000 });
  await expect.poll(shortestBeat, { timeout: 9500 }).toBeCloseTo(.278, 2);
  await expect(host).toHaveAttribute('data-time-left', '20', { timeout: 16000 });
  await expect.poll(shortestBeat, { timeout: 5500 }).toBeLessThan(.215);
  await audio.click();
  await expect(audio).toHaveAttribute('aria-pressed', 'false');
  const muted = await count();
  await page.waitForTimeout(550);
  expect(await count()).toBe(muted);
});
