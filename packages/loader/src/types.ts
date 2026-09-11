/**
 * @aegis/loader - 模块加载器类型
 */


// 加载器配置
export interface LoaderConfig {
  /** 搜索路径列表（用于解析依赖） */
  searchPaths: string[];
  /** 沙箱执行上下文（是否在 WebWorker 中运行） */
  sandboxMode?: 'iframe' | 'worker' | 'vm';
  /** 模块缓存最大数量（默认 64） */
  maxCacheSize?: number;
}

// 已加载的模块
export interface LoadedModule {
  /** 模块 ID */
  id: string;
  /** 模块 exports */
  exports: Record<string, unknown>;
  /** 加载时间戳 */
  loadedAt: number;
  /** 包源信息 */
  source?: { packageId: string; entryPoint: string };
}

// 模块解析结果
export interface ModuleResolution {
  /** 解析到的模块 */
  module: LoadedModule | null;
  /** 未解析的依赖列表 */
  unresolved: string[];
}
