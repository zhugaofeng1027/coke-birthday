import test from 'node:test';
import assert from 'node:assert/strict';
import { kitchenMusicTempo } from '../src/kitchen-music.js';

test('kitchen music follows the closest live deadline without staying urgent after it passes', () => {
  const kitchen = { elapsed: 50, timeLeft: 90, orders: [{ expiresAt: 64 }, { expiresAt: 140 }] };
  assert.equal(kitchenMusicTempo(kitchen), 'order');
  assert.equal(kitchenMusicTempo({ ...kitchen, orders: [{ expiresAt: 140 }] }), 'easy');
  assert.equal(kitchenMusicTempo({ ...kitchen, elapsed: 64 }), 'easy');
  assert.equal(kitchenMusicTempo({ ...kitchen, orders: [{ expiresAt: 65 }] }), 'order');
  assert.equal(kitchenMusicTempo({ ...kitchen, orders: [{ expiresAt: 65.1 }] }), 'easy');
  assert.equal(kitchenMusicTempo({ ...kitchen, timeLeft: 20 }), 'closing');
  assert.equal(kitchenMusicTempo({ ...kitchen, timeLeft: 0 }), null);
  assert.equal(kitchenMusicTempo({ ...kitchen, delivered: true }), null);
  assert.equal(kitchenMusicTempo({ ...kitchen, expired: true }), null);
});
