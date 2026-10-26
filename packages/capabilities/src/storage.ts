/**
 * Aegis Storage Capability
 *
 * 提供命名空间的本地存储能力
 */

import { CapabilityName } from '@aegis/protocol';
import { parseMemorySize, PermissionManager, type ResourceLimits } from '@aegis/security';

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
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  keys(): string[] {
    return Object.keys(localStorage);
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
    this.limits = {
      ...limits,
      storage:
        limits.storage ??
        permissionManager.getCapabilityState(CapabilityName.Storage)?.policy?.storage?.quota ??
        permissionManager.getResourceLimits().storage,
    };
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
    let totalSize = 0;
    for (const existingKey of this.backend.keys()) {
      if (!existingKey.startsWith(this.getPrefix())) continue;
      const existingValue = this.backend.get(existingKey);
      if (existingValue !== null) {
        totalSize +=
          new TextEncoder().encode(existingKey).length +
          new TextEncoder().encode(existingValue).length;
      }
    }
    const previousValue = this.backend.get(key);
    if (previousValue !== null) {
      totalSize -=
        new TextEncoder().encode(key).length + new TextEncoder().encode(previousValue).length;
    }
    const newSize =
      totalSize + new TextEncoder().encode(key).length + new TextEncoder().encode(value).length;
    return newSize <= parseMemorySize(this.limits.storage);
  }

  /**
   * 读取数据
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    const allowed = await this.permissionManager.requestCapability(CapabilityName.Storage);
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
    const allowed = await this.permissionManager.requestCapability(CapabilityName.Storage);
    if (!allowed) {
      throw new Error('Storage access denied');
    }

    const fullKey = `${this.getPrefix()}${key}`;
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError('Storage values must be JSON-serializable');
    }

    if (!this.checkQuota(fullKey, serialized)) {
      throw new Error('Storage quota exceeded');
    }

    this.backend.set(fullKey, serialized);
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    const allowed = await this.permissionManager.requestCapability(CapabilityName.Storage);
    if (!allowed) {
      return;
    }

    this.backend.remove(`${this.getPrefix()}${key}`);
  }

  /**
   * 清空存储
   */
  async clear(): Promise<void> {
    const allowed = await this.permissionManager.requestCapability(CapabilityName.Storage);
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
    const allowed = await this.permissionManager.requestCapability(CapabilityName.Storage);
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
