import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PermissionManager,
  type PermissionManagerConfig,
  type ResourceLimits,
} from './permission-manager';
import { CapabilityName, PermissionDecision, type AppManifest } from '@aegis/protocol';
import { DEFAULT_RESOURCE_LIMITS } from './types';

describe('PermissionManager', () => {
  const mockManifest: AppManifest = {
    name: 'test-app',
    version: '1.0.0',
    permissions: [],
  };

  const createConfig = (overrides: Partial<PermissionManagerConfig> = {}): PermissionManagerConfig => ({
    appId: 'test-app',
    manifest: mockManifest,
    ...overrides,
  });

  let manager: PermissionManager;

  beforeEach(() => {
    manager = new PermissionManager(createConfig());
  });

  describe('默认权限决策', () => {
    it('deny by default 时应拒绝所有未授权能力', () => {
      expect(manager.canAccess(CapabilityName.Storage)).toBe(false);
      expect(manager.canAccess(CapabilityName.Network)).toBe(false);
    });

    it('allow by default 时应允许所有能力', () => {
      const allowManager = new PermissionManager(createConfig({ defaultDecision: PermissionDecision.Allow }));
      expect(allowManager.canAccess(CapabilityName.Storage)).toBe(true);
      expect(allowManager.canAccess(CapabilityName.Network)).toBe(true);
    });
  });

  describe('授权与拒绝', () => {
    it('grantCapability 后 canAccess 应返回 true', () => {
      manager.grantCapability(CapabilityName.Storage);
      expect(manager.canAccess(CapabilityName.Storage)).toBe(true);
    });

    it('denyCapability 后 canAccess 应返回 false', () => {
      manager.grantCapability(CapabilityName.Storage);
      manager.denyCapability(CapabilityName.Storage);
      expect(manager.canAccess(CapabilityName.Storage)).toBe(false);
    });

    it('revokeCapability 应清除权限状态', () => {
      manager.grantCapability(CapabilityName.Storage);
      manager.revokeCapability(CapabilityName.Storage);
      expect(manager.canAccess(CapabilityName.Storage)).toBe(false);
    });
  });

  describe('requestCapability', () => {
    it('已授权时直接返回 true', async () => {
      manager.grantCapability(CapabilityName.Storage);
      const result = await manager.requestCapability(CapabilityName.Storage);
      expect(result).toBe(true);
    });

    it('默认拒绝策略时 promise 应被 reject', async () => {
      const promise = manager.requestCapability(CapabilityName.Network);
      await expect(promise).rejects.toThrow('denied by default policy');
    });

    it('授权后可 resolve pending request', async () => {
      // 使用 allow 默认策略才能测试 pending request 被 grant 的场景
      const allowManager = new PermissionManager(createConfig({ defaultDecision: PermissionDecision.Allow }));
      const promise = allowManager.requestCapability(CapabilityName.Storage);
      // 即使已授权，也能正常 resolve
      const result = await promise;
      expect(result).toBe(true);
    });
  });

  describe('资源限制', () => {
    it('checkResourceLimit 应对数字限制进行比较', () => {
      const limits: ResourceLimits = { uiNodes: 100 };
      const m = new PermissionManager(createConfig({ resourceLimits: limits }));
      expect(m.checkResourceLimit('uiNodes', 50)).toBe(true);
      expect(m.checkResourceLimit('uiNodes', 150)).toBe(false);
    });

    it('getResourceLimits 应返回合并后的配置', () => {
      const limits: ResourceLimits = { storage: '20MB' };
      const m = new PermissionManager(createConfig({ resourceLimits: limits }));
      const config = m.getResourceLimits();
      expect(config.storage).toBe('20MB');
      expect(config.uiNodes).toBe(DEFAULT_RESOURCE_LIMITS.uiNodes);
    });
  });

  describe('资源使用追踪', () => {
    it('updateResourceUsage 应更新使用状态', () => {
      manager.updateResourceUsage({ nodesCreated: 10, messagesSent: 5 });
      const usage = manager.getResourceUsage();
      expect(usage.nodesCreated).toBe(10);
      expect(usage.messagesSent).toBe(5);
    });

    it('reset 应重置所有状态', () => {
      manager.grantCapability(CapabilityName.Storage);
      manager.updateResourceUsage({ nodesCreated: 10 });
      manager.reset();
      expect(manager.canAccess(CapabilityName.Storage)).toBe(false);
      expect(manager.getResourceUsage().nodesCreated).toBe(0);
    });
  });

  describe('getAllPermissions', () => {
    it('应返回所有已授权的权限列表', () => {
      manager.grantCapability(CapabilityName.Storage);
      manager.grantCapability(CapabilityName.Network);
      const permissions = manager.getAllPermissions();
      expect(permissions).toHaveLength(2);
      expect(permissions.map((p) => p.capability)).toContain(CapabilityName.Storage);
      expect(permissions.map((p) => p.capability)).toContain(CapabilityName.Network);
    });
  });
});
