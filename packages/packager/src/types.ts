/**
 * @aegis/packager - 类型重导出
 *
 * 所有包格式类型来自 @aegis/protocol，此处重新导出以简化导入
 */

import type {
  AppManifest,
  AppIcon,
  PackageDependency,
  AegisPackageSpec,
  AegisSignature,
  SignatureAlgorithm,
  AegisCertificate,
  IntegrityCheckResult,
  AegisPackage,
} from '@aegis/protocol';

// Re-export for convenience
export type {
  AppManifest,
  AppIcon,
  PackageDependency,
  AegisPackageSpec,
  AegisSignature,
  SignatureAlgorithm,
  AegisCertificate,
  IntegrityCheckResult,
  AegisPackage,
};

// 打包选项
export interface PackOptions {
  /** 输入目录路径 */
  inputDir: string;
  /** 输出文件路径（.aegis 扩展名可选） */
  output: string;
  /** 私钥（PEM 格式，用于签名） */
  privateKey?: string;
  /** 主入口文件名（默认 index.js） */
  entryPoint?: string;
  /** 是否包含 source map */
  includeSourceMap?: boolean;
  /** 构建时间戳（ISO 8601，默认当前时间） */
  builtAt?: string;
}

// 解析选项
export interface UnpackOptions {
  /** 输出目录 */
  outputDir: string;
  /** 是否验证签名（默认 true） */
  verifySignature?: boolean;
  /** 公钥（用于验证签名，PEM 格式） */
  publicKey?: string;
}

// 打包结果
export interface PackResult {
  /** 包文件路径 */
  outputPath: string;
  /** 包 hash（SHA-256，base64） */
  packageHash: string;
  /** 包规格 */
  spec: AegisPackageSpec;
  /** 包大小（字节） */
  size: number;
}
