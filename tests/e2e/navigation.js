import { createKitchen, stationsFor, worldFor } from '../../src/cooking.js';

// Plan real keyboard movement around counters rather than teleporting the chef.
export function wideRoute(chapter, start, stationId) {
  const k = createKitchen(chapter);
  k.layout = 'landscape';
  const stations = stationsFor(k);
  const target = stations.find(s => s.id === stationId).approach;
  const world = worldFor(k);
  const step = 12;
  const columns = Math.floor((world.width - 86) / step) + 1;
  const rows = Math.floor((world.height - 86) / step) + 1;
  const point = index => ({ x: 43 + index % columns * step, y: 43 + Math.floor(index / columns) * step });
  const clear = p => stations.every(s =>
    p.x < s.x - 21 || p.x > s.x + s.w + 21 || p.y < s.y - 21 || p.y > s.y + s.h + 21);
  const nodes = Array.from({ length: columns * rows }, (_, i) => i).filter(i => clear(point(i)));
  const nearest = p => nodes.reduce((best, i) =>
    Math.hypot(point(i).x - p.x, point(i).y - p.y) < Math.hypot(point(best).x - p.x, point(best).y - p.y) ? i : best, nodes[0]);
  const from = nearest(start);
  const to = nearest(target);
  const queue = [from];
  const previous = new Map([[from, null]]);
  const allowed = new Set(nodes);
  for (let cursor = 0; cursor < queue.length && !previous.has(to); cursor++) {
    const index = queue[cursor];
    for (const next of [index - columns, index + columns, ...(index % columns ? [index - 1] : []), ...(index % columns < columns - 1 ? [index + 1] : [])]) {
      if (next < 0 || next >= rows * columns || !allowed.has(next) || previous.has(next)) continue;
      previous.set(next, index); queue.push(next);
    }
  }
  if (!previous.has(to)) throw new Error(`No walking route to ${stationId} in kitchen ${chapter + 1}`);
  const path = [];
  for (let index = to; index !== null; index = previous.get(index)) path.unshift(point(index));
  const turns = path.filter((p, i) => i === 0 || i === path.length - 1
    || path[i + 1].x - p.x !== p.x - path[i - 1].x || path[i + 1].y - p.y !== p.y - path[i - 1].y);
  return [...turns, target];
}
