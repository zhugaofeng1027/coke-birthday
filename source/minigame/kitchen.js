import {
  APPLIANCES, PLAYER_SPEED, canChop, createKitchen, interact, nearestStation,
  setKitchenLayout, stationDistance, stationsFor, stepKitchen, worldFor,
} from '../src/cooking.js';
import { CHOP_BEAT } from '../src/kitchen-sounds.js';

const CHEF_RADIUS = 19;
const EDGE = 24 + CHEF_RADIUS;

export function createFirstKitchen() {
  const k = createKitchen(0);
  k.touchControlsDemo = true;
  setKitchenLayout(k, true);
  return k;
}

export function moveChef(k, x, y, seconds) {
  const { width, height } = worldFor(k);
  const stations = stationsFor(k);
  const magnitude = Math.max(1, Math.hypot(x, y));
  const dx = x / magnitude * PLAYER_SPEED * seconds;
  const dy = y / magnitude * PLAYER_SPEED * seconds;
  const player = k.player;
  const free = (px, py) => stations.every(s => stationDistance({ x: px, y: py }, s) >= CHEF_RADIUS);
  const targetX = Math.min(width - EDGE, Math.max(EDGE, player.x + dx));
  const targetY = Math.min(height - EDGE, Math.max(EDGE, player.y + dy));
  if (free(targetX, player.y)) player.x = targetX;
  if (free(player.x, targetY)) player.y = targetY;
}

export function createKitchenRuntime({ onCue, onScore, onClue }) {
  const k = createFirstKitchen();
  let facing = 1;
  let gait = 0;
  let moving = false;
  let chopping = false;
  let action = null;
  let serving = null;

  function operate(now, id) {
    if (k.delivered || k.expired) return;
    const station = id ? stationsFor(k).find(s => s.id === id) : nearestStation(k);
    const held = k.holding;
    const portions = held?.contents?.length;
    const job = k[station?.id]?.item;
    const score = k.score;
    interact(k, station?.id);
    if (k.score !== score) {
      serving = { stationId: k.lastServedOrder.stationId, time: now };
      onCue('serve');
      onScore(k.score - score, now);
    } else if (station && (held !== k.holding || portions !== k.holding?.contents?.length || job !== k[station.id]?.item)) {
      action = { stationId: station.id, time: now };
      onCue(station.type === 'oven' ? 'oven' : !held && k.holding ? 'take' : 'place');
    }
    if (k.puzzle.openRequested) {
      k.puzzle.openRequested = false;
      onClue();
    }
  }

  return {
    k,
    operate,
    step(seconds, input, now) {
      if (k.delivered || k.expired) { moving = chopping = false; return; }
      const { x, y, cut } = input;
      const vector = Math.hypot(x, y);
      chopping = cut && vector < .1 && canChop(k);
      const before = { ...k.player };
      if (!chopping && vector > 0) moveChef(k, x, y, seconds);
      const dx = k.player.x - before.x;
      const distance = Math.hypot(dx, k.player.y - before.y);
      moving = distance > .15;
      if (moving) {
        gait += distance / 11;
        if (Math.abs(dx) > .15) facing = Math.sign(dx);
      } else if (chopping) {
        const board = stationsFor(k).find(s => s.id === 'board');
        facing = board.x + board.w / 2 < k.player.x ? -1 : 1;
      }
      const { score, board: { progress } } = k;
      const ids = APPLIANCES.flat();
      const ready = ids.map(id => k[id].ready);
      stepKitchen(k, seconds, chopping);
      if (chopping && Math.floor(k.board.progress / CHOP_BEAT) > Math.floor(progress / CHOP_BEAT)) onCue('chop');
      if (ids.some((id, i) => !ready[i] && k[id].ready)) onCue('seal');
      if (score !== k.score) onScore(k.score - score, now);
    },
    pose(now) {
      const active = (effect, duration) => {
        if (!effect || now - effect.time >= duration) return null;
        return { stationId: effect.stationId, age: (now - effect.time) / 1000 };
      };
      return { moving, chopping, polish: { facing, gait, reduced: false, action: active(action, 520), serving: active(serving, 680) } };
    },
  };
}
