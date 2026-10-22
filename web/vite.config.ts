import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The browser talks only to the Vite origin (`/api` and `/uploads`). This lets
// the app work on localhost and through the computer's LAN address alike.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'API_');
  const apiProxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3001';

  return {
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
  };
});
