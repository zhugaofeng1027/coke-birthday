export const CHAPTERS = [
  { short: '果园甜品站', icon: 'cherry', color: '#d67d83' },
  { short: '口袋便当铺', icon: 'sandwich', color: '#a398be' },
  { short: '深夜卤味档', icon: 'cooking-pot', color: '#68999d' },
  { short: '时光食堂', icon: 'camera', color: '#86a7b2' },
  { short: '月光香草厨房', icon: 'moon', color: '#9299bb' },
  { short: '花园餐厅', icon: 'flower-2', color: '#ce809b' },
];

export const FRUITS = [
  { id: 'strawberry', name: '草莓' },
  { id: 'banana', name: '香蕉' },
  { id: 'grape', name: '葡萄' },
  { id: 'kiwi', name: '猕猴桃' },
];
export const CUSTOMERS = [
  { name: '小圆', icon: 'circle', clue: '我的便当不能少了米饭。', answer: 'rice' },
  { name: '小方', icon: 'square', clue: '我想要一份绿绿的蔬菜。', answer: 'broccoli' },
  { name: '小星', icon: 'star', clue: '我想吃一份红色的水果。', answer: 'strawberry' },
];
export const RECIPE = [
  { id: 'wash', name: '洗净食材', icon: 'droplets' },
  { id: 'simmer', name: '小火慢卤', icon: 'cooking-pot' },
  { id: 'plate', name: '装盘上桌', icon: 'utensils' },
];
export const MEMORIES = [
  { id: 'morning', title: '一起出发', time: '上午 · 10:00', art: 'morning', caption: '阳光刚刚好，出门去见你。' },
  { id: 'afternoon', title: '分一口甜', time: '下午 · 15:00', art: 'afternoon', caption: '走累了，就一起吃点甜。' },
  { id: 'night', title: '并肩回家', time: '晚上 · 20:00', art: 'night', caption: '天黑以后，身边还是你。' },
];
export const TOKEN_ORDER = [2, 0, 4, 1, 3];
export function newPuzzle() {
  return { fruits: [], customers: ['', '', ''], scraps: [], recipe: [], photos: [], lights: false, flowers: false, radio: true, tokens: [] };
}

export function checkPuzzle(chapter, p) {
  switch (chapter) {
    case 0: return p.fruits.join(',') === 'banana,grape,strawberry';
    case 1: return CUSTOMERS.every((c, i) => p.customers[i] === c.answer);
    case 2: return p.scraps.length === 3 && p.recipe.join(',') === 'wash,simmer,plate';
    case 3: return p.photos.join(',') === 'morning,afternoon,night';
    case 4: return p.lights && p.flowers && !p.radio;
    case 5: return p.tokens.join(',') === TOKEN_ORDER.join(',');
    default: return false;
  }
}

export function normalizeConfig(raw, fallback) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return structuredClone(fallback);
  const text = (value, original, max = 3000) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : original;
  return {
    recipient: text(raw.recipient, fallback.recipient, 40),
    sender: text(raw.sender, fallback.sender, 40),
    closing: text(raw.closing, fallback.closing),
    gifts: fallback.gifts.map((gift, i) => ({
      name: text(raw.gifts?.[i]?.name, gift.name, 80),
      riddle: text(raw.gifts?.[i]?.riddle, gift.riddle),
      message: text(raw.gifts?.[i]?.message, gift.message),
    })),
  };
}

export function normalizeProgress(raw) {
  const completed = Array.isArray(raw?.completed)
    ? [...new Set(raw.completed.filter((n) => Number.isInteger(n) && n >= 0 && n < 6))].sort()
    : [];
  // Only contiguous completion is valid, so a damaged save cannot skip presents.
  const contiguous = [];
  for (let i = 0; i < 6 && completed.includes(i); i++) contiguous.push(i);
  return { completed: contiguous, finished: contiguous.length === 6 && raw?.finished === true };
}
