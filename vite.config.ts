import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vite SSR config:
//   root = src/client (so index.html lives there)
//   client build emits to ../../dist/client (with index.html template + hashed JS/CSS)
//   server build emits to ../../dist/server (entry-server.js)
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/client'),
  publicDir: path.resolve(__dirname, '../../public'),
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    manifest: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
