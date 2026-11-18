import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, normalizeProgress } from '../src/game.js';
import {
  createKitchen, DISHES, INGREDIENTS, stationsFor, REACH, CHOP_SECONDS,
  interact, stepKitchen, canChop, plateMatches, stationDistance, nearestStation, nextTask,
  solveKitchenPuzzle, canServe, isHeartJam,
} from '../src/cooking.js';
import { THEMES } from '../src/themes.js';

function at(k, id) { k.player = { ...stationsFor(k).find(s => s.id === id).approach }; }
function use(k, id) { at(k, id); interact(k, id); }
function take(k, id) { use(k, `stock-${DISHES[k.chapter].stock.indexOf(id)}`); }
function cut(k) { use(k, 'board'); stepKitchen(k, CHOP_SECONDS, true); interact(k, 'board'); }
function solve(k) {
  at(k, 'puzzle');
  const t = THEMES[k.chapter];
  return solveKitchenPuzzle(k, t.answer || { order: t.order, shape: 'triangle' });
}
function jam(k, fruits = ['strawberry', 'grape']) {
  for (const id of fruits) { take(k, id); cut(k); use(k, 'pot'); }
  stepKitchen(k, 6);
}
function cookPart(k, part) {
  take(k, part.id);
  if (INGREDIENTS[part.id].cut) cut(k);
  if (part.method !== 'fresh') {
    use(k, part.method); stepKitchen(k, INGREDIENTS[part.id][part.method]);
    assert.equal(k[part.method].ready, true);
    interact(k, part.method);
  }
}
function spiceBroth(k) {
  for (const id of THEMES[2].answer) { use(k, `spice-${id}`); use(k, 'puzzle'); }
  use(k, 'puzzle'); assert.equal(k.holding.type, 'spicebag');
  use(k, 'pot'); assert.equal(k.puzzle.solved, true);
}
function moldRice(k) {
  use(k, 'puzzle'); assert.equal(k.holding.shape, 'circle');
  interact(k, 'puzzle'); assert.equal(k.holding.shape, 'triangle');
}

test('all stations have reachable approaches and remote interactions cannot take ingredients', () => {
  const k = createKitchen();
  for (let chapter = 0; chapter < 6; chapter++) stationsFor(chapter).forEach(s => assert.ok(stationDistance(s.approach, s) <= REACH, s.id));
  interact(k, 'stock-0'); assert.equal(k.holding, null);
  use(k, 'stock-0'); assert.equal(k.holding.id, 'strawberry');
  assert.equal(nearestStation(k).id, 'stock-0');
  const original = k.holding;
  use(k, 'stock-1'); assert.equal(k.holding, original);
});

test('chopping requires a nearby chef, empty hands and a sustained 2.4 seconds', () => {
  const k = createKitchen(); take(k, 'strawberry'); use(k, 'board');
  assert.equal(canChop(k), true);
  stepKitchen(k, .8, true); assert.equal(k.board.item.cut, false);
  stepKitchen(k, 20, false); assert.equal(k.board.item.cut, false);
  at(k, 'serve'); stepKitchen(k, 20, true); assert.equal(k.board.item.cut, false);
  at(k, 'board'); stepKitchen(k, 1.6, true); assert.equal(k.board.item.cut, true);
  assert.equal(k.stats.cuts, 1);
  stepKitchen(k, 20, true); assert.equal(k.stats.cuts, 1);
  interact(k, 'board');
  assert.equal(k.holding.cut, true); assert.equal(k.board.item, null);
});

test('raw meat must be cut and early retrieval does not finish cooking', () => {
  const k = createKitchen(1); take(k, 'chicken'); use(k, 'oven');
  assert.equal(k.oven.item, null); assert.equal(k.holding.id, 'chicken');
  cut(k); use(k, 'oven'); assert.equal(k.holding, null);
  stepKitchen(k, 2); interact(k, 'oven');
  assert.equal(k.holding, null); assert.equal(k.oven.ready, false);
  stepKitchen(k, 7); assert.equal(k.oven.ready, true);
  interact(k, 'oven');
  assert.equal(k.holding.method, 'oven'); assert.equal(k.oven.item, null);
});

test('pot and oven cook concurrently while the chef prepares another ingredient', () => {
  const k = createKitchen(1);
  take(k, 'chicken'); cut(k); use(k, 'oven');
  take(k, 'broccoli'); cut(k); use(k, 'pot');
  assert.ok(k.oven.elapsed >= CHOP_SECONDS);
  stepKitchen(k, 10);
  assert.equal(k.pot.ready, true); assert.equal(k.oven.ready, true);
  assert.equal(k.stats.cooked, 1); assert.equal(k.stats.baked, 1);
  stepKitchen(k, 1000);
  assert.equal(k.pot.ready, true); assert.equal(k.pot.elapsed, k.pot.duration);
});

for (const [chapter, dish] of DISHES.entries()) {
  test(`complete the cooking and plating chain for ${dish.name}`, () => {
    const k = createKitchen(chapter);
    if (chapter === 2) spiceBroth(k);
    if (chapter === 4) {
      cookPart(k, dish.parts[0]); at(k, 'puzzle'); stepKitchen(k, 2);
      use(k, 'lamp');
      use(k, 'plates'); use(k, 'plating');
      cookPart(k, dish.parts[1]); use(k, 'plating'); interact(k, 'plating'); use(k, 'serve');
      assert.equal(k.delivered, true); assert.equal(k.deliveries, 1);
      return;
    }
    use(k, 'plates'); use(k, 'plating');
    for (const part of dish.parts) {
      if (part.id === 'jam') { jam(k); interact(k, 'pot'); }
      else cookPart(k, part);
      if (chapter === 1 && part.id === 'rice') moldRice(k);
      use(k, [1, 3].includes(chapter) ? `slot-${dish.parts.indexOf(part)}` : 'plating');
    }
    assert.equal(plateMatches(k.plating, chapter), true);
    use(k, 'plating');
    if (chapter === 5) assert.equal(solve(k), true);
    use(k, 'serve');
    assert.equal(k.delivered, true); assert.equal(k.deliveries, 1);
    interact(k, 'serve'); assert.equal(k.deliveries, 1); assert.equal(k.holding, null);
  });
}

test('wrong methods and unplated food cannot be served, and mistakes can be discarded', () => {
  const k = createKitchen(3); take(k, 'tomato'); cut(k);
  use(k, 'serve'); assert.equal(k.delivered, false);
  use(k, 'oven'); stepKitchen(k, 8); interact(k, 'oven');
  use(k, 'board'); use(k, 'plates'); use(k, 'plating');
  use(k, 'board'); use(k, 'slot-0');
  assert.equal(k.holding.id, 'tomato'); assert.equal(k.plating.contents.length, 0);
  use(k, 'serve');
  assert.equal(k.delivered, false); assert.match(k.message, /餐盘/);
  use(k, 'trash'); assert.equal(k.holding, null);
});

test('a full plate does not lose a completed dish in the oven', () => {
  const k = createKitchen(1);
  take(k, 'chicken'); cut(k); use(k, 'oven'); stepKitchen(k, 9);
  use(k, 'plates');
  k.holding.contents = Array.from({ length: 3 }, () => ({ type: 'ingredient', id: 'bread', cut: false, method: 'oven' }));
  use(k, 'oven');
  assert.equal(k.oven.ready, true); assert.equal(k.holding.contents.length, 3);
  use(k, 'trash'); use(k, 'plates'); use(k, 'oven');
  assert.equal(k.holding.contents[0].id, 'chicken'); assert.equal(k.oven.item, null);
});

test('mid-cut and cooking state survive a renderer recreation', () => {
  const k = createKitchen(3); take(k, 'tomato'); use(k, 'board'); stepKitchen(k, 1, true);
  const restored = structuredClone(k);
  stepKitchen(restored, 1.4, true); interact(restored, 'board'); use(restored, 'pot');
  const restoredAgain = structuredClone(restored);
  stepKitchen(restoredAgain, 7);
  assert.equal(restoredAgain.pot.ready, true); assert.match(nextTask(restoredAgain), /煮锅/);
});

test('invalid elapsed time cannot damage cooking progress', () => {
  const k = createKitchen(3); take(k, 'tomato'); cut(k); use(k, 'pot');
  for (const elapsed of [NaN, Infinity, -1, 0]) stepKitchen(k, elapsed, true);
  assert.equal(k.pot.elapsed, 0);
});

test('fruit clues are solved by a real mixed jam and spread toast, never a quiz answer', () => {
  const k = createKitchen();
  assert.equal(solveKitchenPuzzle(k, ['strawberry', 'grape']), false);
  at(k, 'puzzle');
  interact(k, 'puzzle'); assert.equal(k.puzzle.openRequested, false);
  take(k, 'strawberry'); cut(k); use(k, 'pot');
  stepKitchen(k, 60);
  assert.equal(k.pot.waiting, true); assert.equal(k.pot.ready, false); assert.equal(k.pot.elapsed, 0);
  assert.equal(k.puzzle.solved, false);
  take(k, 'grape'); use(k, 'pot'); assert.equal(k.holding.id, 'grape');
  cut(k); use(k, 'pot'); stepKitchen(k, 5); assert.equal(k.pot.ready, false);
  stepKitchen(k, 1); assert.equal(isHeartJam(k.pot.item), true); assert.equal(k.puzzle.solved, false);
  interact(k, 'pot'); use(k, 'board'); use(k, 'plates'); use(k, 'plating');
  cookPart(k, DISHES[0].parts[1]); use(k, 'plating');
  use(k, 'board'); use(k, 'plating');
  assert.equal(k.puzzle.solved, true); assert.equal(plateMatches(k.plating, 0), true);
  assert.equal(k.plating.contents.find(i => i.id === 'bread').spread, true);
});

test('wrong jam can be repaired in the pot without losing baked toast', () => {
  for (const fruits of [['strawberry', 'kiwi'], ['strawberry', 'strawberry']]) {
    const k = createKitchen();
    use(k, 'plates'); use(k, 'plating');
    cookPart(k, DISHES[0].parts[1]); use(k, 'plating');
    const toast = k.plating.contents[0];
    jam(k, fruits);
    assert.equal(isHeartJam(k.pot.item), false); assert.equal(k.puzzle.solved, false);
    use(k, 'plating'); use(k, 'pot');
    assert.equal(k.holding.contents.length, 1); assert.ok(k.pot.item);
    use(k, 'plating');
    take(k, 'grape'); cut(k); use(k, 'pot'); stepKitchen(k, 6);
    assert.equal(isHeartJam(k.pot.item), true);
    interact(k, 'pot'); use(k, 'plating');
    assert.equal(k.plating.contents.find(i => i.id === 'bread'), toast);
    assert.equal(k.puzzle.solved, true);
  }
});

test('ready jam can be plated directly from the pot, but unfinished jam cannot', () => {
  const k = createKitchen();
  use(k, 'plates'); use(k, 'plating');
  cookPart(k, DISHES[0].parts[1]); use(k, 'plating');
  take(k, 'strawberry'); cut(k); use(k, 'pot');
  use(k, 'plating'); use(k, 'pot');
  assert.equal(k.holding.contents.length, 1); assert.equal(k.pot.waiting, true);
  use(k, 'plating');
  take(k, 'grape'); cut(k); use(k, 'pot'); stepKitchen(k, 6);
  use(k, 'plating'); use(k, 'pot');
  assert.equal(k.holding.contents.length, 2); assert.equal(k.puzzle.solved, true);
  assert.equal(plateMatches(k.holding, 0), true);
});

test('retrieved wrong jam stays separate from the toast and has a recovery hint', () => {
  const k = createKitchen();
  use(k, 'puzzle'); use(k, 'plates'); use(k, 'plating');
  cookPart(k, DISHES[0].parts[1]); use(k, 'plating');
  jam(k, ['kiwi', 'kiwi']); interact(k, 'pot');
  assert.match(nextTask(k), /回收桶/);
  use(k, 'plating');
  assert.equal(k.plating.contents.length, 1);
  assert.equal(k.holding.id, 'jam'); assert.match(k.message, /单独回收/);
  use(k, 'trash'); assert.equal(k.holding, null); assert.equal(k.plating.contents[0].id, 'bread');
});

test('braising needs the correct spice bag before beef can enter the pot', () => {
  const k = createKitchen(2); take(k, 'beef'); cut(k); use(k, 'pot');
  assert.equal(k.pot.item, null); assert.equal(k.holding.id, 'beef');
  at(k, 'puzzle'); assert.equal(solveKitchenPuzzle(k, ['anise', 'cinnamon', 'chili']), false);
  use(k, 'board');
  spiceBroth(k);
  use(k, 'board');
  use(k, 'pot'); assert.equal(k.pot.item.id, 'beef');
  assert.equal(k.pot.item.braised, true);
});

test('finale requires a real complete plate and correct arrangement', () => {
  for (const chapter of [5]) {
    const k = createKitchen(chapter);
    assert.equal(solve(k), false);
    k.holding = { type: 'plate', contents: DISHES[chapter].parts.map(part => ({ ...part, type: 'ingredient', cut: true })).reverse() };
    assert.equal(canServe(k), false);
    assert.equal(solveKitchenPuzzle(k, { shape: 'circle', order: [...THEMES[chapter].order].reverse() }), false);
    assert.equal(solve(k), true);
    assert.deepEqual(k.holding.contents.map(p => p.id), THEMES[chapter].order);
    assert.equal(canServe(k), true);
    use(k, 'trash');
    assert.equal(canServe(k), false);
  }
});

test('bento molds only cooked rice and wrong shapes can be pressed again without losing food', () => {
  const k = createKitchen(1);
  take(k, 'rice'); use(k, 'puzzle');
  assert.equal(k.holding.shape, undefined); assert.equal(k.puzzle.openRequested, false);
  use(k, 'pot'); stepKitchen(k, 8); interact(k, 'pot');
  const rice = k.holding;
  moldRice(k);
  assert.equal(k.holding, rice); assert.equal(k.puzzle.solved, false);
  interact(k, 'puzzle'); assert.equal(rice.shape, 'heart');
  interact(k, 'puzzle'); interact(k, 'puzzle'); assert.equal(rice.shape, 'triangle');
  assert.equal(solve(k), false);
});

test('bento and photo meals use independent slots and let a wrong arrangement be repaired', () => {
  for (const chapter of [1, 3]) {
    const k = createKitchen(chapter);
    use(k, 'puzzle'); assert.equal(k.puzzle.openRequested, false);
    assert.equal(solve(k), false);
    use(k, 'plates'); use(k, 'plating');
    const food = [];
    for (const [i, part] of DISHES[chapter].parts.entries()) {
      cookPart(k, part);
      if (chapter === 1 && i === 0) moldRice(k);
      food.push(k.holding);
      use(k, `slot-${2 - i}`);
    }
    assert.equal(k.puzzle.solved, false);
    use(k, 'plating'); use(k, 'serve'); assert.equal(k.delivered, false);
    use(k, 'plating');
    use(k, 'slot-2'); assert.equal(k.holding, food[0]);
    use(k, 'slot-0'); assert.equal(k.holding, food[2]);
    assert.equal(k.plating.contents[0], food[0]);
    use(k, 'slot-2');
    assert.equal(k.puzzle.solved, true);
    assert.equal(k.plating.contents[1], food[1]);
    use(k, 'slot-0'); assert.equal(k.puzzle.solved, false);
    use(k, 'slot-0'); assert.equal(k.puzzle.solved, true);
    if (chapter === 1) {
      cookPart(k, DISHES[1].parts[0]); use(k, 'puzzle');
      assert.equal(k.holding.shape, 'circle');
      assert.equal(k.puzzle.solved, true);
      assert.equal(k.plating.contents[0], food[0]);
      use(k, 'trash');
    }
    use(k, 'plating'); assert.equal(canServe(k), true);
    use(k, 'serve'); assert.equal(k.delivered, true);
  }
});

test('invalid food cannot overwrite a meal slot and full trays survive renderer recreation', () => {
  const k = createKitchen(3); use(k, 'plates'); use(k, 'plating');
  cookPart(k, DISHES[3].parts[0]); const tomato = k.holding; use(k, 'slot-0');
  take(k, 'carrot'); use(k, 'slot-0');
  assert.equal(k.holding.id, 'carrot'); assert.equal(k.plating.contents[0], tomato);
  use(k, 'trash');
  cookPart(k, DISHES[3].parts[1]); use(k, 'slot-1');
  cookPart(k, DISHES[3].parts[2]); use(k, 'slot-2');
  const restored = structuredClone(k);
  use(restored, 'plating'); assert.equal(canServe(restored), true);
  use(restored, 'serve'); assert.equal(restored.delivered, true);
});

test('spices are physically carried, reversible, and must go into the pot, not just the bag', () => {
  const k = createKitchen(2);
  interact(k, 'spice-anise'); assert.equal(k.holding, null);
  for (const id of ['anise', 'cinnamon', 'chili']) { use(k, `spice-${id}`); use(k, 'puzzle'); }
  assert.equal(k.puzzle.solved, false); assert.equal(k.puzzle.openRequested, false);
  use(k, 'puzzle'); assert.equal(k.holding.id, 'chili'); assert.deepEqual(k.spices, ['anise', 'cinnamon']);
  use(k, 'spice-bay'); assert.equal(k.holding.id, 'chili');
  use(k, 'spice-chili'); assert.equal(k.holding, null);
  use(k, 'spice-bay'); use(k, 'puzzle'); use(k, 'puzzle');
  assert.equal(k.holding.type, 'spicebag'); assert.equal(k.puzzle.solved, false);
  assert.deepEqual(k.broth, []);
  use(k, 'board'); assert.equal(k.holding.type, 'spicebag');
  use(k, 'pot'); assert.deepEqual(k.broth, THEMES[2].answer);
  assert.equal(k.puzzle.solved, true); assert.equal(k.delivered, false);
  cookPart(k, DISHES[2].parts[0]); assert.equal(k.holding.braised, true);
});

test('duplicate spices cannot produce a usable broth and recipe mistakes stay recoverable', () => {
  const k = createKitchen(2);
  for (let i = 0; i < 3; i++) { use(k, 'spice-anise'); use(k, 'puzzle'); }
  use(k, 'puzzle'); assert.equal(k.holding.type, 'spice');
  use(k, 'spice-anise'); assert.equal(k.spices.length, 2);
  k.holding = { type: 'spicebag', spices: ['anise', 'anise', 'bay'] };
  use(k, 'pot'); assert.equal(k.broth.length, 0); assert.ok(k.holding);
});

test('window only reveals for carried brewed mint tea continuously near the glass', () => {
  const k = createKitchen(4); at(k, 'puzzle');
  assert.equal(solveKitchenPuzzle(k, '热茶留在灯旁'), false);
  take(k, 'mint'); cut(k); use(k, 'pot');
  stepKitchen(k, 6); assert.equal(k.puzzle.steam, 0);
  at(k, 'puzzle'); stepKitchen(k, 10); assert.equal(k.puzzle.steam, 0);
  use(k, 'pot'); stepKitchen(k, 10); assert.equal(k.puzzle.steam, 0);
  at(k, 'puzzle'); stepKitchen(k, 1); assert.equal(k.puzzle.steam, 1);
  at(k, 'pot'); stepKitchen(k, 1); assert.equal(k.puzzle.steam, 0);
  at(k, 'puzzle'); stepKitchen(k, 2); assert.equal(k.puzzle.steam, 2);
  interact(k, 'puzzle'); assert.equal(k.puzzle.openRequested, false); assert.match(k.message, /灯旁/);
  assert.equal(k.puzzle.solved, false); assert.equal(k.delivered, false);
});

test('tea and plated bread must be physically delivered to their matching places', () => {
  const k = createKitchen(4);
  cookPart(k, DISHES[4].parts[0]);
  use(k, 'lamp'); assert.ok(k.holding); assert.equal(k.places.lamp, null);
  at(k, 'puzzle'); stepKitchen(k, 2);
  use(k, 'serve'); assert.ok(k.holding); assert.equal(k.places.flowers, null);
  interact(k, 'lamp'); assert.equal(k.places.lamp, null);
  use(k, 'lamp'); assert.equal(k.holding, null); assert.ok(k.places.lamp);
  assert.equal(k.delivered, false);
  cookPart(k, DISHES[4].parts[1]); use(k, 'serve'); assert.ok(k.holding);
  use(k, 'board'); use(k, 'plates'); use(k, 'plating');
  use(k, 'board'); use(k, 'plating'); interact(k, 'plating');
  use(k, 'lamp'); assert.ok(k.holding);
  use(k, 'serve'); assert.equal(k.delivered, true); assert.equal(k.deliveries, 1);
  interact(k, 'serve'); assert.equal(k.deliveries, 1);
});

test('a combined tea and bread plate can be separated at either serving place', () => {
  for (const first of ['lamp', 'serve']) {
    const k = createKitchen(4);
    k.holding = { type: 'plate', contents: DISHES[4].parts.map(p => ({ ...p, type: 'ingredient', cut: true })) };
    at(k, 'puzzle'); stepKitchen(k, 2);
    use(k, first);
    assert.equal(k.holding.contents.length, 1); assert.equal(k.delivered, false);
    use(k, first === 'lamp' ? 'serve' : 'lamp');
    assert.equal(k.delivered, true);
  }
});

test('finished cooking alone never bypasses a kitchen puzzle', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    k.holding = { type: 'plate', contents: DISHES[chapter].parts.map(p => ({ ...p, type: 'ingredient', cut: true })) };
    use(k, 'serve'); assert.equal(k.delivered, false);
    assert.ok(k.holding);
  }
});

test('saved progress remains contiguous and ending requires all six dishes', () => {
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 1, 3, -1, 8, '2'], finished: true }), { completed: [0, 1], finished: false });
  assert.deepEqual(normalizeProgress(null), { completed: [], finished: false });
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 2, 3, 4, 5], finished: true }), { completed: [0, 1, 2, 3, 4, 5], finished: true });
});

test('birthday config validates types and preserves missing defaults', () => {
  const fallback = { recipient: '主厨', sender: '助手', closing: '生日快乐', gifts: Array.from({ length: 6 }, () => ({ name: '礼物', riddle: '谜面', message: '留言' })) };
  const result = normalizeConfig({ recipient: 'A'.repeat(100), sender: 3, gifts: [{ name: '新的礼物', riddle: '' }] }, fallback);
  assert.equal(result.recipient.length, 40); assert.equal(result.sender, fallback.sender);
  assert.equal(result.gifts.length, 6); assert.equal(result.gifts[0].name, '新的礼物');
  assert.equal(result.gifts[0].riddle, '谜面'); assert.deepEqual(normalizeConfig([], fallback), fallback);
});
