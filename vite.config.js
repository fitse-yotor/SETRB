import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  // relative base so the build works from any sub-path (e.g. GitHub Pages)
  base: './',
  // during development, API calls go to the Node backend (npm run server)
  server: { proxy: { '/api': 'http://localhost:8787' } },
  preview: { proxy: { '/api': 'http://localhost:8787' } },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        news: resolve(import.meta.dirname, 'news.html'),
        news_detail: resolve(import.meta.dirname, 'news-detail.html'),
        tenders: resolve(import.meta.dirname, 'tenders.html'),
        tender_detail: resolve(import.meta.dirname, 'tender-detail.html'),
        vacancies: resolve(import.meta.dirname, 'vacancies.html'),
        vacancy_detail: resolve(import.meta.dirname, 'vacancy-detail.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
      },
    },
  },
});
