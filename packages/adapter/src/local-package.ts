/**
 * @aegis/adapter - 本地包适配器
 *
 * 从本地 .aegis 包文件加载应用代码
 */

import { AppSourceType, type AegisAdapter, type LoadConfig, type PackageCode } from './types.js';

/**
 * 本地包适配器
 *
 * 流程: 读取包 → 验证签名 → 解压 → 返回代码
 */
export class LocalPackageAdapter implements AegisAdapter {
  readonly name = 'local-package';

  // 缓存已加载的包
  private cache = new Map<string, PackageCode>();

  /**
   * 加载本地 .aegis 包
   */
  async load(config: LoadConfig): Promise<PackageCode> {
    const { source } = config;

    // 检查缓存
    if (this.cache.has(source)) {
      return this.cache.get(source)!;
    }

    try {
      // 动态导入 packager（避免循环依赖）
      const { unpack, checkIntegrity } = await import('@aegis/packager');

      // 解压包
      const result = await unpack(source, {
        outputDir: `/tmp/aegis-unpack-${Date.now()}`,
        verifySignature: config.verifySignature ?? true,
        publicKey: config.publicKey,
      });

      // 将 Uint8Array 转换为字符串
      const entryCode = result.files.get(result.spec.main);
      const entryCodeStr = entryCode ? new TextDecoder().decode(entryCode) : '';

      // 转换依赖模块
      const modules = new Map<string, string>();
      for (const [key, value] of result.files) {
        if (key !== result.spec.main) {
          modules.set(key, new TextDecoder().decode(value));
        }
      }

      // 构建包代码
      const packageCode: PackageCode = {
        entryCode: entryCodeStr,
        manifest: result.spec.manifest,
        modules: modules.size > 0 ? modules : undefined,
        signature: result.spec.signature,
      };

      // 验证签名
      if (config.verifySignature !== false) {
        const integrity = checkIntegrity(result);
        if (!integrity.valid) {
          throw new Error(`Package signature verification failed: ${integrity.error}`);
        }
      }

      // 缓存结果
      this.cache.set(source, packageCode);

      return packageCode;
    } catch (error) {
      throw new Error(`Failed to load local package: ${error}`);
    }
  }

  /**
   * 检查是否支持该来源类型
   */
  supports(sourceType: AppSourceType): boolean {
    return sourceType === AppSourceType.LocalPackage;
  }

  /**
   * 清理缓存
   */
  async unload(): Promise<void> {
    this.cache.clear();
  }
}
