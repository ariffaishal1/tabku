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
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@coderline/alphatab')) {
            return 'alphatab-engine';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
