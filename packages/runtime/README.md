# @aegis/runtime

Worker 运行时基础。Host 将私有 `MessagePort` 转移给 Worker bootstrap；宿主提供的 ESM SDK 在独立模块作用域中持有协议客户端并驱动 React Reconciler，应用代码不通过 Worker 全局对象访问协议通道。

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
