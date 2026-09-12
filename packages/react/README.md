# @aegis/react

基于 `react-reconciler` 的 Aegis React 集成。将 React 组件树的 UI 操作转译为 `@aegis/protocol` 消息，支持完整 Hooks。

## 导出

- **`createAegisHost()`** — 创建 Worker 内的 React Host
- **`AegisProvider`** — React Context Provider
- **`useEffect`、`useRef`、`useState`** — Aegis 沙箱化 Hooks

## 依赖

`@aegis/protocol`

## 用法

```tsx
import { AegisProvider } from '@aegis/react';

function App() {
  return (
    <AegisProvider>
      <Counter />
    </AegisProvider>
  );
}
```
