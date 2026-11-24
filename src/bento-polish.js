import { CHALLENGES, createKitchen, INGREDIENTS, setKitchenLayout, stationsFor } from './cooking.js';

export function createBentoSample(landscape, audition = false) {
  const kitchen = createKitchen(1);
  setKitchenLayout(kitchen, landscape);
  kitchen.player = { ...stationsFor(kitchen).find(s => s.id === 'board').approach };
  const ingredient = (id, method = 'fresh', cut = true) => ({ type: 'ingredient', id, method, cut });
  kitchen.plating = { type: 'plate', contents: [ingredient('rice', 'pot')] };
  const baked = INGREDIENTS.chicken.oven;
  kitchen.oven = { item: ingredient('chicken', 'oven'), elapsed: baked, duration: baked, ready: true };
  kitchen.board.item = ingredient('broccoli', 'fresh', false);
  kitchen.message = '米饭已装盘。切好西兰花、取出烤鸡，就能装盘打包啦。';
  if (audition) {
    const { seconds, orderInterval, orderLifetime } = CHALLENGES[kitchen.chapter];
    kitchen.timeLeft = 50;
    kitchen.elapsed = seconds - kitchen.timeLeft;
    kitchen.nextOrderAt = Math.ceil(kitchen.elapsed / orderInterval) * orderInterval;
    kitchen.orders[0].expiresAt = kitchen.elapsed + 19;
    kitchen.orders[0].createdAt = kitchen.orders[0].expiresAt - orderLifetime;
  }
  return kitchen;
}
