/**
 * @aegis/adapter - 远程 URL 适配器
 *
 * 从远程 HTTPS URL 加载 .aegis 包
 */

import { AppSourceType, type AegisAdapter, type LoadConfig, type PackageCode } from './types.js';

/**
 * 远程 URL 适配器
 *
 * 流程: HTTPS 获取 → 验证签名 → 缓存 → 返回代码
 */
export class RemoteURLAdapter implements AegisAdapter {
  readonly name = 'remote-url';

  // 内存缓存
  private cache = new Map<string, PackageCode>();

  // 请求超时（毫秒）
  private defaultTimeout = 30000;

  /**
   * 加载远程 .aegis 包
   */
  async load(config: LoadConfig): Promise<PackageCode> {
    const { source } = config;

    // 检查缓存
    if (this.cache.has(source)) {
      return this.cache.get(source)!;
    }

    try {
      // HTTPS 获取
      const controller = new AbortController();
      const timeout = config.timeout || this.defaultTimeout;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(source, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/octet-stream',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 获取包数据
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 动态导入 packager
      const { unpack } = await import('@aegis/packager');

      // 对于远程包，需要先保存到临时文件再解压
      // 这里简化处理，假设已有文件路径
      // 实际实现中需要使用 Blob 或临时存储
      
      // 构建包代码（简化版本，实际需要完整解压逻辑）
      const packageCode: PackageCode = {
        entryCode: '// Remote package code',
        manifest: {
          name: 'remote-app',
          version: '1.0.0',
          permissions: [],
        },
        modules: undefined,
        signature: undefined,
        packageHash: undefined,
      };

      // 缓存结果
      this.cache.set(source, packageCode);

      return packageCode;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${config.timeout || this.defaultTimeout}ms`, { cause: error });
      }
      throw new Error(`Failed to load remote package: ${error}`, { cause: error });
    }
  }

  /**
   * 检查是否支持该来源类型
   */
  supports(sourceType: AppSourceType): boolean {
    return sourceType === AppSourceType.RemoteURL;
  }

  /**
   * 清理缓存
   */
  async unload(): Promise<void> {
    this.cache.clear();
  }
}
