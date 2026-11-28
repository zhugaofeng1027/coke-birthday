import { THEMES, STEAM_MESSAGE, SPICES } from './themes.js';

export const INGREDIENTS = {
  tomato: { name: '番茄', color: '#df796c', cut: true, pot: 7, oven: 8 },
  chicken: { name: '鸡肉', color: '#e8b49a', cut: true, pot: 9, oven: 9 },
  broccoli: { name: '西兰花', color: '#7ca081', cut: true, pot: 6, oven: 7 },
  beef: { name: '牛肉', color: '#c8807d', cut: true, pot: 10, oven: 9 },
  carrot: { name: '胡萝卜', color: '#e7a15b', cut: true, pot: 6, oven: 7 },
  bread: { name: '吐司', color: '#d9b789', cut: false, oven: 7 },
  strawberry: { name: '草莓', color: '#e18d93', cut: true, pot: 6, oven: 7 },
  mushroom: { name: '蘑菇', color: '#bea687', cut: true, pot: 7, oven: 7 },
  grape: { name: '葡萄', color: '#a591ba', cut: true, pot: 6 },
  kiwi: { name: '猕猴桃', color: '#a9bf75', cut: true, pot: 6 },
  rice: { name: '米饭', color: '#eee5cc', cut: false, pot: 8 },
  mint: { name: '食用薄荷', color: '#79ac97', cut: true, pot: 6 },
  jam: { name: '双果酱', color: '#bb658b', cut: false, pot: 6 },
};

export const DISHES = [
  { name: '双果酱烤吐司', subtitle: '两种水果，同锅熬煮。冒爱心的果酱才是答案。', parts: [{ id: 'jam', method: 'pot' }, { id: 'bread', method: 'oven' }], stock: ['strawberry', 'grape', 'bread', 'kiwi'] },
  { name: '出门前的爱心便当', subtitle: '米饭、烤鸡和西兰花，打包一份路上的惦记。', parts: [{ id: 'rice', method: 'pot' }, { id: 'chicken', method: 'oven' }, { id: 'broccoli', method: 'fresh' }], stock: ['rice', 'chicken', 'broccoli', 'carrot'] },
  { name: '深夜慢卤牛肉', subtitle: '让小锅，慢慢炖出幸福的味道。', parts: [{ id: 'beef', method: 'pot' }, { id: 'carrot', method: 'pot' }], stock: ['beef', 'carrot', 'mushroom', 'bread'] },
  { name: '照片里的双人餐', subtitle: '重做记忆里的晚餐，再为今天留一张照片。', parts: [{ id: 'tomato', method: 'pot' }, { id: 'bread', method: 'oven' }, { id: 'mushroom', method: 'fresh' }], stock: ['tomato', 'bread', 'mushroom', 'carrot'] },
  { name: '薄荷热茶与烤面包', subtitle: '等一壶茶的热气，留下一句喜欢。', parts: [{ id: 'mint', method: 'pot' }, { id: 'bread', method: 'oven' }], stock: ['mint', 'bread', 'mushroom', 'strawberry'] },
  { name: '生日主厨拼盘', subtitle: '前奏、主调、尾声，献给今晚最特别的你。', parts: [{ id: 'broccoli', method: 'pot' }, { id: 'beef', method: 'oven' }, { id: 'strawberry', method: 'fresh' }], stock: ['broccoli', 'beef', 'strawberry', 'mushroom'] },
];

const VARIANTS = [
  { name: '果酱吐司配猕猴桃', parts: [...DISHES[0].parts, { id: 'kiwi', method: 'fresh' }] },
  { name: '胡萝卜烤鸡便当', parts: [...DISHES[1].parts.slice(0, 2), { id: 'carrot', method: 'fresh' }] },
  { name: '蘑菇慢卤牛肉', parts: [DISHES[2].parts[0], { id: 'mushroom', method: 'pot' }] },
  { name: '番茄汤与胡萝卜小盘', parts: [...DISHES[3].parts.slice(0, 2), { id: 'carrot', method: 'fresh' }] },
  { name: '薄荷茶与草莓吐司', parts: [...DISHES[4].parts, { id: 'strawberry', method: 'fresh' }] },
  { name: '烤菌菇花园拼盘', parts: [DISHES[5].parts[0], { id: 'mushroom', method: 'oven' }, DISHES[5].parts[2]] },
];
export function orderRecipe(chapter, order) {
  return order?.variant ? VARIANTS[chapter] : DISHES[chapter];
}
export function finaleOrder(plate) {
  return plateMatches(plate, 5, 1) ? VARIANTS[5].parts.map(p => p.id) : THEMES[5].order;
}
export const APPLIANCES = [['pot', 'pot-2'], ['oven', 'oven-2']];
const PLATING_IDS = ['plating', 'plating-2'];

export const WORLD = { width: 840, height: 720 };
export const LANDSCAPE_WORLD = { width: 1260, height: 525 };
export const STATIONS = [
  ...Array.from({ length: 4 }, (_, i) => ({ id: `stock-${i}`, type: 'stock', x: 60 + i * 175, y: 132, w: 155, h: 104, approach: { x: 137 + i * 175, y: 279 } })),
  { id: 'board', type: 'board', name: '切配台', x: 217, y: 350, w: 128, h: 110, approach: { x: 281, y: 503 } },
  { id: 'pot', type: 'pot', name: '煮锅 1', x: 366, y: 350, w: 110, h: 110, approach: { x: 421, y: 503 } },
  { id: 'pot-2', type: 'pot', name: '煮锅 2', x: 486, y: 350, w: 110, h: 110, approach: { x: 541, y: 503 } },
  { id: 'oven', type: 'oven', name: '烤箱 1', x: 684, y: 337, w: 126, h: 117, approach: { x: 651, y: 399 } },
  { id: 'oven-2', type: 'oven', name: '烤箱 2', x: 684, y: 466, w: 126, h: 110, approach: { x: 644, y: 521 } },
  { id: 'plates', type: 'plates', name: '盘子架', x: 30, y: 337, w: 126, h: 123, approach: { x: 181, y: 399 } },
  { id: 'plating', type: 'plating', name: '装盘台 1', x: 193, y: 615, w: 125, h: 75, approach: { x: 255, y: 572 } },
  { id: 'plating-2', type: 'plating', name: '装盘台 2', x: 328, y: 615, w: 125, h: 75, approach: { x: 390, y: 572 } },
  { id: 'serve', type: 'serve', name: '出餐口', x: 474, y: 615, w: 145, h: 75, approach: { x: 546, y: 572 } },
  { id: 'trash', type: 'trash', name: '回收桶', x: 30, y: 576, w: 100, h: 105, approach: { x: 159, y: 620 } },
  { id: 'puzzle', type: 'puzzle', name: '特别工作台', x: 716, y: 581, w: 100, h: 100, approach: { x: 672, y: 625 } },
];
const MOONLIGHT_STATIONS = [
  ...STATIONS.map(s => s.id === 'puzzle'
    ? { ...s, x: 690, y: 600, w: 134, h: 86, approach: { x: 663, y: 635 } }
    : s.id === 'serve' ? { ...s, type: 'flowers', name: '花下餐位' } : s),
  { id: 'lamp', type: 'lamp', name: '灯旁茶位', x: 40, y: 483, w: 110, h: 72, approach: { x: 199, y: 520 } },
];
const BENTO_STATIONS = [...STATIONS.filter(s => s.id !== 'serve'),
  { id: 'serve', type: 'serve', name: '取餐口', x: 40, y: 483, w: 110, h: 72, approach: { x: 190, y: 530 } }];
const MEMORY_STATIONS = STATIONS.map(s => s.id === 'serve'
  ? { ...s, type: 'photo-table', name: '双人餐桌', x: 40, y: 483, w: 110, h: 72, approach: { x: 190, y: 530 } } : s);
const SPICE_STATIONS = [...STATIONS.filter(s => s.id !== 'serve'),
  { ...STATIONS.find(s => s.id === 'serve'), x: 40, y: 483, w: 110, h: 72, approach: { x: 190, y: 530 } },
  ...Object.keys(SPICES).map((spice, i) => ({
    id: `spice-${spice}`, type: 'spice', spice, name: SPICES[spice].name,
    x: 460 + i * 43, y: 615, w: 40, h: 75, approach: { x: 480 + i * 43, y: 580 },
  })),
].map(s => s.id === 'puzzle' ? { ...s, approach: { x: 678, y: 625 } } : s);
function chapterStations(k) {
  const chapter = typeof k === 'number' ? k : k.chapter;
  return chapter === 4 ? MOONLIGHT_STATIONS : chapter === 3 ? MEMORY_STATIONS : chapter === 1 ? BENTO_STATIONS : chapter === 2 ? SPICE_STATIONS : STATIONS;
}
const WIDE_POSITIONS = {
  'stock-0': [230, 66], 'stock-1': [420, 66], 'stock-2': [610, 66], 'stock-3': [800, 66],
  plates: [52, 210], board: [355, 235], pot: [558, 232], 'pot-2': [716, 232], oven: [915, 208], 'oven-2': [1110, 208],
  plating: [355, 403], 'plating-2': [530, 397], serve: [740, 401], trash: [63, 76], puzzle: [1090, 76],
  lamp: [232, 358],
};
const WIDE_APPROACHES = {
  plates: [208, 270], board: [326, 290], pot: [531, 288], 'pot-2': [771, 206], oven: [883, 270], 'oven-2': [1083, 267],
  plating: [417, 378], 'plating-2': [529, 371], serve: [854, 372], trash: [193, 128], puzzle: [1061, 126], lamp: [266, 329],
};
const WIDE_STATIONS = Array.from({ length: 6 }, (_, chapter) => chapterStations(chapter).map(s => {
  const spiceIndex = Object.keys(SPICES).indexOf(s.spice);
  const spicePlating = chapter === 2 && PLATING_IDS.includes(s.id);
  const [x, y] = s.type === 'spice' ? [245 + spiceIndex * 52, 405]
    : spicePlating ? [465 + PLATING_IDS.indexOf(s.id) * 140, 397] : WIDE_POSITIONS[s.id];
  const w = s.id === 'serve' ? 190 : s.w;
  const h = s.id === 'serve' ? 75 : s.id === 'puzzle' ? 86 : s.h;
  const [ax, ay] = s.type === 'spice' || spicePlating ? [x + w / 2, y - 26] : WIDE_APPROACHES[s.id] || [x + w / 2, y + h + 22];
  return { ...s, x, y, w, h, approach: { x: ax, y: ay } };
}));
const TOUCH_DEMO_STATIONS = WIDE_STATIONS[0].map(s => s.id === 'plates'
  ? { ...s, x: 180, approach: { x: 243, y: 361 } }
  : s);
export function stationsFor(k) {
  return k?.layout === 'landscape'
    ? k.touchControlsDemo && k.chapter === 0 ? TOUCH_DEMO_STATIONS : WIDE_STATIONS[k.chapter]
    : chapterStations(k);
}
export function worldFor(k) {
  return k.layout === 'landscape' ? LANDSCAPE_WORLD : WORLD;
}
export function setKitchenLayout(k, landscape) {
  const next = landscape ? 'landscape' : 'desktop';
  if ((k.layout || 'desktop') === next) return;
  const before = worldFor(k);
  const untouched = !k.layout && k.player.x === 420 && k.player.y === 548;
  const ratio = { x: k.player.x / before.width, y: k.player.y / before.height };
  k.layout = next;
  const world = worldFor(k);
  const target = untouched && landscape ? { x: 585, y: 408 } : { x: ratio.x * world.width, y: ratio.y * world.height };
  const minY = landscape ? 50 : 265;
  const candidates = [];
  for (let y = minY; y <= world.height - 43; y += 12) for (let x = 43; x <= world.width - 43; x += 12) {
    const point = { x, y };
    if (stationsFor(k).every(s => stationDistance(point, s) >= 23)) candidates.push(point);
  }
  candidates.sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y));
  k.player = candidates[0];
}
export const CHOP_SECONDS = 2.4;
export const REACH = 64;
export const PLAYER_SPEED = 235;
export const METHOD_NAMES = { pot: '煮熟', oven: '烤熟', fresh: '切好' };
export const STAGE_NAMES = { raw: '未处理', cut: '已切好', pot: '已煮熟', oven: '已烤好' };
export const ORDER_POINTS = 100;
export const ORDER_PENALTY = 30;
export const CHALLENGES = [240, 300, 330, 300, 240, 300].map((seconds, chapter) => ({
  seconds, target: 200,
  orderInterval: [40, 45, 50, 45, 40, 45][chapter],
  orderLifetime: [110, 130, 150, 130, 110, 130][chapter],
}));

function newOrder(chapter, id, createdAt) {
  return { id, variant: (id - 1) % 2, createdAt, expiresAt: createdAt + CHALLENGES[chapter].orderLifetime };
}
export function brothFor(k, id) { return id === 'pot-2' ? k.broth2 : k.broth; }

export function createKitchen(chapter = 0) {
  return {
    chapter, player: { x: 420, y: 548 }, holding: null,
    board: { item: null, progress: 0 },
    pot: emptyAppliance(), 'pot-2': emptyAppliance(), oven: emptyAppliance(), 'oven-2': emptyAppliance(),
    plating: null, 'plating-2': null, delivered: false, deliveries: 0,
    timeLeft: CHALLENGES[chapter].seconds, score: 0, targetScore: CHALLENGES[chapter].target, expired: false,
    orders: [newOrder(chapter, 1, 0)],
    nextOrderId: 2, nextOrderAt: CHALLENGES[chapter].orderInterval, missedOrders: 0,
    lastServedOrder: null, lastMissedOrderIds: [],
    puzzle: { solved: false, inspected: false, steam: 0, attempts: 0, openRequested: false },
    places: { lamp: null, flowers: null },
    spices: [], broth: [], broth2: [],
    photo: emptyPhoto(),
    packing: { meal: null, step: 0, openRequested: false },
    message: `欢迎来到${THEMES[chapter].name}，先到${THEMES[chapter].station}看看特别线索吧。`, messageKind: 'normal',
    stats: { cuts: 0, cooked: 0, baked: 0 }, elapsed: 0,
  };
}

export function stationDistance(player, station) {
  const dx = Math.max(station.x - player.x, 0, player.x - station.x - station.w);
  const dy = Math.max(station.y - player.y, 0, player.y - station.y - station.h);
  return Math.hypot(dx, dy);
}
export function nearestStation(kitchen) {
  return stationsFor(kitchen).map(station => ({ station, distance: stationDistance(kitchen.player, station) }))
    .filter(({ distance }) => distance <= REACH)
    .sort((a, b) => a.distance - b.distance)[0]?.station || null;
}
export function itemName(item) {
  if (!item) return '两手空空';
  if (item.type === 'spice') return SPICES[item.id].name;
  if (item.type === 'spicebag') return '配好的卤料袋';
  if (item.type === 'bento') return '封好的爱心便当';
  if (item.id === 'jam') return isHeartJam(item) ? '爱心双果酱' : item.method === 'pot' ? '待调整的果酱' : '锅里的水果';
  if (item.type === 'plate') return item.contents.length ? `餐盘 · ${item.contents.map(i => INGREDIENTS[i.id].name).join('、')}` : '空餐盘';
  return `${item.method === 'fresh' ? item.cut ? '切好的' : '' : item.method === 'pot' ? '煮好的' : '烤好的'}${INGREDIENTS[item.id].name}`;
}
export function ingredientMatches(item, part) {
  return item?.type === 'ingredient' && item.id === part.id && item.method === part.method
    && (!INGREDIENTS[item.id].cut || item.cut) && (item.id !== 'jam' || isHeartJam(item));
}
export function isHeartJam(item) {
  return item?.id === 'jam' && item.method === 'pot' && item.fruits?.length === 2
    && ['strawberry', 'grape'].every(id => item.fruits.includes(id));
}
export function plateMatches(plate, chapter, variant = 0) {
  const parts = orderRecipe(chapter, { variant }).parts;
  return plate?.type === 'plate' && plate.contents.length === parts.length
    && parts.every(part => plate.contents.filter(item => ingredientMatches(item, part)).length === 1)
    && (chapter !== 0 || plate.contents.find(item => item.id === 'bread')?.spread === true)
    && (chapter !== 2 || plate.contents.find(item => item.id === 'beef')?.braised === true);
}
function validMeal(plate, chapter) {
  return plateMatches(plate, chapter) || plateMatches(plate, chapter, 1);
}
function mealOrder(k, plate) {
  return k.orders.find(order => plateMatches(plate, k.chapter, order.variant));
}
export function plateProgress(k, order = k.orders[0]) {
  const parts = orderRecipe(k.chapter, order).parts;
  if (k.chapter === 4 && order) return parts.map(part => part.id === 'mint' ? !!k.places.lamp
    : !!k.places.flowers?.contents.some(item => ingredientMatches(item, part)));
  const plates = [k.holding, ...PLATING_IDS.map(id => k[id]), k.packing.meal, k.photo.meal]
    .filter(plate => plate?.contents?.every(item => parts.some(part => ingredientMatches(item, part))));
  const progress = plates.map(plate => parts.map(part => plate.contents.some(item => ingredientMatches(item, part))));
  return progress.sort((a, b) => b.filter(Boolean).length - a.filter(Boolean).length)[0] || parts.map(() => false);
}
export function canServe(k) {
  if (k.delivered || k.expired || !k.orders.length) return false;
  if (k.chapter === 3) return false;
  if (k.chapter === 1) return k.holding?.type === 'bento' && k.holding.packed === true
    && !!mealOrder(k, { ...k.holding, type: 'plate' });
  if (!mealOrder(k, k.holding) || (k.chapter === 2 && !k.puzzle.solved)) return false;
  const order = k.chapter === 5 ? finaleOrder(k.holding) : null;
  if (order && (!k.holding.arranged || k.holding.contents.some((item, i) => item.id !== order[i]))) return false;
  return true;
}

export const PACKING_STEPS = [
  { id: 'lid', label: '盖上盒盖', done: '盒盖盖好啦，热乎乎的饭菜装好了。', icon: 'square' },
  { id: 'band', label: '套好绑带', done: '绑带套好啦，路上也不会散开。', icon: 'logs' },
  { id: 'seal', label: '贴爱心封签', done: '封好这份惦记，带给出门的你。', icon: 'heart' },
];
function atPackingTable(k) {
  return k.chapter === 1 && !k.delivered && !k.expired
    && stationDistance(k.player, stationsFor(k).find(s => s.id === 'puzzle')) <= REACH;
}
export function packBento(k, step) {
  if (!atPackingTable(k) || !validMeal(k.packing.meal, 1) || k.holding) return false;
  if (PACKING_STEPS[k.packing.step]?.id !== step) return say(k, '先把前一步做好，便当会在这里等你。', 'gentle');
  say(k, PACKING_STEPS[k.packing.step].done, 'success');
  k.packing.step++;
  if (k.packing.step === PACKING_STEPS.length) k.puzzle.solved = true;
  return true;
}
export function takePackedBento(k) {
  if (!atPackingTable(k) || !validMeal(k.packing.meal, 1) || k.packing.step !== 3 || k.holding) return false;
  k.holding = { type: 'bento', contents: k.packing.meal.contents, packed: true };
  k.packing.meal = null;
  say(k, '便当拿好啦，送到取餐口，把这份心意交给你。', 'success');
  return true;
}

export function adjustMemoryCamera(k, settings) {
  if (k.chapter !== 3 || !k.photo.meal || k.delivered || k.expired || k.photo.capture) return false;
  for (const [key, min, max] of [['x', -30, 30], ['y', -30, 30], ['focus', 0, 100]]) {
    if (Number.isFinite(settings[key])) k.photo[key] = Math.max(min, Math.min(max, settings[key]));
  }
  return true;
}
export function memoryPhotoQuality(settings) {
  const framed = Number.isFinite(settings?.x) && Number.isFinite(settings?.y) && Math.abs(settings.x) <= 12 && Math.abs(settings.y) <= 12;
  const focused = Number.isFinite(settings?.focus) && settings.focus >= 40 && settings.focus <= 70;
  return { framed, focused, ready: framed && focused };
}
export function captureMemoryPhoto(k) {
  if (k.chapter !== 3 || !validMeal(k.photo.meal, 3) || k.delivered || k.expired || k.photo.capture) return false;
  const { x, y, focus } = k.photo;
  k.photo.capture = { x, y, focus, carrot: k.photo.meal.contents.some(item => item.id === 'carrot'), ...memoryPhotoQuality(k.photo) };
  k.photo.shots++;
  return true;
}
export function retakeMemoryPhoto(k) {
  if (k.chapter !== 3 || !k.photo.meal || k.delivered || k.expired) return false;
  k.photo.capture = null;
  return true;
}
export function keepMemoryPhoto(k) {
  if (k.chapter !== 3 || !validMeal(k.photo.meal, 3) || !k.photo.capture?.ready || k.delivered || k.expired) return false;
  const order = mealOrder(k, k.photo.meal);
  if (!order) {
    if (!k.holding) {
      k.holding = k.photo.meal;
      k.photo = emptyPhoto();
    }
    return say(k, !k.photo.meal
      ? '没有对应的订单了。晚餐还给你，换一盘再拍。'
      : '没有对应的订单了。先放下手中的东西，再来端走这盘晚餐。', 'gentle');
  }
  k.puzzle.solved = true;
  completeOrder(k, 'serve', order);
  return true;
}

export function solveKitchenPuzzle(k, answer) {
  if (k.chapter !== 5) return say(k, '这间厨房的答案，藏在亲手完成的料理里。', 'gentle');
  const s = stationsFor(k).find(s => s.id === 'puzzle');
  if (k.delivered || k.expired || stationDistance(k.player, s) > REACH) return say(k, '带着料理到花园餐序工作台来吧。', 'gentle');
  const theme = THEMES[k.chapter];
  k.puzzle.attempts++;
  if (theme.order) {
    if (!validMeal(k.holding, k.chapter)) return say(k, '先把订单里的料理做好、装进餐盘，再端到这里来。', 'gentle');
    const sequence = finaleOrder(k.holding);
    if (!Array.isArray(answer?.order) || answer.order.join(',') !== sequence.join(',')) return say(k, '和线索还差一点，再看看图案和先后顺序。', 'gentle');
    k.holding.contents = sequence.map(id => k.holding.contents.find(item => item.id === id));
    k.holding.arranged = true;
  } else if (theme.answer) {
    if (!Array.isArray(answer) || answer.length !== theme.answer.length
      || new Set(answer).size !== answer.length || !theme.answer.every(id => answer.includes(id))) return say(k, '再对照一下线索吧，不合适的那一项可以先放回去。', 'gentle');
  } else return false;
  k.puzzle.solved = true;
  say(k, theme.success, 'success');
  return true;
}
function say(k, message, kind = 'normal') { k.message = message; k.messageKind = kind; return false; }
function emptyAppliance() { return { item: null, elapsed: 0, duration: 0, ready: false }; }
function emptyPhoto() { return { meal: null, x: 20, y: -16, focus: 20, shots: 0, capture: null, openRequested: false }; }
function completeOrder(k, stationId, order) {
  if (k.delivered || k.expired || !order) return;
  k.orders.splice(k.orders.indexOf(order), 1);
  k.lastServedOrder = { id: order.id, stationId, variant: order.variant };
  k.deliveries++;
  k.score += ORDER_POINTS;
  k.delivered = k.score >= k.targetScore;
  if (!k.delivered) {
    // Prepared food and discovered clues stay; only the served order is cleared.
    k.puzzle.solved = k.chapter === 2 && (correctSpices(k.broth) || correctSpices(k.broth2));
    k.places = { lamp: null, flowers: null };
    k.packing = { meal: null, step: 0, openRequested: false };
    k.photo = emptyPhoto();
  }
  say(k, `出餐成功 +${ORDER_POINTS} 分！${k.score} / ${k.targetScore} 分${k.delivered ? '，挑战达标，生日便笺已送达。' : k.orders.length ? `，还有 ${k.orders.length} 单在等候。` : '，下一张订单正在路上。'}`, 'success');
}
function advanceOrders(k) {
  const challenge = CHALLENGES[k.chapter];
  // Absolute arrival/deadline times keep long frames and many short frames equivalent.
  while (k.nextOrderAt <= k.elapsed && k.nextOrderAt < challenge.seconds) {
    k.orders.push(newOrder(k.chapter, k.nextOrderId++, k.nextOrderAt));
    k.nextOrderAt += challenge.orderInterval;
  }
  const expired = k.orders.filter(order => order.expiresAt <= k.elapsed);
  if (!expired.length) return 0;
  k.orders = k.orders.filter(order => order.expiresAt > k.elapsed);
  k.lastMissedOrderIds = expired.map(order => order.id);
  k.missedOrders += expired.length;
  k.score -= expired.length * ORDER_PENALTY;
  return expired.length;
}
function addToPlate(k, plate, item) {
  if (k.chapter === 0 && item.id === 'jam' && !isHeartJam(item)) {
    return say(k, APPLIANCES[0].some(id => k[id].item === item)
      ? '果酱没有冒爱心。可以留在锅里换一种水果，吐司会为你留着。'
      : '果酱没有冒爱心。先单独回收这份果酱再试试，吐司会为你留着。', 'gentle');
  }
  if (plate.contents.some(part => part.id === item.id)) return say(k, '这一份已经放好啦，不用重复添加。', 'gentle');
  if (plate.contents.length >= 3) return say(k, '餐盘已经满啦，先去出餐口或回收桶整理一下。', 'gentle');
  const fits = [DISHES[k.chapter], VARIANTS[k.chapter]].some(({ parts }) =>
    [...plate.contents, item].every(food => parts.some(part => ingredientMatches(food, part))));
  if (!fits) return say(k, '这份料理不适合这盘，先留着，看看另一张订单吧。', 'gentle');
  plate.contents.push(item);
  if (k.chapter === 0 && plate.contents.some(isHeartJam) && plate.contents.some(i => i.id === 'bread' && i.method === 'oven')) {
    plate.contents.find(i => i.id === 'bread').spread = true;
    k.puzzle.solved = true;
    say(k, THEMES[0].success, 'success');
  }
  return true;
}

export function actionLabel(k, station = nearestStation(k)) {
  if (k.expired) return '时间到';
  if (k.delivered) return '已出餐';
  if (!station) return '靠近工作台';
  const h = k.holding;
  if (station.type === 'photo-table') return k.photo.meal ? '为晚餐拍照' : '把晚餐端上桌';
  if (station.type === 'lamp') return k.places.lamp ? '热茶已就位' : '把热茶留在灯旁';
  if (station.type === 'flowers') return k.places.flowers ? '查看花下小盘' : '把吐司放在花下';
  if (station.type === 'puzzle' && k.chapter === 4) return k.puzzle.steam >= 2 ? '读玻璃上的字' : '端热茶靠近玻璃';
  if (station.type === 'puzzle' && k.chapter === 1) return k.packing.meal ? '继续打包便当' : h?.type === 'bento' ? '便当已封好' : '打包便当';
  if (station.type === 'puzzle' && k.chapter === 2) return h?.type === 'spice' ? '放进卤料袋' : correctSpices(k.spices) ? '拿起卤料袋' : k.spices.length ? '取回最后一味' : '查看卤料方';
  if (station.type === 'spice') return h?.type === 'spice' && h.id === station.spice ? '放回香料罐' : h ? '先放下手中物品' : `取${station.name}`;
  if (station.type === 'puzzle' && k.chapter === 3) return k.photo.meal ? '拿起相机' : '对照回忆相片';
  if (station.type === 'puzzle') return THEMES[k.chapter].kind === 'finale' ? '按餐序摆盘' : '查看特别线索';
  if (station.type === 'stock') return h ? '手里已有食材' : `取${INGREDIENTS[DISHES[k.chapter].stock[Number(station.id.split('-')[1])]].name}`;
  if (station.type === 'board') return h ? '放上切配台' : k.board.item ? k.board.item.cut ? '拿起食材' : '等待切配' : '切配台空着';
  if (station.type === 'pot' || station.type === 'oven') {
    if (station.type === 'pot' && h?.type === 'spicebag') return '卤料袋下锅';
    const job = k[station.id];
    if (job.waiting) return h?.cut ? '加入第二种水果' : '还缺一种切好的水果';
    if (k.chapter === 0 && station.type === 'pot' && job.ready && !isHeartJam(job.item) && h?.method === 'fresh') return '替换不合适的水果';
    if (k.chapter === 0 && job.ready && isHeartJam(job.item) && h?.type === 'plate') return '抹果酱';
    return job.item ? job.ready ? h?.type === 'plate' ? '盛入餐盘' : h ? '先放下食材' : '取出料理' : '正在烹饪' : h?.type === 'ingredient' ? station.type === 'pot' ? '放入煮锅' : '放入烤箱' : '还没有食材';
  }
  if (station.type === 'plates') return h?.type === 'plate' ? '放回空盘' : h ? '先放下食材' : '拿一个盘子';
  if (station.type === 'plating' && k.chapter === 0 && (h?.id === 'jam' || h?.id === 'bread') && k[station.id]?.contents.some(i => i.id === (h.id === 'jam' ? 'bread' : 'jam'))) return '抹果酱到吐司上';
  if (station.type === 'plating') return h?.type === 'bento' ? '放下便当' : h?.type === 'plate' ? '放下餐盘' : h ? '装入餐盘' : k[station.id] ? '端起餐盘' : '先放一个盘子';
  if (station.type === 'serve') return k.chapter === 1 ? h?.type === 'bento' ? '把便当交给你' : '带上封好的便当' : h?.type === 'plate' ? '上菜啦' : '端着餐盘来';
  if (station.type === 'trash') return h ? '放入回收桶' : '两手空空';
  return '操作';
}
export function canChop(k) {
  return !k.delivered && !k.expired && !k.holding && !!k.board.item && !k.board.item.cut
    && INGREDIENTS[k.board.item.id].cut && stationDistance(k.player, stationsFor(k).find(s => s.id === 'board')) <= REACH;
}

export function kitchenClue(k) {
  return k.chapter === 4 && k.puzzle.steam >= 2 ? STEAM_MESSAGE : THEMES[k.chapter].clue;
}

export function interact(k, stationId = nearestStation(k)?.id) {
  if (k.expired) return say(k, '营业时间到啦，再挑战一次吧。', 'gentle');
  if (k.delivered) return say(k, '这份心意已经送达啦，去看看生日便笺吧。');
  const station = stationsFor(k).find(s => s.id === stationId);
  if (!station || stationDistance(k.player, station) > REACH) return say(k, '再走近一点，我帮你留着这个位置。', 'gentle');
  const h = k.holding;
  if (station.type === 'photo-table') {
    if (k.photo.meal) {
      k.photo.openRequested = true;
      return say(k, '晚餐还热着，相机也为你留在这里。');
    }
    if (!validMeal(h, 3)) return say(k, '餐桌在等一整盘晚餐，请对照订单准备食材。', 'gentle');
    if (!mealOrder(k, h)) return say(k, '这份晚餐暂时没有对应订单，先留着吧。', 'gentle');
    k.photo.meal = h; k.holding = null; k.photo.openRequested = true;
    return say(k, '双人晚餐上桌啦，为今天留一张照片吧。', 'success');
  }
  if (station.type === 'spice') {
    if (h?.type === 'spice' && h.id === station.spice) { k.holding = null; return say(k, '香料放回罐子啦。'); }
    if (h) return say(k, '先把手里的东西放好，再取一味香料。', 'gentle');
    k.holding = { type: 'spice', id: station.spice };
    return say(k, `拿到${station.name}，可以送进卤料袋，也可以放回原罐。`);
  }
  if (station.type === 'puzzle') {
    k.puzzle.inspected = true;
    k.puzzle.openRequested = false;
    if (k.chapter === 3 && k.photo.meal) {
      k.photo.openRequested = true;
      return say(k, '晚餐还热着，相机也为你留在这里。');
    }
    if (k.chapter === 1) {
      if (h?.type === 'bento') return say(k, '便当封好啦，直接送到取餐口吧。', 'success');
      if (k.packing.meal) {
        if (h) return say(k, '先放下手里的东西，打包台上的便当替你留着。', 'gentle');
        k.packing.openRequested = true;
        return say(k, '便当还在，接着把这份心意包好吧。');
      }
      if (!validMeal(h, 1)) {
        k.puzzle.openRequested = true;
        return say(k, kitchenClue(k), 'gentle');
      }
      k.packing.meal = h; k.packing.step = 0; k.holding = null; k.packing.openRequested = true;
      return say(k, '饭菜装进便当盒啦，还差盒盖、绑带和一枚爱心封签。', 'success');
    }
    if (k.chapter === 2) {
      if (h?.type === 'spice') {
        if (k.spices.length >= 3) return say(k, '袋子装满三味啦，空手来取回最后一味，再换一种。', 'gentle');
        k.spices.push(h.id); k.holding = null;
        return say(k, `袋里有：${k.spices.map(id => SPICES[id].name).join('、')}。${correctSpices(k.spices) ? '香气温和，空手再拿一次就能带去下锅。' : k.spices.length === 3 ? '气味不太对，空手取回最后一味试试。' : '再找找配方上的下一味。'}`);
      }
      if (!h && k.spices.length) {
        if (correctSpices(k.spices)) {
          k.holding = { type: 'spicebag', spices: [...k.spices] }; k.spices = [];
          return say(k, '卤料袋配好啦，把它亲手放进煮锅，再下切好的牛肉。', 'success');
        }
        k.holding = { type: 'spice', id: k.spices.pop() };
        return say(k, '取回最后一味啦，可以放回原罐，其他香料留在袋里。');
      }
      if (h?.type === 'spicebag') return say(k, '卤料袋已经在手里啦，选一口还没有卤汤的锅吧。');
    }
    k.puzzle.openRequested = true;
    return say(k, kitchenClue(k));
  }
  if (station.type === 'lamp' || station.type === 'flowers') {
    if (!k.orders.length) return say(k, '订单还没到，先把料理留在手里吧。', 'gentle');
    if (k.puzzle.steam < 2) return say(k, '先端着热茶到雾气玻璃前，看看雾气里藏着什么。', 'gentle');
    const place = station.type;
    const tea = DISHES[4].parts[0];
    const teaIndex = h?.type === 'plate' ? h.contents.findIndex(i => ingredientMatches(i, tea)) : -1;
    const dessert = h?.type === 'plate' ? h.contents.filter(i => !ingredientMatches(i, tea)) : [];
    const dessertOrder = items => k.orders.find(order => {
      const parts = orderRecipe(4, order).parts.slice(1);
      return parts.length === items.length && parts.every(part => items.some(item => ingredientMatches(item, part)));
    });
    if (k.places[place]) {
      if (place === 'flowers' && !h) {
        const order = dessertOrder(k.places.flowers.contents);
        if (order && k.places.lamp) { k.puzzle.solved = true; completeOrder(k, station.id, order); return; }
        k.holding = k.places.flowers;
        k.places.flowers = null;
        return say(k, '把花下的小盘端回来啦。');
      }
      return say(k, '这里的心意已经放好啦。', 'success');
    }
    const order = dessertOrder(place === 'lamp' ? k.places.flowers?.contents || [] : dessert);
    if (place === 'lamp' ? teaIndex < 0 && !ingredientMatches(h, tea) : !order) {
      return say(k, place === 'lamp' ? '灯旁在等一杯薄荷热茶，手里的料理替你留着。' : '花下在等订单里的吐司小盘。对照订单装好，再端过来吧。', 'gentle');
    }
    const fromPlate = h?.type === 'plate';
    if (fromPlate) {
      k.places[place] = place === 'lamp' ? h.contents.splice(teaIndex, 1)[0] : { type: 'plate', contents: dessert };
      if (place === 'flowers') h.contents = teaIndex < 0 ? [] : [h.contents[teaIndex]];
      if (!h.contents.length) k.holding = null;
    } else { k.places[place] = h; k.holding = null; }
    if (k.places.lamp && k.places.flowers) {
      if (order) { k.puzzle.solved = true; completeOrder(k, station.id, order); return; }
      return say(k, '原来的吐司订单已经超时。到花下端回小盘，热茶还替你留着。', 'gentle');
    }
    return say(k, place === 'lamp' ? '热茶留在灯旁啦，还差花下的一盘烤面包。' : '面包放在花下啦，还差灯旁的一杯热茶。', 'success');
  }
  if (station.type === 'stock') {
    if (h) return say(k, '一次拿一样就好，先把手里的东西安顿好。', 'gentle');
    const id = DISHES[k.chapter].stock[Number(station.id.split('-')[1])];
    k.holding = { type: 'ingredient', id, cut: false, method: 'fresh' };
    return say(k, `拿到${INGREDIENTS[id].name}啦。${INGREDIENTS[id].cut ? '切配台已经准备好了。' : id === 'rice' ? '可以直接送进煮锅。' : '可以直接送进烤箱。'}`);
  }
  if (station.type === 'board') {
    if (h?.type === 'ingredient' && !k.board.item) {
      k.board.item = h; k.holding = null; k.board.progress = h.cut ? CHOP_SECONDS : 0;
      return say(k, h.cut || !INGREDIENTS[h.id].cut ? '这份食材不用再切啦，可以直接拿走。' : `${INGREDIENTS[h.id].name}放好啦，该切配了。`);
    }
    if (!h && k.board.item) {
      if (!k.board.item.cut && INGREDIENTS[k.board.item.id].cut) return say(k, '还没切好，主厨的刀工时间到。');
      k.holding = k.board.item; k.board.item = null; k.board.progress = 0;
      return say(k, `拿起${itemName(k.holding)}。`);
    }
    return say(k, k.board.item ? '切配台上还有食材，先把它拿走吧。' : '先从食材柜取一份食材。', 'gentle');
  }
  if (station.type === 'pot' || station.type === 'oven') {
    const id = station.id; const method = station.type; const job = k[id];
    if (k.chapter === 2 && method === 'pot' && h?.type === 'spicebag') {
      if (!correctSpices(h.spices)) return say(k, '这份卤料不对，先按配方重新配一袋。', 'gentle');
      if (correctSpices(brothFor(k, id))) return say(k, '这口锅已经有卤汤了，把卤料袋放进另一口锅吧。', 'gentle');
      k[id === 'pot-2' ? 'broth2' : 'broth'] = [...h.spices]; k.holding = null; k.puzzle.solved = true;
      return say(k, '卤料袋下锅，清汤变成了卤汤！现在放入切好的牛肉和胡萝卜。', 'success');
    }
    if (k.chapter === 0 && method === 'pot') return interactJamPot(k, id);
    if (job.item) {
      if (!job.ready) return say(k, `${method === 'pot' ? '锅里正在咕嘟咕嘟' : '烤箱正在认真工作'}，还要 ${Math.ceil(job.duration - job.elapsed)} 秒。`);
      if (h?.type === 'plate') {
        if (!addToPlate(k, h, job.item)) return false;
        k[id] = emptyAppliance(); return say(k, '热乎乎的料理，已经盛进餐盘啦。');
      }
      if (h) return say(k, '先腾出双手，或端一个餐盘来。', 'gentle');
      k.holding = job.item; k[id] = emptyAppliance();
      return say(k, `取出${itemName(k.holding)}，可以去装盘啦。`);
    }
    if (h?.type !== 'ingredient') return say(k, '这里还空着，先送一份处理好的食材来。');
    if (h.method !== 'fresh') return say(k, '这份料理已经熟啦，不用再烹饪一次。', 'gentle');
    if (INGREDIENTS[h.id].cut && !h.cut) return say(k, `${INGREDIENTS[h.id].name}还没切配，先去切配台吧。`, 'gentle');
    const duration = INGREDIENTS[h.id][method];
    if (!duration) return say(k, '这份食材不适合这个做法，换一种试试吧。', 'gentle');
    if (k.chapter === 2 && method === 'pot' && !correctSpices(brothFor(k, id))) return say(k, '这口锅还没有卤料。配好卤料袋放进来，或用另一口锅。', 'gentle');
    if (k.chapter === 2 && method === 'pot') h.braised = true;
    k[id] = { item: h, duration, elapsed: 0, ready: false }; k.holding = null;
    return say(k, `${method === 'pot' ? '小火已开' : '烤箱已启动'}。等它熟的时候，可以去准备别的食材。`);
  }
  if (station.type === 'plates') {
    if (!h) { k.holding = { type: 'plate', contents: [] }; return say(k, '拿好餐盘啦，可以先放到装盘台。'); }
    if (h.type === 'plate' && !h.contents.length) { k.holding = null; return say(k, '空盘放回去啦。'); }
    return say(k, '先放好手里的东西，再来拿盘子吧。', 'gentle');
  }
  if (station.type === 'plating') {
    const id = station.id; const plate = k[id];
    if (['plate', 'bento'].includes(h?.type) && !plate) { k[id] = h; k.holding = null; return say(k, h.type === 'bento' ? '封好的便当先留在这里。' : '餐盘摆好啦，等你把料理一份份送来。'); }
    if (h?.type === 'ingredient' && plate?.type === 'plate') {
      if (h.method === 'fresh' && INGREDIENTS[h.id].cut && !h.cut) return say(k, '这份食材还没切好，先去切配台吧。', 'gentle');
      if (!addToPlate(k, plate, h)) return false;
      k.holding = null; return say(k, validMeal(plate, k.chapter) ? k.chapter === 0 ? THEMES[0].success : k.chapter === 1 ? '饭菜齐啦，端到便当打包台，装进便当盒吧。' : k.chapter === 3 ? '晚餐齐啦，端到双人餐桌，为它拍张照吧。' : '配菜齐啦，端起餐盘去出餐口吧！' : '装好一份啦，再看看订单还需要什么。', 'success');
    }
    if (!h && plate) { k.holding = plate; k[id] = null; return say(k, k.chapter === 1 ? '餐盘端稳啦，带到便当打包台。' : k.chapter === 3 ? '餐盘端稳啦，送到双人餐桌吧。' : '餐盘端稳啦，送到出餐口吧。'); }
    return say(k, h?.type === 'plate' ? '这里已经有餐盘啦，先端走原来的那一盘。' : '先从盘子架拿一个空盘，放在装盘台。', 'gentle');
  }
  if (station.type === 'serve') {
    if (!k.orders.length) return say(k, '订单还没到，做好的一份可以先留着。', 'gentle');
    if (k.chapter === 1) {
      if (!canServe(k)) return say(k, h?.packed ? '没有对应这份便当的订单，可以先把它放到空装盘台上。' : '先把饭菜端到便当打包台，盖盖、套绑带、贴封签，再把便当带来。', 'gentle');
      const order = mealOrder(k, { ...h, type: 'plate' });
      k.holding = null;
      completeOrder(k, station.id, order);
      return;
    }
    const order = mealOrder(k, h);
    if (!order) return say(k, h?.type === 'plate' ? '这盘没有匹配的订单，检查一下食材和烹饪方式吧。' : '上菜时，要把料理装在餐盘里哦。', 'gentle');
    if (!canServe(k)) return say(k, `料理齐了，再到${THEMES[k.chapter].station}完成这间厨房的特别心意吧。`, 'gentle');
    k.holding = null;
    completeOrder(k, station.id, order);
    return;
  }
  if (station.type === 'trash') {
    if (h?.type === 'bento') return say(k, '这份便当已经好好封好啦，取餐口有人在等它。', 'gentle');
    if (!h) return say(k, '没有要回收的东西，厨房还是很整洁。');
    k.holding = null; return say(k, '收拾好啦，再试一次也没关系。');
  }
  return false;
}
function correctSpices(spices) {
  return spices?.length === 3 && THEMES[2].answer.every(id => spices.includes(id));
}

function interactJamPot(k, id) {
  const job = k[id]; const h = k.holding;
  const fruit = h?.type === 'ingredient' && ['strawberry', 'grape', 'kiwi'].includes(h.id) && h.method === 'fresh';
  if (fruit && !h.cut) return say(k, '水果要先切好，才能一起熬成果酱。', 'gentle');
  if (fruit && (!job.item || job.waiting || job.ready && !isHeartJam(job.item))) {
    let fruits = [...(job.item?.fruits || [])];
    if (fruits.length === 2) {
      const wrong = fruits.findIndex((id, i) => !['strawberry', 'grape'].includes(id) || fruits.indexOf(id) !== i);
      fruits.splice(wrong, 1);
    }
    fruits.push(h.id);
    k[id] = { item: { type: 'ingredient', id: 'jam', method: 'fresh', cut: true, fruits }, duration: 6, elapsed: 0, ready: false, waiting: fruits.length < 2 };
    k.holding = null;
    return say(k, fruits.length < 2 ? '第一种水果进锅啦，还要另一种切好的水果一起熬。' : '两种水果同锅啦。等一等，看看会不会冒出爱心。');
  }
  if (job.waiting) return say(k, '锅里还缺一种切好的水果，先读读果园订单。');
  if (!job.item) return say(k, '把两种切好的水果送进同一口锅，熬一份双果酱。');
  if (!job.ready) return say(k, `果酱正在咕嘟咕嘟，还要 ${Math.ceil(job.duration - job.elapsed)} 秒。`);
  if (h?.type === 'plate') {
    if (!addToPlate(k, h, job.item)) return false;
  } else if (!h) k.holding = job.item;
  else return say(k, '先腾出双手。配错的果酱也可以留在锅里，换入一种切好的水果。', 'gentle');
  k[id] = emptyAppliance();
  if (k.puzzle.solved) return say(k, THEMES[0].success, 'success');
  return say(k, isHeartJam(job.item) ? '爱心果酱熬好啦，把它和烤吐司一起送到餐盘。' : '这锅没有冒爱心。单独回收果酱再试试，其他料理会留着。');
}

export function stepKitchen(k, seconds, chopping = false) {
  if (k.delivered || k.expired || !Number.isFinite(seconds) || seconds <= 0) return;
  const activeSeconds = Math.min(seconds, k.timeLeft);
  k.elapsed += activeSeconds;
  k.timeLeft = Math.max(0, k.timeLeft - activeSeconds);
  const missed = advanceOrders(k);
  if (k.timeLeft === 0) {
    k.expired = true;
    say(k, `时间到！获得 ${k.score} 分，通关需要 ${k.targetScore} 分。再试一次吧。`, 'gentle');
    return;
  }
  const hasHotTea = item => item?.id === 'mint' && item.method === 'pot'
    || item?.type === 'plate' && item.contents.some(part => part.id === 'mint' && part.method === 'pot');
  if (k.chapter === 4 && k.puzzle.steam < 2) {
    const window = stationsFor(k).find(s => s.id === 'puzzle');
    if (hasHotTea(k.holding) && stationDistance(k.player, window) <= REACH) {
      k.puzzle.steam = Math.min(2, k.puzzle.steam + seconds);
      if (k.puzzle.steam >= 2) say(k, `玻璃显字了：${STEAM_MESSAGE}`, 'success');
    } else k.puzzle.steam = 0;
  }
  if (chopping && canChop(k)) {
    k.board.progress = Math.min(CHOP_SECONDS, k.board.progress + seconds);
    if (k.board.progress >= CHOP_SECONDS) {
      k.board.item.cut = true; k.stats.cuts++;
      say(k, `${INGREDIENTS[k.board.item.id].name}切好啦，拿起来继续料理吧。`, 'success');
    }
  }
  for (const [method, second] of APPLIANCES) for (const id of [method, second]) {
    const job = k[id];
    if (!job.item || job.ready || job.waiting) continue;
    job.elapsed = Math.min(job.duration, job.elapsed + seconds);
    if (job.elapsed >= job.duration) {
      job.ready = true; job.item.method = method;
      k.stats[method === 'pot' ? 'cooked' : 'baked']++;
      say(k, job.item.id === 'jam' ? isHeartJam(job.item) ? '锅里冒出爱心！把果酱抹上烤吐司吧。' : '果酱的颜色不太对，也没有爱心。留在锅里换一种水果试试吧。' : `${method === 'pot' ? '锅里的料理煮好' : '烤箱里的料理烤好'}啦，随时可以取走。`, job.item.id === 'jam' && !isHeartJam(job.item) ? 'gentle' : 'success');
    }
  }
  if (missed) say(k, `${missed} 张订单超时，扣除 ${missed * ORDER_PENALTY} 分。当前 ${k.score} / ${k.targetScore} 分，料理还在，继续加油！`, 'gentle');
}

export function nextTask(k) {
  if (k.expired) return '时间到啦，重新挑战这一关，已解锁的礼物会保留。';
  if (k.delivered) return '完美出餐，打开你的生日便笺。';
  if (k.chapter === 3) {
    if (k.photo.meal) return '回到双人餐桌拿起相机，让两套餐具一起入镜，对焦后留下照片。不满意可以重拍。';
    if (validMeal(k.holding, 3)) return '把对应订单的晚餐端到双人餐桌，再为今天拍一张照片。';
  }
  if (k.holding?.type === 'spice') return '把这味香料放进卤料袋，或送回对应的罐子。';
  if (k.holding?.type === 'spicebag') return '把卤料袋放进还没有卤汤的煮锅，让清汤变成卤汤。';
  if (k.chapter === 1) {
    if (k.holding?.type === 'bento') return '把封好的便当送到取餐口，交给出门的你。';
    if (k.packing.meal) return k.packing.step === 3 ? '回便当打包台拿上便当，再送到取餐口。' : `回便当打包台，${PACKING_STEPS[k.packing.step].label}。`;
    if (validMeal(k.holding, 1)) return '把这盘饭菜端到便当打包台，准备盒盖、绑带和封签。';
  }
  if (!k.puzzle.inspected && !k.puzzle.solved && k.chapter === 0) return '去果园订单台，看看红心和紫色圆球的线索。';
  if (k.chapter === 0 && APPLIANCES[0].some(id => k[id].waiting)) return '把另一种水果切好，加入同一口煮锅；红心和紫色圆球是线索。';
  if (k.chapter === 0 && APPLIANCES[0].some(id => k[id].ready && !isHeartJam(k[id].item))) return '果酱没冒爱心：切好正确的水果，回到锅边替换，不用重做吐司。';
  if (k.chapter === 0 && k.holding?.id === 'jam' && !isHeartJam(k.holding)) return '把手里这份果酱单独送到回收桶，再试两种水果；不用回收吐司。';
  if (k.chapter === 4 && k.puzzle.steam >= 2) return !k.places.lamp ? '把薄荷热茶送到灯旁茶位，再把订单里的吐司小盘送到花下餐位。' : '对照订单，装一盘烤吐司；有草莓的那张单要一起装盘。端到花下餐位。';
  if (k.chapter === 4 && k.holding && (k.holding.id === 'mint' && k.holding.method === 'pot' || k.holding.type === 'plate' && k.holding.contents.some(i => i.id === 'mint' && i.method === 'pot'))) return '端着热茶靠近雾气玻璃，停留两秒，让文字出现。';
  if (!k.puzzle.solved && k.chapter === 2) return '到卤料袋工作台读配方，从四个香料罐逐味取料放进袋子。三味配齐，再把袋子放进煮锅。';
  if (k.holding?.type === 'plate' && validMeal(k.holding, k.chapter) && !k.orders.length) return '下一张订单还在路上，可以端着餐盘去出餐口等候。';
  if (mealOrder(k, k.holding) && !canServe(k)) return `端着料理去${THEMES[k.chapter].station}，完成特别心意。`;
  if (mealOrder(k, k.holding)) return '端着餐盘，到出餐口上菜。';
  if (validMeal(k.holding, k.chapter)) return '这盘没有对应的待送订单，可以先放在空装盘台上。';
  const plates = PLATING_IDS.map(id => k[id]);
  if (plates.some(plate => mealOrder(k, plate))) return '到下方装盘台，端起已经完成的餐盘。';
  if (canChop(k)) return '食材已放好，切配完成后就能拿走。';
  if (k.holding?.type === 'ingredient') {
    const part = [...k.orders, { variant: 0 }, { variant: 1 }].map(order => orderRecipe(k.chapter, order).parts.find(p => p.id === k.holding.id)).find(Boolean)
      || (k.chapter === 0 && ['strawberry', 'grape', 'kiwi'].includes(k.holding.id) ? { method: 'pot' } : null);
    if (!part) return '这不是订单需要的食材，可以送去回收桶。';
    if (!k.holding.cut && INGREDIENTS[k.holding.id].cut) return '把食材放到中间的切配台。';
    if (k.holding.method !== 'fresh' || part.method === 'fresh') return plates.some(Boolean) ? '把处理好的食材送到下方装盘台。' : '先把食材暂放在切配台，再去左边拿一个盘子。';
    return `把食材送进空闲的${part.method === 'pot' ? '煮锅' : '烤箱'}。`;
  }
  if (k.holding?.type === 'plate') {
    if (!k.holding.contents.length && plates.some(plate => !plate)) return '把空盘放到下方装盘台，双手就能腾出来。';
    return '端着盘子可以直接从锅或烤箱盛取熟食。';
  }
  if (k.board.item) return k.board.item.cut || !INGREDIENTS[k.board.item.id].cut ? '切配台上的食材处理好啦，去拿起来。' : '回到切配台，把食材切好。';
  for (const [method, second] of APPLIANCES) if (k[method].ready || k[second].ready) return `去${method === 'pot' ? '煮锅' : '烤箱'}取出熟食。`;
  if (k.chapter === 0 && !APPLIANCES[0].some(id => k[id].item) && !plateProgress(k)[0]) return '按果园订单找两种水果，分别切好后放进同一口锅。';
  if (!plates.some(Boolean)) return '去左边盘子架取一个空盘，放到下方装盘台。';
  const progress = plateProgress(k);
  const waiting = orderRecipe(k.chapter, k.orders[0]).parts.find((p, i) => !progress[i] && !APPLIANCES.flat().some(id => k[id].item?.id === p.id));
  if (waiting) return `上方食材柜还有${INGREDIENTS[waiting.id].name}，去取一份吧。`;
  return '料理正在慢慢变好，锅和烤箱会帮你看着火候。';
}
