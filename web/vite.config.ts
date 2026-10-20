declare const process: {
  env: Record<string, string | undefined>;
};

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The browser talks only to the Vite origin (`/api` and `/uploads`). This lets
// the app work on localhost and through the computer's LAN address alike.
const apiProxyTarget = process.env.VITE_API_URL ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
