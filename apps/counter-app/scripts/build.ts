import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { pack } from '@aegis/packager';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(appRoot, 'dist');
const playgroundPublic = resolve(appRoot, '..', 'playground', 'public');

async function main(): Promise<void> {
  mkdirSync(distDir, { recursive: true });

  await build({
    entryPoints: [resolve(appRoot, 'src/index.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    jsx: 'automatic',
    conditions: ['source'],
    outfile: resolve(distDir, 'index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
      global: 'globalThis',
    },
  });

  const result = await pack({
    inputDir: appRoot,
    output: resolve(distDir, 'counter-app.aegis'),
    includeSourceMap: false,
  });

  mkdirSync(playgroundPublic, { recursive: true });
  copyFileSync(result.outputPath, resolve(playgroundPublic, 'counter-app.aegis'));
  console.log(`Built ${result.outputPath} (${(result.size / 1024).toFixed(1)} KB)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});