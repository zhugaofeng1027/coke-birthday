import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { test, expect } from './fixtures.js';

const KEY = 'birthday-bistro-cooking-v2';
const preview = '/?debug=1&chapter=6&candle=1';
const micButton = '[data-action="wish-mic"]';
const manualButton = '[data-action="wish"]';

test('candle flames fit the phone and blowing them out opens the message without scrolling', async ({ page }, info) => {
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
  await expect(page.locator('.closing-letter')).toHaveCount(0);
  if (info.project.name === 'compact-phone') {
    for (const [width, height] of [[320, 568], [568, 320], [667, 250], [568, 320]]) {
      await page.setViewportSize({ width, height });
      await expect(page.locator('.birthday-cake')).toBeInViewport({ ratio: 1 });
      await expect(page.locator('.chef-after')).toBeInViewport({ ratio: 1 });
      await expect(page.locator(micButton)).toBeInViewport({ ratio: 1 });
      await expect(page.locator(manualButton)).toBeInViewport({ ratio: 1 });
      const pageSize = await page.evaluate(() => {
        const stage = document.querySelector('.ending-stage').getBoundingClientRect();
        const { scrollWidth, scrollHeight } = document.documentElement;
        return { stageWidth: stage.width, stageBottom: stage.bottom, scrollWidth, scrollHeight };
      });
      expect(pageSize).toEqual({ stageWidth: width, stageBottom: height, scrollWidth: width, scrollHeight: height });
    }
  }
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
  const heading = page.getByRole('heading', { name: '生日留言', exact: true });
  await expect(page).toHaveURL(/[?&]birthday=message/);
  await expect(page).toHaveTitle('生日留言 · 生日小厨房');
  await expect(heading).toBeFocused();
  await expect(page.locator('.closing-letter')).toBeInViewport({ ratio: 1 });
  await expect(cake).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  if (info.project.name === 'compact-phone') {
    await page.setViewportSize({ width: 667, height: 250 });
    await expect(page.locator('.closing-letter')).toBeInViewport({ ratio: 1 });
  }
  await page.reload();
  await expect(heading).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBeNull();
});

function writeBlowFixture(path, quiet) {
  const rate = 48000;
  const duration = quiet ? 7 : 5;
  const wav = Buffer.alloc(44 + duration * rate * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  let seed = 7243; let low = 0; let air = 0;
  for (let i = 0; i < duration * rate; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    low += (quiet ? .16 : .085) * (noise - low);
    air += .37 * (noise - air);
    const t = i / rate;
    const gust = (t >= 1.4 && t < 1.52) || (quiet ? t >= 4.5 && t < 4.8 : t >= 2.4 && t < 3.4);
    const sample = quiet ? (gust ? (air - low) * .018 : 0) : low * (gust ? .88 : .009);
    wav.writeInt16LE(Math.round(sample * 32767), 44 + 2 * i);
  }
  writeFileSync(path, wav);
}

for (const quiet of [false, true]) test(`candle microphone hears a ${quiet ? 'short, quiet' : 'strong'} gust, saves and releases the mic`, async ({}, info) => {
  test.skip(info.project.name !== 'compact-phone', 'One browser with controlled microphone input.');
  const dir = mkdtempSync(join(tmpdir(), 'birthday-candles-'));
  let browser;
  try {
    const audio = join(dir, 'gust.wav');
    writeBlowFixture(audio, quiet);
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
    const status = page.locator('.candle-status');
    await expect(status).toHaveAttribute('data-state', 'listening');
    await expect(status).toHaveText('朝着屏幕轻轻吹一下。');
    const scene = page.locator('.cake-scene');
    await expect(scene).not.toHaveClass(/candles-out/);
    if (quiet) {
      const meter = page.locator('.candle-mic-level');
      await expect(meter).toBeVisible();
      await expect.poll(() => meter.evaluate(el => Number(el.style.getPropertyValue('--mic-level'))), { intervals: [30] }).toBeGreaterThan(.1);
      await expect(status).toHaveAttribute('data-state', 'no-signal');
      await expect(scene).not.toHaveClass(/candles-out/);
    }
    await expect(scene).toHaveClass(/just-blown/, { timeout: 6000 });
    expect(await page.evaluate(() => window.micOpenTime)).toBeGreaterThan(2000);
    expect(await page.evaluate(() => window.releasedTrack?.readyState)).toBe('ended');
    const heading = page.getByRole('heading', { name: '生日留言', exact: true });
    await expect(page).toHaveURL(/[?&]birthday=message/);
    await expect(heading).toBeInViewport();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).finished, KEY)).toBe(true);
    await page.reload();
    await expect(page.locator(micButton)).toHaveCount(0);
    await expect(heading).toBeVisible();
    await expect(scene).toHaveCount(0);
  } finally {
    await browser?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
