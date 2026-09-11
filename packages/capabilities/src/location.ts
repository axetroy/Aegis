/**
 * Aegis Location Capability (预留接口)
 *
 * 位置信息访问能力（暂未实现）
 */

import { PermissionManager } from '@aegis/security';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  timestamp: number;
}

export class LocationCapability {
  private permissionManager: PermissionManager;
  private watchId: number | null = null;
  private callback?: (location: Location) => void;

  constructor(permissionManager: PermissionManager) {
    this.permissionManager = permissionManager;
  }

  /**
   * 获取当前位置（预留接口）
   */
  async getCurrentPosition(): Promise<Location> {
    throw new Error('Location capability is not yet implemented');
  }

  /**
   * 开始位置监控（预留接口）
   */
  async watchPosition(callback: (location: Location) => void): Promise<number> {
    this.callback = callback;
    this.watchId = Date.now();
    return this.watchId;
  }

  /**
   * 停止位置监控（预留接口）
   */
  async clearWatch(watchId: number): Promise<void> {
    if (this.watchId === watchId) {
      this.watchId = null;
      this.callback = undefined;
    }
  }
}

// 创建位置能力实例
export function createLocationCapability(permissionManager: PermissionManager): LocationCapability {
  return new LocationCapability(permissionManager);
}
