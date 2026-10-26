/**
 * @aegis/adapter
 *
 * Aegis 适配器：从不同来源加载应用代码
 */

export { LocalPackageAdapter } from './local-package.js';
export { RemoteURLAdapter } from './remote-url.js';
export { FileSystemAdapter } from './filesystem.js';
export { extractAegisPackage } from './extract-aegis-package.js';
export type { AegisPackageExtractResult } from './extract-aegis-package.js';
export type {
  AppSourceType,
  LoadConfig,
  PackageCode,
  AegisAdapter,
  AdapterFactory,
} from './types.js';
