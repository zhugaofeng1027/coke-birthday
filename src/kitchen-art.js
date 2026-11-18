import { art, drawChef, drawRound as round, drawEllipse as ellipse, drawLine as line, drawHeart as heart } from './art.js';
import { stationsFor, DISHES, INGREDIENTS, CHOP_SECONDS, WORLD, nearestStation, isHeartJam } from './cooking.js';
import { THEMES, SPICES } from './themes.js';

const images = new Map();
function ingredientImage(id) {
  if (!images.has(id)) { const image = new Image(); image.src = art(id, 180); images.set(id, image); }
  return images.get(id);
}
function food(c, item, x, y, size = 65) {
  if (!item) return;
  if (item.type === 'plate') { plate(c, item, x, y, size); return; }
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
  if (item.id === 'rice' && item.shape) {
    if (item.shape === 'circle') ellipse(c, x, y, size * .35, size * .34, '#fffbed', '#c6b5d0');
    else if (item.shape === 'heart') heart(c, x, y, size * .75, '#fffbed');
    else {
      c.beginPath(); c.moveTo(x, y - size * .4); c.lineTo(x + size * .4, y + size * .3); c.lineTo(x - size * .4, y + size * .3); c.closePath(); c.fillStyle = '#fffbed'; c.fill(); c.strokeStyle = '#c6b5d0'; c.lineWidth = 2; c.stroke();
    }
    round(c, x - size * .12, y, size * .24, size * .3, 2, '#688b76');
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
  if (value?.contents.some(i => Number.isInteger(i.slot))) {
    round(c, x - size * .7, y - size * .24, size * 1.4, size * .55, 5, '#fff4df', '#ad9c91');
    for (let i = 0; i < 3; i++) {
      const xx = x + (i - 1) * size * .44;
      round(c, xx - size * .2, y - size * .2, size * .4, size * .46, 3, '#e5e9d9');
      food(c, value.contents.find(item => item.slot === i), xx, y, size * .39);
    }
    return;
  }
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
function station(c, s, k, time, selected, chopping) {
  const { x, y, w, h } = s;
  const theme = THEMES[k.chapter];
  const isHot = ['pot', 'oven'].includes(s.type);
  round(c, x + 3, y + 11, w - 6, h, 8, '#556f702e');
  round(c, x, y, w, h, 8, s.type === 'serve' ? theme.accent : theme.counter, '#607b7977');
  round(c, x + 6, y + 5, w - 12, h - 28, 5, isHot ? '#e3e6df' : theme.top);
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
    label(c, INGREDIENTS[id].name, cx, y + h - 9, '#516f57', 20);
    return;
  }
  if (s.type === 'board') {
    round(c, x + 17, y + 12, w - 34, 54, 6, '#ba9770');
    round(c, x + 22, y + 16, w - 44, 44, 4, '#dec49b');
    food(c, k.board.item, cx, y + 34, 65);
    const choppingNow = chopping && k.board.item && !k.board.item.cut;
    c.save(); c.translate(x + w - 28, y + 35); c.rotate(choppingNow ? Math.sin(time * 25) * .45 - .8 : -.7);
    round(c, -5, -24, 10, 29, 2, '#f2f2df', '#b4bcb0'); round(c, -4, 5, 8, 20, 2, '#8f9b86'); c.restore();
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
    round(c, x + 13, y + 16, w - 26, 62, 5, '#657d74'); round(c, x + 20, y + 24, w - 40, 45, 4, job.item ? '#dcab70' : '#a3b8ad');
    line(c, [[x + 27, y + 26], [x + w - 27, y + 26]], '#5d756b', 6);
    [29, 50, 71, 92].forEach(dx => ellipse(c, x + dx, y + 88, 5, 5, '#687b68'));
    if (job.item) { food(c, job.item, cx, y + 45, 62); cookingTimer(c, job, x, y, w); }
  } else if (s.type === 'plates') {
    for (let i = 0; i < 3; i++) plate(c, null, cx, y + 53 - i * 10, 79);
  } else if (s.type === 'plating') {
    if ([1, 3].includes(k.chapter)) {
      round(c, cx - 35, y + 15, 70, 25, 7, k.plating ? '#fff5de' : '#d4cbb5', '#b4a18b');
      line(c, [[cx - 20, y + 27], [cx + 20, y + 27]], '#b4a18b', 5);
      label(c, k.plating ? '端起整盘 →' : '空盘放这里', cx, y - 8, '#6b7f70', 16);
    } else if (k.plating) plate(c, k.plating, cx, y + 27, 93);
    else { c.strokeStyle = '#c1b596'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.ellipse(cx, y + 26, 47, 21, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
  } else if (s.type === 'slot') {
    if (k.chapter === 3) plate(c, null, cx, y + 27, 46);
    else round(c, x + 4, y + 9, w - 8, 36, 3, k.plating ? '#fffdf1' : '#d6d8c9', '#c1b596');
    if (k.plating) food(c, k.plating.contents.find(i => i.slot === s.slot), cx, y + 26, 42);
    label(c, String(s.slot + 1), cx, y - 9, '#6b7f70', 17);
  } else if (s.type === 'spice') {
    round(c, x + 8, y + 17, w - 16, 30, 4, '#f1dfbd', '#bdac8a');
    round(c, x + 6, y + 10, w - 12, 8, 2, '#91aaa0');
    spice(c, s.spice, cx, y + 32, 25);
  } else if (s.type === 'serve') {
    round(c, x + 19, y + 14, w - 38, 30, 3, '#fff5de');
    label(c, k.delivered ? '完美出餐！' : '为你上菜', cx, y + 36, k.delivered ? '#719167' : '#bd8d79', 20);
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
      round(c, x + 14, y + 13, 72, 50, 6, '#d1bedb');
      ['circle', 'triangle', 'heart'].forEach((shape, i) => food(c, { id: 'rice', shape, method: 'pot' }, x + 24 + i * 26, y + 35, 25));
      label(c, '山尖 · 鸡 · 树', cx, y - 10, '#826c8e', 15);
    } else if (k.chapter === 2) {
      food(c, { type: 'spicebag', spices: k.spices }, cx, y + 33, 70);
      ['anise', 'cinnamon', 'bay'].forEach((id, i) => spice(c, id, x + 23 + i * 27, y - 18, 24));
      label(c, `${k.spices.length} / 3`, cx, y + 66, '#75694c', 15);
    } else if (k.chapter === 3) {
      round(c, x + 16, y + 8, 69, 58, 1, '#fffdf6');
      round(c, x + 21, y + 13, 59, 38, 0, '#c5d9db');
      DISHES[3].parts.forEach((part, i) => food(c, { type: 'ingredient', ...part, cut: true }, x + 29 + i * 21, y + 32, 25));
      line(c, [[cx - 10, y + 58], [cx + 10, y + 58]], '#d9bd9b', 2);
      label(c, '红 · 金 · 浅棕', cx, y - 10, '#65848b', 15);
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
  label(c, s.type === 'puzzle' ? theme.station : s.name, cx, y + h - 9, s.type === 'serve' ? '#fff6eb' : '#425c55', s.type === 'puzzle' ? 16 : 18);
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
    if (k.delivered) food(c, { type: 'ingredient', id: 'rice', cut: false, method: 'pot' }, 767, 520, 60);
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

export function paintKitchen(c, k, time, moving = false, chopping = false) {
  c.clearRect(0, 0, WORLD.width, WORLD.height);
  background(c, k, time);
  // Sort by feet/worktop depth so the chef can walk behind the kitchen island.
  const selected = nearestStation(k)?.id;
  const objects = stationsFor(k).map(s => ({ depth: s.y + s.h, paint: () => station(c, s, k, time, selected === s.id, chopping) }));
  objects.push({ depth: k.player.y, paint: () => {
    ellipse(c, k.player.x, k.player.y + 5, 28, 10, '#9cae9040');
    c.strokeStyle = '#c48a74'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(k.player.x, k.player.y + 5, 25, 10, 0, 0, Math.PI * 2); c.stroke();
    drawChef(c, k.player.x, k.player.y - 48, THEMES[k.chapter].accent, moving ? time * 6 : time * .4);
    if (k.holding) food(c, k.holding, k.player.x + 4, k.player.y - 41, k.holding.type === 'plate' ? 56 : 49);
    if (k.chapter === 4 && (k.holding?.id === 'mint' && k.holding.method === 'pot' || k.holding?.type === 'plate' && k.holding.contents.some(i => i.id === 'mint' && i.method === 'pot'))) {
      for (let i = 0; i < 3; i++) {
        const shift = (time * 23 + i * 15) % 43;
        c.globalAlpha = (1 - shift / 43) * .65;
        line(c, [[k.player.x - 12 + i * 14, k.player.y - 55 - shift], [k.player.x - 16 + i * 14, k.player.y - 65 - shift]], '#fffdf1', 4);
      }
      c.globalAlpha = 1;
    }
    if (moving) {
      c.globalAlpha = .4;
      ellipse(c, k.player.x - 12, k.player.y + 18 + Math.sin(time * 15) * 4, 4, 2, '#9caa8e');
      c.globalAlpha = 1;
    }
  } });
  objects.sort((a, b) => a.depth - b.depth).forEach(object => object.paint());
}
