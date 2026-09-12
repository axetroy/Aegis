# @aegis/runtime

Worker 运行时基础。在 Worker 线程中初始化 `__aegis_protocol` 全局对象，建立与 Host 的消息通道，驱动 React Reconciler。

## 导出

- **`WorkerRuntime`** — 运行时核心类，负责消息收发、React 树挂载
- **`createRuntime()`** — 工厂函数

## 依赖

`@aegis/protocol`、`@aegis/react`

## 用法

```ts
import { createRuntime } from '@aegis/runtime';

const runtime = createRuntime({ appId: 'my-app', entryCode: '...' });
runtime.mount();
```
