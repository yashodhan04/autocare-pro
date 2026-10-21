import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // Forward all /api/* requests to the Express backend during development.
      // This avoids CORS issues — the browser sees one origin.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // Socket.IO (live notifications)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },

  preview: {
    port: 4173,
  },
});
