import { drawRound as round, drawEllipse as ellipse, drawLine as line, drawHeart as heart } from './art.js';

// Shared by the kitchen table and camera, so the photograph shows the meal on the table.
export function paintMemoryTable(c, filled = true) {
  round(c, -440, -270, 880, 540, 8, '#adc7c7');
  for (let x = -400; x < 440; x += 60) line(c, [[x, -270], [x, 270]], '#bfd4d0', 2);
  round(c, -380, -200, 760, 400, 8, '#f7f3e9');
  line(c, [[-5, -200], [-5, 200]], '#ead9cd', 3);
  for (const x of [-215, 215]) {
    ellipse(c, x, 20, 125, 127, '#d1d9cd');
    ellipse(c, x, 14, 120, 122, '#fffefa');
    ellipse(c, x, 14, 100, 102, '#e4ece6');
    line(c, [[x - 150, -70], [x - 150, 115]], '#8eaaa6', 8);
    for (let i = -1; i <= 1; i++) line(c, [[x - 150 + i * 8, -75], [x - 150 + i * 8, -35]], '#8eaaa6', 4);
    line(c, [[x + 150, -70], [x + 150, 115]], '#8eaaa6', 8);
    ellipse(c, x + 124, -143, 24, 28, '#bed9d8');
    ellipse(c, x + 124, -146, 19, 22, '#e3f0e9');
    if (!filled) continue;
    ellipse(c, x - 34, -10, 51, 55, '#b77a69');
    ellipse(c, x - 34, -17, 48, 49, '#f8e5ca');
    ellipse(c, x - 34, -17, 40, 41, '#d77869');
    ellipse(c, x - 45, -29, 10, 5, '#ecac84');
    ellipse(c, x - 26, -14, 9, 4, '#80a47b');
    c.save(); c.translate(x + 45, 35); c.rotate(.2);
    round(c, -29, -45, 61, 79, 8, '#c49660');
    round(c, -23, -39, 49, 67, 6, '#efd69b');
    for (const [xx, yy] of [[-8, -16], [13, 6], [-5, 18]]) ellipse(c, xx, yy, 3, 4, '#d6b77f');
    c.restore();
    for (const [dx, dy] of [[-55, 62], [-25, 78], [4, 76]]) {
      round(c, x + dx - 6, dy, 12, 23, 3, '#eadac1');
      ellipse(c, x + dx, dy, 19, 12, '#b39a82');
      ellipse(c, x + dx - 5, dy - 3, 4, 2, '#d5c5b0');
    }
  }
  round(c, -24, -165, 48, 65, 6, '#d8aea3');
  for (const [x, y] of [[-24, -213], [20, -225], [0, -190]]) {
    line(c, [[0, -135], [x, y]], '#739b80', 4);
    for (let i = 0; i < 5; i++) ellipse(c, x + Math.cos(i * 1.256) * 13, y + Math.sin(i * 1.256) * 13, 10, 10, '#d797a7');
    ellipse(c, x, y, 6, 6, '#f4cf74');
  }
  heart(c, 0, 158, 28, '#c8858c');
}

export function paintMemoryPhoto(canvas, settings = { x: 0, y: 0, focus: 55 }) {
  const source = document.createElement('canvas');
  source.width = 960; source.height = 640;
  const s = source.getContext('2d');
  s.fillStyle = '#e1e9e2'; s.fillRect(0, 0, 960, 640);
  s.translate(480 + settings.x * 7, 320 + settings.y * 4);
  paintMemoryTable(s);
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.save();
  c.filter = `blur(${Math.max(0, Math.abs(settings.focus - 55) - 15) / 7}px)`;
  c.drawImage(source, 0, 0, canvas.width, canvas.height);
  c.restore();
}
