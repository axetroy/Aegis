/**
 * @aegis/packager
 *
 * Aegis 应用包格式：打包、解析、验证
 */

export * from './types.js';
export { pack, readAppManifest, readEntryPoint } from './pack.js';
export { unpack, checkIntegrity, extract } from './unpack.js';
export { validateManifest, validatePackage } from './validate.js';
export {
  generateKeyPair,
  generateRSAKeyPair,
  computeHash,
  signData,
  verifySignature,
} from './crypto.js';
