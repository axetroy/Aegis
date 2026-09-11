/**
 * Aegis Permission Manager
 *
 * 管理应用的能力权限和资源限制
 */

import {
  CapabilityName,
  PermissionDecision,
  type AppManifest,
  type CapabilityPolicy,
} from '@aegis/protocol';
import {
  type PermissionState,
  type PermissionMap,
  type ResourceLimits,
  type ResourceUsage,
  DEFAULT_RESOURCE_LIMITS,
  createDefaultResourceUsage,
  type PermissionManagerConfig,
} from './types';

export class PermissionManager {
  private appId: string;
  private manifest: AppManifest;
  private permissions: PermissionMap = new Map();
  private defaultDecision: PermissionDecision;
  private resourceLimits: Required<ResourceLimits>;
  private resourceUsage: ResourceUsage;
  private pendingRequests: Map<string, { resolve: (value: boolean) => void; reject: (reason?: unknown) => void }> = new Map();

  constructor(config: PermissionManagerConfig) {
    this.appId = config.appId;
    this.manifest = config.manifest;
    this.defaultDecision = config.defaultDecision ?? PermissionDecision.Deny;
    this.resourceLimits = { ...DEFAULT_RESOURCE_LIMITS, ...config.resourceLimits };
    this.resourceUsage = createDefaultResourceUsage();
  }

  /**
   * 检查能力是否可用
   */
  canAccess(capability: CapabilityName): boolean {
    const state = this.permissions.get(capability);
    if (!state) {
      return this.defaultDecision === PermissionDecision.Allow;
    }
    return state.decision === PermissionDecision.Allow;
  }

  /**
   * 请求能力权限
   */
  requestCapability(
    capability: CapabilityName,
    policy?: CapabilityPolicy,
    timeoutMs = 30000,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const requestId = `${capability}-${Date.now()}`;

      // 如果已授权，直接返回
      if (this.canAccess(capability)) {
        resolve(true);
        return;
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Capability request timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      // 记录待处理请求
      this.pendingRequests.set(requestId, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timeoutId);
          reject(reason);
        },
      });

      // 发送 UI 请求消息（由宿主处理）
      const message = {
        type: 'capability:request-ui',
        payload: {
          requestId,
          appId: this.appId,
          capability,
          description: this.getCapabilityDescription(capability),
          policy,
        },
      };

      // 在实际实现中，这会通过 postMessage 发送给宿主
      // eslint-disable-next-line no-console
      console.log('[PermissionManager] Requesting capability:', message);

      // 如果默认策略是拒绝，则立即拒绝请求
      if (this.defaultDecision === PermissionDecision.Deny) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Capability "${capability}" is denied by default policy`));
        return;
      }
    });
  }

  /**
   * 授予能力
   */
  grantCapability(capability: CapabilityName, policy?: CapabilityPolicy): void {
    this.permissions.set(capability, {
      capability,
      decision: PermissionDecision.Allow,
      grantedAt: Date.now(),
      policy,
    });

    // 解析待处理的请求
    for (const [requestId, { resolve }] of this.pendingRequests) {
      if (requestId.startsWith(`${capability}-`)) {
        resolve(true);
        this.pendingRequests.delete(requestId);
      }
    }
  }

  /**
   * 拒绝能力
   */
  denyCapability(capability: CapabilityName, reason?: string): void {
    this.permissions.set(capability, {
      capability,
      decision: PermissionDecision.Deny,
      grantedAt: Date.now(),
    });

    // 拒绝待处理的请求
    for (const [requestId, { reject }] of this.pendingRequests) {
      if (requestId.startsWith(`${capability}-`)) {
        reject(new Error(reason ?? `Capability "${capability}" was denied`));
        this.pendingRequests.delete(requestId);
      }
    }
  }

  /**
   * 撤销能力
   */
  revokeCapability(capability: CapabilityName): void {
    this.permissions.delete(capability);
  }

  /**
   * 获取能力状态
   */
  getCapabilityState(capability: CapabilityName): PermissionState | undefined {
    return this.permissions.get(capability);
  }

  /**
   * 检查资源限制
   */
  checkResourceLimit(limit: keyof ResourceLimits, value: number): boolean {
    const limitValue = this.resourceLimits[limit];
    if (!limitValue) return true;

    if (typeof limitValue === 'number') {
      return value <= limitValue;
    }

    // 字符串格式的资源限制（如 "64MB"）需要解析
    return true;
  }

  /**
   * 更新资源使用
   */
  updateResourceUsage(updates: Partial<ResourceUsage>): void {
    this.resourceUsage = { ...this.resourceUsage, ...updates };
  }

  /**
   * 获取资源使用状态
   */
  getResourceUsage(): ResourceUsage {
    return { ...this.resourceUsage };
  }

  /**
   * 获取资源限制配置
   */
  getResourceLimits(): Required<ResourceLimits> {
    return { ...this.resourceLimits };
  }

  /**
   * 获取所有已授权的权限
   */
  getAllPermissions(): PermissionState[] {
    return Array.from(this.permissions.values());
  }

  /**
   * 重置权限状态
   */
  reset(): void {
    this.permissions.clear();
    this.resourceUsage = createDefaultResourceUsage();
    this.pendingRequests.clear();
  }

  /**
   * 获取能力描述
   */
  private getCapabilityDescription(capability: CapabilityName): string {
    const descriptions: Record<CapabilityName, string> = {
      [CapabilityName.Storage]: '访问本地存储空间',
      [CapabilityName.Network]: '发送网络请求',
      [CapabilityName.Camera]: '访问摄像头',
      [CapabilityName.Location]: '获取位置信息',
      [CapabilityName.Clipboard]: '访问剪贴板',
      [CapabilityName.Notifications]: '发送通知',
    };
    return descriptions[capability] ?? `访问 ${capability} 能力`;
  }
}
