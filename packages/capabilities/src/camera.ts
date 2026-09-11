/**
 * Aegis Camera Capability (预留接口)
 *
 * 摄像头访问能力（暂未实现）
 */

import { PermissionManager } from '@aegis/security';

export class CameraCapability {
  private permissionManager: PermissionManager;

  constructor(permissionManager: PermissionManager) {
    this.permissionManager = permissionManager;
  }

  /**
   * 捕获照片（预留接口）
   */
  async capture(): Promise<Blob> {
    throw new Error('Camera capability is not yet implemented');
  }

  /**
   * 开始视频录制（预留接口）
   */
  async startRecording(): Promise<void> {
    throw new Error('Camera capability is not yet implemented');
  }

  /**
   * 停止视频录制（预留接口）
   */
  async stopRecording(): Promise<void> {
    throw new Error('Camera capability is not yet implemented');
  }
}

// 创建相机能力实例
export function createCameraCapability(permissionManager: PermissionManager): CameraCapability {
  return new CameraCapability(permissionManager);
}
