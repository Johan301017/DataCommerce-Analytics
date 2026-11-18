import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy /api permite consumir el backend FastAPI sin problemas de CORS en desarrollo.
const apiTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
  preview: {
    port: 4173,
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
});
