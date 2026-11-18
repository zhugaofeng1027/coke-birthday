import { createIcons, ArrowLeft, Smartphone, ExternalLink } from 'lucide';
import './phone-preview.css';

const sizes = {
  standard: { width: 844, height: 390 },
  small: { width: 740, height: 320 },
  compact: { width: 568, height: 320 },
  tablet: { width: 1180, height: 820 },
};
const home = new URL(window.location.href);
home.searchParams.delete('preview');
home.searchParams.delete('layout');
const game = new URL(home);
game.searchParams.set('layout', 'landscape');
const app = document.querySelector('#app');
app.innerHTML = `
  <header class="preview-toolbar">
    <a class="preview-icon" id="preview-back" aria-label="返回电脑试玩" title="返回电脑试玩"><i data-lucide="arrow-left"></i></a>
    <span class="preview-title"><i data-lucide="smartphone"></i>手机横屏预览</span>
    <select id="preview-size" aria-label="预览设备尺寸">
      <option value="standard">手机 · 844 × 390</option>
      <option value="small">小屏 · 740 × 320</option>
      <option value="compact">紧凑 · 568 × 320</option>
      <option value="tablet">平板 · 1180 × 820</option>
    </select>
    <output id="preview-scale" aria-label="预览缩放比例"></output>
    <a class="preview-icon" id="preview-open" target="_blank" rel="noopener" aria-label="独立打开游戏" title="独立打开游戏"><i data-lucide="external-link"></i></a>
  </header>
  <main class="preview-workspace">
    <div class="preview-frame"><iframe title="手机横屏游戏" allow="fullscreen"></iframe></div>
  </main>`;
document.querySelector('#preview-back').href = home.href;
document.querySelector('#preview-open').href = game.href;
createIcons({ icons: { ArrowLeft, Smartphone, ExternalLink }, attrs: { 'stroke-width': 1.7 } });

const workspace = document.querySelector('.preview-workspace');
const frame = document.querySelector('.preview-frame');
const iframe = frame.querySelector('iframe');
const select = document.querySelector('#preview-size');
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== iframe.contentWindow || event.data?.type !== 'birthday-bistro:play-mode' || typeof event.data.debug !== 'boolean') return;
  if (event.data.debug && (!Number.isInteger(event.data.chapter) || event.data.chapter < 0 || event.data.chapter >= 6)) return;
  const shell = new URL(location.href);
  for (const url of [shell, home, game]) {
    if (event.data.debug) { url.searchParams.set('debug', '1'); url.searchParams.set('chapter', String(event.data.chapter + 1)); }
    else { url.searchParams.delete('debug'); url.searchParams.delete('chapter'); }
  }
  history.replaceState(null, '', shell.href);
  document.querySelector('#preview-back').href = home.href;
  document.querySelector('#preview-open').href = game.href;
});
function fit() {
  const size = sizes[select.value];
  const scale = Math.min(1, (workspace.clientWidth - 28) / size.width, (workspace.clientHeight - 28) / size.height);
  frame.style.width = `${size.width * scale}px`;
  frame.style.height = `${size.height * scale}px`;
  iframe.style.width = `${size.width}px`;
  iframe.style.height = `${size.height}px`;
  iframe.style.transform = `scale(${scale})`;
  document.querySelector('#preview-scale').textContent = `${Math.round(scale * 100)}%`;
}
select.addEventListener('change', () => { fit(); iframe.focus(); });
new ResizeObserver(fit).observe(workspace);
iframe.addEventListener('load', () => iframe.focus());
fit();
iframe.src = game.href;
