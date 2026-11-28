import { drawRound as box, drawEllipse as dot, drawLine as line, drawArtCanvas, CHEF_SPRITES } from '../src/art.js';
import { createArtCanvas, createArtImage } from './art-platform.js';
import { paintKitchen } from '../src/kitchen-art.js';
import { actionLabel, canChop, INGREDIENTS, itemName, orderRecipe, worldFor } from '../src/cooking.js';
import { THEMES } from '../src/themes.js';

const INK = '#35443b';
const QUIET = '#557064';
const PAPER = '#fbfaf4';
const GREEN = '#497967';
const RED = '#ad4e43';
const SALMON = '#b86758';
const HONEY = '#f8dc8e';
const MESSAGES = {
  idle: '许好愿，再吹灭蜡烛。',
  requesting: '请允许麦克风权限。',
  calibrating: '正在听环境声，请稍等。',
  listening: '对准手机底部麦克风，持续吹一口气。',
  'no-signal': '还没收到声音，靠近一点试试。',
  denied: '未获得麦克风权限，也可以点按吹灭。',
  unavailable: '麦克风暂不可用，可以点按吹灭。',
  timeout: '没听到吹气，再试一次或点按吹灭。',
};

export function createView(canvas) {
  const c = canvas.getContext('2d');
  const images = new Map();
  const art = new Map();
  let room;
  let worldTransform;
  let layout;
  let buttons = [];

  function image(path) {
    if (!images.has(path)) {
      const sprite = createArtImage();
      const entry = { sprite, ready: false };
      sprite.onload = () => { entry.ready = true; };
      sprite.src = path;
      images.set(path, entry);
    }
    return images.get(path);
  }
  function photo(path, x, y, w, h) {
    const { sprite, ready } = image(path);
    const width = sprite.naturalWidth || sprite.width;
    const height = sprite.naturalHeight || sprite.height;
    if (!ready || !width || !height) return;
    const scale = Math.min(w / width, h / height);
    c.drawImage(sprite, x + (w - width * scale) / 2, y + (h - height * scale) / 2, width * scale, height * scale);
  }
  function ornament(id, x, y, size) {
    if (!art.has(id)) art.set(id, drawArtCanvas(id, 180));
    c.drawImage(art.get(id), x, y, size, size);
  }
  function text(value, x, y, size, { ink = INK, align = 'left', bold = false, width } = {}) {
    c.fillStyle = ink;
    c.font = `${bold ? 'bold ' : ''}${Math.max(9, Math.round(size))}px sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    if (width) c.fillText(value, x, y, width);
    else c.fillText(value, x, y);
  }
  function lines(value, x, y, w, size, maxLines = 5) {
    c.font = `${Math.round(size)}px sans-serif`;
    const paragraphs = String(value).split('\n');
    const result = [];
    for (const p of paragraphs) {
      let row = '';
      for (const char of p) {
        if (row && c.measureText(row + char).width > w) { result.push(row); row = ''; }
        row += char;
      }
      result.push(row);
    }
    result.slice(0, maxLines).forEach((row, i) => text(i === maxLines - 1 && i < result.length - 1 ? row.slice(0, -1) + '…' : row, x, y + i * size * 1.48, size, { width: w }));
  }
  function button(id, label, x, y, w, h, { primary = false, disabled = false } = {}) {
    box(c, x, y, w, h, 7, primary ? GREEN : '#eff3ea', primary ? null : '#cedbcf');
    text(label, x + w / 2, y + h / 2, 14 * layout.s, { bold: true, align: 'center', ink: primary ? '#fff' : QUIET, width: w - 10 });
    if (!disabled) buttons.push({ id, x, y, w, h });
  }
  function header(state, label, now) {
    const { width, header: h, headerRight: right, margin: x, s } = layout;
    box(c, 0, 0, width, h, 0, PAPER);
    line(c, [[0, h - 1], [width, h - 1]], '#bbcebf', 1);
    const y = h / 2;
    const widthButton = Math.round(52 * s);
    const buttonH = Math.round(30 * s);
    button('sound', state.muted ? '开声音' : '关声音', right - widthButton, y - buttonH / 2, widthButton, buttonH);
    if (state.scene !== 'menu') button('menu', '返回', right - 2 * widthButton - 6, y - buttonH / 2, widthButton, buttonH);
    text(label, x, y, 21 * s, { bold: true, width: width * .24 });
    if (state.scene !== 'kitchen') return;
    const k = state.kitchen.k;
    const time = Math.ceil(k.timeLeft);
    const stamp = `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;
    const center = (x + right - 2 * widthButton) * .5;
    text(stamp, center, y, 22 * s, { bold: true, align: 'right', ink: time <= 20 ? RED : QUIET });
    const fx = state.scoreEffect;
    const age = fx ? (now - fx.time) / 1000 : Infinity;
    text(`${k.score} / ${k.targetScore}`, center + 18 * s, y, 20 * s, { bold: true, ink: age < .8 ? fx.delta < 0 ? RED : '#ad772d' : QUIET });
    if (age < .9) {
      const scoreX = center + 115 * s;
      c.globalAlpha = Math.min(1, (1 - age / .9) * 2);
      text(fx.delta > 0 ? `+${fx.delta}` : `−${-fx.delta}`, scoreX, y + (fx.delta < 0 ? 1 : -1) * age * 13 * s, 16 * s, { bold: true, ink: fx.delta > 0 ? '#a16a20' : RED });
      c.globalAlpha = 1;
    }
  }
  function tickets(k, page, now) {
    const { width, header: y, orders: h, s, margin } = layout;
    box(c, 0, y, width, h, 0, '#dce9db');
    const ticketW = Math.round(216 * s);
    const gap = 8 * s;
    const navW = 85 * s;
    const room = width - margin * 2;
    const paged = k.orders.length * (ticketW + gap) - gap > room;
    const count = Math.max(1, Math.floor((room + gap - (paged ? navW : 0)) / (ticketW + gap)));
    const pages = Math.max(1, Math.ceil(k.orders.length / count));
    page = Math.min(pages - 1, Math.max(0, page));
    const displayed = k.orders.slice(page * count, (page + 1) * count);
    if (!displayed.length) text('下一张订单正在路上', margin, y + h / 2, 14 * s, { ink: QUIET });
    displayed.forEach((order, i) => {
      const x = margin + i * (ticketW + gap);
      const left = Math.max(0, order.expiresAt - k.elapsed);
      const urgent = left <= 15;
      const seconds = Math.ceil(left);
      const border = left <= 5 && Math.sin(now / 175) > 0 ? '#d36662' : urgent ? '#d99188' : '#b9d1c0';
      box(c, x, y + 4 * s, ticketW, h - 8 * s, 7, urgent ? '#fff1ec' : '#f9fcf7', border);
      text(`订单 ${String(order.id).padStart(2, '0')}`, x + 9 * s, y + 16 * s, 12 * s, { ink: urgent ? RED : QUIET });
      text(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, x + ticketW - 9 * s, y + 16 * s, 14 * s, { bold: true, align: 'right', ink: urgent ? RED : QUIET });
      let cursor = x + 8 * s;
      for (const part of orderRecipe(k.chapter, order).parts) {
        const name = part.id === 'jam' ? k.puzzle.solved ? '爱心双果酱' : '神秘双果酱' : INGREDIENTS[part.id].name;
        if (part.id === 'jam' && !k.puzzle.solved) text('?', cursor + 9 * s, y + 34 * s, 13 * s, { bold: true, align: 'center', ink: '#986290' });
        else ornament(part.id, cursor, y + 24 * s, 19 * s);
        text(name, cursor + 20 * s, y + 34 * s, 12 * s, { bold: true });
        cursor += (24 + name.length * 12) * s;
      }
      box(c, x + 9 * s, y + h - 12 * s, ticketW - 18 * s, 3 * s, 2 * s, '#dce8dc');
      if (left > 0) box(c, x + 9 * s, y + h - 12 * s, (ticketW - 18 * s) * left / (order.expiresAt - order.createdAt), 3 * s, 2 * s, urgent ? '#c96761' : '#6da68a');
    });
    if (pages > 1) {
      const tx = margin + count * (ticketW + gap);
      button('orders-prev', '‹', tx, y + 11 * s, 25 * s, 35 * s, { disabled: page === 0 });
      text(`${page + 1}/${pages}`, tx + 41 * s, y + h / 2, 11 * s, { align: 'center' });
      button('orders-next', '›', tx + 57 * s, y + 11 * s, 25 * s, 35 * s, { disabled: page + 1 === pages });
    }
    return { page, pages };
  }
  function theatre(state, now) {
    const k = state.kitchen.k;
    const { s, joystick, use, cut, width, height, bottom } = layout;
    const stage = { ...layout.stage, h: Math.max(1, layout.stage.h - 28 * s) };
    const world = worldFor(k);
    const scale = Math.min(stage.w / world.width, stage.h / world.height) * .94;
    const w = Math.ceil(stage.w / scale);
    const h = Math.ceil(stage.h / scale);
    if (!room || room.width !== w || room.height !== h) room = createArtCanvas(w, h);
    const pose = state.kitchen.pose(now);
    paintKitchen(room.getContext('2d'), k, now / 1000, pose.moving, pose.chopping, pose.polish);
    box(c, 0, stage.y, width, layout.stage.h, 0, '#e1ebdb');
    c.drawImage(room, stage.x, stage.y, stage.w, stage.h);
    worldTransform = { x: stage.x + stage.w / 2, y: stage.y + stage.h / 2, sx: stage.w / w, sy: stage.h / h, world };

    const { x, y, r } = joystick;
    dot(c, x, y + 3 * s, r, r, '#738d6839');
    dot(c, x, y, r, r, '#a7b99b');
    dot(c, x, y, r - 2 * s, r - 2 * s, '#edf2df');
    for (const angle of [-Math.PI / 2, 0, Math.PI / 2, Math.PI]) {
      const ax = Math.cos(angle); const ay = Math.sin(angle);
      line(c, [[x + ax * r * .78 - ay * 4 * s, y + ay * r * .78 + ax * 4 * s],
        [x + ax * r * .88, y + ay * r * .88], [x + ax * r * .78 + ay * 4 * s, y + ay * r * .78 - ax * 4 * s]], '#73896c', 2 * s);
    }
    dot(c, x + state.input.x * r * .48, y + state.input.y * r * .48, r * .39, r * .39, '#91a985');
    circleControl(cut, canChop(k) ? '#86aa86' : '#e8eddb', 'scissors', canChop(k) ? '#fffdf3' : '#879783', state.input.cut);
    circleControl(use, '#d98e7a', 'hand', '#fff8ee', false);
    const held = k.holding ? itemName(k.holding) : '两手空空';
    const label = `${held}  ·  ${actionLabel(k)}`;
    const labelW = Math.min(width * .31, 215 * s);
    box(c, width / 2 - labelW / 2, stage.y + 6 * s, labelW, 23 * s, 6, '#f4f6ebdd');
    text(label, width / 2, stage.y + 17.5 * s, 12 * s, { align: 'center', ink: QUIET, width: labelW - 7 * s });
    const messageW = Math.min(width * .49, 455 * s);
    const mh = Math.round(26 * s);
    box(c, (width - messageW) / 2, height - bottom - mh, messageW, mh, 6, '#fcfcf1e8');
    text(k.delivered ? '达标！生日便笺已送达。' : k.message, width / 2, height - bottom - mh / 2, 12 * s, {
      ink: k.messageKind === 'gentle' ? RED : QUIET, align: 'center', width: messageW - 10 * s,
    });
  }
  function circleControl(rect, fill, icon, ink, pressed) {
    const r = rect.w / 2;
    const x = rect.x + r; const y = rect.y + r;
    dot(c, x, y + 3, r, r, icon === 'hand' ? SALMON : '#bbcbb8');
    dot(c, x, y, r, r, '#fff8e9');
    dot(c, x, y, r - 2, r - 2, fill);
    c.save(); c.translate(x, y + (pressed ? 2 : 0)); c.scale(r / 24, r / 24);
    c.strokeStyle = ink; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    if (icon === 'scissors') {
      c.moveTo(-5, -6); c.lineTo(11, 10); c.moveTo(-5, 6); c.lineTo(11, -10);
      c.moveTo(-5, -8); c.arc(-8, -8, 3, 0, Math.PI * 2);
      c.moveTo(-5, 8); c.arc(-8, 8, 3, 0, Math.PI * 2);
    } else {
      c.moveTo(-4, 2); c.lineTo(-4, -8); c.quadraticCurveTo(-2, -12, 0, -8); c.lineTo(0, -2);
      c.lineTo(0, -11); c.quadraticCurveTo(2, -15, 4, -11); c.lineTo(4, -2);
      c.lineTo(4, -8); c.quadraticCurveTo(6, -12, 8, -8); c.lineTo(8, -1);
      c.quadraticCurveTo(10, -7, 12, -3); c.lineTo(12, 3); c.quadraticCurveTo(12, 13, 3, 13);
      c.quadraticCurveTo(-5, 14, -12, 4); c.quadraticCurveTo(-13, 0, -9, 1); c.lineTo(-4, 6);
    }
    c.stroke(); c.restore();
  }
  function modal(state) {
    const { width, height, header, s } = layout;
    const { type, title, copy, primary, secondary } = state.modal;
    const w = Math.min(width - 36, 510 * s);
    const h = Math.min(height - header - 18, (type === 'gift' ? 250 : 230) * s);
    const x = (width - w) / 2;
    const y = header + (height - header - h) / 2;
    const pad = 20 * s;
    const footer = y + h - 49 * s;
    buttons = [];
    box(c, 0, 0, width, height, 0, '#233b35a3');
    box(c, x, y, w, h, 8, PAPER, '#e5ddc6');
    text(title, x + pad, y + 29 * s, 21 * s, { bold: true, width: w - 2 * pad });
    if (type === 'letter') {
      lines(copy, x + pad, y + 61 * s, w - 2 * pad, 15 * s, 4);
      button('guess', state.guess || '写下你的猜测（可留空）', x + pad, footer - 39 * s, w - 2 * pad, 29 * s);
    } else if (type === 'gift') {
      const photoW = Math.min(w * .35, 135 * s);
      photo('assets/gift-grape-candy.webp', x + pad, y + 45 * s, photoW, footer - y - 51 * s);
      const offset = 2 * pad + photoW;
      lines(copy, x + offset, y + 65 * s, w - offset - pad, 15 * s, 6);
    } else lines(copy, x + pad, y + 67 * s, w - 2 * pad, 16 * s, 5);
    const btnW = (w - 2 * pad - (secondary ? 10 * s : 0)) / (secondary ? 2 : 1);
    button(primary.id, primary.label, x + w - pad - btnW, footer, btnW, 35 * s, { primary: true });
    if (secondary) button(secondary.id, secondary.label, x + pad, footer, btnW, 35 * s);
  }
  function welcome(state) {
    const { width, height, header: y, s } = layout;
    const middle = (height + y) / 2;
    const g = c.createLinearGradient(0, y, width, height);
    g.addColorStop(0, '#e1ede1'); g.addColorStop(1, '#f6e0d5');
    box(c, 0, y, width, height - y, 0, g);
    photo(CHEF_SPRITES.cooking, width * .07, y + 17 * s, width * .36, height - y - 30 * s);
    const x = width * .47;
    const w = Math.min(width * .44, 340 * s);
    text('今晚只接你这一单', x, middle - 67 * s, 28 * s, { bold: true, width: w });
    button('start', '第 1 关 · 果园甜品站', x, middle - 28 * s, w, 42 * s, { primary: true });
    button('candles', '吹蜡烛测试', x, middle + 26 * s, w, 39 * s);
    if (state.giftSeen) button('gift', '回看第 1 关礼物', x, middle + 72 * s, w, 32 * s);
  }
  function candles(state, now) {
    const { width, height, header, s } = layout;
    const g = c.createLinearGradient(0, header, width, height);
    g.addColorStop(0, '#293e48'); g.addColorStop(1, '#563f56');
    box(c, 0, header, width, height - header, 0, g);
    for (let i = 0; i < 22; i++) {
      const x = ((i * 217 + 137) % 997) / 997 * width;
      const y = header + ((i * 127 + 113) % 761) / 761 * (height - header);
      const r = 1 + (i % 4) * .4;
      dot(c, x, y, r, r, i % 3 ? '#efe7cd76' : '#f7c089a6');
    }
    const middle = (height + header) / 2;
    const size = Math.min(205 * s, (height - header) * .62);
    const x = width * .33 - size / 2;
    const y = middle - size / 2;
    photo(CHEF_SPRITES.birthday, width * .027, middle - 92 * s, width * .20, 184 * s);
    ornament('cake', x, y, size);
    [[33, 14], [50, 5], [67, 13]].forEach(([ux, uy], i) => {
      const fx = x + ux / 100 * size;
      const fy = y + uy / 100 * size;
      const sway = Math.sin(now / 96 + i * 2.3);
      if (!state.candlesOut) {
        const flicker = 1 + sway * .12;
        c.save(); c.translate(fx, fy); c.rotate(sway * .12 + state.wind * .91);
        const spread = size * .12;
        const glow = c.createRadialGradient(0, -3, 1, 0, -3, spread);
        glow.addColorStop(0, '#ffd58e8a'); glow.addColorStop(1, '#ffba6600');
        dot(c, 0, -3, spread, spread, glow);
        dot(c, 0, -size * .036, size * .023 * flicker, size * .046 * flicker, '#ffb454');
        dot(c, 0, -size * .027, size * .012, size * .025, '#fff5b5');
        c.restore();
      } else if (now - state.blownAt < 900) {
        const age = (now - state.blownAt) / 900;
        c.globalAlpha = (1 - age) * .55;
        dot(c, fx + age * 18 * s, fy - age * 32 * s, (2 + age * 6) * s, (3 + age * 5) * s, '#f9efe3');
        c.globalAlpha = 1;
      }
    });
    const tx = width * .52;
    const tw = width * .43 - 8 * s;
    text(state.candlesOut ? '愿望已经送达' : '今天的主角，许个愿吧。', tx, middle - 62 * s, 23 * s, { bold: true, ink: '#fff4df', width: tw });
    const status = state.candlesOut ? '愿你的愿望，都慢慢实现。' : MESSAGES[state.micPhase];
    text(status, tx, middle - 24 * s, 15 * s, { ink: '#f0e1d6', width: tw });
    if (!state.candlesOut) {
      box(c, tx, middle, tw, 5 * s, 2 * s, '#ffffff25');
      if (state.micLevel > 0) box(c, tx, middle, tw * state.micLevel, 5 * s, 2 * s, HONEY);
      const bw = (tw - 8 * s) / 2;
      button('mic', state.micActive ? '停止收音' : '用气息吹', tx, middle + 21 * s, bw, 38 * s, { primary: true });
      button('blow', '点按吹灭', tx + bw + 8 * s, middle + 21 * s, bw, 38 * s);
    } else button('candles', '再点亮蜡烛', tx, middle + 21 * s, tw, 38 * s);
  }

  return {
    draw(state, nextLayout, dpr, now) {
      layout = nextLayout;
      buttons = [];
      worldTransform = null;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (layout.width < layout.height) {
        box(c, 0, 0, layout.width, layout.height, 0, PAPER);
        text('请横屏游玩', layout.width / 2, layout.height / 2, 22, { align: 'center', bold: true });
        return { page: state.orderPage, pages: 1 };
      }
      let orderPage = { page: 0, pages: 1 };
      if (state.scene === 'kitchen') {
        theatre(state, now);
        orderPage = tickets(state.kitchen.k, state.orderPage, now);
      } else if (state.scene === 'candles') candles(state, now);
      else welcome(state);
      header(state, state.scene === 'candles' ? '吹蜡烛测试' : '生日小厨房', now);
      if (state.modal) modal(state);
      return orderPage;
    },
    buttons() { return buttons; },
    worldAt(point) {
      if (!worldTransform) return null;
      const { x, y, sx, sy, world } = worldTransform;
      return { x: (point.x - x) / sx + world.width / 2, y: (point.y - y) / sy + world.height / 2 };
    },
  };
}
