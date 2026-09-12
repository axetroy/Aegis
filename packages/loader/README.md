# @aegis/loader

模块加载器。在沙箱环境中解析模块路径、加载和执行应用代码，支持依赖解析和模块缓存。

## 导出

- **`ModuleLoader`** — 模块加载器接口
- **`PackageCode`** — 包代码类型
- **`LoadedModule`** — 已加载模块类型
- **`ModuleResolution`** — 模块解析结果类型

## 依赖

`@aegis/protocol`

## 用法

```ts
import type { PackageCode, LoadedModule } from '@aegis/loader';

const pkg: PackageCode = {
  manifest: { name: 'App', version: '1.0.0', permissions: [] },
  files: { 'index.js': 'export default 42;' },
  entry: 'index.js',
};
// ModuleLoader 在 Container 内部使用
```
