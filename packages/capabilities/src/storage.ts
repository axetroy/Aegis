/**
 * Aegis Storage Capability
 *
 * 提供命名空间的本地存储能力
 */

import { PermissionDecision } from '@aegis/protocol';
import { PermissionManager, type ResourceLimits } from '@aegis/security';

// 存储后端接口
export interface StorageBackend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

// 默认 localStorage 后端（用于非 Worker 环境）
export class LocalStorageBackend implements StorageBackend {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage full or unavailable
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // Storage unavailable
    }
  }

  keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  }
}

// Worker 中的存储后端
export class WorkerStorageBackend implements StorageBackend {
  private store = new Map<string, string>();

  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

// 存储能力类
export class StorageCapability {
  private backend: StorageBackend;
  private namespace: string;
  private permissionManager: PermissionManager;
  private limits: ResourceLimits;

  constructor(
    namespace: string,
    permissionManager: PermissionManager,
    backend?: StorageBackend,
    limits: ResourceLimits = {},
  ) {
    this.namespace = namespace;
    this.permissionManager = permissionManager;
    this.backend = backend ?? new LocalStorageBackend();
    this.limits = limits;
  }

  /**
   * 获取命名空间前缀
   */
  private getPrefix(): string {
    return `${this.namespace}/`;
  }

  /**
   * 检查存储配额
   */
  private checkQuota(key: string, value: string): boolean {
    if (!this.limits.storage) return true;
    // 简化实现：估算已用空间
    const currentKeys = this.backend.keys();
    let totalSize = 0;
    for (const k of currentKeys) {
      const v = this.backend.get(k);
      if (v) {
        totalSize += k.length + v.length;
      }
    }
    // 添加新值后的总大小
    const newSize = totalSize + key.length + value.length;
    // 这里简化处理，实际应使用 parseMemorySize
    return newSize < 10 * 1024 * 1024; // 默认 10MB 限制
  }

  /**
   * 读取数据
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const allowed = await this.permissionManager.requestCapability(
      'storage' as any,
    );
    if (!allowed) {
      return null;
    }

    const fullKey = `${this.getPrefix()}${key}`;
    const value = this.backend.get(fullKey);
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * 写入数据
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    const allowed = await this.permissionManager.requestCapability(
      'storage' as any,
    );
    if (!allowed) {
      throw new Error('Storage access denied');
    }

    const fullKey = `${this.getPrefix()}${key}`;
    const serialized = JSON.stringify(value);

    if (!this.checkQuota(fullKey, serialized)) {
      throw new Error('Storage quota exceeded');
    }

    this.backend.set(fullKey, serialized);
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    const allowed = await this.permissionManager.requestCapability(
      'storage' as any,
    );
    if (!allowed) {
      return;
    }

    this.backend.remove(`${this.getPrefix()}${key}`);
  }

  /**
   * 清空存储
   */
  async clear(): Promise<void> {
    const allowed = await this.permissionManager.requestCapability(
      'storage' as any,
    );
    if (!allowed) {
      return;
    }

    const prefix = this.getPrefix();
    const keys = this.backend.keys();
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        this.backend.remove(key);
      }
    }
  }

  /**
   * 列出所有键
   */
  async keys(): Promise<string[]> {
    const allowed = await this.permissionManager.requestCapability(
      'storage' as any,
    );
    if (!allowed) {
      return [];
    }

    const prefix = this.getPrefix();
    return this.backend
      .keys()
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length));
  }
}

// 创建存储能力实例
export function createStorageCapability(
  appId: string,
  permissionManager: PermissionManager,
): StorageCapability {
  return new StorageCapability(appId, permissionManager);
}
