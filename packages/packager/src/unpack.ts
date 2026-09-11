/**
 * @aegis/packager - 解包函数
 *
 * 从 .aegis 文件解析应用
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { computeHash } from './crypto.js';
import {
  type AegisPackage,
  type UnpackOptions,
  type IntegrityCheckResult,
} from './types.js';

/**
 * 从 .aegis 文件解析包
 */
export async function unpack(
  aegisPath: string,
  options: Partial<UnpackOptions> = {},
): Promise<AegisPackage> {
  const { outputDir: _outputDir, verifySignature: _verifySig = true, publicKey: _publicKey } = options;

  const data = readFileSync(aegisPath);
  const zip = await JSZip.loadAsync(data);

  // 读取 manifest（文本）
  const manifestJson = await zip.file('manifest.json')?.async('text');
  if (!manifestJson) throw new Error(`Invalid .aegis: missing manifest.json in ${aegisPath}`);
  const spec = JSON.parse(manifestJson);

  // 读取 signature（文本）
  await zip.file('signature.json')?.async('text');

  // 收集所有二进制文件（排除 manifest.json 和 signature.json，它们以文本处理）
  const files = new Map<string, Uint8Array>();
  const entries = zip.files;
  for (const [name, entry] of Object.entries(entries)) {
    if (!entry.dir && !name.endsWith('.json')) {
      files.set(name, new Uint8Array(await entry.async('uint8array')));
    }
  }

  return {
    spec: spec as import('./types.js').AegisPackageSpec,
    files,
    source: aegisPath,
  };
}

/**
 * 验证包完整性
 */
export function checkIntegrity(pkg: AegisPackage): IntegrityCheckResult {
  const { spec, files, source } = pkg;

  // 校验签名结构
  if (!spec.signature || !spec.signature.dataHash) {
    return { valid: false, error: 'Missing signature' };
  }

  // 验证数据 hash（纯 manifest JSON + bundle bytes）
  const manifestBytes = new TextEncoder().encode(JSON.stringify(spec.manifest));
  const bundleBytes = files.get('bundle.js') || new Uint8Array(0);
  const combined = new Uint8Array(manifestBytes.length + bundleBytes.length);
  combined.set(manifestBytes, 0);
  combined.set(bundleBytes, manifestBytes.length);

  const actualHash = computeHash(combined);
  if (actualHash !== spec.signature.dataHash) {
    return { valid: false, error: 'Data integrity check failed: hash mismatch' };
  }

  return {
    valid: true,
    hash: typeof source === 'string' ? computeHash(readFileSync(source)) : computeHash(source),  
  };
}

/**
 * 将包解压到输出目录
 */
export async function extract(
  pkg: AegisPackage,
  outputDir: string,
): Promise<{ manifestPath: string }> {
  // 确保目录存在
  mkdirSync(outputDir, { recursive: true });

  // 写入所有文件
  for (const [name, data] of pkg.files) {
    const destPath = join(outputDir, name);
    mkdirSync(join(destPath, '..'), { recursive: true });
    writeFileSync(destPath, data);
  }

  return {
    manifestPath: join(outputDir, 'manifest.json'),
  };
}
