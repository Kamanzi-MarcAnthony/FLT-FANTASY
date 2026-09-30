import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// VITE_BASE = '/<repo-name>/' when deploying to GitHub Pages
export default defineConfig({ base: process.env.VITE_BASE || '/', plugins: [vue()] });
