import { describe, it, expect } from 'vitest';
import { CameraCapability, createCameraCapability } from './camera';
import { PermissionManager } from '@aegis/security';
import { type AppManifest } from '@aegis/protocol';

describe('CameraCapability', () => {
  const mockManifest: AppManifest = { name: 'test', version: '1.0.0', permissions: [] };
  const manager = new PermissionManager({ appId: 'test', manifest: mockManifest });
  const camera = new CameraCapability(manager);

  it('capture 应抛出未实现错误', async () => {
    await expect(camera.capture()).rejects.toThrow('not yet implemented');
  });

  it('startRecording 应抛出未实现错误', async () => {
    await expect(camera.startRecording()).rejects.toThrow('not yet implemented');
  });

  it('stopRecording 应抛出未实现错误', async () => {
    await expect(camera.stopRecording()).rejects.toThrow('not yet implemented');
  });
});

describe('createCameraCapability', () => {
  it('应创建相机能力实例', () => {
    const manager = new PermissionManager({ appId: 'app', manifest: { name: 'app', version: '1.0.0', permissions: [] } });
    const cap = createCameraCapability(manager);
    expect(cap).toBeInstanceOf(CameraCapability);
  });
});
