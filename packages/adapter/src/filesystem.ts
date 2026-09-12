/**
 * @aegis/adapter - 虚拟文件系统适配器（纯 Web 端）
 *
 * 使用内存 Map 模拟文件系统，通过 dev server URL 或预置文件加载应用代码。
 * 不依赖 Node.js fs 模块。
 */

import { AppSourceType, type AegisAdapter, type LoadConfig, type PackageCode } from './types.js';

/**
 * 虚拟文件系统适配器
 *
 * 支持两种模式:
 * 1. **Dev Server 模式**: source 为 dev server URL（如 `http://localhost:5173`），通过 fetch 获取文件。
 * 2. **预置文件模式**: 通过 constructor 传入预构建的文件 Map。
 */
export class FileSystemAdapter implements AegisAdapter {
  readonly name = 'filesystem';

  private files: Map<string, string> | null = null;
  private baseUrl: string | null = null;

  constructor(options?: { files?: Map<string, string>; baseUrl?: string }) {
    this.files = options?.files ?? null;
    this.baseUrl = options?.baseUrl ?? null;
  }

  async load(config: LoadConfig): Promise<PackageCode> {
    const { source } = config;

    try {
      const files = await this.resolveFiles(source);

      // 解析 manifest.json
      const manifestRaw = files.get('manifest.json');
      if (!manifestRaw) {
        throw new Error(`Missing manifest.json in source: ${source}`);
      }
      const manifest = JSON.parse(manifestRaw);

      // 解析入口文件
      const entryPoint = manifest.id || 'index.js';
      const entryCode = files.get(entryPoint);
      if (!entryCode) {
        throw new Error(`Missing entry file: ${entryPoint}`);
      }

      // 收集 lib/ 下的依赖模块
      const modules = new Map<string, string>();
      for (const [path, content] of files) {
        if (path.startsWith('lib/') && (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx'))) {
          modules.set(path.replace('lib/', ''), content);
        }
      }

      return {
        entryCode,
        manifest,
        modules: modules.size > 0 ? modules : undefined,
        signature: undefined,
      };
    } catch (error) {
      throw new Error(`Failed to load from virtual filesystem: ${error}`);
    }
  }

  supports(sourceType: AppSourceType): boolean {
    return sourceType === AppSourceType.FileSystem;
  }

  async unload(): Promise<void> {
    this.files = null;
  }

  /**
   * 预置文件（用于测试或手动加载）
   */
  setFiles(files: Map<string, string>): void {
    this.files = files;
  }

  // ============ 私有方法 ============

  private async resolveFiles(source: string): Promise<Map<string, string>> {
    // 如果已有预置文件，优先使用
    if (this.files && this.files.size > 0) {
      return this.files;
    }

    // Dev Server 模式: 通过 fetch 获取文件
    const baseUrl = this.baseUrl || source;
    if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
      return this.fetchFromServer(baseUrl);
    }

    throw new Error(`Cannot resolve files: no pre-set files and source is not a URL: ${source}`);
  }

  private async fetchFromServer(baseUrl: string): Promise<Map<string, string>> {
    const files = new Map<string, string>();

    // 获取 manifest.json
    const manifestResp = await fetch(`${baseUrl}/manifest.json`);
    if (!manifestResp.ok) {
      throw new Error(`Failed to fetch manifest.json: ${manifestResp.status}`);
    }
    files.set('manifest.json', await manifestResp.text());

    // 解析入口文件名
    const manifest = JSON.parse(files.get('manifest.json')!);
    const entryPoint = manifest.id || 'index.js';

    // 获取入口文件
    const entryResp = await fetch(`${baseUrl}/${entryPoint}`);
    if (!entryResp.ok) {
      throw new Error(`Failed to fetch entry file: ${entryPoint}`);
    }
    files.set(entryPoint, await entryResp.text());

    // 尝试获取 lib/ 目录下的依赖（忽略 404）
    if (manifest.dependencies) {
      for (const dep of manifest.dependencies) {
        const depUrl = `${baseUrl}/lib/${dep}`;
        try {
          const depResp = await fetch(depUrl);
          if (depResp.ok) {
            files.set(`lib/${dep}`, await depResp.text());
          }
        } catch {
          // 单个依赖获取失败，继续
        }
      }
    }

    return files;
  }
}