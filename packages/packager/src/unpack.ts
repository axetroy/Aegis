/**
 * @aegis/packager - 解包函数
 *
 * 从 .aegis 文件解析应用
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import JSZip from 'jszip';
import { computeHash } from './crypto.js';
import { type AegisPackage, type UnpackOptions, type IntegrityCheckResult } from './types.js';

/**
 * 从 .aegis 文件解析包
 */
export async function unpack(
  aegisPath: string,
  options: Partial<UnpackOptions> = {},
): Promise<AegisPackage> {
  const { verifySignature = true, publicKey } = options;

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

  const pkg: AegisPackage = {
    spec: spec as import('./types.js').AegisPackageSpec,
    files,
    source: aegisPath,
  };

  if (verifySignature) {
    const { validatePackage } = await import('./validate.js');
    const validation = await validatePackage(pkg, { publicKey });
    if (!validation.valid) {
      throw new Error(`Invalid .aegis package: ${validation.errors.join('; ')}`);
    }
  }

  return pkg;
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
  const resolvedOutputDir = resolve(outputDir);
  const extractedFiles: Array<[string, Uint8Array]> = [];
  for (const [name, data] of pkg.files) {
    if (!name || name.includes('\\') || isAbsolute(name)) {
      throw new Error(`Invalid package path: ${name}`);
    }
    const destPath = resolve(resolvedOutputDir, name);
    const relativePath = relative(resolvedOutputDir, destPath);
    if (
      relativePath === '..' ||
      relativePath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
      isAbsolute(relativePath)
    ) {
      throw new Error(`Package path escapes output directory: ${name}`);
    }
    extractedFiles.push([destPath, data]);
  }

  // 确保目录存在，全部路径验证通过后再写文件
  mkdirSync(resolvedOutputDir, { recursive: true });
  for (const [destPath, data] of extractedFiles) {
    mkdirSync(join(destPath, '..'), { recursive: true });
    writeFileSync(destPath, data);
  }

  return {
    manifestPath: join(resolvedOutputDir, 'manifest.json'),
  };
}
