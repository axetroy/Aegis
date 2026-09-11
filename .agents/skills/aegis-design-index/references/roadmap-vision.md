# Roadmap and Vision

[↑ Back to Aegis Design Index](../SKILL.md) · [← Previous](./dataflow-performance-tooling.md) · [Next →](./local-development.md)

包含 MVP 到第四阶段的路线图、最终产品模型、核心设计原则、核心抽象与最终愿景。

---

# 45. MVP

第一阶段绝对不要做完整小程序平台。

只验证：

```text
React
 ↓
Worker
 ↓
Aegis Renderer
 ↓
UI Protocol
 ↓
Main
 ↓
DOM
```

只需要：

```jsx
function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>{count}</Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        +
      </Button>
    </View>
  )
}
```

验证：

```text
✓ JSX
✓ React
✓ Worker
✓ useState
✓ UI Protocol
✓ Main Renderer
✓ Event Protocol
✓ Node Isolation
```

---

# 46. 第二阶段

增加：

```text
useEffect
useRef
Context
Input
Form
Storage
Network
```

并验证：

```text
✓ Capability
✓ Permission
✓ Resource Limits
```

---

# 47. 第三阶段

增加：

```text
Package
Manifest
App Identity
Signature
Module Loader
```

形成真正的：

```text
.aegis Application
```

---

# 48. 第四阶段

增加：

```text
Multi-App
App Lifecycle
App Store
Capability UI
DevTools
Crash Recovery
```

最终形成：

```text
Aegis Host
│
├── App A
├── App B
├── App C
└── App D
```

---

# 49. 最终产品模型

Aegis 最终不是一个单纯的 Framework，而是三个层次：

```text
                    Aegis Platform
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Aegis Runtime   Aegis Host       Aegis SDK
        │                │                │
        │                │                │
      React          Security          JSX
      Worker         Capability        UI
      Runtime        Renderer          APIs
```

其中：

### Aegis Runtime

运行第三方应用。

### Aegis Host

提供可信环境。

### Aegis SDK

让开发者开发应用。

---

# 50. 核心设计原则

Aegis 最终应该遵循以下原则：

```text
01. Application code is untrusted.

02. Worker provides execution isolation.

03. Worker is not the sole security boundary.

04. Application never receives real DOM or Native objects.

05. All Host interaction happens through explicit protocols.

06. Capabilities are explicit and deny-by-default.

07. Every Application has isolated UI and storage namespaces.

08. Host validates every message from Worker.

09. Resource usage is bounded.

10. Capability lifetime follows Application lifetime.

11. React is an application runtime, not a security boundary.

12. UI libraries cannot bypass the Capability system.

13. Trusted Host code must remain minimal.

14. Performance optimizations must never weaken isolation.

15. Security semantics take priority over React compatibility.
```

---

# 51. Aegis 的核心抽象

整个系统最终可以浓缩成五个核心对象：

```text
┌─────────────────────────────────┐
│            Application          │
│       Untrusted Program         │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│             Worker              │
│       Execution Isolation       │
└────────────────┬────────────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
┌────────────────┐ ┌────────────────┐
│  UI Protocol   │ │   Capability   │
│                │ │    Protocol    │
└───────┬────────┘ └───────┬────────┘
        │                  │
        └────────┬─────────┘
                 ▼
┌─────────────────────────────────┐
│          Trusted Host           │
│                                 │
│ Renderer / Native / Resources  │
└─────────────────────────────────┘
```

---

# 52. 最终愿景

Aegis 最终希望做到：

开发者只需要写：

```jsx
import {
  View,
  Text,
  Button
} from "@aegis/ui"

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>Hello Aegis</Text>

      <Text>
        {count}
      </Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        Increment
      </Button>
    </View>
  )
}
```

但是运行时实际上是：

```text
                 Untrusted
                    │
                    ▼
              ┌───────────┐
              │   React   │
              └─────┬─────┘
                    │
              Worker Runtime
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
    UI Protocol        Capability API
          │                   │
          └─────────┬─────────┘
                    │
              Security Boundary
                    │
                    ▼
             Trusted Host
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
   UI Renderer            Native APIs
```

开发者获得的是：

> **React + JSX 的开发体验。**

宿主获得的是：

> **隔离、权限、资源控制和可验证的安全边界。**

而 Aegis 的核心价值可以用一句话概括：

# **Aegis — Let untrusted code build UI, without letting it own the host.**

中文：

# **Aegis —— 让不受信任的代码构建 UI，但永远不能拥有宿主。**

---

[↑ Back to Aegis Design Index](../SKILL.md) · [← Previous](./dataflow-performance-tooling.md) · [Next →](./local-development.md)
