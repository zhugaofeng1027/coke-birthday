import { build } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const outDir = path('../dist-wechat');
await build({
  configFile: path('./vite.config.js'),
  build: {
    outDir,
    emptyOutDir: true,
    target: 'es2018',
    lib: { entry: path('./entry.js'), name: 'BirthdayBistro', formats: ['iife'], fileName: () => 'game.js' },
  },
});

await mkdir(path('../dist-wechat/assets'), { recursive: true });
await Promise.all([
  ...['game.json', 'project.config.json'].map(file => copyFile(path(file), path(`../dist-wechat/${file}`))),
  ...['birthday-chef.png', 'birthday-chef-party.png', 'gift-grape-candy.webp']
    .map(file => copyFile(path(`../src/assets/${file}`), path(`../dist-wechat/assets/${file}`))),
]);
console.log(`小游戏工程已生成: ${outDir}`);
