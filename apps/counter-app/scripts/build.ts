import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { pack } from '@aegis/packager';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(appRoot, 'dist');
const playgroundPublic = resolve(appRoot, '..', 'playground', 'public');
const playgroundSrc = resolve(appRoot, '..', 'playground', 'src');
const sdkOutDir = resolve(playgroundPublic, 'aegis-sdk');

async function main(): Promise<void> {
  mkdirSync(distDir, { recursive: true });
  mkdirSync(sdkOutDir, { recursive: true });

  await build({
    entryPoints: [resolve(playgroundSrc, 'sdk.ts')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    conditions: ['source'],
    outfile: resolve(sdkOutDir, 'sdk.js'),
  });

  await build({
    entryPoints: [resolve(appRoot, 'src/index.tsx')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    jsx: 'automatic',
    conditions: ['source'],
    external: ['@aegis/react', '@aegis/ui', 'react', 'react/jsx-runtime'],
    outfile: resolve(distDir, 'index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
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
