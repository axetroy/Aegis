# Runtime Architecture and Protocol

[↑ Back to Aegis Design Index](../SKILL.md) · [← Previous](./foundation-security-model.md) · [Next →](./capabilities-package-security.md)

包含总体架构、React 兼容层级、JSX、UI Protocol、协议校验、Node Namespace 与 Event Protocol。

---

# 8. Aegis 总体架构

```text
                         AEGIS HOST
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────┐      ┌────────────────┐                   │
│  │ App Manager  │      │ Permission     │                   │
│  │              │      │ Manager        │                   │
│  └──────┬───────┘      └───────┬────────┘                   │
│         │                       │                            │
│         └───────────┬───────────┘                            │
│                     │                                        │
│              ┌──────▼───────┐                                │
│              │ Policy Engine│                                │
│              └──────┬───────┘                                │
│                     │                                        │
│              ┌──────▼───────┐                                │
│              │ Main Renderer│                                │
│              └──────┬───────┘                                │
│                     │                                        │
└─────────────────────┼────────────────────────────────────────┘
                      │
                SECURITY BOUNDARY
                      │
══════════════════════╪════════════════════════════════════════
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    AEGIS WORKER                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Application                           │  │
│  │                                                        │  │
│  │ React / JSX / Components / State / Libraries           │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│                  ┌────────▼────────┐                         │
│                  │ Aegis Runtime   │                         │
│                  └────────┬────────┘                         │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ React Reconciler    │                       │
│                └──────────┬──────────┘                       │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ Aegis Renderer      │                       │
│                └──────────┬──────────┘                       │
│                           │                                  │
│                ┌──────────▼──────────┐                       │
│                │ Protocol Layer      │                       │
│                └─────────────────────┘                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# 9. React Compatibility

Aegis 不重新实现 React。

目标架构：

```text
React
 │
 ├── Fiber
 ├── Hooks
 ├── Context
 ├── Scheduler
 └── Reconciler
          │
          ▼
   Aegis Host Config
          │
          ▼
   Aegis Renderer
```

Aegis 负责：

```text
Worker Runtime
Renderer
Protocol
Capabilities
Security
```

React 负责：

```text
Component
Hooks
State
Context
Fiber
Reconciliation
```

这使 Aegis 可以最大程度复用 React 生态。

---

# 10. React 生态兼容等级

### Level 1：直接兼容

目标：

```text
React
React Hooks
Context
Redux
Zustand
Jotai
TanStack Query
```

它们主要运行在 Worker 中。

---

### Level 2：Adapter 兼容

例如：

```text
React Router
React Hook Form
Animation libraries
```

提供：

```text
@aegis/adapter-*
```

---

### Level 3：Aegis Native UI

对于强依赖 DOM 的 UI 库：

```text
Ant Design
MUI
Chakra
```

不追求直接兼容。

而是提供：

```text
@aegis/ui
```

例如：

```jsx
import {
  View,
  Text,
  Button,
  Input
} from "@aegis/ui"
```

---

# 11. JSX

JSX 是 Aegis 的推荐 UI 描述语言。

例如：

```jsx
function App() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Text>
        Count: {count}
      </Text>

      <Button
        onClick={() => setCount(c => c + 1)}
      >
        +
      </Button>
    </View>
  )
}
```

JSX 完全运行在 Worker。

JSX 本身并不意味着：

```text
DOM
```

而是：

```text
JSX
 ↓
React Element
 ↓
React Fiber
 ↓
Aegis Renderer
```

---

# 12. UI Protocol

UI Protocol 是 Aegis 的核心安全边界之一。

Worker 不允许直接调用：

```js
document.createElement()
```

而是产生：

```text
CREATE_NODE
SET_PROPERTY
SET_TEXT
APPEND_CHILD
REMOVE_CHILD
```

例如：

```json
{
  "version": 1,
  "type": "commit",
  "mutations": [
    {
      "op": "create",
      "nodeId": 1,
      "kind": "view"
    },
    {
      "op": "create",
      "nodeId": 2,
      "kind": "text"
    },
    {
      "op": "setText",
      "nodeId": 2,
      "value": "Hello"
    },
    {
      "op": "append",
      "parent": 1,
      "child": 2
    }
  ]
}
```

---

# 13. Protocol Validation

Main Thread **永远不信任 Worker 消息**。

每一条 Mutation 必须经过：

```text
Decode
 ↓
Schema Validation
 ↓
App Ownership Validation
 ↓
Node Validation
 ↓
Property Validation
 ↓
Resource Validation
 ↓
Apply
```

例如：

```text
SET_PROPERTY
```

Host 检查：

```text
node 是否存在？
node 是否属于当前 App？
property 是否允许？
value 类型是否正确？
value 大小是否超限？
```

---

# 14. Node Namespace

所有 UI Node 都属于某个 Application。

逻辑上：

```text
App A
 ├── Node 1
 ├── Node 2
 └── Node 3

App B
 ├── Node 1
 ├── Node 2
 └── Node 3
```

内部使用：

```text
A:1
A:2
A:3

B:1
B:2
B:3
```

因此：

> **UI Node 永远不能跨 Application 使用。**

---

# 15. Event Protocol

事件方向：

```text
Main
 ↓
DOM / Native Event
 ↓
Event Dispatcher
 ↓
Worker
```

Worker 不直接获得真实 Event Object。

例如：

```json
{
  "type": "event",
  "nodeId": 20,
  "event": "click",
  "handlerId": 100
}
```

事件 Payload：

```ts
interface AegisEvent {
  type: string
  target: NodeId
  currentTarget: NodeId

  value?: string
  checked?: boolean

  clientX?: number
  clientY?: number

  key?: string
}
```

---

---

[↑ Back to Aegis Design Index](../SKILL.md) · [← Previous](./foundation-security-model.md) · [Next →](./capabilities-package-security.md)
