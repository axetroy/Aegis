#!/usr/bin/env node
/**
 * Aegis CLI - 应用打包工具
 *
 * 用法: aegis build <input-dir> [output]
 */

import { resolve } from 'node:path';
import { pack } from '@aegis/packager';

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  // eslint-disable-next-line no-console
  console.log(`
Aegis CLI - 应用包构建工具

用法:
  aegis build <input-dir> [output]   打包应用为 .aegis 格式
  aegis sign <input.aegis> <key.pem>  为已有包签名
  aegis verify <input.aegis>         验证包完整性与签名

选项:
  --help, -h    显示此帮助
`);
  process.exit(0);
}

if (command === 'build' && args[1]) {
  const inputDir = resolve(args[1]);
  const output = args[2] ? resolve(args[2]) : `${inputDir}.aegis`;

  try {
    const result = await pack({
      inputDir,
      output,
    });
    // eslint-disable-next-line no-console
  console.log(`✓ 打包成功`);
    // eslint-disable-next-line no-console
  console.log(`  输出: ${result.outputPath}`);
    // eslint-disable-next-line no-console
  console.log(`  包 Hash: ${result.packageHash}`);
    // eslint-disable-next-line no-console
  console.log(`  大小: ${(result.size / 1024).toFixed(1)} KB`);
    if (result.spec.manifest.id) {
      // eslint-disable-next-line no-console
  console.log(`  应用 ID: ${result.spec.manifest.id}`);
    }
  } catch (err) {
  console.error(`✗ 打包失败: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
} else {
  console.error('未知命令。使用 "aegis --help" 查看帮助。');
  process.exit(1);
}
