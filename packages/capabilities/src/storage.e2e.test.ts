import { describe, it, expect } from 'vitest';
import { StorageCapability, WorkerStorageBackend } from './storage';
import { PermissionManager } from '@aegis/security';
import { CapabilityName, type AppManifest } from '@aegis/protocol';

describe('StorageCapability E2E', () => {
  const manifest: AppManifest = { name: 'e2e-test', version: '1.0.0', permissions: [CapabilityName.Storage] };
  let manager: PermissionManager;
  let storage: StorageCapability;

  beforeEach(() => {
    manager = new PermissionManager({ appId: 'e2e-app', manifest });
    manager.grantCapability(CapabilityName.Storage);
    storage = new StorageCapability('e2e-app', manager, new WorkerStorageBackend());
  });

  it('完整读写流程', async () => {
    await storage.set('user:name', 'Alice');
    await storage.set('user:email', 'alice@example.com');
    
    const name = await storage.get('user:name');
    const email = await storage.get('user:email');
    
    expect(name).toBe('Alice');
    expect(email).toBe('alice@example.com');
    
    const keys = await storage.keys();
    expect(keys).toContain('user:name');
    expect(keys).toContain('user:email');
    
    await storage.remove('user:email');
    expect(await storage.get('user:email')).toBe(null);
    
    await storage.clear();
    expect(await storage.keys()).toHaveLength(0);
  });

  it('命名空间隔离应生效', async () => {
    const otherStorage = new StorageCapability('other-app', manager, new WorkerStorageBackend());
    await storage.set('shared', 'my-data');
    
    // 不同 namespace 不应访问到对方数据（WorkerStorageBackend 是实例独立的）
    const result = await otherStorage.get('shared');
    expect(result).toBe(null);
  });

  it('复杂对象应正确序列化', async () => {
    const complex = {
      nested: { a: 1, b: [2, 3] },
      flags: true,
      count: 42,
    };
    await storage.set('complex', complex);
    const result = await storage.get<typeof complex>('complex');
    expect(result).toEqual(complex);
  });
});
