# @aegis/container

容器核心包。负责 Worker 沙箱创建、上下文注入（拦截 `postMessage`/`close`）、应用生命周期管理（Created → Initializing → Running → Destroyed）。

## 导出

- **`Container`** — 容器类，管理 Worker 生命周期和消息通信
- **`ContainerState`** — 容器状态枚举
- **`createSandbox()`** — Worker 全局对象沙箱化
- **`createContextInjector()`** — 上下文注入脚本生成

## 依赖

`@aegis/protocol`、`@aegis/security`、`@aegis/loader`、`@aegis/adapter`

## 用法

```ts
import { Container } from '@aegis/container';

const container = new Container({
  appId: 'my-app',
  manifest: { name: 'My App', version: '1.0.0', permissions: [] },
  entryCode: 'import("./src/index.js")',
});

await container.initialize();
container.postMessage({ type: 'ping' });
container.onMessage((msg) => console.log(msg));
await container.destroy();
```
