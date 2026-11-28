import { defineConfig, transformWithEsbuild } from 'vite';
import { networkInterfaces } from 'node:os';

const addresses = Object.values(networkInterfaces()).flat().filter(Boolean);
const lan = addresses.find((a) => a.family === 'IPv4' && !a.internal && a.address.startsWith('192.168.'))
  || addresses.find((a) => a.family === 'IPv4' && !a.internal);

function kitchenPhaser() {
  const entry = '\0kitchen-phaser';
  return {
    name: 'kitchen-phaser',
    apply: 'build',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'phaser') return entry;
    },
    load(id) {
      if (id !== entry) return;
      // Phaser's core entry omits the optional factories and physics plugins.
      return `import 'phaser/src/gameobjects/zone/ZoneFactory.js';
        import 'phaser/src/physics/arcade/ArcadePhysics.js';
        export { default } from 'phaser/src/phaser-core.js';`;
    },
    transform(code, id) {
      if (!id.includes('/node_modules/phaser/src/')) return;
      const stripped = code.replace(
        /\btypeof (CANVAS_RENDERER|WEBGL_RENDERER|FEATURE_SOUND|PLUGIN_CAMERA3D|PLUGIN_FBINSTANT)\b/g,
        (_, flag) => String(flag === 'CANVAS_RENDERER'),
      );
      if (stripped !== code) return transformWithEsbuild(stripped, id, { minifySyntax: true });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [kitchenPhaser()],
  define: { __LAN_IP__: JSON.stringify(lan?.address || '') },
  server: { host: '0.0.0.0', port: 5173, strictPort: false },
});
