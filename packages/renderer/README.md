# @aegis/renderer

主线程 DOM 渲染器。接收 Worker 通过 UI 协议发送的节点操作指令，将其映射为真实的 DOM 操作。

## 导出

- **`DOMRenderer`** — 渲染器核心类，管理虚拟节点到真实 DOM 的映射
- **`createRenderer()`** — 工厂函数

## 依赖

`@aegis/protocol`

## 用法

```ts
import { createRenderer } from '@aegis/renderer';

const renderer = createRenderer({ container: document.getElementById('app')! });
// 通过消息管道连接后自动渲染
```
