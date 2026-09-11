/**
 * @aegis/packager - 单元测试
 */

import { describe, it, expect } from 'vitest';

import {
  computeHash,
  generateKeyPair,
  signData,
  verifySignature,
  validateManifest,
} from './index.js';


describe('@aegis/packager/crypto', () => {
  it('computeHash 应返回一致的 SHA-256', () => {
    const data = new TextEncoder().encode('test');
    const hash1 = computeHash(data);
    const hash2 = computeHash(data);
    expect(hash1.length).toBe(44);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(44); // base64 of 32 bytes
  });

  it('computeHash 应支持 string 输入', () => {
    const hash = computeHash('hello');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(44);
  });

  it('生成密钥对后应能签名和验证', async () => {
    const { privateKey, publicKey } = await generateKeyPair();
    const data = new TextEncoder().encode('sign me');
    const { signature, dataHash } = signData(data, privateKey);
    expect(signature.length).toBeGreaterThan(0);
    expect(dataHash.length).toBe(44);
    expect(verifySignature(data, signature, publicKey)).toBe(true);
  });
});

describe('@aegis/packager/manifest', () => {
  it('validateManifest 应接受有效 manifest', () => {
    const errors = validateManifest({
      name: 'my-app',
      version: '1.0.0',
      permissions: [],
    });
    expect(errors).toEqual([]);
  });

  it('validateManifest 应拒绝空 name', () => {
    const errors = validateManifest({
      name: '',
      version: '1.0.0',
      permissions: [],
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('validateManifest 应拒绝无效 semver', () => {
    const errors = validateManifest({
      name: 'my-app',
      version: 'abc',
      permissions: [],
    });
    expect(errors.some(e => e.includes('semver'))).toBe(true);
  });
});
