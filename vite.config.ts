import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { alphaTab } from '@coderline/alphatab-vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    alphaTab(),
  ],
  optimizeDeps: {
    exclude: ['@coderline/alphatab'],
  },
});
