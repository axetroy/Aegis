/**
 * @aegis/loader - ModuleLoader 测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AegisModuleLoader } from '../src/loader.js';
import type { PackageCode } from '../src/types.js';

describe('AegisModuleLoader', () => {
  let loader: AegisModuleLoader;

  beforeEach(() => {
    loader = new AegisModuleLoader({ maxCacheSize: 10 });
  });

  it('should create loader with default config', () => {
    const defaultLoader = new AegisModuleLoader();
    expect(defaultLoader).toBeDefined();
  });

  it('should load a simple package', async () => {
    const packageCode: PackageCode = {
      entryCode: 'module.exports = { hello: "world" };',
      manifest: {
        name: 'test-package',
        version: '1.0.0',
        permissions: [],
      },
    };

    const result = await loader.loadPackage(packageCode);

    expect(result.id).toBe('test-package');
    expect(result.exports).toEqual({ hello: 'world' });
    expect(result.loadedAt).toBeGreaterThan(0);
  });

  it('should cache loaded modules', async () => {
    const packageCode: PackageCode = {
      entryCode: 'module.exports = { count: 1 };',
      manifest: {
        name: 'cached-package',
        version: '1.0.0',
        permissions: [],
      },
    };

    await loader.loadPackage(packageCode);
    const result2 = await loader.loadPackage(packageCode);

    expect(result2.id).toBe('cached-package');
    const stats = loader.getCacheStats();
    expect(stats.hits).toBe(1);
  });

  it('should resolve cached module', async () => {
    const packageCode: PackageCode = {
      entryCode: 'module.exports = { test: true };',
      manifest: {
        name: 'resolve-package',
        version: '1.0.0',
        permissions: [],
      },
    };

    await loader.loadPackage(packageCode);
    const resolved = loader.resolve('resolve-package');

    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe('resolve-package');
  });

  it('should return null for unresolved module', () => {
    const resolved = loader.resolve('nonexistent');
    expect(resolved).toBeNull();
  });

  it('should clear cache', async () => {
    const packageCode: PackageCode = {
      entryCode: 'module.exports = {};',
      manifest: {
        name: 'clear-package',
        version: '1.0.0',
        permissions: [],
      },
    };

    await loader.loadPackage(packageCode);
    loader.clearCache();

    const stats = loader.getCacheStats();
    expect(stats.size).toBe(0);
  });

  it('should load package with dependencies', async () => {
    const packageCode: PackageCode = {
      entryCode: 'const dep = require("dep1"); module.exports = { dep };',
      manifest: {
        name: 'dep-package',
        version: '1.0.0',
        permissions: [],
      },
      modules: new Map([
        ['dep1', 'module.exports = { value: 42 };'],
      ]),
    };

    const result = await loader.loadPackage(packageCode);

    expect(result.id).toBe('dep-package');
    expect(result.exports).toBeDefined();
  });

  it('should handle invalid code gracefully', async () => {
    const packageCode: PackageCode = {
      entryCode: 'this is not valid javascript {{{',
      manifest: {
        name: 'invalid-package',
        version: '1.0.0',
        permissions: [],
      },
    };

    await expect(loader.loadPackage(packageCode)).rejects.toThrow('Failed to load package');
  });

  it('should respect max cache size', async () => {
    const smallLoader = new AegisModuleLoader({ maxCacheSize: 3 });

    for (let i = 0; i < 5; i++) {
      await smallLoader.loadPackage({
        entryCode: `module.exports = { i: ${i} };`,
        manifest: {
          name: `pkg-${i}`,
          version: '1.0.0',
          permissions: [],
        },
      });
    }

    const stats = smallLoader.getCacheStats();
    expect(stats.size).toBeLessThanOrEqual(3);
  });
});
