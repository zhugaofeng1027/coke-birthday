import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlowDetector, measureBlow } from '../src/candle-mic.js';

test('candle detection ignores silence, background and short bursts', () => {
  const detect = createBlowDetector();
  for (let i = 0; i < 20; i++) assert.ok(detect({ rms: .02, windy: true }, 30).calibrating);
  for (let i = 0; i < 30; i++) assert.equal(detect({ rms: .021, windy: true }, 30).wind, 0);
  for (let i = 0; i < 4; i++) assert.equal(detect({ rms: .12, windy: true }, 30).blown, false);
  for (let i = 0; i < 4; i++) assert.equal(detect({ rms: .12, windy: false }, 30).blown, false);
  for (let i = 0; i < 11; i++) assert.equal(detect({ rms: .12, windy: true }, 30).blown, false);
  assert.equal(detect({ rms: .12, windy: true }, 30).blown, true);
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
