import test from 'node:test';
import assert from 'node:assert/strict';
import { openingMode, OPENING_DURATIONS } from '../src/opening.js';

const fresh = { debug: false, completed: [], seen: false, entered: false };
test('opening distinguishes first visits, returning players and the current session', () => {
  assert.equal(openingMode(fresh), 'story');
  assert.equal(openingMode({ ...fresh, seen: true }), 'welcome');
  assert.equal(openingMode({ ...fresh, completed: [0, 1] }), 'welcome');
  assert.equal(openingMode({ ...fresh, entered: true }), null);
  assert.equal(openingMode({ ...fresh, completed: [0, 1, 2, 3, 4, 5] }), null);
});
test('opening preview preserves debug bypass and can replay a finished story', () => {
  assert.equal(openingMode({ ...fresh, debug: true, preview: true }), null);
  assert.equal(openingMode({ ...fresh, entered: true, preview: true }), 'story');
  assert.equal(openingMode({ ...fresh, completed: [0, 1, 2, 3, 4, 5], preview: true }), 'story');
  assert.equal(OPENING_DURATIONS.at(-1), 0);
  assert.equal(OPENING_DURATIONS.reduce((total, time) => total + time, 0), 14000);
});
