import { art, drawChef, drawRound as round, drawEllipse as ellipse, drawLine as line, drawHeart as heart } from './art.js';
import { stationsFor, DISHES, INGREDIENTS, CHOP_SECONDS, WORLD, worldFor, nearestStation, isHeartJam } from './cooking.js';
import { THEMES, SPICES } from './themes.js';
import { paintMemoryTable } from './memory-photo.js';
import { paintBento } from './bento-art.js';
import { CHOP_BEAT } from './kitchen-sounds.js';

const images = new Map();
function ingredientImage(id) {
  if (!images.has(id)) { const image = new Image(); image.src = art(id, 180); images.set(id, image); }
  return images.get(id);
}
function food(c, item, x, y, size = 65) {
  if (!item) return;
  if (item.type === 'plate') { plate(c, item, x, y, size); return; }
  if (item.type === 'bento') { paintBento(c, 3, x, y, size * 1.25); return; }
  if (item.type === 'spice') { spice(c, item.id, x, y, size * .65); return; }
  if (item.type === 'spicebag') {
    round(c, x - size * .28, y - size * .22, size * .56, size * .55, 8, '#ead8ad', '#ab9675');
    line(c, [[x - size * .25, y - size * .2], [x + size * .25, y - size * .2]], '#b38768', 4);
    item.spices.forEach((id, i) => spice(c, id, x + (i - 1) * size * .16, y + size * .07, size * .2));
    return;
  }
  const image = ingredientImage(item.id);
  if (!image.complete) return;
  c.save();
  if (item.id === 'jam') {
    ellipse(c, x, y, size * .38, size * .2, isHeartJam(item) ? '#bb658b' : '#9ca96c');
    if (isHeartJam(item)) heart(c, x, y, size * .35, '#ffe9df');
    else item.fruits?.forEach((id, i) => food(c, { id, method: 'fresh' }, x + (i - .5) * size * .3, y, size * .4));
    c.restore(); return;
  }
  if (item.id === 'mint' && item.method === 'pot') {
    round(c, x - size * .3, y - size * .23, size * .6, size * .5, 6, '#f7f1dc', '#91a99b');
    ellipse(c, x, y - size * .21, size * .3, size * .12, '#a9bf8e');
    c.strokeStyle = '#91a99b'; c.lineWidth = 3; c.beginPath(); c.arc(x + size * .3, y, size * .15, -Math.PI / 2, Math.PI / 2); c.stroke();
    c.restore(); return;
  }
  if (item.id === 'rice') {
    ellipse(c, x, y + 9, size * .4, size * .23, '#c6b5d0');
    ellipse(c, x, y, size * .4, size * .23, '#fffbed');
    for (let i = 0; i < 8; i++) ellipse(c, x + (i % 4 - 1.5) * size * .14, y + (Math.floor(i / 4) - .5) * size * .13, 3, 5, '#d7d4bc');
    c.restore(); return;
  }
  if (item.method !== 'fresh') { ellipse(c, x, y + 12, size * .44, size * .28, item.method === 'oven' ? '#d9b38b' : '#d4d8a8'); }
  if (item.cut && INGREDIENTS[item.id].cut) {
    for (const [dx, dy, angle] of [[-14, -7, -.2], [13, -5, .2], [-2, 13, .1]]) {
      c.save(); c.translate(x + dx * size / 65, y + dy * size / 65); c.rotate(angle);
      c.drawImage(image, -size * .28, -size * .28, size * .56, size * .56); c.restore();
    }
  } else c.drawImage(image, x - size / 2, y - size / 2, size, size);
  if (item.id === 'bread' && item.spread) {
    round(c, x - size * .19, y - size * .14, size * .38, size * .4, size * .07, '#bb658b');
    heart(c, x, y + size * .1, size * .23, '#ffecdf');
  }
  c.restore();
}
function plate(c, value, x, y, size = 85) {
  ellipse(c, x, y + 6, size * .55, size * .34, '#bdc3b6');
  ellipse(c, x, y, size * .55, size * .34, '#fffdf1');
  ellipse(c, x, y - 1, size * .43, size * .25, '#e8ecdc');
  const contents = value?.contents.some(i => i.id === 'bread' && i.spread) ? value.contents.filter(i => i.id !== 'jam') : value?.contents;
  const offsets = contents?.length > 1 ? [[-15, -4], [15, -2], [0, 11]] : [[0, -2]];
  contents?.forEach((item, i) => food(c, item, x + offsets[i][0], y + offsets[i][1], size * (item.spread ? .85 : .52)));
}
function spice(c, id, x, y, size) {
  c.save(); c.translate(x, y);
  if (id === 'anise') {
    for (let i = 0; i < 8; i++) {
      c.save(); c.rotate(i * Math.PI / 4);
      ellipse(c, 0, -size * .25, size * .09, size * .25, '#986c54'); c.restore();
    }
    ellipse(c, 0, 0, size * .1, size * .1, '#d7ac76');
  } else if (id === 'cinnamon') {
    for (const xx of [-size * .13, size * .13]) {
      round(c, xx - size * .09, -size * .4, size * .18, size * .8, 3, '#ad7653');
      line(c, [[xx, -size * .3], [xx, size * .3]], '#dfb084', 2);
    }
  } else if (id === 'bay') {
    c.rotate(.4); ellipse(c, 0, 0, size * .22, size * .43, '#86a878');
    line(c, [[0, -size * .3], [0, size * .4]], '#c4d19b', 2);
  } else {
    c.rotate(.35); ellipse(c, 0, 0, size * .14, size * .4, '#d8736e');
    line(c, [[0, -size * .35], [size * .06, -size * .5]], '#789c75', 3);
  }
  c.restore();
}
function label(c, text, x, y, color = '#657b67', font = 19) {
  c.fillStyle = color; c.font = `500 ${font}px "PingFang SC", sans-serif`; c.textAlign = 'center'; c.fillText(text, x, y);
}
function meter(c, x, y, w, ratio, ready = false) {
  round(c, x, y, w, 9, 4, '#d6ddce');
  if (ratio > 0) round(c, x, y, Math.max(9, w * ratio), 9, 4, ready ? '#86ad7c' : '#e2b668');
}
const COUNTER_MATERIALS = {
  board: ['#997960', '#e8cfad'],
  pot: ['#7f9b8f', '#dce9e2'], oven: ['#81948f', '#e1ede8'],
  plates: ['#929eb2', '#e2eaf0'], plating: ['#7e9a80', '#e4edd8'],
  trash: ['#969f91', '#e8eadd'],
  spice: ['#a49377', '#f0dfc3'], 'photo-table': ['#a3887e', '#f9e9d4'],
  lamp: ['#9696af', '#efe6cf'], flowers: ['#83998d', '#e7ece1'],
};
const ROOM_FINISHES = {
  fruit: { wall: '#d8e8d7', trim: '#88a99b', floor: ['#edf3e5', '#e1ead8'], grout: '#d5dfd1', glass: '#b9dbd1', view: '#9ebb8b', light: '#fff4b6a8', runner: '#d8b4ae', serve: '#86565e' },
  bento: { wall: '#ecdcd5', trim: '#a78f97', floor: ['#f1eaed', '#e8e1eb'], grout: '#ecdcd5', glass: '#b6d8d6', view: '#a6bda0', light: '#fff3bd97', runner: '#b6c9b7', serve: '#986c76' },
  spice: { wall: '#59727c', trim: '#3f555e', floor: ['#e5e9e8', '#d6dedf'], grout: '#cbd5d5', glass: '#758ba1', view: '#546b76', light: '#c7ddf18c', runner: '#ceb99c', serve: '#755849' },
  memory: { wall: '#d1e3e4', trim: '#91a9af', floor: ['#eaf1ef', '#dce7e8'], grout: '#ccdadd', glass: '#b3d5da', view: '#c7ba9e', light: '#ffebbb9c', runner: '#dcb5a8', serve: '#895b54' },
  steam: { wall: '#737e9c', trim: '#545f79', floor: ['#ebeaf1', '#dedfea'], grout: '#cfd0df', glass: '#7d8caa', view: '#616e91', light: '#d7e6ff9b', runner: '#b7bbd0', serve: '#75674f' },
  finale: { wall: '#c9ded0', trim: '#8ba99b', floor: ['#ebf1e5', '#dfe9dc'], grout: '#d0ddd1', glass: '#b4d5c6', view: '#8da994', light: '#ffe7bb97', runner: '#d4aebb', serve: '#86576c' },
};
function counter(c, s, theme) {
  const { x, y, w, h } = s;
  const bento = theme.kind === 'bento';
  const material = s.type === 'serve' ? [ROOM_FINISHES[theme.kind].serve, bento ? '#eed1cd' : theme.top]
    : s.type === 'puzzle' ? bento ? ['#bc8796', '#f3d8db'] : [theme.accent, theme.top]
      : s.type === 'stock' ? bento ? ['#a798b0', '#f3e7dc'] : [theme.counter, theme.top]
        : COUNTER_MATERIALS[s.type];
  const [base, top] = material ?? [theme.counter, theme.top];
  round(c, x + 6, y + h - 23, w - 8, 28, 7, '#5e59542b');
  round(c, x, y + 5, w, h - 5, 8, base, '#60595180');
  round(c, x + 6, y + h - 22, w - 12, 18, 4, '#fff8eb20');
  round(c, x, y, w, h - 23, 8, top, '#7d756e8c');
  line(c, [[x + 9, y + 4], [x + w - 9, y + 4]], '#fffdf5c9', 2);
  line(c, [[x + 5, y + h - 24], [x + w - 5, y + h - 24]], '#54483747', 2);
}
function actionMarks(c, s, action, reduced) {
  if (action?.stationId !== s.id || action.age > .34) return;
  const p = reduced ? 0 : action.age / .34;
  const cx = s.x + s.w / 2;
  c.save(); c.globalAlpha = (1 - p) * .92;
  const reach = Math.min(24, s.w * .29);
  for (const side of [-1, 1]) {
    const x = cx + side * (reach + p * Math.min(14, reach * .4));
    const y = s.y + 25 - p * 13;
    line(c, [[x, y + 7], [x + side * 7, y]], '#fff3bb', 3);
  }
  c.restore();
}
function animatedOven(c, s, job, action, reduced) {
  const { x, y, w } = s;
  const cx = x + w / 2;
  const swing = action?.stationId === 'oven' && !reduced ? Math.sin(Math.PI * action.age / .52) : 0;
  round(c, x + 11, y + 13, w - 22, 73, 6, '#587268', '#4d655e');
  round(c, x + 17, y + 20, w - 34, 48, 4, job.item ? '#d7a46a' : '#454f4b');
  line(c, [[x + 22, y + 60], [x + w - 22, y + 60]], '#b9b7a68c', 2);
  if (job.item) food(c, job.item, cx, y + 43, 62);
  const height = 48 - swing * 36;
  round(c, x + 16 - swing * 4, y + 69 - height, w - 32 + swing * 8, height, 4,
    job.item ? '#ffe3a52e' : '#adccc73b', '#4d6159');
  line(c, [[x + 26 - swing * 4, y + 74 - height], [x + w - 26 + swing * 4, y + 74 - height]], '#dce9df', 4);
  for (const dx of [28, 49, 70]) ellipse(c, x + dx, y + 78, 3.5, 3.5, '#bbc8b8');
  ellipse(c, x + w - 29, y + 78, 4, 4, job.item ? '#f9cb7f' : '#8ca393');
  if (job.item) {
    round(c, x + w - 55, y - 5, 49, 20, 4, job.ready ? '#e5eed3' : '#fff0d2', '#8f9c85');
    label(c, job.ready ? '已出炉' : `${Math.ceil(job.duration - job.elapsed)} 秒`, x + w - 31, y + 10, '#405246', 13);
    meter(c, x + 21, y + 89, w - 42, job.elapsed / job.duration, job.ready);
  }
  if (swing > 0) {
    c.save(); c.globalAlpha = swing * .52;
    for (const dx of [-13, 13]) line(c, [[cx + dx, y + 29], [cx + dx + 4, y + 20], [cx + dx, y + 12 - swing * 9]], '#fff0c9', 3);
    c.restore();
  }
}
function station(c, s, k, time, selected, chopping, polish) {
  const { x, y, w, h } = s;
  const theme = THEMES[k.chapter];
  const isHot = ['pot', 'oven'].includes(s.type);
  if (polish) counter(c, s, theme);
  else {
    round(c, x + 3, y + 11, w - 6, h, 8, '#556f702e');
    round(c, x, y, w, h, 8, s.type === 'serve' ? theme.accent : theme.counter, '#607b7977');
    round(c, x + 6, y + 5, w - 12, h - 28, 5, isHot ? '#e3e6df' : theme.top);
  }
  if (selected) {
    c.strokeStyle = '#f9d983'; c.lineWidth = 5; c.beginPath(); c.roundRect(x - 5, y - 5, w + 10, h + 10, 10); c.stroke();
  }
  const cx = x + w / 2;
  if (s.type === 'stock') {
    const id = DISHES[k.chapter].stock[Number(s.id.split('-')[1])];
    line(c, [[x + 10, y + 18], [x + 10, y + 65]], '#c6cfb9', 5);
    line(c, [[x + w - 10, y + 18], [x + w - 10, y + 65]], '#c6cfb9', 5);
    food(c, { type: 'ingredient', id, cut: false, method: 'fresh' }, cx, y + 37, 70);
    if (k.chapter === 0) {
      for (let i = 0; i < 5; i++) line(c, [[x + 17 + i * 29, y + 58], [x + 17 + i * 29, y + 74]], '#c9a67c', 3);
      line(c, [[x + 12, y + 64], [x + w - 12, y + 64]], '#c9a67c', 3);
    } else if (k.chapter === 1) {
      [x + 20, x + w - 20].forEach(xx => { ellipse(c, xx, y + 30, 4, 5, '#a79db7'); ellipse(c, xx, y + 40, 6, 2, '#e4afb8'); });
    } else if (k.chapter === 2) {
      round(c, x + 25, y + 5, w - 50, 6, 2, '#b4cac4');
    }
    label(c, INGREDIENTS[id].name, cx, y + h - 9, polish ? '#342e39' : '#516f57', 20);
    if (polish) actionMarks(c, s, polish.action, polish.reduced);
    return;
  }
  if (s.type === 'board') {
    round(c, x + 17, y + 12, w - 34, 54, 6, '#ba9770');
    round(c, x + 22, y + 16, w - 44, 44, 4, '#dec49b');
    if (polish) {
      for (const dy of [22, 32, 46, 54]) line(c, [[x + 27, y + dy], [x + w - 27, y + dy - 1]], '#a4755b39', 1.5);
      round(c, x + 25, y + 23, 5, 28, 2, '#a78161');
    }
    const choppingNow = chopping && k.board.item && !k.board.item.cut;
    const phase = k.board.progress / CHOP_BEAT % 1;
    const strike = polish && choppingNow && !polish.reduced;
    const lift = strike ? Math.sin(phase * Math.PI) * 25 : 0;
    food(c, k.board.item, cx, y + 34, strike ? 65 - Math.max(0, 1 - phase * 6) * 5 : 65);
    c.save();
    c.translate(strike ? cx + 13 : x + w - 28, y + 35 - lift);
    c.rotate(strike ? -1.35 + lift / 55 : choppingNow && !polish?.reduced ? Math.sin(time * 25) * .45 - .8 : -.7);
    round(c, -5, -24, 10, 29, 2, '#f2f2df', '#b4bcb0'); round(c, -4, 5, 8, 20, 2, '#8f9b86'); c.restore();
    if (strike && phase < .68 && k.board.progress >= CHOP_BEAT) {
      c.save(); c.globalAlpha = 1 - phase / .68;
      const color = INGREDIENTS[k.board.item.id].color;
      for (const [dx, dy, radius] of [[-20, -13, 4], [-9, -20, 3], [13, -17, 4], [22, -5, 2.5]]) {
        ellipse(c, cx + dx * (1 + phase), y + 35 + dy * phase * 2.4, radius, radius * .75, color);
      }
      c.restore();
    }
    if (k.board.item && !k.board.item.cut && INGREDIENTS[k.board.item.id].cut) meter(c, x + 12, y - 20, w - 24, k.board.progress / CHOP_SECONDS);
  } else if (s.type === 'pot') {
    const job = k.pot;
    round(c, x + 17, y + 14, w - 34, 54, 5, '#70877b');
    ellipse(c, cx, y + 56, 42, 13, '#4f675b');
    if (job.item && !job.ready && !job.waiting) {
      for (let i = -1; i <= 1; i++) ellipse(c, cx + i * 24, y + 53 + Math.sin(time * 8 + i) * 3, 7, 12, '#edbd67');
    }
    round(c, cx - 39, y + 22, 78, 35, 9, '#b98073');
    ellipse(c, cx, y + 24, 40, 13, '#e2a899'); ellipse(c, cx, y + 22, 32, 9, job.item?.id === 'jam' && job.ready ? isHeartJam(job.item) ? '#bb658b' : '#9ca96c' : job.item ? '#e6ba7e' : '#c18b7b');
    round(c, cx - 50, y + 32, 13, 10, 4, '#986d62'); round(c, cx + 37, y + 32, 13, 10, 4, '#986d62');
    if (k.chapter === 2 && k.broth.length) {
      ellipse(c, cx, y + 22, 31, 8, '#a77850');
      spice(c, 'anise', cx + 13, y + 20, 15);
    }
    if (job.item) {
      food(c, job.item, cx, y + 18, 45);
      for (let i = 0; i < (job.waiting ? 0 : 3); i++) {
        const shift = (time * 24 + i * 17) % 56;
        c.globalAlpha = (1 - shift / 56) * .7;
        line(c, [[cx - 18 + i * 18, y + 1 - shift], [cx - 25 + i * 18, y - 9 - shift], [cx - 16 + i * 18, y - 21 - shift]], '#fffdf1', 5); c.globalAlpha = 1;
        if (isHeartJam(job.item)) heart(c, cx - 18 + i * 18, y - shift - 12, 11, '#bd668c');
      }
      cookingTimer(c, job, x, y, w);
    }
  } else if (s.type === 'oven') {
    const job = k.oven;
    if (polish) animatedOven(c, s, job, polish.action, polish.reduced);
    else {
      round(c, x + 13, y + 16, w - 26, 62, 5, '#657d74'); round(c, x + 20, y + 24, w - 40, 45, 4, job.item ? '#dcab70' : '#a3b8ad');
      line(c, [[x + 27, y + 26], [x + w - 27, y + 26]], '#5d756b', 6);
      [29, 50, 71, 92].forEach(dx => ellipse(c, x + dx, y + 88, 5, 5, '#687b68'));
      if (job.item) { food(c, job.item, cx, y + 45, 62); cookingTimer(c, job, x, y, w); }
    }
  } else if (s.type === 'plates') {
    for (let i = 0; i < 3; i++) plate(c, null, cx, y + 53 - i * 10, 79);
  } else if (s.type === 'plating') {
    if (k.plating) plate(c, k.plating, cx, y + 27, 93);
    else { c.strokeStyle = '#c1b596'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.ellipse(cx, y + 26, 47, 21, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  } else if (s.type === 'spice') {
    round(c, x + 8, y + 17, w - 16, 30, 4, '#f1dfbd', '#bdac8a');
    round(c, x + 6, y + 10, w - 12, 8, 2, '#91aaa0');
    spice(c, s.spice, cx, y + 32, 25);
  } else if (s.type === 'photo-table') {
    c.save(); c.translate(cx, y + 26); c.scale(.11, .085);
    paintMemoryTable(c, !!k.photo.meal); c.restore();
    if (k.photo.meal) label(c, k.delivered ? '回忆已留下' : '拍一张合照', cx, y - 9, '#65848b', 16);
  } else if (s.type === 'serve') {
    round(c, x + 19, y + 14, w - 38, 30, 3, '#fff5de');
    const compact = w < 150;
    label(c, k.delivered ? '完美出餐！' : '为你上菜', polish ? cx - 12 : cx, y + 36, k.delivered ? '#719167' : '#bd8d79', polish ? (compact ? 12 : 17) : 20);
    if (polish) {
      const age = polish.serving?.stationId === s.id ? polish.serving.age : Infinity;
      const ringing = age < .68;
      const bellX = x + w - (compact ? 24 : 34);
      c.save(); c.translate(bellX, y + 33);
      if (compact) c.scale(.78, .78);
      if (ringing && !polish.reduced) c.rotate(Math.sin(age * 43) * (1 - age / .68) * .30);
      ellipse(c, 0, 3, 11, 5, '#a77b51');
      round(c, -9, -10, 18, 13, 6, ringing ? '#ffe69b' : '#dbb36e', '#a18158');
      ellipse(c, 0, -12, 3, 3, '#aa845b');
      c.restore();
      if (ringing && !polish.reduced) {
        c.save();
        c.globalAlpha = Math.max(0, 1 - age / .68);
        const dishY = y + 12 - (1 - Math.min(1, age * 7)) * 14;
        if (k.chapter === 1) paintBento(c, 3, cx + (compact ? 0 : 18), dishY, compact ? 44 : 62);
        else plate(c, null, cx, dishY, compact ? 43 : 58);
        for (const side of [-1, 1]) line(c, [[bellX + side * 12, y + 20], [bellX + side * (16 + age * 11), y + 14]], '#f2ba52', 3);
        c.restore();
      }
    }
  } else if (s.type === 'lamp') {
    line(c, [[x + 27, y + 19], [x + 27, y + 43]], '#ad9162', 5);
    ellipse(c, x + 27, y + 44, 17, 4, '#ad9162');
    c.beginPath(); c.moveTo(x + 10, y + 23); c.lineTo(x + 18, y + 7); c.lineTo(x + 36, y + 7); c.lineTo(x + 44, y + 23); c.closePath(); c.fillStyle = '#f1d08b'; c.fill();
    if (k.places.lamp) food(c, k.places.lamp, x + 77, y + 28, 40);
    else { c.setLineDash([3, 3]); c.strokeStyle = '#bca98b'; c.beginPath(); c.ellipse(x + 77, y + 30, 21, 13, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  } else if (s.type === 'flowers') {
    plant(c, x + 27, y + 28, true);
    if (k.places.flowers) food(c, k.places.flowers, x + 119, y + 25, 76);
    else plate(c, null, x + 119, y + 25, 65);
  } else if (s.type === 'puzzle') {
    if (k.chapter === 0) {
      round(c, x + 17, y + 10, 66, 54, 3, '#fffbeb');
      label(c, '♡ + ●●', cx, y + 39, '#c5778d', 18);
      line(c, [[x + 28, y + 51], [x + 70, y + 51]], '#a5b895', 3);
    } else if (k.chapter === 1) {
      paintBento(c, k.packing.step, cx, y + 35, 74, !!k.packing.meal || k.packing.step > 0);
      if (k.packing.meal) label(c, `${k.packing.step} / 3`, cx, y - 10, '#826c8e', 15);
    } else if (k.chapter === 2) {
      food(c, { type: 'spicebag', spices: k.spices }, cx, y + 33, 70);
      ['anise', 'cinnamon', 'bay'].forEach((id, i) => spice(c, id, x + 23 + i * 27, y - 18, 24));
      label(c, `${k.spices.length} / 3`, cx, y + 66, '#75694c', 15);
    } else if (k.chapter === 3) {
      round(c, x + 16, y + 8, 69, 58, 1, '#fffdf6');
      c.save(); c.translate(cx, y + 32); c.scale(.064, .064); paintMemoryTable(c); c.restore();
      line(c, [[cx - 10, y + 58], [cx + 10, y + 58]], '#d9bd9b', 2);
      label(c, '那天 · 和你', cx, y - 10, '#65848b', 15);
    } else if (k.chapter === 4) {
      round(c, x + 7, y + 8, w - 14, 79, 3, '#8ea5b5');
      round(c, x + 11, y + 12, w - 22, 71, 1, k.puzzle.steam >= 2 ? '#e1ece9' : '#bbcdd5');
      if (k.puzzle.steam >= 2) {
        label(c, '热茶留在灯旁', cx, y + 39, '#425e68', 18);
        label(c, '面包放在花下', cx, y + 65, '#425e68', 18);
      } else {
        label(c, '一层薄薄的雾', cx, y + 38, '#5c7686', 14);
        label(c, '等一杯热茶', cx, y + 65, '#5c7686', 14);
        if (k.puzzle.steam) meter(c, x + 15, y + 92, w - 30, k.puzzle.steam / 2);
      }
    } else {
      for (let i = 0; i < 3; i++) { ellipse(c, x + 24 + i * 26, y + 35, 10, 13, ['#8fac89', '#ce9991', '#e6b68e'][i]); label(c, String(i + 1), x + 24 + i * 26, y + 41, '#fff9ed', 15); }
    }
    if (k.puzzle.solved) { ellipse(c, x + w - 6, y + 5, 13, 13, '#779d88'); label(c, '✓', x + w - 6, y + 11, '#fffbed', 18); }
  } else if (s.type === 'trash') {
    round(c, x + 20, y + 22, w - 40, 46, 6, '#9ca898');
    round(c, x + 15, y + 15, w - 30, 13, 4, '#7d917b');
    line(c, [[cx - 10, y + 34], [cx + 10, y + 54]], '#d3ddc8', 4);
    line(c, [[cx + 10, y + 34], [cx - 10, y + 54]], '#d3ddc8', 4);
  }
  label(c, s.type === 'puzzle' ? theme.station : s.name, cx, y + h - 9, s.type === 'serve' ? '#fff6eb' : polish ? '#282f30' : '#425c55', s.type === 'puzzle' ? 16 : 18);
  if (polish && s.type !== 'oven') actionMarks(c, s, polish.action, polish.reduced);
  if (polish?.serving?.stationId === s.id && s.type !== 'serve') {
    actionMarks(c, s, polish.serving, polish.reduced);
  }
}
function cookingTimer(c, job, x, y, w) {
  round(c, x + 3, y - 49, w - 6, 26, 5, '#fffaf0');
  label(c, job.waiting ? '水果 1 / 2' : job.ready ? job.item.id === 'jam' ? isHeartJam(job.item) ? '爱心果酱！' : '换一种水果？' : '好啦！' : `${Math.ceil(job.duration - job.elapsed)} 秒`, x + w / 2, y - 30, job.ready ? '#7a9e6c' : '#ad9667', 17);
  meter(c, x + 9, y - 17, w - 18, job.elapsed / job.duration, job.ready);
}

function plant(c, x, y, flower = false) {
  round(c, x - 9, y, 18, 23, 4, '#d5a99b');
  for (const [dx, dy] of [[-13, -12], [10, -23], [0, -35]]) {
    line(c, [[x, y + 3], [x + dx, y + dy]], '#7b9c7f', 3);
    if (flower) {
      for (let i = 0; i < 5; i++) ellipse(c, x + dx + Math.cos(i * 1.256) * 7, y + dy + Math.sin(i * 1.256) * 7, 5, 5, '#dea0b7');
      ellipse(c, x + dx, y + dy, 4, 4, '#f6d88a');
    } else ellipse(c, x + dx, y + dy, 13, 7, '#90b99c');
  }
}
function roomWindow(wide) {
  const wall = wide ? 61 : 116;
  const sill = wall - 14;
  const lintel = wide ? 5 : 14;
  return { wall, win: wide ? 450 : 285, sill, lintel, paneHeight: sill - lintel - 12 };
}
function layeredRoom(c, k, offsetX, offsetY) {
  const { width, height } = worldFor(k);
  const wide = k.layout === 'landscape';
  const theme = THEMES[k.chapter];
  const finish = ROOM_FINISHES[theme.kind];
  const { wall, win, sill, lintel, paneHeight } = roomWindow(wide);
  const left = -offsetX; const top = -offsetY;
  const fullWidth = c.canvas.width;
  c.fillStyle = finish.wall; c.fillRect(left, top, fullWidth, c.canvas.height);
  c.fillStyle = finish.grout; c.fillRect(left, wall, fullWidth, height + offsetY - wall);
  for (let y = wall, row = 0; y < height + offsetY; y += 56, row++) {
    for (let x = -Math.ceil(offsetX / 64) * 64, col = 0; x < width + offsetX; x += 64, col++) {
      c.fillStyle = finish.floor[(row + col) % 2];
      c.fillRect(x, y, 63, 55);
    }
  }
  const floorShade = c.createLinearGradient(0, wall, 0, height + offsetY);
  floorShade.addColorStop(0, '#7262792b'); floorShade.addColorStop(.24, '#72627900'); floorShade.addColorStop(1, '#72627913');
  c.fillStyle = floorShade; c.fillRect(left, wall, fullWidth, height + offsetY - wall);
  for (let x = -Math.ceil(offsetX / 39) * 39; x < width + offsetX; x += 39) {
    line(c, [[x, top], [x, wall - 6]], '#ba9c911f', 1);
  }
  round(c, left, wall - 8, fullWidth, 8, 0, finish.trim);
  line(c, [[left, wall - 8], [left + fullWidth, wall - 8]], '#fff2e1aa', 2);

  round(c, win - 6, lintel + 3, 294, sill - lintel + 9, 5, '#7c667844');
  round(c, win, lintel, 280, sill - lintel, 5, '#f9eee2', '#ac8983');
  for (let i = 0; i < 4; i++) {
    const x = win + 7 + i * 67;
    round(c, x, lintel + 6, 63, paneHeight, 1, finish.glass);
    round(c, x, sill - 13, 63, 7, 0, finish.view);
    if (theme.kind === 'steam' && i === 2) {
      const cy = lintel + 6 + paneHeight / 2;
      ellipse(c, x + 44, cy, 9, 9, '#fff2c9');
      ellipse(c, x + 48, cy - 3, 8, 8, finish.glass);
    } else if (theme.kind !== 'spice') {
      line(c, [[x + 9, sill - 9], [x + 29, lintel + 10]], '#f3f5dc9e', 3);
    }
    if (theme.kind === 'fruit') {
      ellipse(c, x + 45, sill - 13, 12, 6, '#7ea87d');
      ellipse(c, x + 44, sill - 15, 3.5, 3.5, '#e0a08e');
    }
    const beam = c.createLinearGradient(0, wall, 0, wall + 220);
    beam.addColorStop(0, finish.light); beam.addColorStop(1, `${finish.light.slice(0, 7)}00`);
    c.fillStyle = beam; c.beginPath();
    c.moveTo(x, wall); c.lineTo(x + 60, wall); c.lineTo(x + 252, wall + 220); c.lineTo(x + 172, wall + 220);
    c.closePath(); c.fill();
  }
  round(c, win - 9, sill - 1, 298, 7, 2, '#f8eee0', '#ad8f86');
  if (theme.kind === 'memory') {
    const x = win - 91;
    round(c, x, lintel + 7, 62, sill - lintel - 3, 3, '#fcf5e6', '#9d8271');
    c.save(); c.translate(x + 31, (lintel + sill) / 2 + 3);
    c.scale(.045, Math.min(.07, paneHeight / 880));
    paintMemoryTable(c); c.restore();
  } else plant(c, win - 30, sill - 12, theme.kind !== 'steam');
  const shelfColors = theme.kind === 'spice' ? ['#d89863', '#d8b077', '#bc866e']
    : theme.kind === 'fruit' ? ['#de9a96', '#b1a5c6', '#e2ba88'] : ['#b99bac', '#b5c5a8', '#dcae99'];
  for (const i of [0, 1, 2]) {
    round(c, win + 325 + 18 * i, sill - 19 - 5 * i, 12, 19 + 5 * i, 3, shelfColors[i], '#87746c');
    line(c, [[win + 327 + 18 * i, sill - 11], [win + 335 + 18 * i, sill - 11]], '#fff2d2', 2);
  }
  line(c, [[win + 317, sill + 1], [win + 383, sill + 1]], '#a5877b', 5);

  const mat = wide ? [303, 366, 691, 127] : [223, 594, 503, 110];
  round(c, mat[0] + 4, mat[1] + 5, mat[2], mat[3], 12, '#79715e24');
  round(c, ...mat, 12, finish.runner, finish.trim);
  c.save(); c.setLineDash([4, 5]);
  round(c, mat[0] + 10, mat[1] + 10, mat[2] - 20, mat[3] - 20, 7, null, '#f1f3dc');
  c.restore();
  for (let y = mat[1] + 16; y < mat[1] + mat[3] - 12; y += 6) {
    line(c, [[mat[0] + 14, y], [mat[0] + mat[2] - 14, y]], '#7f9a8a1f', 1);
  }
  if (theme.kind === 'finale') {
    for (const x of [wide ? 235 : 73, wide ? 950 : 690]) {
      line(c, [[x, lintel + 4], [x + 54, lintel + 16], [x + 108, lintel + 4]], '#59796c', 2);
      for (let i = 0; i < 5; i++) ellipse(c, x + 9 + i * 22, lintel + 9 + Math.sin(i * Math.PI / 4) * 11, 4, 5, '#fff0a5');
    }
  }
  if (wide) {
    plant(c, 1002, 125, theme.kind !== 'steam');
    plant(c, 255, 468);
  } else if (theme.kind !== 'bento') {
    label(c, theme.name, 420, 283, '#5e6b62', theme.kind === 'finale' ? 20 : 23);
    for (const x of [16, width - 16]) plant(c, x, 463, ['fruit', 'finale'].includes(theme.kind));
    if (theme.kind === 'finale') {
      label(c, '一路收好的小幸福', 115, 540, '#657d6f', 12);
    }
  }
  for (const { x, y, w, h } of stationsFor(k)) {
    round(c, x + 12, y + 15, w + 4, h, 10, '#64596b13');
    round(c, x + 5, y + 8, w + 4, h, 9, '#54495722');
  }
}
const roomCache = new WeakMap();
function paintLayeredRoom(c, k, time, offsetX, offsetY) {
  const { width, height } = c.canvas;
  const key = `${k.chapter}:${k.layout}:${width}:${height}`;
  let room = roomCache.get(c.canvas);
  if (room?.key !== key) {
    const bitmap = document.createElement('canvas');
    bitmap.width = width; bitmap.height = height;
    const art = bitmap.getContext('2d');
    art.translate(offsetX, offsetY);
    layeredRoom(art, k, offsetX, offsetY);
    room = { key, bitmap };
    roomCache.set(c.canvas, room);
  }
  c.drawImage(room.bitmap, -offsetX, -offsetY);
  const wide = k.layout === 'landscape';
  if (k.chapter === 2) {
    const { win, lintel, paneHeight } = roomWindow(wide);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = win + 18 + i * 67 + j * 13;
      const y = lintel + 8 + (time * 41 + j * 12 + i * 5) % (paneHeight - 11);
      line(c, [[x, y], [x - 3, y + 6]], '#c4d9f089', 1.7);
    }
  } else if (k.chapter === 5 && !wide) {
    ['candy', 'charm', 'snacks', 'film', 'candle'].forEach((id, i) => {
      const img = ingredientImage(id); if (img.complete) c.drawImage(img, 58 + i * 24, 484, 30, 35);
    });
  }
}
function wideBackground(c, k, time, offsetX, offsetY) {
  const { width, height } = worldFor(k);
  const theme = THEMES[k.chapter];
  c.fillStyle = theme.floor[0];
  c.fillRect(-offsetX, -offsetY, c.canvas.width, c.canvas.height);
  for (let y = -Math.ceil(offsetY / 58) * 58; y < height + offsetY; y += 58) {
    for (let x = -Math.ceil(offsetX / 60) * 60; x < width + offsetX; x += 60) {
      c.fillStyle = theme.floor[Math.abs(x / 60 + y / 58) % 2];
      c.fillRect(x + 1, y + 1, 58, 56);
      if (k.chapter === 3) line(c, [[x + 1, y + 28], [x + 58, y + 28]], '#bfd2d777', 1);
    }
  }
  round(c, -offsetX, -offsetY, c.canvas.width, 7, 0, theme.counter);
  round(c, -offsetX, 7 - offsetY, c.canvas.width, 3, 0, theme.wall);
  round(c, 299, 378, 685, 100, 8, `${theme.counter}22`);
  plant(c, 1015, 121, true);
  plant(c, 209, 282, k.chapter === 5);
  if (k.chapter === 2) {
    for (let i = 0; i < 12; i++) {
      const y = (time * 90 + i * 39) % 450 + 40;
      line(c, [[1245, y], [1240, y + 15]], '#93b7c4', 2);
    }
  }
  if (k.chapter === 5) {
    line(c, [[190, 32], [480, 44], [770, 30], [1020, 42]], '#86a38c', 2);
    for (let i = 0; i < 17; i++) ellipse(c, 210 + i * 48, 32 + Math.sin(i * .6) * 6, 4, 6, '#ffe7a0');
  }
}
function background(c, k, time) {
  const { width, height } = WORLD;
  const theme = THEMES[k.chapter];
  c.fillStyle = theme.floor[0]; c.fillRect(0, 0, width, height);
  for (let y = 96; y < height; y += 58) for (let x = 0; x < width; x += 60) {
    c.fillStyle = theme.floor[(x / 60 + (y - 96) / 58) % 2]; c.fillRect(x + 1, y + 1, 58, 56);
    if (k.chapter === 1) ellipse(c, x + 30, y + 29, 2, 2, '#c7bbd3');
    if (k.chapter === 3) line(c, [[x + 1, y + 28], [x + 58, y + 28]], '#bfd2d777', 1);
  }
  round(c, 0, 0, width, 111, 0, theme.wall); round(c, 0, 103, width, 14, 0, theme.counter);
  if (k.chapter === 0) {
    for (let x = 20; x < 840; x += 160) { line(c, [[x, 0], [x, 132]], '#fff9d4', 5); line(c, [[x, 0], [x + 110, 117]], '#f6f2d680', 2); }
  }
  round(c, 327, 13, 186, 81, 5, '#a5b9aa');
  round(c, 334, 19, 172, 69, 2, [2, 4].includes(k.chapter) ? '#6f819d' : '#c2ddda');
  ellipse(c, 474, 38, 12, 12, '#f8e8ac'); round(c, 416, 19, 7, 70, 0, '#fff6df'); round(c, 334, 54, 173, 6, 0, '#fff6df');
  if (k.chapter === 0) round(c, 91, 17, 128, 69, 4, '#e4ede2', '#b5c9b6');
  label(c, 'BIRTHDAY', 155, 43, '#7b8c83', 17); label(c, 'BISTRO', 155, 69, '#6f8179', 21);
  round(c, 620, 28, 116, 52, 4, '#ffedd3', '#cfb9a0'); label(c, '只为你营业', 678, 61, '#b28f7c', 18);
  label(c, theme.name, 420, 283, theme.counter, k.chapter === 5 ? 20 : 23);
  if (k.chapter === 0) {
    [12, 828].forEach(x => { line(c, [[x, 155], [x, 540]], '#82af96', 4); for (let y = 165; y < 550; y += 48) ellipse(c, x + (y % 2 ? 5 : -5), y, 12, 8, '#92bca0'); });
    for (let i = 0; i < 3; i++) { round(c, 53 + i * 33, 490, 24, 32, 5, ['#dd9595', '#b6a1c5', '#e1bf86'][i]); round(c, 52 + i * 33, 487, 26, 7, 2, '#f6efcc'); }
  } else if (k.chapter === 1) {
    for (let x = 60; x < 800; x += 175) {
      round(c, x - 7, 121, 168, 12, 3, '#c8b5d2');
      round(c, x + 13, 244, 128, 7, 2, '#c8b5d244');
    }
  } else if (k.chapter === 2) {
    for (let x = 0; x < width; x += 42) round(c, x, 117, 42, 15, 0, (x / 42) % 2 ? '#f6d9ad' : '#cf8582');
    for (let i = 0; i < 20; i++) { const y = (time * 90 + i * 39) % 550 + 130; line(c, [[825, y], [820, y + 15]], '#93b7c4', 2); }
    [32, 805].forEach(x => { round(c, x - 12, 247, 24, 44, 10, '#ebbd84'); line(c, [[x, 239], [x, 247]], '#8c8980', 2); });
  } else if (k.chapter === 3) {
    for (let i = 0; i < 4; i++) {
      const x = 35 + i * 207;
      line(c, [[x, 119], [x + 132, 119]], '#b28f79', 2);
      round(c, x + 39, 119, 55, 13, 0, '#fffdf3');
    }
  } else if (k.chapter === 4) {
    [13, 825].forEach(x => [285, 490, 685].forEach(y => plant(c, x, y)));
  } else {
    [13, 825].forEach(x => [300, 500, 690].forEach(y => plant(c, x, y, true)));
    line(c, [[25, 248], [230, 262], [420, 250], [620, 262], [815, 248]], '#86a38c', 2);
    for (let i = 0; i < 16; i++) ellipse(c, 39 + i * 50, 255 + Math.sin(i * .6) * 6, 4, 6, k.puzzle.solved ? '#ffe7a0' : '#c3d3bc');
    ['candy', 'charm', 'snacks', 'film', 'candle'].forEach((id, i) => {
      const img = ingredientImage(id); if (img.complete) c.drawImage(img, 58 + i * 24, 484, 30, 35);
    });
    label(c, '一路收好的小幸福', 115, 540, '#85a08c', 12);
  }
  round(c, 218, 593, 486, 116, 8, `${theme.counter}22`);
}

export function paintKitchen(c, k, time, moving = false, chopping = false, polish = null) {
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  const world = worldFor(k);
  const offsetX = (c.canvas.width - world.width) / 2;
  const offsetY = (c.canvas.height - world.height) / 2;
  c.save();
  c.translate(offsetX, offsetY);
  if (polish) paintLayeredRoom(c, k, polish.reduced ? 0 : time, offsetX, offsetY);
  else if (k.layout === 'landscape') wideBackground(c, k, time, offsetX, offsetY);
  else background(c, k, time);
  // Sort by feet/worktop depth so the chef can walk behind the kitchen island.
  const selected = nearestStation(k)?.id;
  const objects = stationsFor(k).map(s => ({ depth: s.y + s.h, paint: () => station(c, s, k, time, selected === s.id, chopping, polish) }));
  objects.push({ depth: k.player.y, paint: () => {
    if (polish) {
      ellipse(c, k.player.x, k.player.y + 4, 33, 12, '#46554b25');
      ellipse(c, k.player.x, k.player.y + 3, 23, 7, '#3a4c4248');
    } else {
      ellipse(c, k.player.x, k.player.y + 5, 28, 10, '#9cae9040');
      c.strokeStyle = '#c48a74'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(k.player.x, k.player.y + 5, 25, 10, 0, 0, Math.PI * 2); c.stroke();
    }
    const carrying = k.holding?.type === 'plate' || k.holding?.type === 'bento';
    const stride = polish && !polish.reduced && moving ? Math.sin(polish.gait) : 0;
    const cutLean = polish && !polish.reduced && chopping ? Math.cos(k.board.progress / CHOP_BEAT * 2 * Math.PI) : 0;
    const touch = polish?.action && !polish.reduced && !moving ? Math.sin(Math.PI * polish.action.age / .52) : 0;
    const bob = !polish || polish.reduced ? 0 : moving ? -Math.abs(stride) * (carrying ? 2.3 : 5) : Math.sin(time * 2.8) * 1.4 + cutLean + touch * 2;
    c.save();
    c.translate(k.player.x, k.player.y);
    if (k.layout === 'landscape') c.scale(1.14, 1.14);
    drawChef(c, 0, -48, THEMES[k.chapter].accent, moving ? time * 6 : time * .4, false,
      polish ? { facing: polish.facing, stride, bob, lean: stride * (carrying ? .018 : .065) + cutLean * .08 + touch * .04 } : null);
    c.restore();
    const handsY = k.player.y - (polish && carrying ? 31 : 24) + bob - touch * 9;
    if (polish && carrying && k.holding.type === 'plate' && !polish.reduced && k.holding.contents.some(item => item.method !== 'fresh')) {
      for (let i = 0; i < 2; i++) {
        const shift = (time * 25 + i * 15) % 29;
        c.globalAlpha = (1 - shift / 29) * .65;
        line(c, [[k.player.x - 9 + i * 17, handsY - 8 - shift], [k.player.x - 12 + i * 17, handsY - 15 - shift]], '#fffdf6', 3);
      }
      c.globalAlpha = 1;
    }
    if (k.holding) food(c, k.holding, k.player.x + 4, handsY, k.holding.type === 'plate' ? 56 : 49);
    if (polish && carrying) {
      ellipse(c, k.player.x - 17, handsY + 5, 5.5, 5, '#f2c7a5');
      ellipse(c, k.player.x + 25, handsY + 5, 5.5, 5, '#f2c7a5');
    } else if (polish && !polish.reduced && (chopping || touch) && !k.holding) {
      const handX = k.player.x + polish.facing * (22 + (chopping ? 4 + cutLean * 5 : touch * 9));
      const handY = handsY - (chopping ? 7 + cutLean * 5 : 0);
      line(c, [[k.player.x + polish.facing * 13, handsY - 4], [handX, handY]], '#fff6e6', 8);
      ellipse(c, handX, handY, 6, 5, '#f2c7a5');
    }
    if (k.chapter === 4 && (k.holding?.id === 'mint' && k.holding.method === 'pot' || k.holding?.type === 'plate' && k.holding.contents.some(i => i.id === 'mint' && i.method === 'pot'))) {
      for (let i = 0; i < 3; i++) {
        const shift = (time * 23 + i * 15) % 43;
        c.globalAlpha = (1 - shift / 43) * .65;
        line(c, [[k.player.x - 12 + i * 14, handsY - 14 - shift], [k.player.x - 16 + i * 14, handsY - 24 - shift]], '#fffdf1', 4);
      }
      c.globalAlpha = 1;
    }
    if (moving && !polish) {
      c.globalAlpha = .4;
      ellipse(c, k.player.x - 12, k.player.y + 18 + Math.sin(time * 15) * 4, 4, 2, '#9caa8e');
      c.globalAlpha = 1;
    }
  } });
  objects.sort((a, b) => a.depth - b.depth).forEach(object => object.paint());
  c.restore();
}
