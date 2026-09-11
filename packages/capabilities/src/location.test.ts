import { describe, it, expect } from 'vitest';
import { LocationCapability, createLocationCapability } from './location';
import { PermissionManager } from '@aegis/security';
import { type AppManifest } from '@aegis/protocol';

describe('LocationCapability', () => {
  const mockManifest: AppManifest = { name: 'test', version: '1.0.0', permissions: [] };
  const manager = new PermissionManager({ appId: 'test', manifest: mockManifest });
  const location = new LocationCapability(manager);

  it('getCurrentPosition 应抛出未实现错误', async () => {
    await expect(location.getCurrentPosition()).rejects.toThrow('not yet implemented');
  });

  it('watchPosition 应返回 watchId', async () => {
    const id = await location.watchPosition(() => {});
    expect(typeof id).toBe('number');
  });

  it('clearWatch 应停止监控', async () => {
    const id = await location.watchPosition(() => {});
    await location.clearWatch(id);
    // 不应抛出
    expect(() => location.clearWatch(id)).not.toThrow();
  });
});

describe('createLocationCapability', () => {
  it('应创建位置能力实例', () => {
    const manager = new PermissionManager({ appId: 'app', manifest: { name: 'app', version: '1.0.0', permissions: [] } });
    const cap = createLocationCapability(manager);
    expect(cap).toBeInstanceOf(LocationCapability);
  });
});
