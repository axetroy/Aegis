/**
 * @aegis/packager - 打包函数
 *
 * 将应用目录打包为 .aegis 格式
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import JSZip from 'jszip';
import {
  type AppManifest,
  type PackResult,
} from './types.js';
import { computeHash, signData, buildSignaturePayload, extractPublicKey } from './crypto.js';

/**
 * 根据应用目录推断 manifest
 */
export function readAppManifest(inputDir: string): AppManifest {
  const packageJsonPath = join(inputDir, 'package.json');
  let pkg: Record<string, unknown> = {};
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  } catch {
    // 使用默认值
  }

  const name = String(pkg['name'] ?? 'unknown-app');
  // 安全的应用名称：仅允许字母、数字、连字符、下划线
  const safeName = name.replace(/[^a-z0-9_-]/gi, '-').replace(/^-+/, '');
  const version = String(pkg['version'] ?? '0.0.0');
  const description = String(pkg['description'] ?? '');

  // 生成应用 ID（name@version 的 SHA-256）
  const idInput = `${safeName}@${version}`;
  const id = computeHash(new TextEncoder().encode(idInput));

  return {
    id,
    name: safeName,
    version,
    description: description || undefined,
    permissions: [],
    builtAt: new Date().toISOString(),
  };
}

/**
 * 读取应用 bundle
 * 尝试多个可能的主入口文件
 */
export function readEntryPoint(inputDir: string, entryPoint: string): Uint8Array {
  const candidates: string[] = [
    join(inputDir, 'dist', entryPoint),
    join(inputDir, 'dist', 'assets', `${basename(entryPoint, '.js')}.js`),
    join(inputDir, entryPoint),
  ];

  for (const candidate of candidates) {
    try {
      return new Uint8Array(readFileSync(candidate));
    } catch {
      // 尝试下一个
    }
  }

  // 兜底：匹配 Vite hash 文件名（如 index-abc123.js）
  const baseName = basename(entryPoint, '.js');
  try {
    const assetsDir = join(inputDir, 'dist', 'assets');
    const files = readdirSync(assetsDir);
    const match = files.find(f => f.startsWith(`${baseName}-`) && f.endsWith('.js'));
    if (match) {
      return new Uint8Array(readFileSync(join(assetsDir, match)));
    }
  } catch {
    // assets 目录不存在
  }

  throw new Error(`Bundle entry point not found: ${entryPoint}`);
}

/**
 * 读取 source map（可选）
 */
export function readSourceMap(inputDir: string, entryPoint: string): Uint8Array | null {
  try {
    return new Uint8Array(
      readFileSync(join(inputDir, 'dist', 'assets', `${basename(entryPoint, '.js')}.js.map`)),
    );
  } catch {
    return null;
  }
}

/**
 * 打包应用到 .aegis 文件
 */
export async function pack(options: import('./types.js').PackOptions): Promise<PackResult> {
  const {
    inputDir,
    output,
    privateKey,
    entryPoint = 'index.js',
    includeSourceMap = true,
    builtAt,
  } = options;

  // 1. 读取 manifest
  const manifest = readAppManifest(inputDir);
  if (builtAt) manifest['builtAt'] = builtAt;

  // 2. 读取 bundle
  const bundleBytes = readEntryPoint(inputDir, entryPoint);
  const sourceMapBytes = includeSourceMap ? readSourceMap(inputDir, entryPoint) : null;

  // 3. 序列化完整 spec（包含 formatVersion 和签名占位）
  const tempSignature: import('@aegis/protocol').AegisSignature = {
    algorithm: 'ed25519' as import('@aegis/protocol').SignatureAlgorithm,
    publicKey: '',
    signature: '',
    dataHash: '',
    signedAt: manifest['builtAt'] as string ?? new Date().toISOString(),
  };
  const spec: import('./types.js').AegisPackageSpec = {
    formatVersion: '1.0.0',
    manifest,
    main: 'bundle.js',
    signature: tempSignature,
  };
  // 4. 创建 ZIP 包
  const zip = new JSZip();

  // 5. 计算签名（基于纯 manifest，不含 signature 字段）
  const pureManifestJson = JSON.stringify(manifest);
  const sigSpec = buildSignaturePayload(pureManifestJson, bundleBytes);
  let signature: import('@aegis/protocol').AegisSignature;

  if (privateKey) {
    const { signature: sig, dataHash } = signData(sigSpec, privateKey);
    const publicKey = extractPublicKey(privateKey);
    signature = {
      algorithm: 'ed25519' as import('@aegis/protocol').SignatureAlgorithm,
      publicKey,
      signature: sig,
      dataHash,
      signedAt: manifest['builtAt'] as string ?? new Date().toISOString(),
    };
  } else {
    // 无私钥时创建占位签名
    const dataHash = computeHash(sigSpec);
    signature = {
      algorithm: 'ed25519' as import('@aegis/protocol').SignatureAlgorithm,
      publicKey: '',
      signature: '',
      dataHash,
      signedAt: (manifest['builtAt'] as string | undefined) ?? new Date().toISOString(),
    };
  }

  // 更新 spec 中的 signature 并重新序列化
  spec.signature = signature;
  const finalManifestJson = JSON.stringify(spec, null, 2);

  // manifest.json（使用最终签名）
  zip.file('manifest.json', finalManifestJson);

  // bundle（主入口）
  zip.file('bundle.js', bundleBytes);

  // source map（可选）
  if (sourceMapBytes) {
    zip.file('bundle.js.map', sourceMapBytes);
  }

  // 包生成时间戳
  zip.file('.timestamp', new Date().toISOString());

  // signature.json
  zip.file('signature.json', JSON.stringify(signature, null, 2));

  // 6. 生成包整体 hash（用于完整性校验）
  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  const packageHash = computeHash(zipBytes);

  // 7. 写入输出文件
  const outputPath = output.endsWith('.aegis') ? output : `${output}.aegis`;
  const outDir = join(outputPath, '..');
  try {
    mkdirSync(outDir, { recursive: true });
  } catch {
    // 目录已存在
  }
  writeFileSync(outputPath, zipBytes);

  return {
    outputPath,
    packageHash,
    spec: {
      formatVersion: '1.0.0',
      manifest,
      main: 'bundle.js',
      signature,
    },
    size: zipBytes.length,
  };
}
