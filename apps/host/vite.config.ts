import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@aegis/protocol': '@aegis/protocol/src',
      '@aegis/renderer': '@aegis/renderer/src',
    },
  },
});
