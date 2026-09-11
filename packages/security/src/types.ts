/**
 * Aegis Security Types
 *
 * 能力权限策略与资源限制类型定义
 */

import { CapabilityName, PermissionDecision, type CapabilityPolicy, type AppManifest } from '@aegis/protocol';

// 权限状态
export interface PermissionState {
  capability: CapabilityName;
  decision: PermissionDecision;
  grantedAt: number;
  policy?: CapabilityPolicy;
}

// 权限映射
export type PermissionMap = Map<CapabilityName, PermissionState>;

// 资源限制配置
export interface ResourceLimits {
  memory?: string;
  storage?: string;
  uiNodes?: number;
  maxMessageSize?: string;
  messagesPerSecond?: number;
  cpu?: string;
  treeDepth?: number;
}

// 默认资源限制
export const DEFAULT_RESOURCE_LIMITS: Required<ResourceLimits> = {
  memory: '64MB',
  storage: '10MB',
  uiNodes: 5000,
  maxMessageSize: '1MB',
  messagesPerSecond: 1000,
  cpu: '100%',
  treeDepth: 100,
};

// 权限管理器配置
export interface PermissionManagerConfig {
  appId: string;
  manifest: AppManifest;
  defaultDecision?: PermissionDecision;
  resourceLimits?: Partial<ResourceLimits>;
}

// 资源使用状态
export interface ResourceUsage {
  memoryUsed: number;
  storageUsed: number;
  nodesCreated: number;
  messagesSent: number;
  lastMessageTime: number;
}

// 默认资源使用状态
export const createDefaultResourceUsage = (): ResourceUsage => ({
  memoryUsed: 0,
  storageUsed: 0,
  nodesCreated: 0,
  messagesSent: 0,
  lastMessageTime: 0,
});
