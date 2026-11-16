import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newPuzzle, checkPuzzle, TOKEN_ORDER, normalizeConfig, normalizeProgress } from '../src/game.js';

test('every chapter has a valid solution and rejects an empty workspace', () => {
  const solutions = [
    { fruits: ['banana', 'grape', 'strawberry'] },
    { customers: ['rice', 'broccoli', 'strawberry'] },
    { scraps: [0, 1, 2], recipe: ['wash', 'simmer', 'plate'] },
    { photos: ['morning', 'afternoon', 'night'] },
    { lights: true, flowers: true, radio: false },
    { tokens: [...TOKEN_ORDER] },
  ];
  solutions.forEach((solution, i) => {
    assert.equal(checkPuzzle(i, newPuzzle()), false);
    assert.equal(checkPuzzle(i, { ...newPuzzle(), ...solution }), true);
  });
});

test('wrong ordering and incomplete collection do not solve puzzles', () => {
  assert.equal(checkPuzzle(0, { ...newPuzzle(), fruits: ['grape', 'banana', 'strawberry'] }), false);
  assert.equal(checkPuzzle(2, { ...newPuzzle(), scraps: [0, 1], recipe: ['wash', 'simmer', 'plate'] }), false);
  assert.equal(checkPuzzle(5, { ...newPuzzle(), tokens: [0, 1, 2, 3, 4] }), false);
  assert.equal(checkPuzzle(4, { ...newPuzzle(), lights: true, flowers: true, radio: true }), false);
});

test('saved progress cannot unlock out-of-order presents', () => {
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 1, 3, -1, 8, '2'], finished: true }), { completed: [0, 1], finished: false });
  assert.deepEqual(normalizeProgress(null), { completed: [], finished: false });
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 2, 3, 4, 5], finished: true }), { completed: [0, 1, 2, 3, 4, 5], finished: true });
});

test('config validates types, preserves defaults and constrains text lengths', () => {
  const fallback = { recipient: '主厨', sender: '助手', closing: '生日快乐', gifts: Array.from({ length: 6 }, () => ({ name: '礼物', riddle: '谜面', message: '留言' })) };
  const result = normalizeConfig({ recipient: 'A'.repeat(100), sender: 3, gifts: [{ name: '新的礼物', riddle: '' }] }, fallback);
  assert.equal(result.recipient.length, 40);
  assert.equal(result.sender, fallback.sender);
  assert.equal(result.gifts.length, 6);
  assert.equal(result.gifts[0].name, '新的礼物');
  assert.equal(result.gifts[0].riddle, '谜面');
  assert.deepEqual(normalizeConfig([], fallback), fallback);
});
