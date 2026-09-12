/**
 * @aegis/adapter - Adapter 类型定义
 */

import type { AppManifest, AegisSignature } from '@aegis/protocol';

// ============ 应用来源 ============

export enum AppSourceType {
  /** 本地 .aegis 包文件 */
  LocalPackage = 'local-package',
  /** 远程 URL */
  RemoteURL = 'remote-url',
  /** 文件系统路径（开发模式） */
  FileSystem = 'filesystem',
}

// ============ 加载配置 ============

export interface LoadConfig {
  /** 应用来源 */
  source: string;
  /** 来源类型 */
  sourceType: AppSourceType;
  /** 验证签名 */
  verifySignature?: boolean;
  /** 公钥（用于验证签名） */
  publicKey?: string;
  /** 超时时间（毫秒） */
  timeout?: number;
}

// ============ 包代码 ============

export interface PackageCode {
  /** 应用入口代码 */
  entryCode: string;
  /** 应用清单 */
  manifest: AppManifest;
  /** 依赖代码（模块路径 → 代码） */
  modules?: Map<string, string>;
  /** 签名信息 */
  signature?: AegisSignature;
  /** 包哈希 */
  packageHash?: string;
}

// ============ Adapter 接口 ============

export interface AegisAdapter {
  /** 适配器名称 */
  readonly name: string;

  /** 加载应用代码 */
  load(config: LoadConfig): Promise<PackageCode>;

  /** 检查是否支持该来源 */
  supports(sourceType: AppSourceType): boolean;

  /** 卸载/清理 */
  unload(): Promise<void>;
}

// ============ Adapter 工厂 ============

export interface AdapterFactory {
  /** 创建适配器 */
  create(sourceType: AppSourceType): AegisAdapter;
}
