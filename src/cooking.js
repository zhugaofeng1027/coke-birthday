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
  { name: '山尖饭团便当', subtitle: '煮米饭、烤鸡肉，再按盒盖的图案塑形摆盘。', parts: [{ id: 'rice', method: 'pot' }, { id: 'chicken', method: 'oven' }, { id: 'broccoli', method: 'fresh' }], stock: ['rice', 'chicken', 'broccoli', 'carrot'] },
  { name: '深夜慢卤牛肉', subtitle: '让小锅，慢慢炖出幸福的味道。', parts: [{ id: 'beef', method: 'pot' }, { id: 'carrot', method: 'pot' }], stock: ['beef', 'carrot', 'mushroom', 'bread'] },
  { name: '照片里的双人餐', subtitle: '热汤、吐司和蘑菇，复刻一份小小的回忆。', parts: [{ id: 'tomato', method: 'pot' }, { id: 'bread', method: 'oven' }, { id: 'mushroom', method: 'fresh' }], stock: ['tomato', 'bread', 'mushroom', 'carrot'] },
  { name: '薄荷热茶与烤面包', subtitle: '等一壶茶的热气，留下一句喜欢。', parts: [{ id: 'mint', method: 'pot' }, { id: 'bread', method: 'oven' }], stock: ['mint', 'bread', 'mushroom', 'strawberry'] },
  { name: '生日主厨拼盘', subtitle: '前奏、主调、尾声，献给今晚最特别的你。', parts: [{ id: 'broccoli', method: 'pot' }, { id: 'beef', method: 'oven' }, { id: 'strawberry', method: 'fresh' }], stock: ['broccoli', 'beef', 'strawberry', 'mushroom'] },
];

export const WORLD = { width: 840, height: 720 };
export const STATIONS = [
  ...Array.from({ length: 4 }, (_, i) => ({ id: `stock-${i}`, type: 'stock', x: 60 + i * 175, y: 132, w: 155, h: 104, approach: { x: 137 + i * 175, y: 279 } })),
  { id: 'board', type: 'board', name: '切配台', x: 250, y: 350, w: 150, h: 110, approach: { x: 325, y: 503 } },
  { id: 'pot', type: 'pot', name: '煮锅', x: 430, y: 350, w: 150, h: 110, approach: { x: 505, y: 503 } },
  { id: 'oven', type: 'oven', name: '烤箱', x: 684, y: 337, w: 126, h: 123, approach: { x: 641, y: 399 } },
  { id: 'plates', type: 'plates', name: '盘子架', x: 30, y: 337, w: 126, h: 123, approach: { x: 199, y: 399 } },
  { id: 'plating', type: 'plating', name: '装盘台', x: 260, y: 615, w: 150, h: 75, approach: { x: 335, y: 572 } },
  { id: 'serve', type: 'serve', name: '出餐口', x: 490, y: 615, w: 190, h: 75, approach: { x: 585, y: 572 } },
  { id: 'trash', type: 'trash', name: '回收桶', x: 30, y: 576, w: 100, h: 105, approach: { x: 173, y: 620 } },
  { id: 'puzzle', type: 'puzzle', name: '特别工作台', x: 716, y: 581, w: 100, h: 100, approach: { x: 750, y: 535 } },
];
const MOONLIGHT_STATIONS = [
  ...STATIONS.map(s => s.id === 'puzzle'
    ? { ...s, x: 690, y: 566, w: 134, h: 120, approach: { x: 750, y: 525 } }
    : s.id === 'serve' ? { ...s, type: 'flowers', name: '花下餐位' } : s),
  { id: 'lamp', type: 'lamp', name: '灯旁茶位', x: 40, y: 483, w: 110, h: 72, approach: { x: 199, y: 520 } },
];
const ARRANGING_STATIONS = STATIONS.filter(s => s.id !== 'serve').map(s => s.id === 'plating' ? { ...s, name: '餐盘提手' } : s);
const MEAL_SLOTS = Array.from({ length: 3 }, (_, slot) => ({
  id: `slot-${slot}`, type: 'slot', slot, name: ['左餐格', '中餐格', '右餐格'][slot],
  x: 490 + slot * 65, y: 615, w: 60, h: 75, approach: { x: 520 + slot * 65, y: 585 },
}));
const MEAL_STATIONS = [...ARRANGING_STATIONS, ...MEAL_SLOTS,
  { id: 'serve', type: 'serve', name: '取餐口', x: 40, y: 483, w: 110, h: 72, approach: { x: 190, y: 530 } }];
const SPICE_STATIONS = [...STATIONS.filter(s => s.id !== 'serve'),
  { ...STATIONS.find(s => s.id === 'serve'), x: 40, y: 483, w: 110, h: 72, approach: { x: 190, y: 530 } },
  ...Object.keys(SPICES).map((spice, i) => ({
    id: `spice-${spice}`, type: 'spice', spice, name: SPICES[spice].name,
    x: 480 + i * 55, y: 615, w: 50, h: 75, approach: { x: 505 + i * 55, y: 585 },
  })),
];
export function stationsFor(k) {
  const chapter = typeof k === 'number' ? k : k.chapter;
  return chapter === 4 ? MOONLIGHT_STATIONS : [1, 3].includes(chapter) ? MEAL_STATIONS : chapter === 2 ? SPICE_STATIONS : STATIONS;
}
export const CHOP_SECONDS = 2.4;
export const REACH = 64;
export const PLAYER_SPEED = 235;
export const METHOD_NAMES = { pot: '煮熟', oven: '烤熟', fresh: '切好' };
export const STAGE_NAMES = { raw: '未处理', cut: '已切好', pot: '已煮熟', oven: '已烤好' };

export function createKitchen(chapter = 0) {
  return {
    chapter, player: { x: 420, y: 548 }, holding: null,
    board: { item: null, progress: 0 },
    pot: { item: null, elapsed: 0, duration: 0, ready: false },
    oven: { item: null, elapsed: 0, duration: 0, ready: false },
    plating: null, delivered: false, deliveries: 0,
    puzzle: { solved: false, inspected: false, steam: 0, attempts: 0, openRequested: false },
    places: { lamp: null, flowers: null },
    spices: [], broth: [],
    message: `欢迎来到${THEMES[chapter].name}，右下角有一份特别线索。`, messageKind: 'normal',
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
  if (item.id === 'jam') return isHeartJam(item) ? '爱心双果酱' : item.method === 'pot' ? '待调整的果酱' : '锅里的水果';
  if (item.type === 'plate') return item.contents.length ? `餐盘 · ${item.contents.map(i => INGREDIENTS[i.id].name).join('、')}` : '空餐盘';
  if (item.id === 'rice' && item.shape) return `${{ circle: '圆形', triangle: '三角', heart: '爱心' }[item.shape]}饭团`;
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
export function plateMatches(plate, chapter) {
  const parts = DISHES[chapter].parts;
  return plate?.type === 'plate' && plate.contents.length === parts.length
    && parts.every(part => plate.contents.filter(item => ingredientMatches(item, part)).length === 1)
    && (chapter !== 0 || plate.contents.find(item => item.id === 'bread')?.spread === true)
    && (chapter !== 2 || plate.contents.find(item => item.id === 'beef')?.braised === true);
}
export function plateProgress(kitchen) {
  const plate = kitchen.holding?.type === 'plate' ? kitchen.holding : kitchen.plating;
  return DISHES[kitchen.chapter].parts.map(part => kitchen.chapter === 4
    ? part.id === 'mint' ? !!kitchen.places.lamp : !!kitchen.places.flowers
    : !!plate?.contents.some(item => ingredientMatches(item, part)));
}
export function canServe(k) {
  if (!plateMatches(k.holding, k.chapter) || !k.puzzle.solved) return false;
  const order = THEMES[k.chapter].order;
  if (order && k.holding.contents.some((item, i) => item.id !== order[i])) return false;
  return k.chapter !== 1 || k.holding.contents.find(i => i.id === 'rice')?.shape === 'triangle';
}

export function solveKitchenPuzzle(k, answer) {
  if (k.chapter !== 5) return say(k, '这间厨房的答案，藏在亲手完成的料理里。', 'gentle');
  const s = stationsFor(k).find(s => s.id === 'puzzle');
  if (k.delivered || stationDistance(k.player, s) > REACH) return say(k, '带着线索到右下角的特别工作台来吧。', 'gentle');
  const theme = THEMES[k.chapter];
  k.puzzle.attempts++;
  if (theme.order) {
    if (!plateMatches(k.holding, k.chapter)) return say(k, '先把订单里的料理做好、装进餐盘，再端到这里来。', 'gentle');
    if (!Array.isArray(answer?.order) || answer.order.join(',') !== theme.order.join(',')
      || (k.chapter === 1 && answer.shape !== 'triangle')) return say(k, '和线索还差一点，再看看图案和先后顺序。', 'gentle');
    k.holding.contents = theme.order.map(id => k.holding.contents.find(item => item.id === id));
    if (k.chapter === 1) k.holding.contents.find(i => i.id === 'rice').shape = 'triangle';
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
function updateArrangement(k, plate) {
  if (![1, 3].includes(k.chapter)) return;
  k.puzzle.solved = plateMatches(plate, k.chapter)
    && plate.contents.every((item, i) => item.slot === i && item.id === THEMES[k.chapter].order[i])
    && (k.chapter !== 1 || plate.contents[0].shape === 'triangle');
  if (k.puzzle.solved) say(k, THEMES[k.chapter].success, 'success');
}
function addToPlate(k, plate, item) {
  if (k.chapter === 0) {
    if (item.id === 'jam' && !isHeartJam(item)) return say(k, k.pot.item === item
      ? '果酱没有冒爱心。可以留在锅里换一种水果，吐司会为你留着。'
      : '果酱没有冒爱心。先单独回收这份果酱再试试，吐司会为你留着。', 'gentle');
    if (!DISHES[0].parts.some(part => ingredientMatches(item, part))) return say(k, item.id === 'bread' ? '吐司要先送进烤箱烤好，再来抹果酱。' : '这份食材不适合这盘吐司，先留在手里吧。', 'gentle');
    if (plate.contents.some(part => part.id === item.id)) return say(k, '这一份已经放好啦，不用重复添加。', 'gentle');
  }
  if (plate.contents.length >= 3) return say(k, '餐盘已经满啦，先去出餐口或回收桶整理一下。', 'gentle');
  plate.contents.push(item);
  if ([1, 3].includes(k.chapter)) {
    item.slot = [0, 1, 2].find(slot => !plate.contents.some(other => other !== item && other.slot === slot));
    plate.contents.sort((a, b) => a.slot - b.slot);
    updateArrangement(k, plate);
  }
  if (k.chapter === 0 && plate.contents.some(isHeartJam) && plate.contents.some(i => i.id === 'bread' && i.method === 'oven')) {
    plate.contents.find(i => i.id === 'bread').spread = true;
    k.puzzle.solved = true;
    say(k, THEMES[0].success, 'success');
  }
  return true;
}

export function actionLabel(k, station = nearestStation(k)) {
  if (k.delivered) return '已出餐';
  if (!station) return '靠近工作台';
  const h = k.holding;
  if (station.type === 'lamp') return k.places.lamp ? '热茶已就位' : '把热茶留在灯旁';
  if (station.type === 'flowers') return k.places.flowers ? '面包已就位' : '把面包放在花下';
  if (station.type === 'puzzle' && k.chapter === 4) return k.puzzle.steam >= 2 ? '读玻璃上的字' : '端热茶靠近玻璃';
  if (station.type === 'puzzle' && k.chapter === 1) return h?.id === 'rice' || h?.contents?.some(i => i.id === 'rice') ? '压饭团模具' : '查看盒盖';
  if (station.type === 'puzzle' && k.chapter === 2) return h?.type === 'spice' ? '放进卤料袋' : correctSpices(k.spices) ? '拿起卤料袋' : k.spices.length ? '取回最后一味' : '查看卤料方';
  if (station.type === 'spice') return h?.type === 'spice' && h.id === station.spice ? '放回香料罐' : h ? '先放下手中物品' : `取${station.name}`;
  if (station.type === 'slot') {
    const occupied = k.plating?.contents.some(i => i.slot === station.slot);
    return !k.plating ? '先放一个空盘' : h?.type === 'ingredient' ? occupied ? '交换这格料理' : '放进这个餐格' : !h && occupied ? '取回这格料理' : '餐格空着';
  }
  if (station.type === 'puzzle' && k.chapter === 3) return '对照回忆相片';
  if (station.type === 'puzzle') return k.puzzle.solved ? '查看特别线索' : ['bento', 'memory', 'finale'].includes(THEMES[k.chapter].kind) ? '塑形与摆盘' : '查看特别线索';
  if (station.type === 'stock') return h ? '手里已有食材' : `取${INGREDIENTS[DISHES[k.chapter].stock[Number(station.id.split('-')[1])]].name}`;
  if (station.type === 'board') return h ? '放上切配台' : k.board.item ? k.board.item.cut ? '拿起食材' : '等待切配' : '切配台空着';
  if (station.type === 'pot' || station.type === 'oven') {
    if (station.type === 'pot' && h?.type === 'spicebag') return '卤料袋下锅';
    const job = k[station.type];
    if (job.waiting) return h?.cut ? '加入第二种水果' : '还缺一种切好的水果';
    if (k.chapter === 0 && station.type === 'pot' && job.ready && !isHeartJam(job.item) && h?.method === 'fresh') return '替换不合适的水果';
    if (k.chapter === 0 && job.ready && isHeartJam(job.item) && h?.type === 'plate') return '抹果酱';
    return job.item ? job.ready ? h?.type === 'plate' ? '盛入餐盘' : h ? '先放下食材' : '取出料理' : '正在烹饪' : h?.type === 'ingredient' ? station.type === 'pot' ? '放入煮锅' : '放入烤箱' : '还没有食材';
  }
  if (station.type === 'plates') return h?.type === 'plate' ? '放回空盘' : h ? '先放下食材' : '拿一个盘子';
  if (station.type === 'plating' && k.chapter === 0 && (h?.id === 'jam' || h?.id === 'bread') && k.plating?.contents.some(i => i.id !== h.id)) return '抹果酱到吐司上';
  if (station.type === 'plating' && [1, 3].includes(k.chapter) && h?.type === 'ingredient') return '去右边选择餐格';
  if (station.type === 'plating') return h?.type === 'plate' ? '放下餐盘' : h ? '装入餐盘' : k.plating ? '端起餐盘' : '先放一个盘子';
  if (station.type === 'serve') return h?.type === 'plate' ? '上菜啦' : '端着餐盘来';
  if (station.type === 'trash') return h ? '放入回收桶' : '两手空空';
  return '操作';
}
export function canChop(k) {
  return !k.delivered && !k.holding && !!k.board.item && !k.board.item.cut
    && INGREDIENTS[k.board.item.id].cut && stationDistance(k.player, stationsFor(k).find(s => s.id === 'board')) <= REACH;
}

export function interact(k, stationId = nearestStation(k)?.id) {
  if (k.delivered) return say(k, '这份心意已经送达啦，去看看生日便笺吧。');
  const station = stationsFor(k).find(s => s.id === stationId);
  if (!station || stationDistance(k.player, station) > REACH) return say(k, '再走近一点，我帮你留着这个位置。', 'gentle');
  const h = k.holding;
  if (station.type === 'spice') {
    if (h?.type === 'spice' && h.id === station.spice) { k.holding = null; return say(k, '香料放回罐子啦。'); }
    if (h) return say(k, '先把手里的东西放好，再取一味香料。', 'gentle');
    k.holding = { type: 'spice', id: station.spice };
    return say(k, `拿到${station.name}，可以送进右下角的卤料袋，也可以放回原罐。`);
  }
  if (station.type === 'slot') {
    if (!k.plating) return say(k, '先把空盘放到左边的餐盘提手台，三个餐格就准备好啦。', 'gentle');
    const item = k.plating.contents.find(i => i.slot === station.slot);
    if (!h && item) {
      k.holding = item; k.plating.contents.splice(k.plating.contents.indexOf(item), 1);
      delete item.slot; updateArrangement(k, k.plating);
      return say(k, '取回这一格啦，其他料理原样留着，可以换个位置。');
    }
    if (h?.type !== 'ingredient') return say(k, item ? '先空出双手，就能取回这格料理。' : '这里空着，端一份做好的料理来吧。');
    if (!DISHES[k.chapter].parts.some(p => ingredientMatches(h, p))) return say(k, '食材或做法还不对，看看菜谱和线索；手中的料理先留着。', 'gentle');
    if (item) {
      k.plating.contents.splice(k.plating.contents.indexOf(item), 1);
      delete item.slot;
    }
    h.slot = station.slot; k.plating.contents.push(h); k.plating.contents.sort((a, b) => a.slot - b.slot);
    k.holding = item || null; updateArrangement(k, k.plating);
    return k.puzzle.solved ? say(k, THEMES[k.chapter].success, 'success') : say(k, item ? `交换好啦，手里是${itemName(item)}，可以送到空着的那格。` : '放好一格啦。放错可以空手取回，也可以端着料理来交换。');
  }
  if (station.type === 'puzzle') {
    k.puzzle.inspected = true;
    k.puzzle.openRequested = k.chapter === 5;
    if (k.chapter === 1) {
      const rice = h?.id === 'rice' ? h : h?.contents?.find(i => i.id === 'rice');
      if (rice) {
        if (rice.method !== 'pot') return say(k, '模具要用煮好的米饭，生米先送进锅里。', 'gentle');
        const shapes = ['circle', 'triangle', 'heart'];
        rice.shape = shapes[(shapes.indexOf(rice.shape) + 1) % shapes.length];
        updateArrangement(k, h?.type === 'plate' ? h : k.plating);
        return say(k, `压出${itemName(rice)}啦。${rice.shape === 'triangle' ? '和盒盖的小山尖一样！' : '和小山尖不太一样，再压一次可以换模具。'}`, rice.shape === 'triangle' ? 'success' : 'normal');
      }
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
      if (h?.type === 'spicebag') return say(k, '卤料袋已经在手里啦，送进中间的煮锅吧。');
    }
    return say(k, k.chapter === 4 && k.puzzle.steam >= 2 ? STEAM_MESSAGE : THEMES[k.chapter].clue);
  }
  if (station.type === 'lamp' || station.type === 'flowers') {
    if (k.puzzle.steam < 2) return say(k, '先端着热茶到右下角玻璃前，看看雾气里藏着什么。', 'gentle');
    const place = station.type;
    if (k.places[place]) return say(k, '这里的心意已经放好啦。', 'success');
    const part = DISHES[4].parts[place === 'lamp' ? 0 : 1];
    const fromPlate = h?.type === 'plate' && h.contents.filter(i => ingredientMatches(i, part)).length === 1
      && h.contents.every(i => DISHES[4].parts.some(p => ingredientMatches(i, p)));
    const correct = fromPlate || place === 'lamp' && ingredientMatches(h, part);
    if (!correct) return say(k, place === 'lamp' ? '灯旁在等一杯薄荷热茶，手里的料理替你留着。' : '花下在等一盘烤面包。先把面包装到盘子里吧。', 'gentle');
    if (fromPlate) {
      const item = h.contents.splice(h.contents.findIndex(i => ingredientMatches(i, part)), 1)[0];
      k.places[place] = place === 'lamp' ? item : { type: 'plate', contents: [item] };
      if (!h.contents.length) k.holding = null;
    } else { k.places[place] = h; k.holding = null; }
    if (k.places.lamp && k.places.flowers) {
      k.puzzle.solved = true; k.delivered = true; k.deliveries++;
      return say(k, THEMES[4].success, 'success');
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
    const method = station.type; const job = k[method];
    if (k.chapter === 2 && method === 'pot' && h?.type === 'spicebag') {
      if (!correctSpices(h.spices)) return say(k, '这份卤料不对，先按配方重新配一袋。', 'gentle');
      k.broth = [...h.spices]; k.holding = null; k.puzzle.solved = true;
      return say(k, '卤料袋下锅，清汤变成了卤汤！现在放入切好的牛肉和胡萝卜。', 'success');
    }
    if (k.chapter === 0 && method === 'pot') return interactJamPot(k);
    if (job.item) {
      if (!job.ready) return say(k, `${method === 'pot' ? '锅里正在咕嘟咕嘟' : '烤箱正在认真工作'}，还要 ${Math.ceil(job.duration - job.elapsed)} 秒。`);
      if (h?.type === 'plate') {
        if (!addToPlate(k, h, job.item)) return false;
        k[method] = emptyAppliance(); return say(k, '热乎乎的料理，已经盛进餐盘啦。');
      }
      if (h) return say(k, '先腾出双手，或端一个餐盘来。', 'gentle');
      k.holding = job.item; k[method] = emptyAppliance();
      return say(k, `取出${itemName(k.holding)}，可以去装盘啦。`);
    }
    if (h?.type !== 'ingredient') return say(k, '这里还空着，先送一份处理好的食材来。');
    if (h.method !== 'fresh') return say(k, '这份料理已经熟啦，不用再烹饪一次。', 'gentle');
    if (INGREDIENTS[h.id].cut && !h.cut) return say(k, `${INGREDIENTS[h.id].name}还没切配，先去切配台吧。`, 'gentle');
    const duration = INGREDIENTS[h.id][method];
    if (!duration) return say(k, '这份食材不适合这个做法，看看订单上的小配方。', 'gentle');
    if (k.chapter === 2 && method === 'pot' && !correctSpices(k.broth)) return say(k, '锅里还没有卤料。配好卤料袋，亲手放进煮锅再下食材。', 'gentle');
    if (k.chapter === 2 && method === 'pot') h.braised = true;
    k[method] = { item: h, duration, elapsed: 0, ready: false }; k.holding = null;
    return say(k, `${method === 'pot' ? '小火已开' : '烤箱已启动'}。等它熟的时候，可以去准备别的食材。`);
  }
  if (station.type === 'plates') {
    if (!h) { k.holding = { type: 'plate', contents: [] }; return say(k, '拿好餐盘啦，可以先放到装盘台。'); }
    if (h.type === 'plate' && !h.contents.length) { k.holding = null; return say(k, '空盘放回去啦。'); }
    return say(k, '先放好手里的东西，再来拿盘子吧。', 'gentle');
  }
  if (station.type === 'plating') {
    if (h?.type === 'plate' && !k.plating) { k.plating = h; k.holding = null; return say(k, '餐盘摆好啦，等你把料理一份份送来。'); }
    if (h?.type === 'ingredient' && k.plating) {
      if ([1, 3].includes(k.chapter)) return say(k, '右边是同一餐盘的三个餐格，走到想放的那一格再放下。');
      if (h.method === 'fresh' && INGREDIENTS[h.id].cut && !h.cut) return say(k, '这份食材还没切好，先去切配台吧。', 'gentle');
      if (!addToPlate(k, k.plating, h)) return false;
      k.holding = null; return say(k, plateMatches(k.plating, k.chapter) ? k.chapter === 0 ? THEMES[0].success : '配菜齐啦，端起餐盘去出餐口吧！' : '装好一份啦，再看看订单还需要什么。', 'success');
    }
    if (!h && k.plating) { k.holding = k.plating; k.plating = null; return say(k, [1, 2, 3].includes(k.chapter) ? '餐盘端稳啦，取餐口在左侧。' : '餐盘端稳啦，出餐口就在旁边。'); }
    return say(k, h?.type === 'plate' ? '这里已经有餐盘啦，先端走原来的那一盘。' : '先从盘子架拿一个空盘，放在装盘台。', 'gentle');
  }
  if (station.type === 'serve') {
    if (!plateMatches(h, k.chapter)) return say(k, h?.type === 'plate' ? '这盘和订单还差一点，检查一下食材和烹饪方式吧。' : '上菜时，要把料理装在餐盘里哦。', 'gentle');
    if (!canServe(k)) return say(k, [1, 3].includes(k.chapter) ? '料理齐了，模样或位置还差一点。把盘子放回提手台，空手取回餐格里的料理调整吧。' : '料理齐了，再到右下角完成这间厨房的特别心意吧。', 'gentle');
    k.holding = null; k.delivered = true; k.deliveries++; return say(k, '完美出餐！一封生日便笺，已经为你准备好。', 'success');
  }
  if (station.type === 'trash') {
    if (!h) return say(k, '没有要回收的东西，厨房还是很整洁。');
    k.holding = null; return say(k, '收拾好啦，再试一次也没关系。');
  }
  return false;
}
function correctSpices(spices) {
  return spices?.length === 3 && THEMES[2].answer.every(id => spices.includes(id));
}

function interactJamPot(k) {
  const job = k.pot; const h = k.holding;
  const fruit = h?.type === 'ingredient' && ['strawberry', 'grape', 'kiwi'].includes(h.id) && h.method === 'fresh';
  if (fruit && !h.cut) return say(k, '水果要先切好，才能一起熬成果酱。', 'gentle');
  if (fruit && (!job.item || job.waiting || job.ready && !isHeartJam(job.item))) {
    let fruits = [...(job.item?.fruits || [])];
    if (fruits.length === 2) {
      const wrong = fruits.findIndex((id, i) => !['strawberry', 'grape'].includes(id) || fruits.indexOf(id) !== i);
      fruits.splice(wrong, 1);
    }
    fruits.push(h.id);
    k.pot = { item: { type: 'ingredient', id: 'jam', method: 'fresh', cut: true, fruits }, duration: 6, elapsed: 0, ready: false, waiting: fruits.length < 2 };
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
  k.pot = emptyAppliance();
  if (k.puzzle.solved) return say(k, THEMES[0].success, 'success');
  return say(k, isHeartJam(job.item) ? '爱心果酱熬好啦，把它和烤吐司一起送到餐盘。' : '这锅没有冒爱心。单独回收果酱再试试，其他料理会留着。');
}

export function stepKitchen(k, seconds, chopping = false) {
  if (k.delivered || !Number.isFinite(seconds) || seconds <= 0) return;
  k.elapsed += seconds;
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
  for (const method of ['pot', 'oven']) {
    const job = k[method];
    if (!job.item || job.ready || job.waiting) continue;
    job.elapsed = Math.min(job.duration, job.elapsed + seconds);
    if (job.elapsed >= job.duration) {
      job.ready = true; job.item.method = method;
      k.stats[method === 'pot' ? 'cooked' : 'baked']++;
      say(k, job.item.id === 'jam' ? isHeartJam(job.item) ? '锅里冒出爱心！把果酱抹上烤吐司吧。' : '果酱的颜色不太对，也没有爱心。留在锅里换一种水果试试吧。' : `${method === 'pot' ? '锅里的料理煮好' : '烤箱里的料理烤好'}啦，随时可以取走。`, job.item.id === 'jam' && !isHeartJam(job.item) ? 'gentle' : 'success');
    }
  }
}

export function nextTask(k) {
  if (k.delivered) return '完美出餐，打开你的生日便笺。';
  if (k.holding?.type === 'spice') return '把这味香料放进右下角卤料袋，或送回对应的罐子。';
  if (k.holding?.type === 'spicebag') return '亲手把卤料袋放进中间的煮锅，让清汤变成卤汤。';
  if ([1, 3].includes(k.chapter)) {
    if (k.holding?.id === 'rice' && k.holding.method === 'pot' && k.holding.shape !== 'triangle') return '端着煮好的米饭，到右下角模具台压出盒盖上的小山尖。';
    if (k.holding?.type === 'ingredient' && DISHES[k.chapter].parts.some(p => ingredientMatches(k.holding, p)) && k.plating) return '去下方右侧三个餐格，按盒盖或餐照选择位置；放错可空手取回。';
    if (k.puzzle.solved) return k.holding?.type === 'plate' ? '端着完整餐盘去左侧取餐口上菜。' : '去下方餐盘提手台，端起完成的餐盘，再送到左侧取餐口。';
    if (plateMatches(k.plating || k.holding, k.chapter)) return '对照右下角图案检查模样和位置；把盘子放回提手台，空手取回放错的餐格。';
  }
  if (!k.puzzle.inspected && !k.puzzle.solved && k.chapter === 0) return '去右下角果园订单台，看看红心和紫色圆球的线索。';
  if (k.chapter === 0 && k.pot.waiting) return '把另一种水果切好，加入同一口煮锅；红心和紫色圆球是线索。';
  if (k.chapter === 0 && k.pot.ready && !isHeartJam(k.pot.item)) return '果酱没冒爱心：切好正确的水果，回到锅边替换，不用重做吐司。';
  if (k.chapter === 0 && k.holding?.id === 'jam' && !isHeartJam(k.holding)) return '把手里这份果酱单独送到左下方回收桶，再试两种水果；不用回收吐司。';
  if (k.chapter === 4 && k.puzzle.steam >= 2) return !k.places.lamp ? '把薄荷热茶送到左侧灯旁，再把单独装盘的烤面包送到花下。' : '烤好面包，单独装进餐盘，端到右下方的花下餐位。';
  if (k.chapter === 4 && k.holding && (k.holding.id === 'mint' && k.holding.method === 'pot' || k.holding.type === 'plate' && k.holding.contents.some(i => i.id === 'mint' && i.method === 'pot'))) return '端着热茶靠近右下角雾气玻璃，停留两秒，让文字出现。';
  if (!k.puzzle.solved && k.chapter === 2) return '读右下角卤料方，从下方四个罐子逐味取料放进袋子。三味配齐，再把袋子放进煮锅。';
  if (plateMatches(k.holding, k.chapter) && !canServe(k)) return `端着料理去右下角的${THEMES[k.chapter].station}，完成特别心意。`;
  if (plateMatches(k.holding, k.chapter)) return [1, 2, 3].includes(k.chapter) ? '端着餐盘，到左侧取餐口上菜。' : '端着餐盘，到右下方出餐口上菜。';
  if (plateMatches(k.plating, k.chapter)) return '到下方装盘台，端起已经完成的餐盘。';
  if (canChop(k)) return '食材已放好，切配完成后就能拿走。';
  if (k.holding?.type === 'ingredient') {
    const part = DISHES[k.chapter].parts.find(p => p.id === k.holding.id) || (k.chapter === 0 && ['strawberry', 'grape', 'kiwi'].includes(k.holding.id) ? { method: 'pot' } : null);
    if (!part) return '这不是订单需要的食材，可以送去左下方回收桶。';
    if (!k.holding.cut && INGREDIENTS[k.holding.id].cut) return '把食材放到中间的切配台。';
    if (k.holding.method !== 'fresh' || part.method === 'fresh') return k.plating ? '把处理好的食材送到下方装盘台。' : '先把食材暂放在切配台，再去左边拿一个盘子。';
    return `把食材送进${part.method === 'pot' ? '中间的煮锅' : '右边的烤箱'}。`;
  }
  if (k.holding?.type === 'plate') {
    if (!k.holding.contents.length && !k.plating) return '把空盘放到下方装盘台，双手就能腾出来。';
    return '端着盘子可以直接从锅或烤箱盛取熟食。';
  }
  if (k.board.item) return k.board.item.cut || !INGREDIENTS[k.board.item.id].cut ? '切配台上的食材处理好啦，去拿起来。' : '回到切配台，把食材切好。';
  for (const method of ['pot', 'oven']) if (k[method].ready) return `去${method === 'pot' ? '煮锅' : '烤箱'}取出熟食。`;
  if (k.chapter === 0 && !k.pot.item && !plateProgress(k)[0]) return '按果园订单找两种水果，分别切好后放进同一口锅。';
  if (!k.plating) return '去左边盘子架取一个空盘，放到下方装盘台。';
  const progress = plateProgress(k);
  const waiting = DISHES[k.chapter].parts.find((p, i) => !progress[i] && !['pot', 'oven'].some(method => k[method].item?.id === p.id));
  if (waiting) return `上方食材柜还有${INGREDIENTS[waiting.id].name}，去取一份吧。`;
  return '料理正在慢慢变好，锅和烤箱会帮你看着火候。';
}
