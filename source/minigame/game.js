import config from '../public/config.json';
import { kitchenClue, stationsFor } from '../src/cooking.js';
import { kitchenMusicTempo } from '../src/kitchen-music.js';
import { THEMES } from '../src/themes.js';
import { createAudio } from './audio.js';
import { createKitchenRuntime } from './kitchen.js';
import { contains, layoutFor, touchPoint } from './layout.js';
import { createMicrophone } from './microphone.js';
import { createView } from './view.js';

const SAVE = 'birthday-bistro-wechat-prototype-v1';
const gift = config.gifts[0];
const emptyInput = () => ({ x: 0, y: 0, cut: false });

export function startMiniGame(wx, frames = requestAnimationFrame) {
  const canvas = wx.createCanvas();
  const view = createView(canvas);
  const audio = createAudio(wx);
  let saved;
  try { saved = wx.getStorageSync(SAVE); } catch { /* The game still works without storage. */ }
  audio.setMuted(saved?.muted === true);
  const state = {
    scene: 'menu', kitchen: null, modal: null, guess: '', giftSeen: saved?.giftSeen === true, muted: audio.muted,
    input: emptyInput(), orderPage: 0, scoreEffect: null, micPhase: 'idle', micActive: false, micLevel: 0,
    wind: 0, candlesOut: false, blownAt: 0,
  };
  let layout;
  let dpr;
  let shown = true;
  let last = null;
  let drawTime = -Infinity;
  let time = 0;
  let stickId = null;
  let cutId = null;
  let keyboard = false;
  let pages = 1;
  let passAt = null;

  function save() {
    try { wx.setStorageSync(SAVE, { muted: audio.muted, giftSeen: state.giftSeen }); } catch { /* Optional local progress. */ }
  }
  function syncMusic() {
    audio.setMode(shown && layout.width >= layout.height && !state.modal && state.scene === 'kitchen'
      ? kitchenMusicTempo(state.kitchen.k) : null);
  }
  function resetInput() {
    stickId = cutId = null;
    state.input = emptyInput();
  }
  function closeKeyboard() {
    if (!keyboard) return;
    keyboard = false;
    wx.hideKeyboard?.({ fail() {} });
  }
  function setModal(modal) {
    resetInput();
    state.modal = modal;
    if (modal?.type !== 'letter') closeKeyboard();
    syncMusic();
  }
  function blow() {
    if (state.candlesOut) return;
    mic.stop();
    state.candlesOut = true;
    state.blownAt = time;
    audio.cue('serve');
  }
  const mic = createMicrophone(wx, {
    onState(phase) {
      state.micPhase = phase;
      state.micActive = ['requesting', 'calibrating', 'listening', 'no-signal'].includes(phase);
    },
    onReading(wind, level) { state.wind = wind; state.micLevel = level; },
    onBlow: blow,
  });
  function beginKitchen() {
    state.scene = 'kitchen';
    state.orderPage = 0;
    state.scoreEffect = null;
    state.guess = '';
    passAt = null;
    state.kitchen = createKitchenRuntime({
      onCue: audio.cue,
      onScore(delta, now) {
        state.scoreEffect = { delta, time: now };
        if (delta < 0) audio.cue('lid');
        if (state.kitchen.k.delivered) passAt = now + 900;
      },
      onClue() {
        setModal({
          type: 'clue', title: THEMES[0].title, copy: kitchenClue(state.kitchen.k),
          primary: { id: 'dismiss', label: '继续料理' },
        });
      },
    });
    setModal(null);
  }
  function showGift(fromMenu) {
    state.giftSeen = true;
    save();
    setModal({
      type: 'gift', title: gift.name, copy: `${gift.message}\n${config.sender}`,
      primary: { id: fromMenu ? 'dismiss' : 'menu', label: fromMenu ? '好好收下这份心意' : '收好礼物，返回菜单' },
    });
    if (!fromMenu) audio.cue('seal');
  }
  wx.onKeyboardInput?.(({ value }) => { if (keyboard) state.guess = value; });
  wx.onKeyboardConfirm?.(({ value }) => {
    if (!keyboard) return;
    state.guess = value;
    closeKeyboard();
  });
  wx.onKeyboardComplete?.(() => { keyboard = false; });

  function action(id) {
    switch (id) {
      case 'sound':
        audio.setMuted(!audio.muted);
        state.muted = audio.muted;
        save();
        void audio.unlock();
        break;
      case 'start': beginKitchen(); break;
      case 'retry': beginKitchen(); break;
      case 'menu':
        mic.stop();
        state.scene = 'menu';
        state.kitchen = null;
        passAt = null;
        setModal(null);
        break;
      case 'candles':
        state.scene = 'candles';
        state.micPhase = 'idle';
        state.candlesOut = false;
        setModal(null);
        break;
      case 'mic': mic.toggle(); break;
      case 'blow': blow(); break;
      case 'dismiss': setModal(null); break;
      case 'gift': showGift(true); break;
      case 'reveal': showGift(false); break;
      case 'orders-prev': state.orderPage = Math.max(0, state.orderPage - 1); break;
      case 'orders-next': state.orderPage = Math.min(pages - 1, state.orderPage + 1); break;
      case 'guess':
        if (!wx.showKeyboard || keyboard) break;
        keyboard = true;
        wx.showKeyboard({
          defaultValue: state.guess, maxLength: 120, multiple: false, confirmHold: false, confirmType: 'done',
          fail() { keyboard = false; },
        });
        break;
    }
  }
  function updateStick({ x, y }) {
    const stick = layout.joystick;
    const dx = x - stick.x;
    const dy = y - stick.y;
    const distance = Math.hypot(dx, dy);
    const limit = Math.max(stick.r * .60, distance);
    state.input.x = distance < stick.r * .12 ? 0 : dx / limit;
    state.input.y = distance < stick.r * .12 ? 0 : dy / limit;
  }
  function inCircle(rect, point) {
    const r = rect.w / 2;
    return Math.hypot(point.x - rect.x - r, point.y - rect.y - r) <= r;
  }
  wx.onTouchStart(event => {
    if (!shown || layout.width < layout.height) return;
    void audio.unlock();
    for (const touch of event.changedTouches) {
      const point = touchPoint(touch);
      const button = view.buttons().find(region => contains(region, point));
      if (button) { action(button.id); return; }
      if (state.scene !== 'kitchen' || state.modal || passAt !== null) continue;
      const stick = layout.joystick;
      if (stickId === null && Math.hypot(point.x - stick.x, point.y - stick.y) <= stick.r) {
        stickId = point.id;
        updateStick(point);
      } else if (cutId === null && inCircle(layout.cut, point)) {
        cutId = point.id;
        state.input.cut = true;
      } else if (inCircle(layout.use, point)) {
        state.kitchen.operate(time);
      } else if (contains(layout.stage, point)) {
        const world = view.worldAt(point);
        const station = world && stationsFor(state.kitchen.k).find(s => contains(s, world));
        if (station) state.kitchen.operate(time, station.id);
      }
    }
  });
  wx.onTouchMove(event => {
    if (stickId === null) return;
    const moved = event.changedTouches.find(t => t.identifier === stickId);
    if (moved) updateStick(touchPoint(moved));
  });
  function endTouch(event) {
    for (const touch of event.changedTouches) {
      if (touch.identifier === stickId) {
        stickId = null;
        state.input.x = state.input.y = 0;
      }
      if (touch.identifier === cutId) {
        cutId = null;
        state.input.cut = false;
      }
    }
  }
  wx.onTouchEnd(endTouch);
  wx.onTouchCancel(event => event.changedTouches?.length ? endTouch(event) : resetInput());

  function resize() {
    const info = wx.getWindowInfo?.() || wx.getSystemInfoSync();
    const { windowWidth, windowHeight, pixelRatio, safeArea } = info;
    dpr = Math.min(2, pixelRatio || 1);
    layout = layoutFor(windowWidth, windowHeight, wx.getMenuButtonBoundingClientRect?.(), safeArea);
    canvas.width = Math.round(windowWidth * dpr);
    canvas.height = Math.round(windowHeight * dpr);
    resetInput();
    drawTime = -Infinity;
    syncMusic();
  }
  wx.onWindowResize?.(resize);
  wx.onHide(() => {
    shown = false;
    last = null;
    resetInput();
    closeKeyboard();
    mic.stop();
    syncMusic();
  });
  wx.onShow(() => {
    shown = true;
    last = null;
    resize();
  });
  function frame(now) {
    frames(frame);
    if (!shown) return;
    const seconds = last === null ? 0 : Math.max(0, Math.min(.05, (now - last) / 1000));
    last = now;
    time += seconds * 1000;
    if (layout.width >= layout.height && state.scene === 'kitchen' && !state.modal) {
      const k = state.kitchen.k;
      state.kitchen.step(seconds, state.input, time);
      syncMusic();
      if (k.expired) setModal({
        type: 'result', title: '铃声响啦，这轮辛苦了。',
        copy: `${k.score} / ${k.targetScore} 分 · 完成 ${k.deliveries} 单 · 超时 ${k.missedOrders} 单`,
        primary: { id: 'retry', label: '再挑战一次' }, secondary: { id: 'menu', label: '返回菜单' },
      });
      if (passAt !== null && time >= passAt) {
        passAt = null;
        setModal({
          type: 'letter', title: '挑战达标，收到一封小便笺。', copy: gift.riddle,
          primary: { id: 'reveal', label: '揭晓这份心意' },
        });
      }
    }
    if (now - drawTime >= 1000 / 34) {
      const paging = view.draw(state, layout, dpr, time);
      pages = paging.pages;
      state.orderPage = paging.page;
      drawTime = now;
    }
  }
  resize();
  frames(frame);
  return { canvas, state, layout: () => layout, buttons: view.buttons, worldAt: view.worldAt };
}
