# 数据流、性能与工具

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./renderer-react-lifecycle.md) · [下一篇 →](./roadmap-vision.md)

包含数据流、交互流程、安全边界总结、与 React / 小程序架构的关系、性能原则、开发者工具与项目结构。

---

# 36. 数据流

完整的数据流：

```text
                    Application
                         │
                         ▼
                      React
                         │
                    State Update
                         │
                         ▼
                    Reconciler
                         │
                         ▼
                  Aegis Renderer
                         │
                         ▼
                    UI Protocol
                         │
                         ▼
                       Host
                         │
                         ▼
                     Real UI
```

反方向：

```text
Real UI
   │
 Event
   ↓
Host
   │
Event Protocol
   ↓
Worker
   │
React Handler
   ↓
State Update
```

形成闭环。

---

# 37. 完整交互流程

用户点击 Button：

```text
                USER
                 │
                 ▼
          Main Thread UI
                 │
              click
                 │
                 ▼
          Event Dispatcher
                 │
        nodeId + handlerId
                 │
                 ▼
             Protocol
                 │
═════════════════╪════════════════
                 │
                 ▼
              Worker
                 │
             handler()
                 │
                 ▼
            setState()
                 │
                 ▼
          React Reconciler
                 │
                 ▼
           UI Mutation
                 │
                 ▼
             Protocol
                 │
═════════════════╪════════════════
                 │
                 ▼
               Main
                 │
           Apply Mutation
                 │
                 ▼
               UI
```

---

# 38. 安全边界总结

Aegis 中存在三个主要边界：

### Boundary 1：Application → Worker

```text
Execution Isolation
```

### Boundary 2：Worker → Host

```text
Protocol + Capability
```

### Boundary 3：App → App

```text
Namespace Isolation
```

最终：

```text
App A
 │
 ├── Worker Isolation
 │
 ├── Capability Boundary
 │
 └── UI Namespace
```

---

# 39. Aegis 与 React 的关系

Aegis 不修改 React 的核心编程模型：

```jsx
function App() {
  const [value, setValue] = useState()

  return (
    <View>
      <Text>{value}</Text>
    </View>
  )
}
```

React 负责：

```text
Component
Hooks
State
Fiber
Reconciliation
```

Aegis 负责：

```text
Isolation
UI
Protocol
Capabilities
Permissions
Resources
```

两者职责明确分离。

---

# 40. 与传统小程序架构的区别

传统：

```text
App
 ↓
Framework
 ↓
Native Bridge
 ↓
Host
```

Aegis：

```text
                 Trusted Host
                      │
                Security Policy
                      │
══════════════════════╪══════════════════════
                      │
                   Worker
                      │
               React Application
                      │
               Aegis Runtime
                      │
                UI Protocol
                      │
══════════════════════╪══════════════════════
                      │
                  Renderer
                      │
                  Native UI
```

最大的区别：

> **第三方代码永远不会直接进入 Host API 层。**

---

# 41. 性能原则

性能不是 Aegis 的首要目标。

优先级：

```text
1. Security
2. Isolation
3. Correctness
4. Compatibility
5. Performance
```

因此第一版应该优先：

```text
postMessage
Structured Clone
```

而不是马上：

```text
SharedArrayBuffer
Atomics
Binary Protocol
```

---

# 42. 性能优化路线

当安全模型稳定后：

```text
Phase 1
postMessage
        ↓
Phase 2
Transferable
        ↓
Phase 3
ArrayBuffer
        ↓
Phase 4
Binary Protocol
        ↓
Phase 5
Shared Memory
```

所有优化都必须满足：

> **Performance optimization must never bypass security validation.**

---

# 43. 开发者工具

Aegis 开发者工具应该同时观察：

### Application

```text
Component Tree
State
Hooks
```

### Security

```text
Capabilities
Permission
Denied Requests
```

### Runtime

```text
Worker Status
Memory
CPU
```

### Protocol

```text
Messages
Mutation Count
Message Size
```

例如：

```text
App: com.example.todo

Worker
  CPU: 12%
  Memory: 18MB

Capabilities
  storage ✓
  network ✓
  camera ✗

UI
  Nodes: 132
  Mutations: 8

Protocol
  Messages: 14
  Bytes: 4.2KB
```

---

# 44. 项目结构

推荐：

```text
aegis/
│
├── packages/
│
│   ├── runtime/
│   │   ├── worker/
│   │   ├── scheduler/
│   │   └── lifecycle/
│   │
│   ├── react/
│   │   ├── reconciler/
│   │   └── host-config/
│   │
│   ├── protocol/
│   │   ├── ui/
│   │   ├── event/
│   │   └── capability/
│   │
│   ├── security/
│   │   ├── policy/
│   │   ├── permission/
│   │   └── validation/
│   │
│   ├── capabilities/
│   │   ├── network/
│   │   ├── storage/
│   │   ├── camera/
│   │   └── location/
│   │
│   ├── renderer/
│   │   ├── dom/
│   │   ├── miniapp/
│   │   └── native/
│   │
│   ├── ui/
│   │   ├── View/
│   │   ├── Text/
│   │   ├── Button/
│   │   └── Input/
│   │
│   └── devtools/
│
├── apps/
│   ├── host/
│   ├── playground/
│   └── inspector/
│
└── docs/
```

---

---

[↑ 返回 Aegis 设计索引](../SKILL.md) · [← 上一篇](./renderer-react-lifecycle.md) · [下一篇 →](./roadmap-vision.md)
