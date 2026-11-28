import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: false,
  resolve: {
    alias: [{ find: /^\.\/art-platform\.js$/, replacement: fileURLToPath(new URL('./art-platform.js', import.meta.url)) }],
  },
  server: { host: '127.0.0.1', port: 5181 },
});
