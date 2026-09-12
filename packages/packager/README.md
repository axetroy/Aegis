# @aegis/packager

`.aegis` 应用包打包工具。将应用源码、Manifest、依赖打包为标准 `.aegis` 格式文件，支持签名和完整性校验。

## 导出

- **`packAegisPackage()`** — 打包为 `.aegis` 格式
- **`unpackAegisPackage()`** — 解析 `.aegis` 包文件

## 依赖

`@aegis/protocol`

## 用法

```ts
import { packAegisPackage } from '@aegis/packager';

const pkg = await packAegisPackage({
  manifest: { name: 'My App', version: '1.0.0', permissions: ['storage'] },
  files: { 'index.js': '...', 'lib/util.js': '...' },
});
```
