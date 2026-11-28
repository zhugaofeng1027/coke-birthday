import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlowDetector, measureBlow } from '../src/candle-mic.js';

test('candle detection ignores silence, background and short bursts', () => {
  const detect = createBlowDetector();
  for (let i = 0; i < 20; i++) assert.ok(detect({ rms: .02, windy: true }, 30).calibrating);
  for (let i = 0; i < 30; i++) assert.equal(detect({ rms: .021, windy: true }, 30).wind, 0);
  for (let i = 0; i < 4; i++) assert.equal(detect({ rms: .12, windy: true }, 30).blown, false);
  for (let i = 0; i < 4; i++) assert.equal(detect({ rms: .12, windy: false }, 30).blown, false);
  assert.equal(detect({ rms: .12, windy: true }, 500).blown, false);
});

test('a periodic voice-like signal is not treated as wind', () => {
  const rate = 48000;
  const spectrum = new Float32Array(1024).fill(-100);
  const hum = Float32Array.from({ length: 2048 }, (_, i) =>
    .2 * Math.sin(i * 2 * Math.PI * 220 / rate) + .13 * Math.sin(i * 2 * Math.PI * 440 / rate));
  spectrum.fill(-27, 8, 34);
  assert.equal(measureBlow(hum, spectrum, rate).windy, false);
  assert.equal(measureBlow(new Float32Array(2048).fill(.1), spectrum, rate).windy, false);
});

test('quiet, bass-cut wind passes but narrowband noise does not', () => {
  let seed = 7243;
  const samples = Float32Array.from({ length: 2048 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return .0045 * (seed / 2147483648 - 1);
  });
  const spectrum = new Float32Array(1024).fill(-110);
  spectrum.fill(-49, 32, 200);
  const wind = measureBlow(samples, spectrum, 48000);
  assert.ok(wind.rms < .0035);
  assert.equal(wind.windy, true);
  spectrum[90] = -10;
  assert.equal(measureBlow(samples, spectrum, 48000).windy, false);
});

test('a quiet gust can build through an uneven frame cadence after noisy calibration', () => {
  const detect = createBlowDetector();
  for (let i = 0; i < 20; i++) detect({ rms: i < 9 ? .001 : .02, windy: false }, 30);
  const gust = { rms: .0027, windy: true };
  for (const dt of [32, 32, 120, 32, 32]) assert.equal(detect(gust, dt).blown, false);
  assert.equal(detect(gust, 32).blown, true);
});
