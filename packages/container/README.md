# @aegis/container

容器核心包。负责创建 Worker、注入 bootstrap 并通过转移的私有 `MessagePort` 桥接 Host 与 Worker。Host 不监听 Worker 全局 `message` 事件，因此应用直接调用 Worker `postMessage` 不会进入 Host 协议处理器。

## 导出

- **`Container`** — 容器类，管理 Worker 生命周期和消息通信
- **`ContainerState`** — 容器状态枚举
- **`createSandbox()`** — 仅用于显式本地上下文拦截的兼容辅助；Container 不在 Host 全局调用它
- **`createContextInjector()`** — Worker bootstrap 与私有通道生成

## 依赖

`@aegis/protocol`、`@aegis/security`、`@aegis/loader`、`@aegis/adapter`

## 用法

```ts
import { Container } from '@aegis/container';

const container = new Container({
  appId: 'my-app',
  manifest: { name: 'My App', version: '1.0.0', permissions: [] },
  entryCode: 'console.log("my app entry")',
});

await container.initialize();
container.postMessage({ type: 'ping' });
container.onMessage((msg) => console.log(msg));
await container.destroy();
```

React 应用由宿主指定可信 SDK 模块 URL；应用入口以 ESM 加载，并将 React、UI 与 JSX runtime 导入重写到宿主公开 SDK bundle。SDK bootstrap 在应用模块执行前初始化模块私有协议通道。
