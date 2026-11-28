import figure from './assets/dimoo-figure.webp';
import gift from './assets/gift-dimoo-flowers.webp';
import './flower-room.css';

export const FLOWER_GIFT_NAME = 'DIMOO 手办 + 永生花';
const LETTER = [
  '还记得这只 DIMOO 吗？这是我们第一次一起买 DIMOO 时开到的那一款。',
  '这次，我给它挑了不会凋谢的花。想把那天的开心留久一点，也想长长久久地陪在你身边。',
  '以后还有好多盒子，想和你一起拆。',
];
const STEPS = {
  door: ['打烊啦', '还有一个盒子，想和你再拆一次。', '打开盒子', 'enter', 'arrow-right'],
  box: ['再拆一次', '就像第一次一起拆的时候那样。', '撕开封条', 'open', 'scissors'],
  figure: ['原来是你', '还记得我们第一次拆到谁吗？', '把 DIMOO 放到底座上', 'place', 'hand'],
  flowers: ['给它留一朵花', '想把哪一枝摆在它身边？'],
  light: ['把这一刻留住', '玻璃罩盖好了，还差一点光。', '点亮小灯', 'light', 'sun'],
  reveal: [FLOWER_GIFT_NAME, '', '一起去许愿', 'finish', 'arrow-right'],
};

export function flowerGiftPhoto(className = 'gift-photo', alt = FLOWER_GIFT_NAME) {
  return `<img class="${className}" src="${gift}" alt="${alt}" decoding="async" draggable="false">`;
}

export function flowerGiftLetter(sender) {
  return `<div class="flower-letter">${LETTER.map(line => `<p>${line}</p>`).join('')}<span>${sender}</span></div>`;
}

const branches = () => `<span class="flower-branch branch-one"><i></i><i></i><i></i></span>
  <span class="flower-branch branch-two"><i></i><i></i><i></i></span>`;

function stage(phase, flower, icon) {
  if (phase === 'door' || phase === 'box' || phase === 'figure') {
    return `<div class="flower-parcel" aria-hidden="true">
      <div class="flower-parcel-lid"></div>
      ${phase === 'figure' ? `<img class="flower-figure" src="${figure}" alt="" draggable="false">` : ''}
      <div class="flower-parcel-front">${icon('heart')}</div>
    </div>`;
  }
  return `<div class="flower-display-set" aria-hidden="true">
    <span class="flower-display-base"></span>
    <img class="flower-figure" src="${figure}" alt="" draggable="false">
    ${flower ? branches() + '<span class="flower-glass"></span>' : ''}
  </div>${phase === 'reveal' ? flowerGiftPhoto('flower-product') : ''}`;
}

export function flowerRoomHTML(room, { icon, sender }) {
  const { phase, flower } = room;
  const [title, line, label, action, symbol] = STEPS[phase];
  const reveal = phase === 'reveal';
  return `<div class="flower-room-grid" data-phase="${phase}" data-flower="${flower || ''}">
    <div class="flower-stage">
      <div class="flower-lamp" aria-hidden="true"><i></i></div>
      ${stage(phase, flower, icon)}
    </div>
    <div class="flower-room-copy">
      <div class="flower-room-story">
        <span class="flower-room-eyebrow">${reveal ? '藏在菜单外的心意' : phase === 'door' ? '生日小厨房 · 打烊后' : '打烊后的花房'}</span>
        <h1 tabindex="-1">${title}</h1>
        ${reveal ? flowerGiftLetter(sender) : `<p>${line}</p>`}
      </div>
      ${action ? `<button class="primary-button flower-command" data-action="flower-${action}">${icon(symbol)}${label}</button>` :
        `<div class="flower-choices" aria-label="选择一枝花">
          <button class="flower-command" data-action="flower-pick" data-id="blue">${icon('flower-2')}雾蓝花枝</button>
          <button class="flower-command" data-action="flower-pick" data-id="pink">${icon('flower-2')}浅粉花枝</button>
        </div>`}
    </div>
  </div>`;
}
