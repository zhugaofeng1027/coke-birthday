import assert from 'node:assert/strict';
import test from 'node:test';
import { createFirstKitchen, moveChef } from '../minigame/kitchen.js';
import { layoutFor } from '../minigame/layout.js';
import { createMicrophone, createPcmBlowDetector } from '../minigame/microphone.js';
import { stationDistance, stationsFor } from '../src/cooking.js';

test('the WeChat chef slides against counters without clipping or leaving the kitchen', () => {
  const k = createFirstKitchen();
  const pot = stationsFor(k).find(s => s.id === 'pot');
  k.player = { x: pot.x + pot.w / 2, y: pot.y - 40 };
  for (let i = 0; i < 12; i++) moveChef(k, 0, 1, .016);
  assert.ok(stationDistance(k.player, pot) >= 19);
  assert.ok(stationDistance(k.player, pot) < 23);
  k.player = { x: 600, y: 43 };
  for (let i = 0; i < 12; i++) moveChef(k, 0, -1, .016);
  assert.equal(k.player.y, 43);
});

test('landscape controls avoid portrait-reported notches and WeChat capsule', () => {
  const layout = layoutFor(844, 390, { left: 748, bottom: 36 }, { left: 0, right: 390, top: 47, bottom: 810 });
  assert.ok(layout.joystick.x - layout.joystick.r > 47);
  assert.ok(layout.use.x + layout.use.w < 844 - 34);
  assert.ok(layout.headerRight < 748 && layout.header > 36);
});

function pcm(sample) {
  const frame = new ArrayBuffer(2048);
  const view = new DataView(frame);
  for (let i = 0; i < 1024; i++) view.setInt16(i * 2, sample(i) * 32767, true);
  return frame;
}

test('the PCM path rejects periodic voice and detects sustained wind after calibration', () => {
  const states = [];
  const detect = createPcmBlowDetector((result, phase) => states.push({ ...result, phase }));
  for (let i = 0; i < 10; i++) detect(pcm(() => 0));
  for (let i = 0; i < 10; i++) detect(pcm(j => .08 * Math.sin((i * 1024 + j) * 2 * Math.PI * 175 / 16000)));
  assert.equal(states.at(-1).phase, 'listening');
  assert.equal(states.some(r => r.blown), false);
  let seed = 3;
  let gust = 0;
  const wind = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    gust = gust * .46 + (seed / 0x100000000 - .5) * .15;
    return gust;
  };
  for (let i = 0; i < 6; i++) {
    const frame = pcm(wind);
    detect(frame.slice(0, 622));
    detect(frame.slice(622));
  }
  assert.equal(states.at(-1).blown, true);
});

test('the WeChat microphone never starts on refusal or after leaving the permission prompt', () => {
  let prompt;
  let starts = 0;
  const phases = [];
  const mic = createMicrophone({
    getRecorderManager: () => ({
      onFrameRecorded() {}, onStart() {}, onError() {}, onStop() {}, start() { starts++; },
    }),
    requirePrivacyAuthorize: props => { prompt = props; },
  }, { onState: p => phases.push(p), onReading() {}, onBlow() {} });
  mic.toggle();
  prompt.fail();
  mic.toggle();
  mic.stop();
  prompt.success();
  assert.deepEqual(phases, ['requesting', 'denied', 'requesting', 'idle']);
  assert.equal(starts, 0);
});
