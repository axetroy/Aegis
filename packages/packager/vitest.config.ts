import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');
const packagePath = path.relative(workspaceRoot, __dirname).split(path.sep).join('/');

export default defineConfig({
  root: workspaceRoot,
  test: {
    environment: 'node',
    include: [`${packagePath}/src/**/*.test.ts`],
    exclude: ['node_modules', 'dist'],
    setupFiles: [`${packagePath}/vitest.setup.ts`],
  },
});
