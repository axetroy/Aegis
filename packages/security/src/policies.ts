/**
 * Aegis Security Policies
 *
 * 预定义的能力策略验证器
 */

import { CapabilityName, type CapabilityPolicy } from '@aegis/protocol';
import { type ResourceLimits } from './types';

// 网络策略验证
export function validateNetworkPolicy(policy: NonNullable<CapabilityPolicy['network']>): void {
  if (policy.allow && !Array.isArray(policy.allow)) {
    throw new Error('Network "allow" must be an array of strings');
  }
  if (policy.deny && !Array.isArray(policy.deny)) {
    throw new Error('Network "deny" must be an array of strings');
  }
}

// 存储策略验证
export function validateStoragePolicy(policy: NonNullable<CapabilityPolicy['storage']>): void {
  if (policy.quota) {
    const bytes = parseMemorySize(policy.quota);
    if (bytes <= 0) {
      throw new Error('Storage quota must be a positive size');
    }
  }
}

// 相机策略验证
export function validateCameraPolicy(policy: NonNullable<CapabilityPolicy['camera']>): void {
  if (policy.mode && policy.mode !== 'user' && policy.mode !== 'environment') {
    throw new Error('Camera mode must be "user" or "environment"');
  }
}

// 位置策略验证
export function validateLocationPolicy(policy: NonNullable<CapabilityPolicy['location']>): void {
  if (policy.accuracy && policy.accuracy !== 'high' && policy.accuracy !== 'low') {
    throw new Error('Location accuracy must be "high" or "low"');
  }
}

// 验证完整能力策略
export function validateCapabilityPolicy(policy: CapabilityPolicy): void {
  if (policy.storage) {
    validateStoragePolicy(policy.storage);
  }
  if (policy.network) {
    validateNetworkPolicy(policy.network);
  }
  if (policy.camera) {
    validateCameraPolicy(policy.camera);
  }
  if (policy.location) {
    validateLocationPolicy(policy.location);
  }
}

// 检查网络请求是否被允许
export function isNetworkAllowed(
  url: string,
  policy: NonNullable<CapabilityPolicy['network']>,
): boolean {
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;

  // 检查拒绝列表
  if (policy.deny?.includes(hostname)) {
    return false;
  }

  // 如果设置了允许列表，则只允许列表中的域名
  if (policy.allow) {
    return policy.allow.includes(hostname);
  }

  return true;
}

// 解析内存大小字符串
export function parseMemorySize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) {
    throw new Error(`Invalid memory size format: ${size}`);
  }

  const value = parseFloat(match[1]!);
  const unit = match[2]!.toUpperCase();

  switch (unit) {
    case 'B':
      return value;
    case 'KB':
      return value * 1024;
    case 'MB':
      return value * 1024 * 1024;
    case 'GB':
      return value * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

// 格式化内存大小
export function formatMemorySize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)}KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

// 计算存储配额使用百分比
export function getStorageUsagePercentage(used: number, quota: string): number {
  const quotaBytes = parseMemorySize(quota);
  return Math.min(100, (used / quotaBytes) * 100);
}

// 资源限制验证器工厂
export function createResourceValidator(limits: ResourceLimits) {
  return {
    checkMemory(bytes: number): boolean {
      if (!limits.memory) return true;
      const limitBytes = parseMemorySize(limits.memory);
      return bytes <= limitBytes;
    },
    checkStorage(bytes: number): boolean {
      if (!limits.storage) return true;
      const limitBytes = parseMemorySize(limits.storage);
      return bytes <= limitBytes;
    },
    checkNodes(count: number): boolean {
      if (!limits.uiNodes) return true;
      return count <= limits.uiNodes!;
    },
    checkMessageSize(bytes: number): boolean {
      if (!limits.maxMessageSize) return true;
      const limitBytes = parseMemorySize(limits.maxMessageSize);
      return bytes <= limitBytes;
    },
    checkMessageRate(rate: number): boolean {
      if (!limits.messagesPerSecond) return true;
      return rate <= limits.messagesPerSecond!;
    },
  };
}
