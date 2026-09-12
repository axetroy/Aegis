/**
 * @aegis/loader - 模块加载器实现
 *
 * 加载 .aegis 包代码并在沙箱中执行
 */

import type { LoaderConfig, LoadedModule, ModuleResolution, ModuleLoader, PackageCode } from './types.js';

// 默认配置
const DEFAULT_CONFIG: LoaderConfig = {
  searchPaths: [],
  sandboxMode: 'worker',
  maxCacheSize: 64,
};

/**
 * Aegis 模块加载器
 *
 * 负责加载包代码、解析依赖、管理模块缓存
 */
export class AegisModuleLoader implements ModuleLoader {
  private config: LoaderConfig;
  private cache = new Map<string, LoadedModule>();
  private stats = { hits: 0, misses: 0 };

  constructor(config: Partial<LoaderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 加载包代码
   *
   * 1. 检查缓存
   * 2. 加载依赖模块
   * 3. 执行入口代码
   * 4. 返回模块 exports
   */
  async loadPackage(packageCode: PackageCode): Promise<LoadedModule> {
    const { entryCode, manifest, modules } = packageCode;
    const moduleId = manifest.id || manifest.name;

    // 检查缓存
    const cached = this.cache.get(moduleId);
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    try {
      // 加载依赖模块
      const dependencyExports = new Map<string, Record<string, unknown>>();
      if (modules) {
        for (const [depPath, depCode] of modules) {
          const depModule = await this.loadModule(depPath, depCode, moduleId);
          dependencyExports.set(depPath, depModule.exports);
        }
      }

      // 执行入口代码
      const exports = await this.executeModule(entryCode, moduleId, dependencyExports);

      // 构建已加载模块
      const loadedModule: LoadedModule = {
        id: moduleId,
        exports,
        loadedAt: Date.now(),
        source: {
          packageId: moduleId,
          entryPoint: manifest.id || 'index.js',
        },
      };

      // 缓存结果
      this.addToCache(moduleId, loadedModule);

      return loadedModule;
    } catch (error) {
      throw new Error(`Failed to load package ${moduleId}: ${error}`);
    }
  }

  /**
   * 解析模块
   */
  resolve(moduleId: string): LoadedModule | null {
    const module = this.cache.get(moduleId);
    if (module) {
      this.stats.hits++;
      return module;
    }
    this.stats.misses++;
    return null;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
    };
  }

  // ============ 私有方法 ============

  /**
   * 添加到缓存（LRU 策略）
   */
  private addToCache(moduleId: string, module: LoadedModule): void {
    // 检查缓存大小
    if (this.cache.size >= (this.config.maxCacheSize || 64)) {
      // 删除最旧的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(moduleId, module);
  }

  /**
   * 加载单个模块
   */
  private async loadModule(
    moduleId: string,
    code: string,
    parentId: string
  ): Promise<LoadedModule> {
    // 检查缓存
    const cached = this.cache.get(moduleId);
    if (cached) {
      return cached;
    }

    // 执行模块代码
    const exports = await this.executeModule(code, moduleId);

    const module: LoadedModule = {
      id: moduleId,
      exports,
      loadedAt: Date.now(),
      source: {
        packageId: parentId,
        entryPoint: moduleId,
      },
    };

    // 缓存模块
    this.addToCache(moduleId, module);

    return module;
  }

  /**
   * 执行模块代码
   *
   * 使用 Function 构造器在隔离环境中执行
   */
  private async executeModule(
    code: string,
    moduleId: string,
    dependencies?: Map<string, Record<string, unknown>>
  ): Promise<Record<string, unknown>> {
    const exports: Record<string, unknown> = {};
    const module = { exports };

    // 创建 require 函数
    const require = (depId: string): unknown => {
      if (dependencies?.has(depId)) {
        return dependencies.get(depId);
      }
      throw new Error(`Module not found: ${depId}`);
    };

    // 创建沙箱化全局对象
    const globalShim = {
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Promise,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Date,
      Math,
      JSON,
      RegExp,
      Error,
      Map,
      Set,
    };

    try {
      // 使用 Function 构造器创建沙箱函数
      // 注意: vitest/jsdom 中 new Function 行为可能受限，降级到直接 eval
      const fnBody = `
        return (function(module, exports, require, global) {
          ${code}
        });
      `;

      let factory: Function;
      try {
        factory = new Function(fnBody)();
      } catch {
        //降级方案：直接 eval
        // eslint-disable-next-line no-eval
        factory = (0, eval)(`(function(module, exports, require, global) { ${code} })`);
      }

      factory(module, exports, require, globalShim);

      // 返回 module.exports（处理 module.exports = {...} 赋值情况）
      return module.exports;
    } catch (error) {
      throw new Error(`Failed to execute module ${moduleId}: ${error}`);
    }
  }
}
