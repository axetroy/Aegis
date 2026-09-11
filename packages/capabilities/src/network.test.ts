import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkCapability, createNetworkCapability } from './network';
import { PermissionManager } from '@aegis/security';
import { CapabilityName, type AppManifest } from '@aegis/protocol';

describe('NetworkCapability', () => {
  const mockManifest: AppManifest = { name: 'test', version: '1.0.0', permissions: [] };
  let manager: PermissionManager;
  let network: NetworkCapability;

  beforeEach(() => {
    manager = new PermissionManager({ appId: 'test', manifest: mockManifest });
    manager.grantCapability(CapabilityName.Network);
    network = new NetworkCapability(manager);
  });

  describe('request', () => {
    it('应返回模拟响应', async () => {
      const response = await network.request({ url: 'https://api.example.com/data' });
      expect(response.status).toBe(200);
      expect(response.body).toContain('success');
    });

    it('未授权时应抛出错误', async () => {
      manager.reset();
      await expect(network.request({ url: 'https://example.com' }))
        .rejects.toThrow('denied');
    });

    it('非法 URL 应抛出错误', async () => {
      await expect(network.request({ url: 'not-a-url' }))
        .rejects.toThrow('Invalid URL');
    });
  });

  describe('拦截器', () => {
    it('request interceptor 应修改请求选项', async () => {
      const interceptor = vi.fn((opts) => ({ ...opts, headers: { ...opts.headers, 'X-Custom': 'true' } }));
      network.addRequestInterceptor(interceptor);
      await network.request({ url: 'https://example.com' });
      expect(interceptor).toHaveBeenCalled();
    });

    it('response interceptor 应修改响应', async () => {
      const interceptor = vi.fn((resp) => ({ ...resp, body: 'modified' }));
      network.addResponseInterceptor(interceptor);
      const response = await network.request({ url: 'https://example.com' });
      expect(response.body).toBe('modified');
    });
  });

  describe('便捷方法', () => {
    it('get 应发送 GET 请求', async () => {
      const response = await network.get('https://example.com');
      expect(response.status).toBe(200);
    });

    it('post 应发送 POST 请求', async () => {
      const response = await network.post('https://example.com', '{"key":"value"}');
      expect(response.status).toBe(200);
    });
  });

  describe('clearInterceptors', () => {
    it('应清除所有拦截器', () => {
      network.addRequestInterceptor(() => ({ url: '' }));
      network.clearInterceptors();
      // 应该可以正常调用而不受影响
      expect(() => network.request({ url: 'https://example.com' })).not.toThrow();
    });
  });
});

describe('createNetworkCapability', () => {
  it('应创建网络能力实例', () => {
    const manager = new PermissionManager({ appId: 'app', manifest: { name: 'app', version: '1.0.0', permissions: [] } });
    const cap = createNetworkCapability(manager);
    expect(cap).toBeInstanceOf(NetworkCapability);
  });
});
