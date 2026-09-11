import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageCapability, LocalStorageBackend, WorkerStorageBackend, createStorageCapability } from './storage';
import { PermissionManager } from '@aegis/security';
import { CapabilityName, type AppManifest } from '@aegis/protocol';

describe('StorageCapability', () => {
  const mockManifest: AppManifest = { name: 'test', version: '1.0.0', permissions: [] };
  let manager: PermissionManager;
  let storage: StorageCapability;

  beforeEach(() => {
    manager = new PermissionManager({ appId: 'test', manifest: mockManifest });
    // 预授权 storage 能力
    manager.grantCapability(CapabilityName.Storage);
    storage = new StorageCapability('test-app', manager, new WorkerStorageBackend());
  });

  describe('set/get', () => {
    it('应存储并检索数据', async () => {
      await storage.set('token', 'abc123');
      const result = await storage.get('token');
      expect(result).toBe('abc123');
    });

    it('应支持对象存储', async () => {
      const obj = { key: 'value', num: 42 };
      await storage.set('config', obj);
      const result = await storage.get<typeof obj>('config');
      expect(result).toEqual(obj);
    });

    it('不存在的 key 应返回 null', async () => {
      const result = await storage.get('missing');
      expect(result).toBe(null);
    });
  });

  describe('remove/clear', () => {
    it('remove 应删除指定键', async () => {
      await storage.set('key', 'value');
      await storage.remove('key');
      const result = await storage.get('key');
      expect(result).toBe(null);
    });

    it('clear 应清空命名空间下的所有键', async () => {
      await storage.set('a', '1');
      await storage.set('b', '2');
      await storage.clear();
      expect(await storage.keys()).toHaveLength(0);
    });
  });

  describe('keys', () => {
    it('应返回命名空间下的所有键', async () => {
      await storage.set('x', '1');
      await storage.set('y', '2');
      const keys = await storage.keys();
      expect(keys).toContain('x');
      expect(keys).toContain('y');
    });
  });

  describe('权限未授权时', () => {
    beforeEach(() => {
      manager.reset(); // 清除授权
    });

    it('set 应抛出错误', async () => {
      await expect(storage.set('k', 'v')).rejects.toThrow('denied');
    });

    it('get 应抛出错误', async () => {
      await expect(storage.get('k')).rejects.toThrow('denied');
    });
  });
});

describe('StorageBackend', () => {
  describe('LocalStorageBackend', () => {
    it('应封装 localStorage API', () => {
      const backend = new LocalStorageBackend();
      backend.set('key', 'value');
      expect(backend.get('key')).toBe('value');
      backend.remove('key');
      expect(backend.get('key')).toBe(null);
    });
  });

  describe('WorkerStorageBackend', () => {
    it('应使用内存 Map 存储', () => {
      const backend = new WorkerStorageBackend();
      backend.set('key', 'value');
      expect(backend.get('key')).toBe('value');
      expect(backend.keys()).toContain('key');
      backend.clear();
      expect(backend.keys()).toHaveLength(0);
    });
  });
});

describe('createStorageCapability', () => {
  it('应创建带默认后端的存储能力', () => {
    const manager = new PermissionManager({ appId: 'app', manifest: { name: 'app', version: '1.0.0', permissions: [] } });
    manager.grantCapability(CapabilityName.Storage);
    const cap = createStorageCapability('app', manager);
    expect(cap).toBeInstanceOf(StorageCapability);
  });
});
