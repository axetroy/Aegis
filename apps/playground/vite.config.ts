import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@aegis/ui': '@aegis/ui/src',
      '@aegis/react': '@aegis/react/src',
      '@aegis/protocol': '@aegis/protocol/src',
      '@aegis/renderer': '@aegis/renderer/src',
    },
  },
});
