/**
 * @aegis/adapter - FileSystem Adapter 测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystemAdapter } from '../src/filesystem.js';
import { AppSourceType } from '../src/types.js';

describe('FileSystemAdapter', () => {
  let adapter: FileSystemAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new FileSystemAdapter();
  });

  it('should have correct name', () => {
    expect(adapter.name).toBe('filesystem');
  });

  it('should support FileSystem source type', () => {
    expect(adapter.supports(AppSourceType.FileSystem)).toBe(true);
    expect(adapter.supports(AppSourceType.LocalPackage)).toBe(false);
    expect(adapter.supports(AppSourceType.RemoteURL)).toBe(false);
  });

  it('should load app from pre-set files', async () => {
    const files = new Map<string, string>();
    files.set('manifest.json', JSON.stringify({
      name: 'Test App',
      version: '1.0.0',
      permissions: [],
    }));
    files.set('index.js', 'console.log("hello");');

    adapter.setFiles(files);

    const result = await adapter.load({
      source: 'virtual://test-app',
      sourceType: AppSourceType.FileSystem,
    });

    expect(result.manifest.name).toBe('Test App');
    expect(result.entryCode).toBe('console.log("hello");');
  });

  it('should collect lib/ modules from pre-set files', async () => {
    const files = new Map<string, string>();
    files.set('manifest.json', JSON.stringify({
      name: 'Test App',
      version: '1.0.0',
      permissions: [],
    }));
    files.set('index.js', 'import { foo } from "./lib/utils.js";');
    files.set('lib/utils.js', 'export const foo = 42;');

    adapter.setFiles(files);

    const result = await adapter.load({
      source: 'virtual://test-app',
      sourceType: AppSourceType.FileSystem,
    });

    expect(result.modules).toBeDefined();
    expect(result.modules!.get('utils.js')).toBe('export const foo = 42;');
  });

  it('should throw when manifest.json is missing', async () => {
    adapter.setFiles(new Map([['index.js', 'hello']]));

    await expect(adapter.load({
      source: 'virtual://test-app',
      sourceType: AppSourceType.FileSystem,
    })).rejects.toThrow('Missing manifest.json');
  });

  it('should throw when entry file is missing', async () => {
    const files = new Map<string, string>();
    files.set('manifest.json', JSON.stringify({
      name: 'Test App',
      version: '1.0.0',
      permissions: [],
    }));

    adapter.setFiles(files);

    await expect(adapter.load({
      source: 'virtual://test-app',
      sourceType: AppSourceType.FileSystem,
    })).rejects.toThrow('Missing entry file');
  });

  it('should throw when no files and source is not URL', async () => {
    await expect(adapter.load({
      source: '/local/path',
      sourceType: AppSourceType.FileSystem,
    })).rejects.toThrow('Cannot resolve files');
  });

  it('should clear files on unload', async () => {
    adapter.setFiles(new Map([['manifest.json', '{}'], ['index.js', '']]));
    await adapter.unload();

    await expect(adapter.load({
      source: '/some/path',
      sourceType: AppSourceType.FileSystem,
    })).rejects.toThrow();
  });

  it('should fetch from dev server when baseUrl is set', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('manifest.json')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            name: 'Server App',
            version: '1.0.0',
            permissions: [],
          })),
        });
      }
      if (url.includes('index.js')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('console.log("from server");'),
        });
      }
      return Promise.resolve({ ok: false });
    });

    vi.stubGlobal('fetch', mockFetch);

    const serverAdapter = new FileSystemAdapter({ baseUrl: 'http://localhost:5173' });

    const result = await serverAdapter.load({
      source: 'http://localhost:5173',
      sourceType: AppSourceType.FileSystem,
    });

    expect(result.manifest.name).toBe('Server App');
    expect(result.entryCode).toBe('console.log("from server");');

    vi.unstubAllGlobals();
  });
});