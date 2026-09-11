/**
 * @aegis/packager - Manifest 验证器
 */

import {
  type AppManifest,
  type IntegrityCheckResult,
} from '@aegis/protocol';
import { checkIntegrity } from './unpack.js';

// 语义化版本正则
const SEMVER_RE = /^\d+\.\d+\.\d+([-+][\w.-]+)?$/;

/** 验证应用清单字段完整性 */
export function validateManifest(manifest: AppManifest): string[] {
  const errors: string[] = [];

  if (!manifest.name || manifest.name.trim() === '') {
    errors.push('manifest.name is required');
  } else if (!/^[a-z0-9_-]+$/.test(manifest.name)) {
    errors.push('manifest.name must contain only lowercase letters, digits, hyphens, and underscores');
  }

  if (!manifest.version) {
    errors.push('manifest.version is required');
  } else if (!SEMVER_RE.test(manifest.version)) {
    errors.push('manifest.version must be a valid semver string (e.g. 1.0.0)');
  }

  if (!Array.isArray(manifest.permissions)) {
    errors.push('manifest.permissions must be an array');
  }

  if (manifest.icons) {
    for (const icon of manifest.icons) {
      if (!icon.name || !icon.size || !icon.path) {
        errors.push('manifest.icons[*] requires name, size, and path');
      }
    }
  }

  return errors;
}

/**
 * 完整包验证（完整性 + 清单 + 签名）
 */
export async function validatePackage(
  pkg: import('./types.js').AegisPackage,
  options: { verifySignature?: boolean; publicKey?: string } = {},
): Promise<{ valid: boolean; errors: string[]; result: IntegrityCheckResult | null }> {
  const { verifySignature: verifySig = true, publicKey } = options;
  const errors: string[] = [];

  // 1. 完整性校验
  const integrity = checkIntegrity(pkg);
  if (!integrity.valid) {
    errors.push(`Integrity check failed: ${integrity.error}`);
  }

  // 2. 清单验证
  const manifestErrors = validateManifest(pkg.spec.manifest);
  if (manifestErrors.length > 0) {
    errors.push(...manifestErrors);
  }

  // 3. 签名验证
  if (verifySig && publicKey) {
    const { verifySignature: verifyFn } = await import('./crypto.js');
    const manifestBytes = new TextEncoder().encode(
      JSON.stringify(pkg.spec.manifest),
    );
    const bundleBytes = pkg.files.get('bundle.js') || new Uint8Array(0);
    const sigData = new Uint8Array(manifestBytes.length + bundleBytes.length);
    sigData.set(manifestBytes, 0);
    sigData.set(bundleBytes, manifestBytes.length);

    if (!pkg.spec.signature?.signature || !pkg.spec.signature.dataHash) {
      errors.push('Package has no signature');
    } else if (!verifyFn(sigData, pkg.spec.signature.signature, publicKey)) {
      errors.push('Signature verification failed');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    result: integrity,
  };
}
