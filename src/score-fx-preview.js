import { BellRing, Check, Clock, createIcons, Gift, Star, Timer, Volume2, VolumeX, X } from 'lucide';
import { art } from './art.js';
import { CHALLENGES, createKitchen, DISHES, INGREDIENTS, ORDER_PENALTY, ORDER_POINTS, setKitchenLayout, stationsFor, worldFor } from './cooking.js';
import { paintKitchen } from './kitchen-art.js';
import './score-fx-preview.css';

const kitchen = createKitchen(1);
setKitchenLayout(kitchen, true);
const target = CHALLENGES[kitchen.chapter].target;
const app = document.querySelector('#app');
const icon = name => `<i data-lucide="${name}"></i>`;
const icons = () => createIcons({ icons: { BellRing, Check, Clock, Gift, Star, Timer, Volume2, VolumeX, X } });
app.innerHTML = `
  <main class="fx-demo">
    <header class="fx-hud">
      <strong>${icon('bell-ring')}生日小厨房</strong>
      <span>${icon('timer')}03:30</span>
      <span class="fx-score">${icon('star')}<output class="fx-total" aria-label="当前分数"></output><span class="fx-target">/ ${target}</span></span>
      <span class="fx-achievement" hidden>${icon('check')}达标</span>
    </header>
    <section class="fx-kitchen" aria-label="便当厨房">
      <canvas aria-hidden="true"></canvas>
      <div class="fx-tickets" aria-label="订单"></div>
      <div class="fx-serve" aria-hidden="true"></div>
    </section>
    <div class="fx-layer" aria-hidden="true"></div>
    <footer class="fx-controls" aria-label="特效试玩">
      <button type="button" data-effect="serve">${icon('bell-ring')}出餐</button>
      <button type="button" data-effect="miss">${icon('clock')}超时</button>
      <button type="button" data-effect="double">${icon('clock')}双单超时</button>
      <button type="button" data-effect="pass">${icon('star')}达标</button>
      <button type="button" class="fx-sound" aria-label="音效" aria-pressed="true" title="音效">${icon('volume-2')}</button>
    </footer>
    <dialog class="fx-letter" aria-labelledby="fx-letter-title">
      <button type="button" class="fx-close" aria-label="关闭便笺">${icon('x')}</button>
      <span class="fx-letter-icon">${icon('gift')}</span>
      <h2 id="fx-letter-title">生日便笺</h2>
      <p>带上这份热乎乎的心意，出发吧。</p>
    </dialog>
  </main>`;

const demo = app.querySelector('.fx-demo');
const room = demo.querySelector('.fx-kitchen');
const canvas = room.querySelector('canvas');
const ctx = canvas.getContext('2d');
const serve = room.querySelector('.fx-serve');
const tickets = room.querySelector('.fx-tickets');
const layer = demo.querySelector('.fx-layer');
const score = demo.querySelector('.fx-score');
const total = demo.querySelector('.fx-total');
const achievement = demo.querySelector('.fx-achievement');
const letter = demo.querySelector('.fx-letter');
const sound = demo.querySelector('.fx-sound');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const food = DISHES[kitchen.chapter].parts.map(({ id }) => `<span><img src="${art(id, 40)}" alt="">${INGREDIENTS[id].name}</span>`).join('');
let run = 0;
let audio;
let muted = false;
let lastFrame = -1000;
let flash;

function paint(time) {
  if (time - lastFrame >= 42) {
    lastFrame = time;
    const { width, height } = worldFor(kitchen);
    const scale = Math.min(canvas.clientWidth / width, canvas.clientHeight / height);
    if (scale > 0) {
      const w = Math.round(canvas.clientWidth / scale);
      const h = Math.round(canvas.clientHeight / scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        const station = stationsFor(kitchen).find(s => s.id === 'serve');
        serve.style.left = `${(station.x + (w - width) / 2) / w * 100}%`;
        serve.style.top = `${canvas.offsetTop + (station.y + (h - height) / 2) / h * canvas.clientHeight}px`;
        serve.style.width = `${station.w / w * 100}%`;
        serve.style.height = `${station.h / h * canvas.clientHeight}px`;
      }
      paintKitchen(ctx, kitchen, motion.matches ? 0 : time / 1000);
    }
  }
  requestAnimationFrame(paint);
}

const startingTimes = [40, 85, 130];
function renderTickets() {
  tickets.innerHTML = startingTimes.map((seconds, i) => `
    <article class="fx-ticket">
      <header><span>订单 0${i + 1}</span><strong class="fx-time">${formatTime(seconds)}</strong></header>
      <div class="fx-food">${food}</div>
      <div class="fx-patience"><span style="width:${seconds / 130 * 100}%"></span></div>
      <span class="fx-stamp" hidden>${icon('check')}</span>
    </article>`).join('');
  icons();
}

function formatTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
function animate(element, frames, duration, easing = 'ease-out') {
  return element.animate(motion.matches ? [{ opacity: .65 }, { opacity: 1 }] : frames, {
    duration: motion.matches ? Math.min(duration, 180) : duration, easing,
  }).finished.catch(() => {});
}
function pause(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function ping(loss, passed) {
  if (muted) return;
  try {
    audio ||= new AudioContext();
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    const notes = loss ? [[330, 0, .15], [220, .09, .19]]
      : [[660, 0, .24], [880, .085, .32], ...(passed ? [[1175, .5, .35]] : [])];
    for (const [frequency, delay, duration] of notes) {
      const start = audio.currentTime + delay;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = loss ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.065, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + duration);
    }
  } catch { /* The visual demo works without audio. */ }
}

async function fly(origin, delta) {
  const bounds = demo.getBoundingClientRect();
  const number = document.createElement('span');
  const loss = delta < 0;
  number.className = `fx-delta ${loss ? 'fx-loss' : 'fx-win'}`;
  number.textContent = loss ? `−${-delta}` : `+${delta}`;
  const end = score.getBoundingClientRect();
  number.style.left = `${(loss ? end.right + 32 : origin.left + origin.width / 2) - bounds.left}px`;
  number.style.top = `${(loss ? end.bottom + 17 : origin.bottom + 23) - bounds.top}px`;
  layer.append(number);
  const dx = end.left + end.width / 2 - (origin.left + origin.width / 2);
  const dy = end.bottom - origin.bottom - 23;
  await animate(number, loss ? [
    { transform: 'translate(-50%, -50%) scale(.65)', opacity: 0 },
    { transform: 'translate(-50%, -30%) scale(1.15)', opacity: 1, offset: .23 },
    { transform: 'translate(-50%, 32%) scale(.95)', opacity: 1, offset: .64 },
    { transform: 'translate(-50%, 65%) scale(.85)', opacity: 0 },
  ] : [
    { transform: 'translate(-50%, -30%) scale(.65)', opacity: 0 },
    { transform: 'translate(-50%, 0%) scale(1.16)', opacity: 1, offset: .21 },
    { transform: `translate(calc(-50% + ${dx * .58}px), calc(-50% + ${dy * .65}px - 14px)) scale(.92)`, opacity: 1, offset: .59 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.55)`, opacity: 0 },
  ], 620, 'linear');
  number.remove();
}

async function play(effect) {
  const id = ++run;
  flash?.cancel();
  serve.getAnimations().forEach(animation => animation.cancel());
  layer.replaceChildren();
  if (letter.open) letter.close();
  achievement.hidden = true;
  score.classList.remove('fx-score-win', 'fx-score-loss');
  renderTickets();
  const loss = effect === 'miss' || effect === 'double';
  const passed = effect === 'pass';
  const before = passed || loss ? ORDER_POINTS : 0;
  const affected = [...tickets.children].slice(0, effect === 'double' ? 2 : 1);
  const delta = loss ? -ORDER_PENALTY * affected.length : ORDER_POINTS;
  total.value = String(before);

  if (loss) {
    for (let seconds = 5; seconds >= 0; seconds--) {
      if (id !== run) return;
      for (const [i, ticket] of [...tickets.children].entries()) {
        const urgent = affected.includes(ticket);
        const remaining = urgent ? seconds : startingTimes[i] - (5 - seconds);
        ticket.classList.toggle('fx-urgent', urgent);
        ticket.querySelector('.fx-time').textContent = formatTime(remaining);
        ticket.querySelector('.fx-patience span').style.width = `${remaining / 130 * 100}%`;
      }
      if (seconds > 0) await pause(1000);
    }
  }

  const origin = affected[0].getBoundingClientRect();
  ping(loss, passed);
  if (!loss) {
    void animate(serve, [{ opacity: 1 }, { opacity: 0 }], 430);
    affected[0].querySelector('.fx-stamp').hidden = false;
  }
  for (const ticket of affected) {
    ticket.classList.toggle('fx-ticket-missed', loss);
    ticket.classList.toggle('fx-ticket-served', !loss);
    void animate(ticket, [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(0)', opacity: 1, offset: .5 },
      { transform: `translateY(${loss ? 8 : -8}px)`, opacity: 0 },
    ], 470).then(() => ticket.remove());
  }
  if (loss) total.value = String(before + delta);
  await fly(origin, delta);
  if (id !== run) return;
  if (!loss) total.value = String(before + delta);
  score.classList.add(loss ? 'fx-score-loss' : 'fx-score-win');
  flash = score.animate(motion.matches ? [{ opacity: .7 }, { opacity: 1 }] : [
    { transform: 'scale(1)' }, { transform: `scale(${loss ? .94 : 1.16})` }, { transform: 'scale(1)' },
  ], { duration: 260 });
  void flash.finished.then(() => {
    if (id === run) score.classList.remove('fx-score-win', 'fx-score-loss');
  }, () => {});
  if (passed) {
    achievement.hidden = false;
    await pause(520);
    if (id === run) letter.showModal();
  }
}

demo.querySelector('.fx-controls').addEventListener('click', event => {
  const button = event.target.closest('[data-effect]');
  if (!button) return;
  if (!muted) {
    try {
      audio ||= new AudioContext();
      void audio.resume().catch(() => {});
    } catch { /* Audio is optional. */ }
  }
  void play(button.dataset.effect);
});
sound.addEventListener('click', () => {
  muted = !muted;
  sound.setAttribute('aria-pressed', String(!muted));
  sound.innerHTML = icon(muted ? 'volume-x' : 'volume-2');
  icons();
});
letter.querySelector('.fx-close').addEventListener('click', () => letter.close());
total.value = '0';
renderTickets();
requestAnimationFrame(paint);
