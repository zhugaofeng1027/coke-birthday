import {
  createIcons, ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart,
  Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X,
  ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb,
  HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen,
  PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play,
} from 'lucide';
import QRCode from 'qrcode';
import { CHAPTERS, FRUITS, CUSTOMERS, RECIPE, MEMORIES, TOKEN_ORDER, newPuzzle, checkPuzzle, normalizeConfig, normalizeProgress } from './game.js';
import { art, startKitchen } from './art.js';
import './style.css';

const iconSet = { ChefHat, Cherry, Sandwich, CookingPot, Camera, LampDesk, Gift, Heart, Circle, Square, Star, Moon, Flower2, Sparkles, Utensils, Check, Lock, X, ArrowRight, ArrowLeft, Volume2, VolumeX, QrCode, Settings, RotateCcw, Lightbulb, HandHeart, Download, Upload, Copy, Droplets, Music, Sun, NotebookPen, PartyPopper, CakeSlice, BookHeart, Undo2, ShoppingBag, Info, Play };
const KEY = 'birthday-bistro-v1';
const CONFIG_KEY = 'birthday-bistro-config-v1';
const app = document.querySelector('#app');
const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icon = (name, cls = '') => `<i data-lucide="${name}" ${cls ? `class="${cls}"` : ''} aria-hidden="true"></i>`;
const image = (type, cls = '', alt = '') => `<img src="${art(type)}" class="${cls}" alt="${esc(alt)}" draggable="false">`;
const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('当前浏览器无法保存进度，请保持页面打开。'); } };
let baseConfig;
let config;
const progress = normalizeProgress(read(KEY));
const state = {
  chapter: Math.min(progress.completed.length, 5), completed: progress.completed,
  finished: progress.finished, puzzle: newPuzzle(), hint: 0, solved: false,
  feedback: '', feedbackKind: '', muted: true, ending: progress.completed.length === 6, candlesOut: progress.finished,
};
let stopScene = () => {};
let modalCleanup = () => {};
let modalReturnFocus = null;
let toastTimeout;
let audioContext;
let musicTimer;
let noteStep = 0;
let activeGift = 0;
const GIFT_ART = ['candy', 'charm', 'snacks', 'film', 'candle', 'perfume'];

function icons() { createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.7 } }); }
function save() { write(KEY, { completed: state.completed, finished: state.finished }); }
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
  stopScene();
  const ch = CHAPTERS[state.chapter];
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#" data-action="home" aria-label="生日小厨房首页">
        <span class="brand-mark">${icon('chef-hat')}</span>
        <span><strong>生日小厨房<span class="brand-dot">.</span></strong><small>BIRTHDAY BISTRO</small></span>
      </a>
      <span class="header-dedication">今晚，只接你这一单。</span>
      <div class="header-actions">
        <span class="open-badge"><span></span> 只为你营业</span>
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
            const done = state.completed.includes(i); const available = i <= state.completed.length;
            return `<button class="chapter ${i === state.chapter ? 'active' : ''} ${done ? 'complete' : ''}" data-action="chapter" data-index="${i}" ${!available ? 'disabled' : ''} ${i === state.chapter ? 'aria-current="step"' : ''}>
              <span class="chapter-illustration" style="--chapter-color:${c.color}">${icon(c.icon)}</span>
              <span class="chapter-copy"><small>0${i + 1} ${done ? '· 已送达' : i === state.chapter ? '· 制作中' : ''}</small><strong>${c.short}</strong></span>
              <span class="chapter-status">${icon(done ? 'check' : available ? 'arrow-right' : 'lock')}</span>
            </button>`;
          }).join('')}</nav>
          <div class="menu-bottom"><div class="tiny-progress"><span style="width:${state.completed.length / 6 * 100}%"></span></div><p><strong>${state.completed.length}</strong> / 6 份心意已送达</p><button class="text-button" data-action="album">${icon('book-heart')} 我的礼物簿</button></div>
          <div class="sidebar-note">${icon('heart')} 今天的快乐，不用赶时间。</div>
        </aside>
        <section class="game-column" aria-label="厨房游戏">
          <div class="scene-heading"><div><span class="chapter-tag">CHAPTER 0${state.chapter + 1}</span><h2>${ch.title}</h2></div><span class="scene-weather">${icon(state.chapter >= 4 ? 'moon' : 'sun')} ${state.chapter >= 4 ? '温柔的夜晚' : '晴 · 适合过生日'}</span></div>
          <div class="kitchen-scene">
            <canvas id="kitchen" role="img" aria-label="原创生日厨房：窗边是料理台，主厨和小助手正在为生日晚餐备菜。"></canvas>
            <div class="scene-location"><span class="live-dot"></span>${ch.station}</div>
            <div class="scene-speech">${state.chapter === 2 ? '配方？我明明收得很好呀…' : state.chapter === 4 ? '今天辛苦啦，慢慢来。' : state.chapter === 5 ? '最后的惊喜，准备好了吗？' : '主厨，我来给你打下手！'}<span></span></div>
            ${state.chapter === 2 ? scrapsHTML() : ''}
            <div class="scene-bottom"><span>${icon('heart')} LOVE IS THE SECRET INGREDIENT</span><span>EST. JUST FOR YOU</span></div>
          </div>
          <section class="workbench" aria-label="关卡操作台">
            <div class="workbench-title"><h3>${workbenchTitle()}</h3><button class="text-button" data-action="clear" ${state.solved ? 'disabled' : ''}>${icon('undo-2')} 重来</button></div>
            ${puzzleHTML()}
            <div class="feedback ${state.feedbackKind}" role="status" aria-live="polite">${state.feedback ? `${icon(state.feedbackKind === 'success' ? 'check' : 'heart')} ${esc(state.feedback)}` : ''}</div>
          </section>
        </section>
        <aside class="order-column">
          <section class="order-ticket">
            <div class="ticket-top"><span>一份专属订单</span>${icon('notebook-pen')}</div>
            <div class="ticket-number">ORDER <strong>#00${state.chapter + 1}</strong></div>
            <h3>${ch.title}</h3><p class="order-subtitle">${ch.subtitle}</p>
            <div class="ticket-rule"></div>
            <div class="recipe-label">${icon('notebook-pen')} 主厨小纸条</div>
            <div class="clue-text">${clueHTML()}</div>
            <div class="ticket-rule"></div>
            <div class="ticket-footer"><span>难度</span><span class="difficulty">${[0, 1, 2].map((n) => icon('heart', n === 0 ? 'filled' : '')).join('')} 刚刚好</span></div>
            <button class="primary-button serve-button" data-action="serve">${icon(state.solved || state.completed.includes(state.chapter) ? 'gift' : 'utensils')}${state.solved || state.completed.includes(state.chapter) ? '打开我的生日便笺' : state.chapter === 5 ? '打开预约卡' : '完成，准备出餐'}${icon('arrow-right')}</button>
          </section>
          <section class="helper-area"><div class="helper-heading"><span class="helper-avatar">${icon('chef-hat')}</span><div><strong>${esc(config.sender)}</strong><span>随时待命的副厨</span></div><span class="online-dot"></span></div>
            <p>${state.hint ? hintText() : '配方可以慢慢研究，做错了我们就再来一次。今天没有催单哦。'}</p>
            <button class="helper-button" data-action="hint">${icon('lightbulb')}${state.hint >= 2 ? '请小助手代班' : state.hint === 1 ? '再给一点提示' : '小助手，给点提示'}</button>
          </section>
        </aside>
      </div>`}
      <footer class="site-footer"><span>用一点点胡闹，和很多很多喜欢做成。</span><span>${icon('heart')} MADE JUST FOR YOU</span></footer>
    </main>
    <div id="modal-root"></div>`;
  if (!state.ending) stopScene = startKitchen(document.querySelector('#kitchen'), () => state);
  icons();
}

function workbenchTitle() {
  return ['今日备菜 · 水果甜品碗', '客人到齐 · 分一份便当', '找回配方 · 还差几张纸条？', '时光排序 · 今天的三个瞬间', '打烊时刻 · 收好今天的忙碌', '最后一步 · 拼出你的专属邀请'][state.chapter];
}
function slots(items, type, count, label) {
  return `<div class="slots ${type === 'photo' ? 'photo-slots' : ''}" aria-label="${label}">${Array.from({ length: count }, (_, i) => {
    const item = items[i];
    return `<button class="ingredient-slot ${item ? 'has-item' : ''}" data-action="remove" data-index="${i}" ${!item || state.solved ? 'disabled' : ''} aria-label="${item ? `移除第 ${i + 1} 项` : `第 ${i + 1} 个位置，空`}">${item ? type === 'fruit' ? image(item) : type === 'recipe' ? `${icon(RECIPE.find(r => r.id === item).icon)}<small>${RECIPE.find(r => r.id === item).name}</small>` : type === 'photo' ? `${image(item)}<small>${MEMORIES.find(m => m.id === item).title}</small>` : icon(CHAPTERS[item].token) : `<span class="slot-number">0${i + 1}</span><span class="slot-plus">+</span>`}</button>${i < count - 1 ? `<span class="slot-arrow">${icon('arrow-right')}</span>` : ''}`;
  }).join('')}</div>`;
}
function puzzleHTML() {
  const p = state.puzzle;
  switch (state.chapter) {
    case 0:
      return `${slots(p.fruits, 'fruit', 3, '水果放置顺序')}<div class="ingredient-tray">${FRUITS.map(f => `<button class="ingredient" data-action="fruit" data-id="${f.id}" ${state.solved || p.fruits.includes(f.id) ? 'disabled' : ''}>${image(f.id)}<span>${f.name}</span>${p.fruits.includes(f.id) ? `<span class="ingredient-check">${icon('check')}</span>` : ''}</button>`).join('')}</div>`;
    case 1:
      return `<div class="customers">${CUSTOMERS.map((c, i) => `<label class="customer"><span class="customer-name">${icon(c.icon)}${c.name}</span><span class="customer-clue">${c.clue}</span>${p.customers[i] ? image(p.customers[i], 'customer-food') : '<span class="empty-plate"></span>'}<select aria-label="${c.name}的便当" data-customer="${i}" ${state.solved ? 'disabled' : ''}><option value="">选一份食物</option>${['rice', 'broccoli', 'strawberry'].map((id, j) => `<option value="${id}" ${p.customers[i] === id ? 'selected' : ''}>${['饭团', '西兰花', '草莓'][j]}</option>`).join('')}</select></label>`).join('')}</div>`;
    case 2:
      return `<div class="scrap-status">${[0, 1, 2].map((i) => `<span class="${p.scraps.includes(i) ? 'found' : ''}">${icon(p.scraps.includes(i) ? 'check' : 'notebook-pen')} 纸条 ${i + 1}</span>`).join('')}</div>${p.scraps.length < 3 ? `<p class="workbench-prompt">锅盖、窗边、冰箱上，好像都留着什么……</p>` : `${slots(p.recipe, 'recipe', 3, '备菜步骤')}<div class="recipe-options">${[RECIPE[2], RECIPE[0], RECIPE[1]].map(r => `<button class="secondary-button" data-action="recipe" data-id="${r.id}" ${state.solved || p.recipe.includes(r.id) ? 'disabled' : ''}>${icon(r.icon)}${r.name}</button>`).join('')}</div>`}`;
    case 3:
      return `${slots(p.photos, 'photo', 3, '一天的回忆顺序')}<div class="memory-tray">${[MEMORIES[2], MEMORIES[0], MEMORIES[1]].map(m => `<button class="memory-photo" data-action="photo" data-id="${m.id}" ${state.solved || p.photos.includes(m.id) ? 'disabled' : ''}>${image(m.art, '', m.caption)}<strong>${m.title}</strong><span>${m.time}</span></button>`).join('')}</div>`;
    case 4:
      return `<div class="ambience-controls">${[
        ['lights', 'lamp-desk', '窗边的小灯', p.lights, ['柔光已亮', '还没开灯']],
        ['flowers', 'flower-2', '桌上的鲜花', p.flowers, ['已经摆好', '还没摆好']],
        ['radio', 'music', '吵闹的收音机', p.radio, ['正在播放', '已经关好']],
      ].map(([id, name, label, checked, statuses]) => `<button class="ambience-control ${checked ? 'on' : ''}" data-action="ambience" data-id="${id}" role="switch" aria-checked="${checked}" aria-label="${label}" ${state.solved ? 'disabled' : ''}>${icon(name)}<span><strong>${label}</strong><small>${statuses[checked ? 0 : 1]}</small></span><span class="switch-track"><span></span></span></button>`).join('')}</div>`;
    case 5:
      return `${slots(p.tokens, 'token', 5, '预约卡的五个符号')}<div class="token-tray">${CHAPTERS.slice(0, 5).map((c, i) => `<button class="token-choice" data-action="token" data-id="${i}" aria-label="${['樱桃', '小花', '月亮', '相机', '星光'][i]}" ${state.solved || p.tokens.includes(i) ? 'disabled' : ''}>${icon(c.token)}<span>${['樱桃', '小花', '月亮', '相机', '星光'][i]}</span></button>`).join('')}</div>`;
  }
}
function scrapsHTML() {
  return [{ x: 11, y: 24, label: '锅盖上的纸条' }, { x: 58, y: 17, label: '窗边的纸条' }, { x: 92, y: 40, label: '冰箱上的纸条' }].map((s, i) => `<button class="scrap-hotspot ${state.puzzle.scraps.includes(i) ? 'collected' : ''}" style="left:${s.x}%;top:${s.y}%" data-action="scrap" data-id="${i}" aria-label="${s.label}" ${state.puzzle.scraps.includes(i) ? 'disabled' : ''}>${icon(state.puzzle.scraps.includes(i) ? 'check' : 'notebook-pen')}</button>`).join('');
}
function clueHTML() {
  return [
    '<p>第一口，要黄黄的。</p><p>紫色的甜，藏在中间。</p><p>红色水果，最后登场。</p><p class="clue-aside">今天，绿色水果休息一天。</p>',
    '<p>小圆想要米饭，<br>小方喜欢绿色蔬菜，<br>小星只想吃红色水果。</p><p class="clue-aside">让每个小客人，都收到喜欢的那一份。</p>',
    `<p>先找到厨房里散落的三张纸条。</p>${state.puzzle.scraps.length === 3 ? '<p>“洗净再下锅，慢卤才入味，最后装盘。”</p>' : '<p class="clue-aside">锅里、窗边和冰箱，各有一个小秘密。</p>'}`,
    '<p>从早晨的出发，<br>到午后的甜点，<br>再到并肩回家的夜晚。</p><p class="clue-aside">把这一天，按时间收好。</p>',
    '<p>留一盏温柔的灯，<br>摆一束喜欢的花，<br>让收音机也休息一下。</p><p class="clue-aside">不需要更多热闹，这样就很好。</p>',
    '<p>月亮先来敲门，<br>樱桃带着一点甜，<br>星光悄悄跟上，<br>小花站在相机前面。</p><p class="clue-aside">五份心意，会为你打开最后一张预约卡。</p>',
  ][state.chapter];
}
function hintText() {
  const hints = [
    ['看看水果的颜色，先找黄色的那一个。', '依次放入：香蕉 → 葡萄 → 草莓。点已放入的水果可以拿回来。'],
    ['把每位客人提到的食物，选进对应的便当。', '小圆选饭团，小方选西兰花，小星选草莓。'],
    ['点一下场景里正在闪动的小纸条。', '找齐三张后，按“洗净食材 → 小火慢卤 → 装盘上桌”排列。'],
    ['照片下方的小时间，就是顺序的线索。', '一起出发 → 分一口甜 → 并肩回家。'],
    ['灯和花要准备好，收音机要安静下来。', '小灯打开、鲜花摆好、收音机关闭。'],
    ['按照小纸条提到的顺序，放入之前收集的符号。', '月亮 → 樱桃 → 星光 → 小花 → 相机。'],
  ];
  return hints[state.chapter][Math.min(state.hint - 1, 1)];
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
  if (restore) modalReturnFocus?.focus();
}
function openRiddle(index) {
  activeGift = index;
  openModal(`<span class="modal-eyebrow">A LITTLE SURPRISE · 0${index + 1}</span><div class="letter-icon">${icon('notebook-pen')}</div>
    <h2>出餐成功，收到一封小便笺。</h2><p class="modal-subtitle">来自 ${esc(config.sender)}</p><div class="riddle-letter">${esc(config.gifts[index].riddle)}</div>
    <label class="guess-label" for="guess">猜猜，这次藏了什么？</label><input id="guess" class="text-input" maxlength="120" placeholder="写下你的猜测，或直接告诉身边的我">
    <button class="primary-button full-width" data-action="reveal" data-index="${index}">${icon('gift')}揭晓这份心意${icon('arrow-right')}</button><span class="modal-footnote">答案是什么都没关系，这份心意已经属于你。</span>`, 'letter-modal');
}
function revealGift(index, revisit = false) {
  if (!revisit && !state.completed.includes(index)) {
    if (index !== state.completed.length || !state.solved) return;
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
  if (state.completed.length === 6) { state.ending = true; state.candlesOut = false; }
  else { state.chapter = state.completed.length; state.puzzle = newPuzzle(); state.hint = 0; state.solved = false; state.feedback = ''; }
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function serve() {
  if (state.completed.includes(state.chapter)) { revealGift(state.chapter, true); return; }
  if (state.solved) { openRiddle(state.chapter); return; }
  if (!checkPuzzle(state.chapter, state.puzzle)) {
    state.feedback = state.chapter === 2 && state.puzzle.scraps.length < 3 ? '还差几张小纸条，去厨房里找找吧。' : '差一点点啦，再看一眼主厨小纸条？';
    state.feedbackKind = 'gentle'; render(); return;
  }
  state.solved = true; state.feedback = '完美出餐！有一份小惊喜在等你。'; state.feedbackKind = 'success';
  render(); openRiddle(state.chapter);
}
function assist() {
  if (state.hint < 2) { state.hint++; render(); return; }
  Object.assign(state.puzzle, [
    { fruits: ['banana', 'grape', 'strawberry'] },
    { customers: ['rice', 'broccoli', 'strawberry'] },
    { scraps: [0, 1, 2], recipe: ['wash', 'simmer', 'plate'] },
    { photos: ['morning', 'afternoon', 'night'] },
    { lights: true, flowers: true, radio: false },
    { tokens: [...TOKEN_ORDER] },
  ][state.chapter]);
  state.feedback = '小助手已经帮你准备好啦，随时可以出餐。'; state.feedbackKind = 'success'; render();
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
    case 'close': closeModal(); break;
    case 'album': album(); break;
    case 'home':
      if (state.completed.length === 6) { state.ending = true; render(); }
      else { state.chapter = state.completed.length; state.puzzle = newPuzzle(); state.solved = false; state.feedback = ''; state.hint = 0; render(); }
      break;
    case 'chapter':
      if (index > state.completed.length || index < 0 || index > 5) break;
      if (state.chapter === index) break;
      state.chapter = index; state.puzzle = newPuzzle(); state.solved = false; state.feedback = ''; state.hint = 0; render(); break;
    case 'fruit':
      if (!state.solved && state.puzzle.fruits.length < 3 && !state.puzzle.fruits.includes(id)) { state.puzzle.fruits.push(id); state.feedback = ''; render(); }
      else if (state.puzzle.fruits.length >= 3 && !state.solved) toast('碗里已经有三种水果啦，可以点一下取回。');
      break;
    case 'remove': {
      if (state.solved) break;
      const field = ['fruits', null, 'recipe', 'photos', null, 'tokens'][state.chapter];
      if (field) { state.puzzle[field].splice(index, 1); state.feedback = ''; render(); }
      break;
    }
    case 'scrap':
      if (!state.puzzle.scraps.includes(Number(id))) { state.puzzle.scraps.push(Number(id)); render(); toast(['“先把食材洗干净。”', '“慢慢卤，才会香。”', '“最后装盘，给喜欢的人。”'][Number(id)]); }
      break;
    case 'recipe': case 'photo': case 'token': {
      const field = { recipe: 'recipe', photo: 'photos', token: 'tokens' }[action]; const value = action === 'token' ? Number(id) : id;
      const max = action === 'token' ? 5 : 3;
      if (!state.solved && !state.puzzle[field].includes(value) && state.puzzle[field].length < max) { state.puzzle[field].push(value); state.feedback = ''; render(); } break;
    }
    case 'ambience':
      if (!state.solved && ['lights', 'flowers', 'radio'].includes(id)) { state.puzzle[id] = !state.puzzle[id]; state.feedback = ''; render(); } break;
    case 'clear': {
      if (state.solved) break;
      const scraps = [...state.puzzle.scraps]; state.puzzle = newPuzzle(); if (state.chapter === 2) state.puzzle.scraps = scraps;
      state.feedback = ''; render(); break;
    }
    case 'serve': serve(); break;
    case 'hint': assist(); break;
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
      closeModal(false); Object.assign(state, { chapter: 0, completed: [], finished: false, puzzle: newPuzzle(), hint: 0, solved: false, feedback: '', ending: false, candlesOut: false }); save(); render(); toast('菜单重新准备好啦。'); break;
  }
});
document.addEventListener('change', (event) => {
  if (event.target.matches('[data-customer]') && !state.solved) { state.puzzle.customers[Number(event.target.dataset.customer)] = event.target.value; state.feedback = ''; render(); }
});
document.addEventListener('submit', (event) => {
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
