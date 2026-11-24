import { drawRound as round, drawEllipse as ellipse, drawLine as line, drawHeart as heart } from './art.js';

export function paintPackingPiece(c, id, x, y, width) {
  c.save(); c.translate(x, y); c.scale(width / 400, width / 400);
  if (id === 'lid') {
    round(c, -200, -110, 400, 230, 28, '#e8a6ac', '#b86f81');
    round(c, -182, -94, 364, 195, 22, '#f4bdc1', '#d98f9f');
    line(c, [[-125, -45], [95, -45]], '#fce0d9', 9);
    line(c, [[-125, -20], [30, -20]], '#fce0d9', 9);
    ellipse(c, 125, 50, 18, 18, '#d58c9b');
    heart(c, 125, 50, 20, '#fbe5dc');
  } else if (id === 'band') {
    round(c, -31, -116, 62, 240, 8, '#648c82', '#476f69');
    line(c, [[-18, -101], [-18, 108]], '#a8c8ad', 4);
    line(c, [[18, -101], [18, 108]], '#a8c8ad', 4);
  } else {
    ellipse(c, 0, 0, 48, 48, '#f2cf7e', '#cfaa5c');
    heart(c, 0, 0, 48, '#bb647e');
  }
  c.restore();
}

export function paintBento(c, step, x, y, width, filled = true) {
  c.save(); c.translate(x, y); c.scale(width / 400, width / 400);
  ellipse(c, 0, 130, 212, 24, '#445b5b20');
  round(c, -198, -94, 396, 236, 27, '#c87d8e', '#a65e74');
  round(c, -200, -114, 400, 240, 27, '#edb8bc', '#ad7281');
  round(c, -183, -97, 366, 204, 17, '#fff9ed', '#ce9b96');
  if (filled) {
    round(c, -167, -81, 181, 172, 10, '#fffdf5');
    for (let i = 0; i < 46; i++) {
      c.save(); c.translate(-150 + (i % 7) * 23, -62 + Math.floor(i / 7) * 24); c.rotate((i % 3 - 1) * .4);
      ellipse(c, 0, 0, 4, 8, '#e2d9c0'); c.restore();
    }
    round(c, 22, -80, 145, 88, 8, '#d9e2b2');
    for (let i = 0; i < 4; i++) {
      const xx = 49 + (i % 2) * 58; const yy = -57 + Math.floor(i / 2) * 38;
      ellipse(c, xx + 7, yy + 5, 29, 19, '#b96e49');
      ellipse(c, xx, yy, 27, 17, '#e0a16d');
      line(c, [[xx - 12, yy - 7], [xx + 9, yy + 2]], '#f2c68e', 4);
    }
    for (let i = 0; i < 3; i++) {
      const xx = 53 + i * 43;
      round(c, xx - 5, 42, 10, 40, 2, '#a6ba7c');
      for (const [dx, dy] of [[-10, 12], [10, 12], [0, 0]]) ellipse(c, xx + dx, 31 + dy, 17, 17, '#6e9a70');
      ellipse(c, xx - 4, 27, 11, 10, '#8cb580');
    }
  }
  if (step >= 1) paintPackingPiece(c, 'lid', 0, -4, 400);
  if (step >= 2) paintPackingPiece(c, 'band', 0, -4, 400);
  if (step >= 3) paintPackingPiece(c, 'seal', 0, -4, 400);
  c.restore();
}

export function paintPackingTable(canvas, step, progress = 1, polish = false) {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save(); c.scale(canvas.width / 600, canvas.height / 400);
  c.fillStyle = '#e7efeb'; c.fillRect(0, 0, 600, 400);
  for (let y = 0; y < 400; y += 40) line(c, [[0, y], [600, y]], '#d7e4de', 1);
  if (polish) {
    round(c, 63, 73, 484, 297, 8, '#75918832');
    round(c, 58, 68, 484, 298, 8, '#d5c8ac');
  }
  round(c, 58, 65, 484, 297, 8, '#fffdf4');
  c.setLineDash([5, 7]);
  round(c, 71, 78, 458, 271, 5, null, '#d5d3b8');
  c.setLineDash([]);
  const settling = progress < 1 && step > 0;
  const impact = settling && progress >= .74 ? (progress - .74) / .26 : 1;
  paintBento(c, settling ? step - 1 : step, 300, 211 + Math.sin(impact * Math.PI) * 5, 380);
  if (settling) {
    const piece = ['lid', 'band', 'seal'][step - 1];
    const move = Math.min(1, progress / .74);
    const lift = (1 - move) ** 2;
    const reach = step === 1 ? 107 : step === 2 ? 75 : 45;
    c.save(); c.globalAlpha = Math.min(1, .7 + move);
    if (move < 1) ellipse(c, 300, 215, 160 + 25 * lift, 72 + 15 * lift, '#5f514328');
    paintPackingPiece(c, piece, 300 + (step === 2 ? -100 * lift : 0), 207 - reach * lift, 380 * (1 + .12 * lift));
    c.restore();
    if (progress >= .74) {
      c.save(); c.globalAlpha = 1 - impact;
      for (const side of [-1, 1]) {
        const x = 300 + side * (step === 3 ? 55 : 192);
        line(c, [[x + side * 4, 207], [x + side * (13 + impact * 12), 196 - impact * 11]], '#d29e59', 4);
      }
      c.restore();
    }
  }
  c.fillStyle = '#688678'; c.textAlign = 'center'; c.font = '500 15px "PingFang SC", sans-serif';
  c.fillText(step === 3 ? '出门也要好好吃饭' : '给你的一餐', 300, 381);
  c.restore();
}
