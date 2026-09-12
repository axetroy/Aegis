# @aegis/adapter

应用包加载适配器。支持从预置文件 Map、`.aegis` 包文件或开发服务器加载应用代码和资源，全部在浏览器端运行。

## 导出

- **`FileSystemAdapter`** — 虚拟文件系统适配器（支持预置文件和 dev server URL）
- **`loadAegisPackage()`** — 解析 `.aegis` 包文件并加载模块
- **`checkPackageIntegrity()`** — 包完整性校验

## 依赖

`@aegis/protocol`

## 用法

```ts
import { FileSystemAdapter } from '@aegis/adapter';

// 模式 1: 预置文件
const adapter = new FileSystemAdapter();
adapter.setFiles({ 'index.js': 'export default App;', 'lib/utils.js': '...' });

// 模式 2: Dev Server
const adapter = new FileSystemAdapter({ baseUrl: 'http://localhost:5173' });
const files = await adapter.resolveFiles('src/');
```
