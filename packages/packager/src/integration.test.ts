/**
 * @aegis/packager - 集成测试
 *
 * 端到端测试打包和解析流程
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  pack,
  unpack,
  validatePackage,
  checkIntegrity,
  extract,
  generateKeyPair,
} from './index.js';

const testDir = join(process.cwd(), 'packages/packager/dist-integration-test');

describe('@aegis/packager integration', () => {
  beforeAll(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // 清理失败不影响测试结果
    }
  });

  it('完整打包-解析流程', async () => {
    const inputDir = join(process.cwd(), 'apps/playground');
    const outputAegis = join(testDir, 'test-app.aegis');

    // 1. 打包
    const result = await pack({
      inputDir,
      output: outputAegis,
    });

    expect(result.outputPath).toBe(outputAegis);
    expect(result.packageHash).toHaveLength(44);
    expect(result.size).toBeGreaterThan(1000);
    expect(result.spec.manifest.name).toBe('aegis-playground');
    expect(result.spec.signature.dataHash).toHaveLength(44);

    // 2. 解析
    await expect(unpack(outputAegis)).rejects.toThrow('Package has no signature or public key');
    const pkg = await unpack(outputAegis, { verifySignature: false });
    expect(pkg.spec.manifest.id).toBeDefined();
    expect(pkg.files.has('bundle.js')).toBe(true);
    expect(pkg.files.has('.timestamp')).toBe(true);

    // 3. 完整性校验
    const integrity = checkIntegrity(pkg);
    expect(integrity.valid).toBe(true);
    expect(integrity.hash).toBeDefined();

    // 4. 完整验证
    const validation = await validatePackage(pkg, { verifySignature: false });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const signedValidation = await validatePackage(pkg);
    expect(signedValidation.valid).toBe(false);
    expect(signedValidation.errors).toContain('Package has no signature or public key');
  });

  it('被篡改的包应通过完整性校验失败', async () => {
    const inputDir = join(process.cwd(), 'apps/playground');
    const tamperedOutput = join(testDir, 'tampered.aegis');

    await pack({ inputDir, output: tamperedOutput });

    // 篡改 bundle
    const pkg = await unpack(tamperedOutput, { verifySignature: false });
    const originalBundle = pkg.files.get('bundle.js');
    if (!originalBundle) throw new Error('bundle.js not found in package');
    const tamperedBundle = new Uint8Array(originalBundle.length);
    tamperedBundle.set(originalBundle);
    const firstByte = tamperedBundle[0] as number;
    tamperedBundle[0] = firstByte ^ 0xff;
    pkg.files.set('bundle.js', tamperedBundle);

    const integrity = checkIntegrity(pkg);
    expect(integrity.valid).toBe(false);
    expect(integrity.error).toBeTruthy();
  });

  it('签名包应使用包内公钥验证，并拒绝不匹配的信任公钥', async () => {
    const { privateKey, publicKey } = await generateKeyPair();
    const outputAegis = join(testDir, 'signed-app.aegis');
    await pack({
      inputDir: join(process.cwd(), 'apps/playground'),
      output: outputAegis,
      privateKey,
    });

    const pkg = await unpack(outputAegis);
    expect(pkg.spec.signature.publicKey).toBe(publicKey);
    expect((await validatePackage(pkg)).valid).toBe(true);

    const otherKeyPair = await generateKeyPair();
    const validation = await validatePackage(pkg, { publicKey: otherKeyPair.publicKey });
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('Signature verification failed');
  });

  it('解包时拒绝逃逸输出目录的文件路径', async () => {
    const outputAegis = join(testDir, 'path-check.aegis');
    await pack({
      inputDir: join(process.cwd(), 'apps/playground'),
      output: outputAegis,
    });
    const pkg = await unpack(outputAegis, { verifySignature: false });
    pkg.files.set('../outside.txt', new TextEncoder().encode('unsafe'));

    await expect(extract(pkg, join(testDir, 'extracted'))).rejects.toThrow(
      'Package path escapes output directory',
    );
  });
});
