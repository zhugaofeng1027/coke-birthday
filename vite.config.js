import { defineConfig } from 'vite';
import { networkInterfaces } from 'node:os';

const addresses = Object.values(networkInterfaces()).flat().filter(Boolean);
const lan = addresses.find((a) => a.family === 'IPv4' && !a.internal && a.address.startsWith('192.168.'))
  || addresses.find((a) => a.family === 'IPv4' && !a.internal);

export default defineConfig({
  base: './',
  define: { __LAN_IP__: JSON.stringify(lan?.address || '') },
  server: { host: '0.0.0.0', port: 5173, strictPort: false },
});
