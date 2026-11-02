import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        preview: resolve(import.meta.dirname, 'index.html'),
        panel: resolve(import.meta.dirname, 'panel.html'),
        overlay: resolve(import.meta.dirname, 'overlay.html'),
        config: resolve(import.meta.dirname, 'config.html'),
      },
    },
  },
});
