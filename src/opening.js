import { openingAssets, paintOpening, paintMenuMoment } from './opening-art.js';

export const INTRO_KEY = 'birthday-bistro-opening-v1';
export const INTRO_SESSION_KEY = 'birthday-bistro-opening-session-v1';
export const OPENING_DURATIONS = [3000, 6500, 4500, 0];
const MOMENTS = ['一口小小的甜', '出门也有惦记', '深夜有人陪你', '留住平常的一餐', '今晚安心休息', '认真赴一场约'];
const CAPTIONS = [
  ['今晚，只为你营业。', '有一间小厨房，正在等它的主厨。'],
  ['一封来自小助手的邀请。', '铃声响起之前，把这一份期待变成惊喜。'],
  ['每一道，都留了一点想对你说的话。', '最后，还有一个位置在等你。'],
  ['围裙准备好啦。', '今天的厨房，你说了算。'],
];

export function openingMode({ debug, completed, seen, entered, preview = false }) {
  if (debug) return null;
  if (preview) return 'story';
  if (entered || completed.length === 6) return null;
  return seen || completed.length > 0 ? 'welcome' : 'story';
}

export function openingHTML({ mode, sender, muted, icon, debugControl = '' }) {
  const safeSender = sender.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  return `<main class="opening" data-stage="${mode === 'welcome' ? 'welcome' : '0'}" aria-label="生日小厨房开场">
    <header class="opening-header">
      <div class="opening-brand"><span>BIRTHDAY BISTRO</span><h1>生日小厨房<span>.</span></h1></div>
      <div class="opening-tools">
        ${debugControl}
        <button class="icon-button" data-action="music" aria-label="${muted ? '播放背景音乐' : '关闭背景音乐'}" aria-pressed="${!muted}" data-tooltip="背景音乐">${icon(muted ? 'volume-x' : 'volume-2')}</button>
        <button class="icon-button" data-opening="skip" aria-label="跳过开场" data-tooltip="跳过开场">${icon('skip-forward')}</button>
      </div>
    </header>
    <div class="opening-visual">
      <canvas class="opening-canvas" role="img" aria-label="亮着灯的小厨房和等在门前的主厨"></canvas>
      <article class="opening-letter" aria-label="小助手的邀请信" hidden>
        <span class="opening-letter-mark">${icon('heart')}</span>
        <p>主厨大人：<br>今天，想邀请你陪我玩一会儿。</p>
        <p class="opening-letter-second">我把一些想和你一起过的小日子，<br>藏进了六道特别菜单里。</p>
        <cite>来自 ${safeSender}</cite>
      </article>
      <ol class="opening-menu" aria-label="六道特别菜单" hidden>${MOMENTS.map((moment, i) => `<li><canvas width="360" height="260" data-moment="${i}" role="img" aria-label="${moment}"></canvas><span><small>0${i + 1}</small>${moment}</span></li>`).join('')}</ol>
    </div>
    <div class="opening-caption" aria-live="polite" aria-atomic="true"><p></p><span></span></div>
    <footer class="opening-footer">
      <div class="opening-playback">
        <button class="icon-button" data-opening="pause" aria-label="暂停开场" aria-pressed="false" data-tooltip="暂停开场">${icon('pause')}</button>
        <ol class="opening-dots" aria-label="故事进度">${OPENING_DURATIONS.map((_, i) => `<li data-beat="${i}"><span class="sr-only">第 ${i + 1} 幕</span></li>`).join('')}</ol>
      </div>
      <button class="primary-button opening-next" data-opening="next"></button>
      <button class="icon-button" data-opening="replay" aria-label="重看开场" data-tooltip="重看开场">${icon('rotate-ccw')}</button>
    </footer>
  </main>`;
}

export function startOpening(root, { mode: initialMode, chapter, icon, icons, onEnter, onCue }) {
  const scene = root.querySelector('.opening');
  const canvas = scene.querySelector('.opening-canvas');
  const c = canvas.getContext('2d');
  const assets = openingAssets();
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  let mode = initialMode; let stage = 0; let elapsed = 0; let motion = 0; let paused = false;
  let last = performance.now(); let frame; let exitTimer; let disposed = false; let leaving = false; let dirty = true;
  let width = 0; let height = 0;
  const paint = () => {
    paintOpening(c, width, height, { stage, elapsed, motion, reduced: media.matches, welcome: mode === 'welcome' }, assets);
    dirty = false;
  };
  const next = scene.querySelector('[data-opening="next"]');
  const pause = scene.querySelector('[data-opening="pause"]');
  const update = () => {
    scene.dataset.stage = mode === 'welcome' ? 'welcome' : String(stage);
    scene.dataset.reduced = String(media.matches);
    scene.dataset.paused = String(paused);
    scene.querySelector('.opening-letter').hidden = mode !== 'story' || stage !== 1;
    scene.querySelector('.opening-menu').hidden = mode !== 'story' || stage !== 2;
    const captions = mode === 'welcome' ? ['主厨大人，欢迎回来。', `第 ${chapter + 1} 道菜单，还在等你一起完成。`] : CAPTIONS[stage];
    scene.querySelector('.opening-caption p').textContent = captions[0];
    scene.querySelector('.opening-caption > span').textContent = captions[1];
    next.innerHTML = mode === 'welcome' ? `${icon('play')}继续第 ${chapter + 1} 道菜单` : `${icon(stage === 3 ? 'chef-hat' : stage === 0 ? 'heart' : 'arrow-right')}${['拆开邀请', '看看特别菜单', '去小厨房', '开门，今天我主厨'][stage]}`;
    pause.hidden = mode === 'welcome' || stage === 3 || media.matches;
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? '继续播放开场' : '暂停开场');
    pause.dataset.tooltip = paused ? '继续播放开场' : '暂停开场';
    pause.innerHTML = icon(paused ? 'play' : 'pause');
    scene.querySelectorAll('[data-beat]').forEach((dot, i) => {
      if (mode === 'story' && stage === i) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    icons(); dirty = true;
  };
  const advance = () => {
    if (stage >= 3) return;
    stage++; elapsed = 0; update();
    onCue(stage);
  };
  const enter = instant => {
    if (leaving) return;
    leaving = true;
    next.disabled = true;
    scene.dataset.leaving = 'true';
    if (instant || media.matches) onEnter();
    else exitTimer = setTimeout(onEnter, 450);
  };
  const click = event => {
    const action = event.target.closest('[data-opening]')?.dataset.opening;
    if (!action || leaving) return;
    if (action === 'skip') enter(true);
    else if (action === 'next') {
      if (mode === 'welcome' || stage === 3) enter(false);
      else advance();
    } else if (action === 'replay') {
      mode = 'story'; stage = 0; elapsed = 0; motion = 0; paused = false; update();
    } else if (action === 'pause') { paused = !paused; update(); }
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    c.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true;
  };
  const tick = now => {
    if (disposed) return;
    const dt = Math.min(now - last, 100); last = now;
    if (!document.hidden && !document.body.classList.contains('modal-open') && !paused && !leaving && !media.matches && mode === 'story') {
      elapsed += dt; motion += dt; dirty = true;
      if (OPENING_DURATIONS[stage] && elapsed >= OPENING_DURATIONS[stage]) advance();
    }
    if (dirty) paint();
    frame = requestAnimationFrame(tick);
  };
  const visibility = () => { last = performance.now(); };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  scene.addEventListener('click', click);
  document.addEventListener('visibilitychange', visibility);
  media.addEventListener('change', update);
  update(); resize(); frame = requestAnimationFrame(tick);
  Promise.allSettled(Object.values(assets).map(image => image.decode())).then(() => {
    if (disposed) return;
    scene.querySelectorAll('[data-moment]').forEach(moment => paintMenuMoment(moment, Number(moment.dataset.moment), assets));
    paint(); scene.dataset.ready = 'true';
  });
  return () => {
    disposed = true; cancelAnimationFrame(frame); clearTimeout(exitTimer); observer.disconnect();
    scene.removeEventListener('click', click);
    document.removeEventListener('visibilitychange', visibility);
    media.removeEventListener('change', update);
  };
}
