import {
  createElement, createIcons, ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart,
  Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X,
  ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb,
  HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen,
  PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play,
  Hand, Scissors, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flame,
  Smartphone, RotateCw, Maximize, Minimize, Mic, Wind,
  Triangle, Leaf, Logs, Bug, Focus, SkipForward, Pause,
} from 'lucide';
import { CHAPTERS, normalizeConfig, normalizeProgress, newFlowerRoom, advanceFlowerRoom } from './game.js';
import { art, CHEF_SPRITES } from './art.js';
import { createScoreEffects } from './score-effects.js';
import { DISHES, INGREDIENTS, CHOP_SECONDS, ORDER_POINTS, ORDER_PENALTY, CHALLENGES, APPLIANCES, orderRecipe, finaleOrder, createKitchen, actionLabel, itemName, canChop, nearestStation, plateMatches, plateProgress, nextTask, kitchenClue, solveKitchenPuzzle, adjustMemoryCamera, memoryPhotoQuality, captureMemoryPhoto, retakeMemoryPhoto, keepMemoryPhoto, PACKING_STEPS, packBento, takePackedBento } from './cooking.js';
import { paintMemoryPhoto } from './memory-photo.js';
import { paintPackingTable, paintPackingPiece } from './bento-art.js';
import { createBentoSample } from './bento-polish.js';
import { playKitchenSound } from './kitchen-sounds.js';
import { createKitchenMusic, kitchenMusicTempo } from './kitchen-music.js';
import { THEMES, SPICES } from './themes.js';
import { INTRO_KEY, INTRO_SESSION_KEY, openingMode, openingHTML, startOpening } from './opening.js';
import { DEBUG_SCENES, TOUCH_DEMO_PARAM, isTouchControlsDemo, readDebugScene, setDebugParams } from './debug-scenes.js';
import grapeCandyPhoto from './assets/gift-grape-candy.webp';
import plushPhoto from './assets/gift-plush.webp';
import braisedSnacksPhoto from './assets/gift-braised-snacks.webp';
import instantFilmPhoto from './assets/gift-instant-film.webp';
import diffuserPhoto from './assets/gift-diffuser.webp';
import perfumePhoto from './assets/gift-perfume.webp';
import { FLOWER_GIFT_NAME, flowerGiftLetter, flowerGiftPhoto, flowerRoomHTML } from './flower-room.js';
import { createCandleMic } from './candle-mic.js';
import './style.css';
import './cooking.css';
import './opening.css';

const iconSet = { ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart, Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X, ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb, HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen, PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play, Hand, Scissors, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flame, Smartphone, RotateCw, Maximize, Minimize, Triangle, Leaf, Logs, Bug, Focus, SkipForward, Pause, Mic, Wind };
const KEY = 'birthday-bistro-cooking-v2';
const CONFIG_KEY = 'birthday-bistro-config-v1';
const MUTE_KEY = 'birthday-bistro-muted-v1';
const app = document.querySelector('#app');
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name, cls = '') => `<i data-lucide="${name}" ${cls ? `class="${cls}"` : ''} aria-hidden="true"></i>`;
const image = (type, cls = '', alt = '') => `<img src="${art(type)}" class="${cls}" alt="${esc(alt)}" draggable="false">`;
const read = (key, storage = localStorage) => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } };
const write = (key, value, storage = localStorage) => { try { storage.setItem(key, JSON.stringify(value)); } catch { toast('当前浏览器无法保存进度，请保持页面打开。'); } };
let baseConfig;
let config;
const params = new URLSearchParams(window.location.search);
let touchDemo = isTouchControlsDemo(params);
if (import.meta.env.DEV && touchDemo) await import('./touch-controls-demo.css');
const debug = params.get('debug') === '1';
const progress = debug ? normalizeProgress(null) : normalizeProgress(read(KEY));
const requestedChapter = Number(params.get('chapter'));
const initialScene = debug ? readDebugScene(params) : null;
const initialChapter = initialScene ? DEBUG_SCENES[initialScene].chapter
  : debug && Number.isInteger(requestedChapter) && requestedChapter >= 1 && requestedChapter <= 6
    ? requestedChapter - 1 : Math.min(progress.completed.length, 5);
const layout = params.get('layout');
const landscapeMedia = window.matchMedia('(orientation: landscape) and (max-height: 600px), (orientation: landscape) and (pointer: coarse)');
const portraitMedia = window.matchMedia('(orientation: portrait) and (pointer: coarse) and (hover: none)');
const sample = params.get('kitchen-polish');
let bentoVersion = import.meta.env.DEV && debug && initialChapter === 1 && ['before', 'after'].includes(sample) ? sample : null;
function createRound(chapter, debugging) {
  if (bentoVersion && debugging && chapter === 1) {
    return createBentoSample(layout === 'landscape' || (layout !== 'desktop' && landscapeMedia.matches),
      params.get('bgm-audition') === '1');
  }
  return createKitchen(chapter);
}
function usesKitchenPolish(chapter) {
  return chapter !== 1 || bentoVersion !== 'before';
}
const state = {
  debug,
  chapter: initialChapter, completed: progress.completed,
  finished: progress.finished, kitchen: createRound(initialChapter, debug), hint: 0, solved: false,
  feedback: '', feedbackKind: '', muted: true, ending: initialScene === 'flower' || initialScene === 'candles' || progress.completed.length === 6, candlesOut: progress.finished,
  flowerRoom: initialScene === 'flower' ? newFlowerRoom() : progress.flowerRoom,
  birthdayTransformed: initialScene === 'candles' || progress.finished || progress.flowerRoom?.phase === 'done',
  opening: initialScene === 'opening' ? 'story' : openingMode({
    debug, completed: progress.completed, seen: read(INTRO_KEY), entered: read(INTRO_SESSION_KEY, sessionStorage),
    preview: import.meta.env.DEV && new URLSearchParams(window.location.search).get('intro') === '1',
  }),
};
let kitchenController = null;
let orderResize;
let startCooking;
let kitchenEngineLoad;
let scoreEffects = null;
let pendingBirthdayNote = null;
let openingCleanup = () => {};
let endingCleanup = () => {};
let candleMic;
let candleListening = false;
let candleFinishTimer;
let modalCleanup = () => {};
let modalReturnFocus = null;
let toastTimeout;
let audioContext;
let wantsAudio = read(MUTE_KEY) !== true;
let musicTimer;
let kitchenMusic;
let musicPaused = false;
let noteStep = 0;
const GIFT_PHOTOS = [grapeCandyPhoto, plushPhoto, braisedSnacksPhoto, instantFilmPhoto, diffuserPhoto, perfumePhoto];
const giftPhoto = (index, alt = '') => `<img src="${GIFT_PHOTOS[index]}" class="gift-photo" alt="${esc(alt)}" decoding="async" draggable="false">`;

function syncPlayMode() {
  if (state.opening) return;
  const forced = layout === 'landscape' || layout === 'desktop';
  const landscape = layout === 'landscape' || (layout !== 'desktop' && landscapeMedia.matches);
  const rotate = !state.ending && !forced && portraitMedia.matches;
  document.body.classList.toggle('landscape-play', !state.ending && landscape);
  document.body.classList.toggle('forced-landscape', layout === 'landscape');
  document.body.classList.toggle('needs-rotation', rotate);
  const prompt = document.querySelector('.rotation-prompt');
  if (prompt) prompt.hidden = !rotate;
  document.querySelectorAll('.site-header, .app-main').forEach(el => { el.inert = rotate; });
  if (!rotate) kitchenController?.setLandscape(landscape);
  syncKitchenPause();
  presentBirthdayNote();
}
function syncKitchenPause() {
  const rotating = document.body.classList.contains('needs-rotation');
  const modal = document.body.classList.contains('modal-open');
  const working = !!document.querySelector('.bento-packing-modal, .memory-camera-modal, .memory-print-modal, .kitchen-puzzle-modal');
  musicPaused = rotating || (modal && !working);
  kitchenController?.setPaused(modal || rotating, modal && working && !rotating);
  syncMusic();
}
function syncFullscreenButton() {
  const button = document.querySelector('[data-action="fullscreen"]');
  if (!button) return;
  const active = !!document.fullscreenElement;
  button.innerHTML = icon(active ? 'minimize' : 'maximize');
  button.setAttribute('aria-label', active ? '退出全屏' : '全屏游玩');
  button.dataset.tooltip = active ? '退出全屏' : '全屏游玩';
  icons();
}
landscapeMedia.addEventListener('change', syncPlayMode);
portraitMedia.addEventListener('change', syncPlayMode);
document.addEventListener('fullscreenchange', syncFullscreenButton);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) candleMic?.stop();
  syncMusic();
});
window.addEventListener('pagehide', () => candleMic?.stop());

function icons() { createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.7 } }); }
function save() {
  if (state.debug) return;
  const { completed, finished, flowerRoom } = state;
  write(KEY, { completed, finished, ...(flowerRoom ? { flowerRoom } : {}) });
}
const inFlowerRoom = () => !state.opening && state.ending && state.flowerRoom && state.flowerRoom.phase !== 'done';
const hasFlowerGift = () => ['reveal', 'done'].includes(state.flowerRoom?.phase);
function debugControl({ className = '', mobileShortcut = false } = {}) {
  const optInShortcut = !import.meta.env.DEV && !state.debug;
  if (optInShortcut && !mobileShortcut) return '';
  return `<button class="icon-button ${state.debug ? 'debug-active' : ''} ${optInShortcut ? 'mobile-debug-shortcut' : ''} ${className}" data-action="debug-menu" aria-label="关卡调试" aria-pressed="${state.debug}" data-tooltip="关卡调试">${icon('bug')}</button>`;
}
function toast(message) {
  let el = document.querySelector('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('visible'), 3200);
}
function playNote(frequency, duration = 0.28, volume = 0.025, delay = 0, wave = 'sine') {
  if (state.muted || audioContext?.state !== 'running') return;
  try {
    const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    const start = audioContext.currentTime + delay;
    oscillator.type = wave; oscillator.frequency.value = frequency;
    oscillator.connect(gain); gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.start(start); oscillator.stop(start + duration);
  } catch { /* Audio is optional on browsers without Web Audio. */ }
}
function playKitchenCue(cue) {
  if (state.muted || document.hidden || audioContext?.state !== 'running') return;
  try {
    playKitchenSound(audioContext, cue);
  } catch { /* The game remains playable without sound. */ }
}
function syncMusic() {
  const room = inFlowerRoom();
  const adaptive = room || (usesKitchenPolish(state.chapter) && !state.opening && !state.ending);
  const silent = state.muted || audioContext?.state !== 'running' || document.hidden || candleListening;
  if (silent || adaptive) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  if (!adaptive) {
    kitchenMusic?.setMode(null);
    if (!silent && !musicTimer) {
      const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 329.63, 392, 523.25, 392, 293.66, 349.23, 392, 293.66];
      const tick = () => { if (!document.hidden) playNote(notes[noteStep++ % notes.length], .8, .025); };
      tick();
      musicTimer = setInterval(tick, 650);
    }
    return;
  }
  const mode = silent || musicPaused ? null : room ? 'flower' : kitchenMusicTempo(state.kitchen);
  kitchenMusic?.setMode(mode);
}
function syncAudioState() {
  const muted = !wantsAudio || audioContext?.state !== 'running';
  if (muted !== state.muted) {
    state.muted = muted;
    const button = app.querySelector('[data-action="music"]');
    if (button) {
      const [tag, attrs, children] = muted ? VolumeX : Volume2;
      button.replaceChildren(createElement([tag, { ...attrs, 'aria-hidden': 'true', 'stroke-width': 1.7 }, children]));
      button.setAttribute('aria-label', muted ? '播放背景音乐' : '关闭背景音乐');
      button.setAttribute('aria-pressed', String(!muted));
    }
  }
  syncMusic();
}
function unlockAudio() {
  try {
    if (!audioContext) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext = new Audio();
      audioContext.addEventListener('statechange', syncAudioState);
      kitchenMusic = createKitchenMusic(audioContext);
    }
    if (audioContext.state === 'running') syncAudioState();
    else void audioContext.resume().then(syncAudioState, () => {});
  } catch { /* The game remains playable without sound. */ }
}
function toggleMusic() {
  wantsAudio = state.muted;
  write(MUTE_KEY, !wantsAudio);
  if (wantsAudio) unlockAudio();
  else syncAudioState();
}
function startMusicOnGesture(event) {
  if (!event.isTrusted || !wantsAudio || !state.muted || candleListening) return;
  if (event.target.closest?.('[data-action="music"], [data-action="wish-mic"]')) return;
  if (event.type === 'keydown' && (event.repeat || event.altKey || event.ctrlKey || event.metaKey
    || !['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'e'].includes(event.key))) return;
  unlockAudio();
}
for (const type of ['click', 'pointerup', 'keydown']) document.addEventListener(type, startMusicOnGesture, true);

function updateFlowerRoom() {
  const scene = document.querySelector('#flower-room-scene');
  scene.innerHTML = flowerRoomHTML(state.flowerRoom, { icon, sender: esc(config.sender) });
  icons();
  scene.querySelector('h1').focus({ preventScroll: true });
  scene.scrollIntoView({ block: 'nearest', behavior: 'instant' });
}

function playFlowerRoom(action, color) {
  if (!inFlowerRoom()) return;
  const next = advanceFlowerRoom(state.flowerRoom, action, color);
  if (next === state.flowerRoom) return;
  state.flowerRoom = next;
  save();
  if (!state.muted && action === 'flower-light') {
    [523.25, 659.25, 783.99].forEach((pitch, i) => playNote(pitch, .5, .018, i * .085));
  }
  if (next.phase === 'done') {
    render();
    if (landscapeMedia.matches) showCandleScene();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  } else updateFlowerRoom();
}

function render() {
  kitchenMusic?.reset();
  openingCleanup(); openingCleanup = () => {};
  endingCleanup(); endingCleanup = () => {};
  clearTimeout(candleFinishTimer);
  candleMic?.stop(); candleMic = null;
  kitchenController?.destroy(); kitchenController = null;
  orderResize?.disconnect(); orderResize = null;
  scoreEffects?.destroy(); scoreEffects = null;
  if (pendingBirthdayNote?.kitchen !== state.kitchen) pendingBirthdayNote = null;
  syncDebugURL();
  document.body.classList.toggle('touch-controls-demo', touchDemo);
  document.body.classList.toggle('opening-mode', !!state.opening);
  document.body.dataset.playMode = state.debug ? 'debug' : 'story';
  if (state.opening) {
    document.body.classList.remove('cooking-mode', 'landscape-play', 'forced-landscape', 'needs-rotation');
    app.innerHTML = openingHTML({ mode: state.opening, sender: config.sender, muted: state.muted, icon, debugControl: debugControl({ mobileShortcut: true }) }) + '<div id="modal-root"></div>';
    openingCleanup = startOpening(app, {
      mode: state.opening, chapter: state.chapter, icon, icons,
      onCue: beat => {
        if (!state.muted) playNote([392, 523.25, 659.25, 523.25][beat], .45, .025);
      },
      onEnter: () => {
        if (!state.debug) {
          write(INTRO_KEY, true); write(INTRO_SESSION_KEY, true, sessionStorage);
        }
        state.opening = null;
        const url = new URL(window.location.href); url.searchParams.delete('intro');
        window.history.replaceState(null, '', url.href);
        render();
      },
    });
    // Let the opening paint once before warming the kitchen module.
    requestAnimationFrame(() => setTimeout(() => {
      if (state.opening) void loadKitchenEngine().catch(() => {});
    }, 0));
    syncMusic();
    return;
  }
  document.body.classList.toggle('cooking-mode', !state.ending);
  if (inFlowerRoom()) {
    app.innerHTML = `<main class="flower-room">
      <header class="flower-room-bar"><span class="flower-room-brand">${icon('chef-hat')}生日小厨房</span>
        <div class="flower-room-actions">${debugControl()}
        <button class="icon-button" data-action="music" aria-label="${state.muted ? '播放背景音乐' : '关闭背景音乐'}" aria-pressed="${!state.muted}">${icon(state.muted ? 'volume-x' : 'volume-2')}</button>
      </div></header><div id="flower-room-scene"></div>
    </main><div id="modal-root"></div>`;
    updateFlowerRoom();
    syncPlayMode();
    return;
  }
  const ch = CHAPTERS[state.chapter];
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="生日小厨房首页">
        <span class="brand-mark">${icon('chef-hat')}</span>
        <span><strong>生日小厨房<span class="brand-dot">.</span></strong><small>BIRTHDAY BISTRO</small></span>
      </a>
      <span class="header-dedication">今晚，只接你这一单。</span>
      ${!state.ending ? `<div class="shift-hud" aria-label="本关挑战"><span class="shift-clock" aria-label="剩余时间">${icon('timer')}<strong id="shift-time"></strong></span><span class="shift-score" aria-label="得分与通关目标">${icon('star')}<strong id="shift-score"></strong></span></div>` : ''}
      <div class="header-actions">
        <span class="open-badge"><span></span> ${state.debug ? '开发调试' : '只为你营业'}</span>
        ${debugControl({ className: state.debug && state.ending ? 'ending-debug-control' : '', mobileShortcut: !state.ending })}
        ${import.meta.env.DEV ? `<button class="icon-button desktop-preview-button" data-action="phone-preview" aria-label="手机横屏预览" data-tooltip="手机横屏预览">${icon('smartphone')}</button>` : ''}
        ${!state.ending ? `<button class="icon-button" data-action="kitchen-clue" aria-label="查看本关线索" data-tooltip="查看本关线索">${icon('notebook-pen')}</button>` : ''}
        ${!state.ending ? `<button class="icon-button landscape-tool" data-action="hint-shortcut" aria-label="下一步提示" data-tooltip="下一步提示">${icon('lightbulb')}</button><button class="icon-button landscape-tool" data-action="album-shortcut" aria-label="我的礼物簿" data-tooltip="我的礼物簿">${icon('book-heart')}</button><button class="icon-button landscape-tool" data-action="fullscreen" aria-label="${document.fullscreenElement ? '退出全屏' : '全屏游玩'}" data-tooltip="${document.fullscreenElement ? '退出全屏' : '全屏游玩'}" ${!document.fullscreenEnabled ? 'hidden' : ''}>${icon(document.fullscreenElement ? 'minimize' : 'maximize')}</button>` : ''}
        <button class="icon-button" data-action="music" aria-label="${state.muted ? '播放背景音乐' : '关闭背景音乐'}" aria-pressed="${!state.muted}" data-tooltip="背景音乐">${icon(state.muted ? 'volume-x' : 'volume-2')}</button>
        <button class="icon-button" data-action="share" aria-label="手机扫码玩" data-tooltip="手机扫码玩">${icon('qr-code')}</button>
        <button class="icon-button" data-action="settings" aria-label="编辑生日心意" data-tooltip="编辑生日心意">${icon('settings')}</button>
      </div>
    </header>
    <main class="app-main">
      <div class="welcome-line">
        <div><div class="eyebrow">A LITTLE KITCHEN, A LOT OF LOVE</div><h1>${state.ending ? '生日快乐，我最喜欢的人。' : `${esc(config.recipient)}，今天也要开心。`}</h1><p>${state.ending ? '这一桌心意，都是为你准备的。' : '六道特别菜单，藏着六份想送给你的心意。'}</p></div>
        <div class="service-date"><span>今日预约</span><strong>ONLY YOU</strong><small>${icon('heart')} 一位特别的客人</small></div>
      </div>
      ${state.ending ? endingHTML() : `
      <div class="restaurant">
        <aside class="menu-column">
          <div class="section-label"><span>生日特别菜单</span>${icon('utensils')}</div>
          <nav class="chapter-nav" aria-label="关卡菜单">${CHAPTERS.map((c, i) => {
            const done = state.completed.includes(i); const available = state.debug || i <= state.completed.length;
            return `<button class="chapter ${i === state.chapter ? 'active' : ''} ${done ? 'complete' : ''}" data-action="chapter" data-index="${i}" ${!available ? 'disabled' : ''} ${i === state.chapter ? 'aria-current="step"' : ''}>
              <span class="chapter-illustration" style="--chapter-color:${c.color}">${icon(c.icon)}</span>
              <span class="chapter-copy"><small>0${i + 1} ${done ? '· 已送达' : i === state.chapter ? '· 制作中' : ''}</small><strong>${c.short}</strong></span>
              <span class="chapter-status">${icon(done ? 'check' : available ? 'arrow-right' : 'lock')}</span>
            </button>`;
          }).join('')}</nav>
          <div class="menu-bottom"><div class="tiny-progress"><span style="width:${state.completed.length / 6 * 100}%"></span></div><p><strong>${state.completed.length}</strong> / 6 份心意已送达</p><button class="text-button" data-action="album">${icon('book-heart')} 我的礼物簿</button></div>
          <div class="sidebar-note">${icon('heart')} 和你一起，忙碌也很开心。</div>
        </aside>
        <section class="game-column" aria-label="实时厨房游戏">
          <div class="scene-heading"><div><span class="chapter-tag">0${state.chapter + 1} · ${THEMES[state.chapter].name}</span><h2>${DISHES[state.chapter].name}</h2></div><button class="secondary-button replay-round" data-action="confirm-retry">${icon('rotate-ccw')}重玩本关</button></div>
          <div class="order-strip">
            <div class="order-queue" role="region" aria-label="滚动订单队列" tabindex="0"></div>
            <div class="order-pagination" hidden>
              <button type="button" data-action="order-page" data-index="-1" aria-label="上一页订单" title="上一页订单">${icon('chevron-left')}</button>
              <span class="order-page-count"></span>
              <button type="button" data-action="order-page" data-index="1" aria-label="下一页订单" title="下一页订单">${icon('chevron-right')}</button>
            </div>
          </div>
          <div class="kitchen-scene" id="kitchen-host">${startCooking ? '' : '<div class="kitchen-loading" role="status">厨房准备中…</div>'}</div>
          <div class="kitchen-feedback" id="kitchen-feedback" role="status" aria-live="polite">${esc(state.kitchen.message)}</div>
          ${controlsHTML()}
          <button class="primary-button birthday-note-button full-width" data-action="serve" ${!state.solved && !state.completed.includes(state.chapter) ? 'hidden' : ''}>${icon('gift')}打开我的生日便笺${icon('arrow-right')}</button>
        </section>
        <aside class="order-column">
          <section class="order-ticket">
            <div class="ticket-top"><span>一份专属订单</span>${icon('notebook-pen')}</div>
            <div class="ticket-number">ORDER <strong>#001</strong></div>
            <h3>${DISHES[state.chapter].name}</h3><p class="order-subtitle">${DISHES[state.chapter].subtitle}</p>
            <div class="ticket-rule"></div>
            <div class="recipe-label">${icon('utensils')} 订单内容 · 每单 ${ORDER_POINTS} 分</div>
            <p class="queue-summary"></p>
            <div class="cooking-recipe">${recipePartsHTML()}</div>
            <div class="theme-clue"><strong>${THEMES[state.chapter].title}</strong><p>${kitchenClue(state.kitchen)}</p><span class="theme-progress"></span></div>
            <div class="ticket-rule"></div>
            ${APPLIANCES.map(([method, second]) => [method, second].map((id, i) => {
              const name = `${method === 'pot' ? '煮锅' : '烤箱'} ${i + 1}`;
              return `<div class="appliance-status" data-appliance="${id}"><span>${icon(method === 'pot' ? 'cooking-pot' : 'flame')}${name}</span><strong>空闲</strong><div role="progressbar" aria-label="${name}进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div></div>`;
            }).join('')).join('')}
            <div class="ticket-footer cooking-ticket-footer"><span>${icon('heart')} 好吃的，值得慢慢等</span><span class="plated-count">0 / ${DISHES[state.chapter].parts.length}</span></div>
          </section>
          <section class="helper-area"><div class="helper-heading"><span class="helper-avatar">${icon('chef-hat')}</span><div><strong>${esc(config.sender)}</strong><span>随时待命的副厨</span></div><span class="online-dot"></span></div>
            <p>${state.hint ? esc(nextTask(state.kitchen)) : '铃声响啦，下一份期待已经在路上。主厨加油，我陪着你。'}</p>
            <button class="helper-button" data-action="hint">${icon('lightbulb')}小助手，接下来呢？</button>
          </section>
        </aside>
      </div>`}
      <footer class="site-footer"><span>用一点点胡闹，和很多很多喜欢做成。</span><span>${icon('heart')} MADE JUST FOR YOU</span></footer>
    </main>
    <section class="rotation-prompt" aria-labelledby="rotation-title" hidden>
      <span class="rotation-brand">${icon('chef-hat')}生日小厨房</span>
      <div class="rotation-symbol" aria-hidden="true">${icon('smartphone')}${icon('rotate-cw')}</div>
      <h2 id="rotation-title">把手机横过来，开饭啦。</h2>
      <p>你的小厨房和生日惊喜，都在这里等你。</p>
      <span class="rotation-pause">${icon('heart')}做菜进度已暂停，放心转个方向。</span>
      ${debugControl({ mobileShortcut: true })}
      ${import.meta.env.DEV ? `<button class="secondary-button" data-action="phone-preview">${icon('smartphone')}在电脑上预览</button>` : ''}
    </section>
    ${state.ending ? '' : '<div class="score-effects" aria-hidden="true"></div>'}
    <div id="modal-root"></div>`;
  icons();
  if (!state.ending) {
    scoreEffects = createScoreEffects(app);
    const strip = app.querySelector('.order-strip');
    orderResize = new ResizeObserver(() => layoutOrderPage(strip));
    orderResize.observe(strip);
    strip.querySelector('.order-queue').addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      layoutOrderPage(strip, event.key === 'ArrowLeft' ? -1 : 1);
    });
    mountKitchen();
  }
  syncPlayMode();
  if (state.ending) {
    startCandleScene();
    startBirthdayTransformation();
    if (state.debug && state.birthdayTransformed && !state.candlesOut) showCandleScene();
  }
}

function loadKitchenEngine() {
  return kitchenEngineLoad ??= import('./kitchen-engine.js').then(module => {
    startCooking = module.startCooking;
    return startCooking;
  }).catch(error => {
    kitchenEngineLoad = null;
    throw error;
  });
}

function mountKitchen() {
  const host = document.querySelector('#kitchen-host');
  const mount = start => {
    if (!host.isConnected) return;
    if (touchDemo) state.kitchen.touchControlsDemo = true;
    kitchenController = start(host, document.querySelector('.cooking-controls'), state.kitchen, {
      onUpdate: handleKitchenUpdate,
      onPuzzle: openKitchenPuzzle,
      onPhoto: openMemoryCamera,
      onPacking: openBentoPacking,
      onKitchenCue: playKitchenCue,
      onExpired: openChallengeResult,
    }, usesKitchenPolish(state.kitchen.chapter), touchDemo ? .86 : 1);
    host.querySelector('.kitchen-loading')?.remove();
  };
  if (startCooking) mount(startCooking);
  else {
    updateCookingUI(state.kitchen);
    void loadKitchenEngine().then(start => {
      if (!host.isConnected) return;
      mount(start);
      syncPlayMode();
    }).catch(() => {
      if (!host.isConnected) return;
      const status = host.querySelector('.kitchen-loading');
      if (status) status.innerHTML = '<p>厨房加载失败。</p><button class="secondary-button" data-action="kitchen-load-retry">重新加载</button>';
    });
  }
}

function handleKitchenUpdate(k, change) {
  if (usesKitchenPolish(k.chapter)) syncMusic();
  if (change) {
    const { served, missed } = change;
    const note = served && k.delivered ? { kitchen: k, ready: false } : null;
    if (note) {
      state.solved = true;
      pendingBirthdayNote = note;
    }
    // Read the outgoing tickets before the queue swaps to the new order IDs.
    void scoreEffects.play(k, change, () => {
      if (!state.muted) playNote(1175, .35, .035);
    }).finally(() => {
      if (!note || pendingBirthdayNote !== note) return;
      note.ready = true;
      presentBirthdayNote();
    });
    if (!state.muted) {
      if (served && !usesKitchenPolish(k.chapter)) {
        playNote(660, .24, .04);
        playNote(880, .32, .04, .085);
      } else if (missed?.length) {
        playNote(330, .15, .035, 0, 'triangle');
        playNote(220, .19, .035, .09, 'triangle');
      }
    }
    if (missed?.length) toast(`${missed.length} 张订单超时 −${missed.length * ORDER_PENALTY} 分 · 当前 ${k.score} / ${k.targetScore} 分`);
    else if (served && !k.delivered) toast(`出餐 +${ORDER_POINTS} 分 · ${k.score} / ${k.targetScore} 分 · ${k.orders.length ? `还有 ${k.orders.length} 单待送` : '等候新订单'}`);
  }
  updateCookingUI(k);
}

const PREPARATION_EMOJI = { cut: '🔪', pot: '🍲', oven: '🔥' };
function orderPreparationHTML(part, chapter) {
  const cut = part.id === 'jam' || INGREDIENTS[part.id].cut;
  const actions = [...(cut ? ['cut'] : []), ...(part.method === 'fresh' ? [] : [part.method])];
  const method = part.method === 'pot' ? (chapter === 2 ? '卤煮' : '煮') : part.method === 'oven' ? '烤' : '装盘';
  const label = part.id === 'jam' ? '双果切后同煮' : (cut ? '切后' : '直接') + method;
  return `<span class="recipe-method" role="img" aria-label="${label}">${actions.map(action =>
    `<span class="recipe-action" data-method="${action}" aria-hidden="true">${PREPARATION_EMOJI[action]}</span>`).join('')}</span>`;
}
function recipePartsHTML(order = state.kitchen.orders[0]) {
  const hidden = state.chapter === 0 && !state.kitchen.puzzle.solved;
  return orderRecipe(state.chapter, order).parts.map((part, index) => {
    const mysteryJam = hidden && part.id === 'jam';
    const name = part.id === 'jam' ? (mysteryJam ? '神秘双果酱' : '爱心双果酱') : INGREDIENTS[part.id].name;
    return `<div class="recipe-part" data-part="${index}">${mysteryJam ? `<span class="unknown-fruit">${icon('cherry')}</span>` : image(part.id)}
      <span class="recipe-part-name"><strong>${name}</strong>${orderPreparationHTML(part, state.chapter)}</span>
      <span class="recipe-part-check">${icon('check')}</span></div>`;
  }).join('');
}
function layoutOrderPage(strip, direction = 0) {
  const cards = [...strip.querySelectorAll('.rolling-order')];
  const width = strip.clientWidth;
  const ticketSpace = Number.parseFloat(getComputedStyle(strip).getPropertyValue('--order-page-ticket-space')) || 188;
  const paginationSpace = Number.parseFloat(getComputedStyle(strip).getPropertyValue('--order-page-nav-space')) || 82;
  const singlePageSize = Math.max(1, Math.floor((width + 6) / ticketSpace));
  const pageSize = cards.length <= singlePageSize ? singlePageSize : Math.max(1, Math.floor((width + 6 - paginationSpace) / ticketSpace));
  const pages = Math.max(1, Math.ceil(cards.length / pageSize));
  const activeId = strip.dataset.firstOrder;
  const activeIndex = cards.findIndex(card => card.dataset.orderId === activeId);
  const current = activeIndex < 0 ? Number(strip.dataset.page || 0) : Math.floor(activeIndex / pageSize);
  const page = Math.min(pages - 1, Math.max(0, current + direction));
  cards.forEach((card, i) => { card.hidden = Math.floor(i / pageSize) !== page; });
  strip.dataset.page = String(page);
  strip.dataset.firstOrder = cards[page * pageSize]?.dataset.orderId || '';
  strip.querySelector('.order-pagination').hidden = pages <= 1;
  const [prev, next] = strip.querySelectorAll('[data-action="order-page"]');
  prev.disabled = page === 0;
  next.disabled = page + 1 === pages;
  strip.querySelector('.order-page-count').textContent = `${page + 1}/${pages}`;
}
function openChallengeResult() {
  const k = state.kitchen;
  openModal(`<span class="modal-eyebrow">ONE MORE ROUND</span><h2>铃声响啦，这轮辛苦了。</h2>
    <div class="challenge-result"><strong>${k.score}<small> / ${k.targetScore} 分</small></strong><span>完成 ${k.deliveries} 单 · 超时 ${k.missedOrders} 单 · 还差 ${Math.max(0, k.targetScore - k.score)} 分</span></div>
    <button class="primary-button full-width" data-action="retry-dish">${icon('rotate-ccw')}重玩本关</button>`, 'challenge-result-modal');
}
function controlsHTML() {
  return `<section class="cooking-controls" aria-label="主厨操作区">
    <div class="joystick" role="group" aria-label="移动摇杆">
      ${[['up', 'chevron-up'], ['down', 'chevron-down'], ['left', 'chevron-left'], ['right', 'chevron-right']].map(([dir, symbol]) => `<button class="stick-direction ${dir}" data-move="${dir}" aria-label="向${{ up: '上', down: '下', left: '左', right: '右' }[dir]}移动">${icon(symbol)}</button>`).join('')}
      <span class="joystick-knob" aria-hidden="true"></span>
    </div>
    <div class="hands-status"><small>主厨手里</small><div id="hands-icon">${icon('hand')}</div><strong id="hands-name">两手空空</strong><span id="nearby-station">走进你的小厨房</span></div>
    <div class="cooking-buttons">
      <button class="cook-button chop-button" data-action="kitchen-chop" aria-label="切配" title="按住切配" disabled><span class="chop-meter"></span>${icon('scissors')}<span>按住切配</span></button>
      <button class="cook-button interact-button" data-action="kitchen-interact" aria-label="取放与操作" title="取放与操作">${icon('hand')}<span id="interact-label">靠近工作台</span></button>
    </div>
  </section>`;
}
function updateCookingUI(k) {
  const host = document.querySelector('#kitchen-host');
  if (!host || state.ending) return;
  host.dataset.theme = String(k.chapter);
  host.dataset.score = String(k.score);
  host.dataset.targetScore = String(k.targetScore);
  host.dataset.deliveries = String(k.deliveries);
  host.dataset.timeLeft = String(Math.ceil(k.timeLeft));
  host.dataset.expired = String(k.expired);
  host.dataset.missedOrders = String(k.missedOrders);
  host.dataset.orderCount = String(k.orders.length);
  host.dataset.orderIds = k.orders.map(order => order.id).join(',');
  const seconds = Math.ceil(k.timeLeft);
  document.querySelector('#shift-time').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  scoreEffects.sync(k);
  document.querySelector('.shift-hud').classList.toggle('urgent', !k.delivered && seconds <= 30);
  host.dataset.puzzleSolved = String(k.puzzle.solved);
  host.dataset.steamReady = String(k.puzzle.steam >= 2);
  host.dataset.lampServed = String(!!k.places.lamp);
  host.dataset.flowersServed = String(!!k.places.flowers);
  host.dataset.spiceBag = k.spices.join(',');
  host.dataset.brothReady = String(k.broth.length === 3 || k.broth2.length === 3);
  host.dataset.photoMeal = String(!!k.photo.meal);
  host.dataset.photoShots = String(k.photo.shots);
  host.dataset.packingStep = String(k.packing.step);
  host.dataset.packingMeal = String(!!k.packing.meal);
  const revealed = String(k.puzzle.solved);
  const displayedOrder = k.delivered ? k.lastServedOrder : k.orders[0];
  const recipe = orderRecipe(k.chapter, displayedOrder);
  const recipeKey = `${revealed}:${displayedOrder?.id}`;
  if (host.dataset.recipeKey !== recipeKey) {
    host.dataset.recipeKey = recipeKey;
    document.querySelector('.order-ticket .ticket-number strong').textContent = displayedOrder ? `#${String(displayedOrder.id).padStart(3, '0')}` : '—';
    document.querySelector('.order-ticket h3').textContent = displayedOrder ? recipe.name : '等待下一张订单';
    document.querySelector('.order-subtitle').textContent = displayedOrder ? recipe.subtitle || '按订单备好这次的食材。' : '';
    document.querySelector('.cooking-recipe').innerHTML = displayedOrder ? recipePartsHTML(displayedOrder) : '';
    icons();
  }
  const queue = document.querySelector('.order-queue');
  const queueKey = `${host.dataset.orderIds}:${revealed}:${k.delivered}`;
  if (queue.dataset.queueKey !== queueKey) {
    queue.dataset.queueKey = queueKey;
    queue.innerHTML = k.delivered ? '<span class="queue-empty">挑战达标</span>' : k.orders.length ? k.orders.map(order => `
      <article class="rolling-order" data-order-id="${order.id}" aria-label="订单 ${order.id}：${esc(orderRecipe(k.chapter, order).name)}">
        <div class="order-heading"><span class="order-sequence">订单 ${String(order.id).padStart(2, '0')}</span><span class="order-time"></span></div>
        <div class="order-food">${recipePartsHTML(order)}</div>
        <div class="order-patience" role="progressbar" aria-label="订单 ${order.id} 剩余时间" aria-valuemin="0" aria-valuemax="${CHALLENGES[k.chapter].orderLifetime}"><span></span></div>
      </article>`).join('') : '<span class="queue-empty">等候新订单 <span class="next-order-time"></span></span>';
    layoutOrderPage(queue.parentElement);
    icons();
  }
  for (const order of k.orders) {
    const card = queue.querySelector(`[data-order-id="${order.id}"]`);
    if (!card) continue;
    const remaining = Math.max(0, order.expiresAt - k.elapsed);
    const total = order.expiresAt - order.createdAt;
    const whole = Math.ceil(remaining);
    card.querySelector('.order-time').textContent = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    card.querySelector('.order-patience').setAttribute('aria-valuenow', String(whole));
    card.querySelector('.order-patience > span').style.width = `${remaining / total * 100}%`;
    card.classList.toggle('urgent', remaining <= 30);
    card.classList.toggle('order-expiring', remaining <= 5);
    const progress = plateProgress(k, order);
    card.querySelectorAll('[data-part]').forEach(element =>
      element.classList.toggle('plated', progress[Number(element.dataset.part)]));
  }
  const nextArrival = Math.max(0, Math.ceil(k.nextOrderAt - k.elapsed));
  const next = queue.querySelector('.next-order-time');
  if (next) next.textContent = `${nextArrival}s`;
  document.querySelector('.queue-summary').textContent = `${k.orders.length} 单待送 · 超时扣 ${ORDER_PENALTY} 分${!k.delivered && k.nextOrderAt < CHALLENGES[k.chapter].seconds ? ` · ${nextArrival}s 后来单` : ''}`;
  document.querySelector('.theme-progress').textContent = k.puzzle.solved ? '特别心意已完成' : k.chapter === 1 && k.packing.meal ? `便当打包中 · ${k.packing.step} / 3` : k.chapter === 3 && k.photo.meal ? '晚餐已上桌，等一张合照' : k.puzzle.steam >= 2 ? '玻璃上出现了字' : '特别心意尚未完成';
  const clue = document.querySelector('.theme-clue p');
  if (clue.textContent !== kitchenClue(k)) clue.textContent = kitchenClue(k);
  const label = actionLabel(k);
  const action = document.querySelector('#interact-label');
  if (action.textContent !== label) action.textContent = label;
  document.querySelector('[data-action="kitchen-interact"]').title = label;
  document.querySelector('[data-action="kitchen-interact"]').disabled = !nearestStation(k) || k.delivered || k.expired;
  document.querySelector('[data-action="kitchen-chop"]').disabled = !canChop(k);
  document.querySelector('.chop-meter').style.height = `${k.board.progress / CHOP_SECONDS * 100}%`;
  const holding = itemName(k.holding);
  const name = document.querySelector('#hands-name');
  if (name.textContent !== holding) {
    name.textContent = holding;
    document.querySelector('#hands-icon').innerHTML = k.holding?.type === 'ingredient' ? image(k.holding.id) : icon(k.holding?.type === 'spice' ? SPICES[k.holding.id].symbol : ['spicebag', 'bento'].includes(k.holding?.type) ? 'shopping-bag' : k.holding ? 'utensils' : 'hand');
    icons();
  }
  const near = nearestStation(k);
  document.querySelector('#nearby-station').textContent = near?.type === 'puzzle' ? THEMES[k.chapter].station : near ? near.name || '新鲜食材柜' : '走进你的小厨房';
  const feedback = document.querySelector('#kitchen-feedback');
  if (feedback.textContent !== k.message) feedback.textContent = k.message;
  feedback.className = `kitchen-feedback ${k.messageKind}`;
  const plated = plateProgress(k);
  document.querySelectorAll('.cooking-recipe [data-part]').forEach(element => {
    element.classList.toggle('plated', plated[Number(element.dataset.part)] || k.delivered);
  });
  document.querySelector('.plated-count').textContent = !displayedOrder ? '' : `${k.delivered ? recipe.parts.length : plated.filter(Boolean).length} / ${recipe.parts.length}`;
  for (const id of APPLIANCES.flat()) {
    const job = k[id]; const el = document.querySelector(`[data-appliance="${id}"]`);
    el.querySelector('strong').textContent = !job.item ? '空闲' : job.waiting ? '等待第二种水果' : job.ready ? '已熟 · 随时可取' : `还有 ${Math.ceil(job.duration - job.elapsed)} 秒`;
    const percent = job.item ? job.elapsed / job.duration * 100 : 0;
    el.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(Math.round(percent)));
    el.querySelector('[role="progressbar"] > span').style.width = `${percent}%`;
    el.classList.toggle('ready', job.ready);
    host.setAttribute(`data-${id}-state`, !job.item ? 'empty' : job.waiting ? 'waiting' : job.ready ? 'ready' : 'cooking');
  }
  host.dataset.boardState = k.board.item ? k.board.item.cut ? 'cut' : 'raw' : 'empty';
  document.querySelector('.birthday-note-button').hidden = !!pendingBirthdayNote
    || (!k.delivered && !state.solved && !state.completed.includes(state.chapter));
  if (state.hint) document.querySelector('.helper-area > p').textContent = nextTask(k);
}

function openKitchenClue() {
  const k = state.kitchen;
  const theme = THEMES[k.chapter];
  k.puzzle.inspected = true;
  openModal(`<span class="clue-source">${icon('notebook-pen')}第 ${k.chapter + 1} 站 · ${theme.station}</span>
    <h2>${theme.title}</h2>
    <p class="clue-copy">${kitchenClue(k)}</p>
    <button class="primary-button full-width" data-action="close">继续料理${icon('arrow-right')}</button>`, 'kitchen-clue-modal');
}

function openKitchenPuzzle() {
  const k = state.kitchen;
  if (k.chapter !== 5) { openKitchenClue(); return; }
  const theme = THEMES[k.chapter];
  const sequence = finaleOrder(k.holding);
  const recipes = [0, 1].map(variant => orderRecipe(k.chapter, { variant }).parts);
  const choices = [...new Set(recipes.flatMap(parts => parts.map(part => part.id)))];
  const mains = [...new Set(recipes.map(parts => parts[1].id))];
  const ready = plateMatches(k.holding, k.chapter) || plateMatches(k.holding, k.chapter, 1);
  const captions = ['前奏', '主调', '尾声'];
  const options = choices.map(id => `<option value="${id}">${INGREDIENTS[id].name}</option>`).join('');
  const fields = `<div class="puzzle-order">${captions.map((caption, i) => `<label>${caption}<select class="text-input" name="slot-${i}" required><option value="">请选择</option>${options}</select></label>`).join('')}</div>
    <p class="puzzle-carry-note">${ready ? '完整餐盘已就位。' : '请端着完整料理的餐盘回来。'}</p>`;
  const reference = `<div class="meal-reference">${sequence.map((id, i) => `<span>${i === 1 && !ready ? `<span class="meal-alternatives">${mains.map(main => image(main, '', INGREDIENTS[main].name)).join('<small>或</small>')}</span>` : image(id)}<small>${captions[i]}</small></span>`).join('')}</div>`;
  openModal(`<div class="puzzle-story"><span class="modal-eyebrow">KITCHEN 0${k.chapter + 1} · ${theme.name}</span><h2>${theme.title}</h2><p class="puzzle-clue">${theme.clue}</p>${reference}</div><form id="kitchen-puzzle-form">${fields}<p class="puzzle-result" role="status"></p><button class="primary-button full-width" type="submit">${icon('utensils')}按餐序摆好料理</button></form>`, 'kitchen-puzzle-modal');
}

function openBentoPacking() {
  const k = state.kitchen;
  if (k.chapter !== 1 || !k.packing.meal || k.delivered) return;
  openModal(`<div class="bento-heading"><span class="modal-eyebrow">FOR YOUR DAY · 02</span><h2>给出门的你，带一份惦记。</h2></div>
    <canvas id="bento-packing" width="900" height="600" role="img" aria-label="装好饭菜的便当盒"></canvas>
    <div class="bento-tools">
      <div class="bento-pieces" role="group" aria-label="便当打包材料">${PACKING_STEPS.map((step, i) => `<button class="bento-piece" data-packing-piece="${step.id}" aria-label="${step.label}"><canvas width="180" height="112" aria-hidden="true"></canvas><span class="bento-piece-label"><span>${i + 1}</span>${step.label}${icon('check')}</span></button>`).join('')}</div>
      <p class="bento-status" role="status"></p>
      <button class="primary-button bento-take" data-action="bento-take" disabled>${icon('shopping-bag')}带上便当${icon('arrow-right')}</button>
    </div>`, 'bento-packing-modal');
  const root = document.querySelector('.bento-packing-modal');
  const canvas = root.querySelector('#bento-packing');
  const polish = usesKitchenPolish(k.chapter);
  const carrot = k.packing.meal.contents.some(item => item.id === 'carrot');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  function animatePacking(id) {
    cancelAnimationFrame(frame);
    const step = k.packing.step;
    const start = performance.now();
    const duration = [0, 390, 280, 310][step];
    let landed = false;
    const draw = time => {
      const progress = Math.min(1, Math.max(0, (time - start) / duration));
      paintPackingTable(canvas, step, progress, polish, carrot);
      if (!landed && progress >= .74) {
        landed = true;
        playKitchenCue(id);
      }
      if (progress < 1) frame = requestAnimationFrame(draw);
    };
    draw(start);
  }
  const update = () => {
    root.dataset.step = String(k.packing.step);
    canvas.setAttribute('aria-label', ['装好饭菜的便当盒', '盖好盒盖的便当', '套好绑带的便当', '贴好爱心封签的便当'][k.packing.step]);
    root.querySelectorAll('[data-packing-piece]').forEach((button, i) => {
      button.disabled = i < k.packing.step;
      button.classList.toggle('current', i === k.packing.step);
      button.classList.toggle('done', i < k.packing.step);
      if (i === k.packing.step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    root.querySelector('.bento-take').disabled = k.packing.step !== 3;
    root.querySelector('.bento-status').textContent = k.packing.step ? PACKING_STEPS[k.packing.step - 1].done : '饭菜装好啦，还热乎着呢。';
    updateCookingUI(k);
  };
  const apply = id => {
    const success = packBento(k, id);
    update();
    if (!success) root.querySelector('.bento-status').textContent = k.message;
    if (!success) return;
    if (polish && !reduceMotion.matches) animatePacking(id);
    else {
      cancelAnimationFrame(frame);
      paintPackingTable(canvas, k.packing.step, 1, polish, carrot);
      if (polish) playKitchenCue(id);
      else if (!state.muted) playNote(523.25 + k.packing.step * 65, .2);
    }
  };
  let ghost = null;
  root.querySelectorAll('[data-packing-piece]').forEach(button => {
    const id = button.dataset.packingPiece;
    const piece = button.querySelector('canvas');
    const c = piece.getContext('2d');
    const width = id === 'seal' ? 190 : 140;
    paintPackingPiece(c, id, 90, 56, width);
    let drag = null; let dragged = false;
    button.addEventListener('click', event => {
      if (event.detail && dragged) return;
      apply(id);
    });
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragged = false; drag = { x: event.clientX, y: event.clientY };
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointermove', event => {
      if (!drag) return;
      if (!dragged && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      dragged = true;
      if (!ghost) {
        ghost = document.createElement('canvas'); ghost.width = 180; ghost.height = 112; ghost.className = 'bento-drag-piece';
        ghost.getContext('2d').drawImage(piece, 0, 0);
        root.append(ghost);
      }
      ghost.style.left = `${event.clientX}px`; ghost.style.top = `${event.clientY}px`;
    });
    const end = event => {
      if (!drag) return;
      drag = null; ghost?.remove(); ghost = null;
      if (!dragged || event.type === 'pointercancel') return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width; const y = (event.clientY - rect.top) / rect.height;
      if (x >= .13 && x <= .87 && y >= .2 && y <= .93) apply(id);
      else root.querySelector('.bento-status').textContent = '材料放回原处啦，便当还在这里。';
    };
    button.addEventListener('pointerup', end); button.addEventListener('pointercancel', end);
  });
  const cleanup = modalCleanup;
  modalCleanup = () => { cleanup(); ghost?.remove(); cancelAnimationFrame(frame); };
  paintPackingTable(canvas, k.packing.step, 1, polish, carrot);
  update();
}

function memoryPhotoURL(settings) {
  const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 640;
  paintMemoryPhoto(canvas, settings);
  return canvas.toDataURL('image/png');
}
function openMemoryCamera() {
  const k = state.kitchen;
  if (k.chapter !== 3 || !k.photo.meal || k.delivered) return;
  if (k.photo.capture) { openMemoryPrint(); return; }
  openModal(`<div class="memory-camera-heading"><span class="modal-eyebrow">MEMORY 04</span><h2>把今天，也留在照片里。</h2></div>
    <div class="memory-viewfinder">
      <canvas id="memory-camera" width="960" height="640" role="img" aria-label="双人晚餐取景画面"></canvas>
      <span class="memory-frame" aria-hidden="true"></span><span class="memory-focus-mark" aria-hidden="true"></span>
      <span class="memory-live">04 · 今晚的双人餐</span>
    </div>
    <div class="memory-camera-tools">
      <div class="memory-direction-pad" role="group" aria-label="取景位置">
        ${[['up', 'chevron-up', '向上取景'], ['left', 'chevron-left', '向左取景'], ['center', 'focus', '居中取景'], ['right', 'chevron-right', '向右取景'], ['down', 'chevron-down', '向下取景']].map(([dir, symbol, label]) => `<button class="icon-button memory-${dir}" data-camera-move="${dir}" aria-label="${label}" data-tooltip="${label}">${icon(symbol)}</button>`).join('')}
      </div>
      <label class="memory-focus-control">${icon('focus')}<span>焦点</span><input type="range" id="memory-focus" aria-label="焦点" min="0" max="100" value="${k.photo.focus}"></label>
      <button class="memory-shutter" data-action="memory-shutter" aria-label="拍照" data-tooltip="拍照">${icon('camera')}</button>
      <div class="memory-camera-status" role="status"><span id="memory-framing-status"></span><span id="memory-focus-status"></span></div>
    </div>`, 'memory-camera-modal');
  const canvas = document.querySelector('#memory-camera');
  const root = document.querySelector('.memory-camera-modal');
  const carrot = k.photo.meal.contents.some(item => item.id === 'carrot');
  const update = () => {
    paintMemoryPhoto(canvas, { ...k.photo, carrot });
    const quality = memoryPhotoQuality(k.photo);
    root.dataset.ready = String(quality.ready);
    document.querySelector('#memory-framing-status').textContent = quality.framed ? '两套餐具都入镜了' : '还有餐具在画面外';
    document.querySelector('#memory-focus-status').textContent = quality.focused ? '焦点清晰' : '焦点有些模糊';
    document.querySelector('#memory-focus').value = String(k.photo.focus);
  };
  const move = dir => {
    const delta = { left: [-6, 0], right: [6, 0], up: [0, -6], down: [0, 6] }[dir];
    adjustMemoryCamera(k, dir === 'center' ? { x: 0, y: 0 } : { x: k.photo.x + delta[0], y: k.photo.y + delta[1] });
    update();
  };
  root.querySelectorAll('[data-camera-move]').forEach(button => button.addEventListener('click', () => move(button.dataset.cameraMove)));
  root.querySelector('#memory-focus').addEventListener('input', event => { adjustMemoryCamera(k, { focus: Number(event.target.value) }); update(); });
  let drag = null;
  canvas.addEventListener('pointerdown', event => {
    drag = { x: event.clientX, y: event.clientY, startX: k.photo.x, startY: k.photo.y };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    adjustMemoryCamera(k, { x: drag.startX + (event.clientX - drag.x) / rect.width * (960 / 7), y: drag.startY + (event.clientY - drag.y) / rect.height * 160 });
    update();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  const keydown = event => {
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const dir = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    if (dir) { event.preventDefault(); move(dir); }
  };
  document.addEventListener('keydown', keydown);
  const cleanup = modalCleanup;
  modalCleanup = () => { cleanup(); document.removeEventListener('keydown', keydown); };
  update();
}
function openMemoryPrint() {
  const k = state.kitchen; const capture = k.photo.capture;
  if (k.chapter !== 3 || !capture || k.delivered) return;
  openModal(`<span class="modal-eyebrow">A TABLE FOR TWO</span><h2>今天，也想和你一起吃饭。</h2>
    <figure class="memory-print developing"><img src="${memoryPhotoURL(capture)}" alt="刚拍下的双人晚餐"><figcaption>和你一起，平常的一餐也值得收藏。</figcaption></figure>
    <p class="memory-print-status" role="status">照片正在慢慢显影……</p>
    <div class="memory-print-actions"><button class="secondary-button" data-action="memory-retake">${icon('rotate-ccw')}再拍一张</button><button class="primary-button" data-action="memory-keep" disabled>${icon('heart')}留下这张</button></div>`, 'memory-print-modal');
  const timer = setTimeout(() => {
    document.querySelector('.memory-print')?.classList.remove('developing');
    const status = document.querySelector('.memory-print-status');
    if (status) status.textContent = capture.ready ? '这一餐，和我们，都好好地留在照片里了。' : !capture.framed ? '有套餐具没拍全，再换个角度吧。' : '有一点虚焦，再对一次焦吧。';
    const keep = document.querySelector('[data-action="memory-keep"]');
    if (keep) keep.disabled = !capture.ready;
  }, 1400);
  const cleanup = modalCleanup;
  modalCleanup = () => { cleanup(); clearTimeout(timer); };
}

function endingHTML() {
  return `<section class="ending-scene">
    <span class="ending-eyebrow">THE BEST PART IS YOU</span>
    ${!state.birthdayTransformed ? '<p class="ending-invitation">主厨大人，今天辛苦啦。<br>接下来，请换你当今天的主角。</p>' : ''}
    <div class="ending-celebration">
      <div class="birthday-transformation" data-phase="${state.birthdayTransformed ? 'complete' : 'loading'}" role="img" aria-label="${state.birthdayTransformed ? '戴生日帽的主厨' : '生日主厨正在变身'}">
        <img class="chef-before" src="${CHEF_SPRITES.cooking}" alt="" draggable="false">
        <img class="chef-after" src="${CHEF_SPRITES.birthday}" alt="" draggable="false">
        <span class="transformation-flash" aria-hidden="true">${icon('sparkles')}</span>
        <span class="transformation-stars" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => {
          const angle = i * Math.PI / 5;
          return `<span style="--star-x:${Math.round(Math.cos(angle) * 95)}px;--star-y:${Math.round(Math.sin(angle) * 105)}px;--star-turn:${i * 43}deg;--star-color:${['#df8da1', '#e3b644', '#58a6bf'][i % 3]}">${icon(i % 2 ? 'sparkles' : 'star')}</span>`;
        }).join('')}</span>
      </div>
      <div class="cake-panel">
        <div class="cake-scene ${state.candlesOut ? 'candles-out' : ''}">
          <div class="cake-art">${image('cake', 'birthday-cake', '为你准备的生日蛋糕')}
          ${[0, 1, 2].map(i => `<span class="candle-fire flame-${i + 1}" aria-hidden="true"><i class="candle-glow"></i><i class="candle-flame"></i><i class="candle-smoke"></i></span>`).join('')}</div>
          <span class="cake-spark spark-one">${icon('sparkles')}</span><span class="cake-spark spark-two">${icon('star')}</span>
        </div>
        <div class="candle-footer">${state.candlesOut ? '' : `<div class="candle-controls">
          <p class="candle-status" role="status">许好愿，再吹灭蜡烛。</p>
          <div class="candle-mic-level" aria-hidden="true"></div>
          <div class="candle-buttons"><button class="primary-button" data-action="wish-mic" aria-pressed="false" ${state.birthdayTransformed ? '' : 'disabled'}>${icon('mic')}用气息吹</button><button class="secondary-button" data-action="wish" ${state.birthdayTransformed ? '' : 'disabled'}>${icon('wind')}点按吹灭</button></div>
        </div>`}
        <p class="wish-sent" role="status" ${state.candlesOut ? '' : 'hidden'}>${state.candlesOut ? '愿你的愿望，都慢慢实现。' : ''}</p></div>
      </div>
    </div>
    <h2>${state.candlesOut ? '新的一岁，继续一起胡闹吧。' : '今天的主角，许个愿吧。'}</h2>
    <p class="closing-letter">${esc(config.closing)}</p><span class="ending-signature">爱你的 ${esc(config.sender)}</span>
    <button class="secondary-button ending-album" data-action="album" ${state.candlesOut ? '' : 'hidden'}>${icon('book-heart')}翻翻我的生日礼物簿</button>
    <div class="ending-gifts">${config.gifts.map((g, i) => `<button data-action="revisit" data-index="${i}" aria-label="回看${esc(g.name)}">${giftPhoto(i)}<span>0${i + 1}</span></button>`).join('')}${hasFlowerGift() ? `<button data-action="flower-revisit" aria-label="回看${FLOWER_GIFT_NAME}">${flowerGiftPhoto('gift-photo', '')}<span>隐藏心意</span></button>` : ''}</div>
  </section>`;
}

const CANDLE_MESSAGES = {
  idle: '许好愿，再吹灭蜡烛。',
  requesting: '请允许麦克风权限。',
  calibrating: '先安静一下，马上就可以吹。',
  listening: '对准手机底部麦克风，持续吹一口气。',
  'no-signal': '还没收到声音，靠近手机麦克风试试。',
  denied: '麦克风没开启，也可以点按吹灭。',
  insecure: '真实吹气需要 HTTPS，可点按吹灭。',
  unavailable: '麦克风暂不可用，可点按吹灭。',
  timeout: '没听到吹气。再试一次，或点按吹灭。',
};
function showCandleScene() {
  document.querySelector('.ending-celebration')?.scrollIntoView({ block: 'center', behavior: 'instant' });
}
function startCandleScene() {
  const button = document.querySelector('[data-action="wish-mic"]');
  if (!button) return;
  const status = document.querySelector('.candle-status');
  const meter = document.querySelector('.candle-mic-level');
  const cake = document.querySelector('.cake-scene');
  candleMic = createCandleMic({
    onState(phase) {
      const active = ['requesting', 'calibrating', 'listening', 'no-signal'].includes(phase);
      candleListening = active;
      status.textContent = CANDLE_MESSAGES[phase];
      status.dataset.state = phase;
      button.setAttribute('aria-pressed', String(active));
      button.innerHTML = `${icon(active ? 'x' : 'mic')}${active ? '停止收音' : '用气息吹'}`;
      icons();
      syncMusic();
    },
    onWind(wind) { cake.style.setProperty('--wind', wind.toFixed(2)); },
    onLevel(level) { meter.style.setProperty('--mic-level', level.toFixed(2)); },
    onBlow: blowOutCandles,
  });
}

function blowOutCandles() {
  const scene = document.querySelector('.ending-scene');
  if (!scene || state.candlesOut || !state.birthdayTransformed) return;
  candleMic?.stop();
  state.candlesOut = true;
  state.finished = true;
  save();
  scene.querySelector('.cake-scene').classList.add('candles-out', 'just-blown');
  const controls = scene.querySelector('.candle-controls');
  controls.inert = true;
  const finish = () => {
    controls.classList.add('spent');
    const wish = scene.querySelector('.wish-sent');
    wish.hidden = false;
    wish.textContent = '愿你的愿望，都慢慢实现。';
    const heading = scene.querySelector('h2');
    heading.textContent = '新的一岁，继续一起胡闹吧。';
    if (document.activeElement === document.body && !document.querySelector('.modal-backdrop')) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    scene.querySelector('.ending-album').hidden = false;
    if (!state.muted) [523.25, 659.25, 783.99].forEach((frequency, i) => playNote(frequency, .7, .022, i * .13));
    confetti();
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else candleFinishTimer = setTimeout(finish, 440);
}

function startBirthdayTransformation() {
  if (state.birthdayTransformed) return;
  const character = document.querySelector('.birthday-transformation');
  const controls = document.querySelectorAll('.candle-buttons button');
  let cancelled = false; let timer; let frame;
  endingCleanup = () => { cancelled = true; clearTimeout(timer); cancelAnimationFrame(frame); };
  const finish = () => {
    state.birthdayTransformed = true;
    character.dataset.phase = 'complete';
    character.setAttribute('aria-label', '戴生日帽的主厨');
    controls.forEach(button => { button.disabled = false; });
  };
  Promise.all([...character.querySelectorAll('img')].map(img => img.decode())).then(() => {
    if (cancelled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (character.getBoundingClientRect().bottom > window.innerHeight) character.scrollIntoView({ block: 'center', behavior: 'instant' });
      finish(); return;
    }
    character.dataset.phase = 'inviting';
    const invitation = document.querySelector('.ending-invitation');
    if (invitation.getBoundingClientRect().bottom > window.innerHeight) invitation.scrollIntoView({ block: 'center', behavior: 'instant' });
    timer = setTimeout(() => {
      if (character.getBoundingClientRect().bottom > window.innerHeight) character.scrollIntoView({ block: 'center', behavior: 'instant' });
      frame = requestAnimationFrame(() => {
        character.dataset.phase = 'transforming';
        timer = setTimeout(() => {
          finish();
          confetti();
        }, 2600);
      });
    }, 2200);
  }, () => {
    if (!cancelled) finish();
  });
}

function openModal(content, className = '') {
  candleMic?.stop();
  closeModal(false);
  modalReturnFocus = document.activeElement;
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true" aria-label="生日小厨房"><button class="modal-close icon-button" data-action="close" aria-label="关闭">${icon('x')}</button>${content}</section></div>`;
  document.body.classList.add('modal-open'); icons();
  syncKitchenPause();
  const dialog = root.querySelector('.modal');
  dialog.querySelector('.modal-close')?.focus({ preventScroll: true });
  dialog.scrollTop = 0;
  const trap = (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a, input, textarea, select, [tabindex="0"]')].filter(e => e.getClientRects().length);
    const first = focusable[0]; const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  document.addEventListener('keydown', trap);
  modalCleanup = () => document.removeEventListener('keydown', trap);
}
function closeModal(restore = true) {
  modalCleanup(); modalCleanup = () => {};
  const root = document.querySelector('#modal-root'); if (root) root.innerHTML = '';
  document.body.classList.remove('modal-open');
  syncKitchenPause();
  if (restore) {
    modalReturnFocus?.focus({ preventScroll: true });
    queueMicrotask(presentBirthdayNote);
  }
}
function presentBirthdayNote() {
  const note = pendingBirthdayNote;
  if (!note?.ready || note.kitchen !== state.kitchen || state.opening || state.ending
    || document.body.matches('.modal-open, .needs-rotation')) return;
  pendingBirthdayNote = null;
  openRiddle(state.chapter);
}
function openRiddle(index) {
  if (!state.solved || !state.kitchen.delivered) return;
  openModal(`<header class="reward-header"><span class="modal-eyebrow">A LITTLE SURPRISE · 0${index + 1} · ${state.kitchen.score} 分</span>
    <h2>挑战达标，收到一封小便笺。</h2><p class="modal-subtitle">来自 ${esc(config.sender)}</p></header>
    <div class="reward-body"><div class="reward-scroll" tabindex="0" aria-label="生日便笺内容">${index === 3 ? `<figure class="memory-print delivered-photo"><img src="${memoryPhotoURL(state.kitchen.photo.capture || { x: 0, y: 0, focus: 55 })}" alt="为今天留下的双人晚餐照片"><figcaption>今天，也想和你一起吃饭。</figcaption></figure>` : ''}
    <div class="riddle-letter">${esc(config.gifts[index].riddle)}</div></div>
    <div class="reward-actions"><label class="guess-label" for="guess">猜猜，这次藏了什么？</label><input id="guess" class="text-input" maxlength="120" placeholder="写下你的猜测">
    <button class="primary-button full-width" data-action="reveal" data-index="${index}">${icon('gift')}揭晓这份心意${icon('arrow-right')}</button><span class="modal-footnote">答案是什么都没关系，这份心意已经属于你。</span></div></div>`, 'letter-modal reward-modal');
}
function revealGift(index, revisit = false) {
  if (!revisit && !state.completed.includes(index)) {
    if ((!state.debug && index !== state.completed.length) || !state.solved) return;
    state.completed.push(index); save();
    render();
    if (!state.muted) playNote(659.25, .7, .04);
  }
  const gift = config.gifts[index];
  openModal(`<header class="reward-header"><span class="modal-eyebrow">THIS ONE IS FOR YOU · 0${index + 1}</span><h2>${esc(gift.name)}</h2></header>
    <div class="reward-body"><div class="gift-display"><div class="gift-art">${giftPhoto(index, gift.name)}</div>
    <span class="package-number">${icon('shopping-bag')}请拆开 0${index + 1} 号礼物</span></div><div class="reward-scroll" tabindex="0" aria-label="礼物留言"><p class="gift-message">${esc(gift.message)}</p><span class="gift-signature">— ${esc(config.sender)}</span></div></div>
    <footer class="reward-footer${revisit ? '' : ' with-replay'}">${revisit ? '' : `<button class="secondary-button" data-action="retry-dish">${icon('rotate-ccw')}重玩本关</button>`}<button class="primary-button full-width" data-action="${revisit ? 'close' : 'next'}">${revisit ? '好好收下这份心意' : index === 5 ? '收好礼物，去赴生日之约' : '收好礼物，继续下一道'}${icon(revisit ? 'heart' : 'arrow-right')}</button></footer>`, 'gift-modal reward-modal');
  if (!revisit) confetti();
}
function beginBirthdayEnding() {
  state.ending = true;
  state.candlesOut = state.finished;
  if (!state.finished && !state.flowerRoom) {
    state.flowerRoom = newFlowerRoom();
    save();
  }
}
function nextChapter() {
  closeModal(false);
  clearTimeout(toastTimeout);
  document.querySelector('#toast')?.classList.remove('visible');
  if (state.debug ? state.chapter === 5 : state.completed.length === 6) beginBirthdayEnding();
  else { state.chapter = state.debug ? state.chapter + 1 : state.completed.length; state.kitchen = createKitchen(state.chapter); state.hint = 0; state.solved = false; state.feedback = ''; }
  render(); window.scrollTo({ top: 0, behavior: inFlowerRoom() ? 'instant' : 'smooth' });
}
function serve() {
  if (pendingBirthdayNote) return;
  if (state.completed.includes(state.chapter)) { revealGift(state.chapter, true); return; }
  if (state.solved) { openRiddle(state.chapter); return; }
  toast('把料理装进餐盘，送到出餐口吧。');
}
function assist() {
  state.hint++;
  updateCookingUI(state.kitchen);
  toast(nextTask(state.kitchen));
}
function album() {
  const bonus = hasFlowerGift() ? `<button class="album-item" data-action="flower-revisit">${flowerGiftPhoto('gift-photo', '')}<small>隐藏心意</small><strong>${FLOWER_GIFT_NAME}</strong></button>` : '';
  openModal(`<span class="modal-eyebrow">LITTLE THINGS, BIG LOVE</span><h2>我的生日礼物簿</h2><p class="modal-subtitle">${state.completed.length} / 6 份心意，已经好好收下。</p><div class="album-grid">${config.gifts.map((g, i) => `<button class="album-item ${!state.completed.includes(i) ? 'locked' : ''}" data-action="revisit" data-index="${i}" ${!state.completed.includes(i) ? 'disabled' : ''}>${state.completed.includes(i) ? giftPhoto(i) : `<span class="album-lock">${icon('lock')}</span>`}<small>GIFT 0${i + 1}</small><strong>${state.completed.includes(i) ? esc(g.name) : '还在准备的惊喜'}</strong></button>`).join('')}${bonus}</div>${state.completed.length === 6 ? '<button class="primary-button full-width" data-action="ending">赴一场生日之约</button>' : ''}`, 'album-modal');
}
function revisitFlowerGift() {
  if (!hasFlowerGift()) return;
  openModal(`<header class="reward-header"><span class="modal-eyebrow">藏在菜单外的心意</span><h2>${FLOWER_GIFT_NAME}</h2></header>
    <div class="reward-body"><div class="gift-display"><div class="gift-art">${flowerGiftPhoto()}</div></div>
    <div class="reward-scroll" tabindex="0" aria-label="礼物留言">${flowerGiftLetter(esc(config.sender))}</div></div>
    <footer class="reward-footer"><button class="primary-button full-width" data-action="close">${icon('heart')}好好收下这份心意</button></footer>`, 'gift-modal reward-modal flower-revisit');
}
function settings() {
  openModal(`<span class="modal-eyebrow">A NOTE FROM YOU</span><h2>把你的心意写进厨房</h2><p class="modal-subtitle">本机修改仅在当前浏览器生效。导出后替换项目的 config.json，可同步到正式站点。</p>
    <form id="settings-form"><div class="form-row"><label>主厨称呼<input class="text-input" name="recipient" value="${esc(config.recipient)}" maxlength="40" required></label><label>小助手署名<input class="text-input" name="sender" value="${esc(config.sender)}" maxlength="40" required></label></div>
    <div class="editor-gifts">${config.gifts.map((g, i) => `<details ${i === 0 ? 'open' : ''}><summary><span>0${i + 1}</span>${esc(g.name)}${icon('notebook-pen')}</summary><label>礼物名称<input class="text-input" name="name-${i}" value="${esc(g.name)}" maxlength="80" required></label><label>揭晓前 · 让她猜一猜<textarea name="riddle-${i}" rows="3" maxlength="3000" required>${esc(g.riddle)}</textarea></label><label>揭晓后 · 想对她说的话<textarea name="message-${i}" rows="3" maxlength="3000" required>${esc(g.message)}</textarea></label></details>`).join('')}</div>
    <label class="closing-label">生日结尾<textarea name="closing" rows="5" maxlength="3000" required>${esc(config.closing)}</textarea></label>
    <div class="editor-actions"><button class="secondary-button" type="button" data-action="import">${icon('upload')}导入配置</button><button class="secondary-button" type="button" data-action="export">${icon('download')}导出当前表单</button><button class="primary-button" type="submit">${icon('check')}保存到本机</button></div></form>
    <button class="text-button" data-action="opening-replay">${icon('play')}重看开场故事</button>
    ${!import.meta.env.DEV && !state.debug ? `<button class="text-button" data-action="debug-menu">${icon('bug')}关卡调试</button>` : ''}
    <div class="settings-danger"><span>从第一道菜单重新开始</span><button class="text-button" data-action="confirm-reset">${icon('rotate-ccw')}重置游戏进度</button></div>`, 'settings-modal');
}
function debugMenu() {
  if (document.querySelector('.opening[data-leaving="true"]')) return;
  const selected = currentDebugScene() ?? state.chapter;
  openModal(`<span class="modal-eyebrow">DEVELOPMENT</span><h2>关卡调试</h2>
    <p class="modal-subtitle">调试会从所选环节的开头开始，不影响正式存档。</p>
    <form id="debug-form">
      <fieldset class="debug-modes"><legend>游玩模式</legend>
        <label><input type="radio" name="play-mode" value="story"><span>正式闯关</span></label>
        <label><input type="radio" name="play-mode" value="debug" checked><span>开发调试</span></label>
      </fieldset>
      <label class="debug-chapter">选择调试环节<select class="text-input" name="debug-chapter">
        <optgroup label="厨房关卡">${CHAPTERS.map(({ short }, i) => `<option value="${i}" ${selected === i ? 'selected' : ''}>第 ${i + 1} 关 · ${short}</option>`).join('')}</optgroup>
        <optgroup label="剧情与结尾">${Object.entries(DEBUG_SCENES).map(([id, { label }]) => `<option value="${id}" ${selected === id ? 'selected' : ''}>${label}</option>`).join('')}</optgroup>
      </select></label>
      <button class="primary-button full-width" type="submit">${icon('play')}<span>进入调试</span></button>
    </form>`, 'debug-modal');
}
function setDebugMode(enabled) {
  if (state.debug === enabled) return;
  const progress = enabled ? normalizeProgress(null) : normalizeProgress(read(KEY));
  Object.assign(state, {
    debug: enabled, completed: progress.completed, finished: progress.finished,
    chapter: Math.min(progress.completed.length, 5), ending: progress.completed.length === 6,
    opening: null,
    candlesOut: progress.finished, flowerRoom: progress.flowerRoom,
    birthdayTransformed: progress.finished || progress.flowerRoom?.phase === 'done', hint: 0, solved: false, feedback: '',
  });
  state.kitchen = createKitchen(state.chapter);
}
function currentDebugScene() {
  if (state.opening) return 'opening';
  if (inFlowerRoom()) return 'flower';
  return state.ending ? 'candles' : null;
}
function syncDebugURL() {
  const url = new URL(window.location.href);
  if (!import.meta.env.DEV && !state.debug && url.searchParams.get('debug') !== '1') return;
  const scene = state.debug ? currentDebugScene() : null;
  const target = { debug: state.debug, chapter: scene ? DEBUG_SCENES[scene].chapter : state.chapter, scene };
  setDebugParams(url.searchParams, target);
  if (!url.searchParams.has('kitchen-polish')) bentoVersion = null;
  if (!url.searchParams.has(TOUCH_DEMO_PARAM)) touchDemo = false;
  window.history.replaceState(null, '', url.href);
  if (window.parent !== window) window.parent.postMessage({ type: 'birthday-bistro:play-mode', ...target }, window.location.origin);
}
function configFromForm() {
  const form = document.querySelector('#settings-form');
  const data = new FormData(form);
  return normalizeConfig({ recipient: data.get('recipient'), sender: data.get('sender'), closing: data.get('closing'), gifts: config.gifts.map((_, i) => ({ name: data.get(`name-${i}`), riddle: data.get(`riddle-${i}`), message: data.get(`message-${i}`) })) }, baseConfig);
}
function exportConfig() {
  const blob = new Blob([JSON.stringify(configFromForm(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'config.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function importConfig() {
  const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = async () => {
    try {
      const file = input.files[0]; if (!file) return;
      if (file.size > 100000) throw new Error('配置文件过大，请选择 100 KB 以内的 JSON 文件。');
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.gifts) || data.gifts.length !== 6) throw new Error('配置需要包含六份礼物。');
      config = normalizeConfig(data, baseConfig); write(CONFIG_KEY, config); closeModal(false); render(); settings(); toast('已导入生日心意，并保存到本机。');
    } catch (error) { toast(error instanceof SyntaxError ? '文件不是有效的 JSON，请检查后重试。' : error.message); }
  };
  input.click();
}
async function share() {
  let url = new URL(window.location.href); url.hash = '';
  for (const key of ['layout', 'preview', 'debug', 'chapter', 'intro', 'kitchen-polish', 'flower-room', 'candle', 'score-fx', 'bgm-audition', TOUCH_DEMO_PARAM]) url.searchParams.delete(key);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (local && __LAN_IP__) url.hostname = __LAN_IP__;
  openModal(`<span class="modal-eyebrow">SAVE A SEAT FOR YOU</span><h2>把小厨房装进手机</h2><p class="modal-subtitle">${local ? '手机与电脑连接同一个 Wi-Fi 后，扫码进入。' : '扫码，开启你的生日特别菜单。'}</p><div class="qr-holder"><canvas id="qr-canvas" aria-label="游戏访问地址二维码"></canvas></div><input class="text-input share-url" value="${esc(url.href)}" readonly aria-label="游戏网址"><button class="primary-button full-width" data-action="copy-url">${icon('copy')}复制游戏地址</button><p class="share-note">${local ? '这是局域网预览地址，电脑需保持运行。正式生日使用需部署为公开 HTTPS 链接。' : '游戏进度与本机编辑的留言不会跨设备同步。'}</p>`, 'share-modal');
  const canvas = document.querySelector('#qr-canvas');
  try {
    const { default: QRCode } = await import('qrcode');
    if (canvas.isConnected) await QRCode.toCanvas(canvas, url.href, { width: 240, margin: 2, color: { dark: '#344c40', light: '#ffffff' } });
  } catch { if (canvas.isConnected) toast('二维码暂时没准备好，可以复制地址打开。'); }
}
function confetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = document.createElement('div'); layer.className = 'confetti'; layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = Array.from({ length: 28 }, (_, i) => `<span style="--x:${(i * 37) % 100}%;--delay:${i % 7 * .07}s;--rotate:${i * 53}deg;--color:${['#e2a198', '#a8bc9b', '#e3c47b', '#9fb8c3'][i % 4]}"></span>`).join('');
  document.body.append(layer); setTimeout(() => layer.remove(), 2500);
}

document.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const action = button.dataset.action; const id = button.dataset.id; const index = Number(button.dataset.index);
  if (button.tagName === 'A') event.preventDefault();
  switch (action) {
    case 'music': toggleMusic(); break;
    case 'share': share(); break;
    case 'settings': settings(); break;
    case 'opening-replay': closeModal(false); state.opening = 'story'; render(); break;
    case 'debug-menu': debugMenu(); break;
    case 'phone-preview': {
      const url = new URL(window.location.href);
      url.searchParams.delete('layout');
      url.searchParams.set('preview', 'phone');
      window.location.assign(url.href);
      break;
    }
    case 'fullscreen':
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch { toast('暂时无法进入全屏，横屏也可以直接游玩。'); }
      break;
    case 'close': closeModal(); break;
    case 'album': case 'album-shortcut': album(); break;
    case 'home':
      if (state.completed.length === 6) { beginBirthdayEnding(); render(); }
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'chapter':
      if ((!state.debug && index > state.completed.length) || !Number.isInteger(index) || index < 0 || index > 5) break;
      if (state.chapter === index) break;
      state.chapter = index; state.kitchen = createKitchen(index); state.solved = false; state.feedback = ''; state.hint = 0; render(); break;
    case 'kitchen-load-retry': window.location.reload(); break;
    case 'order-page': layoutOrderPage(button.closest('.order-strip'), index); break;
    case 'kitchen-interact': kitchenController?.interact(); break;
    case 'kitchen-chop': break;
    case 'bento-take':
      if (takePackedBento(state.kitchen)) {
        if (usesKitchenPolish(state.kitchen.chapter)) playKitchenCue('take');
        updateCookingUI(state.kitchen); closeModal();
      }
      break;
    case 'memory-shutter':
      if (captureMemoryPhoto(state.kitchen)) { if (!state.muted) playNote(880, .12, .04); openMemoryPrint(); }
      break;
    case 'memory-retake':
      if (retakeMemoryPhoto(state.kitchen)) openMemoryCamera();
      break;
    case 'memory-keep':
      if (keepMemoryPhoto(state.kitchen) || !state.kitchen.photo.meal) { closeModal(); updateCookingUI(state.kitchen); }
      else document.querySelector('.memory-print-status').textContent = state.kitchen.message;
      break;
    case 'confirm-retry':
      openModal(`<span class="modal-eyebrow">ONE MORE LITTLE TRY</span><h2>重玩本关？</h2><p class="modal-subtitle">本关计时、得分、订单和台面会重置，已经解锁的礼物会保留。</p><div class="confirm-actions"><button class="secondary-button" data-action="close">继续本轮</button><button class="primary-button" data-action="retry-dish">${icon('rotate-ccw')}确认重玩</button></div>`, 'confirm-modal'); break;
    case 'retry-dish':
      closeModal(false); state.kitchen = createRound(state.chapter, state.debug); state.solved = false; state.hint = 0;
      state.feedback = ''; state.feedbackKind = ''; render(); break;
    case 'serve': serve(); break;
    case 'hint': case 'hint-shortcut': assist(); break;
    case 'kitchen-clue': openKitchenClue(); break;
    case 'reveal': revealGift(index); break;
    case 'next': nextChapter(); break;
    case 'revisit': if (state.completed.includes(index)) revealGift(index, true); break;
    case 'flower-enter': case 'flower-open': case 'flower-place': case 'flower-pick':
    case 'flower-light': case 'flower-finish': playFlowerRoom(action, id); break;
    case 'flower-revisit': revisitFlowerGift(); break;
    case 'ending':
      if (state.completed.length === 6) { closeModal(false); beginBirthdayEnding(); render(); }
      break;
    case 'wish-mic':
      document.querySelector('.cake-panel').scrollIntoView({ block: 'nearest', behavior: 'instant' });
      void candleMic?.toggle();
      break;
    case 'wish': blowOutCandles(); break;
    case 'import': importConfig(); break;
    case 'export': exportConfig(); break;
    case 'copy-url': {
      const field = document.querySelector('.share-url');
      try { await navigator.clipboard.writeText(field.value); toast('地址已复制。'); } catch { field.focus(); field.select(); toast('请长按或使用复制快捷键复制地址。'); } break;
    }
    case 'confirm-reset':
      openModal(`<span class="modal-eyebrow">A FRESH START</span><h2>重新开始今天的菜单？</h2><p class="modal-subtitle">将清除游戏进度，写好的生日留言会保留。</p><div class="confirm-actions"><button class="secondary-button" data-action="close">先不重置</button><button class="primary-button" data-action="reset">${icon('rotate-ccw')}确认重新开始</button></div>`, 'confirm-modal'); break;
    case 'reset':
      closeModal(false); Object.assign(state, { chapter: 0, completed: [], finished: false, flowerRoom: null, kitchen: createKitchen(0), hint: 0, solved: false, feedback: '', ending: false, candlesOut: false, birthdayTransformed: false }); save(); render(); toast('菜单重新准备好啦。'); break;
  }
});
document.addEventListener('change', event => {
  if (event.target.matches('#debug-form [name="play-mode"]')) {
    const debugging = event.target.value === 'debug';
    event.target.form.elements['debug-chapter'].disabled = !debugging;
    event.target.form.querySelector('button[type="submit"] span').textContent = debugging ? '进入调试' : '返回正式闯关';
  }
});
document.addEventListener('submit', (event) => {
  if (event.target.id === 'debug-form') {
    event.preventDefault();
    const data = new FormData(event.target);
    const enabled = data.get('play-mode') === 'debug';
    const selection = data.get('debug-chapter');
    const scene = Object.hasOwn(DEBUG_SCENES, selection) ? selection : null;
    const chapter = scene ? DEBUG_SCENES[scene].chapter : Number(selection ?? NaN);
    if (enabled && (!Number.isInteger(chapter) || chapter < 0 || chapter >= THEMES.length)) return;
    closeModal(false); setDebugMode(enabled);
    if (enabled) Object.assign(state, {
      chapter, kitchen: createRound(chapter, enabled), finished: false, hint: 0, solved: false, feedback: '',
      opening: scene === 'opening' ? 'story' : null, ending: scene === 'flower' || scene === 'candles',
      candlesOut: false, flowerRoom: scene === 'flower' ? newFlowerRoom() : null, birthdayTransformed: scene === 'candles',
    });
    render();
    if (!state.ending) window.scrollTo({ top: 0, behavior: 'instant' });
    return;
  }
  if (event.target.id === 'kitchen-puzzle-form') {
    event.preventDefault();
    const data = new FormData(event.target);
    const theme = THEMES[state.chapter];
    const answer = theme.options ? data.getAll('choice') : { order: [0, 1, 2].map(i => data.get(`slot-${i}`)) };
    if (solveKitchenPuzzle(state.kitchen, answer)) {
      closeModal(); updateCookingUI(state.kitchen); toast(THEMES[state.chapter].success);
    } else document.querySelector('.puzzle-result').textContent = state.kitchen.message;
    return;
  }
  if (event.target.id !== 'settings-form') return;
  event.preventDefault(); config = configFromForm(); write(CONFIG_KEY, config); closeModal(false); render(); toast('心意已保存到当前浏览器。');
});

try {
  if (!state.opening && !state.ending) void loadKitchenEngine().catch(() => {});
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error('配置加载失败');
  baseConfig = await response.json(); config = normalizeConfig(read(CONFIG_KEY), baseConfig); render();
} catch {
  app.innerHTML = `<main class="load-error"><span class="brand-mark">${icon('chef-hat')}</span><h1>厨房还在准备中</h1><p>生日配置暂时没加载成功，请刷新页面再试一次。</p><button class="primary-button" id="retry">重新打开厨房</button></main>`;
  icons(); document.querySelector('#retry').onclick = () => location.reload();
}
