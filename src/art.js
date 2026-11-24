const cache = new Map();
let chefSprite;
export const CHEF_SPRITES = {
  cooking: new URL('./assets/birthday-chef.webp', import.meta.url).href,
  birthday: new URL('./assets/birthday-chef-party.webp', import.meta.url).href,
};
const palette = { ink: '#48534b', red: '#ee7773', pink: '#f3b7b4', green: '#83ac8b', yellow: '#f2ca6b' };
function round(c, x, y, w, h, r, fill, stroke) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(); }
}
function ellipse(c, x, y, rx, ry, fill) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
}
function line(c, points, color, width = 3) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
}
function heart(c, x, y, size, color) {
  c.save(); c.translate(x, y); c.scale(size / 24, size / 24); c.beginPath();
  c.moveTo(0, 7); c.bezierCurveTo(-20, -4, -9, -18, 0, -8); c.bezierCurveTo(9, -18, 20, -4, 0, 7);
  c.fillStyle = color; c.fill(); c.restore();
}
function fruit(c, type) {
  if (type === 'banana') {
    c.save(); c.rotate(-0.35); c.beginPath(); c.moveTo(-26, -22); c.bezierCurveTo(-28, 28, 14, 37, 30, -9); c.bezierCurveTo(6, 10, -10, 12, -17, -24); c.closePath(); c.fillStyle = '#f2ca62'; c.fill();
    line(c, [[-23, -23], [-21, -29]], '#8f8157', 5); line(c, [[-13, 10], [1, 16], [17, 9]], '#d5a849', 2); c.restore();
  } else if (type === 'strawberry') {
    c.beginPath(); c.moveTo(-23, -13); c.bezierCurveTo(-39, 6, -9, 32, 0, 32); c.bezierCurveTo(9, 32, 39, 6, 23, -13); c.closePath(); c.fillStyle = '#eb7d7a'; c.fill();
    for (const [x, y] of [[-13, -4], [4, -5], [15, 5], [-7, 10], [4, 21]]) ellipse(c, x, y, 1.5, 2.7, '#ffe6bb');
    c.beginPath(); c.moveTo(0, -25); c.lineTo(6, -14); c.lineTo(21, -21); c.lineTo(13, -9); c.lineTo(24, -8); c.lineTo(2, -4); c.lineTo(-20, -13); c.lineTo(-7, -14); c.lineTo(-10, -26); c.closePath(); c.fillStyle = '#78a47e'; c.fill();
  } else if (type === 'grape') {
    [[-12, -12], [11, -12], [-22, 4], [0, 5], [21, 5], [-10, 22], [11, 21], [0, 36]].forEach(([x, y], i) => ellipse(c, x, y - 5, 11, 12, i % 2 ? '#ab96bb' : '#937daa'));
    line(c, [[0, -17], [1, -29], [12, -34]], '#7e9b73'); ellipse(c, 15, -27, 11, 5, '#8ab18c');
  } else if (type === 'kiwi') {
    ellipse(c, 0, 1, 29, 30, '#a99776'); ellipse(c, 0, 0, 25, 26, '#b5ce7c'); ellipse(c, 0, 0, 8, 10, '#f1ebc0');
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; ellipse(c, Math.cos(a) * 15, Math.sin(a) * 17, 1.4, 2, '#5e7154'); }
  } else if (type === 'rice') {
    ellipse(c, 0, 30, 25, 6, '#d9ddd2');
    c.beginPath(); c.moveTo(-33, -1); c.quadraticCurveTo(-29, 30, 0, 30); c.quadraticCurveTo(29, 30, 33, -1); c.closePath(); c.fillStyle = '#91b2a2'; c.fill();
    ellipse(c, 0, -1, 33, 15, '#e6ebdb'); ellipse(c, 0, -7, 29, 18, '#fffdf5');
    for (let i = 0; i < 12; i++) ellipse(c, (i % 4 - 1.5) * 12, (Math.floor(i / 4) - 1) * 10 - 7, 2, 4, '#ded8c3');
    line(c, [[-17, 17], [17, 17]], '#bed2bd', 3);
  } else if (type === 'broccoli') {
    round(c, -6, 0, 13, 31, 4, '#a7bf82'); [[-17, -5], [0, -19], [18, -5], [-1, 0]].forEach(([x, y], i) => ellipse(c, x, y, 16, 17, i % 2 ? '#77a17b' : '#8bb18b'));
  }
}

export function art(type, size = 160) {
  const key = `${type}-${size}`; if (cache.has(key)) return cache.get(key);
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const c = canvas.getContext('2d'); c.scale(size / 100, size / 100); c.translate(50, 47);
  if (['banana', 'strawberry', 'grape', 'kiwi', 'rice', 'broccoli'].includes(type)) fruit(c, type);
  else if (type === 'tomato') {
    ellipse(c, 0, 5, 30, 28, '#df796c'); ellipse(c, -10, -3, 9, 11, '#ef9b84');
    c.beginPath(); c.moveTo(0, -27); c.lineTo(6, -16); c.lineTo(23, -23); c.lineTo(13, -8); c.lineTo(-3, -12); c.lineTo(-22, -20); c.lineTo(-7, -19); c.closePath(); c.fillStyle = '#7d9c6e'; c.fill();
    line(c, [[0, -20], [3, -32]], '#7d9c6e', 4);
  } else if (type === 'carrot') {
    c.save(); c.rotate(.4); c.beginPath(); c.moveTo(-18, -17); c.quadraticCurveTo(0, -26, 19, -17); c.lineTo(1, 38); c.closePath(); c.fillStyle = '#e9a25c'; c.fill();
    line(c, [[-7, -19], [-17, -35]], '#8ba373', 5); line(c, [[0, -21], [1, -40]], '#8ba373', 5); line(c, [[7, -19], [18, -34]], '#8ba373', 5);
    line(c, [[-11, -1], [-2, 0]], '#cb8b4e', 2); line(c, [[1, 13], [8, 13]], '#cb8b4e', 2); c.restore();
  } else if (type === 'beef') {
    round(c, -32, -22, 65, 51, 18, '#f4d5ba'); round(c, -27, -17, 55, 41, 15, '#ca8480');
    line(c, [[-19, -9], [-3, -2], [7, -11], [20, -8]], '#edb7a4', 3); line(c, [[-18, 12], [-2, 6], [12, 15]], '#edb7a4', 3);
  } else if (type === 'chicken') {
    c.save(); c.rotate(-.5); round(c, -7, 9, 14, 29, 4, '#f3e9cf'); ellipse(c, -5, 35, 9, 7, '#f3e9cf'); ellipse(c, 5, 35, 9, 7, '#f3e9cf');
    ellipse(c, 0, -6, 25, 28, '#e9b39b'); ellipse(c, -7, -14, 10, 12, '#f1c9ac'); c.restore();
  } else if (type === 'mushroom') {
    round(c, -10, -5, 20, 39, 7, '#ecdfc2'); c.beginPath(); c.ellipse(0, 0, 34, 29, 0, Math.PI, Math.PI * 2); c.closePath(); c.fillStyle = '#b8a186'; c.fill(); ellipse(c, 0, 1, 34, 9, '#dfcbb0');
    ellipse(c, -14, -12, 5, 4, '#d8c7aa'); ellipse(c, 10, -18, 6, 4, '#d8c7aa');
  } else if (type === 'bread') {
    round(c, -28, -30, 56, 64, 12, '#c6a072'); round(c, -23, -25, 46, 54, 9, '#f0dbad');
    ellipse(c, -7, -2, 3, 2, '#d9c193'); ellipse(c, 10, 12, 2, 3, '#d9c193'); ellipse(c, 11, -15, 3, 2, '#d9c193');
  }
  else if (type === 'mint') {
    line(c, [[-6, 32], [0, -27]], '#568975', 4);
    [[-14, 11, -.5], [14, 0, .5], [-12, -12, -.5], [11, -23, .5]].forEach(([x, y, angle]) => {
      c.save(); c.translate(x, y); c.rotate(angle); ellipse(c, 0, 0, 16, 9, '#79b19a'); line(c, [[-11, 0], [11, 0]], '#d0e6b7', 1.5); c.restore();
    });
  }
  else if (type === 'jam') {
    round(c, -25, -24, 50, 59, 8, '#c77699', '#a45f7d');
    round(c, -28, -30, 56, 12, 3, '#e9cf99');
    round(c, -20, -7, 40, 28, 3, '#fff3df');
    heart(c, 0, 11, 22, '#bc6488');
  }
  else if (type === 'candy') { round(c, -25, -30, 50, 66, 8, '#f1a19c'); round(c, -20, -19, 40, 41, 4, '#fff0d4'); heart(c, 0, 2, 24, '#e97b79'); line(c, [[-22, -27], [22, -27]], '#ffe7cc', 3); }
  else if (type === 'charm') { c.strokeStyle = '#c1a25d'; c.lineWidth = 4; c.beginPath(); c.arc(0, -31, 10, 0, Math.PI * 2); c.stroke(); round(c, -27, -9, 54, 48, 22, '#fdf9ef', '#d5cbb8'); ellipse(c, -19, -13, 10, 12, '#fdf9ef'); ellipse(c, 19, -13, 10, 12, '#fdf9ef'); ellipse(c, -9, 12, 2, 3, '#57514d'); ellipse(c, 9, 12, 2, 3, '#57514d'); ellipse(c, -17, 20, 5, 3, '#efb1ac'); ellipse(c, 17, 20, 5, 3, '#efb1ac'); line(c, [[-3, 21], [0, 24], [3, 21]], '#57514d', 1.5); }
  else if (type === 'snacks') { round(c, -34, -17, 68, 50, 5, '#84a395'); round(c, -37, -21, 74, 13, 3, '#b0c5ad'); round(c, -5, -21, 10, 54, 0, '#f2d59b'); heart(c, 0, -27, 22, '#e7ac83'); }
  else if (type === 'film') { round(c, -31, -28, 62, 66, 4, '#8eaf9b'); round(c, -20, -15, 40, 39, 1, '#fcf8ee'); round(c, -16, -11, 32, 23, 0, '#d5b8bd'); ellipse(c, -6, -3, 6, 6, '#e8d6ab'); }
  else if (type === 'candle') { ellipse(c, 0, 32, 27, 7, '#d6d6cb'); round(c, -24, -12, 48, 43, 5, '#b5b1c7'); ellipse(c, 0, -11, 24, 7, '#ede5d7'); line(c, [[0, -11], [0, -20]], '#686057', 2); ellipse(c, 0, -25, 4, 8, '#efbd62'); round(c, -15, 1, 30, 19, 2, '#f6f1e5'); heart(c, 0, 13, 12, '#b6a6b8'); }
  else if (type === 'perfume') { round(c, -27, -10, 54, 49, 7, '#e4c296', '#c8a77e'); round(c, -15, -30, 30, 19, 3, '#586e60'); round(c, -10, -12, 20, 5, 0, '#c3a261'); round(c, -18, 2, 36, 25, 2, '#fff7e8'); c.fillStyle = '#657562'; c.font = '9px Georgia'; c.textAlign = 'center'; c.fillText('FOR YOU', 0, 18); }
  else if (type === 'cake') {
    ellipse(c, 0, 37, 43, 9, '#b9c9bd'); round(c, -34, -8, 68, 44, 8, '#e8a29e'); ellipse(c, 0, -7, 34, 13, '#fff4e2');
    for (let i = -2; i <= 2; i++) round(c, i * 12 - 4, -8, 8, 16 + (i % 2) * 5, 4, '#fff4e2');
    for (const [x, y, color, stripe] of [[-17, -29, '#dc918d', '#ffe0ce'], [0, -38, '#7ea78f', '#e3edc9'], [17, -30, '#9c9fc8', '#e8dff4']]) {
      round(c, x - 2.5, y, 5, -6 - y, 2, color);
      for (let row = y + 5; row < -8; row += 6) line(c, [[x - 1.4, row + 1], [x + 1.4, row - 1]], stripe, 1.6);
      line(c, [[x, y], [x, y - 4]], '#615447', 1.4);
    }
    heart(c, 0, 23, 18, '#fcdfcf');
  } else {
    const sky = type === 'night' ? '#697e97' : type === 'afternoon' ? '#f2cfbf' : '#b4d0d3';
    round(c, -44, -43, 88, 87, 2, sky);
    ellipse(c, 24, -25, 9, 9, type === 'night' ? '#f6e4b4' : '#fff0bb');
    if (type === 'afternoon') {
      round(c, -32, -10, 64, 48, 3, '#f7ede2'); round(c, -37, -18, 74, 13, 2, '#e29b93');
      for (let i = 0; i < 5; i++) round(c, -34 + i * 15, -18, 8, 15, 1, '#f7e3d5');
      round(c, -21, 4, 16, 33, 1, '#9ebaaa'); round(c, 3, 4, 21, 18, 1, '#d2bc94');
    } else {
      round(c, -44, 10, 88, 34, 0, type === 'night' ? '#8b9a8c' : '#a4bd8e');
      line(c, [[-38, 43], [-5, 10], [12, 10], [40, 43]], '#e1d6bb', 13);
      [[-14, 11, '#e6a19b'], [13, 14, '#e9cf94']].forEach(([x, y, color]) => { round(c, x - 7, y, 14, 23, 6, color); ellipse(c, x, y - 6, 9, 9, '#f5ddc3'); });
    }
  }
  const url = canvas.toDataURL('image/png'); cache.set(key, url); return url;
}

function chef(c, x, y, color, time, assistant = false, pose = null) {
  c.save(); c.translate(x, y + (pose ? 0 : Math.sin(time * 1.4 + x) * 2));
  if (!pose) ellipse(c, 0, 49, 32, 10, '#b2bdb044');
  if (!assistant) {
    if (!chefSprite) {
      chefSprite = new Image();
      chefSprite.src = CHEF_SPRITES.cooking;
    }
    if (chefSprite.complete && chefSprite.naturalWidth) {
      const height = 124;
      const width = height * chefSprite.naturalWidth / chefSprite.naturalHeight;
      if (pose) {
        const { naturalWidth: sw, naturalHeight: sh } = chefSprite;
        const upper = Math.floor(sh * .907);
        const half = sw / 2;
        const footY = 52 - height + upper / sh * height;
        const step = pose.stride;
        c.scale(pose.facing, 1);
        for (const side of [-1, 1]) {
          c.drawImage(chefSprite, side === -1 ? 0 : half, upper, half, sh - upper,
            (side === -1 ? -width / 2 : 0) + step * side * 2, footY - Math.max(0, step * side) * 5,
            width / 2, height * (sh - upper) / sh);
        }
        c.translate(0, pose.bob); c.rotate(pose.lean);
        c.drawImage(chefSprite, 0, 0, sw, upper, -width / 2, 52 - height, width, upper / sh * height + 1);
      } else c.drawImage(chefSprite, -width / 2, 52 - height, width, height);
      c.restore();
      return;
    }
  }
  round(c, -24, 5, 48, 42, 15, color, '#617065');
  round(c, -13, 13, 26, 31, 6, '#fcf7e8'); round(c, -9, 25, 18, 10, 3, color);
  ellipse(c, -23, 21, 8, 11, '#f4d9ba'); ellipse(c, 23, 21, 8, 11, '#f4d9ba');
  ellipse(c, 0, -7, 29, 27, '#f5dbbd'); ellipse(c, -10, -8, 2.4, 3, '#4a5047'); ellipse(c, 10, -8, 2.4, 3, '#4a5047');
  ellipse(c, -18, 1, 5, 3, '#eab1a2'); ellipse(c, 18, 1, 5, 3, '#eab1a2');
  c.beginPath(); c.arc(0, 0, 5, 0.2, Math.PI - 0.2); c.strokeStyle = '#8b7462'; c.lineWidth = 1.8; c.stroke();
  round(c, -26, -39, 52, 18, 5, '#fffaf0', '#c1c5b8');
  [[-19, -42, 16], [0, -51, 18], [19, -42, 16]].forEach(([xx, yy, r]) => ellipse(c, xx, yy, r, r, '#fffaf0'));
  if (assistant) heart(c, 0, 30, 10, '#de8b82');
  round(c, -20, 43, 17, 9, 4, '#5f6d5b'); round(c, 3, 43, 17, 9, 4, '#5f6d5b');
  c.restore();
}

export { chef as drawChef, round as drawRound, ellipse as drawEllipse, line as drawLine, heart as drawHeart };

export function startKitchen(canvas, getState) {
  const c = canvas.getContext('2d'); let raf; let stopped = false; let last = 0;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render(ms) {
    if (stopped) return;
    raf = requestAnimationFrame(render);
    if (ms - last < (reduced ? 200 : 40)) return; last = ms;
    const box = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(box.width * dpr) || canvas.height !== Math.round(box.height * dpr)) { canvas.width = Math.round(box.width * dpr); canvas.height = Math.round(box.height * dpr); }
    c.setTransform(canvas.width / 840, 0, 0, canvas.height / 620, 0, 0);
    c.clearRect(0, 0, 840, 620);
    const s = getState(); const t = reduced ? 0 : ms / 1000; const night = s.chapter >= 4;
    c.fillStyle = night ? '#dadbe1' : '#f0e5df'; c.fillRect(0, 0, 840, 620);
    // The room is drawn as a miniature stage, with separate interactive DOM targets.
    for (let y = 0; y < 180; y += 32) {
      for (let x = 0; x < 840; x += 48) { round(c, x + 1, y + 1, 46, 30, 2, (x / 48 + y / 32) % 4 === 0 ? '#eadbd4' : '#f5ebe5'); }
    }
    c.fillStyle = '#dddcd1'; c.fillRect(0, 174, 840, 446);
    for (let y = 180; y < 620; y += 55) for (let x = 0; x < 840; x += 60) {
      c.fillStyle = ((x / 60 + (y - 180) / 55) % 2) ? '#e8e7dd' : '#f3f0e5';
      c.fillRect(x + 1, y + 1, 58, 53);
    }
    round(c, 0, 170, 840, 13, 0, '#c5cabc');
    // Window, shelves, framed birthday print.
    round(c, 303, 22, 221, 130, 6, '#abc1b4', '#a9b3a3');
    round(c, 313, 30, 201, 112, 1, night ? '#8190ab' : '#c9e0dc');
    ellipse(c, 475, 58, 14, 14, night ? '#f4e6b8' : '#fff0ba');
    for (const [x, y, r] of [[333, 107, 18], [355, 118, 26], [473, 126, 32], [501, 105, 27]]) ellipse(c, x, y, r, r, night ? '#7c9b8f' : '#a9c7ab');
    round(c, 408, 29, 9, 113, 0, '#fcf6e6'); round(c, 312, 79, 202, 7, 0, '#fcf6e6'); round(c, 292, 143, 244, 13, 3, '#b9ad92');
    round(c, 56, 61, 173, 9, 3, '#b8ae95'); round(c, 66, 28, 27, 32, 5, '#d8a7a0'); round(c, 102, 35, 22, 25, 4, '#c7bf9a'); round(c, 134, 29, 29, 31, 4, '#a8bba3');
    [77, 112, 147, 183].forEach((x, i) => { line(c, [[x, 90], [x, 102]], '#968b74', 3); ellipse(c, x, 119, 9, i === 2 ? 15 : 11, i % 2 ? '#b3b5aa' : '#d4b995'); });
    round(c, 607, 36, 124, 100, 4, '#b2a88c'); round(c, 614, 43, 110, 86, 2, '#f9f3dd');
    c.fillStyle = '#8a937f'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('HAPPY', 669, 72); c.fillText('BIRTHDAY', 669, 91); heart(c, 669, 112, 16, '#d58a7e');
    // Rear counter.
    round(c, 40, 187, 673, 85, 6, '#a0b9a4', '#728d7a');
    for (let x = 46; x < 710; x += 111) { round(c, x, 198, 100, 61, 3, '#b5c8b0', '#8ca18b'); round(c, x + 38, 208, 23, 4, 2, '#718574'); }
    round(c, 30, 163, 696, 38, 6, '#cbbfa5'); round(c, 29, 160, 698, 27, 5, '#f1e8d6', '#c7bca4');
    // Stove, pot and steam.
    round(c, 52, 163, 126, 21, 4, '#83958a'); ellipse(c, 88, 172, 21, 8, '#586a60'); ellipse(c, 141, 171, 20, 8, '#586a60');
    round(c, 66, 136, 55, 34, 6, '#cc8b7e', '#9f746b'); ellipse(c, 93, 136, 28, 8, '#e9b3a0'); ellipse(c, 93, 134, 23, 6, '#ba796a');
    round(c, 57, 146, 11, 8, 3, '#996b61'); round(c, 120, 146, 11, 8, 3, '#996b61');
    for (let i = 0; i < 3; i++) {
      const offset = ((t * 17 + i * 13) % 44);
      c.globalAlpha = (1 - offset / 44) * 0.6;
      c.beginPath(); c.moveTo(82 + i * 11, 123 - offset); c.bezierCurveTo(68 + i * 11, 111 - offset, 97 + i * 11, 110 - offset, 83 + i * 11, 99 - offset); c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.stroke(); c.globalAlpha = 1;
    }
    round(c, 225, 159, 117, 26, 8, '#adb9af'); round(c, 234, 162, 99, 18, 6, '#8b9d94'); line(c, [[278, 163], [278, 144], [287, 138], [299, 141]], '#7c9389', 5);
    // Fruits and plants.
    c.save(); c.translate(406, 158); c.scale(.42, .42); fruit(c, 'strawberry'); c.translate(66, 6); fruit(c, 'banana'); c.restore();
    round(c, 555, 140, 35, 38, 4, '#d9a18f'); [[558, 130], [580, 124], [565, 108]].forEach(([x, y]) => { line(c, [[572, 144], [x, y]], '#87a07b'); ellipse(c, x, y, 10, 6, '#96b08d'); });
    for (let i = 0; i < 3; i++) { ellipse(c, 658, 173 - i * 6, 32, 9, '#fff9eb'); c.strokeStyle = '#d7cbb5'; c.lineWidth = 2; c.stroke(); }
    // Fridge.
    round(c, 735, 153, 83, 175, 8, '#92a8aa', '#788e8e'); round(c, 739, 156, 75, 64, 6, '#bad1cd'); round(c, 739, 225, 75, 96, 6, '#b4cbc6'); round(c, 749, 187, 5, 21, 2, '#7b9291'); round(c, 749, 237, 5, 32, 2, '#7b9291');
    round(c, 774, 172, 22, 28, 2, '#ffedb7'); heart(c, 785, 189, 9, '#df9689');
    // Central preparation island.
    round(c, 235, 314, 363, 104, 7, '#a7b69d', '#82947e');
    round(c, 244, 340, 163, 66, 3, '#c1cbb2', '#92a188'); round(c, 419, 340, 168, 66, 3, '#bec9b0', '#92a188');
    round(c, 305, 351, 33, 5, 2, '#89977d'); round(c, 480, 351, 33, 5, 2, '#89977d');
    round(c, 221, 291, 391, 47, 7, '#c6b99b'); round(c, 218, 281, 397, 42, 8, '#eee1c4', '#c9ba9a');
    round(c, 249, 288, 106, 29, 6, '#b99d76'); round(c, 256, 292, 90, 19, 4, '#d3b992');
    c.save(); c.translate(300, 291); c.scale(.28, .28); fruit(c, s.chapter === 1 ? 'rice' : 'strawberry'); c.restore();
    ellipse(c, 425, 302, 42, 15, '#fffbed'); ellipse(c, 425, 301, 32, 10, '#e7ebda');
    if (s.puzzle.fruits.length || s.chapter > 0) {
      c.save(); c.translate(426, 296); c.scale(.35, .35); fruit(c, s.puzzle.fruits.at(-1) || 'broccoli'); c.restore();
    }
    round(c, 526, 278, 39, 32, 6, '#d5aaa2'); ellipse(c, 546, 278, 20, 6, '#f2cfbc'); ellipse(c, 546, 278, 15, 4, '#b9947d');
    // Characters and dining corner.
    chef(c, 358, 456, '#d59083', t);
    chef(c, 529, 438, '#90a8bd', t, true);
    round(c, 72, 357, 90, 68, 6, '#bea58a'); round(c, 64, 345, 106, 46, 10, '#f3d7b7', '#c5af92');
    ellipse(c, 117, 365, 25, 10, '#fff7e5');
    if (s.puzzle.flowers) {
      round(c, 110, 338, 15, 22, 4, '#b4beca');
      [[106, 329], [122, 323], [132, 335]].forEach(([x, y]) => { line(c, [[118, 342], [x, y]], '#8b9d78', 2); ellipse(c, x, y, 8, 7, '#de9c9d'); ellipse(c, x, y, 3, 3, '#f1d484'); });
    }
    round(c, 81, 434, 71, 36, 6, '#95b1a0'); round(c, 88, 459, 8, 23, 1, '#8c9a85'); round(c, 135, 459, 8, 23, 1, '#8c9a85');
    // Floor mat, little plants, delivery counter.
    round(c, 650, 399, 151, 99, 8, '#ceb0a3'); round(c, 660, 409, 131, 79, 4, '#dfc8b9');
    round(c, 674, 430, 101, 31, 5, '#8fa69b'); heart(c, 725, 450, 15, '#fae6ce');
    round(c, 43, 526, 122, 17, 4, '#b1b7a1'); round(c, 60, 506, 30, 29, 4, '#d7ab93');
    [[63, 490], [84, 480], [91, 499]].forEach(([x, y]) => { line(c, [[76, 511], [x, y]], '#829771'); ellipse(c, x, y, 12, 8, '#a0b68f'); });
    c.fillStyle = '#a5ad9a'; c.font = '11px sans-serif'; c.textAlign = 'center'; c.fillText('MADE WITH LOVE', 421, 581);
    if (night && !s.puzzle.lights) { c.fillStyle = '#64677e20'; c.fillRect(0, 0, 840, 620); }
    if (s.puzzle.lights) { ellipse(c, 115, 362, 56, 25, '#ffe6a645'); }
  }
  raf = requestAnimationFrame(render);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}
