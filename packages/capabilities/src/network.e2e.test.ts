import { describe, it, expect } from 'vitest';
import { NetworkCapability } from './network';
import { PermissionManager, isNetworkAllowed, validateCapabilityPolicy } from '@aegis/security';
import { CapabilityName, type AppManifest } from '@aegis/protocol';

describe('NetworkCapability E2E', () => {
  const mockManifest: AppManifest = { name: 'net-test', version: '1.0.0', permissions: [] };
  let manager: PermissionManager;
  let network: NetworkCapability;

  beforeEach(() => {
    manager = new PermissionManager({ appId: 'net-app', manifest: mockManifest });
    manager.grantCapability(CapabilityName.Network);
    network = new NetworkCapability(manager);
  });

  it('基础请求应成功', async () => {
    const response = await network.request({
      url: 'https://api.example.com/users',
      method: 'GET',
    });
    expect(response.status).toBe(200);
    expect(typeof response.body).toBe('string');
  });

  it('POST 请求应携带 body', async () => {
    const response = await network.post(
      'https://api.example.com/users',
      JSON.stringify({ name: 'test' }),
      { 'Content-Type': 'application/json' },
    );
    expect(response.status).toBe(200);
  });

  it('拦截器链式执行', async () => {
    const callOrder: string[] = [];
    
    network.addRequestInterceptor((opts) => {
      callOrder.push('req1');
      return { ...opts, headers: { ...opts.headers, 'X-Auth': 'token' } };
    });
    
    network.addResponseInterceptor((resp) => {
      callOrder.push('res1');
      return resp;
    });
    
    await network.get('https://example.com');
    expect(callOrder).toEqual(['req1', 'res1']);
  });

  it('策略验证集成', () => {
    const policy = {
      network: { allow: ['api.example.com'] },
      storage: { quota: '5MB' },
    };
    expect(() => validateCapabilityPolicy(policy)).not.toThrow();
    expect(isNetworkAllowed('https://api.example.com/v1', policy.network!)).toBe(true);
    expect(isNetworkAllowed('https://evil.com', policy.network!)).toBe(false);
  });
});
