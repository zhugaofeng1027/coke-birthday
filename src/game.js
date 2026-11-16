export const CHAPTERS = [
  { title: '有点甜的开胃菜', short: '甜蜜开胃', icon: 'cherry', color: '#e57c77', token: 'cherry', subtitle: '把好心情，装进第一只碗里。', station: '水果料理台' },
  { title: '神秘客人的便当', short: '神秘便当', icon: 'sandwich', color: '#dba745', token: 'flower-2', subtitle: '每一位小客人，都有自己的小心愿。', station: '便当工作台' },
  { title: '深夜加餐订单', short: '深夜加餐', icon: 'cooking-pot', color: '#6e9e87', token: 'moon', subtitle: '藏起来的配方，闻起来有点幸福。', station: '深夜小灶' },
  { title: '把今天留下来', short: '回忆拼图', icon: 'camera', color: '#7f9fbb', token: 'camera', subtitle: '有些小小的瞬间，值得好好收藏。', station: '回忆传菜口' },
  { title: '餐厅打烊以后', short: '晚安餐厅', icon: 'lamp-desk', color: '#b594b5', token: 'sparkles', subtitle: '把忙碌关在门外，留一点温柔给自己。', station: '窗边小餐桌' },
  { title: '今晚的特别来宾', short: '特别来宾', icon: 'gift', color: '#cd877d', token: 'heart', subtitle: '最后一张预约卡，写着最重要的名字。', station: '生日主餐桌' },
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
export const TOKEN_LABELS = ['樱桃', '小花', '月亮', '星光', '相机'];

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
