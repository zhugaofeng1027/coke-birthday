import { startMiniGame } from './game.js';
import { stationsFor } from '../src/cooking.js';
import chef from '../src/assets/birthday-chef.png';
import party from '../src/assets/birthday-chef-party.png';
import candy from '../src/assets/gift-grape-candy.webp';

const device = document.querySelector('#device');
const handlers = {};
const recorder = {
  onFrameRecorded: fn => { handlers.record = fn; },
  onStart: fn => { handlers.recordStart = fn; },
  onError: fn => { handlers.recordError = fn; },
  onStop: fn => { handlers.recordStop = fn; },
  start() {
    handlers.recordError({ errMsg: 'Local WECHAT API preview: no native recorder' });
  },
  stop() { handlers.recordStop({}); },
};
const screen = document.createElement('canvas');
device.prepend(screen);
let screenTaken = false;
const images = {
  'assets/birthday-chef.png': chef, 'assets/birthday-chef-party.png': party, 'assets/gift-grape-candy.webp': candy,
};
globalThis.wx = {
  createCanvas() {
    if (!screenTaken) { screenTaken = true; return screen; }
    return document.createElement('canvas');
  },
  createImage() {
    const image = new Image();
    const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    Object.defineProperty(image, 'src', { set: value => src.set.call(image, images[value] || value) });
    return image;
  },
  getWindowInfo: () => ({ windowWidth: device.clientWidth, windowHeight: device.clientHeight, pixelRatio: devicePixelRatio }),
  getMenuButtonBoundingClientRect: () => ({ left: device.clientWidth - 86, bottom: 32 }),
  createWebAudioContext: () => new AudioContext(),
  getStorageSync: key => JSON.parse(localStorage.getItem(key)),
  setStorageSync: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  getRecorderManager: () => recorder,
  onTouchStart: fn => { handlers.pointerdown = fn; },
  onTouchMove: fn => { handlers.pointermove = fn; },
  onTouchEnd: fn => { handlers.pointerup = fn; },
  onTouchCancel: fn => { handlers.pointercancel = fn; },
  onWindowResize: fn => { new ResizeObserver(fn).observe(device); },
  onShow: fn => { handlers.show = fn; },
  onHide: fn => { handlers.hide = fn; },
};

for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) screen.addEventListener(type, e => {
  if (type === 'pointerdown') screen.setPointerCapture(e.pointerId);
  const { left, top } = screen.getBoundingClientRect();
  handlers[type]({ changedTouches: [{ identifier: e.pointerId, clientX: e.clientX - left, clientY: e.clientY - top }] });
});
document.addEventListener('visibilitychange', () => handlers[document.hidden ? 'hide' : 'show']());
const app = startMiniGame(wx);
if (new URLSearchParams(location.search).has('test')) window.__miniTest = { app, handlers, recorder, stationsFor };
