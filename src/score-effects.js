import { ORDER_PENALTY, ORDER_POINTS, stationsFor, worldFor } from './cooking.js';

const motion = matchMedia('(prefers-reduced-motion: reduce)');

export function createScoreEffects(root) {
  const queue = root.querySelector('.order-queue');
  const score = root.querySelector('#shift-score');
  const layer = root.querySelector('.score-effects');
  const animations = new Set();
  let run = 0;
  let heldScore = null;

  function clear() {
    run++;
    heldScore = null;
    animations.forEach(animation => animation.cancel());
    animations.clear();
    layer.replaceChildren();
  }

  async function animate(element, frames, duration, easing = 'ease-out') {
    const animation = element.animate(motion.matches ? [{ opacity: .72 }, { opacity: 1 }] : frames, {
      duration: motion.matches ? Math.min(duration, 180) : duration, easing, fill: 'backwards',
    });
    animations.add(animation);
    try { await animation.finished; }
    catch { /* A new round or scoring event replaced this animation. */ }
    finally { animations.delete(animation); }
  }

  function place(el, rect) {
    Object.assign(el.style, {
      left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    });
  }

  function ticketExit(ids, loss) {
    const bounds = queue.getBoundingClientRect();
    const clip = document.createElement('div');
    clip.className = 'score-fx-ticket-clip';
    place(clip, bounds);
    let origin;
    const exits = [];
    for (const id of ids) {
      const card = queue.querySelector(`[data-order-id="${id}"]`);
      if (!card) continue;
      const box = card.getBoundingClientRect();
      const left = Math.max(0, bounds.left, box.left);
      const right = Math.min(layer.clientWidth, bounds.right, box.right);
      if (left >= right || box.bottom <= 0 || box.top >= layer.clientHeight) continue;
      origin ??= { x: (left + right) / 2, y: box.bottom + 15 };
      const copy = card.cloneNode(true);
      copy.className = `score-fx-ticket ${loss ? 'score-fx-ticket-missed' : 'score-fx-ticket-served'}`;
      copy.removeAttribute('data-order-id');
      place(copy, { left: box.left - bounds.left, top: box.top - bounds.top, width: box.width, height: box.height });
      if (loss) {
        copy.querySelector('.order-time').textContent = '0:00';
        copy.querySelector('.order-patience > span').style.width = '0%';
      } else {
        const stamp = document.createElement('span');
        stamp.className = 'score-fx-stamp';
        stamp.textContent = '\u2713';
        copy.append(stamp);
      }
      clip.append(copy);
      exits.push(copy);
    }
    if (!exits.length) return origin;
    layer.append(clip);
    void Promise.all(exits.map(copy => animate(copy, [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(0)', opacity: 1, offset: .48 },
      { transform: `translateY(${loss ? 8 : -8}px)`, opacity: 0 },
    ], 460).then(() => copy.remove()))).then(() => clip.remove());
    return origin;
  }

  function flashStation(kitchen, stationId) {
    const canvas = root.querySelector('#kitchen');
    const station = stationsFor(kitchen).find(s => s.id === stationId);
    if (!canvas?.width || !canvas.height || !station) return;
    const view = canvas.getBoundingClientRect();
    const world = worldFor(kitchen);
    const xScale = view.width / canvas.width;
    const yScale = view.height / canvas.height;
    const rect = {
      left: view.left + (station.x + (canvas.width - world.width) / 2) * xScale,
      top: view.top + (station.y + (canvas.height - world.height) / 2) * yScale,
      width: station.w * xScale, height: station.h * yScale,
    };
    const flash = document.createElement('div');
    flash.className = 'score-fx-station';
    place(flash, rect);
    layer.append(flash);
    void animate(flash, [{ opacity: 1 }, { opacity: 0 }], 430).then(() => flash.remove());
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function hudAnchor() {
    const rect = score.getBoundingClientRect();
    const y = rect.bottom + 22;
    const orders = queue.getBoundingClientRect();
    const x = Math.min(layer.clientWidth - 37, Math.max(37, rect.left + rect.width / 2));
    const overOrders = orders.left < x + 34 && orders.right > x - 34 && orders.top < y + 15 && orders.bottom > y - 15;
    return { x, y: Math.max(23, Math.min(layer.clientHeight - 45, overOrders ? orders.bottom + 17 : y)) };
  }

  async function floatDelta(delta, source) {
    const loss = delta < 0;
    const end = score.getBoundingClientRect();
    const origin = !loss && source && source.y >= 18 && source.y <= layer.clientHeight - 22 ? source : hudAnchor();
    const dx = end.left + end.width / 2 - origin.x;
    const dy = Math.max(end.top + end.height / 2, 10) - origin.y;
    const el = document.createElement('span');
    el.className = `score-fx-delta ${loss ? 'score-fx-loss' : 'score-fx-win'}`;
    el.textContent = loss ? `\u2212${-delta}` : `+${delta}`;
    el.style.left = `${origin.x}px`;
    el.style.top = `${origin.y}px`;
    layer.append(el);
    await animate(el, loss ? [
      { transform: 'translate(-50%, -50%) scale(.65)', opacity: 0 },
      { transform: 'translate(-50%, -30%) scale(1.15)', opacity: 1, offset: .23 },
      { transform: 'translate(-50%, 32%) scale(.95)', opacity: 1, offset: .64 },
      { transform: 'translate(-50%, 65%) scale(.85)', opacity: 0 },
    ] : [
      { transform: 'translate(-50%, -50%) scale(.65)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.16)', opacity: 1, offset: .21 },
      { transform: `translate(calc(-50% + ${dx * .58}px), calc(-50% + ${dy * .65}px - 10px)) scale(.92)`, opacity: 1, offset: .59 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`, opacity: 0 },
    ], 620, 'linear');
    el.remove();
  }

  function sync(kitchen) {
    const label = `${heldScore ?? kitchen.score} / ${kitchen.targetScore}`;
    if (score.textContent !== label) score.textContent = label;
  }

  async function play(kitchen, { served, missed }, onPass) {
    clear();
    const id = run;
    if (served && !missed) heldScore = kitchen.score - ORDER_POINTS;
    const cues = [];
    if (missed?.length) {
      ticketExit(missed, true);
      cues.push(floatDelta(-ORDER_PENALTY * missed.length));
    }
    if (served) {
      const station = flashStation(kitchen, served.stationId);
      const ticket = ticketExit([served.id], false);
      cues.push(floatDelta(ORDER_POINTS, ticket || station));
    }
    await Promise.all(cues);
    if (id !== run) return;
    heldScore = null;
    sync(kitchen);
    void animate(score, [
      { scale: 1 },
      { scale: served ? 1.15 : .94, color: served ? '#975d09' : '#b13d3d' },
      { scale: 1 },
    ], 260);
    if (!served || !kitchen.delivered) return;
    const badge = document.createElement('span');
    const { x, y } = hudAnchor();
    badge.className = 'score-fx-pass';
    badge.textContent = '\u2713 达标';
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
    layer.append(badge);
    onPass();
    await animate(badge, [
      { opacity: 0, transform: 'translate(-50%, -38%)' },
      { opacity: 1, transform: 'translate(-50%, -50%)', offset: .2 },
      { opacity: 1, transform: 'translate(-50%, -50%)', offset: .85 },
      { opacity: 0, transform: 'translate(-50%, -50%)' },
    ], 520);
    badge.remove();
  }

  return { sync, play, destroy: clear };
}
