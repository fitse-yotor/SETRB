import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // relative base so the build works from any sub-path (e.g. GitHub Pages)
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
});
