import {
  createIcons, ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart,
  Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X,
  ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb,
  HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen,
  PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play,
  Hand, Scissors, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flame,
  Smartphone, RotateCw, Maximize, Minimize,
  Triangle, Leaf, Logs, Bug,
} from 'lucide';
import QRCode from 'qrcode';
import { CHAPTERS, normalizeConfig, normalizeProgress } from './game.js';
import { art } from './art.js';
import { startCooking } from './kitchen-engine.js';
import { DISHES, INGREDIENTS, CHOP_SECONDS, createKitchen, actionLabel, itemName, canChop, nearestStation, plateProgress, nextTask, solveKitchenPuzzle } from './cooking.js';
import { THEMES, SPICES } from './themes.js';
import './style.css';
import './cooking.css';

const iconSet = { ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart, Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X, ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb, HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen, PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play, Hand, Scissors, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Timer, Flame, Smartphone, RotateCw, Maximize, Minimize, Triangle, Leaf, Logs, Bug };
const KEY = 'birthday-bistro-cooking-v2';
const CONFIG_KEY = 'birthday-bistro-config-v1';
const app = document.querySelector('#app');
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name, cls = '') => `<i data-lucide="${name}" ${cls ? `class="${cls}"` : ''} aria-hidden="true"></i>`;
const image = (type, cls = '', alt = '') => `<img src="${art(type)}" class="${cls}" alt="${esc(alt)}" draggable="false">`;
const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('当前浏览器无法保存进度，请保持页面打开。'); } };
let baseConfig;
let config;
const debug = import.meta.env.DEV && new URLSearchParams(window.location.search).get('debug') === '1';
const progress = debug ? normalizeProgress(null) : normalizeProgress(read(KEY));
const requestedChapter = Number(new URLSearchParams(window.location.search).get('chapter'));
const initialChapter = debug && Number.isInteger(requestedChapter) && requestedChapter >= 1 && requestedChapter <= 6
  ? requestedChapter - 1 : Math.min(progress.completed.length, 5);
const state = {
  debug,
  chapter: initialChapter, completed: progress.completed,
  finished: progress.finished, kitchen: createKitchen(initialChapter), hint: 0, solved: false,
  feedback: '', feedbackKind: '', muted: true, ending: progress.completed.length === 6, candlesOut: progress.finished,
};
let kitchenController = null;
let modalCleanup = () => {};
let modalReturnFocus = null;
let toastTimeout;
let audioContext;
let musicTimer;
let noteStep = 0;
const GIFT_ART = ['candy', 'charm', 'snacks', 'film', 'candle', 'perfume'];
const layout = new URLSearchParams(window.location.search).get('layout');
const landscapeMedia = window.matchMedia('(orientation: landscape) and (max-height: 600px), (orientation: landscape) and (pointer: coarse)');
const portraitMedia = window.matchMedia('(orientation: portrait) and (pointer: coarse) and (hover: none)');

function syncPlayMode() {
  const forced = layout === 'landscape' || layout === 'desktop';
  const landscape = layout === 'landscape' || (layout !== 'desktop' && landscapeMedia.matches);
  const rotate = !state.ending && !forced && portraitMedia.matches;
  document.body.classList.toggle('landscape-play', !state.ending && landscape);
  document.body.classList.toggle('forced-landscape', layout === 'landscape');
  document.body.classList.toggle('needs-rotation', rotate);
  const prompt = document.querySelector('.rotation-prompt');
  if (prompt) prompt.hidden = !rotate;
  document.querySelectorAll('.site-header, .app-main').forEach(el => { el.inert = rotate; });
  kitchenController?.setLandscape(landscape);
  syncKitchenPause();
}
function syncKitchenPause() {
  kitchenController?.setPaused(document.body.classList.contains('modal-open') || document.body.classList.contains('needs-rotation'));
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

function icons() { createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.7 } }); }
function save() { if (!state.debug) write(KEY, { completed: state.completed, finished: state.finished }); }
function toast(message) {
  let el = document.querySelector('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('visible'), 3200);
}
function playNote(frequency, duration = 0.28, volume = 0.025) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    oscillator.connect(gain); gain.connect(audioContext.destination);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Audio is optional on browsers without Web Audio. */ }
}
function toggleMusic() {
  state.muted = !state.muted;
  clearInterval(musicTimer);
  if (!state.muted) {
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 329.63, 392, 523.25, 392, 293.66, 349.23, 392, 293.66];
    playNote(notes[noteStep++ % notes.length], .8, .025);
    musicTimer = setInterval(() => { if (!document.hidden) playNote(notes[noteStep++ % notes.length], .8, .025); }, 650);
  }
  const button = document.querySelector('[data-action="music"]');
  button.innerHTML = icon(state.muted ? 'volume-x' : 'volume-2');
  button.setAttribute('aria-label', state.muted ? '播放背景音乐' : '关闭背景音乐');
  button.setAttribute('aria-pressed', String(!state.muted));
  icons();
}

function render() {
  kitchenController?.destroy(); kitchenController = null;
  syncDebugURL();
  document.body.classList.toggle('cooking-mode', !state.ending);
  document.body.dataset.playMode = state.debug ? 'debug' : 'story';
  const ch = CHAPTERS[state.chapter];
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="生日小厨房首页">
        <span class="brand-mark">${icon('chef-hat')}</span>
        <span><strong>生日小厨房<span class="brand-dot">.</span></strong><small>BIRTHDAY BISTRO</small></span>
      </a>
      <span class="header-dedication">今晚，只接你这一单。</span>
      ${!state.ending ? `<div class="landscape-order"><span>${state.debug ? '开发调试 · ' : ''}第 ${state.chapter + 1} 站 · ${state.completed.length} / 6 份心意</span><strong>${CHAPTERS[state.chapter].short}</strong></div>` : ''}
      <div class="header-actions">
        <span class="open-badge"><span></span> ${state.debug ? '开发调试' : '只为你营业'}</span>
        ${import.meta.env.DEV ? `<button class="icon-button ${state.debug ? 'debug-active' : ''}" data-action="debug-menu" aria-label="关卡调试" aria-pressed="${state.debug}" data-tooltip="关卡调试">${icon('bug')}</button>` : ''}
        ${import.meta.env.DEV ? `<button class="icon-button desktop-preview-button" data-action="phone-preview" aria-label="手机横屏预览" data-tooltip="手机横屏预览">${icon('smartphone')}</button>` : ''}
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
          <div class="sidebar-note">${icon('heart')} 今天的快乐，不用赶时间。</div>
        </aside>
        <section class="game-column" aria-label="实时厨房游戏">
          <div class="scene-heading"><div><span class="chapter-tag">0${state.chapter + 1} · ${THEMES[state.chapter].name}</span><h2>${DISHES[state.chapter].name}</h2></div><button class="text-button" data-action="confirm-retry" aria-label="重新制作这道菜">${icon('rotate-ccw')}重新做</button></div>
          <div class="mobile-recipe">${recipePartsHTML()}</div>
          <div class="kitchen-scene" id="kitchen-host"></div>
          <div class="kitchen-feedback" id="kitchen-feedback" role="status" aria-live="polite">${esc(state.kitchen.message)}</div>
          ${controlsHTML()}
          <button class="primary-button birthday-note-button full-width" data-action="serve" ${!state.solved && !state.completed.includes(state.chapter) ? 'hidden' : ''}>${icon('gift')}打开我的生日便笺${icon('arrow-right')}</button>
        </section>
        <aside class="order-column">
          <section class="order-ticket">
            <div class="ticket-top"><span>一份专属订单</span>${icon('notebook-pen')}</div>
            <div class="ticket-number">ORDER <strong>#00${state.chapter + 1}</strong></div>
            <h3>${DISHES[state.chapter].name}</h3><p class="order-subtitle">${DISHES[state.chapter].subtitle}</p>
            <div class="ticket-rule"></div>
            <div class="recipe-label">${icon('utensils')} 这道菜的小配方</div>
            <div class="cooking-recipe">${recipePartsHTML()}</div>
            <div class="theme-clue"><strong>${THEMES[state.chapter].title}</strong><p>${THEMES[state.chapter].clue}</p><span class="theme-progress"></span></div>
            <div class="ticket-rule"></div>
            <div class="appliance-status" data-appliance="pot"><span>${icon('cooking-pot')}煮锅</span><strong>空闲</strong><div role="progressbar" aria-label="煮锅进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div></div>
            <div class="appliance-status" data-appliance="oven"><span>${icon('flame')}烤箱</span><strong>空闲</strong><div role="progressbar" aria-label="烤箱进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div></div>
            <div class="ticket-footer cooking-ticket-footer"><span>${icon('heart')} 好吃的，值得慢慢等</span><span class="plated-count">0 / ${DISHES[state.chapter].parts.length}</span></div>
          </section>
          <section class="helper-area"><div class="helper-heading"><span class="helper-avatar">${icon('chef-hat')}</span><div><strong>${esc(config.sender)}</strong><span>随时待命的副厨</span></div><span class="online-dot"></span></div>
            <p>${state.hint ? esc(nextTask(state.kitchen)) : '你负责当主厨，我负责等你。锅和烤箱会看好火候，今天没有催单哦。'}</p>
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
      ${import.meta.env.DEV ? `<button class="secondary-button" data-action="phone-preview">${icon('smartphone')}在电脑上预览</button>` : ''}
    </section>
    <div id="modal-root"></div>`;
  icons();
  if (!state.ending) {
    kitchenController = startCooking(document.querySelector('#kitchen-host'), document.querySelector('.cooking-controls'), state.kitchen, {
      onUpdate: updateCookingUI,
      onPuzzle: openKitchenPuzzle,
      onDelivered: () => {
        state.solved = true;
        if (!state.muted) playNote(659.25, .7, .04);
        openRiddle(state.chapter);
      },
    });
  }
  syncPlayMode();
}

function recipePartsHTML() {
  const hidden = state.chapter === 0 && !state.kitchen.puzzle.solved;
  return DISHES[state.chapter].parts.map((part, index) => part.id === 'jam'
    ? `<div class="recipe-part" data-part="${index}">${hidden ? `<span class="unknown-fruit">${icon('cherry')}</span>` : image('jam')}<span><strong>${hidden ? '神秘双果酱' : '爱心双果酱'}</strong><small>双果同锅 · 6 秒</small></span><span class="recipe-part-check">${icon('check')}</span></div>`
    : `<div class="recipe-part" data-part="${index}">${image(part.id)}<span><strong>${INGREDIENTS[part.id].name}</strong><small>${INGREDIENTS[part.id].cut ? '切配 · ' : ''}${part.method === 'fresh' ? '新鲜装盘' : `${part.method === 'pot' ? '煮锅' : '烤箱'} ${INGREDIENTS[part.id][part.method]} 秒`}</small></span><span class="recipe-part-check">${icon('check')}</span></div>`).join('');
}
function controlsHTML() {
  return `<section class="cooking-controls" aria-label="主厨操作区">
    <div class="joystick" role="group" aria-label="移动摇杆">
      ${[['up', 'chevron-up'], ['down', 'chevron-down'], ['left', 'chevron-left'], ['right', 'chevron-right']].map(([dir, symbol]) => `<button class="stick-direction ${dir}" data-move="${dir}" aria-label="向${{ up: '上', down: '下', left: '左', right: '右' }[dir]}移动">${icon(symbol)}</button>`).join('')}
      <span class="joystick-knob" aria-hidden="true"></span>
    </div>
    <div class="hands-status"><small>主厨手里</small><div id="hands-icon">${icon('hand')}</div><strong id="hands-name">两手空空</strong><span id="nearby-station">走进你的小厨房</span></div>
    <div class="cooking-buttons">
      <button class="cook-button chop-button" data-action="kitchen-chop" aria-label="切配" disabled><span class="chop-meter"></span>${icon('scissors')}<span>按住切配</span></button>
      <button class="cook-button interact-button" data-action="kitchen-interact" aria-label="取放与操作">${icon('hand')}<span id="interact-label">靠近工作台</span></button>
    </div>
  </section>`;
}
function updateCookingUI(k) {
  const host = document.querySelector('#kitchen-host');
  if (!host || state.ending) return;
  host.dataset.theme = String(k.chapter);
  host.dataset.puzzleSolved = String(k.puzzle.solved);
  host.dataset.steamReady = String(k.puzzle.steam >= 2);
  host.dataset.lampServed = String(!!k.places.lamp);
  host.dataset.flowersServed = String(!!k.places.flowers);
  host.dataset.spiceBag = k.spices.join(',');
  host.dataset.brothReady = String(k.broth.length === 3);
  host.dataset.mealSlots = (k.plating || (k.holding?.type === 'plate' ? k.holding : null))?.contents.map(i => `${i.slot}:${i.id}`).join(',') || '';
  const revealed = String(k.puzzle.solved);
  if (host.dataset.recipeRevealed !== revealed) {
    host.dataset.recipeRevealed = revealed;
    document.querySelectorAll('.mobile-recipe, .cooking-recipe').forEach(el => { el.innerHTML = recipePartsHTML(); });
    icons();
  }
  document.querySelector('.theme-progress').textContent = k.puzzle.solved ? '特别心意已完成' : k.puzzle.steam >= 2 ? '玻璃上出现了字' : '特别心意尚未完成';
  const label = actionLabel(k);
  const action = document.querySelector('#interact-label');
  if (action.textContent !== label) action.textContent = label;
  document.querySelector('[data-action="kitchen-interact"]').disabled = !nearestStation(k) || k.delivered;
  document.querySelector('[data-action="kitchen-chop"]').disabled = !canChop(k);
  document.querySelector('.chop-meter').style.height = `${k.board.progress / CHOP_SECONDS * 100}%`;
  const holding = itemName(k.holding);
  const name = document.querySelector('#hands-name');
  if (name.textContent !== holding) {
    name.textContent = holding;
    document.querySelector('#hands-icon').innerHTML = k.holding?.type === 'ingredient' ? image(k.holding.id) : icon(k.holding?.type === 'spice' ? SPICES[k.holding.id].symbol : k.holding?.type === 'spicebag' ? 'shopping-bag' : k.holding ? 'utensils' : 'hand');
    icons();
  }
  const near = nearestStation(k);
  document.querySelector('#nearby-station').textContent = near?.type === 'puzzle' ? THEMES[k.chapter].station : near ? near.name || '新鲜食材柜' : '走进你的小厨房';
  const feedback = document.querySelector('#kitchen-feedback');
  if (feedback.textContent !== k.message) feedback.textContent = k.message;
  feedback.className = `kitchen-feedback ${k.messageKind}`;
  const plated = plateProgress(k);
  document.querySelectorAll('[data-part]').forEach(element => element.classList.toggle('plated', plated[Number(element.dataset.part)] || k.delivered));
  document.querySelector('.plated-count').textContent = `${k.delivered ? DISHES[k.chapter].parts.length : plated.filter(Boolean).length} / ${plated.length}`;
  for (const method of ['pot', 'oven']) {
    const job = k[method]; const el = document.querySelector(`[data-appliance="${method}"]`);
    el.querySelector('strong').textContent = !job.item ? '空闲' : job.waiting ? '等待第二种水果' : job.ready ? '已熟 · 随时可取' : `还有 ${Math.ceil(job.duration - job.elapsed)} 秒`;
    const percent = job.item ? job.elapsed / job.duration * 100 : 0;
    el.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(Math.round(percent)));
    el.querySelector('[role="progressbar"] > span').style.width = `${percent}%`;
    el.classList.toggle('ready', job.ready);
    host.dataset[`${method}State`] = !job.item ? 'empty' : job.waiting ? 'waiting' : job.ready ? 'ready' : 'cooking';
  }
  host.dataset.boardState = k.board.item ? k.board.item.cut ? 'cut' : 'raw' : 'empty';
  document.querySelector('.birthday-note-button').hidden = !k.delivered && !state.solved && !state.completed.includes(state.chapter);
  if (state.hint) document.querySelector('.helper-area > p').textContent = nextTask(k);
}

function openKitchenPuzzle() {
  const k = state.kitchen;
  if (k.chapter !== 5) return;
  const theme = THEMES[k.chapter];
  let fields = '';
  if (theme.options) {
    fields = `<div class="puzzle-choices">${theme.options.map(id => `<label class="puzzle-choice"><input type="checkbox" name="choice" value="${id}">${SPICES[id] ? icon(SPICES[id].symbol) : image(id)}<span>${SPICES[id]?.name || INGREDIENTS[id].name}</span></label>`).join('')}</div>`;
  } else if (theme.order) {
    const captions = k.chapter === 5 ? ['前奏', '主调', '尾声'] : ['左边', '中间', '右边'];
    fields = `${k.chapter === 1 ? `<fieldset class="shape-choices"><legend>饭团模具</legend>${[['circle', 'circle', '圆形'], ['triangle', 'triangle', '三角形'], ['heart', 'heart', '心形']].map(([value, symbol, name]) => `<label><input type="radio" name="shape" value="${value}" required>${icon(symbol)}<span>${name}</span></label>`).join('')}</fieldset>` : ''}
      <div class="puzzle-order">${captions.map((caption, i) => `<label>${caption}<select class="text-input" name="slot-${i}" required><option value="">请选择</option>${DISHES[k.chapter].parts.map(part => `<option value="${part.id}">${INGREDIENTS[part.id].name}</option>`).join('')}</select></label>`).join('')}</div>
      <p class="puzzle-carry-note">${k.holding?.type === 'plate' ? '完整餐盘已就位。' : '请端着完整料理的餐盘回来。'}</p>`;
  }
  const reference = theme.order ? `<div class="meal-reference ${k.chapter === 3 ? 'kitchen-photo' : ''}">${theme.order.map((id, i) => `<span>${k.chapter === 1 && i === 0 ? icon('triangle') : image(id)}<small>${k.chapter === 5 ? ['前奏', '主调', '尾声'][i] : ['左', '中', '右'][i]}</small></span>`).join('')}${k.chapter === 3 ? '<em>那天的晚餐 · 和你一起</em>' : ''}</div>` : '';
  openModal(`<div class="puzzle-story"><span class="modal-eyebrow">KITCHEN 0${k.chapter + 1} · ${theme.name}</span><h2>${theme.title}</h2><p class="puzzle-clue">${theme.clue}</p>${reference}</div><form id="kitchen-puzzle-form">${fields}<p class="puzzle-result" role="status"></p><button class="primary-button full-width" type="submit">${icon(theme.order ? 'utensils' : 'check')}${theme.order ? k.chapter === 1 ? '塑形并整理便当' : '按餐序摆好料理' : '装好卤料袋'}</button></form>`, 'kitchen-puzzle-modal');
}

function endingHTML() {
  return `<section class="ending-scene">
    <span class="ending-eyebrow">THE BEST PART IS YOU</span>
    <div class="cake-scene ${state.candlesOut ? 'candles-out' : ''}">${image(state.candlesOut ? 'cake-out' : 'cake', 'birthday-cake', '为你准备的生日蛋糕')}<span class="cake-spark spark-one">${icon('sparkles')}</span><span class="cake-spark spark-two">${icon('star')}</span>${state.candlesOut ? '<div class="wish-sent">愿你的愿望，都慢慢实现。</div>' : ''}</div>
    <h2>${state.candlesOut ? '新的一岁，继续一起胡闹吧。' : '今天的主角，许个愿吧。'}</h2>
    <p class="closing-letter">${esc(config.closing)}</p><span class="ending-signature">爱你的 ${esc(config.sender)}</span>
    ${!state.candlesOut ? `<button class="primary-button" data-action="wish">${icon('cake-slice')}许好愿啦，吹蜡烛</button>` : `<button class="secondary-button" data-action="album">${icon('book-heart')}翻翻我的生日礼物簿</button>`}
    <div class="ending-gifts">${config.gifts.map((g, i) => `<button data-action="revisit" data-index="${i}" aria-label="回看${esc(g.name)}">${image(GIFT_ART[i])}<span>0${i + 1}</span></button>`).join('')}</div>
  </section>`;
}

function openModal(content, className = '') {
  closeModal(false);
  modalReturnFocus = document.activeElement;
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-backdrop"><section class="modal ${className}" role="dialog" aria-modal="true" aria-label="生日小厨房"><button class="modal-close icon-button" data-action="close" aria-label="关闭">${icon('x')}</button>${content}</section></div>`;
  document.body.classList.add('modal-open'); icons();
  syncKitchenPause();
  const dialog = root.querySelector('.modal');
  dialog.querySelector('input,textarea,select,button:not(.modal-close)')?.focus();
  const trap = (event) => {
    if (event.key === 'Escape') closeModal();
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a, input, textarea, select')].filter(e => e.getClientRects().length);
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
  if (restore) modalReturnFocus?.focus();
}
function openRiddle(index) {
  openModal(`<span class="modal-eyebrow">A LITTLE SURPRISE · 0${index + 1}</span>${index === 3 ? `<div class="kitchen-photo delivered-photo"><div>${DISHES[3].parts.map(p => image(p.id)).join('')}</div><em>今天，也想和你一起吃饭。</em></div>` : `<div class="letter-icon">${icon('notebook-pen')}</div>`}
    <h2>出餐成功，收到一封小便笺。</h2><p class="modal-subtitle">来自 ${esc(config.sender)}</p><div class="riddle-letter">${esc(config.gifts[index].riddle)}</div>
    <label class="guess-label" for="guess">猜猜，这次藏了什么？</label><input id="guess" class="text-input" maxlength="120" placeholder="写下你的猜测，或直接告诉身边的我">
    <button class="primary-button full-width" data-action="reveal" data-index="${index}">${icon('gift')}揭晓这份心意${icon('arrow-right')}</button><span class="modal-footnote">答案是什么都没关系，这份心意已经属于你。</span>`, 'letter-modal');
}
function revealGift(index, revisit = false) {
  if (!revisit && !state.completed.includes(index)) {
    if ((!state.debug && index !== state.completed.length) || !state.solved) return;
    state.completed.push(index); save();
    render();
    if (!state.muted) playNote(659.25, .7, .04);
  }
  const gift = config.gifts[index];
  openModal(`<span class="modal-eyebrow">THIS ONE IS FOR YOU · 0${index + 1}</span><div class="gift-art">${image(GIFT_ART[index], '', gift.name)}</div>
    <span class="package-number">${icon('shopping-bag')}请拆开 0${index + 1} 号礼物</span><h2>${esc(gift.name)}</h2><p class="gift-message">${esc(gift.message)}</p><span class="gift-signature">— ${esc(config.sender)}</span>
    <button class="primary-button full-width" data-action="${revisit ? 'close' : 'next'}">${revisit ? '好好收下这份心意' : index === 5 ? '去赴最后的生日之约' : '收好礼物，继续下一道'}${icon(revisit ? 'heart' : 'arrow-right')}</button>`, 'gift-modal');
  if (!revisit) confetti();
}
function nextChapter() {
  closeModal(false);
  clearTimeout(toastTimeout);
  document.querySelector('#toast')?.classList.remove('visible');
  if (state.debug ? state.chapter === 5 : state.completed.length === 6) { state.ending = true; state.candlesOut = false; }
  else { state.chapter = state.debug ? state.chapter + 1 : state.completed.length; state.kitchen = createKitchen(state.chapter); state.hint = 0; state.solved = false; state.feedback = ''; }
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function serve() {
  if (state.completed.includes(state.chapter)) { revealGift(state.chapter, true); return; }
  if (state.solved) { openRiddle(state.chapter); return; }
  toast('把料理装进餐盘，送到厨房右下方的出餐口吧。');
}
function assist() {
  state.hint++;
  updateCookingUI(state.kitchen);
  toast(nextTask(state.kitchen));
}
function album() {
  openModal(`<span class="modal-eyebrow">LITTLE THINGS, BIG LOVE</span><h2>我的生日礼物簿</h2><p class="modal-subtitle">${state.completed.length} / 6 份心意，已经好好收下。</p><div class="album-grid">${config.gifts.map((g, i) => `<button class="album-item ${!state.completed.includes(i) ? 'locked' : ''}" data-action="revisit" data-index="${i}" ${!state.completed.includes(i) ? 'disabled' : ''}>${state.completed.includes(i) ? image(GIFT_ART[i]) : `<span class="album-lock">${icon('lock')}</span>`}<small>GIFT 0${i + 1}</small><strong>${state.completed.includes(i) ? esc(g.name) : '还在准备的惊喜'}</strong></button>`).join('')}</div>${state.completed.length === 6 ? '<button class="primary-button full-width" data-action="ending">赴一场生日之约</button>' : ''}`, 'album-modal');
}
function settings() {
  openModal(`<span class="modal-eyebrow">A NOTE FROM YOU</span><h2>把你的心意写进厨房</h2><p class="modal-subtitle">本机修改仅在当前浏览器生效。导出后替换项目的 config.json，可同步到正式站点。</p>
    <form id="settings-form"><div class="form-row"><label>主厨称呼<input class="text-input" name="recipient" value="${esc(config.recipient)}" maxlength="40" required></label><label>小助手署名<input class="text-input" name="sender" value="${esc(config.sender)}" maxlength="40" required></label></div>
    <div class="editor-gifts">${config.gifts.map((g, i) => `<details ${i === 0 ? 'open' : ''}><summary><span>0${i + 1}</span>${esc(g.name)}${icon('notebook-pen')}</summary><label>礼物名称<input class="text-input" name="name-${i}" value="${esc(g.name)}" maxlength="80" required></label><label>揭晓前 · 让她猜一猜<textarea name="riddle-${i}" rows="3" maxlength="3000" required>${esc(g.riddle)}</textarea></label><label>揭晓后 · 想对她说的话<textarea name="message-${i}" rows="3" maxlength="3000" required>${esc(g.message)}</textarea></label></details>`).join('')}</div>
    <label class="closing-label">生日结尾<textarea name="closing" rows="5" maxlength="3000" required>${esc(config.closing)}</textarea></label>
    <div class="editor-actions"><button class="secondary-button" type="button" data-action="import">${icon('upload')}导入配置</button><button class="secondary-button" type="button" data-action="export">${icon('download')}导出当前表单</button><button class="primary-button" type="submit">${icon('check')}保存到本机</button></div></form>
    <div class="settings-danger"><span>从第一道菜单重新开始</span><button class="text-button" data-action="confirm-reset">${icon('rotate-ccw')}重置游戏进度</button></div>`, 'settings-modal');
}
function debugMenu() {
  if (!import.meta.env.DEV) return;
  openModal(`<span class="modal-eyebrow">DEVELOPMENT</span><h2>关卡调试</h2>
    <p class="modal-subtitle">调试不记录正式进度。切换关卡或模式会重开料理。</p>
    <form id="debug-form">
      <fieldset class="debug-modes"><legend>游玩模式</legend>
        <label><input type="radio" name="play-mode" value="story"><span>正式闯关</span></label>
        <label><input type="radio" name="play-mode" value="debug" checked><span>开发调试</span></label>
      </fieldset>
      <label class="debug-chapter">选择关卡<select class="text-input" name="debug-chapter">${THEMES.map((theme, i) => `<option value="${i}" ${state.chapter === i ? 'selected' : ''}>第 ${i + 1} 关 · ${theme.name}</option>`).join('')}</select></label>
      <button class="primary-button full-width" type="submit">${icon('play')}进入厨房</button>
    </form>`, 'debug-modal');
}
function setDebugMode(enabled) {
  if (!import.meta.env.DEV || state.debug === enabled) return;
  const progress = enabled ? normalizeProgress(null) : normalizeProgress(read(KEY));
  Object.assign(state, {
    debug: enabled, completed: progress.completed, finished: progress.finished,
    chapter: Math.min(progress.completed.length, 5), ending: progress.completed.length === 6,
    candlesOut: progress.finished, hint: 0, solved: false, feedback: '',
  });
  state.kitchen = createKitchen(state.chapter);
}
function syncDebugURL() {
  if (!import.meta.env.DEV) return;
  const url = new URL(window.location.href);
  if (state.debug) { url.searchParams.set('debug', '1'); url.searchParams.set('chapter', String(state.chapter + 1)); }
  else { url.searchParams.delete('debug'); url.searchParams.delete('chapter'); }
  window.history.replaceState(null, '', url.href);
  if (window.parent !== window) window.parent.postMessage({ type: 'birthday-bistro:play-mode', debug: state.debug, chapter: state.chapter }, window.location.origin);
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
  for (const key of ['layout', 'preview', 'debug', 'chapter']) url.searchParams.delete(key);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (local && __LAN_IP__) url.hostname = __LAN_IP__;
  openModal(`<span class="modal-eyebrow">SAVE A SEAT FOR YOU</span><h2>把小厨房装进手机</h2><p class="modal-subtitle">${local ? '手机与电脑连接同一个 Wi-Fi 后，扫码进入。' : '扫码，开启你的生日特别菜单。'}</p><div class="qr-holder"><canvas id="qr-canvas" aria-label="游戏访问地址二维码"></canvas></div><input class="text-input share-url" value="${esc(url.href)}" readonly aria-label="游戏网址"><button class="primary-button full-width" data-action="copy-url">${icon('copy')}复制游戏地址</button><p class="share-note">${local ? '这是局域网预览地址，电脑需保持运行。正式生日使用需部署为公开 HTTPS 链接。' : '游戏进度与本机编辑的留言不会跨设备同步。'}</p>`, 'share-modal');
  try { await QRCode.toCanvas(document.querySelector('#qr-canvas'), url.href, { width: 240, margin: 2, color: { dark: '#344c40', light: '#ffffff' } }); } catch { toast('二维码暂时没准备好，可以复制地址打开。'); }
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
      if (state.completed.length === 6) { state.ending = true; render(); }
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'chapter':
      if ((!state.debug && index > state.completed.length) || !Number.isInteger(index) || index < 0 || index > 5) break;
      if (state.chapter === index) break;
      state.chapter = index; state.kitchen = createKitchen(index); state.solved = false; state.feedback = ''; state.hint = 0; render(); break;
    case 'kitchen-interact': kitchenController?.interact(); break;
    case 'kitchen-chop': break;
    case 'confirm-retry':
      openModal(`<span class="modal-eyebrow">ONE MORE LITTLE TRY</span><h2>重新制作这道菜？</h2><p class="modal-subtitle">清空当前台面、锅和餐盘，已经解锁的礼物会保留。</p><div class="confirm-actions"><button class="secondary-button" data-action="close">继续做这一份</button><button class="primary-button" data-action="retry-dish">${icon('rotate-ccw')}重新开始这道菜</button></div>`, 'confirm-modal'); break;
    case 'retry-dish':
      closeModal(false); state.kitchen = createKitchen(state.chapter); state.solved = false; state.hint = 0; render(); break;
    case 'serve': serve(); break;
    case 'hint': case 'hint-shortcut': assist(); break;
    case 'reveal': revealGift(index); break;
    case 'next': nextChapter(); break;
    case 'revisit': if (state.completed.includes(index)) revealGift(index, true); break;
    case 'ending': closeModal(false); state.ending = true; state.candlesOut = state.finished; render(); break;
    case 'wish': state.candlesOut = true; state.finished = true; save(); render(); confetti(); break;
    case 'import': importConfig(); break;
    case 'export': exportConfig(); break;
    case 'copy-url': {
      const field = document.querySelector('.share-url');
      try { await navigator.clipboard.writeText(field.value); toast('地址已复制。'); } catch { field.focus(); field.select(); toast('请长按或使用复制快捷键复制地址。'); } break;
    }
    case 'confirm-reset':
      openModal(`<span class="modal-eyebrow">A FRESH START</span><h2>重新开始今天的菜单？</h2><p class="modal-subtitle">将清除六关进度，写好的生日留言会保留。</p><div class="confirm-actions"><button class="secondary-button" data-action="close">先不重置</button><button class="primary-button" data-action="reset">${icon('rotate-ccw')}确认重新开始</button></div>`, 'confirm-modal'); break;
    case 'reset':
      closeModal(false); Object.assign(state, { chapter: 0, completed: [], finished: false, kitchen: createKitchen(0), hint: 0, solved: false, feedback: '', ending: false, candlesOut: false }); save(); render(); toast('菜单重新准备好啦。'); break;
  }
});
document.addEventListener('change', event => {
  if (event.target.matches('#debug-form [name="play-mode"]')) {
    document.querySelector('#debug-form [name="debug-chapter"]').disabled = event.target.value !== 'debug';
  }
});
document.addEventListener('submit', (event) => {
  if (event.target.id === 'debug-form') {
    event.preventDefault();
    if (!import.meta.env.DEV) return;
    const data = new FormData(event.target);
    const enabled = data.get('play-mode') === 'debug';
    const chapter = Number(data.get('debug-chapter'));
    if (enabled && (!Number.isInteger(chapter) || chapter < 0 || chapter >= THEMES.length)) return;
    closeModal(false); setDebugMode(enabled);
    if (enabled) Object.assign(state, { chapter, kitchen: createKitchen(chapter), ending: false, candlesOut: false, hint: 0, solved: false, feedback: '' });
    render();
    return;
  }
  if (event.target.id === 'kitchen-puzzle-form') {
    event.preventDefault();
    const data = new FormData(event.target);
    const theme = THEMES[state.chapter];
    const answer = theme.options ? data.getAll('choice') : { shape: data.get('shape'), order: [0, 1, 2].map(i => data.get(`slot-${i}`)) };
    if (solveKitchenPuzzle(state.kitchen, answer)) {
      closeModal(); updateCookingUI(state.kitchen); toast(THEMES[state.chapter].success);
    } else document.querySelector('.puzzle-result').textContent = state.kitchen.message;
    return;
  }
  if (event.target.id !== 'settings-form') return;
  event.preventDefault(); config = configFromForm(); write(CONFIG_KEY, config); closeModal(false); render(); toast('心意已保存到当前浏览器。');
});

try {
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`);
  if (!response.ok) throw new Error('配置加载失败');
  baseConfig = await response.json(); config = normalizeConfig(read(CONFIG_KEY), baseConfig); render();
} catch {
  app.innerHTML = `<main class="load-error"><span class="brand-mark">${icon('chef-hat')}</span><h1>厨房还在准备中</h1><p>生日配置暂时没加载成功，请刷新页面再试一次。</p><button class="primary-button" id="retry">重新打开厨房</button></main>`;
  icons(); document.querySelector('#retry').onclick = () => location.reload();
}
