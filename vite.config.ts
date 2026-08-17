import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { rboDevSyncPlugin } from './vite-rbo-dev-sync';

export default defineConfig({
  plugins: [react(), tailwindcss(), rboDevSyncPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
