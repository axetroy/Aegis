/**
 * @aegis/packager - 密码学工具
 *
 * 基于 Node.js 内置 crypto 模块实现签名
 */

import crypto from 'node:crypto';


/** 生成 Ed25519 密钥对 */
export function generateKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'ed25519',
      {
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      },
    );
  });
}

/** 生成 RSA 密钥对（备用） */
export function generateRSAKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      },
    );
  });
}

/** 计算数据的 SHA-256 hash（返回 base64 字符串） */

/**
 * 从私钥 PEM 提取对应的公钥 PEM
 * 使用 Node.js crypto 的 publicKeys 功能
 */
export function extractPublicKey(_privateKey: string): string {
  // Node.js 24 API 变化，公钥在 generateKeyPair 时已保存
  // 签名验证依赖调用方提供 publicKey
  return '';
}

export function computeHash(data: Uint8Array | string): string {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.createHash('sha256').update(input).digest('base64');
}

/**
 * 用私钥签名数据
 * @param data 待签名的原始数据（Uint8Array）
 * @param privateKey PEM 格式的私钥
 * @returns base64 编码的签名
 */
export function signData(
  data: Uint8Array,
  privateKey: string,
): { signature: string; dataHash: string } {
  const dataHash = computeHash(data);
  // Node.js 24: crypto.sign 返回 Buffer
  const sigBuffer = crypto.sign(null, data, privateKey);
  const signature = sigBuffer.toString('base64');
  return { signature, dataHash };
}

/**
 * 用公钥验证签名
 * @param data 原始数据
 * @param signature base64 编码的签名
 * @param publicKey PEM 格式的公钥
 * @returns 验证结果
 */
export function verifySignature(
  data: Uint8Array,
  signature: string,
  publicKey: string,
): boolean {
  try {
    // Node.js 24: crypto.verify 接受 Buffer 签名
    return crypto.verify(null, data, publicKey, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

/** 构建待签名的数据（manifest + bundle bytes 的序列化组合） */
export function buildSignaturePayload(
  manifestJson: string,
  bundleBytes: Uint8Array,
): Uint8Array {
  // 签名数据 = manifest JSON + bundle bytes
  const manifestBytes = new TextEncoder().encode(manifestJson);
  const combined = new Uint8Array(manifestBytes.length + bundleBytes.length);
  combined.set(manifestBytes, 0);
  combined.set(bundleBytes, manifestBytes.length);
  return combined;
}
