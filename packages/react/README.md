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

## 全局样式

`GlobalStyleSheet` 在当前应用的 Shadow Root 内注册 CSS；样式不会影响宿主或其他应用。组件卸载或 `id` 变化时会清理旧样式表。

```tsx
import { useEffect } from 'react';
import { GlobalStyleSheet, setThemeVariables } from '@aegis/react';

function App() {
  useEffect(() => {
    setThemeVariables({ '
    --brand-color': '#157f6b' });
  }, []);

  return (
    <>
      <GlobalStyleSheet id="app-base">{`
        .button { background: var(--brand-color); }
        .button:hover { opacity: 0.85; }
        @media (max-width: 600px) { .panel { padding: 12px; } }
      `}</GlobalStyleSheet>
      <Panel />
    </>
  );
}
```

支持选择器、伪类、媒体查询和 keyframes。出于隔离与资源安全，`@import`、`@font-face`、`:host`、`::slotted`、`url()`、`image-set()` 和 `paint()` 会被拒绝；单张样式表上限为 64 KiB，每个应用最多 32 张。
