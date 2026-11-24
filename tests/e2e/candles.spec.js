import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { test, expect } from './fixtures.js';

const KEY = 'birthday-bistro-cooking-v2';
const preview = '/?debug=1&chapter=6&candle=1';
const micButton = '[data-action="wish-mic"]';
const manualButton = '[data-action="wish"]';

test('candle flames flicker, fit the landscape phone and snuff out with smoke', async ({ page }, info) => {
  await page.addInitScript(() => {
    window.micRequests = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      window.micRequests++;
      throw new DOMException('Permission rejected', 'NotAllowedError');
    };
  });
  await page.goto(preview);
  const cake = page.locator('.cake-panel');
  await expect(cake).toBeInViewport({ ratio: 1 });
  const flames = cake.locator('.candle-flame');
  await expect(flames).toHaveCount(3);
  const first = flames.first();
  await expect(first).toHaveCSS('animation-name', 'candle-flicker');
  const transform = await first.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => first.evaluate(el => getComputedStyle(el).transform)).not.toBe(transform);
  if (info.project.name === 'compact-phone') await page.screenshot({ path: info.outputPath('lit-candles.png') });
  expect(await page.evaluate(() => window.micRequests)).toBe(0);
  await page.locator(micButton).click();
  await expect(cake.getByRole('status')).toHaveText(/也可以点按吹灭/);
  await expect(first).toBeVisible();
  await page.locator(manualButton).click();
  await expect(cake.locator('.cake-scene')).toHaveClass(/just-blown/);
  await expect(cake.locator('.candle-smoke').first()).toHaveCSS('animation-name', 'candle-smoke');
  await expect(cake.getByRole('status')).toHaveText('愿你的愿望，都慢慢实现。');
  await expect(first).toBeHidden();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
});

function writeBlowFixture(path) {
  const rate = 48000;
  const wav = Buffer.alloc(44 + 5 * rate * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  let seed = 7243; let low = 0;
  for (let i = 0; i < 5 * rate; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    low += .085 * (seed / 2147483648 - 1 - low);
    const t = i / rate;
    const gust = (t >= 1.4 && t < 1.52) || (t >= 2.4 && t < 3.4);
    const sample = gust ? low * .88 : low * .009;
    wav.writeInt16LE(Math.round(sample * 32767), 44 + 2 * i);
  }
  writeFileSync(path, wav);
}

test('candle microphone hears a sustained gust, saves and releases the mic', async ({}, info) => {
  test.skip(info.project.name !== 'compact-phone', 'One browser with controlled microphone input.');
  const dir = mkdtempSync(join(tmpdir(), 'birthday-candles-'));
  let browser;
  try {
    const audio = join(dir, 'gust.wav');
    writeBlowFixture(audio);
    browser = await chromium.launch({ args: [
      '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${audio}`,
    ] });
    const page = await browser.newPage({ ...info.project.use });
    await page.addInitScript(key => {
      localStorage.setItem(key, localStorage.getItem(key) || JSON.stringify({
        completed: [0, 1, 2, 3, 4, 5], finished: false, flowerRoom: { phase: 'done', flower: 'blue' },
      }));
      const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async constraints => {
        const stream = await getUserMedia(constraints);
        window.micStartedAt = performance.now();
        return stream;
      };
      const stop = MediaStreamTrack.prototype.stop;
      MediaStreamTrack.prototype.stop = function () {
        if (this.kind === 'audio') {
          window.releasedTrack = this;
          window.micOpenTime = performance.now() - window.micStartedAt;
        }
        return stop.call(this);
      };
    }, KEY);
    await page.goto('/');
    await page.locator(micButton).click();
    await expect(page.locator('.candle-status')).toHaveAttribute('data-state', 'listening');
    const scene = page.locator('.cake-scene');
    await expect(scene).not.toHaveClass(/candles-out/);
    await expect(scene).toHaveClass(/just-blown/, { timeout: 6000 });
    expect(await page.evaluate(() => window.micOpenTime)).toBeGreaterThan(2000);
    expect(await page.evaluate(() => window.releasedTrack?.readyState)).toBe('ended');
    await expect(page.locator('.wish-sent')).toBeVisible();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).finished, KEY)).toBe(true);
    await page.reload();
    await expect(page.locator(micButton)).toHaveCount(0);
    await expect(scene).toHaveClass('cake-scene candles-out');
  } finally {
    await browser?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
