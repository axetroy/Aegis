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
    const pkg = await unpack(outputAegis);
    expect(pkg.spec.manifest.id).toBeDefined();
    expect(pkg.files.has('bundle.js')).toBe(true);
    expect(pkg.files.has('.timestamp')).toBe(true);

    // 3. 完整性校验
    const integrity = checkIntegrity(pkg);
    expect(integrity.valid).toBe(true);
    expect(integrity.hash).toBeDefined();

    // 4. 完整验证
    const validation = await validatePackage(pkg);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('被篡改的包应通过完整性校验失败', async () => {
    const inputDir = join(process.cwd(), 'apps/playground');
    const tamperedOutput = join(testDir, 'tampered.aegis');

    await pack({ inputDir, output: tamperedOutput });

    // 篡改 bundle
    const pkg = await unpack(tamperedOutput);
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
});
