import { art, CHEF_SPRITES, drawRound as round, drawEllipse as ellipse, drawLine as line, drawHeart as heart } from './art.js';
import { paintBento } from './bento-art.js';
import { paintMemoryTable } from './memory-photo.js';
import { THEMES } from './themes.js';

export function openingAssets() {
  const sources = { chef: CHEF_SPRITES.cooking, bread: art('bread'), jam: art('jam'), strawberry: art('strawberry'), broccoli: art('broccoli'), mint: art('mint') };
  return Object.fromEntries(Object.entries(sources).map(([id, src]) => {
    const image = new Image(); image.src = src;
    return [id, image];
  }));
}

function picture(c, image, x, y, width, height = width) {
  if (image.complete && image.naturalWidth) c.drawImage(image, x - width / 2, y - height / 2, width, height);
}

function plant(c, x, y, color) {
  round(c, x - 24, y - 5, 48, 48, 5, color);
  for (const [dx, dy, angle] of [[-17, -25, -.6], [13, -42, .5], [-8, -62, -.3], [20, -12, .8]]) {
    line(c, [[x, y], [x + dx, y + dy]], '#5a8d74', 4);
    c.save(); c.translate(x + dx, y + dy); c.rotate(angle);
    ellipse(c, 0, 0, 13, 23, '#79a687'); c.restore();
  }
}

export function paintOpening(c, width, height, { stage, elapsed, motion, reduced, welcome }, assets) {
  c.clearRect(0, 0, width, height);
  c.fillStyle = '#e7efec'; c.fillRect(0, 0, width, height);
  const scale = Math.min(width / (width < height ? 710 : 1040), height / 475);
  const opening = stage === 3 ? Math.min(elapsed / 1800, 1) : 0;
  const light = reduced || welcome || stage > 0 ? 1 : Math.min(elapsed / 2200, 1);
  c.save(); c.translate(width / 2, height * .52);
  c.scale(scale * (1 + opening * .1), scale * (1 + opening * .1));
  round(c, -1100, 155, 2200, 500, 0, '#dce5e1');
  for (let y = 185; y < 450; y += 42) {
    line(c, [[-1000, y], [1000, y]], '#c8d8d2', 2);
    for (let x = -1000; x < 1000; x += 110) line(c, [[x + (y % 2) * 40, y - 42], [x + (y % 2) * 40, y]], '#c8d8d2', 2);
  }
  round(c, -349, -186, 698, 354, 5, '#a8c8be');
  round(c, -338, -183, 676, 344, 4, '#c8ded7');
  round(c, -355, 151, 710, 17, 3, '#93b3aa');
  for (const x of [-292, 119]) {
    round(c, x - 6, -118, 179, 235, 4, '#608d85');
    round(c, x, -112, 167, 223, 2, '#7b9d9c');
    c.save(); c.globalAlpha = light;
    round(c, x, -112, 167, 223, 2, '#f9df9f');
    round(c, x + 14, 26, 139, 77, 2, '#f5edda');
    round(c, x + 24, 16, 120, 15, 2, '#95b8a4');
    c.restore();
    line(c, [[x + 83, -112], [x + 83, 111]], '#6e978c', 7);
    line(c, [[x, -8], [x + 167, -8]], '#6e978c', 7);
    round(c, x - 15, 109, 198, 13, 3, '#739b8e');
  }
  round(c, -86, -122, 172, 281, 4, '#5c8981');
  round(c, -77, -114, 154, 270, 0, '#b6d4bc');
  for (let y = 32; y < 152; y += 24) {
    for (let x = -77; x < 77; x += 26) round(c, x, y, 26, 24, 0, ((x + 77) / 26 + (y - 32) / 24) % 2 ? '#d9e7cb' : '#eff4df');
  }
  round(c, -64, -28, 128, 34, 3, '#85aaa1');
  round(c, -60, -31, 120, 7, 2, '#fff1c9');
  c.save(); c.translate(-77, -114); c.scale(1 - opening * .94, 1);
  round(c, 0, 0, 154, 270, 2, '#92b4a2');
  round(c, 12, 14, 130, 168, 2, '#729a92');
  c.globalAlpha = light; round(c, 18, 20, 118, 156, 2, '#fbe9bd'); c.globalAlpha = 1;
  line(c, [[77, 20], [77, 176]], '#a1bda6', 5);
  line(c, [[18, 98], [136, 98]], '#a1bda6', 5);
  ellipse(c, 129, 199, 5, 5, '#caab68');
  round(c, 18, 213, 118, 37, 2, '#a9c3ac');
  c.restore();
  round(c, -365, -205, 730, 30, 3, '#638f83');
  round(c, -370, -183, 740, 64, 3, '#e7b0a0');
  for (let i = 0; i < 14; i++) {
    const x = -370 + i * 53;
    round(c, x, -183, 53, 58, 0, i % 2 ? '#f9ece1' : '#d9877d');
    ellipse(c, x + 26.5, -126, 26.5, 11, i % 2 ? '#f9ece1' : '#d9877d');
  }
  line(c, [[-320, -227], [-270, -212], [-150, -202], [0, -196], [150, -202], [270, -212], [320, -227]], '#75988a', 2);
  for (let i = -4; i <= 4; i++) {
    const x = i * 68; const y = -196 - Math.abs(i) * 5;
    ellipse(c, x, y + 7, 5, 8, light > Math.abs(i) * .15 ? '#f4ca6c' : '#a2b7a6');
  }
  plant(c, -395, 126, '#d18c82'); plant(c, 395, 126, '#8eafc1');
  line(c, [[205, -97], [205, -58]], '#9a927b', 2);
  line(c, [[267, -97], [267, -58]], '#9a927b', 2);
  c.save(); c.translate(236, -38);
  c.rotate(reduced ? 0 : Math.sin(motion / 950) * .025);
  c.scale(Math.max(.08, Math.abs(Math.cos(light * Math.PI))), 1);
  round(c, -57, -21, 114, 42, 3, '#fff6dc', '#cbb58c');
  c.fillStyle = '#79775d'; c.font = '600 13px "PingFang SC", sans-serif'; c.textAlign = 'center';
  c.fillText(light < .5 ? '正在准备中' : '只为你营业', 0, 5); c.restore();
  const arrival = reduced || welcome ? 1 : Math.min(motion / 2400, 1);
  const chefX = -220 + arrival * 145 + opening * 75;
  const chefHeight = 197 * (1 - opening * .18);
  const bob = reduced ? 0 : Math.sin(motion / 180) * 2 * (arrival < 1 || opening > 0 ? 1 : .3);
  c.save(); c.globalAlpha = 1 - opening * .65;
  ellipse(c, chefX, 164, 38, 8, '#73998a44');
  picture(c, assets.chef, chefX, 164 - chefHeight / 2 + bob, chefHeight * 392 / 671, chefHeight);
  c.restore();
  if (stage === 1) {
    c.save(); c.translate(-85, 42); c.rotate(-.12);
    round(c, -37, -24, 74, 48, 2, '#fff9e9', '#caab8b');
    line(c, [[-37, -24], [0, 3], [37, -24]], '#d5b7a0', 2);
    heart(c, 0, 9, 15, '#cf7c83'); c.restore();
  }
  c.restore();
}

export function paintMenuMoment(canvas, chapter, assets) {
  const c = canvas.getContext('2d');
  c.save(); c.scale(canvas.width / 180, canvas.height / 130);
  round(c, 0, 0, 180, 130, 0, THEMES[chapter].wall);
  round(c, 0, 87, 180, 43, 0, THEMES[chapter].floor[0]);
  if (chapter === 0) {
    ellipse(c, 83, 91, 62, 22, '#fdfbf2');
    picture(c, assets.bread, 78, 73, 86);
    heart(c, 78, 77, 34, '#c46f88');
    picture(c, assets.jam, 138, 75, 60);
    picture(c, assets.strawberry, 31, 91, 45);
  } else if (chapter === 1) {
    paintBento(c, 2, 90, 70, 137);
    heart(c, 90, 72, 19, '#efcb7a');
  } else if (chapter === 2) {
    ellipse(c, 90, 109, 63, 8, '#769494');
    round(c, 39, 53, 102, 52, 12, '#b27764');
    ellipse(c, 90, 56, 51, 16, '#e4baa0');
    ellipse(c, 90, 56, 44, 12, '#916d56');
    for (const x of [63, 90, 115]) round(c, x - 9, 49, 18, 14, 4, '#c68b6d');
    for (const x of [64, 90, 116]) line(c, [[x, 37], [x - 5, 26], [x + 3, 13]], '#e9e8d7', 3);
  } else if (chapter === 3) {
    c.save(); c.translate(90, 67); c.scale(.2, .2); paintMemoryTable(c); c.restore();
  } else if (chapter === 4) {
    round(c, 14, 11, 53, 67, 3, '#bccfd9');
    line(c, [[41, 11], [41, 78]], '#dce4dc', 3);
    ellipse(c, 52, 27, 9, 9, '#f2d785');
    ellipse(c, 98, 108, 36, 7, '#c7d4c3');
    round(c, 74, 64, 48, 39, 6, '#f7f3df');
    ellipse(c, 98, 64, 24, 7, '#a3b389');
    picture(c, assets.mint, 132, 83, 65);
    line(c, [[95, 52], [90, 42], [98, 31]], '#eeeadd', 3);
  } else {
    line(c, [[0, 16], [45, 29], [90, 34], [135, 29], [180, 16]], '#698a79', 2);
    for (let x = 18; x < 180; x += 29) ellipse(c, x, 26 + Math.sin(x / 60) * 10, 3, 5, '#f6d17f');
    round(c, 13, 65, 154, 41, 4, '#f6e9dc');
    for (const x of [41, 90, 139]) ellipse(c, x, 78, 23, 17, '#fffaf1');
    picture(c, assets.broccoli, 41, 73, 42);
    round(c, 73, 67, 34, 19, 5, '#b97d67');
    picture(c, assets.strawberry, 139, 73, 42);
  }
  c.restore();
}
