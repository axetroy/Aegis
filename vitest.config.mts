import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/src/**/*.test.tsx',
      'tests/**/*.test.ts',
    ],
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.d.ts',
        '**/index.ts',
        '**/types.ts',
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@aegis/protocol': path.resolve(import.meta.dirname, 'packages/protocol/src'),
      '@aegis/ui': path.resolve(import.meta.dirname, 'packages/ui/src'),
      '@aegis/react': path.resolve(import.meta.dirname, 'packages/react/src'),
      '@aegis/renderer': path.resolve(import.meta.dirname, 'packages/renderer/src'),
      '@aegis/runtime': path.resolve(import.meta.dirname, 'packages/runtime/src'),
      '@aegis/security': path.resolve(import.meta.dirname, 'packages/security/src'),
      '@aegis/capabilities': path.resolve(import.meta.dirname, 'packages/capabilities/src'),
    },
  },
});
