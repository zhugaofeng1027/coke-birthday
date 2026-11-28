import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig, normalizeProgress, newFlowerRoom, advanceFlowerRoom } from '../src/game.js';
import {
  createKitchen, DISHES, INGREDIENTS, CHALLENGES, ORDER_POINTS, ORDER_PENALTY, stationsFor, worldFor, setKitchenLayout, REACH, CHOP_SECONDS, orderRecipe, finaleOrder,
  interact, stepKitchen, canChop, plateMatches, stationDistance, nearestStation, nextTask, kitchenClue,
  solveKitchenPuzzle, canServe, isHeartJam, packBento, takePackedBento, plateProgress,
  adjustMemoryCamera, memoryPhotoQuality, captureMemoryPhoto, retakeMemoryPhoto, keepMemoryPhoto,
} from '../src/cooking.js';
import { THEMES, STEAM_MESSAGE } from '../src/themes.js';
import { kitchenRoute } from './e2e/navigation.js';

function at(k, id) { k.player = { ...stationsFor(k).find(s => s.id === id).approach }; }
function use(k, id) { at(k, id); interact(k, id); }
function take(k, id) { use(k, `stock-${DISHES[k.chapter].stock.indexOf(id)}`); }
function cut(k) { use(k, 'board'); stepKitchen(k, CHOP_SECONDS, true); interact(k, 'board'); }
function solve(k) {
  at(k, 'puzzle');
  const t = THEMES[k.chapter];
  return solveKitchenPuzzle(k, t.answer || { order: finaleOrder(k.holding) });
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
function pack(k) {
  use(k, 'puzzle');
  for (const id of ['lid', 'band', 'seal']) assert.equal(packBento(k, id), true);
  assert.equal(takePackedBento(k), true);
}

test('every clue station opens a readable clue without solving the kitchen or taking food', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    assert.ok(k.message.includes(THEMES[chapter].station));
    use(k, 'puzzle');
    assert.equal(k.puzzle.openRequested, true);
    assert.equal(k.message, THEMES[chapter].clue);
    assert.equal(kitchenClue(k), THEMES[chapter].clue);
    assert.equal(k.holding, null);
    assert.equal(k.puzzle.solved, false);
    assert.equal(k.delivered, false);
  }
});

test('the rereadable steam clue stays hidden until hot tea reveals it and survives walking away', () => {
  const k = createKitchen(4);
  assert.equal(kitchenClue(k), THEMES[4].clue);
  k.holding = { type: 'ingredient', id: 'mint', cut: true, method: 'pot' };
  at(k, 'puzzle');
  stepKitchen(k, 1.9);
  assert.equal(kitchenClue(k), THEMES[4].clue);
  stepKitchen(k, .1);
  assert.equal(kitchenClue(k), STEAM_MESSAGE);
  use(k, 'lamp');
  assert.equal(k.holding, null);
  assert.equal(kitchenClue(k), STEAM_MESSAGE);
  assert.equal(kitchenClue(createKitchen(4)), THEMES[4].clue);
});

test('all stations have reachable approaches and remote interactions cannot take ingredients', () => {
  const k = createKitchen();
  for (const layout of ['desktop', 'landscape']) for (let chapter = 0; chapter < 6; chapter++) {
    const kitchen = createKitchen(chapter);
    setKitchenLayout(kitchen, layout === 'landscape');
    for (const station of stationsFor(kitchen)) {
      assert.ok(stationDistance(station.approach, station) <= REACH, station.id);
      assert.doesNotThrow(() => kitchenRoute(chapter, kitchen.player, station.id, layout));
    }
  }
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
  stepKitchen(k, 10);
  assert.equal(k.pot.ready, true); assert.equal(k.pot.elapsed, k.pot.duration);
});

test('both pots, ovens and plating tables run independently; a later recipe can be served first', () => {
  const k = createKitchen(1);
  stepKitchen(k, CHALLENGES[1].orderInterval);
  for (const id of ['pot', 'pot-2']) { take(k, 'rice'); use(k, id); }
  for (const id of ['oven', 'oven-2']) { take(k, 'chicken'); cut(k); use(k, id); }
  stepKitchen(k, 10);
  for (const id of ['pot', 'pot-2', 'oven', 'oven-2']) assert.equal(k[id].ready, true);
  for (const suffix of ['', '-2']) {
    const slot = `plating${suffix}`;
    use(k, 'plates'); use(k, slot);
    for (const id of ['pot', 'oven']) { use(k, id + suffix); use(k, slot); }
    take(k, suffix ? 'carrot' : 'broccoli'); cut(k); use(k, slot);
    assert.equal(plateMatches(k[slot], 1, suffix ? 1 : 0), true);
  }
  use(k, 'plating-2'); pack(k); use(k, 'serve');
  assert.deepEqual(k.orders.map(order => order.id), [1]);
  assert.equal(k.score, ORDER_POINTS);
  assert.equal(k.plating.contents.length, 3);
  use(k, 'plating'); pack(k); use(k, 'serve');
  assert.equal(k.score, 200);
  assert.equal(k.delivered, true);
});

for (const { chapter, dish, wide } of DISHES.flatMap((dish, chapter) => [false, true].map(wide => ({ chapter, dish, wide })))) {
  test(`complete two scored orders in the ${wide ? 'landscape ' : ''}cooking chain for ${dish.name}`, () => {
    const k = createKitchen(chapter);
    if (wide) setKitchenLayout(k, true);
    if (chapter === 2) spiceBroth(k);
    for (let order = 1; order <= 2; order++) {
      if (!k.orders.length) stepKitchen(k, k.nextOrderAt - k.elapsed);
      const ticket = k.orders[0];
      const recipe = orderRecipe(chapter, ticket);
      if (chapter === 4) {
        cookPart(k, dish.parts[0]); at(k, 'puzzle'); stepKitchen(k, 2);
        use(k, 'lamp');
        use(k, 'plates'); use(k, 'plating');
        for (const part of recipe.parts.slice(1)) { cookPart(k, part); use(k, 'plating'); }
        use(k, 'plating'); use(k, 'serve');
      } else {
        use(k, 'plates'); use(k, 'plating');
        for (const part of recipe.parts) {
          if (part.id === 'jam') { jam(k); interact(k, 'pot'); }
          else cookPart(k, part);
          use(k, 'plating');
        }
        assert.equal(plateMatches(k.plating, chapter, ticket.variant), true);
        use(k, 'plating');
        if (chapter === 1) pack(k);
        if (chapter === 5) assert.equal(solve(k), true);
        if (chapter !== 3) assert.ok(nextTask(k).includes(stationsFor(k).find(s => s.id === 'serve').name));
        use(k, 'serve');
        if (chapter === 3) {
          assert.equal(k.delivered, false);
          adjustMemoryCamera(k, { x: 0, y: 0, focus: 55 });
          assert.equal(captureMemoryPhoto(k), true);
          assert.equal(keepMemoryPhoto(k), true);
        }
      }
      assert.equal(k.delivered, order === 2);
      assert.equal(k.deliveries, order);
      assert.equal(k.score, ORDER_POINTS * order);
      assert.equal(k.expired, false);
      assert.equal(k.holding, null);
      const score = k.score;
      interact(k, 'serve');
      if (chapter === 3 && order === 1) assert.equal(keepMemoryPhoto(k), false);
      assert.equal(k.score, score);
      if (order === 1) {
        assert.deepEqual(plateProgress(k), orderRecipe(chapter, k.orders[0]).parts.map(() => false));
        assert.equal(k.packing.meal, null); assert.equal(k.packing.step, 0);
        assert.equal(k.photo.meal, null); assert.equal(k.photo.capture, null);
        assert.equal(k.puzzle.solved, chapter === 2);
        if (chapter === 4) assert.equal(k.puzzle.steam, 2);
      }
    }
    const remaining = k.timeLeft;
    stepKitchen(k, remaining + 1, true);
    assert.equal(k.timeLeft, remaining);
  });
}

test('countdown expires exactly at zero, blocks scoring and every interactive completion path', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    assert.equal(k.timeLeft, CHALLENGES[chapter].seconds);
    assert.equal(k.targetScore, 200);
    assert.equal(k.score, 0);
    k.score = 100;
    k.holding = { type: 'plate', contents: DISHES[chapter].parts.map(p => ({ ...p, type: 'ingredient', cut: true, spread: true, braised: true, fruits: ['strawberry', 'grape'] })) };
    k.puzzle.solved = true;
    k.puzzle.steam = 2;
    if (chapter === 1) { k.holding.type = 'bento'; k.holding.packed = true; }
    if (chapter === 3) { use(k, 'serve'); adjustMemoryCamera(k, { x: 0, y: 0, focus: 55 }); captureMemoryPhoto(k); }
    stepKitchen(k, k.timeLeft - .01);
    assert.equal(k.expired, false);
    stepKitchen(k, .02);
    assert.equal(k.expired, true);
    assert.equal(k.timeLeft, 0);
    const frozen = structuredClone(k);
    use(k, chapter === 4 ? 'lamp' : 'serve');
    if (chapter === 4) use(k, 'serve');
    assert.equal(canServe(k), false);
    assert.equal(canChop(k), false);
    assert.equal(keepMemoryPhoto(k), false);
    assert.equal(captureMemoryPhoto(k), false);
    assert.equal(retakeMemoryPhoto(k), false);
    assert.equal(adjustMemoryCamera(k, { x: 0 }), false);
    assert.equal(packBento(k, 'seal'), false);
    assert.equal(takePackedBento(k), false);
    assert.equal(solve(k), false);
    stepKitchen(k, 10);
    assert.equal(k.delivered, false);
    assert.equal(k.score, frozen.score);
    assert.equal(k.deliveries, 0);
    assert.equal(k.timeLeft, 0);
    assert.equal(k.elapsed, frozen.elapsed);
    const retry = createKitchen(chapter);
    assert.equal(retry.score, 0); assert.equal(retry.deliveries, 0);
    assert.equal(retry.expired, false); assert.equal(retry.timeLeft, CHALLENGES[chapter].seconds);
  }
});

test('orders arrive on the clock before earlier orders finish and each keeps its own deadline', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    const { orderInterval, orderLifetime } = CHALLENGES[chapter];
    stepKitchen(k, orderInterval - .5);
    assert.equal(k.orders.length, 1);
    stepKitchen(k, .5);
    assert.equal(k.deliveries, 0);
    assert.deepEqual(k.orders.map(order => order.id), [1, 2]);
    assert.equal(k.orders[0].expiresAt, orderLifetime);
    assert.equal(k.orders[1].createdAt, orderInterval);
    assert.equal(k.orders[1].expiresAt, orderInterval + orderLifetime);
    stepKitchen(k, orderLifetime - k.elapsed);
    assert.equal(k.missedOrders, 1);
    assert.equal(k.score, -ORDER_PENALTY);
    assert.equal(k.orders.some(order => order.id === 1), false);
    assert.equal(k.orders[0].id, 2);
    assert.equal(k.expired, false);
    const penalized = k.score;
    stepKitchen(k, .1);
    assert.equal(k.score, penalized);
  }
});

test('order expiry preserves food, photo, packing, broth and revealed clues', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    k.holding = { type: 'ingredient', id: DISHES[chapter].stock[0], cut: true, method: 'fresh' };
    k.puzzle.steam = 2;
    k.broth = ['anise', 'cinnamon', 'bay'];
    k.packing.step = 2;
    k.packing.meal = { type: 'plate', contents: [] };
    k.photo.meal = { type: 'plate', contents: [] };
    k.photo.capture = { x: 0, y: 0, focus: 55, ready: true };
    const before = structuredClone(k);
    stepKitchen(k, CHALLENGES[chapter].orderLifetime);
    assert.equal(k.missedOrders, 1);
    for (const key of ['holding', 'packing', 'photo', 'broth', 'puzzle']) assert.deepEqual(k[key], before[key]);
  }
});

test('order timing and penalties are independent of frame size, including a whole shift', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const single = createKitchen(chapter);
    const many = createKitchen(chapter);
    const seconds = CHALLENGES[chapter].seconds;
    stepKitchen(single, seconds);
    for (let i = 0; i < seconds; i++) stepKitchen(many, 1);
    for (const key of ['orders', 'nextOrderId', 'nextOrderAt', 'score', 'missedOrders', 'expired', 'elapsed']) assert.deepEqual(single[key], many[key]);
    assert.equal(single.orders.every(order => order.createdAt < seconds), true);
    const score = single.score;
    stepKitchen(single, seconds);
    assert.equal(single.score, score);
  }
});

test('serving consumes the oldest matching ticket, never creates one, and penalties increase the pass requirement', () => {
  const k = createKitchen(5);
  const meal = (ticket) => ({ type: 'plate', contents: orderRecipe(5, ticket).parts.map(part => ({ ...part, type: 'ingredient', cut: true })) });
  k.holding = meal(k.orders[0]); solve(k); use(k, 'serve');
  assert.equal(k.score, 100);
  assert.equal(k.orders.length, 0);
  assert.equal(k.nextOrderAt, CHALLENGES[5].orderInterval);
  k.holding = meal(); solve(k);
  const held = k.holding;
  use(k, 'serve');
  assert.equal(k.holding, held);
  assert.equal(k.score, 100);
  assert.equal(k.deliveries, 1);
  stepKitchen(k, CHALLENGES[5].orderLifetime + CHALLENGES[5].orderInterval);
  assert.equal(k.score, 100 - ORDER_PENALTY);
  assert.equal(k.orders[0].id, 3);
  use(k, 'serve');
  assert.equal(k.orders[0].id, 4);
  assert.equal(k.score, 200 - ORDER_PENALTY);
  assert.equal(k.delivered, false);
  k.holding = meal(k.orders[0]); solve(k); use(k, 'serve');
  assert.equal(k.score, 300 - ORDER_PENALTY);
  assert.equal(k.delivered, true);
});

test('wide kitchens keep every approach clear, unambiguous and inside the room', () => {
  for (let chapter = 0; chapter < 6; chapter++) {
    const k = createKitchen(chapter);
    setKitchenLayout(k, true);
    const world = worldFor(k);
    for (const s of stationsFor(k)) {
      assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= world.width && s.y + s.h <= world.height, s.id);
      assert.ok(stationDistance(s.approach, s) <= REACH, s.id);
      assert.ok(stationsFor(k).every(other => stationDistance(s.approach, other) >= 22), s.id);
      k.player = { ...s.approach };
      assert.equal(nearestStation(k)?.id, s.id);
    }
  }
});

test('changing layout preserves food and timers and never places the chef inside a counter', () => {
  const k = createKitchen(1);
  take(k, 'chicken'); cut(k); use(k, 'oven'); stepKitchen(k, 2); take(k, 'rice');
  const held = k.holding;
  const elapsed = k.oven.elapsed;
  for (const wide of [true, false, true]) {
    setKitchenLayout(k, wide);
    assert.equal(k.holding, held);
    assert.equal(k.oven.elapsed, elapsed);
    assert.ok(stationsFor(k).every(s => stationDistance(k.player, s) >= 23));
    const before = { ...k.player };
    setKitchenLayout(k, wide);
    assert.deepEqual(k.player, before);
  }
});

test('wrong methods and unplated food cannot be served, and mistakes can be discarded', () => {
  const k = createKitchen(3); take(k, 'tomato'); cut(k);
  use(k, 'serve'); assert.equal(k.delivered, false);
  use(k, 'oven'); stepKitchen(k, 8); interact(k, 'oven');
  use(k, 'board'); use(k, 'plates'); use(k, 'plating');
  use(k, 'board'); use(k, 'plating');
  assert.equal(k.holding.id, 'tomato'); assert.equal(k.plating.contents.length, 0);
  use(k, 'serve');
  assert.equal(k.delivered, false); assert.match(k.message, /餐桌/);
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
  const remaining = k.timeLeft;
  for (const elapsed of [NaN, Infinity, -1, 0]) stepKitchen(k, elapsed, true);
  assert.equal(k.pot.elapsed, 0);
  assert.equal(k.timeLeft, remaining);
});

test('fruit clues are solved by a real mixed jam and spread toast, never a quiz answer', () => {
  const k = createKitchen();
  assert.equal(solveKitchenPuzzle(k, ['strawberry', 'grape']), false);
  at(k, 'puzzle');
  interact(k, 'puzzle'); assert.equal(k.puzzle.openRequested, true);
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

test('bento accepts any cooking order without molds or slots and requires a packed handoff', () => {
  const k = createKitchen(1);
  k.score = k.targetScore - ORDER_POINTS;
  assert.equal(stationsFor(k).some(s => s.type === 'slot'), false);
  assert.equal(THEMES[1].order, undefined);
  use(k, 'puzzle'); assert.equal(k.packing.openRequested, false);
  assert.equal(solve(k), false);
  use(k, 'plates'); use(k, 'plating');
  for (const part of [...DISHES[1].parts].reverse()) { cookPart(k, part); use(k, 'plating'); }
  const meal = k.plating;
  use(k, 'plating'); use(k, 'serve');
  assert.equal(k.holding, meal); assert.equal(k.delivered, false); assert.equal(canServe(k), false);
  pack(k);
  assert.equal(k.puzzle.solved, true); assert.equal(k.delivered, false);
  assert.equal(k.holding.type, 'bento'); assert.equal(k.holding.contents, meal.contents);
  assert.equal(canServe(k), true); assert.deepEqual(plateProgress(k), [true, true, true]);
  use(k, 'trash'); assert.equal(k.holding.type, 'bento');
  assert.match(nextTask(k), /送到取餐口/);
  use(k, 'serve'); assert.equal(k.delivered, true); assert.equal(k.deliveries, 1);
  assert.equal(takePackedBento(k), false); assert.equal(packBento(k, 'seal'), false);
  interact(k, 'serve'); assert.equal(k.deliveries, 1);
});

test('bento packing gates each step, preserves progress and meal when reopened or recreated', () => {
  const k = createKitchen(1);
  k.score = k.targetScore - ORDER_POINTS;
  k.holding = { type: 'plate', contents: DISHES[1].parts.map(p => ({ ...p, type: 'ingredient', cut: true })) };
  const meal = k.holding;
  interact(k, 'puzzle'); assert.equal(k.packing.meal, null);
  use(k, 'puzzle');
  assert.equal(k.packing.meal, meal); assert.equal(k.packing.openRequested, true); assert.equal(k.holding, null);
  assert.deepEqual(plateProgress(k), [true, true, true]);
  assert.equal(takePackedBento(k), false);
  assert.equal(packBento(k, 'seal'), false); assert.equal(k.packing.step, 0);
  assert.equal(packBento(k, 'lid'), true); assert.equal(k.packing.step, 1);
  assert.equal(packBento(k, 'lid'), false); assert.equal(packBento(k, 'seal'), false);
  k.packing.openRequested = false;
  use(k, 'puzzle'); assert.equal(k.packing.openRequested, true); assert.equal(k.packing.step, 1);
  assert.equal(k.packing.meal, meal);
  take(k, 'carrot');
  use(k, 'puzzle'); assert.equal(packBento(k, 'band'), false); assert.equal(k.holding.id, 'carrot');
  use(k, 'trash'); use(k, 'puzzle'); assert.equal(packBento(k, 'band'), true);
  at(k, 'plating'); assert.equal(packBento(k, 'seal'), false);
  const restored = structuredClone(k);
  use(restored, 'puzzle'); assert.equal(restored.packing.step, 2);
  assert.equal(packBento(restored, 'seal'), true);
  assert.equal(restored.delivered, false); assert.equal(takePackedBento(restored), true);
  assert.equal(takePackedBento(restored), false);
  assert.equal(restored.packing.meal, null);
  use(restored, 'puzzle'); assert.equal(restored.holding.type, 'bento');
  use(restored, 'serve'); assert.equal(restored.delivered, true);
  assert.equal(k.packing.step, 2); assert.equal(k.delivered, false);
});

test('wrong or duplicate bento food stays in hand and invalid meals cannot enter packing', () => {
  const k = createKitchen(1); use(k, 'plates'); use(k, 'plating');
  cookPart(k, DISHES[1].parts[0]); const rice = k.holding; use(k, 'plating');
  cookPart(k, { id: 'carrot', method: 'pot' }); use(k, 'plating');
  assert.equal(k.holding.id, 'carrot'); assert.equal(k.plating.contents[0], rice);
  use(k, 'trash');
  cookPart(k, DISHES[1].parts[0]); use(k, 'plating');
  assert.equal(k.holding.id, 'rice'); assert.equal(k.plating.contents.length, 1);
  use(k, 'trash'); use(k, 'plating'); use(k, 'puzzle');
  assert.equal(k.packing.meal, null); assert.equal(k.holding.contents[0], rice);
  k.holding.contents = DISHES[1].parts.map(p => ({ ...p, type: 'ingredient', cut: true }));
  k.holding.contents[0].method = 'fresh';
  use(k, 'puzzle'); assert.equal(k.packing.meal, null);
  assert.equal(packBento(k, 'lid'), false);
  for (const chapter of [0, 2, 3, 4, 5]) {
    const other = createKitchen(chapter); at(other, 'puzzle');
    assert.equal(packBento(other, 'lid'), false); assert.equal(takePackedBento(other), false);
  }
});

test('memory dinner has no slots and any cooking order can be served to the photo table', () => {
  const k = createKitchen(3);
  assert.equal(stationsFor(k).some(s => s.type === 'slot'), false);
  assert.equal(THEMES[3].order, undefined);
  assert.equal(captureMemoryPhoto(k), false);
  assert.equal(keepMemoryPhoto(k), false);
  use(k, 'serve'); assert.equal(k.photo.meal, null);
  use(k, 'plates'); use(k, 'plating');
  for (const part of [...DISHES[3].parts].reverse()) { cookPart(k, part); use(k, 'plating'); }
  const dinner = k.plating;
  use(k, 'plating'); use(k, 'serve');
  assert.equal(k.photo.meal, dinner); assert.equal(k.holding, null);
  assert.equal(k.photo.openRequested, true); assert.equal(k.puzzle.solved, false);
  assert.equal(k.delivered, false); assert.equal(canServe(k), false);
  assert.match(nextTask(k), /相机/);
  k.photo.openRequested = false;
  use(k, 'puzzle'); assert.equal(k.photo.openRequested, true);
});

test('memory photo requires forgiving framing and focus, with retakes preserving the dinner', () => {
  const k = createKitchen(3);
  k.score = k.targetScore - ORDER_POINTS;
  k.holding = { type: 'plate', contents: DISHES[3].parts.map(p => ({ ...p, type: 'ingredient', cut: true })) };
  use(k, 'serve'); const meal = k.photo.meal;
  assert.equal(keepMemoryPhoto(k), false);
  captureMemoryPhoto(k);
  assert.equal(k.photo.capture.ready, false); assert.equal(keepMemoryPhoto(k), false);
  assert.equal(captureMemoryPhoto(k), false); assert.equal(k.photo.shots, 1);
  assert.equal(adjustMemoryCamera(k, { x: 0 }), false);
  retakeMemoryPhoto(k);
  assert.equal(k.photo.meal, meal);
  adjustMemoryCamera(k, { x: 100, y: -100, focus: NaN });
  assert.deepEqual([k.photo.x, k.photo.y, k.photo.focus], [30, -30, 20]);
  adjustMemoryCamera(k, { x: 0, y: 0, focus: 20 });
  captureMemoryPhoto(k);
  assert.equal(k.photo.capture.framed, true); assert.equal(k.photo.capture.focused, false);
  assert.equal(keepMemoryPhoto(k), false);
  retakeMemoryPhoto(k); adjustMemoryCamera(k, { x: 12, y: -12, focus: 40 }); captureMemoryPhoto(k);
  assert.equal(k.photo.capture.ready, true);
  const restored = structuredClone(k);
  assert.equal(keepMemoryPhoto(restored), true);
  assert.equal(restored.delivered, true); assert.equal(restored.deliveries, 1);
  assert.equal(keepMemoryPhoto(restored), false); assert.equal(retakeMemoryPhoto(restored), false);
  assert.equal(restored.photo.meal.contents.length, 3);
  assert.equal(k.delivered, false);
  assert.equal(keepMemoryPhoto(k), true); assert.equal(k.photo.shots, 3);
  assert.equal(memoryPhotoQuality({ x: 0, y: 0, focus: 70 }).ready, true);
  assert.equal(memoryPhotoQuality({ x: 13, y: 0, focus: 55 }).ready, false);
  assert.equal(memoryPhotoQuality({ x: NaN, y: 0, focus: 55 }).ready, false);
  assert.equal(memoryPhotoQuality(null).ready, false);
  for (const chapter of [0, 1, 2, 4, 5]) {
    const other = createKitchen(chapter);
    assert.equal(adjustMemoryCamera(other, { x: 0 }), false);
    assert.equal(captureMemoryPhoto(other), false); assert.equal(keepMemoryPhoto(other), false);
    assert.equal(retakeMemoryPhoto(other), false);
  }
});

test('a scored photo order preserves food already prepared for the next order', () => {
  const k = createKitchen(3);
  k.holding = { type: 'plate', contents: DISHES[3].parts.map(p => ({ ...p, type: 'ingredient', cut: true })) };
  use(k, 'serve');
  take(k, 'tomato');
  const nextIngredient = k.holding;
  adjustMemoryCamera(k, { x: 0, y: 0, focus: 55 });
  captureMemoryPhoto(k);
  assert.equal(keepMemoryPhoto(k), true);
  assert.equal(k.score, 100);
  assert.equal(k.delivered, false);
  assert.equal(k.holding, nextIngredient);
  assert.equal(k.photo.meal, null);
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
  interact(k, 'puzzle'); assert.equal(k.puzzle.openRequested, true); assert.match(k.message, /灯旁/);
  assert.equal(k.puzzle.solved, false); assert.equal(k.delivered, false);
});

test('tea and plated bread must be physically delivered to their matching places', () => {
  const k = createKitchen(4);
  k.score = k.targetScore - ORDER_POINTS;
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
    k.score = k.targetScore - ORDER_POINTS;
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
    if (chapter === 3) { assert.ok(k.photo.meal); assert.equal(k.puzzle.solved, false); }
    else assert.ok(k.holding);
  }
});

test('saved progress remains contiguous and ending requires all six dishes', () => {
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 1, 3, -1, 8, '2'], finished: true }), { completed: [0, 1], finished: false });
  assert.deepEqual(normalizeProgress(null), { completed: [], finished: false });
  assert.deepEqual(normalizeProgress({ completed: [0, 1, 2, 3, 4, 5], finished: true }), { completed: [0, 1, 2, 3, 4, 5], finished: true });
});

test('flower room unlocks only after six gifts and resumes a valid step', () => {
  const completed = [0, 1, 2, 3, 4, 5];
  const door = newFlowerRoom();
  assert.equal(normalizeProgress({ completed: [0, 1], flowerRoom: door }).flowerRoom, undefined);
  assert.deepEqual(normalizeProgress({ completed }).flowerRoom, door);
  assert.deepEqual(normalizeProgress({ completed, flowerRoom: { phase: 'reveal', flower: 'unknown' } }).flowerRoom, door);
  assert.equal(advanceFlowerRoom(door, 'flower-light'), door);
  let room = door;
  for (const action of ['flower-enter', 'flower-open', 'flower-place', 'flower-pick', 'flower-light', 'flower-finish']) {
    const next = advanceFlowerRoom(room, action, 'pink');
    assert.notEqual(next, room);
    assert.deepEqual(normalizeProgress({ completed, flowerRoom: next }).flowerRoom, next);
    room = next;
  }
  assert.deepEqual(room, { phase: 'done', flower: 'pink' });
  assert.deepEqual(normalizeProgress({ completed, finished: true, flowerRoom: room }).flowerRoom, room);
});

test('birthday config validates types and preserves missing defaults', () => {
  const fallback = { recipient: '主厨', sender: '助手', closing: '生日快乐', gifts: Array.from({ length: 6 }, () => ({ name: '礼物', riddle: '谜面', message: '留言' })) };
  const result = normalizeConfig({ recipient: 'A'.repeat(100), sender: 3, gifts: [{ name: '新的礼物', riddle: '' }] }, fallback);
  assert.equal(result.recipient.length, 40); assert.equal(result.sender, fallback.sender);
  assert.equal(result.gifts.length, 6); assert.equal(result.gifts[0].name, '新的礼物');
  assert.equal(result.gifts[0].riddle, '谜面'); assert.deepEqual(normalizeConfig([], fallback), fallback);
});
