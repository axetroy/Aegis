import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: [path.join(__dirname, 'src', '**', '*.test.ts')],
    exclude: ['node_modules', 'dist'],
    setupFiles: [path.join(__dirname, 'vitest.setup.ts')],
  },
});
